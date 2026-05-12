import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

/**
 * ✅ Fix: route protégée — redirige vers /login si pas authentifié
 * Usage dans App.tsx:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     ...
 *   </Route>
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // ✅ Fix: pendant la vérification du token — afficher un spinner
  // évite le redirect prématuré avant que /auth/me réponde
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  // ✅ Fix: si pas authentifié — redirect login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}