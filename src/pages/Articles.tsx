import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { articleService, type Article } from "../services/index";
import { useLang } from "../i18n/LanguageContext";

const CATEGORIES = [
  "Droit des affaires",
  "Droit de la famille",
  "Droit du travail",
  "Droit pénal",
  "Procédures judiciaires",
  "Actualités juridiques",
];

export default function Articles() {
  const { t, lang } = useLang();
  const catLabel = (c?: string | null) => {
    if (!c) return "";
    const v = t("artsCatMap." + c);
    return v.includes("artsCatMap.") ? c : v;
  };
  const [page, setPage]         = useState(1);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Article | null>(null);

  const { data, isLoading, error } = useApi(
    () => articleService.list(page, category),
    [page, category]
  );

  const articles: Article[] = data?.items ?? [];

  // ─── Article detail view ──────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button
          onClick={() => setSelected(null)}
          className="text-sm text-mizan-600 hover:underline mb-4 inline-block"
        >
          {t("arts.back")}
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-3">{selected.title}</h1>
        <div className="flex gap-2 text-xs mb-6">
          {selected.author && (
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
              ✍️ {selected.author}
            </span>
          )}
          {selected.category && (
            <span className="bg-mizan-50 text-mizan-700 px-3 py-1 rounded-full">
              {selected.category}
            </span>
          )}
          <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
            {new Date(selected.created_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-sm text-gray-500 italic">
            {t("arts.detailSoon")}
          </p>
        </div>
      </div>
    );
  }

  // ─── Article list ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("arts.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">
          {t("arts.subtitle")}
        </p>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setCategory(undefined); setPage(1); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
            !category
              ? "bg-mizan-600 text-white border-mizan-600"
              : "border-gray-300 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {t("arts.all")}
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
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
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
      {!isLoading && articles.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-medium text-gray-600">{t("arts.empty")}</p>
        </div>
      )}

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => setSelected(article)}
            className="text-left bg-white border border-gray-200 rounded-xl p-5 hover:border-mizan-300 hover:shadow-sm transition"
          >
            <div className="flex items-start justify-between gap-2 mb-3">
              {article.category && (
                <span className="text-xs bg-mizan-50 text-mizan-700 px-2 py-0.5 rounded-full">
                  {article.category}
                </span>
              )}
              <span className="text-xs text-gray-400 flex-shrink-0">
                {new Date(article.created_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR")}
              </span>
            </div>
            <h2 className="font-semibold text-gray-900 text-sm leading-snug mb-2">
              {article.title}
            </h2>
            {article.author && (
              <p className="text-xs text-gray-500">{t("arts.by")} {article.author}</p>
            )}
          </button>
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
