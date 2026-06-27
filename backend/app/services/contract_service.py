# -*- coding: utf-8 -*-
"""
ContractService — interface d'origine (create / generate / analyze /
get_all_templates) CONSERVÉE pour la route contracts.py, mais moteur interne
amélioré (logique v12) : clauses des 22 types, validation + correction, et
surtout un VRAI PDF arabe (Amiri + RTL) au lieu du latin-1 qui cassait l'arabe.
"""

import os
import re
import json
from datetime import datetime

from ..extensions import db
from ..models.contract import Contract
from .rag_service import rag_service
from .ai_service import ai_service
from .contract_types_data import CONTRACT_TYPES
from .contract_grids import clauses_for  # SOURCE UNIQUE partagée avec le Score

from groq import Groq
from dotenv import load_dotenv

load_dotenv()

# PDF arabe optionnel (Amiri + reshaper + bidi). Si absent → repli texte.
try:
    from fpdf import FPDF
    import arabic_reshaper
    from bidi.algorithm import get_display
    _AR_PDF = True
except Exception:
    _AR_PDF = False

MODEL       = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")
MAX_RETRY   = 2
BASE_DIR    = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
UPLOAD_DIR  = os.path.join(os.getcwd(), "uploads")    # route download sert d'ici
FONT_DIR    = os.path.join(BASE_DIR, "fonts")
ASSETS_DIR  = os.path.join(BASE_DIR, "assets")
# Racine du projet (un niveau au-dessus de backend/) → pour le dossier public/
PROJECT_ROOT = os.path.dirname(BASE_DIR)
# On cherche le logo à plusieurs endroits ; on prend le premier qui existe.
_LOGO_CANDIDATES = [
    os.path.join(ASSETS_DIR, "logo.png"),               # backend/assets/logo.png
    os.path.join(PROJECT_ROOT, "public", "logo.png"),   # <racine>/public/logo.png  ← ton cas
    os.path.join(BASE_DIR, "public", "logo.png"),       # backend/public/logo.png
]
LOGO_PATH   = next((p for p in _LOGO_CANDIDATES if os.path.exists(p)), _LOGO_CANDIDATES[0])
AMIRI_REG   = os.path.join(FONT_DIR, "Amiri-Regular.ttf")
AMIRI_BOLD  = os.path.join(FONT_DIR, "Amiri-Bold.ttf")

# Couleurs de la charte (PDF soigné — comme le notebook)
# ─── Palette Mizan (vert zellige + or) ───────────────────────────────────────
MIZAN_GREEN = (14, 107, 78)    # #0E6B4E  (couleur de marque)
MIZAN_DARK  = (10, 77, 56)     # #0a4d38
MIZAN_50    = (236, 245, 241)  # #ecf5f1  (fond clair des titres d'articles)
GOLD        = (190, 154, 78)   # #BE9A4E  (accent or)
GOLD_DARK   = (160, 127, 60)   # #a07f3c
INK         = (21, 40, 31)     # #15281F  (texte principal)
DARK_GRAY   = (90, 90, 90)
# alias de compatibilité
NAVY_BLUE   = MIZAN_GREEN

EMPTY_FIELD_PATTERNS = [
    "المعلومة غير موجودة", "سيتم تحديده", "يحدد لاحقا", "........",
    "[ ]", "()", "غير مذكور", "غير معروف", "غير محدد",
    "لم يتم تحديد", "يملأ لاحقا", "****",
]

NOISE_PATTERNS = ["📋 نسخ", "🖨 طباعة", "✔ تم نسخ النموذج", "تحميل النموذج"]


def clean_source_text(text: str) -> str:
    """Retire le bruit (boutons copier/imprimer…) du contenu source."""
    if not text:
        return ""
    for pattern in NOISE_PATTERNS:
        text = text.replace(pattern, "")
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def detect_contract_type(text: str):
    """
    Mappe un titre OU un type vers l'un des 22 types via mots-clés
    (comme le notebook), SANS input(). Renvoie le nom du type ou None.
    """
    low = (text or "").lower()
    # 1) correspondance exacte sur la clé
    if text in CONTRACT_TYPES:
        return text
    # 2) détection par mots-clés
    for type_name, data in CONTRACT_TYPES.items():
        for kw in data.get("keywords", []):
            if kw and kw.lower() in low:
                return type_name
    return None


