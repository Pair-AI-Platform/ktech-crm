import { fetcher } from "@/lib/api/fetcher";
import {
  CreateInvitationRequest,
  AcceptInvitationRequest,
  InvitationResponse,
  AcceptInvitationResponse,
  GetInvitationByTokenResponse,
} from "@/lib/invitations/types";

/**
 * Send team invitation email
 */
export const sendInvitation = async (
  data: CreateInvitationRequest,
): Promise<InvitationResponse> => {
  return await fetcher<InvitationResponse>("/invitations", "POST", data);
};

/**
 * Accept invitation with token and password
 */
export const acceptInvitation = async (
  data: AcceptInvitationRequest,
): Promise<AcceptInvitationResponse> => {
  return await fetcher<AcceptInvitationResponse>(
    "/invitations/accept",
    "POST",
    data,
  );
};

/**
 * Get invitation details by token
 */
export const getInvitationByToken = async (
  token: string,
): Promise<GetInvitationByTokenResponse> => {
  return await fetcher<GetInvitationByTokenResponse>(
    `/invitations/${token}`,
    "GET",
  );
};
