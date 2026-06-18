import { useState, type FormEvent } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import api from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";
import AuthShell from "../components/AuthShell";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLang();
  const successMsg = (location.state as any)?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [needConfirm, setNeedConfirm] = useState(false);
  const [resendSent, setResendSent] = useState(false);

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
        if (err.status === 403) { setNeedConfirm(true); setError(err.message); }
        else setError(err.message);
      } else setError(t("auth.login.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post("/auth/resend-confirmation", { email: email.trim().toLowerCase() });
      setResendSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.login.generic"));
    }
  };

  return (
    <AuthShell title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      {successMsg && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {needConfirm && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="mb-2 text-sm font-medium text-amber-800">📧 {t("auth.login.notConfirmed")}</p>
          {resendSent ? (
            <p className="text-sm text-green-700">✅ {t("auth.login.resent")}</p>
          ) : (
            <button onClick={handleResend} className="text-sm text-amber-700 underline hover:text-amber-900">
              {t("auth.login.resend")}
            </button>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t("auth.login.email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="input" placeholder="vous@exemple.com" />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between">
            <label className="label mb-0">{t("auth.login.password")}</label>
            <Link to="/forgot-password" className="text-xs text-mizan-600 hover:underline">
              {t("auth.login.forgot")}
            </Link>
          </div>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="input" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? t("auth.login.submitting") : t("auth.login.submit")}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-gray-500">
        {t("auth.login.noAccount")}{" "}
        <Link to="/register" className="font-medium text-mizan-600 hover:underline">
          {t("auth.login.create")}
        </Link>
      </p>
    </AuthShell>
  );
}
