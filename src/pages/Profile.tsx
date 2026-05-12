import { useState, type FormEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { useMutation } from "../hooks/useApi";
import { profileService } from "../services/index";

export default function Profile() {
  const { user, refreshUser } = useAuth();

  const [fullName,   setFullName]   = useState(user?.full_name ?? "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPw,   setConfirmPw]   = useState("");
  const [profileMsg,  setProfileMsg]  = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pwMsg,       setPwMsg]       = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const { mutate: updateProfile, isLoading: savingProfile } = useMutation(
    profileService.update,
    {
      onSuccess: async () => {
        await refreshUser();
        setProfileMsg({ type: "ok", text: "Profil mis à jour avec succès" });
      },
      onError: (e) => setProfileMsg({ type: "err", text: e }),
    }
  );

  // ✅ Fix: useMutation prend une fonction avec UN seul argument objet
  // profileService.changePassword({ old_password, new_password })
  const { mutate: changePassword, isLoading: savingPw } = useMutation(
    (payload: { old_password: string; new_password: string }) =>
      profileService.changePassword(payload),
    {
      onSuccess: () => {
        setPwMsg({ type: "ok", text: "Mot de passe modifié avec succès" });
        setOldPassword("");
        setNewPassword("");
        setConfirmPw("");
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

    if (newPassword !== confirmPw) {
      setPwMsg({ type: "err", text: "Les mots de passe ne correspondent pas" });
      return;
    }
    if (newPassword.length < 8) {
      setPwMsg({ type: "err", text: "Le mot de passe doit contenir au moins 8 caractères" });
      return;
    }
    // ✅ Fix: objet unique passé à mutate
    changePassword({ old_password: oldPassword, new_password: newPassword });
  };

  const msgClass = (type: "ok" | "err") =>
    type === "ok"
      ? "bg-green-50 border-green-200 text-green-700"
      : "bg-red-50 border-red-200 text-red-700";

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mon profil</h1>

      {/* Avatar + email */}
      <div className="flex items-center gap-4 mb-8 p-5 bg-gray-50 rounded-xl border border-gray-200">
        <div className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
          {user?.full_name?.[0]?.toUpperCase() ??
            user?.email?.[0]?.toUpperCase() ??
            "?"}
        </div>
        <div>
          <p className="font-semibold text-gray-900">{user?.full_name || "—"}</p>
          <p className="text-sm text-gray-500">{user?.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
            {user?.role}
          </span>
        </div>
      </div>

      {/* Informations personnelles */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Informations personnelles
        </h2>

        {profileMsg && (
          <div className={`mb-3 p-3 border rounded-lg text-sm ${msgClass(profileMsg.type)}`}>
            {profileMsg.text}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-400"
            />
          </div>
          <button
            type="submit"
            disabled={savingProfile}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition text-sm"
          >
            {savingProfile ? "Enregistrement..." : "Enregistrer"}
          </button>
        </form>
      </section>

      {/* Mot de passe */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Changer le mot de passe
        </h2>

        {pwMsg && (
          <div className={`mb-3 p-3 border rounded-lg text-sm ${msgClass(pwMsg.type)}`}>
            {pwMsg.text}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {[
            { label: "Mot de passe actuel", value: oldPassword, setter: setOldPassword },
            { label: "Nouveau mot de passe", value: newPassword, setter: setNewPassword },
            { label: "Confirmer le nouveau mot de passe", value: confirmPw, setter: setConfirmPw },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {field.label}
              </label>
              <input
                type="password"
                required
                value={field.value}
                onChange={(e) => field.setter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••••"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={savingPw}
            className="px-6 py-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white font-semibold rounded-lg transition text-sm"
          >
            {savingPw ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </section>
    </div>
  );
}