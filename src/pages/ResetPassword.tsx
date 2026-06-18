import { useState, type FormEvent } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api, { ApiError } from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";
import AuthShell from "../components/AuthShell";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) { setError(t("auth.reset.mismatch")); return; }
    if (password.length < 8) { setError(t("auth.reset.short")); return; }
    if (!token) { setError(t("auth.reset.noToken")); return; }
    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      setSuccess(true);
      setTimeout(() => navigate("/login", {
        state: { message: t("auth.reset.successTitle") },
      }), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("auth.login.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthShell title={t("auth.reset.invalidTitle")} icon="❌" centered>
        <p className="mb-6 text-sm text-gray-500">{t("auth.reset.invalidBody")}</p>
        <Link to="/forgot-password" className="btn-primary w-full py-3">{t("auth.reset.toForgot")}</Link>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell title={t("auth.reset.successTitle")} icon="✅" centered>
        <p className="mb-4 text-sm text-gray-500">{t("auth.reset.successBody")}</p>
        <p className="mb-4 text-xs text-gray-400">{t("auth.reset.redirecting")}</p>
        <Link to="/login" className="btn-primary w-full py-3">{t("auth.reset.login")}</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.reset.title")} subtitle={t("auth.reset.subtitle")} icon="🔑" centered>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-start text-sm text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4 text-start">
        <div>
          <label className="label">{t("auth.reset.newPw")}</label>
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            className="input" placeholder="8+" />
        </div>
        <div>
          <label className="label">{t("auth.reset.confirm")}</label>
          <input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)}
            className="input" placeholder="••••••••" />
        </div>
        {password && (
          <div className="space-y-1">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
                  password.length >= i * 3
                    ? password.length >= 12 ? "bg-green-500"
                    : password.length >= 8 ? "bg-yellow-500" : "bg-red-400"
                    : "bg-gray-200"}`} />
              ))}
            </div>
            <p className="text-xs text-gray-400">
              {password.length < 8 ? t("auth.reset.weak") : password.length < 12 ? t("auth.reset.ok") : `${t("auth.reset.strong")} ✅`}
            </p>
          </div>
        )}
        <button type="submit" disabled={isLoading} className="btn-primary w-full py-3">
          {isLoading ? t("auth.reset.submitting") : t("auth.reset.submit")}
        </button>
      </form>
    </AuthShell>
  );
}
