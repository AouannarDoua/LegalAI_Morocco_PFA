import { useState } from "react";
import { useApi, useMutation } from "../hooks/useApi";
import { notificationService, type Notification } from "../services/index";

const TYPE_STYLE: Record<string, string> = {
  info:    "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
  success: "bg-green-50 border-green-200 text-green-800",
  error:   "bg-red-50 border-red-200 text-red-800",
};

const TYPE_ICON: Record<string, string> = {
  info: "ℹ️", warning: "⚠️", success: "✅", error: "❌",
};

export default function Notifications() {
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
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowUnread((v) => !v)}
            className={`px-3 py-1.5 text-sm rounded-lg border transition ${
              showUnread
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            Non lues seulement
          </button>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead()}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition"
            >
              Tout marquer lu
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
          <p>Aucune notification{showUnread ? " non lue" : ""}</p>
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
                    {new Date(notif.created_at).toLocaleDateString("fr-MA", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
              </div>
              {!notif.is_read && (
                <button
                  onClick={() => markRead(notif.id)}
                  className="text-xs text-blue-600 hover:underline flex-shrink-0"
                >
                  Marquer lu
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
