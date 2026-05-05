import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { getMe, login, logout, signup } from '../services/api';
import type { AuthState } from '../types';
import { useSessionStatus } from './useSessionStatus';

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => void;
  signup: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });

  const fetchUser = useCallback(async () => {
    try {
      const response = await getMe();
      if (response.success && response.data) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: response.data,
          error: null,
        });
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      }
    } catch {
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  // Handle session invalidation from polling
  const handleSessionInvalid = useCallback(() => {
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
    });
    window.location.href = '/';
  }, []);

  // Poll session status when authenticated
  useSessionStatus({
    enabled: state.isAuthenticated,
    onInvalid: handleSessionInvalid,
  });

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
    signup,
    refreshUser: fetchUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
