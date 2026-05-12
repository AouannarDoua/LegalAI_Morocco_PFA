import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../services/apiClient";
import { ApiError } from "../services/apiClient";

export default function ForgotPassword() {
  const [email,     setEmail]     = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Succès ───────────────────────────────────────────────────────────────
  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            📧
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Email envoyé !</h1>
          <p className="text-gray-500 text-sm mb-6">
            Un lien de réinitialisation a été envoyé à <strong>{email}</strong>.
            Vérifiez votre boîte mail.
          </p>
          <p className="text-gray-400 text-xs mb-6">
            Le lien expire dans 1 heure.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
          >
            Retour à la connexion
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
            🔐
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié ?</h1>
          <p className="text-gray-500 text-sm mt-1">
            Entrez votre email pour recevoir un lien de réinitialisation
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
              Adresse email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="vous@exemple.com"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition"
          >
            {isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}