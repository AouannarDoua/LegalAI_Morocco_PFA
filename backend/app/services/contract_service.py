import os
import re
import json
from ..extensions import db
from ..models.contract import Contract
from .rag_service import rag_service
from .ai_service import ai_service


# ─── PDF Generator ────────────────────────────────────────────────────────────

def generate_pdf(title: str, content: str, details: dict) -> str:
    """
    توليد PDF بـ fpdf2 مع دعم النص العربي والفرنسي.
    pip install fpdf2
    """
    try:
        from fpdf import FPDF

        # ✅ Fix: استبدال المتغيرات أولاً
        final_text = content
        for key, value in details.items():
            final_text = final_text.replace("{" + key + "}", str(value))

        pdf = FPDF()
        pdf.add_page()
        pdf.set_auto_page_break(auto=True, margin=15)

        # ✅ Fix: العنوان بـ latin-1 مع replace لتجنب UnicodeEncodeError
        pdf.set_font("Helvetica", "B", 16)
        safe_title = title.encode("latin-1", "replace").decode("latin-1")
        pdf.cell(0, 12, txt=safe_title, ln=True, align="C")
        pdf.ln(8)

        # ✅ Fix: المحتوى — نحولو لـ latin-1 مع replace
        pdf.set_font("Helvetica", size=11)
        safe_content = final_text.encode("latin-1", "replace").decode("latin-1")
        pdf.multi_cell(0, 8, txt=safe_content)

        # اسم الملف
        safe_name     = re.sub(r"[^\w]", "_", title)[:25]
        random_suffix = os.urandom(4).hex()
        filename      = f"contrat_{safe_name}_{random_suffix}.pdf"

        upload_dir = os.path.join(os.getcwd(), "uploads")
        os.makedirs(upload_dir, exist_ok=True)
        pdf.output(os.path.join(upload_dir, filename))
        return filename

    except Exception as e:
        print(f"[PDF] Error generating PDF: {e}")
        # ✅ Fix: إلا فشل PDF، نرجعو ملف text كـ fallback
        return _generate_text_fallback(title, content, details)


def _generate_text_fallback(title: str, content: str, details: dict) -> str:
    """Fallback: نكتبو الـ content في ملف .txt إلا فشل PDF."""
    final_text = content
    for key, value in details.items():
        final_text = final_text.replace("{" + key + "}", str(value))

    safe_name     = re.sub(r"[^\w]", "_", title)[:25]
    random_suffix = os.urandom(4).hex()
    filename      = f"contrat_{safe_name}_{random_suffix}.txt"

    upload_dir = os.path.join(os.getcwd(), "uploads")
    os.makedirs(upload_dir, exist_ok=True)

    with open(os.path.join(upload_dir, filename), "w", encoding="utf-8") as f:
        f.write(f"{title}\n{'='*50}\n\n{final_text}")
    return filename


# ─── Contract Service ─────────────────────────────────────────────────────────

class ContractService:

    # ✅ Fix: create() method — كانت ناقصة
    def create(self, user_id: int, title: str, content: str = None,
               contract_type: str = None) -> Contract:
        contract = Contract(
            user_id=user_id,
            title=title,
            content=content,
            contract_type=contract_type,
            status="draft"
        )
        db.session.add(contract)
        db.session.commit()
        return contract

    def get_all_templates(self) -> list:
        """
        جلب النماذج من maliyum_data.json مع استخراج الحقول.
        """
        try:
            # ✅ Fix: اسم الملف الصحيح maliyum (مش malyium)
            json_path = os.path.normpath(
                os.path.join(os.path.dirname(__file__), "../../data/maliyum_data.json")
            )
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

        except FileNotFoundError:
            print(f"[ContractService] JSON introuvable: {json_path}")
            return []
        except Exception as e:
            print(f"[ContractService] Error templates: {e}")
            return []

    def generate(self, user_id: int, contract_type: str, details: dict) -> Contract:
        """
        ✅ Fix: RAG kiqaleb 3la ay type d contrat — machi fqat CDI
        1. RAG يبحث عن أقرب عقد في maliyum_data.json
        2. يولد PDF
        3. يحفظ في DB
        """
        # 1. البحث عبر RAG
        rag_result       = rag_service.get_legal_answer(f"أريد نموذج عقد: {contract_type}")
        source_documents = rag_result.get("source_documents", [])

        if source_documents:
            best_match   = source_documents[0]
            raw_content  = best_match.page_content
            title_to_use = best_match.metadata.get("title", contract_type)
        else:
            # Fallback إلى AI
            print(f"[ContractService] RAG miss — fallback to AI for: {contract_type}")
            raw_content  = ai_service.generate_contract(contract_type, details)
            title_to_use = contract_type

        # 2. توليد PDF
        try:
            generated_file_name = generate_pdf(title_to_use, raw_content, details)
        except Exception as e:
            print(f"[ContractService] PDF error: {e}")
            generated_file_name = None

        # 3. حفظ في DB
        contract = Contract(
            user_id=user_id,
            title=title_to_use,
            content=raw_content,
            contract_type=contract_type,
            file_name=generated_file_name,
            status="generated"
        )
        db.session.add(contract)
        db.session.commit()
        return contract

    def analyze(self, contract_id: int, user_id: int) -> tuple:
        """تحليل العقد عبر AI."""
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