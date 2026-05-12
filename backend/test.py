"""
====================================================================
 LegalAI Morocco — RAG Juridique Intelligent
====================================================================

OBJECTIF:
- Charger maliyum_data.json
- Résumer chaque document juridique
- BM25 Retrieval intelligent
- Génération contrats réalistes
- PDF arabe RTL propre
- Réduction hallucination LLM

INSTALL:
pip install groq rank-bm25 fpdf2 python-dotenv \
arabic-reshaper python-bidi colorama

STRUCTURE:
backend/
│
├── data/
│    └── maliyum_data.json
│
├── fonts/
│    ├── Amiri-Regular.ttf
│    └── Amiri-Bold.ttf
│
├── summaries/
│
├── generated_contracts/
│
└── legalai_rag.py
====================================================================
"""

import os
import re
import json
import time
from pathlib import Path
from dotenv import load_dotenv

# ─────────────────────────────────────────────
# ENV
# ─────────────────────────────────────────────

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

if not GROQ_API_KEY:
    raise ValueError("❌ GROQ_API_KEY manquante")

# ─────────────────────────────────────────────
# PATHS
# ─────────────────────────────────────────────

BASE_DIR = Path(__file__).parent

JSON_PATH = BASE_DIR / "data" / "maliyum_data.json"

SUMMARY_DIR = BASE_DIR / "summaries"

OUTPUT_DIR = BASE_DIR / "generated_contracts"

FONT_DIR = BASE_DIR / "fonts"

SUMMARY_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ─────────────────────────────────────────────
# IMPORTS
# ─────────────────────────────────────────────

from groq import Groq

from rank_bm25 import BM25Okapi

from fpdf import FPDF

import arabic_reshaper

from bidi.algorithm import get_display

# ─────────────────────────────────────────────
# GROQ CLIENT
# ─────────────────────────────────────────────

client = Groq(api_key=GROQ_API_KEY)

# ─────────────────────────────────────────────
# RTL
# ─────────────────────────────────────────────

def rtl(text: str) -> str:

    reshaped = arabic_reshaper.reshape(text)

    return get_display(reshaped)

# ─────────────────────────────────────────────
# LOAD JSON
# ─────────────────────────────────────────────

if not JSON_PATH.exists():

    raise FileNotFoundError(
        f"❌ Fichier introuvable: {JSON_PATH}"
    )

with open(JSON_PATH, "r", encoding="utf-8") as f:

    RAW_DATA = json.load(f)

print(f"\n✅ {len(RAW_DATA)} documents chargés\n")

# ─────────────────────────────────────────────
# LEGAL SUMMARIZATION
# ─────────────────────────────────────────────

