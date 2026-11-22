import React, { createContext, useContext, useState, useEffect } from "react";
import { User, LoginInput, SignupInput } from "./types";
import {
  loginApi,
  signupApi,
  logoutApi,
  fetchMeApi,
  refreshApi,
  getAccessToken,
  setAccessToken,
  setOnAuthFailure,
} from "./api";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  signup: (data: SignupInput) => Promise<void>;
  logout: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize onAuthFailure to clear user state
  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null);
    });
  }, []);

  // Restore session on initial page load
  useEffect(() => {
    async function initAuth() {
      const existingToken = getAccessToken();
      if (existingToken) {
        try {
          const profile = await fetchMeApi();
          setUser(profile);
          setLoading(false);
          return;
        } catch {
          // Token might be expired; attempt refresh
        }
      }

      // Try silent refresh using the HttpOnly cookie
      try {
        await refreshApi();
        const profile = await fetchMeApi();
        setUser(profile);
      } catch {
        setUser(null);
        setAccessToken(null);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const login = async (credentials: LoginInput) => {
    const res = await loginApi(credentials);
    setUser(res.user);
  };

  const signup = async (data: SignupInput) => {
    await signupApi(data);
    // Automatically log in after registration
    await login({ email: data.email, password: data.password });
  };

  const logout = async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    isAdmin: user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
