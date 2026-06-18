import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";
import AuthShell from "../components/AuthShell";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError(t("auth.register.mismatch")); return; }
    if (password.length < 8) { setError(t("auth.register.short")); return; }
    setIsLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, fullName.trim());
      setRegistered(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.login.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  if (registered) {
    return (
      <AuthShell title={t("auth.register.checkTitle")} icon="📧" centered>
        <p className="text-sm text-gray-500">{t("auth.register.sentTo")}</p>
        <p className="mb-4 font-semibold text-gray-800">{email}</p>
        <p className="mb-6 text-xs text-gray-400">{t("auth.register.activate")}</p>
        <div className="space-y-3">
          <Link to="/login" className="btn-primary w-full py-3">{t("auth.register.goLogin")}</Link>
          <ResendButton email={email} />
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">{t("auth.register.fullName")}</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
            className="input" placeholder="Mohammed El Amrani" />
        </div>
        <div>
          <label className="label">{t("auth.register.email")}</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="input" placeholder="vous@exemple.com" />
        </div>
        <div>
          <label className="label">{t("auth.register.password")}</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="input" placeholder="8+" />
        </div>
        <div>
          <label className="label">{t("auth.register.confirm")}</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="input" placeholder="••••••••" />
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? t("auth.register.submitting") : t("auth.register.submit")}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-gray-500">
        {t("auth.register.have")}{" "}
        <Link to="/login" className="font-medium text-mizan-600 hover:underline">{t("auth.register.signin")}</Link>
      </p>
    </AuthShell>
  );
}

function ResendButton({ email }: { email: string }) {
  const { t } = useLang();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const handleResend = async () => {
    setLoading(true);
    try {
      const api = (await import("../services/apiClient")).default;
      await api.post("/auth/resend-confirmation", { email });
      setSent(true);
    } catch { /* noop */ } finally { setLoading(false); }
  };
  return (
    <button onClick={handleResend} disabled={sent || loading} className="btn-outline w-full py-3 disabled:opacity-50">
      {sent ? `✅ ${t("auth.register.resent")}` : loading ? t("auth.register.sending") : t("auth.register.resend")}
    </button>
  );
}
