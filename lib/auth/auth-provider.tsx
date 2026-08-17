"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  refreshToken as apiRefreshToken,
} from "@/services/authService";

import {
  LoginRequest,
  RegisterRequest,
  LogoutRequest,
  RefreshRequest,
} from "./types";

import { getProfile } from "@/services/profileService";

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  isHydrated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: (data: LogoutRequest) => Promise<void>;
  refresh: (data: RefreshRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const storedAccessToken = localStorage.getItem("accessToken");
    const storedRefreshToken = localStorage.getItem("refreshToken");

    setAccessToken(storedAccessToken);
    setRefreshToken(storedRefreshToken);
    setIsHydrated(true);
  }, []);

  const login = async (data: LoginRequest) => {
    const loginResponse = await apiLogin(data);

    setAccessToken(loginResponse.accessToken);
    setRefreshToken(loginResponse.refreshToken);

    localStorage.setItem("accessToken", loginResponse.accessToken);

    localStorage.setItem("refreshToken", loginResponse.refreshToken);

    const profileResponse = await getProfile();
    const profile = profileResponse.profile;

    if (profile.active === false) {
      throw new Error(
        "Your account has been deactivated. Please contact IT support.",
      );
    }
  };

  const register = async (data: RegisterRequest) => {
    const response = await apiRegister(data);

    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);

    localStorage.setItem("accessToken", response.accessToken);

    localStorage.setItem("refreshToken", response.refreshToken);
  };

  const logout = async (data: LogoutRequest) => {
    await apiLogout(data);

    setAccessToken(null);
    setRefreshToken(null);

    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  };

  const refresh = async (data: RefreshRequest) => {
    const response = await apiRefreshToken(data);

    setAccessToken(response.accessToken);
    setRefreshToken(response.refreshToken);

    localStorage.setItem("accessToken", response.accessToken);

    localStorage.setItem("refreshToken", response.refreshToken);
  };

  return (
    <AuthContext.Provider
      value={{
        accessToken,
        refreshToken,
        isHydrated,
        login,
        register,
        logout,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
