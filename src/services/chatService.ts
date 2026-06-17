import api from "./apiClient";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:         number;
  user_id:    number;
  role:       "user" | "assistant";
  content:    string;
  session_id: string;
  created_at: string;
  sources?:   ChatSource[];
}

export interface ChatSource {
  title?:    string;
  url?:      string;
  category?: string;
  download?: string;
}

export interface SendMessageResponse {
  message:     string;
  session_id:  string;
  user_msg_id: number;
  ai_msg_id:   number;
  sources:     ChatSource[];
}

export interface ChatSession {
  session_id: string;
  title:      string;
  created_at: string;
  updated_at: string;
  count:      number;
}

// ─── Chat Service ────────────────────────────────────────────────────────────

export const chatService = {
  // ✅ lang = "ar" | "fr" : langue de la réponse de l'IA
  sendMessage: (
    content:    string,
    sessionId?: string,
    lang:       "ar" | "fr" = "ar"
  ): Promise<SendMessageResponse> =>
    api.post<SendMessageResponse>("chat/message", {
      message:    content,
      session_id: sessionId,
      lang,
    }),

  getHistory: (sessionId?: string): Promise<ChatMessage[]> => {
    const params = sessionId ? `?session_id=${sessionId}` : "";
    return api.get<ChatMessage[]>(`chat/history${params}`);
  },

  // ✅ Liste des conversations (historique type chat)
  getSessions: (): Promise<ChatSession[]> =>
    api.get<ChatSession[]>("chat/sessions"),
};

export default chatService;