def get_references(query: str, k: int = 5):
    """
    Récupère des références juridiques — compatible avec l'ANCIEN rag_service
    (retrieve) comme le NOUVEAU (_search_chunks).
    Renvoie (liste_de_textes, titre_principal).
    """
    # Nouveau moteur (chunks) si disponible
    if hasattr(rag_service, "_search_chunks"):
        try:
            hits = rag_service._search_chunks(query, k=k)
            if hits:
                refs  = [clean_source_text(h[0]["text"]) for h in hits]
                title = hits[0][0].get("title")
                return refs, title
        except Exception:
            pass
    # Ancien moteur : retrieve() -> MockDocument (document complet)
    try:
        doc = rag_service.retrieve(query)
        if doc:
            return [clean_source_text(doc.page_content)], doc.metadata.get("title")
    except Exception:
        pass
    return [], None


# ─── Prompt v12 ───────────────────────────────────────────────────────────────
def _parse_date(s):
    """Parse 'jj/mm/aaaa' ou 'aaaa-mm-jj' → datetime.date, sinon None."""
    if not s:
        return None
    s = str(s).strip()
    for fmt in ("%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y"):
        try:
            return datetime.strptime(s, fmt).date()
        except ValueError:
            continue
    return None


def _add_months(d, months):
    """Ajoute un nombre de mois à une date en gérant les fins de mois."""
    import calendar
    total = d.month - 1 + int(months)
    year  = d.year + total // 12
    month = total % 12 + 1
    day   = min(d.day, calendar.monthrange(year, month)[1])
    return d.replace(year=year, month=month, day=day)


def _compute_end_date(details: dict):
    """Calcule la date de fin = date de début + durée (en mois), si possible."""
    if not details:
        return None
    start = None
    for k in ("date_debut", "date_embauche", "date_debut_periode",
              "date_livraison", "date_vente"):
        if details.get(k):
            start = details[k]
            break
    if not start:
        for k, v in details.items():
            if "debut" in k and v:
                start = v
                break
    months = None
    for k, v in details.items():
        if k.startswith("duree") and str(v).strip():
            digits = re.sub(r"[^\d]", "", str(v))
            if digits:
                months = int(digits)
                break
    d = _parse_date(start)
    if not d or not months:
        return None
    try:
        return _add_months(d, months).strftime("%d/%m/%Y")
    except Exception:
        return None


