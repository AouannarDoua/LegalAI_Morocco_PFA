# app/services/tax_update_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Veille fiscale automatisée.
#   1. Récupère le texte d'une (ou plusieurs) source(s) web configurée(s).
#   2. Demande à l'IA (Groq) d'en extraire les barèmes de l'année, au format JSON.
#   3. Compare avec les barèmes actuels (tax_rates.json).
#   4. Si différence -> crée une alerte (notification + e-mail) EN ATTENTE de validation.
#   5. L'admin valide -> les barèmes sont écrits dans tax_rates.json (avec sauvegarde).
#
# RÈGLE DE SÉCURITÉ : rien n'est appliqué automatiquement. L'IA ne fait que
# *signaler*. Un humain valide toujours avant application. C'est indispensable
# en matière fiscale (une IA peut mal interpréter une page web).
# ─────────────────────────────────────────────────────────────────────────────
import os
import re
import json
import shutil
from datetime import datetime

from ..extensions import db, mail
from ..models.tax_update import TaxUpdate
from ..models.user import User
from ..models.notification import Notification
from .tax_service import tax_service

try:
    from groq import Groq
except Exception:
    Groq = None

try:
    import requests
except Exception:
    requests = None

try:
    from flask_mail import Message
except Exception:
    Message = None


class TaxUpdateService:
    def __init__(self):
        self.model_name = "llama-3.3-70b-versatile"

    # ─── Sources de vérification (depuis tax_rates.json) ─────────────────────
    def _get_sources(self):
        cfg = tax_service._load()
        verif = cfg.get("verification", {})
        return verif.get("sources", []), verif.get("enabled", True)

    # ─── Récupération + nettoyage du texte d'une page web ────────────────────
    def _fetch_text(self, url: str) -> str:
        if requests is None:
            raise RuntimeError("La librairie 'requests' n'est pas installée.")
        headers = {"User-Agent": "Mozilla/5.0 (LegalAI TaxBot)"}
        resp = requests.get(url, headers=headers, timeout=15)
        resp.raise_for_status()
        html = resp.text
        # Retire scripts/styles puis toutes les balises
        html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
        text = re.sub(r"<[^>]+>", " ", html)
        text = re.sub(r"\s+", " ", text)
        return text.strip()

    # ─── Extraction des barèmes par l'IA ─────────────────────────────────────
    def _ai_extract(self, year: int, source_text: str, current_block: dict) -> dict:
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key or Groq is None:
            raise RuntimeError("GROQ_API_KEY manquante ou librairie groq indisponible.")

        client = Groq(api_key=api_key)
        schema = json.dumps(current_block, ensure_ascii=False, indent=2)

        prompt = (
            f"Tu es un assistant fiscal. À partir du TEXTE ci-dessous (extrait d'une page web "
            f"sur la fiscalité marocaine {year}), remplis EXACTEMENT le même schéma JSON que le MODÈLE.\n"
            f"Règles strictes :\n"
            f"- Réponds UNIQUEMENT avec du JSON valide, sans texte avant/après, sans balises Markdown.\n"
            f"- Garde exactement les mêmes clés que le MODÈLE.\n"
            f"- Mets les taux que tu trouves dans le texte pour l'année {year}. "
            f"Si une valeur est absente du texte, reprends celle du MODÈLE.\n\n"
            f"MODÈLE (schéma à respecter) :\n{schema}\n\n"
            f"TEXTE SOURCE :\n{source_text[:6000]}"
        )

        resp = client.chat.completions.create(
            model=self.model_name,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
        )
        raw = resp.choices[0].message.content.strip()
        # Nettoyage d'éventuelles balises ```json
        raw = re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.I | re.M).strip()
        return json.loads(raw)

    # ─── Indicateurs comparables extraits d'un bloc de barème ────────────────
    @staticmethod
    def _indicators(block: dict) -> dict:
        is_ = block.get("is", {}) or {}
        ir = block.get("ir", {}) or {}
        cnss = block.get("cnss", {}) or {}
        tva = block.get("tva", {}) or {}
        is_tr = is_.get("tranches", []) or []
        ir_tr = ir.get("tranches", []) or []
        return {
            "IS — taux PME (1ère tranche)":     is_tr[0].get("taux") if is_tr else None,
            "IS — taux secteur financier":      is_.get("taux_secteur_financier"),
            "IS — cotisation minimale (DH)":    (is_.get("cotisation_minimale") or {}).get("minimum"),
            "IR — taux marginal (%)":           ir_tr[-1].get("taux") if ir_tr else None,
            "IR — nombre de tranches":          len(ir_tr),
            "CNSS — part salariale CNSS (%)":   (cnss.get("salarie") or {}).get("cnss_plafonne"),
            "CNSS — part salariale AMO (%)":    (cnss.get("salarie") or {}).get("amo_non_plafonne"),
            "CNSS — part patronale CNSS (%)":   (cnss.get("patronal") or {}).get("cnss_plafonne"),
            "CNSS — plafond mensuel (DH)":      cnss.get("plafond_mensuel"),
            "TVA — taux normal (%)":            tva.get("taux_normal"),
        }

    def _diff(self, current: dict, proposed: dict) -> list:
        ci, pi = self._indicators(current), self._indicators(proposed)
        diffs = []
        for key, pval in pi.items():
            cval = ci.get(key)
            if pval is not None and pval != cval:
                diffs.append({"indicateur": key, "actuel": cval, "detecte": pval})
        return diffs

    # ─── Validation minimale d'un bloc proposé ───────────────────────────────
    @staticmethod
    def _is_valid_block(block: dict) -> bool:
        try:
            return (
                isinstance(block, dict)
                and block.get("is", {}).get("tranches")
                and block.get("ir", {}).get("tranches")
                and block.get("cnss", {}).get("salarie")
                and block.get("tva", {}).get("taux_normal") is not None
            )
        except Exception:
            return False

    # ─── Alertes : notification in-app + e-mail aux admins ───────────────────
    def _alert_admins(self, update: TaxUpdate):
        admins = User.query.filter_by(role="admin").all()
        n_diff = len(update.to_dict().get("differences") or [])
        title = "⚠️ Mise à jour fiscale à valider"
        msg = (f"Un changement possible des barèmes {update.year} a été détecté "
               f"({n_diff} indicateur(s)). Veuillez vérifier et valider dans l'espace d'administration.")

        # Notifications in-app
        for a in admins:
            try:
                db.session.add(Notification(user_id=a.id, title=title, message=msg, notif_type="warning"))
            except Exception as e:
                print(f"[tax_update] notif error: {e}")
        db.session.commit()

        # E-mail
        if Message is not None:
            recipients = [a.email for a in admins if a.email]
            if not recipients:
                sender = os.environ.get("MAIL_DEFAULT_SENDER", "")
                if sender:
                    recipients = [sender]
            if recipients:
                rows = "".join(
                    f"<tr><td style='padding:6px;border:1px solid #eee'>{d['indicateur']}</td>"
                    f"<td style='padding:6px;border:1px solid #eee'>{d['actuel']}</td>"
                    f"<td style='padding:6px;border:1px solid #eee'><b>{d['detecte']}</b></td></tr>"
                    for d in (update.to_dict().get("differences") or [])
                )
                html = (
                    f"<h2>⚠️ Veille fiscale — LegalAI Maroc</h2>"
                    f"<p>{msg}</p>"
                    f"<table style='border-collapse:collapse'>"
                    f"<tr><th style='padding:6px;border:1px solid #eee'>Indicateur</th>"
                    f"<th style='padding:6px;border:1px solid #eee'>Actuel</th>"
                    f"<th style='padding:6px;border:1px solid #eee'>Détecté</th></tr>{rows}</table>"
                    f"<p>Source : {update.source or '—'}</p>"
                    f"<p style='color:#888'>Aucun barème n'est modifié tant qu'un administrateur n'a pas validé.</p>"
                )
                try:
                    mail.send(Message(subject=title, recipients=recipients, html=html))
                except Exception as e:
                    print(f"[tax_update] email error: {e}")

    # ─── Vérification complète ───────────────────────────────────────────────
    def run_check(self, year=None, source_url=None, triggered_by="auto") -> TaxUpdate:
        year = int(year or tax_service.default_year())
        current_block = tax_service.get_rates(year)

        sources, enabled = self._get_sources()
        if source_url:
            sources = [source_url]
        if not enabled:
            rec = TaxUpdate(year=year, status="error", triggered_by=triggered_by,
                            message="La veille fiscale est désactivée dans la configuration.")
            db.session.add(rec); db.session.commit()
            return rec
        if not sources:
            rec = TaxUpdate(year=year, status="error", triggered_by=triggered_by,
                            message="Aucune source de vérification configurée (tax_rates.json -> verification.sources).")
            db.session.add(rec); db.session.commit()
            return rec

        used_source = sources[0]
        try:
            text = ""
            for url in sources:
                try:
                    text += " " + self._fetch_text(url)
                    used_source = url
                except Exception as e:
                    print(f"[tax_update] fetch {url} failed: {e}")
            if not text.strip():
                raise RuntimeError("Impossible de récupérer le contenu des sources.")

            proposed = self._ai_extract(year, text, current_block)
            if not self._is_valid_block(proposed):
                raise RuntimeError("Le barème extrait par l'IA est incomplet ou mal formé.")

            diffs = self._diff(current_block, proposed)

            if not diffs:
                rec = TaxUpdate(
                    year=year, status="no_change", triggered_by=triggered_by, source=used_source,
                    message="Vérification effectuée : aucun changement détecté.",
                    current_json=json.dumps(current_block, ensure_ascii=False),
                )
                db.session.add(rec); db.session.commit()
                return rec

            rec = TaxUpdate(
                year=year, status="pending", triggered_by=triggered_by, source=used_source,
                message=f"{len(diffs)} indicateur(s) différent(s) détecté(s). Validation requise.",
                current_json=json.dumps(current_block, ensure_ascii=False),
                proposed_json=json.dumps(proposed, ensure_ascii=False),
                diff_json=json.dumps(diffs, ensure_ascii=False),
            )
            db.session.add(rec); db.session.commit()
            self._alert_admins(rec)
            return rec

        except Exception as e:
            print(f"[tax_update] run_check error: {e}")
            rec = TaxUpdate(year=year, status="error", triggered_by=triggered_by,
                            source=used_source, message=f"Échec de la vérification : {e}")
            db.session.add(rec); db.session.commit()
            return rec

    # ─── Validation par un admin : applique le barème détecté ────────────────
    def approve(self, update_id: int, admin_id: int) -> TaxUpdate:
        rec = TaxUpdate.query.get(update_id)
        if not rec:
            raise ValueError("Mise à jour introuvable.")
        if rec.status != "pending":
            raise ValueError("Cette mise à jour n'est plus en attente.")

        proposed = rec.to_dict().get("proposed")
        if not self._is_valid_block(proposed):
            raise ValueError("Le barème proposé est invalide, validation impossible.")

        # Sauvegarde du fichier avant écriture
        path = tax_service.file_path
        try:
            shutil.copyfile(path, path + ".backup")
        except Exception as e:
            print(f"[tax_update] backup warning: {e}")

        cfg = tax_service._load()
        cfg.setdefault("years", {})[str(rec.year)] = proposed
        with open(path, "w", encoding="utf-8") as f:
            json.dump(cfg, f, ensure_ascii=False, indent=2)
        tax_service.reload()  # recharge les nouveaux barèmes en mémoire

        rec.status = "approved"
        rec.reviewed_at = datetime.utcnow()
        rec.reviewed_by_id = admin_id
        db.session.commit()
        return rec

    def reject(self, update_id: int, admin_id: int) -> TaxUpdate:
        rec = TaxUpdate.query.get(update_id)
        if not rec:
            raise ValueError("Mise à jour introuvable.")
        if rec.status != "pending":
            raise ValueError("Cette mise à jour n'est plus en attente.")
        rec.status = "rejected"
        rec.reviewed_at = datetime.utcnow()
        rec.reviewed_by_id = admin_id
        db.session.commit()
        return rec


tax_update_service = TaxUpdateService()