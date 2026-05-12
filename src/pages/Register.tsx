import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [fullName,   setFullName]   = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [confirm,    setConfirm]    = useState("");
  const [error,      setError]      = useState<string | null>(null);
  const [isLoading,  setIsLoading]  = useState(false);
  // ✅ Fix: backend kiyerja3 { email_sent } — khssna nwriw message confirmation email
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }
    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setIsLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, fullName.trim());
      // ✅ Fix: ma katredirectish l login — is_confirmed = False hta ydiru confirm
      setRegistered(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Succès — attente confirmation email ─────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            📧
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Vérifiez votre email !</h1>
          <p className="text-gray-500 text-sm mb-1">
            Un email de confirmation a été envoyé à
          </p>
          <p className="font-semibold text-gray-800 mb-4">{email}</p>
          <p className="text-gray-400 text-xs mb-6">
            Cliquez sur le lien dans l'email pour activer votre compte.
            Le lien expire dans 24 heures.
          </p>
          <div className="space-y-3">
            <Link
              to="/login"
              className="block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition"
            >
              Aller à la connexion
            </Link>
            {/* ✅ Fix: resend confirmation — route /auth/resend-confirmation */}
            <ResendButton email={email} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Formulaire ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Créer un compte</h1>
        <p className="text-gray-500 mb-6 text-sm">
          Rejoignez LegalAI Maroc — votre assistant juridique intelligent
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
              placeholder="Mohammed El Amrani"
            />
          </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe</label>
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

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition"
          >
            {isLoading ? "Création en cours..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-500">
          Déjà un compte ?{" "}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Resend Button ────────────────────────────────────────────────────────────
function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleResend = async () => {
    setLoading(true);
    try {
      const api = (await import("../services/apiClient")).default;
      await api.post("/auth/resend-confirmation", { email });
      setSent(true);
    } catch {
      alert("Erreur lors du renvoi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleResend}
      disabled={sent || loading}
      className="w-full px-6 py-3 border border-gray-300 hover:bg-gray-50 disabled:opacity-50 text-gray-600 text-sm font-medium rounded-xl transition"
    >
      {sent ? "✅ Email renvoyé !" : loading ? "Envoi..." : "Renvoyer l'email de confirmation"}
    </button>
  );
}