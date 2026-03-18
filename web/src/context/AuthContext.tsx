import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService, { RegisterData, UpdateProfileData, ChangePasswordData } from '../services/auth.service';
import { User } from '../types';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  register: (data: Omit<RegisterData, 'supabaseAccessToken'> & { email: string; password: string }) => Promise<void>;
  login: (data: { email: string; password: string }) => Promise<void>;
  googleLogin: (credential: string, role?: 'buyer' | 'seller') => Promise<{ needsProfileCompletion: boolean; isNewUser?: boolean }>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  changePassword: (data: ChangePasswordData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  // Load user on mount if token exists
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await authService.getMe();
          setUser(response.data.user);
        } catch {
          // Token is invalid/expired
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    loadUser();
  }, [token]);

  const register = useCallback(async (data: Omit<RegisterData, 'supabaseAccessToken'> & { email: string; password: string }) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.toLowerCase(),
      password: data.password,
      options: {
        data: {
          name: data.name,
          role: data.role,
        },
      },
    });

    if (error || !authData.session?.access_token) {
      throw new Error(error?.message || 'Registration failed at authentication provider.');
    }

    const response = await authService.register({
      supabaseAccessToken: authData.session.access_token,
      name: data.name,
      phone: data.phone,
      role: data.role,
      studentId: data.studentId,
      location: data.location,
    });
    const { user: newUser, token: newToken } = response.data;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    toast.success('Account created successfully!', { duration: 1400 });
  }, []);

  const login = useCallback(async (data: { email: string; password: string }) => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email.toLowerCase(),
      password: data.password,
    });

    if (error || !authData.session?.access_token) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    const response = await authService.login({ supabaseAccessToken: authData.session.access_token });
    const { user: newUser, token: newToken } = response.data;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    toast.success(`Welcome back, ${newUser.name}!`, { duration: 1200 });
  }, []);

  const googleLogin = useCallback(async (credential: string, role: 'buyer' | 'seller' = 'buyer') => {
    const response = await authService.googleLogin(credential, role);
    const { user: newUser, token: newToken } = response.data;

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    toast.success(`Welcome, ${newUser.name}!`, { duration: 1200 });

    return {
      needsProfileCompletion: !!response.data?.needsProfileCompletion,
      isNewUser: !!response.data?.isNewUser,
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore errors during logout
    }
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore sign out errors
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully', { duration: 900 });
  }, []);

  const updateProfile = useCallback(async (data: UpdateProfileData) => {
    const response = await authService.updateProfile(data);
    const updatedUser = response.data.user;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    toast.success('Profile updated successfully', { duration: 1200 });
  }, []);

  const changePassword = useCallback(async (data: ChangePasswordData) => {
    await authService.changePassword(data);
    toast.success('Password changed successfully', { duration: 1200 });
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.user);
    } catch {
      // Silently fail
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated,
        register,
        login,
        googleLogin,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
