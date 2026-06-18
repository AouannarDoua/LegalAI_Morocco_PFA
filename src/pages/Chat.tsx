import { useState, useRef, useEffect } from "react";
import chatService, { type ChatMessage, type ChatSession } from "../services/chatService";
import { ApiError } from "../services/apiClient";
import useVoice, { type VoiceLang } from "../hooks/useVoice";
import translationService, { isArabic } from "../services/translationService";
import { langToIso } from "../services/voiceService";
import {
  Mic, MicOff, Volume2, Square, Send, Headphones, Loader2, Languages, Plus, MessageSquare, Scale,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useLang } from "../i18n/LanguageContext";

function SourceChip({ source }: { source: { title?: string; url?: string } }) {
  if (!source?.title) return null;
  return source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-full border border-gold-soft bg-white px-2 py-0.5 text-xs font-semibold text-mizan-800 transition hover:bg-mizan-50">
      📄 {source.title.slice(0, 40)}{source.title.length > 40 ? "…" : ""}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
      📄 {source.title.slice(0, 40)}
    </span>
  );
}

function StarAvatar() {
  return (
    <div className="me-2 mt-1 grid h-8 w-8 flex-shrink-0 place-items-center rounded-xl bg-mizan-600 text-white">
      <Scale className="h-4 w-4" />
    </div>
  );
}

interface BubbleProps {
  msg: ChatMessage;
  isPlaying: boolean;
  isSpeakLoading: boolean;
  canSpeak: boolean;
  onSpeak: (id: number, text: string) => void;
  onTranslate: (id: number, text: string) => void;
  translation: string | null;
  isTranslating: boolean;
}

