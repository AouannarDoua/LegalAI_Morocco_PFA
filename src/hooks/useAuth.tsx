// hooks/useAuth.tsx
// ✅ Fix: re-export depuis AuthContext — évite le double contexte
export { useAuth } from "../contexts/AuthContext";