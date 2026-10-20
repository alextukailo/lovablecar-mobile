
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

import {
    deleteSessionToken,
    getSessionToken,
} from '@/features/auth/model/sessionStorage';

export type AuthUser = {
  id: string;
  telegramUserId: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  photoUrl: string | null;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext =
  createContext<AuthContextType | null>(null);

const API_URL = process.env.EXPO_PUBLIC_API_URL;

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] =
    useState<AuthUser | null>(null);

  const [loading, setLoading] =
    useState(true);

  const refreshSession = useCallback(async () => {
    const token = await getSessionToken();

    if (!token) {
      setUser(null);
      return;
    }

    if (!API_URL) {
      throw new Error(
        'EXPO_PUBLIC_API_URL is not configured',
      );
    }

    let response: Response;

    try {
      response = await fetch(
        `${API_URL}/auth/me`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    } catch {
      // Keep the token if the network is temporarily
      // unavailable. Do not silently log the user out.
      throw new Error(
        'Unable to verify your session. Check your connection.',
      );
    }

    if (
      response.status === 401 ||
      response.status === 403
    ) {
      await deleteSessionToken();
      setUser(null);

      throw new Error(
        'Your session is invalid or expired',
      );
    }

    if (!response.ok) {
      throw new Error(
        `Session verification failed (${response.status})`,
      );
    }

    const data =
      (await response.json()) as AuthUser;

    if (
      !data ||
      typeof data.id !== 'string'
    ) {
      throw new Error(
        'Invalid user profile response',
      );
    }

    setUser(data);
  }, []);

  const logout = useCallback(async () => {
    const token = await getSessionToken();

    try {
      if (token && API_URL) {
        await fetch(
          `${API_URL}/auth/logout`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        );
      }
    } finally {
      await deleteSessionToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      try {
        await refreshSession();
      } catch (error) {
        console.warn(
          'Initial session verification failed:',
          error,
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void initialize();

    return () => {
      active = false;
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      user,
      loading,
      refreshSession,
      logout,
    }),
    [
      user,
      loading,
      refreshSession,
      logout,
    ],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      'useAuth must be used inside AuthProvider',
    );
  }

  return context;
}
