import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/apiClient";
import { ApiError } from "../services/apiClient";

export default function ResetPassword() {
  const [searchParams]          = useSearchParams();
  const navigate                 = useNavigate();
  const token                    = searchParams.get("token") || "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }
    if (!token) {
      setError("Token invalide — veuillez refaire la procédure.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate("/login", {
        state: { message: "Mot de passe réinitialisé ! Connectez-vous." }
      }), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Token manquant ───────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h1>
          <p className="text-gray-500 text-sm mb-6">
            Ce lien est invalide ou expiré. Veuillez refaire la procédure.
          </p>
          <Link
            to="/forgot-password"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl"
          >
            Mot de passe oublié ?
          </Link>
        </div>
      </div>
    );
  }

  // ─── Succès ───────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            ✅
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            Mot de passe réinitialisé !
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            Votre mot de passe a été modifié avec succès.
          </p>
          <p className="text-gray-400 text-xs mb-4">
            Redirection automatique vers la connexion...
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl"
          >
            Se connecter
          </Link>
        </div>
      </div>
    );
  }

  // ─── Formulaire ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
            🔑
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
          <p className="text-gray-500 text-sm mt-1">
            Choisissez un nouveau mot de passe sécurisé
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nouveau mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="8 caractères minimum"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          {/* Indicateur de force */}
          {password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1,2,3,4].map((i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-all ${
                      password.length >= i * 3
                        ? password.length >= 12 ? "bg-green-500"
                        : password.length >= 8  ? "bg-yellow-500"
                        : "bg-red-400"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-400">
                {password.length < 8 ? "Trop court" :
                 password.length < 12 ? "Acceptable" : "Fort ✅"}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition"
          >
            {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}