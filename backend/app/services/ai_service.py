import os
import json
from groq import Groq


class AIService:
    """
    Service IA principal (chat + analyse + génération).
    ✅ Bascule OpenAI → Groq : on réutilise la clé GROQ_API_KEY déjà configurée
    pour le reste de l'app. Corrige le « Connection error » sur l'analyse texte
    (qui venait de l'absence de clé OpenAI).
    """

    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            print("[AIService] ⚠️  GROQ_API_KEY manquante dans .env")
        self.client = Groq(api_key=api_key)
        # modèle rapide et performant, déjà utilisé ailleurs dans le projet
        self.model = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

    def chat(self, messages: list, system_prompt: str = None) -> str:
        system = system_prompt or (
            "Tu es un assistant juridique expert en droit marocain. "
            "Tu aides les utilisateurs à comprendre leurs droits, analyser des contrats, "
            "et naviguer dans le système judiciaire marocain."
        )
        api_messages = [{"role": "system", "content": system}] + messages
        response = self.client.chat.completions.create(
            model=self.model,
            messages=api_messages,
            max_tokens=2000,
            temperature=0.3,
        )
        return response.choices[0].message.content

    @staticmethod
    def _retrieve_legal_context(text: str, k: int = 3) -> str:
        """Récupère, via le MÊME moteur RAG que le chat/Score, les extraits de lois
        marocaines les plus pertinents pour enrichir l'analyse. Tolérant aux pannes :
        en cas d'erreur, renvoie "" et l'analyse continue sans contexte."""
        try:
            from .rag_service import rag_service
            docs = rag_service.retrieve_many(text[:1500], top_n=k)
            parts = []
            for d in docs:
                title   = (getattr(d, "metadata", {}) or {}).get("title", "")
                snippet = (getattr(d, "page_content", "") or "")[:500].strip()
                if snippet:
                    parts.append(f"• [{title}] {snippet}")
            return "\n".join(parts)
        except Exception as e:
            print(f"[AIService] RAG context error: {e}")
            return ""

    def analyze_contract(self, contract_text: str) -> dict:
        legal_context = self._retrieve_legal_context(contract_text)
        contexte_bloc = (
            f"\nمراجع قانونية مغربية ذات صلة (استند إليها في تحليلك):\n{legal_context}\n"
            if legal_context else ""
        )
        prompt = f"""حلّل هذا العقد المغربي وأعطِ تحليلاً قانونياً دقيقاً وفق القانون المغربي.
{contexte_bloc}
العقد:
{contract_text}

أجب حصرياً بصيغة JSON صالحة بالمفاتيح التالية فقط:
- "summary": نص ملخّص واضح للعقد (سلسلة نصية واحدة).
- "score": عدد صحيح من 0 إلى 100 يقيس صلابة العقد ومدى اكتماله قانونياً.
- "risks": مصفوفة من السلاسل النصية، كل عنصر جملة واحدة تصف خطراً.
- "negotiation_points": مصفوفة من السلاسل النصية، كل عنصر نقطة قابلة للتفاوض.
- "strengths": مصفوفة من السلاسل النصية تصف نقاط القوة.
- "compliance_notes": نص واحد حول مدى مطابقة العقد للقانون المغربي.

مهم: كل عنصر داخل المصفوفات يجب أن يكون نصاً بسيطاً (string) وليس كائناً (object)."""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "أنت محامٍ مغربي خبير. تجيب دائماً بصيغة JSON صالحة فقط."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=2000,
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            raw = json.loads(response.choices[0].message.content)
            return self._normalize_analysis(raw)
        except Exception as e:
            print(f"[AIService] analyze error: {e}")
            # repli : on renvoie au moins un résumé textuel
            try:
                txt = self.chat([{"role": "user", "content": prompt}])
            except Exception:
                txt = "تعذّر تحليل العقد حالياً."
            return self._normalize_analysis({"summary": txt})

    # ──────────────────────────────────────────────────────────────────────────
    # ✅ Normalisation : garantit que le frontend reçoit TOUJOURS la même forme
    #    (évite la page blanche quand le modèle renvoie des objets au lieu de
    #     chaînes, ou oublie une clé). Tout est coercé en str / list[str] / int.
    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def _to_text(value) -> str:
        """Transforme n'importe quelle valeur (str, dict, list, None) en texte lisible."""
        if value is None:
            return ""
        if isinstance(value, str):
            return value.strip()
        if isinstance(value, (int, float, bool)):
            return str(value)
        if isinstance(value, dict):
            # on assemble les valeurs textuelles des champs courants
            parts = []
            for k in ("titre", "title", "clause", "point", "description",
                      "risque", "niveau", "recommandation", "commentaire", "texte", "label"):
                if k in value and value[k]:
                    parts.append(str(value[k]).strip())
            if not parts:
                parts = [str(v).strip() for v in value.values() if v not in (None, "")]
            return " — ".join(dict.fromkeys(parts))  # dédoublonne en gardant l'ordre
        if isinstance(value, list):
            return " ".join(AIService._to_text(v) for v in value if v not in (None, ""))
        return str(value)

    @classmethod
    def _to_text_list(cls, value) -> list:
        """Transforme la valeur en liste de chaînes non vides."""
        if value is None:
            return []
        if isinstance(value, str):
            value = [value]
        elif not isinstance(value, list):
            value = [value]
        out = []
        for item in value:
            txt = cls._to_text(item)
            if txt:
                out.append(txt)
        return out

    @classmethod
    def _normalize_analysis(cls, raw: dict) -> dict:
        if not isinstance(raw, dict):
            raw = {"summary": cls._to_text(raw)}

        summary = cls._to_text(raw.get("summary") or raw.get("resume") or raw.get("ملخص"))
        risks = cls._to_text_list(raw.get("risks") or raw.get("risques"))
        negotiation = cls._to_text_list(
            raw.get("negotiation_points") or raw.get("points_negociation") or raw.get("negotiation")
        )
        strengths = cls._to_text_list(raw.get("strengths") or raw.get("points_forts"))
        compliance = cls._to_text(raw.get("compliance_notes") or raw.get("compliance") or raw.get("conformite"))

        # Score : on prend celui du modèle, sinon on l'estime à partir du contenu
        score = raw.get("score")
        try:
            score = int(round(float(score)))
        except (TypeError, ValueError):
            score = None
        if score is None:
            # heuristique de repli : 90 puis -8 par risque, -3 par point à négocier
            score = 90 - 8 * len(risks) - 3 * len(negotiation)
        score = max(0, min(100, score))

        if score >= 75:
            niveau = "ممتاز"
        elif score >= 50:
            niveau = "جيد"
        elif score >= 25:
            niveau = "متوسط"
        else:
            niveau = "ضعيف"

        return {
            "summary": summary,
            "score": score,
            "niveau": niveau,
            "risks": risks,
            "negotiation_points": negotiation,
            "strengths": strengths,
            "compliance_notes": compliance,
        }

    def generate_contract(self, contract_type: str, details: dict) -> str:
        prompt = f"""Génère un contrat de type '{contract_type}' conforme au droit marocain.
Détails: {details}
Inclus toutes les clauses obligatoires selon la loi marocaine."""
        return self.chat([{"role": "user", "content": prompt}])


ai_service = AIService()
