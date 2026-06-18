import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { decisionService } from "../services/index";

export default function DecisionDetails() {
  const { id } = useParams<{ id: string }>();

  const { data: decision, isLoading, error } = useApi(
    () => decisionService.getById(Number(id)),
    [id]
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-2/3" />
        <div className="h-4 bg-gray-100 rounded w-1/3" />
        <div className="h-48 bg-gray-100 rounded-xl" />
      </div>
    );
  }

  if (error || !decision) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error ?? "Décision introuvable"}
        </div>
        <Link to="/decisions" className="mt-4 inline-block text-sm text-mizan-600 hover:underline">
          ← Retour aux décisions
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link to="/decisions" className="text-sm text-mizan-600 hover:underline mb-4 inline-block">
        ← Retour aux décisions
      </Link>

      {/* Header */}
      <h1 className="text-xl font-bold text-gray-900 mb-3 leading-snug">
        {decision.title}
      </h1>

      {/* Méta */}
      <div className="flex flex-wrap gap-2 mb-6 text-xs">
        {decision.court && (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            🏛️ {decision.court}
          </span>
        )}
        {decision.date && (
          <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
            📅 {new Date(decision.date).toLocaleDateString("fr-MA", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        )}
        {decision.category && (
          <span className="bg-mizan-50 text-mizan-700 px-3 py-1 rounded-full">
            {decision.category}
          </span>
        )}
      </div>

      {/* Résumé */}
      {decision.summary && (
        <div className="bg-mizan-50 border border-mizan-100 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-mizan-900 mb-2">Résumé</h2>
          <p className="text-sm text-mizan-800 leading-relaxed">{decision.summary}</p>
        </div>
      )}

      {/* Texte complet — à ajouter via l'endpoint /decisions/:id quand disponible */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-800 mb-3">Texte intégral</h2>
        <p className="text-sm text-gray-500 italic">
          Le texte intégral de cette décision sera disponible prochainement.
        </p>
      </div>
    </div>
  );
}
