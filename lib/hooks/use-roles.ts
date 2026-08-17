"use client";

import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import { getRoles } from "@/services/roleService";
import type { Role } from "@/lib/roles/types";

export type { Role };

export function useRoles() {
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.roles.all,
    queryFn: getRoles,
    staleTime: 10 * 60 * 1000,
  });

  return {
    roles: data?.roles ?? [],
    loading: isLoading,
    error: error?.message || null,
  };
}
