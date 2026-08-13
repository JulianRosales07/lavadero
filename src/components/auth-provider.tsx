'use client';

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { api, tokenStore } from '@/lib/api';
import type { AuthUser } from '@/lib/types';

interface AuthContextValue {
  user: AuthUser | null;
  session: AuthUser | null;
  loading: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
  refresh: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    if (!tokenStore.get()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const { user: me } = await api.get<{ user: AuthUser }>('/api/auth/me');
      setUser(me);
    } catch {
      tokenStore.clear();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = React.useCallback(async (email: string, password: string) => {
    const result = await api.post<{ token: string; user: AuthUser }>('/api/auth/login', {
      email,
      password,
    });
    tokenStore.set(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = React.useCallback(() => {
    tokenStore.clear();
    setUser(null);
    queryClient.clear();
    navigate('/login', { replace: true });
  }, [queryClient, navigate]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      session: user,
      loading,
      isLoading: loading,
      isAdmin: user?.role === 'ADMIN',
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return context;
}
