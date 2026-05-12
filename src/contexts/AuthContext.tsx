import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import authService, { type User, type RegisterResponse } from "../services/authService";
import { tokenStorage, ApiError } from "../services/apiClient";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user:         User | null;
  isLoading:    boolean;
  isAuthenticated: boolean;
  login:        (email: string, password: string) => Promise<void>;
  register:     (email: string, password: string, fullName?: string) => Promise<RegisterResponse>;
  logout:       () => void;
  refreshUser:  () => Promise<void>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // true au démarrage — on vérifie le token

  // ── Au montage: vérifier si token valide ────────────────────────────────────
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setIsLoading(false);
      return;
    }

    // ✅ Fix: on appelle /auth/me pour valider le token existant
    authService.me()
      .then((u) => setUser(u))
      .catch(() => {
        // Token invalide ou expiré — on nettoie
        tokenStorage.clear();
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  // ── Écouter l'événement logout (401/422) ────────────────────────────────────
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      tokenStorage.clear();
    };
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // ── Login ───────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    const data = await authService.login(email, password);
    // ✅ Fix: token déjà set dans authService.login — on met à jour le user
    setUser(data.user);
  }, []);

  // ── Register ─────────────────────────────────────────────────────────────────
  const register = useCallback(
    async (email: string, password: string, fullName?: string) => {
      return authService.register(email, password, fullName);
    },
    []
  );

  // ── Logout ───────────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  // ── Refresh user (après update profil) ──────────────────────────────────────
  const refreshUser = useCallback(async () => {
    try {
      const u = await authService.me();
      setUser(u);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export default AuthContext;