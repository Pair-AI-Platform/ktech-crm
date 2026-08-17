export type PucPeriodStatus = "active" | "frozen" | "archived";

export interface PucPeriod {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
  status: PucPeriodStatus;
  leadsArchivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface CreatePucPeriodRequest {
  name: string;
  startDate: string;
  endDate: string;
}

export interface CreatePucPeriodResponse {
  period: PucPeriod;
}

export interface GetPucPeriodsResponse {
  data: PucPeriod[];
  total: number;
}

export interface GetPucPeriodResponse {
  period: PucPeriod;
}

export interface GetActivePucPeriodResponse {
  period: PucPeriod | null;
}
export interface UpdatePucPeriodRequest {
  name?: string;
  startDate?: string;
  endDate?: string;
}
export interface UpdatePucPeriodResponse {
  period: PucPeriod;
}

export interface ActivatePucPeriodResponse {
  period: PucPeriod;
}

export interface DeactivatePucPeriodResponse {
  period: PucPeriod;
}

export interface PucPeriodsFilters extends Record<string, unknown> {
  search?: string;
  status?: PucPeriodStatus;
}
