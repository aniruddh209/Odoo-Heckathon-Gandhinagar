import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/api/authApi';
import { portalApi } from '@/api/portalApi';
import type { LoginRequest, Role, SignupRequest, UserDto } from '@/types/auth';

interface AuthContextType {
  user: UserDto | null;
  token: string | null;
  portalToken: string | null;
  portalCustomerName: string | null;
  isAuthenticated: boolean;
  isPortalAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  portalLogin: (email: string, magicLinkToken?: string) => Promise<void>;
  portalLogout: () => void;
  hasRole: (roles: Role | Role[]) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(() => {
    const cached = localStorage.getItem('dealflow_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('dealflow_jwt_token'));
  const [portalToken, setPortalToken] = useState<string | null>(() => localStorage.getItem('dealflow_portal_token'));
  const [portalCustomerName, setPortalCustomerName] = useState<string | null>(() =>
    localStorage.getItem('dealflow_portal_customer_name')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize and check current user if token exists
  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const me = await authApi.me();
          setUser(me);
          localStorage.setItem('dealflow_user', JSON.stringify(me));
        } catch {
          // If token verification fails, clear internal token
          localStorage.removeItem('dealflow_jwt_token');
          localStorage.removeItem('dealflow_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen for auth expired event dispatched by apiClient
    const handleExpired = () => {
      setToken(null);
      setUser(null);
    };
    window.addEventListener('dealflow_auth_expired', handleExpired);
    return () => window.removeEventListener('dealflow_auth_expired', handleExpired);
  }, [token]);

  const login = async (data: LoginRequest) => {
    const res = await authApi.login(data);
    localStorage.setItem('dealflow_jwt_token', res.token);
    localStorage.setItem('dealflow_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const signup = async (data: SignupRequest) => {
    const res = await authApi.signup(data);
    localStorage.setItem('dealflow_jwt_token', res.token);
    localStorage.setItem('dealflow_user', JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    try {
      if (token) {
        await authApi.logout();
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('dealflow_jwt_token');
      localStorage.removeItem('dealflow_user');
      setToken(null);
      setUser(null);
    }
  };

  const portalLogin = async (email: string, magicLinkToken?: string) => {
    const res = await portalApi.login({ email, magicLinkToken });
    localStorage.setItem('dealflow_portal_token', res.token);
    localStorage.setItem('dealflow_portal_customer_name', res.customerName);
    setPortalToken(res.token);
    setPortalCustomerName(res.customerName);
  };

  const portalLogout = () => {
    localStorage.removeItem('dealflow_portal_token');
    localStorage.removeItem('dealflow_portal_customer_name');
    setPortalToken(null);
    setPortalCustomerName(null);
  };

  const hasRole = (roles: Role | Role[]): boolean => {
    if (!user) return false;
    if (user.role === 'Admin') return true; // Admin has super-access
    const allowed = Array.isArray(roles) ? roles : [roles];
    return allowed.includes(user.role);
  };

  const refreshUser = async () => {
    if (token) {
      const me = await authApi.me();
      setUser(me);
      localStorage.setItem('dealflow_user', JSON.stringify(me));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        portalToken,
        portalCustomerName,
        isAuthenticated: !!token && !!user,
        isPortalAuthenticated: !!portalToken,
        isLoading,
        login,
        signup,
        logout,
        portalLogin,
        portalLogout,
        hasRole,
        refreshUser,
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
