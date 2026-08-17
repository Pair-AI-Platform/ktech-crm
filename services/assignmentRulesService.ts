import { fetcher } from "@/lib/api/fetcher";
import {
  CreateRuleRequest,
  UpdateRuleRequest,
  ReorderRulesRequest,
  ToggleRuleActiveRequest,
  AssignmentRule,
  RulesListResponse,
  RulesFilters,
} from "@/lib/assignment-rules/types";

/**
 * Create a new assignment rule
 */
export const createRule = async (
  data: CreateRuleRequest,
): Promise<{ rule: AssignmentRule }> => {
  return await fetcher<{ rule: AssignmentRule }>(
    "/assignment-rules",
    "POST",
    data,
  );
};

/**
 * Get all assignment rules with optional filters
 */
export const getRules = async (
  filters?: RulesFilters,
): Promise<RulesListResponse> => {
  const params = new URLSearchParams();

  if (filters?.search) params.append("search", filters.search);
  if (filters?.ruleType) params.append("ruleType", filters.ruleType);
  if (filters?.active !== undefined)
    params.append("active", String(filters.active));
  if (filters?.sortBy) params.append("sortBy", filters.sortBy);
  if (filters?.sortOrder) params.append("sortOrder", filters.sortOrder);
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));

  const queryString = params.toString();
  const url = queryString
    ? `/assignment-rules?${queryString}`
    : "/assignment-rules";

  return await fetcher<RulesListResponse>(url, "GET");
};

/**
 * Reorder assignment rules
 */
export const reorderRules = async (
  data: ReorderRulesRequest,
): Promise<{ success: boolean }> => {
  return await fetcher<{ success: boolean }>(
    "/assignment-rules/reorder",
    "PATCH",
    data,
  );
};

/**
 * Get a single assignment rule by ID
 */
export const getRuleById = async (
  id: string,
): Promise<{ rule: AssignmentRule }> => {
  return await fetcher<{ rule: AssignmentRule }>(
    `/assignment-rules/${id}`,
    "GET",
  );
};

/**
 * Update an assignment rule
 */
export const updateRule = async (
  id: string,
  data: UpdateRuleRequest,
): Promise<{ rule: AssignmentRule }> => {
  return await fetcher<{ rule: AssignmentRule }>(
    `/assignment-rules/${id}`,
    "PUT",
    data,
  );
};

/**
 * Delete an assignment rule
 */
export const deleteRule = async (id: string): Promise<void> => {
  return await fetcher<void>(`/assignment-rules/${id}`, "DELETE");
};

/**
 * Toggle active status of an assignment rule
 */
export const toggleRuleActive = async (
  id: string,
  data: ToggleRuleActiveRequest,
): Promise<{ rule: AssignmentRule }> => {
  return await fetcher<{ rule: AssignmentRule }>(
    `/assignment-rules/${id}/active`,
    "PATCH",
    data,
  );
};
