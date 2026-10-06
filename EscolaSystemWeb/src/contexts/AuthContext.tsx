import React, { useState, useEffect } from 'react';
import type { ApiSessionUser, User, UserRole } from '../types';
import { authApi, api } from '../services/api';
import { AuthContext } from './auth';



export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // A API manda o perfil como "Teacher"; a sessão usa os valores de UserRole ("teacher")
  const normalizeUser = (raw: ApiSessionUser): User => ({
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role.toLowerCase() as UserRole,
    schoolId: raw.schoolId ?? undefined,
    phone: raw.phone ?? undefined,
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          api.setToken(token);
          const userData = await authApi.me();
          setUser(normalizeUser(userData));
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          localStorage.removeItem('token');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    try {
      const response = await authApi.login(email, password);
      api.setToken(response.token);
      const user = normalizeUser(response.user);
      setUser(user);
      return user.role;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    // Revoga o token na API; sem rede (ou token já expirado) a saída local acontece mesmo assim
    try {
      if (api.getToken()) await authApi.logout();
    } catch {
      /* a sessão local é encerrada abaixo de qualquer forma */
    } finally {
      api.clearToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
