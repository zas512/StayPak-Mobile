import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, AuthTokens } from '@/types';
import { authApi, setAuthTokens, clearAuthTokens, getAccessToken } from '@/services/api';
import * as SecureStore from 'expo-secure-store';

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; fullName: string; phoneNumber: string; role?: string }) => Promise<void>;
  googleLogin: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [tokens, setTokens] = useState<AuthTokens | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!tokens;

  // Initialize auth state on app start
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      const accessToken = await getAccessToken();
      if (accessToken) {
        // Try to get user profile
        const response = await authApi.me();
        if (response.data.success && response.data.data) {
          setUser(response.data.data);
          // Tokens are already in secure store
        }
      }
    } catch (error) {
      // Token might be expired, clear it
      await clearAuthTokens();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    if (response.data.success && response.data.data) {
      const { user: userData, tokens: tokenData } = response.data.data;
      setUser(userData);
      setTokens(tokenData);
      await setAuthTokens(tokenData);
    } else {
      throw new Error(response.data.message || 'Login failed');
    }
  };

  const register = async (data: { email: string; password: string; fullName: string; phoneNumber: string; role?: string }) => {
    const response = await authApi.register(data);
    if (response.data.success && response.data.data) {
      const { user: userData, tokens: tokenData } = response.data.data;
      setUser(userData);
      setTokens(tokenData);
      await setAuthTokens(tokenData);
    } else {
      throw new Error(response.data.message || 'Registration failed');
    }
  };

  const googleLogin = async (idToken: string) => {
    const response = await authApi.googleAuth(idToken);
    if (response.data.success && response.data.data) {
      const { user: userData, tokens: tokenData } = response.data.data;
      setUser(userData);
      setTokens(tokenData);
      await setAuthTokens(tokenData);
    } else {
      throw new Error(response.data.message || 'Google login failed');
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore logout API errors
    } finally {
      setUser(null);
      setTokens(null);
      await clearAuthTokens();
    }
  };

  const updateUser = useCallback((userData: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : null));
  }, []);

  const refreshUser = async () => {
    try {
      const response = await authApi.me();
      if (response.data.success && response.data.data) {
        setUser(response.data.data);
      }
    } catch (error) {
      // Handle error silently or logout
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isLoading,
        isAuthenticated,
        login,
        register,
        googleLogin,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};