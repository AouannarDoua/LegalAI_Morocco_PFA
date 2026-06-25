# -*- coding: utf-8 -*-
"""
Chargeur unifié de la base de connaissances juridique.

OBJECTIF : tu déposes tes fichiers JSON dans `backend/data/knowledge/` SANS te
soucier du format. Ce module détecte automatiquement le format et fait le
nettoyage + la conversion :

  • Format BRUT (ton scraper)        : clés `number`, `full_text`, `chamber`, …
  • Format BASE DE CONNAISSANCES     : clés arabes `العنوان`, `المحتوى_الكامل`, …

Le résultat est toujours au format « base de connaissances » (clés arabes),
utilisé à la fois par le RAG (chat) et par le script de seed (pages SQL).
"""
import os
import re
import glob
import json
import unicodedata

# ─── Nettoyage du texte (fidèle) ──────────────────────────────────────────────
TATWEEL = "\u0640"
_DIAC = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]")
_BIDI = re.compile(r"[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]")
_CTRL = re.compile(r"[\u0000-\u0008\u000b\u000c\u000e-\u001f]")

# Corrections OCR sûres (mot entier ; \b protège les mots voisins).
# 👉 Ajoute les tiennes ici si tu repères d'autres mots cassés.
OCR_FIXES = [
    (re.compile(r"الجلس\b"),   "المجلس"),
    (re.compile(r"الأنعلى\b"), "الأعلى"),
    (re.compile(r"نتراعات\b"), "نزاعات"),
    (re.compile(r"نتزاعات\b"), "نزاعات"),
    (re.compile(r"ننشرة\b"),   "نشرة"),
    (re.compile(r"الإستئناف"), "الاستئناف"),
]


def fix_ocr(t: str) -> str:
    for rx, rep in OCR_FIXES:
        t = rx.sub(rep, t)
    return t


def clean_text(t: str) -> str:
    if not t:
        return ""
    t = unicodedata.normalize("NFC", t)
    t = _BIDI.sub("", t)
    t = t.replace("\u00a0", " ")
    t = _CTRL.sub("", t)
    t = t.replace(TATWEEL, "")
    t = fix_ocr(t)
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" *\n *", "\n", t)
    t = re.sub(r"\s+([،.,؛:!؟])", r"\1", t)
    t = re.sub(r"([،؛])(?=\S)", r"\1 ", t)
    out = []
    for ln in t.split("\n"):
        s = ln.strip()
        if not s:
            out.append("")
            continue
        if re.fullmatch(r"[^\w\u0600-\u06FF]+", s):
            continue
        out.append(s)
    t = "\n".join(out)
    return re.sub(r"\n{3,}", "\n\n", t).strip()


# ─── Conversion format BRUT -> format base de connaissances ────────────────────
def _build_title(item: dict, full_clean: str) -> str:
    for ln in full_clean.split("\n"):
        s = ln.strip()
        if 12 <= len(s) <= 200:
            return s
    num = (item.get("number") or item.get("decision_number") or "").strip()
    cham = (item.get("chamber") or "").strip()
    bits = ["قرار محكمة النقض"]
    if num:
        bits.append(f"رقم {num}")
    if cham:
        bits.append(f"— {cham}")
    return " ".join(bits)


def raw_decision_to_kb(item: dict):
    full = clean_text(item.get("full_text") or "")
    if len(full) < 40:
        return None
    num = (item.get("number") or item.get("decision_number") or "").strip()
    date = (item.get("date") or "").strip()
    cham = (item.get("chamber") or "").strip()
    link = (item.get("pdf_link") or item.get("الرابط") or "").strip()
    cats = "، ".join([x for x in [cham, item.get("keyword")] if x]) or "قرارات قضائية"
    return {
        "العنوان":        _build_title(item, full),
        "التاريخ":        date,
        "التصنيفات":      cats,
        "المحتوى":        full[:900],
        "المحتوى_الكامل": f"قرار محكمة النقض رقم {num} بتاريخ {date}.\n{full}" if num else full,
        "روابط_التحميل":  link,
        "الرابط":         link,
        "نوع_المصدر":     "decision",
    }


def normalize_item(item: dict):
    """Renvoie un dict au format base de connaissances, ou None si inexploitable."""
    if not isinstance(item, dict):
        return None
    # Déjà au format base de connaissances ?
    if "العنوان" in item or "المحتوى_الكامل" in item or "المحتوى" in item:
        item.setdefault("نوع_المصدر", "article")
        return item
    # Format brut « décision » ?
    if item.get("full_text") or item.get("number") or item.get("chamber"):
        return raw_decision_to_kb(item)
    return None


