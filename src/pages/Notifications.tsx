import { useState } from "react";
import { useApi, useMutation } from "../hooks/useApi";
import { notificationService, type Notification } from "../services/index";
import { useLang } from "../i18n/LanguageContext";

const TYPE_STYLE: Record<string, string> = {
  info:    "bg-mizan-50 border-mizan-200 text-mizan-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-800",
};

const TYPE_ICON: Record<string, string> = {
  info: "ℹ️", warning: "⚠️", success: "✅", error: "❌",
};

export default function Notifications() {
  const { t, lang } = useLang();
  const [showUnread, setShowUnread] = useState(false);

  const { data, isLoading, error, refetch } = useApi(
    () => notificationService.list(1, showUnread),
    [showUnread]
  );

  const { mutate: markRead }    = useMutation(notificationService.markRead,    { onSuccess: refetch });
  const { mutate: markAllRead } = useMutation(notificationService.markAllRead, { onSuccess: refetch });

  const notifications: Notification[] = data?.items ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("notif.title")}</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} {unreadCount > 1 ? t("notif.unreadOther") : t("notif.unreadOne")}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUnread((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition ${
              showUnread
                ? "bg-mizan-600 text-white border-mizan-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {t("notif.unreadOnly")}
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              {t("notif.markAllRead")}
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {!isLoading && notifications.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔔</div>
          <p>{showUnread ? t("notif.emptyUnread") : t("notif.empty")}</p>
        </div>
      )}

      <div className="space-y-3">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            className={`border rounded-xl p-4 transition ${
              notif.is_read
                ? "bg-white border-gray-200"
                : TYPE_STYLE[notif.notif_type] ?? TYPE_STYLE.info
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 flex-1">
                <span className="text-lg mt-0.5">{TYPE_ICON[notif.notif_type] ?? "ℹ️"}</span>
                <div>
                  <p className="font-medium text-sm">{notif.title}</p>
                  {notif.message && (
                    <p className="text-sm opacity-80 mt-0.5">{notif.message}</p>
                  )}
                  <p className="text-xs opacity-60 mt-1">
                    {new Date(notif.created_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {!notif.is_read && (
                <button
                  onClick={() => markRead(notif.id)}
                  className="text-xs text-mizan-600 hover:underline flex-shrink-0"
                >
                  {t("notif.markRead")}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
