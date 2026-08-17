"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  createRule,
  getRules,
  reorderRules,
  getRuleById,
  updateRule,
  deleteRule,
  toggleRuleActive,
} from "@/services/assignmentRulesService";
import type {
  AssignmentRule,
  CreateRuleRequest,
  UpdateRuleRequest,
  ReorderRulesRequest,
  ToggleRuleActiveRequest,
  RulesFilters,
} from "@/lib/assignment-rules/types";

// Export types for component use
export type { AssignmentRule };

/**
 * Hook to fetch assignment rules with optional filters
 */
export function useRules(filters?: RulesFilters) {
  return useQuery({
    queryKey: queryKeys.assignmentRules.list((filters || {}) as Record<string, unknown>),
    queryFn: async () => {
      return await getRules(filters);
    },
  });
}

/**
 * Hook to fetch a single assignment rule by ID
 */
export function useRuleById(id: string) {
  return useQuery({
    queryKey: queryKeys.assignmentRules.detail(id),
    queryFn: async () => {
      const response = await getRuleById(id);
      return response.rule;
    },
    enabled: !!id,
  });
}

/**
 * Hook to create a new assignment rule
 */
export function useCreateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateRuleRequest) => {
      const response = await createRule(data);
      return response.rule;
    },
    onSuccess: () => {
      // Invalidate all rule lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.lists(),
      });
    },
  });
}

/**
 * Hook to update an assignment rule
 */
export function useUpdateRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateRuleRequest;
    }) => {
      const response = await updateRule(id, data);
      return response.rule;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific rule and all lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.lists(),
      });
    },
  });
}

/**
 * Hook to delete an assignment rule
 */
export function useDeleteRule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await deleteRule(id);
      return id;
    },
    onSuccess: (id) => {
      // Invalidate the specific rule and all lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.lists(),
      });
    },
  });
}

/**
 * Hook to toggle active status of an assignment rule
 */
export function useToggleRuleActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: ToggleRuleActiveRequest;
    }) => {
      const response = await toggleRuleActive(id, data);
      return response.rule;
    },
    onSuccess: (_, variables) => {
      // Invalidate the specific rule and all lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.lists(),
      });
    },
  });
}

/**
 * Hook to reorder assignment rules
 */
export function useReorderRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderRulesRequest) => {
      await reorderRules(data);
    },
    onSuccess: () => {
      // Invalidate all rule lists to refetch with new order
      queryClient.invalidateQueries({
        queryKey: queryKeys.assignmentRules.lists(),
      });
    },
  });
}
