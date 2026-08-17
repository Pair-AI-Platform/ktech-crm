"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { queryKeys } from "./query-keys";

import {
  createDocumentRequirement,
  deleteDocumentRequirement,
  getDocumentRequirements,
  moveDocumentRequirement,
  reorderDocumentRequirements,
  toggleDocumentRequirementRequired,
  updateDocumentRequirement,
} from "@/services/documentRequirementsService";

import type {
  CreateDocumentRequirementRequest,
  DocumentRequirementsFilters,
  MoveDocumentRequirementRequest,
  ReorderDocumentRequirementsRequest,
  UpdateDocumentRequirementRequest,
} from "@/lib/document-requirements/types";

/**
 * Get document requirements with filters.
 */
export function useDocumentRequirements(filters: DocumentRequirementsFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.documentRequirements.list(filters),
    queryFn: () => getDocumentRequirements(filters),
  });

  return {
    documents: data?.data ?? [],
    summary: data?.summary ?? { total: 0, required: 0, optional: 0 },
    graduateType: data?.graduateType ?? filters.graduateType,
    loading: isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Create a new document requirement.
 */
export function useCreateDocumentRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDocumentRequirementRequest) =>
      createDocumentRequirement(payload),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequirements.all,
      });

      toast.success("Document requirement created successfully");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to create document requirement");
    },
  });
}

/**
 * Update an existing document requirement.
 */
export function useUpdateDocumentRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateDocumentRequirementRequest;
    }) => updateDocumentRequirement(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequirements.all,
      });

      toast.success("Document requirement updated successfully");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to update document requirement");
    },
  });
}

/**
 * Delete a document requirement.
 */
export function useDeleteDocumentRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDocumentRequirement(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequirements.all,
      });

      toast.success("Document requirement deleted successfully");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete document requirement");
    },
  });
}

/**
 * Reorder all documents within a graduate type.
 */
export function useReorderDocumentRequirements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReorderDocumentRequirementsRequest) =>
      reorderDocumentRequirements(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequirements.all,
      });

      toast.success("Documents reordered successfully");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder documents");
    },
  });
}

/**
 * Move a single document to a target position.
 */
export function useMoveDocumentRequirement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: MoveDocumentRequirementRequest;
    }) => moveDocumentRequirement(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequirements.all,
      });

      toast.success("Document position updated successfully");
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to move document");
    },
  });
}

/**
 * Toggle a document requirement between required and optional.
 */
export function useToggleDocumentRequirementRequired() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, required }: { id: string; required: boolean }) =>
      toggleDocumentRequirementRequired(id, required),

    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.documentRequirements.all,
      });

      const status = data.document.required ? "required" : "optional";
      toast.success(`Document marked as ${status}`);
    },

    onError: (error: Error) => {
      toast.error(error.message || "Failed to toggle document status");
    },
  });
}
