import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { decisionService } from "../services/index";
import { useLang } from "../i18n/LanguageContext";
import { parseSections } from "../lib/legalText";

function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function highlight(text: string, q: string) {
  if (!q.trim()) return text;
  const parts = text.split(new RegExp(`(${escapeRe(q.trim())})`, "gi"));
  return parts.map((p, i) =>
    p.toLowerCase() === q.trim().toLowerCase()
      ? <mark key={i} className="bg-yellow-200 rounded px-0.5">{p}</mark>
      : <span key={i}>{p}</span>
  );
}

export default function DecisionDetails() {
  const { t, lang } = useLang();
  const catLabel = (c?: string | null) => {
    if (!c) return "";
    const v = t("dec.catMap." + c);
    return v.includes("dec.catMap.") ? c : v;
  };
  const { id } = useParams<{ id: string }>();

  const { data: decision, isLoading, error } = useApi(
    () => decisionService.getById(Number(id)),
    [id]
  );

  const [docQuery, setDocQuery] = useState("");
  const blocks = useMemo(
    () => (decision?.full_text ? parseSections(decision.full_text, decision.title) : []),
    [decision]
  );
  const shown = useMemo(() => {
    const q = docQuery.trim();
    if (!q) return blocks;
    return blocks.filter((b) => (b.header && b.header.includes(q)) || b.body.includes(q));
  }, [blocks, docQuery]);

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
          {error ?? t("decd.notFound")}
        </div>
        <Link to="/decisions" className="mt-4 inline-block text-sm text-mizan-600 hover:underline">
          {t("decd.back")}
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <Link to="/decisions" className="text-sm text-mizan-600 hover:underline mb-4 inline-block">
        {t("decd.back")}
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
            📅 {new Date(decision.date).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        )}
        {decision.category && (
          <span className="bg-mizan-50 text-mizan-700 px-3 py-1 rounded-full">
            {catLabel(decision.category)}
          </span>
        )}
      </div>

      {/* Résumé */}
      {decision.summary && (
        <div className="bg-mizan-50 border border-mizan-100 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-mizan-900 mb-2">{t("decd.summary")}</h2>
          <p className="text-sm text-mizan-800 leading-relaxed">{decision.summary}</p>
        </div>
      )}

      {/* Texte intégral */}
      <div dir="auto">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-sm font-semibold text-gray-800">{t("decd.fullText")}</h2>
          {decision.full_text && (
            <input
              value={docQuery}
              onChange={(e) => setDocQuery(e.target.value)}
              placeholder={t("decd.searchInDoc")}
              className="flex-1 max-w-xs px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mizan-300"
            />
          )}
        </div>

        {!decision.full_text ? (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <p className="text-sm text-gray-500 italic">{t("decd.fullTextSoon")}</p>
          </div>
        ) : shown.length === 0 ? (
          <p className="text-sm text-gray-400">{t("decd.noMatch")}</p>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
            {shown.map((b, i) => (
              <div key={i}>
                {b.header && (
                  <h3 className="font-bold text-mizan-800 text-[15px] mt-2 mb-1">
                    {highlight(b.header, docQuery)}
                  </h3>
                )}
                {b.body && (
                  <p className="leading-8 text-gray-800 text-[15px]">
                    {highlight(b.body, docQuery)}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
