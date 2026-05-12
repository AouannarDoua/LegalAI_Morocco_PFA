import api from "./apiClient";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id:         number;
  user_id:    number;
  role:       "user" | "assistant";
  content:    string;
  session_id: string;
  created_at: string;
  // ✅ Fix: sources RAG — backend kiyerja3 list de metadata { title, url, category, download }
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
  // ✅ Fix: sources من RAG backend
  sources:     ChatSource[];
}

// ─── Chat Service ────────────────────────────────────────────────────────────

export const chatService = {
  sendMessage: (
    content:   string,
    sessionId?: string
  ): Promise<SendMessageResponse> =>
    api.post<SendMessageResponse>("chat/message", {
      message:    content,
      session_id: sessionId,
    }),

  getHistory: (sessionId?: string): Promise<ChatMessage[]> => {
    const params = sessionId ? `?session_id=${sessionId}` : "";
    return api.get<ChatMessage[]>(`chat/history${params}`);
  },
};

export default chatService;