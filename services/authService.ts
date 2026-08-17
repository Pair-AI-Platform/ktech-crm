
import { fetcher } from "@/lib/api/fetcher";
import {
  LoginRequest,
  LoginResponse,
  LogoutRequest,
  RefreshRequest,
  RefreshResponse,
  RegisterRequest,
  RegisterResponse,
} from "@/lib/auth/types";

export const login = async (
  payload: LoginRequest,
): Promise<LoginResponse> => {
  return await fetcher<LoginResponse>("/auth/login", "POST", payload);
};

export const register = async (
  payload: RegisterRequest,
): Promise<RegisterResponse> => {
  return await fetcher<RegisterResponse>("/auth/register", "POST", payload);
};

export const logout = async (payload: LogoutRequest): Promise<void> => {
  await fetcher<void>("/auth/logout", "POST", payload);
};

export const refreshToken = async (
  payload: RefreshRequest,
): Promise<RefreshResponse> => {
  return await fetcher<RefreshResponse>("/auth/refresh", "POST", payload);
};
