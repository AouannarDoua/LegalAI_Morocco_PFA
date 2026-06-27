// src/pages/ContractAnalysis.tsx
// ──────────────────────────────────────────────────────────────────────────────
// Page "Analyse de contrat" avec DEUX onglets :
//   1) Analyse de texte (existante) → backend Flask (port 5000)
//   2) Score du contrat (NOUVEAU)   → backend FastAPI (port 8000) via <ContractScore/>
// ──────────────────────────────────────────────────────────────────────────────
import { useState } from "react";
import { useParams } from "react-router-dom";
import contractService, { type ContractAnalysis } from "../services/contractService";
import { ApiError } from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";
import ContractScore from "./ContractScore"; // ✅ le composant Score intégré

type Mode = "text" | "file";

// ✅ Garantit qu'on n'affiche jamais un objet brut comme enfant React
//    (c'était la cause de la page blanche après analyse).
function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return v.map(asText).filter(Boolean).join(" — ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    const keys = ["titre", "title", "clause", "point", "description",
                  "risque", "niveau", "recommandation", "commentaire", "texte", "label"];
    const parts = keys.map((k) => o[k]).filter(Boolean).map(String);
    return (parts.length ? parts : Object.values(o).filter(Boolean).map(String)).join(" — ");
  }
  return String(v);
}
function asTextList(v: unknown): string[] {
  if (v == null) return [];
  const arr = Array.isArray(v) ? v : [v];
  return arr.map(asText).filter((s) => s.trim().length > 0);
}

// ✅ Cercle de score (réutilise la même logique de couleurs que l'onglet Score)
function ScoreRing({ score }: { score: number }) {
  const r = 46, cx = 56, perim = 2 * Math.PI * r;
  const off = perim * (1 - Math.max(0, Math.min(100, score)) / 100);
  const stroke =
    score >= 75 ? "#0E6B4E" : score >= 50 ? "#F59E0B" : score >= 25 ? "#F97316" : "#EF4444";
  return (
    <svg width="112" height="112" viewBox="0 0 112 112" className="shrink-0">
      <circle cx={cx} cy={cx} r={r} fill="none" stroke="#E2E8F0" strokeWidth="9" />
      <circle cx={cx} cy={cx} r={r} fill="none" stroke={stroke} strokeWidth="9"
        strokeLinecap="round" strokeDasharray={perim} strokeDashoffset={off}
        transform={`rotate(-90 ${cx} ${cx})`} style={{ transition: "stroke-dashoffset 1s ease" }} />
      <text x={cx} y={cx - 2} textAnchor="middle" fontSize="26" fontWeight="bold" fill={stroke}>{score}</text>
      <text x={cx} y={cx + 16} textAnchor="middle" fontSize="10" fill="#94A3B8">/100</text>
    </svg>
  );
}

