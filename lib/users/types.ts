/**
 * Users types for the CRM application
 */

// User status types
export type UserStatus = "online" | "idle" | "offline" | "on_meeting";

// User entity
export interface User {
  id: string;
  email: string;
  name: string;
  profilePic: string | null;
  phone: string | null;
  status: UserStatus;
  manualStatus: boolean;
  active: boolean;
  monthlyTarget: number;
  roleId: string;
  roleName: string;
  passwordChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// User analytics
export interface UserAnalytics {
  totalMembers: number;
  activeMembers: number;
  admins: number;
  agents: number;
  marketers: number;
}

// Pagination metadata
export interface UserPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Request types
export interface UpdateUserActiveRequest {
  active: boolean;
}

export interface UpdateUserManagementRequest {
  active?: boolean;
  monthlyTarget?: number;
  roleId?: string;
}

// Response types
export interface GetUserAnalyticsResponse {
  analytics: UserAnalytics;
}

export interface GetUsersResponse {
  data: User[];
  pagination: UserPagination;
}

export interface UpdateUserActiveResponse {
  user: User;
}

export interface UpdateUserManagementResponse {
  user: User;
}

// Filter types
export interface UsersFilters extends Record<string, unknown> {
  search?: string;
  role?: string;
  status?: UserStatus;
  active?: boolean;
  sortBy?: "name" | "email" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
