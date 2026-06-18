import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import api from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";
import AuthShell from "../components/AuthShell";

type Status = "loading" | "success" | "error";

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useLang();
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) { setStatus("error"); setMessage(t("auth.confirm.missing")); return; }
    (async () => {
      try {
        await api.get<{ message: string }>(`/auth/confirm-email?token=${token}`);
        setStatus("success");
        setMessage(t("auth.confirm.successBody"));
        setTimeout(() => navigate("/login", {
          state: { message: t("auth.confirm.successBody") },
        }), 3000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || t("auth.confirm.expired"));
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (status === "loading") {
    return (
      <AuthShell title={t("auth.confirm.loadingTitle")} subtitle={t("auth.confirm.loadingBody")} centered>
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-mizan-600 border-t-transparent" />
      </AuthShell>
    );
  }
  if (status === "success") {
    return (
      <AuthShell title={t("auth.confirm.successTitle")} icon="✅" centered>
        <p className="mb-2 text-sm text-gray-500">{message}</p>
        <p className="mb-6 text-xs text-gray-400">{t("auth.confirm.redirecting")}</p>
        <Link to="/login" className="btn-primary w-full py-3">{t("auth.confirm.login")}</Link>
      </AuthShell>
    );
  }
  return (
    <AuthShell title={t("auth.confirm.errorTitle")} icon="❌" centered>
      <p className="mb-6 text-sm text-red-600">{message}</p>
      <div className="space-y-3">
        <Link to="/register" className="btn-primary w-full py-3">{t("auth.confirm.newAccount")}</Link>
        <Link to="/login" className="btn-outline w-full py-3">{t("auth.confirm.back")}</Link>
      </div>
    </AuthShell>
  );
}
