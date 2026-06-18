import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api, { ApiError } from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";
import AuthShell from "../components/AuthShell";

export default function ForgotPassword() {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.login.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell title={t("auth.forgot.sentTitle")} icon="📧" centered>
        <p className="text-sm text-gray-500">
          {t("auth.forgot.sentBody")} <strong>{email}</strong>.
        </p>
        <p className="mb-6 mt-2 text-xs text-gray-400">{t("auth.forgot.expire")}</p>
        <Link to="/login" className="btn-primary w-full py-3">{t("auth.reset.login")}</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.forgot.title")} subtitle={t("auth.forgot.subtitle")} icon="🔐" centered>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-start text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 text-start">
        <div>
          <label className="label">{t("auth.forgot.email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="input" placeholder="vous@exemple.com" />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
        </button>
      </form>
      <p className="mt-5 text-sm text-gray-500">
        <Link to="/login" className="font-medium text-mizan-600 hover:underline">{t("auth.forgot.back")}</Link>
      </p>
    </AuthShell>
  );
}
