import { Link } from "react-router-dom";
import type { ComponentType } from "react";
import {
  FileText, FolderClosed, Bell, MessageSquare,
  Search, PenLine, Scale, ArrowUpRight,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { dashboardService, type DashboardStats } from "../services/index";
import { useLang } from "../i18n/LanguageContext";

// ── textes bilingues (locaux à cette page, aucune autre modif requise) ──
const T = {
  fr: {
    hi: "Bonjour", overview: "Voici un aperçu de votre espace juridique",
    contracts: "Contrats", documents: "Documents",
    notifications: "Notifications", questions: "Questions posées",
    quick: "Actions rapides", loadErr: "Impossible de charger les statistiques :",
    a1: "Analyser un contrat", a1d: "Déposer un contrat pour analyse IA",
    a2: "Générer un contrat",  a2d: "Créer un contrat sur mesure",
    a3: "Poser une question",  a3d: "Consulter l'assistant juridique",
    kicker: "Tableau de bord",
  },
  ar: {
    hi: "مرحباً", overview: "إليك لمحة عن فضائك القانوني",
    contracts: "العقود", documents: "الوثائق",
    notifications: "الإشعارات", questions: "الأسئلة المطروحة",
    quick: "إجراءات سريعة", loadErr: "تعذّر تحميل الإحصائيات:",
    a1: "تحليل عقد", a1d: "أودِع عقداً لتحليله بالذكاء الاصطناعي",
    a2: "إنشاء عقد", a2d: "أنشئ عقداً مخصّصاً",
    a3: "اطرح سؤالاً", a3d: "استشر المساعد القانوني",
    kicker: "لوحة التحكم",
  },
};

type IconType = ComponentType<{ className?: string }>;

function StatCard({ label, value, Icon, tile, href }: {
  label: string; value: number | string; Icon: IconType; tile: string; href: string;
}) {
  return (
    <Link to={href}
      className="group relative flex items-center gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-gold-soft hover:shadow-[0_18px_40px_-28px_rgba(10,77,56,0.5)]">
      <div className={`grid h-12 w-12 flex-none place-items-center rounded-xl ${tile}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-display text-2xl font-semibold leading-none text-ink">{value}</p>
        <p className="mt-1 text-sm text-gray-500">{label}</p>
      </div>
      <ArrowUpRight className="absolute end-4 top-4 h-4 w-4 text-gray-300 transition group-hover:text-mizan-600 rtl:rotate-[-90deg]" />
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { lang } = useLang();
  const L = T[lang];
  const { data: stats, isLoading, error } = useApi<DashboardStats>(() => dashboardService.getStats());

  const actions = [
    { label: L.a1, desc: L.a1d, href: "/contract-analysis",  Icon: Search,  tile: "bg-mizan-50 text-mizan-600" },
    { label: L.a2, desc: L.a2d, href: "/contract-generator", Icon: PenLine, tile: "bg-gold-50 text-gold-600" },
    { label: L.a3, desc: L.a3d, href: "/chat",               Icon: Scale,   tile: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="page-kicker">{L.kicker}</div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          {L.hi}{user?.full_name ? `, ${user.full_name}` : ""} <span className="align-middle">👋</span>
        </h1>
        <p className="mt-1 text-gray-500">{L.overview}</p>
      </div>

      {/* Stats */}
      {isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-100 bg-white p-5">
              <div className="mb-3 h-12 w-12 rounded-xl bg-gray-100" />
              <div className="mb-2 h-6 w-16 rounded bg-gray-100" />
              <div className="h-4 w-24 rounded bg-gray-100" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {L.loadErr} {error}
        </div>
      )}

      {stats && !isLoading && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label={L.contracts}     value={stats.contracts}            Icon={FileText}      tile="bg-mizan-50 text-mizan-600"     href="/contracts" />
          <StatCard label={L.documents}     value={stats.documents}            Icon={FolderClosed}  tile="bg-gold-50 text-gold-600"       href="/documents" />
          <StatCard label={L.notifications} value={stats.unread_notifications} Icon={Bell}          tile="bg-amber-50 text-amber-600"     href="/notifications" />
          <StatCard label={L.questions}     value={stats.chat_sessions}        Icon={MessageSquare} tile="bg-emerald-50 text-emerald-600" href="/chat" />
        </div>
      )}

      {/* Actions rapides */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">{L.quick}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {actions.map((a) => (
            <Link key={a.href} to={a.href}
              className="group rounded-2xl border border-gray-100 bg-white p-5 transition hover:-translate-y-1 hover:border-gold-soft hover:shadow-[0_18px_40px_-28px_rgba(10,77,56,0.5)]">
              <div className={`mb-3 grid h-11 w-11 place-items-center rounded-xl ${a.tile}`}>
                <a.Icon className="h-5 w-5" />
              </div>
              <p className="flex items-center gap-1 font-semibold text-gray-900 transition group-hover:text-mizan-600">
                {a.label}
                <ArrowUpRight className="h-4 w-4 opacity-0 transition group-hover:opacity-100 rtl:rotate-[-90deg]" />
              </p>
              <p className="mt-1 text-sm text-gray-500">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}