def summarize_legal_document(title: str, content: str):

    prompt = f"""
أنت خبير قانوني مغربي.

قم بتحليل الوثيقة التالية.

أرجع JSON فقط بالشكل التالي:

{{
  "type": "...",
  "summary": "...",
  "clauses": ["..."],
  "laws": ["..."],
  "obligations": ["..."],
  "termination_conditions": ["..."]
}}

العنوان:
{title}

المحتوى:
{content[:12000]}
"""

    response = client.chat.completions.create(

        model="llama-3.3-70b-versatile",

        temperature=0.1,

        max_tokens=1800,

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    answer = response.choices[0].message.content

    try:

        json_match = re.search(
            r"\{.*\}",
            answer,
            re.DOTALL
        )

        if json_match:

            return json.loads(json_match.group())

    except Exception as e:

        print("⚠️ JSON parsing failed")

    return {
        "type": title,
        "summary": content[:2000],
        "clauses": [],
        "laws": [],
        "obligations": [],
        "termination_conditions": []
    }

# ─────────────────────────────────────────────
# BUILD SUMMARIES
# ─────────────────────────────────────────────

def build_summaries():

    print("\n📚 Construction résumés juridiques...\n")

    for i, item in enumerate(RAW_DATA, 1):

        title = item.get("العنوان", "")

        content = item.get(
            "المحتوى_الكامل",
            item.get("المحتوى", "")
        )

        if not content.strip():

            continue

        print(f"[{i}/{len(RAW_DATA)}] {title[:60]}")

        summary = summarize_legal_document(
            title,
            content
        )

        final_data = {

            "title": title,

            "url": item.get("الرابط", ""),

            "category": item.get("التصنيفات", ""),

            "summary_data": summary
        }

        filename = re.sub(
            r"[^\w]",
            "_",
            title
        )[:60]

        filepath = SUMMARY_DIR / f"{filename}.json"

        with open(filepath, "w", encoding="utf-8") as f:

            json.dump(
                final_data,
                f,
                ensure_ascii=False,
                indent=2
            )

        print("✅ sauvegardé\n")

        time.sleep(1)

# ─────────────────────────────────────────────
# LOAD SUMMARIES
# ─────────────────────────────────────────────

ALL_SUMMARIES = []

def load_summaries():

    global ALL_SUMMARIES

    ALL_SUMMARIES = []

    for file in SUMMARY_DIR.glob("*.json"):

        with open(file, "r", encoding="utf-8") as f:

            ALL_SUMMARIES.append(json.load(f))

# ─────────────────────────────────────────────
# BM25
# ─────────────────────────────────────────────

def build_bm25():

    corpus = []

    for item in ALL_SUMMARIES:

        summary = item["summary_data"]

        text = (

            item.get("title", "") + " " +

            summary.get("type", "") + " " +

            summary.get("summary", "") + " " +

            " ".join(summary.get("clauses", [])) + " " +

            " ".join(summary.get("laws", [])) + " " +

            " ".join(summary.get("obligations", []))
        )

        corpus.append(text.split())

    return BM25Okapi(corpus)

# ─────────────────────────────────────────────
# RETRIEVAL
# ─────────────────────────────────────────────

def retrieve_legal_reference(query: str):

    bm25 = build_bm25()

    results = bm25.get_top_n(
        query.split(),
        ALL_SUMMARIES,
        n=1
    )

    if not results:

        return None

    return results[0]

# ─────────────────────────────────────────────
# CONTRACT GENERATION
# ─────────────────────────────────────────────

def generate_contract(query: str, ref_data: dict):

    summary = ref_data["summary_data"]

    prompt = f"""
أنت محام مغربي محترف متخصص في صياغة العقود.

ممنوع الخروج عن المرجع التالي.

المرجع القانوني:

العنوان:
{ref_data.get("title")}

نوع العقد:
{summary.get("type")}

الملخص:
{summary.get("summary")}

البنود:
{summary.get("clauses")}

القوانين:
{summary.get("laws")}

الالتزامات:
{summary.get("obligations")}

شروط الفسخ:
{summary.get("termination_conditions")}

طلب المستخدم:
{query}

قم بإنشاء عقد قانوني مغربي احترافي.
"""

    response = client.chat.completions.create(

        model="llama-3.3-70b-versatile",

        temperature=0.1,

        max_tokens=2500,

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response.choices[0].message.content

# ─────────────────────────────────────────────
# PDF GENERATION
# ─────────────────────────────────────────────

def generate_pdf(title: str, content: str):

    pdf = FPDF()

    # ─────────────────────────────
    # PAGE SETUP (IMPORTANT FIX)
    # ─────────────────────────────
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.set_margins(15, 15, 15)
    pdf.add_page()

    # ─────────────────────────────
    # FONTS
    # ─────────────────────────────
    regular_font = FONT_DIR / "Amiri-Regular.ttf"
    bold_font = FONT_DIR / "Amiri-Bold.ttf"

    pdf.add_font("Arabic", "", str(regular_font), uni=True)
    pdf.add_font("Arabic", "B", str(bold_font), uni=True)

    # ─────────────────────────────
    # HEADER
    # ─────────────────────────────
    page_width = pdf.w

    pdf.set_fill_color(20, 25, 70)
    pdf.rect(0, 0, page_width, 35, style="F")

    pdf.set_text_color(220, 190, 70)
    pdf.set_font("Arabic", "B", 18)

    pdf.ln(10)

    pdf.cell(
        page_width,
        10,
        rtl(title),
        ln=True,
        align="C"
    )

    pdf.ln(12)

    # ─────────────────────────────
    # CONTENT (SAFE LAYOUT ENGINE)
    # ─────────────────────────────
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Arabic", "", 12)

    content_width = pdf.w - 30  # safe margins

    for line in content.split("\n"):

        line = line.strip()

        if not line:
            pdf.ln(4)
            continue

        pdf.set_x(pdf.l_margin)

        pdf.multi_cell(
            content_width,
            7,
            rtl(line),
            align="R"
        )

        pdf.ln(1)

    # ─────────────────────────────
    # FOOTER (FIXED + RESPONSIVE)
    # ─────────────────────────────
    pdf.set_y(-25)

    pdf.set_fill_color(20, 25, 70)
    pdf.rect(0, pdf.h - 20, pdf.w, 20, style="F")

    pdf.set_text_color(220, 190, 70)
    pdf.set_font("Arabic", "", 9)

    pdf.set_x(0)

    pdf.cell(
        pdf.w,
        10,
        rtl("LegalAI Morocco — جميع الحقوق محفوظة"),
        align="C"
    )

    # ─────────────────────────────
    # SAVE FILE
    # ─────────────────────────────
    filename = f"contract_{os.urandom(4).hex()}.pdf"
    filepath = OUTPUT_DIR / filename

    pdf.output(str(filepath))

    return filename
# ─────────────────────────────────────────────
# MAIN GENERATION
# ─────────────────────────────────────────────

def run_generation():

    load_summaries()

    query = input("\n📝 Votre demande juridique: ")

    print("\n🔎 Recherche juridique...\n")

    ref = retrieve_legal_reference(query)

    if not ref:

        print("❌ Aucun document trouvé")

        return

    print("✅ Référence trouvée:\n")

    print(ref.get("title"))

    print("\n⚡ Génération contrat...\n")

    contract = generate_contract(
        query,
        ref
    )

    filename = generate_pdf(
        ref.get("title"),
        contract
    )

    print(f"\n✅ PDF généré: {filename}")

# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

if __name__ == "__main__":

    print("""
=================================================
 LegalAI Morocco
=================================================

1. Construire base résumée
2. Générer contrat
""")

    choice = input("\nChoix: ")

    if choice == "1":

        build_summaries()

    elif choice == "2":

        run_generation()

    else:

        print("❌ Choix invalide")