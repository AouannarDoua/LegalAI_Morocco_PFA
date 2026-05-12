import api from "./apiClient";
import type { PaginatedData } from "./apiClient";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Contract {
  id:            number;
  user_id:       number;
  title:         string;
  content:       string | null;
  contract_type: string | null;
  // ✅ Fix: status utilisé dans Contracts.tsx pour afficher badge couleur
  status:        "draft" | "analyzed" | "generated";
  ai_analysis:   string | null;
  // ✅ Fix: file_name utilisé dans ContractGenerator + Contracts pour téléchargement PDF
  file_name:     string | null;
  created_at:    string;
}

export interface ContractAnalysis {
  summary:            string;
  risks:              string[];
  negotiation_points: string[];
  compliance_notes:   string;
}

export interface CreateContractPayload {
  title:          string;
  content?:       string;
  contract_type?: string;
}

export interface GenerateContractPayload {
  contract_type: string;
  details:       Record<string, unknown>;
}

// ─── Contract Service ────────────────────────────────────────────────────────

export const contractService = {
  list: (page = 1): Promise<PaginatedData<Contract>> =>
    api.get<PaginatedData<Contract>>(`contracts?page=${page}`),

  getById: (id: number): Promise<Contract> =>
    api.get<Contract>(`contracts/${id}`),

  create: (payload: CreateContractPayload): Promise<Contract> =>
    api.post<Contract>("contracts", payload),

  analyze: (contractId: number): Promise<ContractAnalysis> =>
    api.post<ContractAnalysis>(`contracts/${contractId}/analyze`),

  generate: (payload: GenerateContractPayload): Promise<Contract> =>
    api.post<Contract>("contracts/generate", payload),
};

export default contractService;