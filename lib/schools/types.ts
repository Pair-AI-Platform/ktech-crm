/**
 * Schools types for the CRM application
 */

// School gender types
export type SchoolGender = "male" | "female" | "mixed";

// School type (education system)
export type SchoolType = "gov" | "us" | "uk" | "ksa" | "others";

// School entity
export interface School {
  id: string;
  nameAr: string;
  nameEn: string;
  governorate: string | null;
  gender: SchoolGender;
  schoolType: SchoolType;
  location: string | null;
  principalName: string | null;
  phone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// School statistics
export interface SchoolStats {
  totalSchools: number;
  activeSchools: number;
  maleSchools: number;
  femaleSchools: number;
  mixedSchools: number;
}

// Pagination metadata
export interface SchoolPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Request types
export interface CreateSchoolRequest {
  nameAr: string;
  nameEn: string;
  governorate?: string;
  gender: SchoolGender;
  schoolType: SchoolType;
  location?: string;
  principalName?: string;
  phone?: string;
  active?: boolean;
}

export interface UpdateSchoolRequest {
  nameAr?: string;
  nameEn?: string;
  governorate?: string | null;
  gender?: SchoolGender;
  schoolType?: SchoolType;
  location?: string | null;
  principalName?: string | null;
  phone?: string | null;
}

export interface ToggleSchoolActiveRequest {
  active: boolean;
}

// Response types
export interface CreateSchoolResponse {
  school: School;
}

export interface GetSchoolsResponse {
  data: School[];
  pagination: SchoolPagination;
}

export interface GetSchoolStatsResponse {
  stats: SchoolStats;
}

export interface GetSchoolResponse {
  school: School;
}

export interface UpdateSchoolResponse {
  school: School;
}

export interface DeleteSchoolResponse {
  success: boolean;
}

export interface ToggleSchoolActiveResponse {
  school: School;
}

// Filter types
export interface SchoolsFilters extends Record<string, unknown> {
  search?: string;
  governorate?: string;
  gender?: SchoolGender;
  schoolType?: SchoolType;
  active?: boolean;
  sortBy?: "nameAr" | "nameEn" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}