def build_contract_prompt(contract_type, details, clauses, references) -> str:
    refs  = "\n\n---\n\n".join(references)
    today = datetime.now().strftime("%d/%m/%Y")

    user_section = "\n--- معلومات العقد (يجب إدراجها كلها) ---\n"
    for key, value in (details or {}).items():
        if value:
            user_section += f"{key}: {value}\n"
    user_section += "\n---\n"

    clauses_section = ""
    if clauses:
        clauses_section = "\n--- البنود الإلزامية (يجب إنشاء مادة لكل بند) ---\n"
        for i, clause in enumerate(clauses, 1):
            clauses_section += f"المادة {i}: {clause}\n"
        clauses_section += "\n---\n"

    lieu = (details or {}).get("lieu_contrat", "") or (details or {}).get("mkan_tawkii", "")
    end_date = _compute_end_date(details)

    # Règle calculée : date de fin du contrat (fiable, calculée en Python)
    date_rule = ""
    if end_date:
        date_rule = (f"\n11. مدة العقد محسوبة بدقة: تاريخ النهاية هو {end_date}. "
                     f"اذكر تاريخ البداية وتاريخ النهاية معاً في مادة المدة، ولا تغيّر هذا الحساب.")

    rules = f"""
⚠️ قواعد إلزامية صارمة:
1. يجب كتابة العقد باللغة العربية الفصحى فقط
2. يجب إدراج جميع المعلومات المقدمة من المستخدم
3. يجب إنشاء مادة مستقلة لكل بند من البنود المذكورة أعلاه
4. ممنوع ترك أي قوسين [ ] أو حقول فارغة
5. ممنوع كتابة "سيتم تحديده" أو "يحدد لاحقاً"
6. ممنوع اختراع أي معلومات غير موجودة في بيانات المستخدم
7. يجب أن يكون العقد جاهزاً للتوقيع مباشرة
8. تاريخ التوقيع: {today}
9. مكان التوقيع: {lieu}
10. يجب تضمين توقيعات الأطراف في نهاية العقد{date_rule}

🚫 محظورات إضافية (احترامها إلزامي):
- ممنوع منعاً باتاً استعمال أي كلمة أجنبية (لاتينية أو فرنسية) داخل نص العقد. اكتب كل شيء بالعربية. الاستثناء الوحيد: الاختصارات القانونية الرسمية مثل SARL و SA و ICE، والأرقام والتواريخ.
- ممنوع تكرار نفس الجملة أو نفس الصياغة في أكثر من مادة. كل مادة يجب أن تحمل مضموناً مختلفاً وحقيقياً، وإلا فاحذفها أو ادمجها.
- ممنوع إنشاء مادتين بنفس المعنى (مثل تكرار "الغرض من الكراء" أو تكرار شروط الأداء). كل مادة فريدة.
- الضمانة (الوجيبة الضمانية / الكفالة) تُدفع **مرة واحدة فقط عند توقيع العقد**، وليست مبلغاً شهرياً. ممنوع كتابة أنها تُدفع كل شهر.
- عبارة موعد الأداء الشهري (مثل "في اليوم الأول من كل شهر") تُذكر **فقط** في مادة السومة الكرائية، وليس في مواد الضمانة أو الواجبات أو التحملات.
- في عقود الكراء: الإصلاحات الكبرى والبنيوية على عاتق **المكري**، أما الإصلاحات الكرائية الخفيفة الناتجة عن الاستعمال العادي فعلى عاتق **المكتري**. لا تحمّل المكتري كل الإصلاحات.
- استعمل صياغة قانونية متنوعة وواضحة، وتجنّب الجمل الميكانيكية المكررة.
"""
    return f"""أنت محام مغربي متخصص في صياغة العقود والوثائق القانونية، دقيق وصارم في الصياغة.

{rules}
{user_section}
{clauses_section}
المراجع القانونية:

{refs[:6000]}

المطلوب: أنشئ العقد الكامل من نوع {contract_type}، بالعربية الفصحى فقط، مع احترام كل البنود الإلزامية والمحظورات، جاهزاً للتوقيع. كل مادة يجب أن تكون فريدة المعنى وحقيقية.
"""


# Sigles légaux autorisés en lettres latines (ne déclenchent pas de relance)
_ALLOWED_LATIN = {
    "SARL", "SARLAU", "SAS", "SA", "SNC", "SCS", "SCA", "AU", "CA",
    "ICE", "RC", "IF", "CNSS", "TVA", "IS", "IR", "TP", "CIN", "RIB",
    "IBAN", "BIC", "SWIFT", "GSM", "SMIG", "SMAG", "PV", "TP", "AMO",
}


def _detect_invented_latin(text: str, details: dict) -> list:
    """Mots latins présents dans le texte MAIS absents des données saisies par
    l'utilisateur et hors sigles autorisés → probablement inventés par le modèle.
    (Les noms latins saisis dans le formulaire ne sont PAS comptés : ce sont des
    données utilisateur légitimes.)"""
    user_blob  = " ".join(str(v) for v in (details or {}).values()).lower()
    user_words = set(re.findall(r"[a-z]{2,}", user_blob))
    suspects = []
    for tok in re.findall(r"[A-Za-z]{3,}", text or ""):
        if tok.upper() in _ALLOWED_LATIN:
            continue
        if tok.lower() in user_words:        # vient d'un champ utilisateur → OK
            continue
        suspects.append(tok)
    # dédoublonne en gardant l'ordre
    seen, out = set(), []
    for s in suspects:
        if s.lower() not in seen:
            seen.add(s.lower()); out.append(s)
    return out


def _detect_duplicate_sentences(text: str) -> list:
    """Phrases d'au moins 6 mots répétées à l'identique dans le contrat."""
    parts = re.split(r"[.\n،؛:]+", text or "")
    seen, dups = set(), []
    for p in parts:
        s = re.sub(r"\s+", " ", p).strip()
        if len(s.split()) < 6:
            continue
        if s in seen and s not in dups:
            dups.append(s)
        seen.add(s)
    return dups


