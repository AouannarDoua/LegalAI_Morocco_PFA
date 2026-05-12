const BASE_URL = "http://localhost:5000/api";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data:    T;
}

export interface PaginatedData<T> {
  items:    T[];
  total:    number;
  pages:    number;
  page:     number;
  per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export class ApiError extends Error {
  constructor(
    public status:  number,
    message:        string,
    public errors?: string[]
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Token storage ────────────────────────────────────────────────────────────

export const tokenStorage = {
  get:   ()              => localStorage.getItem("access_token"),
  set:   (token: string) => localStorage.setItem("access_token", token),
  clear: ()              => localStorage.removeItem("access_token"),
};

// ─── Auth routes — pas de Bearer token ───────────────────────────────────────
// ✅ Fix: ces routes ne doivent PAS envoyer de token (évite 401/422 en cascade)
const PUBLIC_ROUTES = [
  "auth/login",
  "auth/register",
  "auth/forgot-password",
  "auth/reset-password",
  "auth/confirm-email",
  "auth/resend-confirmation",
  "contracts/templates",   // ✅ Fix: templates est public
];

function isPublicRoute(endpoint: string): boolean {
  const clean = endpoint.replace(/^\/+/, "");
  return PUBLIC_ROUTES.some((r) => clean.startsWith(r));
}

// ─── Core fetch ───────────────────────────────────────────────────────────────

async function request<T>(
  endpoint: string,
  options:  RequestInit = {}
): Promise<T> {
  const clean  = endpoint.replace(/^\/+/, "");
  const url    = `${BASE_URL}/${clean}`;
  const token  = tokenStorage.get();

  // ✅ Fix: routes publiques sans Authorization header
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(!isPublicRoute(clean) && token
      ? { Authorization: `Bearer ${token}` }
      : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  // ✅ Fix: 401 seulement sur routes protégées — pas sur login
  if (response.status === 401 && !isPublicRoute(clean)) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent("auth:logout"));
    throw new ApiError(401, "Session expirée, veuillez vous reconnecter");
  }

  // ✅ Fix: 422 = JWT invalide/expiré — même traitement que 401
  if (response.status === 422 && !isPublicRoute(clean)) {
    tokenStorage.clear();
    window.dispatchEvent(new CustomEvent("auth:logout"));
    throw new ApiError(422, "Session invalide, veuillez vous reconnecter");
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiError(response.status, "Réponse invalide du serveur");
  }

  if (!response.ok || !json.success) {
    throw new ApiError(
      response.status,
      json.message || "Erreur serveur",
      (json as any).errors
    );
  }

  return json.data;
}

// ─── HTTP methods ─────────────────────────────────────────────────────────────

export const api = {
  get: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "GET" }),

  post: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body:   body !== undefined ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body:   body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};

export default api;