export default function ContractAnalysis() {
  const { t, lang } = useLang();
  // ✅ Si on arrive depuis « عقودي » (bouton تحليل), l'URL contient l'id du contrat
  //    (/contract-analysis/:id). On ouvre l'onglet Score et on lui passe cet id :
  //    il récupèrera le PDF tout seul. Robuste (indépendant de la langue / refresh,
  //    contrairement à l'état de navigation qui se perdait).
  const { id: contractId } = useParams();
  const [mode, setMode] = useState<Mode>(contractId ? "file" : "text"); // ✅ onglet actif

  const [title,    setTitle]    = useState("");
  const [content,  setContent]  = useState("");
  const [type,     setType]     = useState("");
  const [step,     setStep]     = useState<"form" | "analyzing" | "result">("form");
  const [error,    setError]    = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ContractAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim() || !content.trim()) {
      setError(t("ca.errFields"));
      return;
    }
    setError(null);
    setStep("analyzing");

    try {
      const contract = await contractService.create({
        title: title.trim(),
        content: content.trim(),
        contract_type: type.trim() || undefined,
      });
      const result = await contractService.analyze(contract.id);
      setAnalysis(result);
      setStep("result");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("ca.errAnalyze"));
      setStep("form");
    }
  };

  const reset = () => {
    setTitle("");
    setContent("");
    setType("");
    setAnalysis(null);
    setError(null);
    setStep("form");
  };

  // ── Barre d'onglets ─────────────────────────────────────────────────────────
  const Tabs = () => (
    <div className="flex gap-2 mb-6 border-b border-gray-200">
      <button
        onClick={() => setMode("text")}
        className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition ${
          mode === "text"
            ? "border-mizan-600 text-mizan-700"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        📝 تحليل نصي / Analyse texte
      </button>
      <button
        onClick={() => setMode("file")}
        className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition ${
          mode === "file"
            ? "border-mizan-600 text-mizan-700"
            : "border-transparent text-gray-500 hover:text-gray-700"
        }`}
      >
        ⚖️ Score العقد (PDF / Word)
      </button>
    </div>
  );

  // ── Onglet "Score du contrat" : on délègue tout au composant ContractScore ──
  if (mode === "file") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Tabs />
        <ContractScore contractId={contractId} />
      </div>
    );
  }

  // ── Onglet "Analyse texte" : logique existante ──────────────────────────────

  if (step === "analyzing") {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Tabs />
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <div className="w-12 h-12 border-4 border-mizan-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">{t("ca.analyzing")}</p>
          <p className="text-sm text-gray-400">{t("ca.analyzingSub")}</p>
        </div>
      </div>
    );
  }

  if (step === "result" && analysis) {
    // ✅ Normalisation côté client : on ne fait JAMAIS .map sur autre chose qu'un tableau de strings
    const risks       = asTextList(analysis.risks);
    const negotiation = asTextList(analysis.negotiation_points);
    const strengths   = asTextList(analysis.strengths);
    const summary     = asText(analysis.summary);
    const compliance  = asText(analysis.compliance_notes);
    const hasScore    = typeof analysis.score === "number" && !Number.isNaN(analysis.score);
    const score       = hasScore ? (analysis.score as number) : 0;
    const niveauKey   = analysis.niveau || "";
    const niveauTxt   = t(`ca.niveauLabels.${niveauKey}`) || niveauKey;

    return (
      <div className="p-6 max-w-3xl mx-auto">
        <Tabs />
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("ca.resultTitle")}</h1>
          <button onClick={reset} className="text-sm text-mizan-600 hover:underline">
            {t("ca.newAnalysis")}
          </button>
        </div>

        <div className="space-y-5">
          {/* ✅ Carte SCORE (analyse du contenu) */}
          {hasScore && (
            <div className="bg-white border border-mizan-200 rounded-xl p-5 flex items-center gap-5">
              <ScoreRing score={score} />
              <div className="flex-1">
                <p className="text-sm text-gray-500">{t("ca.scoreLabel")}</p>
                <p className="text-lg font-bold text-gray-900">{niveauTxt}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-mizan-100 text-mizan-700 px-2 py-1 rounded-full font-semibold">
                    ✅ {strengths.length} {lang === "ar" ? "نقطة قوة" : "points forts"}
                  </span>
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-semibold">
                    ⚠️ {risks.length} {lang === "ar" ? "خطر" : "risques"}
                  </span>
                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-semibold">
                    🤝 {negotiation.length} {lang === "ar" ? "نقطة تفاوض" : "à négocier"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Résumé */}
          {summary && (
            <div className="bg-mizan-50 border border-mizan-200 rounded-xl p-5">
              <h2 className="font-semibold text-mizan-900 mb-2">📋 {t("ca.summary")}</h2>
              <p className="text-mizan-800 text-sm leading-relaxed whitespace-pre-line">{summary}</p>
            </div>
          )}

          {/* Points forts */}
          {strengths.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
              <h2 className="font-semibold text-emerald-900 mb-3">💪 {t("ca.strengths")}</h2>
              <ul className="space-y-2">
                {strengths.map((s, i) => (
                  <li key={i} className="flex gap-2 text-emerald-800 text-sm">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risques */}
          {risks.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h2 className="font-semibold text-red-900 mb-3">⚠️ {t("ca.risks")}</h2>
              <ul className="space-y-2">
                {risks.map((risk, i) => (
                  <li key={i} className="flex gap-2 text-red-800 text-sm">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Points de négociation */}
          {negotiation.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="font-semibold text-amber-900 mb-3">🤝 {t("ca.negotiation")}</h2>
              <ul className="space-y-2">
                {negotiation.map((point, i) => (
                  <li key={i} className="flex gap-2 text-amber-800 text-sm">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conformité */}
          {compliance && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h2 className="font-semibold text-green-900 mb-2">✅ {t("ca.compliance")}</h2>
              <p className="text-green-800 text-sm leading-relaxed whitespace-pre-line">{compliance}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Formulaire (texte) ──────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Tabs />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("ca.title")}</h1>
      <p className="text-gray-500 mb-6 text-sm">{t("ca.subtitle")}</p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("ca.labelTitle")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mizan-500 outline-none"
            placeholder={t("ca.titlePlaceholder")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("ca.labelType")}</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mizan-500 outline-none"
          >
            <option value="">{t("ca.typeNone")}</option>
            <option value="bail">{t("ca.types.bail")}</option>
            <option value="travail">{t("ca.types.travail")}</option>
            <option value="vente">{t("ca.types.vente")}</option>
            <option value="prestation">{t("ca.types.prestation")}</option>
            <option value="societe">{t("ca.types.societe")}</option>
            <option value="autre">{t("ca.types.autre")}</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t("ca.labelContent")}</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mizan-500 outline-none resize-y text-sm"
            placeholder={t("ca.contentPlaceholder")}
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!title.trim() || !content.trim()}
          className="w-full py-3 bg-mizan-600 hover:bg-mizan-700 disabled:bg-mizan-300 text-white font-semibold rounded-xl transition"
        >
          {t("ca.analyze")}
        </button>
      </div>
    </div>
  );
}
