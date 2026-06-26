import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useApi } from "../hooks/useApi";
import { articleService, type Article } from "../services/index";
import { useLang } from "../i18n/LanguageContext";

// Reforme un texte mal découpé (retours à la ligne au milieu des phrases / mots)
// en sections { header, body }. Recolle les lettres isolées (ت + عد = تعد),
// joint les fragments, et détecte les titres (المادة N / أولا / 1- / أ - / titre court).
const LAW_HEAD = /^(المادة|الفصل|الباب|القسم|الكتاب|الفرع)\s+[\d\u0660-\u0669]/;
const ORDINAL  = /^(أولا|ثانيا|ثالثا|رابعا|خامسا|سادسا|سابعا|ثامنا|تاسعا|عاشرا)ً?\b/;
const NUMBERED = /^[\d\u0660-\u0669]+\s*[-\u2013.)]/;
const LETTER   = /^[أ-ي]\s*[-\u2013]\s/;
const NUM_ONLY = /^[\d\u0660-\u0669]+\s*[-\u2013.)]\s*$/;

function fixSpacing(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+([،؛.:!؟])/g, "$1")
    .replace(/([،؛])(?=\S)/g, "$1 ")
    .trim();
}

function reflow(lines: string[]) {
  let s = "";
  for (const raw of lines) {
    const p = raw.trim();
    if (!p) continue;
    if (/^[<>«»►▪•\-\u2013\u2014_=*~^|.]+$/.test(p)) continue;   // ligne = bruit
    if (s === "") { s = p; continue; }
    const lastWord = s.split(/\s/).pop() || "";
    if (lastWord.length === 1 && /[\u0621-\u064A]/.test(lastWord)) s += p;  // recolle lettre isolée
    else if (/^[،؛.:!؟]/.test(p)) s += p;                                    // ponctuation collée
    else s += " " + p;
  }
  return fixSpacing(s);
}

function parseSections(content: string, title?: string) {
  let lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  // enlève le titre dupliqué en tête
  const t0 = (title || "").replace(/[.،:]+$/, "").trim();
  if (lines.length && lines[0].replace(/[.،:]+$/, "").trim() === t0) lines = lines.slice(1);
  // recolle un marqueur de numéro isolé ("2-") avec la ligne suivante
  const merged: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (NUM_ONLY.test(lines[i]) && lines[i + 1]) { merged.push(lines[i] + " " + lines[++i]); }
    else merged.push(lines[i]);
  }
  lines = merged;

  const isHeading = (line: string, next?: string) => {
    if (LAW_HEAD.test(line) || ORDINAL.test(line) || NUMBERED.test(line) || LETTER.test(line)) return true;
    if (line.length <= 45 && !/[.،؛:!؟]$/.test(line) && next && /^[:\-\u2013]/.test(next.trim())) return true;
    return false;
  };

  const sections: { header: string | null; body: string }[] = [];
  let cur: { header: string | null; buf: string[] } = { header: null, buf: [] };
  const flush = () => {
    if (cur.header || cur.buf.length) sections.push({ header: cur.header, body: reflow(cur.buf) });
  };
  for (let i = 0; i < lines.length; i++) {
    if (isHeading(lines[i], lines[i + 1])) { flush(); cur = { header: lines[i], buf: [] }; }
    else cur.buf.push(lines[i]);
  }
  flush();
  return sections.filter((s) => s.header || s.body);
}

