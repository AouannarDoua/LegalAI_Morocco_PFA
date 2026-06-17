import { useCallback, useEffect, useRef, useState } from "react";
import voiceService, { langToIso, type VoiceLang } from "../services/voiceService";
import { ApiError } from "../services/apiClient";

export type { VoiceLang };

// ─── Options ──────────────────────────────────────────────────────────────────
export interface UseVoiceOptions {
  /** Appelé avec le texte final transcrit par le backend. */
  onFinalTranscript?: (text: string) => void;
  /** Langue par défaut. */
  defaultLang?: VoiceLang;
}

export interface UseVoiceReturn {
  // Capacités
  recognitionSupported: boolean;   // micro + MediaRecorder dispo
  synthesisSupported: boolean;     // backend Groq ou navigateur
  // Reconnaissance (Speech-to-Text via backend)
  listening: boolean;              // enregistrement micro en cours
  transcribing: boolean;           // envoi/transcription backend en cours
  interimText: string;             // conservé pour compat (toujours "")
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  // Synthèse (Text-to-Speech via backend + repli navigateur)
  speaking: boolean;
  speakLoading: boolean;           // entre le clic et le début réel de l'audio
  speak: (text: string, lang?: VoiceLang) => void;
  cancelSpeak: () => void;
  // Langue
  lang: VoiceLang;
  setLang: (l: VoiceLang) => void;
  // Erreurs
  error: string | null;
}

// Choisit un type MIME supporté par MediaRecorder (webm prioritaire, sinon mp4).
function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/ogg;codecs=opus",
    "audio/mp4",
  ];
  for (const t of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(t)) return t;
    } catch { /* noop */ }
  }
  return "";
}

// Retire le Markdown pour que la voix ne lise pas « astérisque astérisque ».
function stripMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_~]+/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*>\s?/gm, "")
    .replace(/^\s*[-+•]\s+/gm, "")
    .replace(/^\s*\d+[.)]\s+/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

/**
 * Assistant vocal branché sur le backend Flask (Groq).
 * - STT : enregistrement micro (MediaRecorder) → POST /api/voice/transcribe.
 * - TTS : POST /api/voice/speak (arabe via Groq) ; repli navigateur pour le
 *         français (Groq ne le supporte pas).
 *
 * ⚠️ L'accès micro (getUserMedia) exige un contexte sécurisé : HTTPS ou
 *    http://localhost. Sur une IP réseau en http simple, le navigateur refuse.
 */