def validate_generated_contract(text: str, details: dict) -> list:
    """Renvoie la liste des problèmes (vide = OK)."""
    errors = []
    for pattern in EMPTY_FIELD_PATTERNS:
        if pattern in text:
            errors.append(f"حقل فارغ: {pattern}")
    if re.search(r'\[[^\]]+\]', text):
        errors.append("أقواس [ ] غير مملوءة")
    if len(text) < 500:
        errors.append("الوثيقة قصيرة جداً")
    # mots étrangers inventés (hors sigles et hors données utilisateur)
    latin = _detect_invented_latin(text, details)
    if latin:
        errors.append("ممنوع استعمال كلمات أجنبية؛ استبدل التالي بالعربية: "
                      + "، ".join(latin[:6]))
    # phrases répétées à l'identique
    dups = _detect_duplicate_sentences(text)
    if dups:
        errors.append("توجد جملة مكررة حرفياً، أعد صياغتها أو احذفها: "
                      + dups[0][:50])
    return errors


def fix_generated_contract(text: str, details: dict) -> str:
    fixed = text
    today = datetime.now().strftime("%d/%m/%Y")
    fixed = re.sub(r'[*\s]{4,}', today, fixed)
    for key, value in (details or {}).items():
        if value:
            for pat in [rf'\[{key}\]', rf'\[{key.upper()}\]', rf'\[{key.capitalize()}\]',
                        rf'{{{key}}}', rf'<{key}>']:
                fixed = re.sub(pat, str(value), fixed, flags=re.IGNORECASE)
    for msg in ["غير مذكور في المرجع", "non renseigné", "المعلومة غير موجودة",
                "سيتم تحديده", "يحدد لاحقا", "يملأ لاحقا", "****"]:
        fixed = re.sub(rf'[^\n]*{re.escape(msg)}[^\n]*\n?', '', fixed, flags=re.IGNORECASE)
    fixed = re.sub(r'\[[^\]]{3,50}\]', '', fixed)
    fixed = re.sub(r'\n{3,}', '\n\n', fixed)
    return fixed.strip()


# ─── PDF arabe soigné (LegalPDF — repris du notebook) ────────────────────────
def _rtl(text: str) -> str:
    return get_display(arabic_reshaper.reshape(text)) if text else ""


MARGIN_X = 18   # marges gauche/droite (plus aérées = plus lisible)

# Détection des titres d'articles ("المادة 1: ...") et lignes de signature
_RE_ARTICLE   = re.compile(r"^\s*(المادة|الفصل|البند)\b")
_RE_SIGNATURE = re.compile(r"^\s*(توقيع|تاريخ التوقيع|مكان التوقيع|حرر ب|حرر في)")