export default function Articles() {
  const { t, lang } = useLang();
  const [sp, setSp] = useSearchParams();
  const navigate = useNavigate();
  const openId = sp.get("a");

  const [page, setPage]         = useState(1);
  const [category, setCategory] = useState<string | undefined>(undefined);
  const [cats, setCats]         = useState<string[]>([]);
  const [search, setSearch]     = useState("");   // saisie utilisateur
  const [q, setQ]               = useState("");   // requête débouncée envoyée à l'API

  // Catégories réelles (arabes) -> chips dynamiques.
  useEffect(() => {
    articleService.categories().then(setCats).catch(() => setCats([]));
  }, []);

  // Debounce de la recherche (400 ms).
  useEffect(() => {
    const id = setTimeout(() => { setQ(search); setPage(1); }, 400);
    return () => clearTimeout(id);
  }, [search]);

  // ─── Détail (piloté par l'URL ?a=ID -> le bouton retour navigateur marche) ──
  const [detail, setDetail]               = useState<Article | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [inLawQuery, setInLawQuery]       = useState("");   // recherche DANS la loi

  useEffect(() => {
    if (!openId) { setDetail(null); setInLawQuery(""); return; }
    setDetailLoading(true);
    setDetail(null);
    articleService.getById(Number(openId))
      .then(setDetail)
      .catch(() => setDetail(null))
      .finally(() => setDetailLoading(false));
  }, [openId]);

  const { data, isLoading, error } = useApi(
    () => articleService.list(page, category, q),
    [page, category, q]
  );
  const articles: Article[] = data?.items ?? [];

  const blocks = useMemo(
    () => (detail?.content ? parseSections(detail.content, detail.title) : []),
    [detail]
  );
  const lawHeadCount = blocks.filter((b) => b.header && LAW_HEAD.test(b.header)).length;
  const isLaw = lawHeadCount >= 3;
  const shownBlocks = useMemo(() => {
    const query = inLawQuery.trim();
    if (!query) return blocks;
    return blocks.filter(
      (b) => (b.header && b.header.includes(query)) || b.body.includes(query)
    );
  }, [blocks, inLawQuery]);

  // ─── Vue DÉTAIL ─────────────────────────────────────────────────────────────
  if (openId) {
    return (
      <div className="p-6 max-w-3xl mx-auto" dir="auto">
        <button
          onClick={() => navigate(-1)}   /* revient à la liste, reste sur /articles */
          className="text-sm text-mizan-600 hover:underline mb-4 inline-block"
        >
          {t("arts.back")}
        </button>

        {detailLoading || !detail ? (
          <div className="space-y-3">
            <div className="h-6 w-2/3 bg-gray-100 rounded animate-pulse" />
            <div className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-gray-900 mb-3">{detail.title}</h1>
            <div className="flex flex-wrap gap-2 text-xs mb-6">
              {detail.author && (
                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  ✍️ {detail.author}
                </span>
              )}
              {detail.category && (
                <span className="bg-mizan-50 text-mizan-700 px-3 py-1 rounded-full">
                  {detail.category}
                </span>
              )}
              <span className="bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                {new Date(detail.created_at).toLocaleDateString(lang === "ar" ? "ar-MA" : "fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                })}
              </span>
              {isLaw && (
                <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full">
                  {lawHeadCount} {t("arts.articlesCount")}
                </span>
              )}
            </div>

            {/* Recherche DANS la loi (n° d'article ou mot-clé) */}
            {isLaw && (
              <input
                value={inLawQuery}
                onChange={(e) => setInLawQuery(e.target.value)}
                placeholder={t("arts.searchInLaw")}
                className="w-full mb-4 px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mizan-300"
              />
            )}

            {!detail.content ? (
              <div className="bg-white border border-gray-200 rounded-xl p-6">
                <p className="text-sm text-gray-500 italic">{t("arts.detailSoon")}</p>
              </div>
            ) : isLaw ? (
              <div className="space-y-3">
                {shownBlocks.length === 0 && (
                  <p className="text-sm text-gray-400">{t("arts.noArticleFound")}</p>
                )}
                {shownBlocks.map((b, i) => (
                  <div key={i} className="bg-white border border-gray-200 rounded-xl p-4">
                    {b.header && (
                      <div className="font-bold text-mizan-700 mb-1">{b.header}</div>
                    )}
                    <div className="leading-8 text-gray-800 text-[15px]">{b.body}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
                {blocks.map((b, i) => (
                  <div key={i}>
                    {b.header && (
                      <h3 className="font-bold text-mizan-800 text-base mt-2 mb-1">{b.header}</h3>
                    )}
                    {b.body && (
                      <p className="leading-8 text-gray-800 text-[15px]">{b.body}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ─── Vue LISTE ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-4xl mx-auto" dir="auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{t("arts.title")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("arts.subtitle")}</p>
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("arts.searchPlaceholder")}
          className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-mizan-300"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm"
          >
            ✕
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => { setCategory(undefined); setPage(1); }}
          className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
            !category ? "bg-mizan-600 text-white border-mizan-600"
                      : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
        >
          {t("arts.all")}
        </button>
        {cats.map((cat) => (
          <button
            key={cat}
            onClick={() => { setCategory(cat); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition ${
              category === cat ? "bg-mizan-600 text-white border-mizan-600"
                              : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {!isLoading && articles.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">📰</div>
          <p className="font-medium text-gray-600">{t("arts.empty")}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) => (
          <button
            key={article.id}
            onClick={() => setSp({ a: String(article.id) })}
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

      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={!data.has_prev}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition"
          >
            {t("common.prev")}
          </button>
          <span className="px-4 py-2 text-sm text-gray-500">{data.page} / {data.pages}</span>
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