export function useVoice(options: UseVoiceOptions = {}): UseVoiceReturn {
  const { onFinalTranscript, defaultLang = "fr-FR" } = options;

  const [lang, setLang] = useState<VoiceLang>(defaultLang);
  const [listening, setListening] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [speakLoading, setSpeakLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const speakSeqRef = useRef(0);   // jeton : seule la dernière demande joue

  const onFinalRef = useRef(onFinalTranscript);
  const langRef = useRef(lang);
  useEffect(() => { onFinalRef.current = onFinalTranscript; }, [onFinalTranscript]);
  useEffect(() => { langRef.current = lang; }, [lang]);

  const recognitionSupported =
    typeof navigator !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== "undefined";

  const browserTTS =
    typeof window !== "undefined" && "speechSynthesis" in window;
  // On a toujours au moins un moyen de parler (backend ar + repli navigateur).
  const synthesisSupported = true;

  // ─── Reconnaissance vocale (enregistrement → backend) ───────────────────────
  const startListening = useCallback(async () => {
    if (listening || transcribing) return;
    if (!recognitionSupported) {
      setError("Enregistrement audio non supporté par ce navigateur.");
      return;
    }
    setError(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = pickMimeType();
      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        // libère le micro
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        chunksRef.current = [];

        if (blob.size === 0) {
          setError("Aucun son enregistré. Réessayez.");
          return;
        }

        setTranscribing(true);
        try {
          const res = await voiceService.transcribe(blob, langRef.current);
          const text = (res.text || "").trim();
          if (text) onFinalRef.current?.(text);
          else setError("Aucune parole détectée. Réessayez.");
        } catch (err) {
          setError(
            err instanceof ApiError
              ? err.message
              : "Erreur de transcription côté serveur"
          );
        } finally {
          setTranscribing(false);
        }
      };

      recorder.start();
      setListening(true);
    } catch (err: any) {
      // getUserMedia refusé / contexte non sécurisé
      if (err?.name === "NotAllowedError" || err?.name === "SecurityError") {
        setError(
          "Accès au micro refusé. Autorisez le micro et utilisez https:// ou http://localhost."
        );
      } else if (err?.name === "NotFoundError") {
        setError("Aucun microphone détecté.");
      } else {
        setError("Impossible d'accéder au micro.");
      }
      setListening(false);
    }
  }, [listening, transcribing, recognitionSupported]);

  const stopListening = useCallback(() => {
    const rec = mediaRecorderRef.current;
    if (rec && rec.state !== "inactive") {
      try { rec.stop(); } catch { /* noop */ }
    }
    setListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (listening) stopListening();
    else startListening();
  }, [listening, startListening, stopListening]);

  // ─── Synthèse vocale (backend → repli navigateur) ───────────────────────────
  const speakBrowser = useCallback((text: string, targetLang: VoiceLang) => {
    if (!browserTTS) {
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(stripMarkdown(text));
    utter.lang = targetLang;
    const voices = window.speechSynthesis.getVoices();
    const base = langToIso(targetLang);
    const v =
      voices.find((vo) => vo.lang === targetLang) ||
      voices.find((vo) => vo.lang?.toLowerCase().startsWith(base));
    if (v) utter.voice = v;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => setSpeaking(false);
    utter.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utter);
  }, [browserTTS]);

  const cancelSpeak = useCallback(() => {
    speakSeqRef.current++;   // invalide toute demande en cours
    if (audioElRef.current) {
      audioElRef.current.pause();
      audioElRef.current.src = "";
      audioElRef.current = null;
    }
    if (browserTTS) window.speechSynthesis.cancel();
    setSpeaking(false);
    setSpeakLoading(false);
  }, [browserTTS]);

  const speak = useCallback(async (text: string, spokenLang?: VoiceLang) => {
    const targetLang = spokenLang || langRef.current;
    if (!text.trim()) return;

    cancelSpeak();
    const seq = ++speakSeqRef.current;   // cette demande devient la plus récente
    setSpeakLoading(true);

    try {
      const blob = await voiceService.speak(text, targetLang);
      // une demande plus récente est arrivée pendant l'attente → on abandonne
      if (seq !== speakSeqRef.current) return;

      if (blob) {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioElRef.current = audio;
        audio.onplaying = () => {
          if (seq !== speakSeqRef.current) { audio.pause(); return; }
          setSpeakLoading(false); setSpeaking(true);
        };
        audio.onended = () => {
          if (seq !== speakSeqRef.current) return;
          setSpeaking(false); setSpeakLoading(false);
          URL.revokeObjectURL(url); audioElRef.current = null;
        };
        audio.onerror = () => {
          if (seq !== speakSeqRef.current) return;
          setSpeaking(false); setSpeakLoading(false);
          URL.revokeObjectURL(url); audioElRef.current = null;
        };
        await audio.play();
      } else {
        setSpeakLoading(false);
        speakBrowser(text, targetLang);
      }
    } catch {
      if (seq !== speakSeqRef.current) return;
      setSpeakLoading(false);
      speakBrowser(text, targetLang);
    }
  }, [cancelSpeak, speakBrowser]);

  // Précharge les voix du navigateur (pour le repli).
  useEffect(() => {
    if (!browserTTS) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [browserTTS]);

  // Nettoyage à la destruction.
  useEffect(() => {
    return () => {
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* noop */ }
      try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current = null;
      }
    };
  }, []);

  return {
    recognitionSupported,
    synthesisSupported,
    listening,
    transcribing,
    interimText: "",
    startListening,
    stopListening,
    toggleListening,
    speaking,
    speakLoading,
    speak,
    cancelSpeak,
    lang,
    setLang,
    error,
  };
}

export default useVoice;