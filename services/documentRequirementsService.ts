import { fetcher } from "@/lib/api/fetcher";

import type {
  CreateDocumentRequirementRequest,
  CreateDocumentRequirementResponse,
  DocumentRequirementsFilters,
  GetDocumentRequirementResponse,
  GetDocumentRequirementsResponse,
  MoveDocumentRequirementRequest,
  MoveDocumentRequirementResponse,
  ReorderDocumentRequirementsRequest,
  ReorderDocumentRequirementsResponse,
  ToggleDocumentRequirementRequiredResponse,
  UpdateDocumentRequirementRequest,
  UpdateDocumentRequirementResponse,
} from "@/lib/document-requirements/types";

/**
 * Create a document requirement for a graduate type.
 */
export const createDocumentRequirement = async (
  payload: CreateDocumentRequirementRequest,
): Promise<CreateDocumentRequirementResponse> => {
  return await fetcher(
    "/document-requirements",
    "POST",
    payload,
  );
};

/**
 * Get document requirements for a graduate type.
 */
export const getDocumentRequirements = async (
  filters: DocumentRequirementsFilters,
): Promise<GetDocumentRequirementsResponse> => {
  const params = new URLSearchParams();

  params.append("graduateType", filters.graduateType);

  if (filters.search) {
    params.append("search", filters.search);
  }

  if (filters.required !== undefined) {
    params.append("required", String(filters.required));
  }

  if (filters.sortBy) {
    params.append("sortBy", filters.sortBy);
  }

  if (filters.sortOrder) {
    params.append("sortOrder", filters.sortOrder);
  }

  const queryString = params.toString();

  return await fetcher(
    `/document-requirements?${queryString}`,
    "GET",
  );
};

/**
 * Get a single document requirement by ID.
 */
export const getDocumentRequirement = async (
  id: string,
): Promise<GetDocumentRequirementResponse> => {
  return await fetcher(
    `/document-requirements/${id}`,
    "GET",
  );
};

/**
 * Update a document requirement.
 *
 * Graduate type and document key cannot be changed.
 */
export const updateDocumentRequirement = async (
  id: string,
  payload: UpdateDocumentRequirementRequest,
): Promise<UpdateDocumentRequirementResponse> => {
  return await fetcher(
    `/document-requirements/${id}`,
    "PUT",
    payload,
  );
};

/**
 * Delete a document requirement.
 */
export const deleteDocumentRequirement = async (
  id: string,
): Promise<void> => {
  await fetcher(
    `/document-requirements/${id}`,
    "DELETE",
  );
};

/**
 * Reorder all documents within a graduate type.
 */
export const reorderDocumentRequirements = async (
  payload: ReorderDocumentRequirementsRequest,
): Promise<ReorderDocumentRequirementsResponse> => {
  return await fetcher(
    "/document-requirements/reorder",
    "PATCH",
    payload,
  );
};

/**
 * Move a single document to a target position.
 */
export const moveDocumentRequirement = async (
  id: string,
  payload: MoveDocumentRequirementRequest,
): Promise<MoveDocumentRequirementResponse> => {
  return await fetcher(
    `/document-requirements/${id}/position`,
    "PATCH",
    payload,
  );
};

/**
 * Toggle a document requirement between required and optional.
 */
export const toggleDocumentRequirementRequired = async (
  id: string,
  required: boolean,
): Promise<ToggleDocumentRequirementRequiredResponse> => {
  return await fetcher(
    `/document-requirements/${id}/required`,
    "PATCH",
    { required },
  );
};