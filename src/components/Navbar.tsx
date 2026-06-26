import { Link } from "react-router-dom";
import { Bell, Search, ChevronDown } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../i18n/LanguageContext";
import { useDesktopNotifications } from "../hooks/useDesktopNotifications";
import LanguageToggle from "./LanguageToggle";

export default function Navbar({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth();
  const { t } = useLang();
  // Notifications bureau natives (comme WhatsApp) + compteur de non-lus
  const { permission, requestPermission, unread } = useDesktopNotifications(!!user);

  const name = (user as any)?.full_name || (user as any)?.fullName || (user as any)?.email || "Mizan";
  const initials = name.split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();

  return (
    <header className={`fixed top-0 end-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-8 transition-[inset-inline-start] duration-300 ${collapsed ? "start-20" : "start-64"}`}>
      <div className="max-w-xl flex-1">
        <div className="group relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-mizan-600" />
          <input type="text" placeholder={t("navbar.search")}
            className="w-full rounded-lg border border-transparent bg-gray-50 py-2 ps-10 pe-4 text-sm transition-all focus:border-mizan-200 focus:bg-white focus:outline-none" />
        </div>
      </div>

      <div className="flex items-center gap-5">
        <LanguageToggle />

        <Link to="/notifications"
          onClick={() => { if (permission !== "granted") requestPermission(); }}
          title={permission === "granted" ? undefined : t("notif.enable")}
          className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-50">
          <Bell className="h-5 w-5" />
          {unread > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full border-2 border-white bg-flag px-1 text-[10px] font-bold leading-none text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          ) : (
            permission !== "granted" && (
              <span className="absolute end-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-gold-500" />
            )
          )}
        </Link>

        <div className="h-8 w-px bg-gray-200" />

        {/* 👉 clique sur le nom → page profil */}
        <Link to="/profile" title={t("nav.profile")}
          className="flex items-center gap-3 rounded-lg p-1 pe-2 transition-colors hover:bg-gray-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-mizan-100 text-sm font-semibold text-mizan-800">
            {initials}
          </div>
          <div className="hidden text-start sm:block">
            <p className="text-sm font-semibold leading-none text-gray-900">{name}</p>
            <p className="mt-1 text-xs text-gray-500">{t("navbar.role")}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Link>
      </div>
    </header>
  );
}