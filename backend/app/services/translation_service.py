import os
from groq import Groq


class TranslationService:
    """
    Traducteur juridique spécialisé arabe ⇄ français pour le droit marocain.
    Préserve la terminologie juridique exacte (contrats, décisions, lois).
    """

    def __init__(self):
        api_key = os.environ.get("GROQ_API_KEY", "")
        if not api_key:
            print("[TranslationService] ⚠️  GROQ_API_KEY manquante dans .env")
        self.client = Groq(api_key=api_key)
        self.model = "llama-3.3-70b-versatile"

    def translate(self, text: str, target: str = "fr") -> str:
        """
        target = 'fr' (vers le français) ou 'ar' (vers l'arabe).
        """
        text = (text or "").strip()
        if not text:
            return ""

        if target == "ar":
            target_label = "l'arabe juridique marocain"
        else:
            target_label = "le français juridique marocain"

        system = (
            "أنت مترجم قانوني محترف متخصص في القانون المغربي، تترجم بين العربية "
            "والفرنسية. مهمتك ترجمة النصوص القانونية (العقود، الأحكام، النصوص "
            "التشريعية) مع الحفاظ التام على دقة المصطلحات القانونية المغربية.\n"
            "Tu es un traducteur juridique professionnel spécialisé dans le droit "
            "marocain, traduisant entre l'arabe et le français.\n"
            "Règles strictes :\n"
            "1. Préserve la terminologie juridique exacte (ne paraphrase jamais un terme de loi).\n"
            "2. Garde les références d'articles, de lois et de numéros à l'identique.\n"
            "3. Conserve le sens juridique précis, pas une traduction littérale approximative.\n"
            "4. Réponds UNIQUEMENT avec la traduction, sans commentaire ni explication."
        )

        prompt = f"Traduis le texte juridique suivant vers {target_label} :\n\n{text}"

        try:
            response = self.client.chat.completions.create(
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": prompt},
                ],
                model=self.model,
                temperature=0.1,
                max_tokens=2000,
            )
            return (response.choices[0].message.content or "").strip()
        except Exception as e:
            print(f"[TranslationService] Groq error: {e}")
            raise


translation_service = TranslationService()