if _AR_PDF:
    class LegalPDF(FPDF):
        def __init__(self, title: str = "Mizan"):
            super().__init__()
            self.title = title
            self.set_margins(MARGIN_X, 12, MARGIN_X)
            self._font = "Amiri" if os.path.exists(AMIRI_REG) else "Helvetica"
            if os.path.exists(AMIRI_REG):
                try:
                    self.add_font("Amiri", "", AMIRI_REG, uni=True)
                except TypeError:
                    self.add_font("Amiri", "", AMIRI_REG)
            if os.path.exists(AMIRI_BOLD):
                try:
                    self.add_font("Amiri", "B", AMIRI_BOLD, uni=True)
                except TypeError:
                    self.add_font("Amiri", "B", AMIRI_BOLD)

        # ── En-tête (toutes les pages) : liseré vert, armoiries, marque, filet or ──
        def header(self):
            # fine bande verte en haut
            self.set_fill_color(*MIZAN_GREEN)
            self.rect(0, 0, self.w, 3.5, style="F")

            top = 8
            # armoiries du Royaume à gauche
            if os.path.exists(LOGO_PATH):
                try:
                    self.image(LOGO_PATH, x=MARGIN_X, y=top, w=13)
                except Exception:
                    pass

            # marque à droite (sens RTL)
            self.set_xy(0, top + 1)
            self.set_font(self._font, "B", 16)
            self.set_text_color(*MIZAN_GREEN)
            self.cell(self.w - MARGIN_X, 8, _rtl("ميزان"), align="R")

            self.set_xy(0, top + 10)
            self.set_font(self._font, "", 9)
            self.set_text_color(*GOLD_DARK)
            self.cell(self.w - MARGIN_X, 5, _rtl(self.title), align="R")

            # filet or sous l'en-tête
            self.set_draw_color(*GOLD)
            self.set_line_width(0.6)
            self.line(MARGIN_X, 26, self.w - MARGIN_X, 26)
            self.set_y(34)

        # ── Pied de page ──
        def footer(self):
            self.set_y(-16)
            self.set_draw_color(*GOLD)
            self.set_line_width(0.4)
            self.line(MARGIN_X, self.get_y(), self.w - MARGIN_X, self.get_y())
            self.set_y(-13)
            self.set_font(self._font, "", 8.5)
            self.set_text_color(*DARK_GRAY)
            self.set_x(MARGIN_X)
            self.cell(0, 6, _rtl("ميزان — Mizan · جميع الحقوق محفوظة"), align="L")
            self.set_x(0)
            self.set_text_color(*MIZAN_GREEN)
            self.cell(self.w - MARGIN_X, 6, _rtl(f"الصفحة {self.page_no()}"), align="R")

        # ── Titre principal du document (page 1) ──
        def doc_title(self, text: str):
            self.ln(3)
            self.set_font(self._font, "B", 20)
            self.set_text_color(*MIZAN_GREEN)
            self.cell(0, 12, _rtl(text), align="C")
            self.ln(13)
            cx = self.w / 2
            self.set_draw_color(*GOLD)
            self.set_line_width(0.9)
            self.line(cx - 28, self.get_y(), cx + 28, self.get_y())
            self.ln(9)

        # ── Titre d'article : barre vert clair + accent or ──
        def article_heading(self, text: str):
            self.ln(2)
            if self.get_y() > self.h - 40:   # éviter un titre seul en bas de page
                self.add_page()
            bar_h = 9
            x, y = MARGIN_X, self.get_y()
            usable = self.w - 2 * MARGIN_X
            self.set_fill_color(*MIZAN_50)
            self.rect(x, y, usable, bar_h, style="F")
            self.set_fill_color(*GOLD)
            self.rect(self.w - MARGIN_X - 2.5, y, 2.5, bar_h, style="F")  # accent or à droite
            self.set_xy(x, y)
            self.set_font(self._font, "B", 12.5)
            self.set_text_color(*MIZAN_DARK)
            self.cell(usable - 5, bar_h, _rtl(text.strip()), align="R")
            self.ln(bar_h + 3)

        # ── Bloc signature (espacement + gras) ──
        def signature_line(self, text: str):
            self.ln(2)
            self.set_font(self._font, "B", 11.5)
            self.set_text_color(*INK)
            self.cell(0, 7, _rtl(text.strip()), align="R")
            self.ln(8)

        # ── Paragraphe courant ──
        def chapter_body(self, text: str):
            self.set_font(self._font, "", 12)
            self.set_text_color(*INK)
            text = text.strip()
            if not text:
                return
            for line in self._wrap_arabic_text(text, self.w - 2 * MARGIN_X):
                self.set_x(MARGIN_X)
                self.cell(self.w - 2 * MARGIN_X, 7.5, _rtl(line), align="R")
                self.ln(7)
            self.ln(3)

        def _wrap_arabic_text(self, text: str, max_width: float) -> list:
            lines, current = [], ""
            for word in text.split():
                test = (current + " " + word) if current else word
                if self.get_string_width(test) <= max_width:
                    current = test
                else:
                    if current:
                        lines.append(current)
                    current = word
            if current:
                lines.append(current)
            return lines or [text]

        # ── Aiguillage d'une ligne vers le bon style ──
        def render_line(self, line: str, doc_title_text: str):
            stripped = line.strip()
            if not stripped:
                return
            # on saute la ligne qui répète le titre du document
            if doc_title_text and stripped == doc_title_text.strip():
                return
            if _RE_ARTICLE.match(stripped):
                self.article_heading(stripped)
            elif _RE_SIGNATURE.match(stripped):
                self.signature_line(stripped)
            else:
                self.chapter_body(stripped)


_TITLE_STARTS = ("عقد", "اتفاقية", "نظام", "تصريح", "إنذار", "بيان", "نموذج")


def _strip_kashida(text: str) -> str:
    """Supprime les tatweel/kashidas décoratifs (ـ) — purement esthétiques."""
    return re.sub("\u0640+", "", text or "")


