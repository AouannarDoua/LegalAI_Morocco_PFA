import { useState, useRef, useEffect } from "react";
import chatService, { type ChatMessage } from "../services/chatService";
import { ApiError } from "../services/apiClient";

// ─── Source chip (RAG sources) ───────────────────────────────────────────────

function SourceChip({ source }: { source: { title?: string; url?: string } }) {
  if (!source?.title) return null;
  return source.url ? (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full hover:bg-blue-100 transition"
    >
      📄 {source.title.slice(0, 40)}{source.title.length > 40 ? "…" : ""}
    </a>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
      📄 {source.title.slice(0, 40)}
    </span>
  );
}

// ─── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
          AI
        </div>
      )}
      <div className="max-w-[75%] flex flex-col gap-1">
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-blue-600 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-800 rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>
        {/* ✅ Fix: afficher les sources RAG si disponibles */}
        {!isUser && msg.sources && msg.sources.length > 0 && (
          <div className="flex flex-wrap gap-1 px-1">
            {msg.sources.map((src: any, i: number) => (
              <SourceChip key={i} source={src} />
            ))}
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
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isLoading) return;

    setInput("");
    setError(null);

    // Optimistic UI — message utilisateur immédiat
    const tempId = Date.now();
    const tempUserMsg: ChatMessage = {
      id: tempId,
      user_id: 0,
      role: "user",
      content,
      session_id: sessionId || "",
      created_at: new Date().toISOString(),
      sources: [],
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setIsLoading(true);

    try {
      // ✅ Fix: chatService.sendMessage kiyerja3 { message, sources, session_id, ai_msg_id }
      const res = await chatService.sendMessage(content, sessionId);

      if (!sessionId) setSessionId(res.session_id);

      const aiMsg: ChatMessage = {
        id: res.ai_msg_id,
        user_id: 0,
        role: "assistant",
        content: res.message,
        session_id: res.session_id,
        created_at: new Date().toISOString(),
        // ✅ Fix: sources RAG من backend
        sources: res.sources ?? [],
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erreur de connexion au serveur"
      );
      // Retirer le message optimistic
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ─── Nouvelle session ─────────────────────────────────────────────────────
  const resetSession = () => {
    setMessages([]);
    setSessionId(undefined);
    setError(null);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-3xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-900">Assistant juridique IA</h1>
        {messages.length > 0 && (
          <button
            onClick={resetSession}
            className="text-xs text-gray-500 hover:text-blue-600 border border-gray-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition"
          >
            + Nouvelle conversation
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-xl bg-white p-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-400">
            <div className="text-4xl mb-3">⚖️</div>
            <p className="font-medium text-gray-600">Posez votre question juridique</p>
            <p className="text-sm mt-1">
              Droit du travail, contrats, procédures, droits civils...
            </p>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {[
                "Quels sont mes droits en cas de licenciement abusif ?",
                "Comment rédiger un bail conforme au droit marocain ?",
                "Quelle est la procédure pour créer une SARL au Maroc ?",
                "Quels sont les délais de prescription en droit civil marocain ?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="text-left text-xs p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition text-gray-600"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}

        {isLoading && (
          <div className="flex justify-start mb-3">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold mr-2 mt-1 flex-shrink-0">
              AI
            </div>
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

      {error && (
        <div className="mt-2 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      <div className="mt-3 flex gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm transition"
          placeholder="Posez votre question juridique... (Entrée pour envoyer)"
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={isLoading || !input.trim()}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-xl font-semibold transition self-end"
        >
          Envoyer
        </button>
      </div>
    </div>
  );
}