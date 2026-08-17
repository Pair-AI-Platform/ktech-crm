/**
 * Lead source types for the CRM application
 */

export type LeadSourceCategory = "direct" | "events" | "marketing" | "referrals" | "outreach";

export interface LeadSource {
  id: string;
  label: string;
  value: string;
  category: LeadSourceCategory;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadSourceCountsByCategory {
  direct: number;
  events: number;
  marketing: number;
  referrals: number;
  outreach: number;
}

// Request types
export interface CreateLeadSourceRequest {
  label: string;
  value: string;
  category: LeadSourceCategory;
  active?: boolean;
}

export interface UpdateLeadSourceRequest {
  label: string;
  category: LeadSourceCategory;
}

export interface ToggleLeadSourceActiveRequest {
  active: boolean;
}

// Response types
export interface CreateLeadSourceResponse {
  source: LeadSource;
}

export interface GetLeadSourcesResponse {
  data: LeadSource[];
  countsByCategory: LeadSourceCountsByCategory;
  total: number;
}

export interface GetLeadSourceResponse {
  source: LeadSource;
}

export interface UpdateLeadSourceResponse {
  source: LeadSource;
}

export interface ToggleLeadSourceActiveResponse {
  source: LeadSource;
}

// Query filter types
export interface LeadSourcesFilters extends Record<string, unknown> {
  category?: LeadSourceCategory;
  active?: boolean;
  search?: string;
}
