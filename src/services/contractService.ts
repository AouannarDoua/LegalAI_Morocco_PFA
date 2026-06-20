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

// ─── Types pour le FORMULAIRE DYNAMIQUE par type de contrat (logique v12) ────

export interface ContractField {
  name:      string;                       // ex: "nom_mocri"
  label:     string;                       // libellé arabe ex: "الإسم الكامل للمكري"
  type:      "text" | "number" | "date";   // type de saisie
  required:  boolean;                       // champ obligatoire ?
  default?:  string;                        // valeur par défaut éventuelle
}

export interface ContractTypeInfo {
  name:    string;            // nom arabe du type (clé), ex: "عقد كراء سكني"
  fields:  ContractField[];   // champs du formulaire
  clauses: string[];          // clauses incluses dans le contrat généré
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

  // ✅ Liste des 20 types avec leurs champs structurés (formulaire dynamique)
  types: (): Promise<ContractTypeInfo[]> =>
    api.get<ContractTypeInfo[]>("contracts/types"),

  // ✅ Régénère le PDF depuis un texte édité par l'avocat (sans IA)
  rerender: (id: number, content: string, title?: string): Promise<Contract> =>
    api.post<Contract>(`contracts/${id}/rerender`, { content, title }),
};

export default contractService;