def generate_pdf_arabic(title: str, content: str) -> str:
    """Génère un PDF arabe soigné (logo, structure, couleurs Mizan)."""
    content = _strip_kashida(content)                 # enlève tous les kashidas
    clean_title = _strip_kashida(title).strip()

    pdf = LegalPDF(title=clean_title)
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=22)

    # Le grand titre = le TYPE choisi (toujours propre et unique)
    pdf.doc_title(clean_title)

    # On saute les lignes-titre répétées en tête (ex: « عقد كراء سكني »,
    # « عقد كراء شقة », « نموذج عقد ... ») tant qu'on n'a pas atteint le corps.
    in_body = False
    for raw in content.split("\n"):
        s = raw.strip()
        if not s:
            continue
        if not in_body:
            if _RE_ARTICLE.match(s) or s.startswith("بين") or s.startswith("في يوم") \
               or s.startswith("بمقتضى") or s.startswith("حرر"):
                in_body = True
            elif any(s.startswith(p) for p in _TITLE_STARTS) and len(s.split()) <= 8:
                continue   # ligne-titre dupliquée → ignorée
        pdf.render_line(s, clean_title)

    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe = re.sub(r"[^\w]", "_", clean_title)[:25] or "contrat"
    filename = f"contrat_{safe}_{os.urandom(4).hex()}.pdf"
    pdf.output(os.path.join(UPLOAD_DIR, filename))
    return filename


def _text_fallback(title: str, content: str) -> str:
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    safe = re.sub(r"[^\w]", "_", title)[:25] or "contrat"
    filename = f"contrat_{safe}_{os.urandom(4).hex()}.txt"
    with open(os.path.join(UPLOAD_DIR, filename), "w", encoding="utf-8") as f:
        f.write(f"{title}\n{'='*50}\n\n{content}")
    return filename


def make_pdf(title: str, content: str, details: dict) -> str:
    """PDF arabe soigné si possible, sinon repli texte (préserve l'arabe)."""
    final = content
    for k, v in (details or {}).items():
        final = final.replace("{" + k + "}", str(v))
    if _AR_PDF and os.path.exists(AMIRI_REG):
        try:
            return generate_pdf_arabic(title, final)
        except Exception as e:
            print(f"[ContractService] PDF arabe échoué: {e}")
    return _text_fallback(title, final)


