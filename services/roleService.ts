import { fetcher } from "@/lib/api/fetcher";
import { GetRolesResponse } from "@/lib/roles/types";

/**
 * Get list of available roles
 */
export const getRoles = async (): Promise<GetRolesResponse> => {
  return await fetcher<GetRolesResponse>("/roles", "GET");
};
