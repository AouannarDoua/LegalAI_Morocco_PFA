import { useState, useRef, useEffect } from "react";
import chatService, { type ChatMessage, type ChatSession } from "../services/chatService";
import { ApiError } from "../services/apiClient";
import useVoice, { type VoiceLang } from "../hooks/useVoice";
import translationService, { isArabic } from "../services/translationService";
import { langToIso } from "../services/voiceService";
import {
  Mic, MicOff, Volume2, Square, Send, Headphones, Loader2, Languages, Plus, MessageSquare,
} from "lucide-react";

// ─── Source chip ──────────────────────────────────────────────────────────────
function SourceChip({ source }: { source: { title?: string; url?: string } }) {
  if (!source?.title) return null;
  return source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition">
      📄 {source.title.slice(0, 40)}{source.title.length > 40 ? "…" : ""}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
      📄 {source.title.slice(0, 40)}
    </span>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────
interface BubbleProps {
  msg: ChatMessage;
  isPlaying: boolean;
  isSpeakLoading: boolean;
  canSpeak: boolean;
  onSpeak: (id: number, text: string) => void;
  onTranslate: (id: number, text: string) => void;
  translation: string | null;   // si présent → affiché À LA PLACE de l'original
  isTranslating: boolean;
}

function MessageBubble({
  msg, isPlaying, isSpeakLoading, canSpeak, onSpeak, onTranslate, translation, isTranslating,
}: BubbleProps) {
  const isUser = msg.role === "user";
  const shown = translation ?? msg.content;            // ✅ traduction in-place
  const target = isArabic(msg.content) ? "français" : "العربية";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">AI</div>
      )}
      <div className="max-w-[75%] flex flex-col gap-1">
        <div dir="auto"
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser ? "bg-blue-600 text-white rounded-br-sm"
                   : translation ? "bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-bl-sm"
                                  : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
          {shown}
        </div>

        {!isUser && (
          <div className="flex flex-wrap items-center gap-1 px-1">
            {canSpeak && (
              <button onClick={() => onSpeak(msg.id, shown)}
                className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                  isPlaying ? "bg-blue-100 text-blue-700 border-blue-300"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-blue-600"}`}
                title={isPlaying ? "Arrêter la lecture" : "Écouter ce message"}>
                {isSpeakLoading ? <Loader2 className="w-3 h-3 animate-spin" />
                  : isPlaying ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                {isPlaying ? "Arrêter" : isSpeakLoading ? "…" : "Écouter"}
              </button>
            )}
            <button onClick={() => onTranslate(msg.id, msg.content)} disabled={isTranslating}
              className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border transition ${
                translation ? "bg-emerald-100 text-emerald-700 border-emerald-300"
                            : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:text-emerald-600"}`}
              title="Traduire ce message">
              {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Languages className="w-3 h-3" />}
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

// ─── Chat Page ───────────────────────────────────────────────────────────────
export default function Chat() {
  const [messages,  setMessages]  = useState<ChatMessage[]>([]);
  const [input,     setInput]     = useState("");
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [handsFree, setHandsFree] = useState(false);

  const [playingId, setPlayingId] = useState<number | null>(null);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [translatingId, setTranslatingId] = useState<number | null>(null);

  // Historique des conversations
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

  useEffect(() => {
    if (!voice.speaking && !voice.speakLoading) setPlayingId(null);
  }, [voice.speaking, voice.speakLoading]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Charger la liste des conversations au montage
  const loadSessions = async () => {
    try { setSessions(await chatService.getSessions()); } catch { /* ignore */ }
  };
  useEffect(() => { loadSessions(); }, []);

  const sendMessage = async (override?: string) => {
    const content = (override ?? input).trim();
    if (!content || isLoading) return;
    if (voice.listening) voice.stopListening();

    setInput("");
    setError(null);

    const tempId = Date.now();
    const tempUserMsg: ChatMessage = {
      id: tempId, user_id: 0, role: "user", content,
      session_id: sessionId || "", created_at: new Date().toISOString(), sources: [],
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      // ✅ langue de la réponse = langue sélectionnée (fr / ar)
      const res = await chatService.sendMessage(content, sessionId, langToIso(voice.lang));
      const newSession = !sessionId;
      if (newSession) setSessionId(res.session_id);

      const aiMsg: ChatMessage = {
        id: res.ai_msg_id, user_id: 0, role: "assistant",
        content: res.message, session_id: res.session_id,
        created_at: new Date().toISOString(), sources: res.sources ?? [],
      };
      setMessages((prev) => [...prev, aiMsg]);

      if (handsFreeRef.current) {
        setPlayingId(res.ai_msg_id);
        voice.speak(res.message);
      }
      loadSessions();  // rafraîchit l'historique (nouvelle conv. ou maj)
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

  // Ouvrir une conversation existante
  const openSession = async (sid: string) => {
    if (sid === sessionId) return;
    voice.cancelSpeak();
    setError(null); setTranslations({}); setPlayingId(null);
    setSessionId(sid);
    try {
      const history = await chatService.getHistory(sid);
      setMessages(history);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de charger la conversation");
    }
  };

  // Lecture d'UN message (toggle) — clic sur un autre arrête le précédent
  const handleSpeak = (id: number, text: string) => {
    if (playingId === id && (voice.speaking || voice.speakLoading)) {
      voice.cancelSpeak(); setPlayingId(null);
    } else {
      voice.cancelSpeak();
      setPlayingId(id);
      voice.speak(text, isArabic(text) ? "ar-MA" : "fr-FR");
    }
  };

  // Traduction in-place (toggle)
  const handleTranslate = async (id: number, text: string) => {
    if (translations[id]) {
      setTranslations((prev) => { const n = { ...prev }; delete n[id]; return n; });
      return;
    }
    const target = isArabic(text) ? "fr" : "ar";
    setTranslatingId(id);
    try {
      const res = await translationService.translate(text, target);
      setTranslations((prev) => ({ ...prev, [id]: res.translation }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de traduction");
    } finally {
      setTranslatingId(null);
    }
  };

  const micActive = voice.listening;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* ── Barre latérale : historique des conversations ── */}
      <aside className="w-64 border-r border-gray-200 hidden md:flex flex-col bg-gray-50">
        <button onClick={newConversation}
          className="m-3 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">
          <Plus className="w-4 h-4" /> Nouvelle conversation
        </button>
        <div className="px-3 pb-1 text-xs font-semibold text-gray-400 uppercase">Conversations</div>
        <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
          {sessions.length === 0 && (
            <p className="px-2 py-3 text-xs text-gray-400">Aucune conversation pour l'instant.</p>
          )}
          {sessions.map((s) => (
            <button key={s.session_id} onClick={() => openSession(s.session_id)} dir="auto"
              className={`w-full text-left px-2.5 py-2 rounded-lg text-sm truncate flex items-center gap-2 transition ${
                s.session_id === sessionId ? "bg-blue-100 text-blue-800" : "text-gray-600 hover:bg-gray-100"}`}
              title={s.title}>
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="truncate">{s.title}</span>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Zone de chat ── */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto p-4 w-full">
        <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
          <h1 className="text-xl font-bold text-gray-900">Assistant juridique IA</h1>
          <div className="flex items-center gap-2">
            <select value={voice.lang} onChange={(e) => voice.setLang(e.target.value as VoiceLang)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              title="Langue (réponse de l'IA + voix)">
              <option value="ar-MA">🇲🇦 العربية</option>
              <option value="fr-FR">🇫🇷 Français</option>
            </select>
            {voice.recognitionSupported && (
              <button onClick={() => setHandsFree((v) => !v)}
                className={`inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition ${
                  handsFree ? "bg-blue-600 text-white border-blue-600"
                            : "text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600"}`}
                title="Mode mains-libres">
                <Headphones className="w-3.5 h-3.5" /> Mode vocal
              </button>
            )}
            <button onClick={newConversation} className="md:hidden text-xs text-gray-500 border border-gray-200 px-3 py-1.5 rounded-lg">
              + Nouvelle
            </button>
          </div>
        </div>

        {handsFree && (
          <div className="mb-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-xs flex items-center gap-2">
            <Headphones className="w-4 h-4 flex-shrink-0" />
            Mode mains-libres : appuyez sur le micro, posez votre question, la réponse sera lue automatiquement.
          </div>
        )}

        <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl bg-white p-4">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
              <div className="text-4xl mb-3">⚖️</div>
              <p className="font-medium text-gray-600">اطرح سؤالك القانوني</p>
              <p className="text-sm mt-1">اكتب أو استعمل المايك 🎙️ — قانون الشغل، العقود، المساطر…</p>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {["ما هي حقوقي في حالة الطرد التعسفي؟",
                  "كيف أحرر عقد كراء مطابق للقانون المغربي؟",
                  "ما هي مسطرة تأسيس شركة ذات مسؤولية محدودة بالمغرب؟",
                  "ما هي آجال التقادم في القانون المدني المغربي؟"].map((q) => (
                  <button key={q} dir="auto" onClick={() => setInput(q)}
                    className="text-right text-xs p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition text-gray-600">
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
            <div className="flex justify-start mb-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">AI</div>
              <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {(error || voice.error) && (
          <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex justify-between">
            <span>{error || voice.error}</span>
            <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
          </div>
        )}

        {micActive && (
          <div className="mt-2 flex items-center gap-2 text-sm text-blue-600 font-medium px-1">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-600" />
            </span>
            À l'écoute… parlez puis appuyez de nouveau sur le micro
          </div>
        )}
        {voice.transcribing && (
          <div className="mt-2 flex items-center gap-2 text-sm text-gray-500 font-medium px-1">
            <Loader2 className="w-4 h-4 animate-spin" /> Transcription en cours…
          </div>
        )}

        <div className="mt-3 flex gap-2 items-end">
          <textarea value={input} dir="auto" onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={2}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm transition"
            placeholder="اطرح سؤالك… (Entrée pour envoyer, 🎙️ pour dicter)" disabled={isLoading} />
          {voice.recognitionSupported && (
            <button onClick={voice.toggleListening} disabled={isLoading || voice.transcribing}
              className={`p-3 rounded-xl font-semibold transition self-end ${
                micActive ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700 disabled:opacity-50"}`}
              title={micActive ? "Arrêter et transcrire" : "Parler"}>
              {voice.transcribing ? <Loader2 className="w-5 h-5 animate-spin" />
                : micActive ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}
          <button onClick={() => sendMessage()} disabled={isLoading || !input.trim()}
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold transition self-end inline-flex items-center gap-1.5">
            <Send className="w-4 h-4" /> Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}