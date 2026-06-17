import { BASE_URL, tokenStorage, ApiError } from "./apiClient";

export type TranslateTarget = "fr" | "ar";

export interface TranslationResult {
  translation: string;
  target: TranslateTarget;
}

/** Détecte si un texte est majoritairement en arabe. */
export function isArabic(text: string): boolean {
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (text.match(/[A-Za-zÀ-ÿ]/g) || []).length;
  return arabic >= latin;
}

export const translationService = {
  async translate(text: string, target: TranslateTarget): Promise<TranslationResult> {
    const token = tokenStorage.get();
    const res = await fetch(`${BASE_URL}/translate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, target }),
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new ApiError(res.status, "Réponse invalide du serveur");
    }
    if (!res.ok || !json.success) {
      throw new ApiError(res.status, json.message || "Erreur de traduction");
    }
    return json.data as TranslationResult;
  },
};

export default translationService;