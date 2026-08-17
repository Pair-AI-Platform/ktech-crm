/**
 * Exhibition types for the CRM application
 */

export interface Exhibition {
  id: string;
  name: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateExhibitionRequest {
  name: string;
  active?: boolean;
}

export interface UpdateExhibitionRequest {
  name: string;
}

export interface ToggleExhibitionActiveRequest {
  active: boolean;
}

// Response types
export interface CreateExhibitionResponse {
  exhibition: Exhibition;
}

export interface GetExhibitionsResponse {
  data: Exhibition[];
  total: number;
}

export interface GetExhibitionResponse {
  exhibition: Exhibition;
}

export interface UpdateExhibitionResponse {
  exhibition: Exhibition;
}

export interface ToggleExhibitionActiveResponse {
  exhibition: Exhibition;
}

// Query filter types
export interface ExhibitionsFilters extends Record<string, unknown> {
  active?: boolean;
  search?: string;
}
