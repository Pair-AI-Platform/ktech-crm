"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import {
  PipelineType,
  PipelineStagesFilters,
  CreatePipelineStageRequest,
  UpdatePipelineStageRequest,
  ReorderPipelineStagesRequest,
  MovePipelineStageRequest,
  TogglePipelineStageActiveRequest,
} from "@/lib/pipeline-stages/types";
import {
  getPipelineStages,
  createPipelineStage,
  updatePipelineStage,
  reorderPipelineStages,
  movePipelineStage,
  togglePipelineStageActive,
  getPipelineStage,
} from "@/services/pipelineStagesService";

/**
 * Hook to fetch pipeline stages with filters
 */
export function usePipelineStages(
  pipelineType: PipelineType,
  filters?: Omit<PipelineStagesFilters, "pipelineType">,
) {
  const fullFilters: PipelineStagesFilters = {
    pipelineType,
    ...filters,
  };

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.pipelineStages.list(fullFilters),
    queryFn: () => getPipelineStages(fullFilters),
  });

  return {
    stages: data?.data || [],
    summary: data?.summary || { total: 0, active: 0, inactive: 0 },
    pipelineType: data?.pipelineType,
    loading: isLoading,
    error: error?.message || null,
  };
}

/**
 * Hook to fetch a single pipeline stage by ID
 */
export function usePipelineStage(id: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.pipelineStages.detail(id),
    queryFn: () => getPipelineStage(id),
    enabled: !!id,
  });

  return {
    stage: data?.stage,
    loading: isLoading,
    error: error?.message || null,
  };
}

/**
 * Hook to create a new pipeline stage
 */
export function useCreatePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreatePipelineStageRequest) =>
      createPipelineStage(params),
    onSuccess: (data) => {
      // Invalidate all pipeline stages lists for the specific pipeline type
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.lists(),
      });
      // Also invalidate the specific detail if needed
      if (data?.stage?.id) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.pipelineStages.detail(data.stage.id),
        });
      }
    },
  });
}

/**
 * Hook to update a pipeline stage
 */
export function useUpdatePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string } & UpdatePipelineStageRequest) =>
      updatePipelineStage(params.id, {
        nameEn: params.nameEn,
        nameAr: params.nameAr,
        requiresDocuments: params.requiresDocuments,
      }),
    onSuccess: (data, variables) => {
      // Invalidate all pipeline stages lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.lists(),
      });
      // Invalidate the specific stage detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.detail(variables.id),
      });
    },
  });
}

/**
 * Hook to reorder pipeline stages
 */
export function useReorderPipelineStages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: ReorderPipelineStagesRequest) =>
      reorderPipelineStages(params),
    onSuccess: () => {
      // Invalidate all pipeline stages lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.lists(),
      });
      // Invalidate all details as positions changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.details(),
      });
    },
  });
}

/**
 * Hook to move a pipeline stage to a specific position
 */
export function useMovePipelineStage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string } & MovePipelineStageRequest) =>
      movePipelineStage(params.id, { toPosition: params.toPosition }),
    onSuccess: (data, variables) => {
      // Invalidate all pipeline stages lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.lists(),
      });
      // Invalidate all details as positions changed
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.details(),
      });
    },
  });
}

/**
 * Hook to toggle a pipeline stage's active status
 */
export function useTogglePipelineStageActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: string } & TogglePipelineStageActiveRequest) =>
      togglePipelineStageActive(params.id, { active: params.active }),
    onSuccess: (data, variables) => {
      // Invalidate all pipeline stages lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.lists(),
      });
      // Invalidate the specific stage detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineStages.detail(variables.id),
      });
    },
  });
}
