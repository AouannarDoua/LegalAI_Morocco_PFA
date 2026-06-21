import { useState } from "react";
import contractService, { type ContractAnalysis } from "../services/contractService";
import { ApiError } from "../services/apiClient";
import { useLang } from "../i18n/LanguageContext";

export default function ContractAnalysis() {
  const { t } = useLang();
  const [title,     setTitle]     = useState("");
  const [content,   setContent]   = useState("");
  const [type,      setType]      = useState("");
  const [step,      setStep]      = useState<"form" | "analyzing" | "result">("form");
  const [error,     setError]     = useState<string | null>(null);
  const [analysis,  setAnalysis]  = useState<ContractAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim() || !content.trim()) {
      setError(t("ca.errFields"));
      return;
    }
    setError(null);
    setStep("analyzing");

    try {
      // 1. Créer le contrat
      const contract = await contractService.create({
        title: title.trim(),
        content: content.trim(),
        contract_type: type.trim() || undefined,
      });

      // 2. Lancer l'analyse IA
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

  // ─── Analyzing spinner ────────────────────────────────────────────────────
  if (step === "analyzing") {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 border-4 border-mizan-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">{t("ca.analyzing")}</p>
        <p className="text-sm text-gray-400">{t("ca.analyzingSub")}</p>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  if (step === "result" && analysis) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t("ca.resultTitle")}</h1>
          <button
            onClick={reset}
            className="text-sm text-mizan-600 hover:underline"
          >
            {t("ca.newAnalysis")}
          </button>
        </div>

        <div className="space-y-5">
          {/* Résumé */}
          <div className="bg-mizan-50 border border-mizan-200 rounded-xl p-5">
            <h2 className="font-semibold text-mizan-900 mb-2">📋 {t("ca.summary")}</h2>
            <p className="text-mizan-800 text-sm leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Risques */}
          {analysis.risks?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h2 className="font-semibold text-red-900 mb-3">⚠️ {t("ca.risks")}</h2>
              <ul className="space-y-2">
                {analysis.risks.map((risk, i) => (
                  <li key={i} className="flex gap-2 text-red-800 text-sm">
                    <span className="text-red-400 mt-0.5">•</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Points de négociation */}
          {analysis.negotiation_points?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
              <h2 className="font-semibold text-amber-900 mb-3">🤝 {t("ca.negotiation")}</h2>
              <ul className="space-y-2">
                {analysis.negotiation_points.map((point, i) => (
                  <li key={i} className="flex gap-2 text-amber-800 text-sm">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conformité */}
          {analysis.compliance_notes && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h2 className="font-semibold text-green-900 mb-2">✅ {t("ca.compliance")}</h2>
              <p className="text-green-800 text-sm leading-relaxed">{analysis.compliance_notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Form ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{t("ca.title")}</h1>
      <p className="text-gray-500 mb-6 text-sm">
        {t("ca.subtitle")}
      </p>

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
