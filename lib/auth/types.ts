export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type RegisterResponse = {
  accessToken: string;
  refreshToken: string;
};

export type RefreshRequest = {
  refreshToken: string;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type LogoutRequest = {
  allSessions: boolean;
};
