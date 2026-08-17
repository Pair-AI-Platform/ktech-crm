/**
 * Pipeline stage types for the CRM application
 */

export type PipelineType = "puc" | "sf";

export interface PipelineStageRow {
  id: string;
  pipelineType: PipelineType;
  nameEn: string;
  nameAr: string;
  stageKey: string;
  position: number;
  active: boolean;
  requiresDocuments: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PipelineStageSummary {
  total: number;
  active: number;
  inactive: number;
}

// Request types
export interface CreatePipelineStageRequest {
  pipelineType: PipelineType;
  nameEn: string;
  nameAr: string;
  stageKey: string;
  active: boolean;
  requiresDocuments: boolean;
}

export interface UpdatePipelineStageRequest {
  nameEn: string;
  nameAr: string;
  requiresDocuments: boolean;
}

export interface ReorderPipelineStagesRequest {
  pipelineType: PipelineType;
  orderedIds: string[];
}

export interface MovePipelineStageRequest {
  toPosition: number;
}

export interface TogglePipelineStageActiveRequest {
  active: boolean;
}

// Response types
export interface CreatePipelineStageResponse {
  stage: PipelineStageRow;
}

export interface GetPipelineStagesResponse {
  pipelineType: PipelineType;
  data: PipelineStageRow[];
  summary: PipelineStageSummary;
}

export interface ReorderPipelineStagesResponse {
  stages: PipelineStageRow[];
}

export interface GetPipelineStageResponse {
  stage: PipelineStageRow;
}

export interface UpdatePipelineStageResponse {
  stage: PipelineStageRow;
}

export interface MovePipelineStageResponse {
  stages: PipelineStageRow[];
}

export interface TogglePipelineStageActiveResponse {
  stage: PipelineStageRow;
}

// Query filter types
export interface PipelineStagesFilters extends Record<string, unknown> {
  pipelineType: PipelineType;
  search?: string;
  active?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}
