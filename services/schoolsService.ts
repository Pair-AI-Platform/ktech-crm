import { fetcher } from "@/lib/api/fetcher";
import {
  CreateSchoolRequest,
  CreateSchoolResponse,
  GetSchoolsResponse,
  GetSchoolStatsResponse,
  GetSchoolResponse,
  UpdateSchoolRequest,
  UpdateSchoolResponse,
  DeleteSchoolResponse,
  ToggleSchoolActiveRequest,
  ToggleSchoolActiveResponse,
  SchoolsFilters,
} from "@/lib/schools/types";

/**
 * Create a new school
 */
export const createSchool = async (
  payload: CreateSchoolRequest,
): Promise<CreateSchoolResponse> => {
  return await fetcher<CreateSchoolResponse>(
    "/schools",
    "POST",
    payload,
  );
};

/**
 * Get list of schools with optional filters
 */
export const getSchools = async (
  filters?: SchoolsFilters,
): Promise<GetSchoolsResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.search) {
    params.append("search", filters.search);
  }
  
  if (filters?.governorate) {
    params.append("governorate", filters.governorate);
  }
  
  if (filters?.gender) {
    params.append("gender", filters.gender);
  }
  
  if (filters?.schoolType) {
    params.append("schoolType", filters.schoolType);
  }
  
  if (filters?.active !== undefined) {
    params.append("active", String(filters.active));
  }
  
  if (filters?.sortBy) {
    params.append("sortBy", filters.sortBy);
  }
  
  if (filters?.sortOrder) {
    params.append("sortOrder", filters.sortOrder);
  }
  
  if (filters?.page !== undefined) {
    params.append("page", String(filters.page));
  }
  
  if (filters?.limit !== undefined) {
    params.append("limit", String(filters.limit));
  }

  const queryString = params.toString();
  const url = queryString ? `/schools?${queryString}` : "/schools";

  return await fetcher<GetSchoolsResponse>(url, "GET");
};

/**
 * Get school statistics
 */
export const getSchoolStats = async (): Promise<GetSchoolStatsResponse> => {
  return await fetcher<GetSchoolStatsResponse>(
    "/schools/stats",
    "GET",
  );
};

/**
 * Get a single school by ID
 */
export const getSchool = async (
  id: string,
): Promise<GetSchoolResponse> => {
  return await fetcher<GetSchoolResponse>(
    `/schools/${id}`,
    "GET",
  );
};

/**
 * Update a school
 */
export const updateSchool = async (
  id: string,
  payload: UpdateSchoolRequest,
): Promise<UpdateSchoolResponse> => {
  return await fetcher<UpdateSchoolResponse>(
    `/schools/${id}`,
    "PUT",
    payload,
  );
};

/**
 * Delete a school (soft delete)
 */
export const deleteSchool = async (id: string): Promise<DeleteSchoolResponse> => {
  return await fetcher<DeleteSchoolResponse>(
    `/schools/${id}`,
    "DELETE",
  );
};

/**
 * Toggle a school's active status
 */
export const toggleSchoolActive = async (
  id: string,
  payload: ToggleSchoolActiveRequest,
): Promise<ToggleSchoolActiveResponse> => {
  return await fetcher<ToggleSchoolActiveResponse>(
    `/schools/${id}/active`,
    "PATCH",
    payload,
  );
};
