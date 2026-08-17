import { fetcher } from "@/lib/api/fetcher";
import {
  GetUserAnalyticsResponse,
  GetUsersResponse,
  UpdateUserActiveRequest,
  UpdateUserActiveResponse,
  UpdateUserManagementRequest,
  UpdateUserManagementResponse,
  UsersFilters,
} from "@/lib/users/types";

/**
 * Get user analytics
 */
export const getUserAnalytics = async (): Promise<GetUserAnalyticsResponse> => {
  return await fetcher<GetUserAnalyticsResponse>(
    "/users/analytics",
    "GET",
  );
};

/**
 * Get list of users with optional filters
 */
export const getUsers = async (
  filters?: UsersFilters,
): Promise<GetUsersResponse> => {
  const params = new URLSearchParams();
  
  if (filters?.search) {
    params.append("search", filters.search);
  }
  
  if (filters?.role) {
    params.append("role", filters.role);
  }
  
  if (filters?.status) {
    params.append("status", filters.status);
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
  const url = queryString ? `/users?${queryString}` : "/users";

  return await fetcher<GetUsersResponse>(url, "GET");
};

/**
 * Update user active status
 */
export const updateUserActive = async (
  id: string,
  active: boolean,
): Promise<UpdateUserActiveResponse> => {
  const payload: UpdateUserActiveRequest = { active };
  return await fetcher<UpdateUserActiveResponse>(
    `/users/${id}/active`,
    "PATCH",
    payload,
  );
};

/**
 * Update user management details
 */
export const updateUserManagement = async (
  id: string,
  payload: UpdateUserManagementRequest,
): Promise<UpdateUserManagementResponse> => {
  return await fetcher<UpdateUserManagementResponse>(
    `/users/${id}/management`,
    "PATCH",
    payload,
  );
};
