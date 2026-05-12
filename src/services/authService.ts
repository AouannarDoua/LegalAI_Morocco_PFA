import api, { tokenStorage } from "./apiClient";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface User {
  id:           number;
  email:        string;
  full_name:    string | null;
  role:         "user" | "lawyer" | "admin";
  avatar_url:   string | null;
  is_confirmed: boolean;
  created_at:   string;
}

export interface AuthResponse {
  token: string;
  user:  User;
}

// ✅ Fix: register kiyerja3 { email_sent } — machi token
export interface RegisterResponse {
  email_sent: boolean;
}

// ─── Auth Service ─────────────────────────────────────────────────────────────

export const authService = {

  // ✅ Fix: register ma kaysetto token — user khasso yconfirm email awalan
  register: async (
    email:     string,
    password:  string,
    fullName?: string
  ): Promise<RegisterResponse> => {
    return api.post<RegisterResponse>("auth/register", {
      email,
      password,
      full_name: fullName,
    });
  },

  // ✅ Fix: login — token ytsett fqat après succès
  login: async (email: string, password: string): Promise<AuthResponse> => {
    // ✅ clear token qbel login — évite d'envoyer un ancien token invalide
    tokenStorage.clear();
    const data = await api.post<AuthResponse>("auth/login", { email, password });
    tokenStorage.set(data.token);
    return data;
  },

  me: (): Promise<User> =>
    api.get<User>("auth/me"),

  logout: () => {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent("auth:logout"));
  },

  isAuthenticated: (): boolean => Boolean(tokenStorage.get()),
};

export default authService;