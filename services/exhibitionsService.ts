import { fetcher } from "@/lib/api/fetcher";
import {
  CreateExhibitionRequest,
  CreateExhibitionResponse,
  GetExhibitionsResponse,
  GetExhibitionResponse,
  UpdateExhibitionRequest,
  UpdateExhibitionResponse,
  ToggleExhibitionActiveRequest,
  ToggleExhibitionActiveResponse,
  ExhibitionsFilters,
} from "@/lib/exhibitions/types";

/**
 * Create a new exhibition
 */
export const createExhibition = async (
  payload: CreateExhibitionRequest,
): Promise<CreateExhibitionResponse> => {
  return await fetcher<CreateExhibitionResponse>(
    "/exhibitions",
    "POST",
    payload,
  );
};

/**
 * Get list of exhibitions with optional filters
 */
export const getExhibitions = async (
  filters?: ExhibitionsFilters,
): Promise<GetExhibitionsResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.active !== undefined) {
    params.append("active", String(filters.active));
  }
  
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const queryString = params.toString();
  const url = queryString ? `/exhibitions?${queryString}` : "/exhibitions";

  return await fetcher<GetExhibitionsResponse>(url, "GET");
};

/**
 * Get a single exhibition by ID
 */
export const getExhibition = async (
  id: string,
): Promise<GetExhibitionResponse> => {
  return await fetcher<GetExhibitionResponse>(
    `/exhibitions/${id}`,
    "GET",
  );
};

/**
 * Update an exhibition's name
 */
export const updateExhibition = async (
  id: string,
  payload: UpdateExhibitionRequest,
): Promise<UpdateExhibitionResponse> => {
  return await fetcher<UpdateExhibitionResponse>(
    `/exhibitions/${id}`,
    "PUT",
    payload,
  );
};

/**
 * Soft-delete an exhibition
 */
export const deleteExhibition = async (id: string): Promise<void> => {
  return await fetcher<void>(
    `/exhibitions/${id}`,
    "DELETE",
  );
};

/**
 * Toggle an exhibition's active status
 */
export const toggleExhibitionActive = async (
  id: string,
  payload: ToggleExhibitionActiveRequest,
): Promise<ToggleExhibitionActiveResponse> => {
  return await fetcher<ToggleExhibitionActiveResponse>(
    `/exhibitions/${id}/active`,
    "PATCH",
    payload,
  );
};
