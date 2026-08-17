import { fetcher } from "@/lib/api/fetcher";
import {
  ChangePasswordPayload,
  ProfilePictureResponse,
  ProfileResponse,
  UpdateProfilePayload,
} from "@/lib/profile/types";

export const getProfile = async (): Promise<ProfileResponse> => {
  return fetcher<ProfileResponse>("/users/profile", "GET");
};

export const updateProfile = async (
  payload: UpdateProfilePayload,
): Promise<ProfileResponse> => {
  return fetcher<ProfileResponse>(
    "/users/profile",
    "PATCH",
    payload,
  );
};

export const uploadProfilePicture = async (
  file: File,
): Promise<ProfilePictureResponse> => {
  const formData = new FormData();
  formData.append("file", file);

  return await fetcher<ProfilePictureResponse>(
    "/users/profile-picture",
    "POST",
    formData,
  );
};

export const changePassword = async (
  payload: ChangePasswordPayload,
): Promise<void> => {
  await fetcher<void>("/users/change-password", "POST", payload);
};
