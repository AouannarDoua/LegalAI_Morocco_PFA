import { useState } from "react";
import { useApi } from "../hooks/useApi";
import { contractService, type Contract } from "../services/index";
import { BASE_URL, tokenStorage } from "../services/apiClient";
import { FileText, Eye, Clock, Plus, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useLang } from "../i18n/LanguageContext";

interface ContractListResponse {
  items: Contract[];
  total: number;
  page:  number;
  pages: number;
}

export default function Contracts() {
  const { t } = useLang();
  const { data, isLoading, error } = useApi<ContractListResponse>(
    () => contractService.list(1)
  );
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [pdfError, setPdfError]   = useState<string | null>(null);

  const contracts: Contract[] = data?.items ?? [];

  // Ouvre le PDF AVEC le token JWT (un simple <a href> renvoie « Missing Authorization Header »)
  async function openPdf(fileName: string, id: number) {
    setPdfError(null);
    setOpeningId(id);
    try {
      const token = tokenStorage.get();
      const resp = await fetch(`${BASE_URL}/contracts/download/${encodeURIComponent(fileName)}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error();
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch {
      setPdfError(t("myc.pdfError"));
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t("myc.title")}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data ? `${data.total} ${data.total !== 1 ? t("myc.count_other") : t("myc.count_one")}` : ""}
          </p>
        </div>
        <Link to="/contract-generator"
          className="flex items-center gap-2 px-4 py-2 bg-mizan-600 hover:bg-mizan-700 text-white text-sm font-semibold rounded-lg transition">
          <Plus size={16} /> {t("myc.generate")}
        </Link>
      </div>

      {pdfError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{pdfError}</div>
      )}

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      )}

      {!isLoading && contracts.length === 0 && (
        <div className="bg-white border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-600 font-medium">{t("myc.empty")}</p>
          <p className="text-sm text-gray-400 mt-1">{t("myc.emptyHint")}</p>
          <Link to="/contract-generator"
            className="inline-block mt-4 px-5 py-2 bg-mizan-600 text-white text-sm font-semibold rounded-lg hover:bg-mizan-700 transition">
            {t("myc.generate")}
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <div key={contract.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-mizan-50 text-mizan-600 rounded-lg"><FileText size={24} /></div>
              <div>
                <h3 className="font-semibold text-gray-900 font-ar">{contract.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(contract.created_at).toLocaleDateString("fr-MA")}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full uppercase font-ar">
                    {contract.contract_type || t("myc.general")}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full ${
                    contract.status === "analyzed" ? "bg-green-100 text-green-700"
                    : contract.status === "generated" ? "bg-mizan-100 text-mizan-700"
                    : "bg-gray-100 text-gray-500"}`}>
                    {contract.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {(contract as any).file_name && (
                <button onClick={() => openPdf((contract as any).file_name, contract.id)}
                  disabled={openingId === contract.id}
                  className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm font-medium disabled:opacity-60">
                  {openingId === contract.id ? <Loader2 size={14} className="animate-spin" /> : null}
                  {t("myc.pdf")}
                </button>
              )}
              <Link to={`/contract-analysis/${contract.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-mizan-50 hover:text-mizan-600 transition text-sm font-medium">
                <Eye size={16} /> {t("myc.analyze")}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}