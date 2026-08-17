export type GraduateType = "gov" | "us" | "uk" | "ksa" | "others";

export interface DocumentRequirement {
  id: string;
  graduateType: GraduateType;
  documentKey: string;
  nameEn: string;
  nameAr: string;
  description: string;
  required: boolean;
  hasExpirationDate: boolean;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentRequirementsSummary {
  total: number;
  required: number;
  optional: number;
}

export interface CreateDocumentRequirementRequest {
  graduateType: GraduateType;
  documentKey: string;
  nameEn: string;
  nameAr: string;
  description: string;
  required: boolean;
  hasExpirationDate: boolean;
}

export interface UpdateDocumentRequirementRequest {
  nameEn: string;
  nameAr: string;
  description: string;
  required: boolean;
  hasExpirationDate: boolean;
}

export interface ReorderDocumentRequirementsRequest {
  graduateType: GraduateType;
  orderedIds: string[];
}

export interface MoveDocumentRequirementRequest {
  toPosition: number;
}

export interface DocumentRequirementsFilters extends Record<string, unknown> {
  graduateType: GraduateType;
  search?: string;
  required?: boolean;
  sortBy?: "position" | "nameEn" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface CreateDocumentRequirementResponse {
  document: DocumentRequirement;
}

export interface GetDocumentRequirementsResponse {
  graduateType: GraduateType;
  data: DocumentRequirement[];
  summary: DocumentRequirementsSummary;
}

export interface GetDocumentRequirementResponse {
  document: DocumentRequirement;
}

export interface UpdateDocumentRequirementResponse {
  document: DocumentRequirement;
}

export interface ReorderDocumentRequirementsResponse {
  documents: DocumentRequirement[];
}

export interface MoveDocumentRequirementResponse {
  documents: DocumentRequirement[];
}

export interface ToggleDocumentRequirementRequiredResponse {
  document: DocumentRequirement;
}