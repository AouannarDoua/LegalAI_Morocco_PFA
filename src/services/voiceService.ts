import { BASE_URL, tokenStorage, ApiError } from "./apiClient";

// ─── Types ──────────────────────────────────────────────────────────────────
export type VoiceLang = "fr-FR" | "ar-MA";

export interface TranscriptionResult {
  text: string;
  language: string;
}

/** Convertit le code de langue UI (fr-FR / ar-MA) en ISO-639-1 (fr / ar). */
export function langToIso(lang: VoiceLang): "fr" | "ar" {
  return lang.startsWith("ar") ? "ar" : "fr";
}

// ─── Voice Service ────────────────────────────────────────────────────────────

// Cache audio en mémoire : éviter de rappeler Gemini (quota 429) quand on
// réécoute le même texte. Clé = langue + texte.
const audioCache = new Map<string, Blob>();
const cacheKey = (text: string, lang: VoiceLang) => `${langToIso(lang)}::${text}`;

export const voiceService = {
  /**
   * Speech-to-Text — envoie l'audio enregistré au backend (Groq Whisper)
   * et récupère le texte transcrit.
   */
  async transcribe(blob: Blob, lang: VoiceLang): Promise<TranscriptionResult> {
    const token = tokenStorage.get();
    const form = new FormData();
    // l'extension aide Groq à reconnaître le conteneur
    const ext = blob.type.includes("ogg") ? "ogg"
      : blob.type.includes("mp4") ? "mp4"
      : "webm";
    form.append("audio", blob, `recording.${ext}`);
    form.append("language", langToIso(lang));

    const res = await fetch(`${BASE_URL}/voice/transcribe`, {
      method: "POST",
      // ⚠️ ne PAS fixer Content-Type : le navigateur ajoute la boundary multipart
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    });

    let json: any;
    try {
      json = await res.json();
    } catch {
      throw new ApiError(res.status, "Réponse invalide du serveur");
    }

    if (!res.ok || !json.success) {
      throw new ApiError(res.status, json.message || "Erreur de transcription");
    }
    return json.data as TranscriptionResult;
  },

  /**
   * Text-to-Speech — demande au backend (Groq) un audio de la réponse.
   * Renvoie un Blob audio, ou `null` si le backend ne supporte pas la langue
   * (ex. français → 422) afin que l'appelant bascule sur le navigateur.
   */
  async speak(text: string, lang: VoiceLang): Promise<Blob | null> {
    const key = cacheKey(text, lang);
    const cached = audioCache.get(key);
    if (cached) return cached;   // ✅ pas de nouvel appel Gemini

    const token = tokenStorage.get();
    const res = await fetch(`${BASE_URL}/voice/speak`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ text, lang: langToIso(lang) }),
    });

    // 422 = backend indisponible (quota/repli) → repli navigateur
    if (res.status === 422) return null;

    if (!res.ok) {
      let msg = "Erreur de synthèse vocale";
      try {
        const j = await res.json();
        msg = j.message || msg;
      } catch { /* corps binaire ou vide */ }
      throw new ApiError(res.status, msg);
    }

    const blob = await res.blob();
    audioCache.set(key, blob);   // mémorise pour les réécoutes
    return blob;
  },
};

export default voiceService;