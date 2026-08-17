// Role type mapping
export type Role = "admin" | "agent" | "marketing";
export type ProfileStatus = "online" | "offline" | "away" | "busy";

// API response interface (from /users/profile endpoint)
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  profilePic?: string;
  phone?: string;
  status: ProfileStatus;
  manualStatus: boolean;
  active: boolean;
  monthlyTarget: number;
  roleId: string;
  passwordChangedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  profile: UserProfile;
}

// Backward-compatible Profile interface (matches old Supabase schema)
export interface Profile {
  id: string;
  email: string;
  full_name: string;
  full_name_ar?: string;
  role: Role;
  avatar_url?: string;
  phone?: string;
  is_active: boolean;
  monthly_target: number;
  created_at: string;
  updated_at: string;
}

// Update profile request payload
export interface UpdateProfilePayload {
  name?: string;
  profilePic?: string;
  phone?: string;
  status?: ProfileStatus;
  manualStatus?: boolean;
}

export interface ProfilePictureResponse {
  url: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}