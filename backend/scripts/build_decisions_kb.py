# -*- coding: utf-8 -*-
"""
Convertit + NETTOIE les décisions (decisions_clean2.json) vers le format
de la base de connaissances RAG (mêmes clés que maliyum_data.json).

Usage:
    python build_decisions_kb.py INPUT.json OUTPUT.json
"""
import sys, json, re, unicodedata

TATWEEL = "\u0640"
DIACRITICS = re.compile(r"[\u0617-\u061A\u064B-\u0652\u0670\u06D6-\u06ED]")
BIDI_ZW    = re.compile(r"[\u200b-\u200f\u202a-\u202e\u2066-\u2069\ufeff]")
CTRL       = re.compile(r"[\u0000-\u0008\u000b\u000c\u000e-\u001f]")

# ─── Corrections OCR sûres (mot entier, haute confiance) ──────────────────────
# Tu peux en ajouter ici au fil du temps. Le \b évite de toucher les mots voisins
# (ex. « الجلس » corrigé en « المجلس », mais « الجلسة » reste intact).
OCR_FIXES = [
    (re.compile(r"الجلس\b"),  "المجلس"),     # المجلس الأعلى
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
    """Nettoyage FIDÈLE (on garde le sens, on enlève le bruit d'OCR)."""
    if not t:
        return ""
    t = unicodedata.normalize("NFC", t)
    t = BIDI_ZW.sub("", t)            # marques RTL/LTR, BOM, zero-width
    t = t.replace("\u00a0", " ")      # espace insécable -> espace
    t = CTRL.sub("", t)               # caractères de contrôle
    t = t.replace(TATWEEL, "")        # kashida ـ (étirement décoratif)
    t = fix_ocr(t)                    # corrections OCR sûres (mot entier)
    # ponctuation arabe collée -> espace propre
    t = re.sub(r"[ \t]+", " ", t)
    t = re.sub(r" *\n *", "\n", t)
    # corrections OCR fréquentes : espace avant ponctuation, doublons
    t = re.sub(r"\s+([،.,؛:!؟])", r"\1", t)
    t = re.sub(r"([،؛])(?=\S)", r"\1 ", t)
    # lignes 100% bruit (séparateurs, points isolés) -> supprimées
    out = []
    for ln in t.split("\n"):
        s = ln.strip()
        if not s:
            out.append("")
            continue
        if re.fullmatch(r"[^\w\u0600-\u06FF]+", s):   # que ponctuation/symboles
            continue
        out.append(s)
    t = "\n".join(out)
    t = re.sub(r"\n{3,}", "\n\n", t).strip()
    return t

def build_title(item: dict, full_clean: str) -> str:
    """Titre lisible : 1re ligne utile, sinon construit depuis les métadonnées."""
    first = ""
    for ln in full_clean.split("\n"):
        s = ln.strip()
        if 12 <= len(s) <= 200:
            first = s
            break
    num   = (item.get("number") or item.get("decision_number") or "").strip()
    cham  = (item.get("chamber") or "").strip()
    if first:
        return first
    bits = ["قرار محكمة النقض"]
    if num:  bits.append(f"رقم {num}")
    if cham: bits.append(f"— {cham}")
    return " ".join(bits)

def convert(item: dict) -> dict | None:
    full = clean_text(item.get("full_text") or "")
    if len(full) < 40:                 # trop court / vide -> ignoré
        return None
    title = build_title(item, full)
    cats  = "، ".join([x for x in [item.get("chamber"), item.get("keyword")] if x])
    num   = (item.get("number") or item.get("decision_number") or "").strip()
    link  = (item.get("pdf_link") or "").strip()
    date  = (item.get("date") or "").strip()
    # extrait court = principe juridique (souvent les 1ères lignes) -> المحتوى
    short = full[:900]
    return {
        "العنوان":        title,
        "التاريخ":        date,
        "التصنيفات":      cats or "قرارات قضائية",
        "المحتوى":        short,
        "المحتوى_الكامل": f"قرار محكمة النقض رقم {num} بتاريخ {date}.\n{full}" if num else full,
        "روابط_التحميل":  link,
        "الرابط":         link,
        "نوع_المصدر":     "decision",     # facultatif : pour distinguer la source
    }

def main():
    src, dst = sys.argv[1], sys.argv[2]
    data = json.load(open(src, encoding="utf-8"))
    out, skipped = [], 0
    for it in data:
        c = convert(it)
        if c: out.append(c)
        else: skipped += 1
    json.dump(out, open(dst, "w", encoding="utf-8"), ensure_ascii=False, indent=2)
    print(f"✅ {len(out)} décisions converties & nettoyées -> {dst}")
    print(f"   ({skipped} ignorées car texte vide/trop court)")

if __name__ == "__main__":
    main()
