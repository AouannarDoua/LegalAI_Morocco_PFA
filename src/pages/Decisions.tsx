import { useState } from "react";
import { Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { decisionService, type Decision } from "../services/index";
import { useLang } from "../i18n/LanguageContext";

const CATEGORIES = [
  "Droit du travail",
  "Droit commercial",
  "Droit de la famille",
  "Droit pénal",
  "Droit administratif",
  "Droit immobilier",
];

export default function Decisions() {
  const { t, lang } = useLang();
  const catLabel = (c?: string | null) => {
    if (!c) return "";
    const v = t("dec.catMap." + c);
    return v.includes("dec.catMap.") ? c : v;
  };
  const [page, setPage]         = useState(1);
  const [category, setCategory] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useApi(
    () => decisionService.list(page, category),
    [page, category]
  );

  const decisions: Decision[] = data?.items ?? [];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("dec.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("dec.subtitle")}
        </p>
      </div>

      {/* Filtres catégorie */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setCategory(undefined); setPage(1); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
            !category
              ? "bg-mizan-600 text-white border-mizan-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t("dec.all")}
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
              category === cat
                ? "bg-mizan-600 text-white border-mizan-600"
                : "border-gray-300 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {catLabel(cat)}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Empty */}
      {!isLoading && decisions.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="font-medium text-gray-600">{t("dec.empty")}</p>
          {category && (
            <button
              onClick={() => setCategory(undefined)}
              className="mt-2 text-sm text-mizan-600 hover:underline"
            >
              {t("dec.resetFilter")}
            </button>
          )}
        </div>
      )}

      {/* List */}
      <div className="space-y-4">
        {decisions.map((decision) => (
          <Link
            key={decision.id}
            to={`/decisions/${decision.id}`}
            className="block bg-white border border-gray-200 rounded-xl p-5 hover:border-mizan-300 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="font-semibold text-gray-900 text-sm leading-snug mb-2">
                  {decision.title}
                </h2>
                <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                  {decision.court && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      🏛️ {decision.court}
                    </span>
                  )}
                  {decision.date && (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                      📅 {new Date(decision.date).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR")}
                    </span>
                  )}
                  {decision.category && (
                    <span className="bg-mizan-50 text-mizan-700 px-2 py-0.5 rounded-full">
                      {catLabel(decision.category)}
                    </span>
                  )}
                </div>
                {decision.summary && (
                  <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                    {decision.summary}
                  </p>
                )}
              </div>
              <span className="text-gray-300 text-lg flex-shrink-0">→</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.has_prev}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            {t("common.prev")}
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">
            {data.page} / {data.pages}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!data.has_next}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
