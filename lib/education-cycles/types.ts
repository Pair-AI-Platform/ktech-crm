/**
 * Education Cycles types for the CRM application
 */

export interface Term {
  id: string;
  semester: "fall" | "spring";
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  active: boolean;
}

export interface EducationCycle {
  id: string;
  name: string;
  active: boolean;
  terms: Term[];
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateEducationCycleRequest {
  name: string;
  fallLabel: string;
  springLabel: string;
  fallStartDate: string; // YYYY-MM-DD
  fallEndDate: string; // YYYY-MM-DD
  springStartDate: string; // YYYY-MM-DD
  springEndDate: string; // YYYY-MM-DD
  active?: boolean;
}

export interface UpdateEducationCycleRequest {
  name: string;
  fallLabel?: string;
  springLabel?: string;
}

export interface UpdateTermDatesRequest {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ToggleTermActiveRequest {
  active: boolean;
}

// Response types
export interface CreateEducationCycleResponse {
  cycle: EducationCycle;
}

export interface GetEducationCyclesResponse {
  data: EducationCycle[];
  total: number;
}

export interface GetEducationCycleResponse {
  cycle: EducationCycle;
}

export interface UpdateEducationCycleResponse {
  cycle: EducationCycle;
}

export interface ActivateEducationCycleResponse {
  cycle: EducationCycle;
}

export interface DeactivateEducationCycleResponse {
  cycle: EducationCycle;
}

export interface UpdateTermDatesResponse {
  cycle: EducationCycle;
}

export interface ToggleTermActiveResponse {
  cycle: EducationCycle;
}

// Query filter types
export interface EducationCyclesFilters extends Record<string, unknown> {
  active?: boolean;
  search?: string;
}
