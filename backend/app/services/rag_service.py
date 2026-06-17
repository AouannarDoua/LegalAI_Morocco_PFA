import os
import json
from groq import Groq
from rank_bm25 import BM25Okapi
from dotenv import load_dotenv

load_dotenv()


class MockDocument:
    """
    هيكلة موحدة — page_content و metadata —
    كيتسناها contract_service و chat route.
    """
    def __init__(self, content: str, metadata: dict):
        self.page_content = content
        self.metadata     = metadata


class RAGService:
    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            print("[RAGService] ⚠️  GROQ_API_KEY manquante dans .env")

        self.client     = Groq(api_key=api_key)
        self.model_name = "llama-3.3-70b-versatile"
        self.documents  = []
        self.bm25       = None
        self._prepare_knowledge_base()

    # ─── Chargement des données ───────────────────────────────────────────────

    def _prepare_knowledge_base(self):
        """
        قراءة maliyum_data.json وبناء محرك BM25.
        """
        # ✅ Fix: مسار صحيح — backend/data/maliyum_data.json
        base_dir  = os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__)
        )))
        json_path = os.path.join(base_dir, 'data', 'maliyum_data.json')
        print(f"[RAGService] Loading data from: {json_path}")

        try:
            with open(json_path, 'r', encoding='utf-8') as f:
                all_data = json.load(f)

            tokenized_corpus = []
            for item in all_data:
                self.documents.append(item)
                title   = item.get('العنوان', '')
                content = item.get('المحتوى_الكامل', item.get('المحتوى', ''))
                tokenized_corpus.append(f"{title} {content}".split())

            if tokenized_corpus:
                self.bm25 = BM25Okapi(tokenized_corpus)
                print(f"[RAGService] ✅ {len(self.documents)} documents chargés")

        except FileNotFoundError:
            print(f"[RAGService] ❌ Fichier introuvable: {json_path}")
        except Exception as e:
            print(f"[RAGService] ❌ Erreur chargement: {e}")

    # ─── Retrieval ────────────────────────────────────────────────────────────

    def retrieve(self, query: str, top_n: int = 1) -> "MockDocument | None":
        """
        ✅ Fix: كيرجع MockDocument مباشرة مع metadata كاملة.
        """
        if not self.bm25 or not self.documents:
            return None

        tokenized_query = query.split()
        results         = self.bm25.get_top_n(tokenized_query, self.documents, n=top_n)

        if not results:
            return None

        best = results[0]
        return MockDocument(
            content=best.get('المحتوى_الكامل', best.get('المحتوى', '')),
            metadata={
                "title":    best.get('العنوان', ''),
                "url":      best.get('الرابط', ''),
                "category": best.get('التصنيفات', ''),
                "download": best.get('روابط_التحميل', ''),
            }
        )

    # ─── RAG complet ──────────────────────────────────────────────────────────

    def get_legal_answer(self, user_query: str, lang: str = "ar") -> dict:
        """
        Retrieval + Generation — يرجع answer + source_documents.
        lang = 'ar' (arabe, défaut) ou 'fr' (français).
        """
        source_doc = self.retrieve(user_query)

        if source_doc:
            context = source_doc.page_content
            title   = source_doc.metadata.get('title', '')
        else:
            context = "لم يتم العثور على نموذج مطابق في قاعدة البيانات."
            title   = "غير معروف"

        if lang == "fr":
            lang_rule = ("3. Réponds en FRANÇAIS, dans un style clair et structuré "
                         "(traduis fidèlement la terminologie juridique).")
            not_found = "4. Si la question n'est pas couverte, dis : \"Cette information n'est pas disponible dans nos documents.\""
        else:
            lang_rule = "3. أجب بالعربية بأسلوب واضح ومنظم"
            not_found = "4. إذا لم يكن السؤال مغطى، قل: \"هذه المعلومة غير متوفرة في وثائقنا\""

        prompt = f"""أنت مساعد قانوني مغربي خبير في صياغة العقود والاستشارات القانونية.

بناءً على النموذج المرجعي التالي من قاعدة البيانات القانونية Maliyum:
العنوان: {title}
المحتوى: {context}

طلب المستخدم: {user_query}

قواعد الإجابة / Règles:
1. استند فقط على المحتوى المرجعي أعلاه
2. اذكر رقم القانون أو المادة إذا وردت في المحتوى
{lang_rule}
{not_found}
"""

        try:
            response = self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=self.model_name,
                temperature=0.1,      # ✅ 0.1 للدقة القانونية
                max_tokens=1500,
            )
            answer = response.choices[0].message.content

        except Exception as e:
            print(f"[RAGService] Groq error: {e}")
            answer = "وقع خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة لاحقاً."

        return {
            "answer":           answer,
            "source_documents": [source_doc] if source_doc else [],
        }


rag_service = RAGService()