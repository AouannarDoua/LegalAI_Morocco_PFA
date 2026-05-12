import os
from openai import OpenAI


class AIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY", ""))
        self.model = "gpt-4o"

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
        )
        return response.choices[0].message.content

    def analyze_contract(self, contract_text: str) -> dict:
        prompt = f"""Analyse ce contrat marocain et fournis:
1. Un résumé des clauses principales
2. Les risques potentiels
3. Les points à négocier
4. La conformité avec le droit marocain

Contrat:
{contract_text}

Réponds en JSON avec les clés: summary, risks, negotiation_points, compliance_notes"""
        response = self.chat([{"role": "user", "content": prompt}])
        try:
            import json
            return json.loads(response)
        except Exception:
            return {"summary": response, "risks": [], "negotiation_points": [], "compliance_notes": ""}

    def generate_contract(self, contract_type: str, details: dict) -> str:
        prompt = f"""Génère un contrat de type '{contract_type}' conforme au droit marocain.
Détails: {details}
Inclus toutes les clauses obligatoires selon la loi marocaine."""
        return self.chat([{"role": "user", "content": prompt}])


ai_service = AIService()
