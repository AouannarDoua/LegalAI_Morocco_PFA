# app/services/tax_projection_service.py
# ─────────────────────────────────────────────────────────────────────────────
# Projection d'impôt prévisionnel.
#   1. L'utilisateur saisit ses montants réalisés sur N mois.
#   2. On projette sur l'année entière (règle proportionnelle).
#   3. On calcule l'impôt prévisionnel (réutilise tax_service).
#   4. On calcule l'échéancier des 4 acomptes provisionnels d'IS.
#   5. L'IA explique la projection et donne des conseils (trésorerie, optimisation).
#
# IMPORTANT : la projection est une ESTIMATION (suppose une activité régulière).
# Le calcul fait les maths ; l'IA explique et nuance — elle n'invente aucun montant.
# ─────────────────────────────────────────────────────────────────────────────
import os
import re
import json

from .tax_service import tax_service

try:
    from groq import Groq
except Exception:
    Groq = None


class TaxProjectionService:
    def __init__(self):
        self.model_name = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    @staticmethod
    def _round(x):
        return round(float(x), 2)

    # ─── Échéancier des acomptes provisionnels d'IS ──────────────────────────
    def _acomptes(self, is_previsionnel, year):
        # L'IS se règle en 4 acomptes égaux (25 % chacun).
        a = self._round(is_previsionnel * 0.25)
        return [
            {"numero": 1, "date": f"31 mars {year}",      "montant": a},
            {"numero": 2, "date": f"30 juin {year}",      "montant": a},
            {"numero": 3, "date": f"30 septembre {year}", "montant": a},
            {"numero": 4, "date": f"31 décembre {year}",  "montant": a},
        ]

    # ─── Conseils générés par l'IA (avec repli si IA indisponible) ───────────
    def _ai_advice(self, ctx: dict) -> dict:
        api_key = os.environ.get("GROQ_API_KEY", "")
        fallback = {
            "explication": (
                f"Sur la base de {ctx['mois_ecoules']} mois réalisés, l'activité est projetée "
                f"sur 12 mois (facteur {ctx['facteur']}). Le bénéfice annuel estimé est de "
                f"{ctx['benefice_projete']:,.0f} DH, soit un IS prévisionnel de "
                f"{ctx['is_previsionnel']:,.0f} DH.".replace(",", " ")
            ),
            "conseils": [
                "Provisionnez chaque acompte d'IS pour éviter les pénalités de retard.",
                "Si votre activité est saisonnière, ajustez cette projection en conséquence.",
                "Vérifiez les charges déductibles : elles réduisent le bénéfice imposable.",
            ],
        }
        if not api_key or Groq is None:
            return fallback

        try:
            client = Groq(api_key=api_key)
            prompt = (
                "Tu es un conseiller fiscal marocain. À partir des chiffres ci-dessous, "
                "rédige une explication courte (2-3 phrases) de la projection, puis 3 conseils "
                "concrets et actionnables (trésorerie, acomptes, optimisation légale). "
                "Réponds UNIQUEMENT en JSON valide, sans Markdown, au format : "
                '{\"explication\": \"...\", \"conseils\": [\"...\", \"...\", \"...\"]}.\n\n'
                f"Données : {json.dumps(ctx, ensure_ascii=False)}"
            )
            resp = client.chat.completions.create(
                model=self.model_name,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,
            )
            raw = resp.choices[0].message.content.strip()
            raw = re.sub(r"^```(json)?|```$", "", raw.strip(), flags=re.I | re.M).strip()
            data = json.loads(raw)
            if "explication" in data and "conseils" in data:
                return data
            return fallback
        except Exception as e:
            print(f"[tax_projection] IA error: {e}")
            return fallback

    # ─── Point d'entrée ──────────────────────────────────────────────────────
    def project(self, *, year=None, mois_ecoules=0, ca_realise=0, benefice_realise=0,
                secteur="", nombre_employes=0, salaire_brut_mensuel=0,
                taux_tva=20, secteur_financier=False) -> dict:

        mois_ecoules = int(mois_ecoules or 0)
        if mois_ecoules < 1 or mois_ecoules > 12:
            raise ValueError("Le nombre de mois écoulés doit être compris entre 1 et 12.")

        ca_realise       = max(float(ca_realise or 0), 0)
        benefice_realise = float(benefice_realise or 0)

        # Projection proportionnelle sur 12 mois
        facteur = self._round(12 / mois_ecoules)
        ca_projete       = self._round(ca_realise * facteur)
        benefice_projete = self._round(benefice_realise * facteur)

        # Calcul de l'impôt prévisionnel (réutilise le moteur existant)
        simulation = tax_service.simulate(
            year=year,
            chiffre_affaires=ca_projete,
            benefice_net=benefice_projete,
            secteur=secteur,
            nombre_employes=nombre_employes,
            salaire_brut_mensuel=salaire_brut_mensuel,
            taux_tva=taux_tva,
            secteur_financier=secteur_financier,
        )

        is_previsionnel = simulation["is"]["is_du"]
        annee = simulation["meta"]["annee"]
        acomptes = self._acomptes(is_previsionnel, annee)

        ai = self._ai_advice({
            "annee": annee,
            "mois_ecoules": mois_ecoules,
            "facteur": facteur,
            "ca_realise": ca_realise,
            "benefice_realise": benefice_realise,
            "ca_projete": ca_projete,
            "benefice_projete": benefice_projete,
            "is_previsionnel": is_previsionnel,
        })

        return {
            "meta": simulation["meta"],
            "realise": {
                "mois_ecoules": mois_ecoules,
                "ca_realise": self._round(ca_realise),
                "benefice_realise": self._round(benefice_realise),
            },
            "projection": {
                "facteur": facteur,
                "ca_projete": ca_projete,
                "benefice_projete": benefice_projete,
            },
            "simulation": simulation,
            "is_previsionnel": is_previsionnel,
            "acomptes": acomptes,
            "acomptes_note": (
                "Légalement, les acomptes d'IS sont calculés sur l'IS de l'année précédente (N-1). "
                "Ici, ils sont estimés à partir de l'IS prévisionnel projeté, à titre indicatif."
            ),
            "ai": ai,
        }


tax_projection_service = TaxProjectionService()