import React, { useState, useEffect } from 'react';
import type { ApiSessionUser, User, UserRole } from '../types';
import { authApi, api, hasSessionCookie } from '../services/api';
import { AuthContext } from './auth';

// A API manda o perfil como "Teacher"; a sessão usa os valores de UserRole ("teacher")
const normalizeUser = (raw: ApiSessionUser): User => ({
  id: raw.id,
  name: raw.name,
  email: raw.email,
  role: raw.role.toLowerCase() as UserRole,
  schoolId: raw.schoolId ?? undefined,
  phone: raw.phone ?? undefined,
});

/**
 * Sessão do usuário. Os tokens ficam em cookies httpOnly da API, fora do alcance do JavaScript:
 * o front só sabe quem está logado perguntando a /auth/me.
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Sessão encerrada no meio do uso (expirou, logout em outra aba, conta desativada): volta para o login
    api.onSessionExpired = () => setUser(null);

    // Ao abrir a página: se os cookies ainda valem (ou o refresh renova), já entra logado.
    // Sem cookie de sessão, nem pergunta (evita duas requisições com erro para quem só visita a home).
    (hasSessionCookie() ? authApi.me() : Promise.reject(new Error('sem sessão')))
      .then(data => setUser(normalizeUser(data)))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));

    return () => {
      api.onSessionExpired = null;
    };
  }, []);

  const login = async (email: string, password: string): Promise<UserRole> => {
    const response = await authApi.login(email, password);
    const sessionUser = normalizeUser(response.user);
    setUser(sessionUser);
    return sessionUser.role;
  };

  const logout = async () => {
    // A API revoga a sessão e apaga os cookies; sem rede, a saída local acontece mesmo assim
    try {
      await authApi.logout();
    } catch {
      /* a sessão local é encerrada abaixo de qualquer forma */
    } finally {
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
