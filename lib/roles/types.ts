/**
 * Roles types for the CRM application
 */

// Role entity
export interface Role {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

// Response types
export interface GetRolesResponse {
  roles: Role[];
}