# ─── Service ─────────────────────────────────────────────────────────────────
class ContractService:
    def __init__(self):
        self.client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))

    # ── conservé tel quel ──
    def create(self, user_id: int, title: str, content: str = None,
               contract_type: str = None) -> Contract:
        contract = Contract(user_id=user_id, title=title, content=content,
                            contract_type=contract_type, status="draft")
        db.session.add(contract)
        db.session.commit()
        return contract

    # ── conservé tel quel ──
    def get_all_templates(self) -> list:
        try:
            json_path = os.path.normpath(
                os.path.join(os.path.dirname(__file__), "../../data/maliyum_data.json"))
            with open(json_path, "r", encoding="utf-8") as f:
                all_data = json.load(f)
            templates = []
            for item in all_data:
                content = item.get("المحتوى_الكامل", "")
                fields  = list(set(re.findall(r"\{(.*?)\}", content)))
                templates.append({
                    "title":    item.get("العنوان", "بدون عنوان"),
                    "fields":   fields,
                    "category": item.get("التصنيفات", ""),
                    "url":      item.get("الرابط", ""),
                    "download": item.get("روابط_التحميل", ""),
                })
            return templates
        except Exception as e:
            print(f"[ContractService] Error templates: {e}")
            return []

    # ── liste des 22 types + champs (pour le formulaire frontend) ──
    def list_types(self) -> list:
        return [{"name": n, "fields": d.get("fields", []), "clauses": d.get("clauses", [])}
                for n, d in CONTRACT_TYPES.items()]

    # ── génération AMÉLIORÉE (moteur v12) — même signature qu'avant ──
    def generate(self, user_id: int, contract_type: str, details: dict) -> Contract:
        details = details or {}
        # Résout le type via mots-clés (le frontend envoie souvent le TITRE arabe)
        resolved = detect_contract_type(contract_type)
        cfg      = CONTRACT_TYPES.get(resolved) if resolved else None
        # Clauses = source UNIQUE partagée avec le Score (base + universelles).
        # -> le contrat généré contient ce que le Score vérifie.
        clauses  = clauses_for(resolved or contract_type)
        # nom de type lisible pour le prompt
        type_label = resolved or contract_type

        # 1. références via le moteur RAG (ancien OU nouveau)
        #    best_title = titre du doc RAG retrouvé → sert UNIQUEMENT en interne.
        #    Le titre AFFICHÉ doit être le TYPE choisi (ex: « عقد عمل »), sinon
        #    l'en-tête montre le titre d'une référence sans rapport.
        references, best_title = get_references(contract_type, k=5)
        if not references:
            references = ["استند إلى القواعد العامة للقانون المغربي."]
        title_to_use = type_label

        # 2. génération avec prompt v12 + retry + correction (type résolu)
        document = self._generate_text(type_label, details, clauses, references)

        # 3. PDF arabe correct (ou repli texte)
        try:
            file_name = make_pdf(title_to_use, document, details)
        except Exception as e:
            print(f"[ContractService] PDF error: {e}")
            file_name = None

        # 4. sauvegarde en base
        contract = Contract(user_id=user_id, title=title_to_use, content=document,
                            contract_type=contract_type, file_name=file_name,
                            status="generated")
        db.session.add(contract)
        db.session.commit()
        return contract

    def re_render(self, user_id: int, contract_id: int,
                  content: str, title: str = None):
        """Régénère le PDF à partir d'un texte ÉDITÉ par l'avocat (sans IA).
        Met à jour le contenu et le fichier. Renvoie (contract, erreur)."""
        contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()
        if not contract:
            return None, "Contrat introuvable"
        content = (content or "").strip()
        if len(content) < 30:
            return None, "Le texte du contrat est trop court"

        new_title = (title or contract.title or "عقد").strip()
        try:
            file_name = make_pdf(new_title, content, {})   # pas d'IA, simple rendu
        except Exception as e:
            print(f"[ContractService] re_render PDF error: {e}")
            return None, "Échec de la régénération du PDF"

        contract.title     = new_title
        contract.content   = content
        contract.file_name = file_name
        contract.status    = "edited"
        db.session.commit()
        return contract, None

    def _generate_text(self, contract_type, details, clauses, references) -> str:
        last, issues = "", []
        for attempt in range(MAX_RETRY + 1):
            prompt = build_contract_prompt(contract_type, details, clauses, references)
            # Sur relance : on indique au modèle précisément quoi corriger
            if issues:
                prompt += ("\n\n⚠️ النسخة السابقة بها أخطاء التالية، صحّحها كلها "
                           "وأعد كتابة العقد كاملاً:\n- " + "\n- ".join(issues))
            try:
                resp = self.client.chat.completions.create(
                    model=MODEL,
                    temperature=min(0.1 + 0.25 * attempt, 0.6),  # varie à chaque essai
                    max_tokens=4000,
                    messages=[{"role": "user", "content": prompt}])
                last = (resp.choices[0].message.content or "").strip()
            except Exception as e:
                print(f"[ContractService] Groq error: {e} — fallback ai_service")
                try:
                    return ai_service.generate_contract(contract_type, details)
                except Exception:
                    return last or "تعذّر توليد العقد. يرجى المحاولة لاحقاً."
            last   = fix_generated_contract(last, details)
            issues = validate_generated_contract(last, details)
            if not issues:
                return last
            print(f"[ContractService] essai {attempt+1}: {len(issues)} problème(s) → relance")
        return last   # on renvoie la meilleure version obtenue

    # ── conservé tel quel ──
    def analyze(self, contract_id: int, user_id: int) -> tuple:
        contract = Contract.query.filter_by(id=contract_id, user_id=user_id).first()
        if not contract:
            return None, "Contrat introuvable"
        if not contract.content:
            return None, "المحتوى غير موجود للتحليل"
        try:
            result = ai_service.analyze_contract(contract.content)
            contract.ai_analysis = json.dumps(result, ensure_ascii=False)
            contract.status      = "analyzed"
            db.session.commit()
            return result, None
        except Exception as e:
            print(f"[ContractService] analyze error: {e}")
            return None, str(e)


contract_service = ContractService()