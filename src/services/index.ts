// src/services/index.ts
import api, { BASE_URL, tokenStorage } from "./apiClient";
import type { PaginatedData } from "./apiClient";

// ─── Re-export depuis contractService ────────────────────────────────────────
// ✅ Fix: on importe depuis contractService — évite la duplication de Contract
export type { Contract, ContractAnalysis } from "./contractService";
export { contractService } from "./contractService";

// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENT SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export interface Document {
  id:         number;
  user_id:    number;
  title:      string;
  file_path:  string | null;
  doc_type:   string | null;
  created_at: string;
}

export const documentService = {
  list: (page = 1): Promise<PaginatedData<Document>> =>
    api.get<PaginatedData<Document>>(`documents?page=${page}`),

  getById: (id: number): Promise<Document> =>
    api.get<Document>(`documents/${id}`),

  // Création d'un document "texte" (JSON) — inchangé
  create: (payload: {
    title:     string;
    doc_type?: string;
    content?:  string;
  }): Promise<Document> =>
    api.post<Document>("documents", payload),

  // ✅ NOUVEAU : upload d'un VRAI fichier (multipart/form-data).
  // On n'utilise PAS api.post ici car il force "Content-Type: application/json".
  upload: async (
    file: File,
    title?: string,
    doc_type?: string,
  ): Promise<Document> => {
    const form = new FormData();
    form.append("file", file);
    if (title)    form.append("title", title);
    if (doc_type) form.append("doc_type", doc_type);

    const token = tokenStorage.get();
    const res = await fetch(`${BASE_URL}/documents`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form, // le navigateur met le bon Content-Type + boundary tout seul
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Échec du téléversement");
    }
    return json.data as Document;
  },

  // ✅ NOUVEAU : téléchargement authentifié du fichier (déclenche le download).
  download: async (id: number, filename = "document"): Promise<void> => {
    const token = tokenStorage.get();
    const res = await fetch(`${BASE_URL}/documents/${id}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error("Téléchargement impossible");

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  },

  delete: (id: number): Promise<void> =>
    api.delete<void>(`documents/${id}`),
};

// ═══════════════════════════════════════════════════════════════════════════
// DECISION SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export interface Decision {
  id:         number;
  title:      string;
  court:      string | null;
  date:       string | null;
  summary:    string | null;
  category:   string | null;
  created_at: string;
  full_text?: string;
}

export const decisionService = {
  list: (page = 1, category?: string, q?: string): Promise<PaginatedData<Decision>> => {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    if (q && q.trim()) params.set("q", q.trim());
    return api.get<PaginatedData<Decision>>(`decisions?${params}`);
  },

  getById: (id: number): Promise<Decision> =>
    api.get<Decision>(`decisions/${id}`),
};

// ═══════════════════════════════════════════════════════════════════════════
// ARTICLE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export interface Article {
  id:         number;
  title:      string;
  category:   string | null;
  author:     string | null;
  published:  boolean;
  created_at: string;
  content?:   string;
}

export const articleService = {
  list: (page = 1, category?: string, q?: string): Promise<PaginatedData<Article>> => {
    const params = new URLSearchParams({ page: String(page) });
    if (category) params.set("category", category);
    if (q && q.trim()) params.set("q", q.trim());
    return api.get<PaginatedData<Article>>(`articles?${params}`);
  },

  getById: (id: number): Promise<Article> =>
    api.get<Article>(`articles/${id}`),

  categories: (): Promise<string[]> =>
    api.get<string[]>(`articles/categories`),
};

// ═══════════════════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export interface Notification {
  id:         number;
  user_id:    number;
  title:      string;
  message:    string | null;
  is_read:    boolean;
  notif_type: "info" | "warning" | "success" | "error";
  created_at: string;
}

export const notificationService = {
  list: (page = 1, unreadOnly = false): Promise<PaginatedData<Notification>> => {
    const params = new URLSearchParams({ page: String(page) });
    if (unreadOnly) params.set("unread", "true");
    return api.get<PaginatedData<Notification>>(`notifications?${params}`);
  },

  markRead: (id: number): Promise<void> =>
    api.put<void>(`notifications/${id}/read`),

  markAllRead: (): Promise<void> =>
    api.put<void>("notifications/read-all"),
};

// ═══════════════════════════════════════════════════════════════════════════
// PROFILE SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export interface ProfileUpdatePayload {
  full_name?:  string;
  avatar_url?: string;
}

// ✅ Fix: payload object — compatible avec Profile.tsx qui appelle
// changePassword({ old_password, new_password })
export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export const profileService = {
  get: () =>
    api.get("profile"),

  update: (payload: ProfileUpdatePayload) =>
    api.put("profile", payload),

  // ✅ Fix: prend un objet { old_password, new_password }
  // Profile.tsx: changePassword({ old_password: oldPassword, new_password: newPassword })
  changePassword: (payload: ChangePasswordPayload): Promise<void> =>
    api.put<void>("profile/password", {
      old_password: payload.old_password,
      new_password: payload.new_password,
    }),
};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD SERVICE
// ═══════════════════════════════════════════════════════════════════════════

export interface DashboardStats {
  contracts:            number;
  documents:            number;
  unread_notifications: number;
  chat_sessions:        number;
}

export const dashboardService = {
  getStats: (): Promise<DashboardStats> =>
    api.get<DashboardStats>("dashboard/stats"),
};
