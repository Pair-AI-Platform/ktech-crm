import { fetcher } from "@/lib/api/fetcher";
import {
  ActivatePucPeriodResponse,
  CreatePucPeriodRequest,
  CreatePucPeriodResponse,
  DeactivatePucPeriodResponse,
  GetActivePucPeriodResponse,
  GetPucPeriodResponse,
  GetPucPeriodsResponse,
  PucPeriodsFilters,
  UpdatePucPeriodRequest,
  UpdatePucPeriodResponse,
} from "@/lib/puc-periods/types";

/**
 * Create a new PUC period.
 *
 * The new period becomes the active period.
 * The previously active period is archived along with
 * every PUC lead created inside its period window.
 */
export const createPucPeriod = async (
  payload: CreatePucPeriodRequest,
): Promise<CreatePucPeriodResponse> => {
  return await fetcher("/puc-periods", "POST", payload);
};

/**
 * Get list of PUC periods with optional filters.
 */
export const getPucPeriods = async (
  filters?: PucPeriodsFilters,
): Promise<GetPucPeriodsResponse> => {
  const params = new URLSearchParams();

  if (filters?.search) {
    params.append("search", filters.search);
  }

  if (filters?.status) {
    params.append("status", filters.status);
  }

  const queryString = params.toString();

  const url = queryString
    ? `/puc-periods?${queryString}`
    : "/puc-periods";

  return await fetcher(url, "GET");
};

/**
 * Get the period holding the active slot.
 *
 * Returns null if there is no active period.
 * The returned period may have status "frozen"
 * if its end date has passed without being superseded.
 */
export const getActivePucPeriod =
  async (): Promise<GetActivePucPeriodResponse> => {
    return await fetcher("/puc-periods/active", "GET");
  };

/**
 * Get a single PUC period by ID.
 */
export const getPucPeriod = async (
  id: string,
): Promise<GetPucPeriodResponse> => {
  return await fetcher(`/puc-periods/${id}`, "GET");
};

/**
 * Update a PUC period.
 *
 * Only active periods can be updated.
 * Dates that are changed must be today or later.
 */
export const updatePucPeriod = async (
  id: string,
  payload: UpdatePucPeriodRequest,
): Promise<UpdatePucPeriodResponse> => {
  return await fetcher(`/puc-periods/${id}`, "PUT", payload);
};

/**
 * Activate a PUC period exclusively.
 *
 * The currently active period, if any, is archived
 * and its PUC leads are archived as well.
 */
export const activatePucPeriod = async (
  id: string,
): Promise<ActivatePucPeriodResponse> => {
  return await fetcher(`/puc-periods/${id}/activate`, "PATCH");
};

/**
 * Deactivate a PUC period.
 *
 * Every PUC lead created inside the period's window
 * will be archived.
 */
export const deactivatePucPeriod = async (
  id: string,
): Promise<DeactivatePucPeriodResponse> => {
  return await fetcher(`/puc-periods/${id}/deactivate`, "PATCH");
};

/**
 * Hard-delete a frozen or archived PUC period.
 *
 * Returns 409 if the period is still active.
 * Archived leads are not restored and keep their archived_at value.
 */
export const deletePucPeriod = async (id: string): Promise<void> => {
  await fetcher(`/puc-periods/${id}`, "DELETE");
};