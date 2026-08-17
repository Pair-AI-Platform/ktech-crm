"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "./query-keys";

import {
  activatePucPeriod,
  createPucPeriod,
  deactivatePucPeriod,
  deletePucPeriod,
  getActivePucPeriod,
  getPucPeriods,
  updatePucPeriod,
} from "@/services/pucPeriodsService";

import type {
  CreatePucPeriodRequest,
  PucPeriodsFilters,
  UpdatePucPeriodRequest,
} from "@/lib/puc-periods/types";

/**
 * Get all PUC periods with optional filters.
 */
export function usePUCPeriods(filters?: PucPeriodsFilters) {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.pucPeriods.list(filters),
    queryFn: () => getPucPeriods(filters),
  });

  return {
    periods: data?.data ?? [],
    total: data?.total ?? 0,
    loading: isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Get the currently active PUC period.
 *
 * The API returns the period holding the active slot.
 * It can have status "frozen" when its end date has passed.
 */
export function useActivePUCPeriod() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.pucPeriods.active(),
    queryFn: getActivePucPeriod,
  });

  const period = data?.period ?? null;

  return {
    period,
    isFrozen: period?.status === "frozen",
    loading: isLoading,
    error: error?.message ?? null,
  };
}

/**
 * Create a new PUC period.
 *
 * The newly created period automatically becomes active.
 * The previously active period is archived.
 */
export function useCreatePUCPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePucPeriodRequest) => createPucPeriod(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.all,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.active(),
      });
    },
  });
}

/**
 * Update an existing PUC period.
 *
 * Only active periods can be updated.
 */
export function useUpdatePUCPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdatePucPeriodRequest;
    }) => updatePucPeriod(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.all,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.active(),
      });
    },
  });
}

/**
 * Delete a frozen or archived PUC period.
 *
 * The API returns 204 No Content on success.
 */
export function useDeletePUCPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePucPeriod(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.all,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.active(),
      });
    },
  });
}

/**
 * Activate a PUC period.
 *
 * The currently active period, if any, is archived.
 */
export function useActivatePUCPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => activatePucPeriod(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.all,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.active(),
      });
    },
  });
}

/**
 * Deactivate a PUC period.
 *
 * Leads created inside the period window are archived.
 */
export function useDeactivatePUCPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deactivatePucPeriod(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.all,
      });

      queryClient.invalidateQueries({
        queryKey: queryKeys.pucPeriods.active(),
      });
    },
  });
}
