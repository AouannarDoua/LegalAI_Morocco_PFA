import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Gavel, FileText, MessageSquare, FilePlus, Search,
  Bell, User, LogOut, Scale, Calculator, ShieldCheck,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/useAuth";
import { useLang } from "../i18n/LanguageContext";

const navItems = [
  { icon: LayoutDashboard, key: "dashboard",        path: "/dashboard" },
  { icon: Gavel,           key: "decisions",        path: "/decisions" },
  { icon: Scale,           key: "articles",         path: "/articles" },
  { icon: MessageSquare,   key: "chat",             path: "/chat" },
  { icon: FilePlus,        key: "contractGen",      path: "/contract-generator" },
  { icon: Search,          key: "contractAnalysis", path: "/contract-analysis" },
  { icon: FileText,        key: "documents",        path: "/documents" },
  { icon: Bell,            key: "notifications",     path: "/notifications" },
  { icon: FileText,        key: "contracts",        path: "/contracts" },
  { icon: Calculator,      key: "taxSim",           path: "/tax-simulator" },
  { icon: ShieldCheck,     key: "taxAdmin",         path: "/tax-admin", adminOnly: true },
];

// ✅ Motif zellige (octogone + losange)
const ZELLIJ =
  "url(\"data:image/svg+xml,%3Csvg width='46' height='46' viewBox='0 0 46 46' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23a8d2c1' stroke-opacity='0.45' stroke-width='1.3'%3E%3Cpolygon points='13.5,0 32.5,0 46,13.5 46,32.5 32.5,46 13.5,46 0,32.5 0,13.5'/%3E%3Crect x='15.5' y='15.5' width='15' height='15' transform='rotate(45 23 23)'/%3E%3Ccircle cx='23' cy='23' r='3'/%3E%3C/g%3E%3C/svg%3E\")";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };
  const visibleItems = navItems.filter((item) => !item.adminOnly || user?.role === "admin");

  // classes d'un lien de navigation selon l'état (replié = icône centrée, sans texte)
  const linkClass = (isActive: boolean) =>
    cn(
      "flex items-center rounded-lg text-sm font-medium transition-all duration-200",
      collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
      isActive ? "bg-mizan-50 text-mizan-800 shadow-sm"
               : "text-gray-600 hover:bg-white/70 hover:text-gray-900"
    );

  return (
    <aside
      className={cn(
        "fixed inset-y-0 start-0 z-50 flex flex-col border-e border-gray-200 bg-white transition-[width] duration-300 ease-in-out",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* fond zellige */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: ZELLIJ, backgroundSize: "46px 46px" }} />

      {/* En-tête : logo + bouton ouvrir/fermer */}
      <div className={cn("relative flex items-center p-4", collapsed ? "justify-center" : "justify-between")}>
        <NavLink to="/" className="flex items-center gap-3 overflow-hidden">
          <span className="text-mizan-600 flex-shrink-0">
            <svg width="34" height="34" viewBox="0 0 40 40">
              <g fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinejoin="round">
                <polygon points="20,3 24.5,15.5 37,20 24.5,24.5 20,37 15.5,24.5 3,20 15.5,15.5" />
                <polygon points="20,8 23,17 32,20 23,23 20,32 17,23 8,20 17,17" />
              </g>
              <circle cx="20" cy="20" r="2.4" fill="#C1272D" />
            </svg>
          </span>
          {!collapsed && (
            <span className="leading-none whitespace-nowrap">
              <span className="font-display text-xl font-semibold tracking-tight text-ink">
                Miz<span className="text-mizan-600">an</span>
              </span>
              <span className="block font-ar text-[11px] font-semibold text-gold-600">ميزان</span>
            </span>
          )}
        </NavLink>
        {!collapsed && (
          <button onClick={onToggle} title={t("ui.collapse") || "Réduire"}
            className="grid h-8 w-8 place-items-center rounded-lg text-gray-500 transition hover:bg-mizan-50 hover:text-mizan-700">
            <PanelLeftClose className="h-5 w-5 rtl:rotate-180" />
          </button>
        )}
      </div>

      {/* bouton ouvrir quand c'est réduit */}
      {collapsed && (
        <button onClick={onToggle} title={t("ui.expand") || "Ouvrir le menu"}
          className="relative mx-auto mb-1 grid h-9 w-9 place-items-center rounded-lg text-gray-500 transition hover:bg-mizan-50 hover:text-mizan-700">
          <PanelLeftOpen className="h-5 w-5 rtl:rotate-180" />
        </button>
      )}

      <nav className="relative flex-1 space-y-1 overflow-y-auto overflow-x-hidden px-3 py-2">
        {visibleItems.map((item) => {
          const label = t(`nav.${item.key}`);
          return (
            <NavLink key={item.path} to={item.path} title={collapsed ? label : undefined}
              className={({ isActive }) => linkClass(isActive)}>
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="relative border-t border-gray-200 bg-white/70 p-3 backdrop-blur-sm">
        <NavLink to="/profile" title={collapsed ? t("nav.profile") : undefined}
          className={({ isActive }) =>
            cn("flex items-center rounded-lg text-sm font-medium transition-all duration-200",
              collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3",
              isActive ? "bg-mizan-50 text-mizan-800" : "text-gray-600 hover:bg-white hover:text-gray-900")}>
          <User className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">{t("nav.profile")}</span>}
        </NavLink>
        <button onClick={handleLogout} title={collapsed ? t("nav.logout") : undefined}
          className={cn("mt-1 flex w-full items-center rounded-lg text-sm font-medium text-flag transition-all duration-200 hover:bg-red-50",
            collapsed ? "justify-center px-0 py-3" : "gap-3 px-4 py-3")}>
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap">{t("nav.logout")}</span>}
        </button>
      </div>
    </aside>
  );
}