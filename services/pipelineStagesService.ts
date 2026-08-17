import { fetcher } from "@/lib/api/fetcher";
import {
  CreatePipelineStageRequest,
  CreatePipelineStageResponse,
  GetPipelineStagesResponse,
  ReorderPipelineStagesRequest,
  ReorderPipelineStagesResponse,
  GetPipelineStageResponse,
  UpdatePipelineStageRequest,
  UpdatePipelineStageResponse,
  MovePipelineStageRequest,
  MovePipelineStageResponse,
  TogglePipelineStageActiveRequest,
  TogglePipelineStageActiveResponse,
  PipelineStagesFilters,
} from "@/lib/pipeline-stages/types";

/**
 * Create a new pipeline stage
 */
export const createPipelineStage = async (
  payload: CreatePipelineStageRequest,
): Promise<CreatePipelineStageResponse> => {
  return await fetcher<CreatePipelineStageResponse>(
    "/pipeline-stages",
    "POST",
    payload,
  );
};

/**
 * Get list of pipeline stages with optional filters
 */
export const getPipelineStages = async (
  filters: PipelineStagesFilters,
): Promise<GetPipelineStagesResponse> => {
  const params = new URLSearchParams();
  
  params.append("pipelineType", filters.pipelineType);
  
  if (filters.search) {
    params.append("search", filters.search);
  }
  
  if (filters.active !== undefined) {
    params.append("active", String(filters.active));
  }
  
  if (filters.sortBy) {
    params.append("sortBy", filters.sortBy);
  }
  
  if (filters.sortOrder) {
    params.append("sortOrder", filters.sortOrder);
  }

  return await fetcher<GetPipelineStagesResponse>(
    `/pipeline-stages?${params.toString()}`,
    "GET",
  );
};

/**
 * Reorder pipeline stages
 */
export const reorderPipelineStages = async (
  payload: ReorderPipelineStagesRequest,
): Promise<ReorderPipelineStagesResponse> => {
  return await fetcher<ReorderPipelineStagesResponse>(
    "/pipeline-stages/reorder",
    "PATCH",
    payload,
  );
};

/**
 * Get a single pipeline stage by ID
 */
export const getPipelineStage = async (
  id: string,
): Promise<GetPipelineStageResponse> => {
  return await fetcher<GetPipelineStageResponse>(
    `/pipeline-stages/${id}`,
    "GET",
  );
};

/**
 * Update a pipeline stage's names and document requirements
 */
export const updatePipelineStage = async (
  id: string,
  payload: UpdatePipelineStageRequest,
): Promise<UpdatePipelineStageResponse> => {
  return await fetcher<UpdatePipelineStageResponse>(
    `/pipeline-stages/${id}`,
    "PUT",
    payload,
  );
};

/**
 * Move a pipeline stage to a specific position
 */
export const movePipelineStage = async (
  id: string,
  payload: MovePipelineStageRequest,
): Promise<MovePipelineStageResponse> => {
  return await fetcher<MovePipelineStageResponse>(
    `/pipeline-stages/${id}/position`,
    "PATCH",
    payload,
  );
};

/**
 * Toggle a pipeline stage's active status
 */
export const togglePipelineStageActive = async (
  id: string,
  payload: TogglePipelineStageActiveRequest,
): Promise<TogglePipelineStageActiveResponse> => {
  return await fetcher<TogglePipelineStageActiveResponse>(
    `/pipeline-stages/${id}/active`,
    "PATCH",
    payload,
  );
};
