import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation } from "../hooks/useApi";
import { profileService } from "../services/index";
import { useLang } from "../i18n/LanguageContext";
import PageHeader from "../components/PageHeader";
import { Save, KeyRound } from "lucide-react";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const { t } = useLang();

  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [profileMsg, setProfileMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const { mutate: updateProfile, isLoading: savingProfile } = useMutation(
    profileService.update,
    {
      onSuccess: async () => { await refreshUser(); setProfileMsg({ type: "ok", text: t("profile.saved") }); },
      onError: (e) => setProfileMsg({ type: "err", text: e }),
    }
  );

  const { mutate: changePassword, isLoading: savingPw } = useMutation(
    (payload: { old_password: string; new_password: string }) => profileService.changePassword(payload),
    {
      onSuccess: () => {
        setPwMsg({ type: "ok", text: t("profile.changed") });
        setOldPassword(""); setNewPassword(""); setConfirmPw("");
      },
      onError: (e) => setPwMsg({ type: "err", text: e }),
    }
  );

  const handleProfileSubmit = (e: FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    updateProfile({ full_name: fullName.trim() });
  };

  const handlePasswordSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPwMsg(null);
    if (newPassword !== confirmPw) { setPwMsg({ type: "err", text: t("profile.mismatch") }); return; }
    if (newPassword.length < 8) { setPwMsg({ type: "err", text: t("profile.short") }); return; }
    changePassword({ old_password: oldPassword, new_password: newPassword });
  };

  const msgClass = (type: "ok" | "err") =>
    type === "ok" ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader kicker="Mizan" title={t("profile.title")} />

      {/* Carte identité avec emblème */}
      <div className="card-zellij relative mb-6 overflow-hidden p-6">
        <div className="zellij-bg-gold pointer-events-none absolute inset-0 opacity-50" />
        <img src="/armoiries-maroc.png" alt="" aria-hidden
          className="pointer-events-none absolute -bottom-6 -end-4 h-32 w-32 object-contain opacity-10" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-mizan-600 text-2xl font-bold text-white">
            {user?.full_name?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink">{user?.full_name || "—"}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="badge mt-1.5 capitalize">{user?.role}</span>
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <section className="card mb-6 p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">{t("profile.personalInfo")}</h2>
        {profileMsg && (
          <div className={`mb-3 rounded-lg border p-3 text-sm ${msgClass(profileMsg.type)}`}>{profileMsg.text}</div>
        )}
        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="label">{t("profile.fullName")}</label>
            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">{t("profile.email")}</label>
            <input type="email" value={user?.email ?? ""} disabled
              className="input cursor-not-allowed bg-gray-50 text-gray-400" />
          </div>
          <button type="submit" disabled={savingProfile} className="btn-primary">
            <Save className="h-4 w-4" /> {savingProfile ? t("profile.saving") : t("profile.save")}
          </button>
        </form>
      </section>

      {/* Mot de passe */}
      <section className="card p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">{t("profile.changePassword")}</h2>
        {pwMsg && (
          <div className={`mb-3 rounded-lg border p-3 text-sm ${msgClass(pwMsg.type)}`}>{pwMsg.text}</div>
        )}
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {[
            { label: t("profile.current"), value: oldPassword, setter: setOldPassword },
            { label: t("profile.new"), value: newPassword, setter: setNewPassword },
            { label: t("profile.confirm"), value: confirmPw, setter: setConfirmPw },
          ].map((field) => (
            <div key={field.label}>
              <label className="label">{field.label}</label>
              <input type="password" required value={field.value}
                onChange={(e) => field.setter(e.target.value)} className="input" placeholder="••••••••" />
            </div>
          ))}
          <button type="submit" disabled={savingPw}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50">
            <KeyRound className="h-4 w-4" /> {savingPw ? t("profile.changing") : t("profile.change")}
          </button>
        </form>
      </section>
    </div>
  );
}
