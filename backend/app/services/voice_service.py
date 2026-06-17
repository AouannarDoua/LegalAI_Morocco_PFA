import io
import os
import re
import traceback
import wave
from concurrent.futures import ThreadPoolExecutor

from groq import Groq
from google import genai
from google.genai import types


# ─── Nettoyage du texte avant lecture vocale (TTS) ──────────────────────────
def clean_for_speech(text: str) -> str:
    """
    Retire le Markdown pour que le TTS ne lise pas « astérisque astérisque ».
    Supprime *, _, #, `, >, puces, et transforme [texte](url) -> texte.
    """
    if not text:
        return ""
    t = text
    t = re.sub(r"```[\s\S]*?```", " ", t)          # blocs de code
    t = re.sub(r"`([^`]*)`", r"\1", t)              # code inline
    t = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", t)     # images
    t = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", t)  # liens -> texte
    t = re.sub(r"[*_~]+", "", t)                     # gras / italique / barré
    t = re.sub(r"^\s{0,3}#{1,6}\s*", "", t, flags=re.MULTILINE)  # titres
    t = re.sub(r"^\s*>\s?", "", t, flags=re.MULTILINE)           # citations
    t = re.sub(r"^\s*[-+•]\s+", "", t, flags=re.MULTILINE)       # puces
    t = re.sub(r"^\s*\d+[.)]\s+", "", t, flags=re.MULTILINE)     # listes num.
    t = re.sub(r"\n{3,}", "\n\n", t)                 # lignes vides multiples
    t = re.sub(r"[ \t]{2,}", " ", t)
    return t.strip()


def split_for_speech(text: str, max_chunk: int) -> list[str]:
    """
    Découpe un texte long en morceaux ≤ max_chunk, en coupant de préférence
    à la fin d'une phrase. Permet de lire TOUT le texte sans timeout : chaque
    morceau est synthétisé séparément puis recollé.
    """
    text = text.strip()
    if len(text) <= max_chunk:
        return [text] if text else []

    chunks: list[str] = []
    remaining = text
    enders = ".؟!?\n۔"
    while remaining:
        if len(remaining) <= max_chunk:
            chunks.append(remaining.strip())
            break
        window = remaining[:max_chunk]
        last = max(window.rfind(c) for c in enders)
        if last < max_chunk * 0.4:          # pas de bonne fin de phrase
            last = window.rfind(" ")         # on coupe au dernier espace
        if last <= 0:
            last = max_chunk - 1             # dernier recours
        chunks.append(remaining[:last + 1].strip())
        remaining = remaining[last + 1:].strip()
    return [c for c in chunks if c]


