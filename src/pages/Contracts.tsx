import { useApi } from "../hooks/useApi";
import { contractService, type Contract } from "../services/index";
import { FileText, Eye, Clock, Plus } from "lucide-react";
import { Link } from "react-router-dom";

// ✅ Fix: ما كنستعملوش PaginatedData — backend kiyerja3 { items, total }
interface ContractListResponse {
  items: Contract[];
  total: number;
  page:  number;
  pages: number;
}

export default function Contracts() {
  const { data, isLoading, error } = useApi<ContractListResponse>(
    () => contractService.list(1)
  );

  const contracts: Contract[] = data?.items ?? [];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes Contrats</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {data ? `${data.total} contrat${data.total !== 1 ? "s" : ""}` : ""}
          </p>
        </div>
        {/* ✅ Fix: lien vers generator */}
        <Link
          to="/contract-generator"
          className="flex items-center gap-2 px-4 py-2 bg-mizan-600 hover:bg-mizan-700 text-white text-sm font-semibold rounded-lg transition"
        >
          <Plus size={16} />
          Générer un contrat
        </Link>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {!isLoading && contracts.length === 0 && (
        <div className="bg-white border rounded-xl p-10 text-center">
          <div className="text-4xl mb-3">📄</div>
          <p className="text-gray-600 font-medium">Aucun contrat pour le moment</p>
          <p className="text-sm text-gray-400 mt-1">
            Utilisez le générateur pour créer votre premier contrat
          </p>
          <Link
            to="/contract-generator"
            className="inline-block mt-4 px-5 py-2 bg-mizan-600 text-white text-sm font-semibold rounded-lg hover:bg-mizan-700 transition"
          >
            Générer un contrat
          </Link>
        </div>
      )}

      <div className="grid gap-4">
        {contracts.map((contract) => (
          <div
            key={contract.id}
            className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between hover:shadow-sm transition"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-mizan-50 text-mizan-600 rounded-lg">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{contract.title}</h3>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {new Date(contract.created_at).toLocaleDateString("fr-MA")}
                  </span>
                  <span className="px-2 py-0.5 bg-gray-100 rounded-full uppercase">
                    {contract.contract_type || "Général"}
                  </span>
                  {/* ✅ Fix: afficher le statut */}
                  <span
                    className={`px-2 py-0.5 rounded-full ${
                      contract.status === "analyzed"
                        ? "bg-green-100 text-green-700"
                        : contract.status === "generated"
                        ? "bg-mizan-100 text-mizan-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* ✅ Fix: lien vers téléchargement si file_name disponible */}
              {(contract as any).file_name && (
                <a
                  href={`http://localhost:5000/api/contracts/download/${(contract as any).file_name}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition text-sm font-medium"
                >
                  PDF
                </a>
              )}
              <Link
                to={`/contract-analysis/${contract.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-mizan-50 hover:text-mizan-600 transition text-sm font-medium"
              >
                <Eye size={16} />
                Analyse
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}