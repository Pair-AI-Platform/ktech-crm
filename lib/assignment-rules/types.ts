/**
 * Assignment Rules types for the CRM application
 */

// Rule type enum
export type RuleType = "round_robin" | "source" | "school" | "major";

// Condition operator types
export type ConditionOperator = "equals" | "in";

// Condition structure
export interface RuleCondition {
  field: string;
  operator: ConditionOperator;
  values: string[];
}

// Assignment Rule entity
export interface AssignmentRule {
  id: string;
  name: string;
  description?: string;
  priority: number;
  ruleType: RuleType;
  active: boolean;
  conditions: RuleCondition[];
  agentIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Request types
export interface CreateRuleRequest {
  name: string;
  description?: string;
  priority: number;
  ruleType: RuleType;
  active: boolean;
  conditions: RuleCondition[];
  agentIds: string[];
}

export interface UpdateRuleRequest {
  name?: string;
  description?: string;
  priority?: number;
  active?: boolean;
  conditions?: RuleCondition[];
  agentIds?: string[];
}

export interface ReorderRulesRequest {
  orderedRuleIds: string[];
}

export interface ToggleRuleActiveRequest {
  active: boolean;
}

// Response types
export interface RuleResponse {
  rule: AssignmentRule;
}

export interface RulesListResponse {
  data: AssignmentRule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Filter/query parameters
export interface RulesFilters {
  search?: string;
  ruleType?: RuleType;
  active?: boolean;
  sortBy?: "priority" | "name" | "createdAt" | "updatedAt";
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// Error response type
export interface RuleErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
