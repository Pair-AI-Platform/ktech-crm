/**
 * Invitations types for the CRM application
 */

// Invitation status types
export type InvitationStatus = "pending" | "accepted" | "expired" | "revoked";

// Invitation entity
export interface Invitation {
  id: string;
  email: string;
  name: string;
  roleId: string;
  monthlyTarget: number;
  status: InvitationStatus;
  expiresAt: string;
  createdAt: string;
}

// Request types
export interface CreateInvitationRequest {
  email: string;
  name: string;
  roleId: string;
  monthlyTarget: number;
}

export interface AcceptInvitationRequest {
  token: string;
  password: string;
}

// Response types
export interface InvitationResponse {
  invitation: Invitation;
}

export interface AcceptInvitationResponse {
  accessToken: string;
  refreshToken: string;
  isFirstLogin: boolean;
}

export interface GetInvitationByTokenResponse {
  invitation: Invitation;
}

// Error response type
export interface InvitationErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
