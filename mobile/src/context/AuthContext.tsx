import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import authService, { RegisterPayload } from '../services/auth.service';
import { User } from '../types';
import { syncPushSubscription, removePushSubscription } from '../services/push.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  googleLogin: (credential: string, role?: 'buyer' | 'seller') => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load stored auth on mount
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('token');
        if (storedToken) {
          setToken(storedToken);
          const response = await authService.getMe();
          setUser(response.data.user);
        }
      } catch {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } finally {
        setIsLoading(false);
      }
    };
    loadAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    const { user: newUser, token: newToken } = response.data;
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    await syncPushSubscription();
  }, []);

  const googleLogin = useCallback(async (credential: string, role: 'buyer' | 'seller' = 'buyer') => {
    const response = await authService.googleLogin(credential, role);
    const { user: newUser, token: newToken } = response.data;
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    await syncPushSubscription();
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    const response = await authService.register(data);
    const { user: newUser, token: newToken } = response.data;
    await SecureStore.setItemAsync('token', newToken);
    await SecureStore.setItemAsync('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    await syncPushSubscription();
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {}
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('user');
    await removePushSubscription();
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.user);
    } catch {}
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    syncPushSubscription();
  }, [isAuthenticated, user?._id]);

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAuthenticated, login, googleLogin, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
