import { fetcher } from "@/lib/api/fetcher";
import {
  CreateEducationCycleRequest,
  CreateEducationCycleResponse,
  GetEducationCyclesResponse,
  GetEducationCycleResponse,
  UpdateEducationCycleRequest,
  UpdateEducationCycleResponse,
  UpdateTermDatesRequest,
  UpdateTermDatesResponse,
  ActivateEducationCycleResponse,
  DeactivateEducationCycleResponse,
  ToggleTermActiveRequest,
  ToggleTermActiveResponse,
  EducationCyclesFilters,
} from "@/lib/education-cycles/types";

/**
 * Create a new education cycle with Fall and Spring terms
 */
export const createEducationCycle = async (
  payload: CreateEducationCycleRequest,
): Promise<CreateEducationCycleResponse> => {
  return await fetcher<CreateEducationCycleResponse>(
    "/education-cycles",
    "POST",
    payload,
  );
};

/**
 * Get list of education cycles with optional filters
 */
export const getEducationCycles = async (
  filters?: EducationCyclesFilters,
): Promise<GetEducationCyclesResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.active !== undefined) {
    params.append("active", String(filters.active));
  }
  
  if (filters?.search) {
    params.append("search", filters.search);
  }

  const queryString = params.toString();
  const url = queryString ? `/education-cycles?${queryString}` : "/education-cycles";

  return await fetcher<GetEducationCyclesResponse>(url, "GET");
};

/**
 * Get the active education cycle
 */
export const getActiveEducationCycle = async (): Promise<GetEducationCycleResponse> => {
  return await fetcher<GetEducationCycleResponse>(
    "/education-cycles/active",
    "GET",
  );
};

/**
 * Get a single education cycle by ID
 */
export const getEducationCycle = async (
  id: string,
): Promise<GetEducationCycleResponse> => {
  return await fetcher<GetEducationCycleResponse>(
    `/education-cycles/${id}`,
    "GET",
  );
};

/**
 * Update an education cycle's name and term labels
 */
export const updateEducationCycle = async (
  id: string,
  payload: UpdateEducationCycleRequest,
): Promise<UpdateEducationCycleResponse> => {
  return await fetcher<UpdateEducationCycleResponse>(
    `/education-cycles/${id}`,
    "PUT",
    payload,
  );
};

/**
 * Update term dates for a specific semester
 */
export const updateTermDates = async (
  cycleId: string,
  semester: "fall" | "spring",
  payload: UpdateTermDatesRequest,
): Promise<UpdateTermDatesResponse> => {
  return await fetcher<UpdateTermDatesResponse>(
    `/education-cycles/${cycleId}/terms/${semester}/dates`,
    "PUT",
    payload,
  );
};

/**
 * Activate an education cycle (exclusive - deactivates others)
 */
export const activateEducationCycle = async (
  id: string,
): Promise<ActivateEducationCycleResponse> => {
  return await fetcher<ActivateEducationCycleResponse>(
    `/education-cycles/${id}/activate`,
    "PATCH",
  );
};

/**
 * Deactivate an education cycle
 */
export const deactivateEducationCycle = async (
  id: string,
): Promise<DeactivateEducationCycleResponse> => {
  return await fetcher<DeactivateEducationCycleResponse>(
    `/education-cycles/${id}/deactivate`,
    "PATCH",
  );
};

/**
 * Toggle a term's active status
 */
export const toggleTermActive = async (
  cycleId: string,
  semester: "fall" | "spring",
  payload: ToggleTermActiveRequest,
): Promise<ToggleTermActiveResponse> => {
  return await fetcher<ToggleTermActiveResponse>(
    `/education-cycles/${cycleId}/terms/${semester}/active`,
    "PATCH",
    payload,
  );
};
