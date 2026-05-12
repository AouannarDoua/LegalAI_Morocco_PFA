import { useState, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import api from "../services/apiClient";

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const location   = useLocation();
  const successMsg = (location.state as any)?.message;

  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState<string | null>(null);
  const [isLoading,   setIsLoading]   = useState(false);
  // ✅ Fix: si backend يرجع 403 (email pas confirmé) — نبينو bouton resend
  const [needConfirm, setNeedConfirm] = useState(false);
  const [resendSent,  setResendSent]  = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setNeedConfirm(false);
    setIsLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        // ✅ Fix: backend كيرجع 403 إلا email ما confirmahch
        if (err.status === 403) {
          setNeedConfirm(true);
          setError(err.message);
        } else {
          setError(err.message);
        }
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-confirmation", {
        email: email.trim().toLowerCase(),
      });
      setResendSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur lors du renvoi.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Connexion</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Accédez à votre espace juridique LegalAI Maroc
        </p>

        {/* Message succès venant de register/reset */}
        {successMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
            {successMsg}
          </div>
        )}

        {/* Erreur générale */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* ✅ Fix: Email pas confirmé — bouton resend */}
        {needConfirm && (
          <div className="mb-4 p-4 rounded-lg bg-amber-50 border border-amber-200">
            <p className="text-amber-800 text-sm font-medium mb-2">
              📧 Email non confirmé
            </p>
            {resendSent ? (
              <p className="text-green-700 text-sm">✅ Email de confirmation renvoyé !</p>
            ) : (
              <button
                onClick={handleResend}
                className="text-sm text-amber-700 underline hover:text-amber-900"
              >
                Renvoyer l'email de confirmation
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <Link to="/forgot-password" className="text-xs text-blue-600 hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition"
          >
            {isLoading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Pas encore de compte ?{" "}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}