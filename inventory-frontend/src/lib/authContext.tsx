import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  apiGetMe,
  apiLogin,
  apiLogout,
  apiChangePassword,
  type AuthUser,
  type LoginCredentials,
  type ChangePasswordPayload,
} from "./api/auth";

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Check existing session status on initial load
  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await apiGetMe();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const login = async (credentials: LoginCredentials) => {
    const authenticatedUser = await apiLogin(credentials);
    setUser(authenticatedUser);
    return authenticatedUser;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } finally {
      setUser(null);
    }
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    await apiChangePassword(payload);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        logout,
        changePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