class VoiceService:
    """
    - Transcription (STT) : Groq Whisper large v3 turbo (fr / ar / darija).
    - Synthèse (TTS)      : Google Gemini TTS (arabe + français).
    En cas d'échec Gemini (région, quota, clé…), synthesize() renvoie None :
    le frontend bascule alors proprement sur la synthèse du navigateur.
    """

    def __init__(self):
        groq_key = os.environ.get("GROQ_API_KEY", "")
        if not groq_key:
            print("[VoiceService] ⚠️  GROQ_API_KEY manquante dans .env")
        self.groq = Groq(api_key=groq_key)
        self.stt_model = "whisper-large-v3-turbo"

        gemini_key = os.environ.get("GEMINI_API_KEY", "")
        if not gemini_key:
            print("[VoiceService] ⚠️  GEMINI_API_KEY manquante (TTS -> repli navigateur)")
        # ⏱️ 1 SEULE tentative (sinon le SDK double le délai) + timeout 30s.
        # Sur échec, on bascule sur la voix du navigateur.
        self.gemini = (
            genai.Client(
                api_key=gemini_key,
                http_options=types.HttpOptions(
                    timeout=30000,  # millisecondes, pour UNE tentative
                    retry_options=types.HttpRetryOptions(
                        attempts=1,        # pas de retry -> pas de délai doublé
                        http_status_codes=[429, 503],
                    ),
                ),
            )
            if gemini_key
            else None
        )

        # Découpage pour lire TOUT le texte sans timeout. Morceaux plus petits
        # = générés EN PARALLÈLE = lecture qui démarre plus vite.
        self.tts_chunk_chars = int(os.environ.get("GEMINI_TTS_CHUNK_CHARS", "350"))
        # Garde-fou : nombre max de morceaux (protège le quota free tier).
        self.tts_max_chunks = int(os.environ.get("GEMINI_TTS_MAX_CHUNKS", "12"))
        # Nombre de morceaux générés en même temps.
        self.tts_workers = int(os.environ.get("GEMINI_TTS_WORKERS", "4"))
        self.tts_model = os.environ.get("GEMINI_TTS_MODEL", "gemini-2.5-flash-preview-tts")
        self.tts_voice = os.environ.get("GEMINI_TTS_VOICE", "Kore")

        self._pcm_rate = 24000
        self._pcm_width = 2
        self._pcm_channels = 1

    # ─── STT ─────────────────────────────────────────────────────────────────
    def transcribe(self, file_storage, language: str | None = None) -> dict:
        filename = file_storage.filename or "recording.webm"
        audio_bytes = file_storage.read()
        kwargs = {
            "file": (filename, audio_bytes),
            "model": self.stt_model,
            "response_format": "json",
            "temperature": 0.0,
        }
        if language:
            kwargs["language"] = language
        result = self.groq.audio.transcriptions.create(**kwargs)
        text = (getattr(result, "text", "") or "").strip()
        return {"text": text, "language": language or ""}

    # ─── PCM brut -> WAV ──────────────────────────────────────────────────────
    def _pcm_to_wav(self, pcm: bytes) -> bytes:
        buf = io.BytesIO()
        with wave.open(buf, "wb") as wf:
            wf.setnchannels(self._pcm_channels)
            wf.setsampwidth(self._pcm_width)
            wf.setframerate(self._pcm_rate)
            wf.writeframes(pcm)
        return buf.getvalue()

    # ─── Extrait les octets audio de la réponse Gemini (robuste) ──────────────
    def _extract_audio(self, response) -> bytes | None:
        try:
            candidates = getattr(response, "candidates", None) or []
            for cand in candidates:
                content = getattr(cand, "content", None)
                parts = getattr(content, "parts", None) or []
                for part in parts:
                    inline = getattr(part, "inline_data", None)
                    if inline and getattr(inline, "data", None):
                        return inline.data
        except Exception:
            pass
        return None

    # ─── Détecte une erreur de quota / débit (429) ───────────────────────────
    @staticmethod
    def _is_rate_limit(e: Exception) -> bool:
        code = getattr(e, "code", None)
        if code == 429:
            return True
        msg = str(e).lower()
        return "429" in msg or "resource_exhausted" in msg or "rate limit" in msg

    # ─── Un seul appel Gemini pour un morceau de texte → PCM brut ─────────────
    def _tts_chunk(self, chunk: str) -> bytes | None:
        try:
            response = self.gemini.models.generate_content(
                model=self.tts_model,
                contents=chunk,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(
                                voice_name=self.tts_voice
                            )
                        )
                    ),
                ),
            )
            return self._extract_audio(response)
        except Exception as e:
            if self._is_rate_limit(e):
                print("[VoiceService] ❌ Quota Gemini dépassé (429). Repli navigateur.")
            else:
                print("[VoiceService] ❌ Erreur Gemini TTS :", repr(e))
                traceback.print_exc()
            return None

    # ─── TTS : lit TOUT le texte (découpé en morceaux, recollé) ───────────────
    def synthesize(self, text: str, lang: str = "ar") -> bytes | None:
        if not self.gemini:
            return None  # pas de clé -> repli navigateur

        spoken = clean_for_speech(text)
        if not spoken:
            return None

        # Découpe en morceaux et synthétise EN PARALLÈLE (plus rapide qu'un
        # par un). ex.map garde l'ordre des morceaux.
        chunks = split_for_speech(spoken, self.tts_chunk_chars)[: self.tts_max_chunks]
        if not chunks:
            return None

        if len(chunks) == 1:
            pcm = self._tts_chunk(chunks[0])
            return self._pcm_to_wav(pcm) if pcm else None

        workers = min(self.tts_workers, len(chunks))
        with ThreadPoolExecutor(max_workers=workers) as ex:
            results = list(ex.map(self._tts_chunk, chunks))

        pcm_total = b""
        for i, pcm in enumerate(results):
            if pcm is None:
                # 1er morceau échoué → repli ; sinon on garde l'audio déjà obtenu
                if pcm_total:
                    print(f"[VoiceService] ⚠️  Morceau {i+1}/{len(chunks)} échoué, "
                          "lecture partielle renvoyée.")
                    break
                return None
            pcm_total += pcm

        if not pcm_total:
            return None
        return self._pcm_to_wav(pcm_total)  # recolle tout en un seul WAV


voice_service = VoiceService()