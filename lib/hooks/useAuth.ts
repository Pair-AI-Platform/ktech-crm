import { useAuth as useAuthContext } from "../auth/auth-provider";

const useAuth = () => {
  const { accessToken, isHydrated, logout: contextLogout } = useAuthContext();

  const logout = async () => {
    await contextLogout({ allSessions: false });
  };

  return {
    isLoggedIn: !!accessToken,
    isHydrated,
    logout,
  };
};

export default useAuth;
