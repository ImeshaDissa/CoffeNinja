'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { apiClient, IApiClient } from '@/services/api-client';
import { AuthenticatedUser } from '@/types/inquiry.types';

/**
 * State and actions exposed by the staff Authentication Context.
 */
export interface AuthContextValue {
  readonly user: AuthenticatedUser | null;
  readonly isLoading: boolean;
  readonly login: (email: string, password: string) => Promise<AuthenticatedUser>;
  readonly logout: () => Promise<void>;
  readonly refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  readonly children: React.ReactNode;
  readonly client?: IApiClient;
}

/**
 * Provides authenticated staff session state across the Next.js application.
 *
 * @param props - Children and optional injected API client (for testing).
 * @returns React Context Provider element.
 */
export function AuthProvider({
  children,
  client = apiClient,
}: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Verifies the current httpOnly cookie session against the backend API.
   */
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const currentUser = await client.getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  /**
   * Signs in a staff member and updates the active user state.
   *
   * @param email - Staff email address.
   * @param password - Staff password.
   * @returns AuthenticatedUser object.
   */
  const login = useCallback(
    async (email: string, password: string): Promise<AuthenticatedUser> => {
      const authenticatedUser = await client.login(email, password);
      setUser(authenticatedUser);
      return authenticatedUser;
    },
    [client]
  );

  /**
   * Signs out the current staff member and clears client state.
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await client.logout();
    } finally {
      setUser(null);
    }
  }, [client]);

  const contextValue = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      login,
      logout,
      refreshSession,
    }),
    [user, isLoading, login, logout, refreshSession]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to consume the staff Authentication Context.
 *
 * @returns AuthContextValue with current user and auth actions.
 * @throws Error if called outside an AuthProvider.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }
  return context;
}