function MessageBubble({
  msg, isPlaying, isSpeakLoading, canSpeak, onSpeak, onTranslate, translation, isTranslating,
}: BubbleProps) {
  const isUser = msg.role === "user";
  const shown = translation ?? msg.content;
  const target = isArabic(msg.content) ? "français" : "العربية";

  return (
    <div className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && <StarAvatar />}
      <div className="flex max-w-[75%] flex-col gap-1">
        <div dir="auto"
          className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser ? "rounded-br-sm bg-mizan-600 text-white"
              : translation ? "rounded-bl-sm border border-emerald-200 bg-emerald-50 text-emerald-900"
                : "rounded-bl-sm border border-gray-100 bg-[#f3f1e8] text-gray-800"}`}>
          {shown}
        </div>

        {!isUser && (
          <div className="flex flex-wrap items-center gap-1 px-1">
            {canSpeak && (
              <button onClick={() => onSpeak(msg.id, shown)}
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                  isPlaying ? "border-mizan-300 bg-mizan-100 text-mizan-700"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-mizan-600"}`}>
                {isSpeakLoading ? <Loader2 className="h-3 w-3 animate-spin" />
                  : isPlaying ? <Square className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
                {isPlaying ? "Arrêter" : isSpeakLoading ? "…" : "Écouter"}
              </button>
            )}
            <button onClick={() => onTranslate(msg.id, msg.content)} disabled={isTranslating}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition ${
                translation ? "border-emerald-300 bg-emerald-100 text-emerald-700"
                  : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-emerald-600"}`}>
              {isTranslating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Languages className="h-3 w-3" />}
              {translation ? "Voir l'original" : `Traduire en ${target}`}
            </button>
          </div>
        )}

        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.sources.map((src: any, i: number) => <SourceChip key={i} source={src} />)}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Chat() {
  const { t } = useLang();
  const [showHistory, setShowHistory] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState(false);

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [translatingId, setTranslatingId] = useState<number | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const handsFreeRef = useRef(handsFree);
  useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);

  const voice = useVoice({
    defaultLang: "ar-MA",
    onFinalTranscript: (text) => {
      const finalText = text.trim();
      if (!finalText) return;
      setInput(finalText);
      if (handsFreeRef.current) setTimeout(() => sendMessage(finalText), 150);
    },
  });

  useEffect(() => { if (!voice.speaking && !voice.speakLoading) setPlayingId(null); }, [voice.speaking, voice.speakLoading]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  const loadSessions = async () => { try { setSessions(await chatService.getSessions()); } catch { /* ignore */ } };
  useEffect(() => { loadSessions(); }, []);

  const sendMessage = async (override?: string) => {
    const content = (override ?? input).trim();
    if (!content || isLoading) return;
    if (voice.listening) voice.stopListening();
    setInput(""); setError(null);

    const tempId = Date.now();
    const tempUserMsg: ChatMessage = {
      id: tempId, user_id: 0, role: "user", content,
      session_id: sessionId || "", created_at: new Date().toISOString(), sources: [],
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      const res = await chatService.sendMessage(content, sessionId, langToIso(voice.lang));
      if (!sessionId) setSessionId(res.session_id);
      const aiMsg: ChatMessage = {
        id: res.ai_msg_id, user_id: 0, role: "assistant",
        content: res.message, session_id: res.session_id,
        created_at: new Date().toISOString(), sources: res.sources ?? [],
      };
      setMessages((prev) => [...prev, aiMsg]);
      if (handsFreeRef.current) { setPlayingId(res.ai_msg_id); voice.speak(res.message); }
      loadSessions();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de connexion au serveur");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const newConversation = () => {
    voice.cancelSpeak();
    setMessages([]); setSessionId(undefined); setError(null);
    setTranslations({}); setPlayingId(null);
  };

  const openSession = async (sid: string) => {
    if (sid === sessionId) return;
    voice.cancelSpeak();
    setError(null); setTranslations({}); setPlayingId(null);
    setSessionId(sid);
    try { setMessages(await chatService.getHistory(sid)); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Impossible de charger la conversation"); }
  };

  const handleSpeak = (id: number, text: string) => {
    if (playingId === id && (voice.speaking || voice.speakLoading)) { voice.cancelSpeak(); setPlayingId(null); }
    else { voice.cancelSpeak(); setPlayingId(id); voice.speak(text, isArabic(text) ? "ar-MA" : "fr-FR"); }
  };

  const handleTranslate = async (id: number, text: string) => {
    if (translations[id]) { setTranslations((prev) => { const n = { ...prev }; delete n[id]; return n; }); return; }
    const target = isArabic(text) ? "fr" : "ar";
    setTranslatingId(id);
    try {
      const res = await translationService.translate(text, target);
      setTranslations((prev) => ({ ...prev, [id]: res.translation }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de traduction");
    } finally { setTranslatingId(null); }
  };

  const micActive = voice.listening;
  const suggestions: string[] = t("chat.suggestions");

  return (
    <div className="-m-8 flex h-[calc(100vh-4rem)]">
      {/* Historique — drawer responsive, affichable/masquable */}
      {showHistory && (
        <div onClick={() => setShowHistory(false)}
          className="fixed inset-0 z-[55] bg-black/30 backdrop-blur-sm md:hidden" />
      )}
      <aside className={`${showHistory ? "flex" : "hidden"} fixed inset-y-0 start-0 z-[60] w-64 flex-col border-e border-gray-200 bg-white shadow-xl md:static md:z-auto md:shadow-none md:bg-white/70 md:backdrop-blur`}>
        <button onClick={newConversation} className="btn-primary m-3 py-2 text-sm">
          <Plus className="h-4 w-4" /> {t("chat.new")}
        </button>
        <div className="px-3 pb-1 text-xs font-semibold uppercase text-gray-400">{t("chat.conversations")}</div>
        <div className="flex-1 space-y-1 overflow-y-auto px-2 pb-3">
          {sessions.length === 0 && <p className="px-2 py-3 text-xs text-gray-400">{t("chat.none")}</p>}
          {sessions.map((s) => (
            <button key={s.session_id} onClick={() => openSession(s.session_id)} dir="auto" title={s.title}
              className={`flex w-full items-center gap-2 truncate rounded-lg px-2.5 py-2 text-start text-sm transition ${
                s.session_id === sessionId ? "bg-mizan-100 text-mizan-800" : "text-gray-600 hover:bg-gray-100"}`}>
              <MessageSquare className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* Zone de chat */}
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory((v) => !v)}
              title={showHistory ? t("ui.hideHistory") : t("ui.showHistory")}
              className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:border-mizan-600 hover:text-mizan-600">
              {showHistory ? <PanelLeftClose className="h-4 w-4 rtl:rotate-180" /> : <PanelLeftOpen className="h-4 w-4 rtl:rotate-180" />}
            </button>
            <h1 className="page-title text-xl md:text-2xl">{t("chat.title")}</h1>
          </div>
          <div className="flex items-center gap-2">
            <select value={voice.lang} onChange={(e) => voice.setLang(e.target.value as VoiceLang)}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-600 outline-none focus:ring-2 focus:ring-mizan-500">
              <option value="ar-MA">🇲🇦 العربية</option>
              <option value="fr-FR">🇫🇷 Français</option>
            </select>
            {voice.recognitionSupported && (
              <button onClick={() => setHandsFree((v) => !v)}
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs transition ${
                  handsFree ? "border-mizan-600 bg-mizan-600 text-white"
                    : "border-gray-200 text-gray-500 hover:border-mizan-300 hover:text-mizan-600"}`}>
                <Headphones className="h-3.5 w-3.5" /> {t("chat.voiceMode")}
              </button>
            )}
            <button onClick={newConversation} className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-500 md:hidden">
              {t("chat.newShort")}
            </button>
          </div>
        </div>

        {handsFree && (
          <div className="mb-3 flex items-center gap-2 rounded-lg border border-mizan-200 bg-mizan-50 px-3 py-2 text-xs text-mizan-700">
            <Headphones className="h-4 w-4 flex-shrink-0" /> {t("chat.handsFree")}
          </div>
        )}

        <div className="card-zellij flex-1 overflow-y-auto p-4">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center text-gray-400">
              <div className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-mizan-50 text-mizan-600">
                <Scale className="h-7 w-7" />
              </div>
              <p className="font-medium text-gray-600">{t("chat.emptyTitle")}</p>
              <p className="mt-1 text-sm">{t("chat.emptyHint")}</p>
              <div className="mt-6 grid w-full max-w-lg grid-cols-1 gap-2 sm:grid-cols-2">
                {suggestions.map((q) => (
                  <button key={q} dir="auto" onClick={() => setInput(q)}
                    className="rounded-lg border border-gray-200 bg-white/70 p-3 text-start text-xs text-gray-600 transition hover:border-gold-soft hover:bg-mizan-50">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg}
              isPlaying={playingId === msg.id && voice.speaking}
              isSpeakLoading={playingId === msg.id && voice.speakLoading}
              canSpeak={voice.synthesisSupported}
              onSpeak={handleSpeak} onTranslate={handleTranslate}
              translation={translations[msg.id] ?? null}
              isTranslating={translatingId === msg.id} />
          ))}

          {isLoading && (
            <div className="mb-3 flex justify-start">
              <StarAvatar />
              <div className="rounded-2xl rounded-bl-sm border border-gray-100 bg-[#f3f1e8] px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {(error || voice.error) && (
          <div className="mt-2 flex justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            <span>{error || voice.error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {micActive && (
          <div className="mt-2 flex items-center gap-2 px-1 text-sm font-medium text-mizan-600">
            <span className="relative flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mizan-400 opacity-75" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-mizan-600" />
            </span>
            {t("chat.listening")}
          </div>
        )}
        {voice.transcribing && (
          <div className="mt-2 flex items-center gap-2 px-1 text-sm font-medium text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> {t("chat.transcribing")}
          </div>
        )}

        <div className="mt-3 flex items-end gap-2">
          <textarea value={input} dir="auto" onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={2}
            className="input flex-1 resize-none" placeholder={t("chat.input")} disabled={isLoading} />
          {voice.recognitionSupported && (
            <button onClick={voice.toggleListening} disabled={isLoading || voice.transcribing}
              className={`self-end rounded-xl p-3 font-semibold transition ${
                micActive ? "animate-pulse bg-red-500 text-white hover:bg-red-600"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"}`}>
              {voice.transcribing ? <Loader2 className="h-5 w-5 animate-spin" />
                : micActive ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
          )}
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()} className="btn-primary self-end py-3">
            <Send className="h-4 w-4" /> {t("chat.send")}
          </button>
        </div>
      </div>
    </div>
  );
}
