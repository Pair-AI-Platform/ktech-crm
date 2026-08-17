import { fetcher } from "@/lib/api/fetcher";
import {
  CreateLeadSourceRequest,
  CreateLeadSourceResponse,
  GetLeadSourcesResponse,
  GetLeadSourceResponse,
  UpdateLeadSourceRequest,
  UpdateLeadSourceResponse,
  ToggleLeadSourceActiveRequest,
  ToggleLeadSourceActiveResponse,
  LeadSourcesFilters,
} from "@/lib/lead-sources/types";

/**
 * Create a new lead source
 */
export const createLeadSource = async (
  payload: CreateLeadSourceRequest,
): Promise<CreateLeadSourceResponse> => {
  return await fetcher<CreateLeadSourceResponse>(
    "/lead-sources",
    "POST",
    payload,
  );
};

/**
 * Get list of lead sources with optional filters
 */
export const getLeadSources = async (
  filters?: LeadSourcesFilters,
): Promise<GetLeadSourcesResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.category) {
    params.append("category", filters.category);
  }
  
  if (filters?.active !== undefined) {
    params.append("active", String(filters.active));
  }
  
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const queryString = params.toString();
  const url = queryString ? `/lead-sources?${queryString}` : "/lead-sources";

  return await fetcher<GetLeadSourcesResponse>(url, "GET");
};

/**
 * Get a single lead source by ID
 */
export const getLeadSource = async (
  id: string,
): Promise<GetLeadSourceResponse> => {
  return await fetcher<GetLeadSourceResponse>(
    `/lead-sources/${id}`,
    "GET",
  );
};

/**
 * Update a lead source's label and category (value is immutable)
 */
export const updateLeadSource = async (
  id: string,
  payload: UpdateLeadSourceRequest,
): Promise<UpdateLeadSourceResponse> => {
  return await fetcher<UpdateLeadSourceResponse>(
    `/lead-sources/${id}`,
    "PUT",
    payload,
  );
};

/**
 * Soft-delete a lead source
 */
export const deleteLeadSource = async (id: string): Promise<void> => {
  return await fetcher<void>(
    `/lead-sources/${id}`,
    "DELETE",
  );
};

/**
 * Toggle a lead source's active status
 */
export const toggleLeadSourceActive = async (
  id: string,
  payload: ToggleLeadSourceActiveRequest,
): Promise<ToggleLeadSourceActiveResponse> => {
  return await fetcher<ToggleLeadSourceActiveResponse>(
    `/lead-sources/${id}/active`,
    "PATCH",
    payload,
  );
};
