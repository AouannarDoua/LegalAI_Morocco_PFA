import { Link } from "react-router-dom"; // Import indispensable
import { useAuth } from "../hooks/useAuth";
import { useApi } from "../hooks/useApi";
import { dashboardService, type DashboardStats } from "../services/index";

// ─── Stat card (Mise à jour pour accepter un lien) ──────────────────────────

function StatCard({
  label,
  value,
  icon,
  color,
  href, // Ajout du lien
}: {
  label: string;
  value: number | string;
  icon: string;
  color: string;
  href: string; // Destination du clic
}) {
  return (
    <Link to={href} className="bg-white rounded-xl border border-gray-200 p-6 flex items-center gap-4 hover:border-blue-300 transition-all shadow-sm hover:shadow-md">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </Link>
  );
}

// ─── Dashboard ─────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading, error } = useApi<DashboardStats>(
    () => dashboardService.getStats()
  );

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Bonjour{user?.full_name ? `, ${user.full_name}` : ""} 👋
        </h1>
        <p className="text-gray-500 mt-1">
          Voici un aperçu de votre espace juridique
        </p>
      </div>

      {/* Stats */}
      {isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
              <div className="w-12 h-12 rounded-xl bg-gray-100 mb-3" />
              <div className="h-6 bg-gray-100 rounded w-16 mb-2" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          Impossible de charger les statistiques : {error}
        </div>
      )}

      {stats && !isLoading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Contrats"
            value={stats.contracts}
            icon="📄"
            color="bg-blue-50"
            href="/contracts" // Redirection vers documents ou analysis
          />
          <StatCard
            label="Documents"
            value={stats.documents}
            icon="📁"
            color="bg-purple-50"
            href="/documents"
          />
          <StatCard
            label="Notifications"
            value={stats.unread_notifications}
            icon="🔔"
            color="bg-amber-50"
            href="/notifications" // C'est ici que ça se joue !
          />
          <StatCard
            label="Questions posées"
            value={stats.chat_sessions}
            icon="💬"
            color="bg-green-50"
            href="/chat"
          />
        </div>
      )}

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Actions rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Analyser un contrat", href: "/contract-analysis", icon: "🔍", desc: "Déposer un contrat pour analyse IA" },
            { label: "Générer un contrat", href: "/contract-generator", icon: "✍️", desc: "Créer un contrat sur mesure" },
            { label: "Poser une question", href: "/chat", icon: "⚖️", desc: "Consulter l'assistant juridique" },
          ].map((action) => (
            <Link // Utilisation de Link au lieu de <a>
              key={action.href}
              to={action.href}
              className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-sm transition group"
            >
              <div className="text-2xl mb-2">{action.icon}</div>
              <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                {action.label}
              </p>
              <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}