# ─── Conversion d'une LOI (texte + sections) -> plusieurs records ──────────────
# Un code entier (ex. le DOC = 1311 articles) est DÉCOUPÉ en un record PAR ARTICLE
# (الفصل / المادة). Ça permet au chat de retrouver l'article exact au lieu de
# renvoyer tout le code.
def law_to_kb_records(doc: dict):
    title = (doc.get("title") or doc.get("full_title") or "نص قانوني").strip()
    matter = (doc.get("matter") or doc.get("keyword") or "نصوص تشريعية").strip()
    url = (doc.get("pdf_url") or "").strip()
    date = (doc.get("metadata_gregorian_date") or "")[:10]
    out = []
    for sec in doc.get("sections", []):
        if not isinstance(sec, dict):
            continue
        text = clean_text(sec.get("text") or "")
        if len(text) < 15:
            continue
        label = (sec.get("label") or
                 f"{sec.get('section_type','')} {sec.get('section_number','')}").strip()
        ctx = " / ".join([x for x in (sec.get("book"), sec.get("part"),
                                      sec.get("chapter")) if x])
        head = f"{title} — {label}".strip(" —")
        out.append({
            "العنوان":        head,
            "التاريخ":        date,
            "التصنيفات":      matter,
            "المحتوى":        text[:900],
            "المحتوى_الكامل": head + (f" ({ctx})" if ctx else "") + f"\n{text}",
            "روابط_التحميل":  url,
            "الرابط":         url,
            "نوع_المصدر":     "loi",
        })
    return out


def _is_law(d: dict) -> bool:
    return isinstance(d, dict) and isinstance(d.get("sections"), list)


# ─── Chargement ───────────────────────────────────────────────────────────────
def load_records(path: str):
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print(f"[legal_data] ❌ lecture {os.path.basename(path)}: {e}")
        return []

    # Fichier = une LOI (dict avec 'sections') -> découpée par article
    if _is_law(data):
        return law_to_kb_records(data)

    # Fichier = un seul objet (décision ou article déjà au bon format)
    if isinstance(data, dict):
        rec = normalize_item(data)
        return [rec] if rec else []

    # Fichier = liste d'objets (décisions brutes, articles, ou lois)
    if isinstance(data, list):
        out = []
        for it in data:
            if _is_law(it):
                out.extend(law_to_kb_records(it))
            else:
                rec = normalize_item(it)
                if rec:
                    out.append(rec)
        return out

    return []


def kb_files(data_dir: str):
    """
    Fichiers chargés :
      - data/maliyum_data.json
      - data/*_kb.json            (compat : fichiers déjà convertis)
      - data/knowledge/*.json     (👉 dépose ICI tes fichiers, brut ou converti)
    """
    files = []
    maliyum = os.path.join(data_dir, "maliyum_data.json")
    if os.path.exists(maliyum):
        files.append(maliyum)
    files += sorted(glob.glob(os.path.join(data_dir, "*_kb.json")))
    files += sorted(glob.glob(os.path.join(data_dir, "knowledge", "*.json")))
    # dédoublonnage par chemin réel
    seen, uniq = set(), []
    for f in files:
        rp = os.path.realpath(f)
        if rp not in seen and os.path.exists(f):
            seen.add(rp)
            uniq.append(f)
    return uniq


def load_all(data_dir: str):
    """Renvoie (records, infos) — records = liste au format base de connaissances."""
    records, infos = [], []
    for path in kb_files(data_dir):
        recs = load_records(path)
        records.extend(recs)
        infos.append((os.path.basename(path), len(recs)))
    return records, infos


def law_documents(data_dir: str):
    """
    Renvoie UNE entrée par fichier de loi (le code entier), pour la table SQL
    `articles` — afin que la page Articles affiche ~1 ligne par loi (et non des
    milliers d'articles). Le `content` contient tout le texte de la loi.
    """
    docs = []
    for path in kb_files(data_dir):
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
        except Exception:
            continue
        items = data if isinstance(data, list) else [data]
        for d in items:
            if not _is_law(d):
                continue
            title = (d.get("title") or d.get("full_title") or "نص قانوني").strip()
            parts = []
            for sec in d.get("sections", []):
                if not isinstance(sec, dict):
                    continue
                txt = clean_text(sec.get("text") or "")
                if len(txt) < 5:
                    continue
                label = (sec.get("label") or "").strip()
                parts.append(f"{label}\n{txt}" if label else txt)
            if not parts:
                continue
            docs.append({
                "title":   title,
                "matter":  (d.get("matter") or d.get("keyword") or "نصوص تشريعية").strip(),
                "url":     (d.get("pdf_url") or "").strip(),
                "date":    (d.get("metadata_gregorian_date") or "")[:10],
                "content": "\n\n".join(parts),
                "count":   len(parts),
            })
    return docs
