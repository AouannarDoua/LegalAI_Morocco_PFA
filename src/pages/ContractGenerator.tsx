import { useState, useEffect } from "react";
import contractService from "../services/contractService";
import apiClient, { ApiError } from "../services/apiClient";

const API_BASE_URL = "http://localhost:5000";

interface ContractTemplate {
  title:    string;
  fields:   string[];
  category?: string;
  url?:      string;
  download?: string;
}

export default function ContractGenerator() {
  const [allTemplates,      setAllTemplates]      = useState<ContractTemplate[]>([]);
  const [searchTerm,        setSearchTerm]        = useState("");
  const [selectedTemplate,  setSelectedTemplate]  = useState<ContractTemplate | null>(null);
  const [details,           setDetails]           = useState<Record<string, string>>({});
  const [step,              setStep]              = useState<"search" | "form" | "generating" | "result">("search");
  const [error,             setError]             = useState<string | null>(null);
  const [pdfUrl,            setPdfUrl]            = useState<string | null>(null);
  const [isLoading,         setIsLoading]         = useState(true);

  // ✅ Fix: GET /api/contracts/templates — backend kiyerja3 { data: [...] } via success_response
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    apiClient
      .get<{ data: ContractTemplate[] }>("/contracts/templates")
      .then((res: any) => {
        if (!isMounted) return;
        // ✅ Fix: Flask success_response kiyerja3 { success, data, message }
        const raw = res?.data ?? res;
        const templates = Array.isArray(raw) ? raw : (raw?.data ?? []);
        setAllTemplates(
          templates.filter(
            (t: any) => t && typeof t.title === "string"
          )
        );
        setIsLoading(false);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        console.error("Erreur chargement templates:", err);
        setError("Impossible de charger les modèles de contrats.");
        setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, []);

  // Filtrage — protégé contre undefined
  const filtered = allTemplates.filter(
    (t) =>
      t?.title &&
      t.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    setError(null);
    setStep("generating");

    try {
      // ✅ Fix: contractService.generate kiyerja3 l'objet contract avec file_name
      const result = await contractService.generate({
        contract_type: selectedTemplate.title,
        details,
      });

      const fileName = (result as any)?.file_name;
      if (!fileName) throw new Error("Nom de fichier manquant dans la réponse");

      setPdfUrl(`${API_BASE_URL}/api/contracts/download/${fileName}`);
      setStep("result");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erreur lors de la génération du PDF"
      );
      setStep("form");
    }
  };

  const reset = () => {
    setSearchTerm("");
    setSelectedTemplate(null);
    setDetails({});
    setPdfUrl(null);
    setStep("search");
    setError(null);
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-mizan-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-gray-500 animate-pulse">Chargement des modèles Mizan...</p>
      </div>
    );
  }

  // ─── Generating ───────────────────────────────────────────────────────────
  if (step === "generating") {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-6">
        <div className="relative w-20 h-20">
          <div className="w-20 h-20 border-4 border-mizan-100 rounded-full" />
          <div className="w-20 h-20 border-4 border-mizan-600 border-t-transparent rounded-full animate-spin absolute top-0" />
        </div>
        <p className="text-xl font-bold text-gray-800">Intelligence Artificielle en action...</p>
        <p className="text-sm text-gray-400">Génération du contrat en cours via RAG</p>
      </div>
    );
  }

  // ─── Result ───────────────────────────────────────────────────────────────
  if (step === "result") {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-mizan-900">{selectedTemplate?.title}</h1>
            <p className="text-sm text-gray-500">Document généré avec succès</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep("form")}
              className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition font-medium"
            >
              Modifier
            </button>
            <button
              onClick={reset}
              className="px-6 py-2 bg-mizan-600 text-white rounded-xl font-bold hover:bg-mizan-700 transition shadow-lg"
            >
              Nouveau contrat
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PDF Viewer */}
          <div className="lg:col-span-2 border-2 border-gray-100 rounded-3xl overflow-hidden h-[750px] bg-white shadow-2xl">
            {pdfUrl ? (
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                title="Contrat PDF"
                className="border-none"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                Préparation de l'aperçu...
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <div className="bg-green-50 p-6 rounded-3xl border border-green-100 shadow-sm">
              <div className="text-3xl mb-2">📄</div>
              <h3 className="font-bold text-green-900 mb-2">Document prêt !</h3>
              <p className="text-sm text-green-700 mb-6">
                Le contrat est conforme aux réglementations en vigueur.
              </p>
              <a
                href={pdfUrl || "#"}
                target="_blank"
                rel="noreferrer"
                className="block w-full text-center py-4 bg-green-600 text-white rounded-2xl font-bold shadow-lg hover:bg-green-700 transition hover:-translate-y-1"
              >
                Télécharger le PDF
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Main form ────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-black mb-2 text-gray-900 tracking-tight">
          Mizan Generator
        </h1>
        <p className="text-gray-500 text-lg">
          Créez vos documents juridiques instantanément.
        </p>
        {/* ✅ Indicateur nombre de modèles */}
        <p className="text-xs text-gray-400 mt-1">
          {allTemplates.length} modèles disponibles
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded-r-xl flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-900 font-bold text-lg">
            ×
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Étape 1 — Recherche */}
        <div className="space-y-6">
          <label className="block font-black text-mizan-600 uppercase tracking-widest text-xs">
            1. Rechercher un modèle
          </label>
          <div className="relative">
            <input
              type="text"
              className="w-full p-5 border-2 border-gray-100 rounded-2xl shadow-sm outline-none focus:border-mizan-500 focus:ring-4 focus:ring-mizan-50 transition-all text-lg bg-white"
              placeholder="Ex: bail, travail, vente..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (step !== "search") setStep("search");
              }}
            />
            {searchTerm && step === "search" && (
              <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-64 overflow-y-auto">
                {filtered.length > 0 ? (
                  filtered.map((t, i) => (
                    <div
                      key={i}
                      className="p-4 hover:bg-mizan-50 cursor-pointer border-b last:border-0 transition group"
                      onClick={() => {
                        setSelectedTemplate(t);
                        setDetails({});
                        setSearchTerm(t.title);
                        setStep("form");
                      }}
                    >
                      <div className="font-bold text-gray-800 group-hover:text-mizan-700">
                        {t.title}
                      </div>
                      <div className="text-xs text-mizan-400">
                        {t.fields?.length ?? 0} variable(s) à personnaliser
                      </div>
                      {t.category && (
                        <div className="text-xs text-gray-400 mt-0.5">{t.category}</div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-gray-400 text-center italic text-sm">
                    Aucun modèle trouvé
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Étape 2 — Formulaire dynamique */}
        <div
          className={`${
            selectedTemplate ? "opacity-100" : "opacity-20 pointer-events-none"
          } transition-all duration-500`}
        >
          <label className="block font-black text-mizan-600 uppercase tracking-widest text-xs mb-6">
            2. Remplir les données
          </label>
          <div className="space-y-5 bg-white p-8 border-2 border-gray-50 rounded-[32px] shadow-xl shadow-gray-100">
            {/* ✅ Fix: si aucun champ, afficher message */}
            {selectedTemplate?.fields?.length === 0 && (
              <p className="text-sm text-gray-400 italic text-center py-4">
                Ce modèle ne nécessite pas de variables.
              </p>
            )}
            {selectedTemplate?.fields?.map((field) => (
              <div key={field}>
                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 tracking-widest">
                  {field.replace(/_/g, " ")}
                </label>
                <input
                  type="text"
                  className="w-full p-4 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-mizan-100 outline-none transition-all text-sm"
                  placeholder={`Saisir ${field.replace(/_/g, " ")}...`}
                  value={details[field] || ""}
                  onChange={(e) =>
                    setDetails({ ...details, [field]: e.target.value })
                  }
                />
              </div>
            ))}

            <button
              onClick={handleGenerate}
              disabled={!selectedTemplate}
              className="w-full py-5 bg-mizan-600 hover:bg-mizan-700 text-white font-black rounded-2xl mt-6 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:bg-gray-200"
            >
              GÉNÉRER LE CONTRAT
            </button>

            {selectedTemplate && (
              <button
                onClick={reset}
                className="w-full text-xs text-gray-400 font-bold py-2 hover:text-red-400 transition"
              >
                Annuler et changer de modèle
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}