import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, AuthResponse } from '../types';
import { authApi } from '../api/auth';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: { email: string; password: string; full_name: string; phone?: string; role?: string }) => Promise<void>;
  logout: () => void;
  updateCurrentUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('parentcare_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('parentcare_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const savedToken = localStorage.getItem('parentcare_token');
      if (savedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
          localStorage.setItem('parentcare_user', JSON.stringify(me));
        } catch {
          logout();
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const handleAuthSuccess = (data: AuthResponse) => {
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('parentcare_token', data.access_token);
    localStorage.setItem('parentcare_user', JSON.stringify(data.user));
  };

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    handleAuthSuccess(data);
  };

  const register = async (regData: { email: string; password: string; full_name: string; phone?: string; role?: string }) => {
    const data = await authApi.register(regData);
    handleAuthSuccess(data);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('parentcare_token');
    localStorage.removeItem('parentcare_user');
  };

  const updateCurrentUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('parentcare_user', JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        updateCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
