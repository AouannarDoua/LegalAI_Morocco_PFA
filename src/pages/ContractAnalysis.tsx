import { useState } from "react";
import contractService, { type ContractAnalysis } from "../services/contractService";
import { ApiError } from "../services/apiClient";

export default function ContractAnalysis() {
  const [title,     setTitle]     = useState("");
  const [content,   setContent]   = useState("");
  const [type,      setType]      = useState("");
  const [step,      setStep]      = useState<"form" | "analyzing" | "result">("form");
  const [error,     setError]     = useState<string | null>(null);
  const [analysis,  setAnalysis]  = useState<ContractAnalysis | null>(null);

  const handleAnalyze = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Veuillez renseigner le titre et le contenu du contrat");
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
      setError(err instanceof ApiError ? err.message : "Erreur lors de l'analyse");
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
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600 font-medium">Analyse IA en cours...</p>
        <p className="text-sm text-gray-400">Cela peut prendre 10 à 30 secondes</p>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  if (step === "result" && analysis) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Résultat de l'analyse</h1>
          <button
            onClick={reset}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Nouvelle analyse
          </button>
        </div>

        <div className="space-y-5">
          {/* Résumé */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h2 className="font-semibold text-blue-900 mb-2">📋 Résumé</h2>
            <p className="text-blue-800 text-sm leading-relaxed">{analysis.summary}</p>
          </div>

          {/* Risques */}
          {analysis.risks?.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <h2 className="font-semibold text-red-900 mb-3">⚠️ Risques identifiés</h2>
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
              <h2 className="font-semibold text-amber-900 mb-3">🤝 Points à négocier</h2>
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
              <h2 className="font-semibold text-green-900 mb-2">✅ Conformité au droit marocain</h2>
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
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Analyse de contrat</h1>
      <p className="text-gray-500 mb-6 text-sm">
        Collez votre contrat ci-dessous pour une analyse juridique IA basée sur le droit marocain
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titre du contrat *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="Bail commercial, Contrat de travail..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type de contrat</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Sélectionner (optionnel)</option>
            <option value="bail">Bail / Location</option>
            <option value="travail">Contrat de travail</option>
            <option value="vente">Contrat de vente</option>
            <option value="prestation">Prestation de services</option>
            <option value="societe">Contrat de société</option>
            <option value="autre">Autre</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Contenu du contrat *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-y text-sm"
            placeholder="Collez ici le texte complet de votre contrat..."
          />
        </div>

        <button
          onClick={handleAnalyze}
          disabled={!title.trim() || !content.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold rounded-xl transition"
        >
          Analyser avec l'IA
        </button>
      </div>
    </div>
  );
}
