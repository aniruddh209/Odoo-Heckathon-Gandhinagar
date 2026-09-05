import React, { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi.js';
import { portalApi } from '../api/portalApi.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem('dealflow_user');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('dealflow_jwt_token'));
  const [portalToken, setPortalToken] = useState(() => localStorage.getItem('dealflow_portal_token'));
  const [portalCustomerName, setPortalCustomerName] = useState(() =>
    localStorage.getItem('dealflow_portal_customer_name')
  );
  const [isLoading, setIsLoading] = useState(true);

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

  const login = async (data) => {
    const res = await authApi.login(data);
    const jwt = res.accessToken || res.token;
    localStorage.setItem('dealflow_jwt_token', jwt);
    localStorage.setItem('dealflow_user', JSON.stringify(res.user));
    setToken(jwt);
    setUser(res.user);
    return res.user;
  };

  const signup = async (data) => {
    const res = await authApi.signup(data);
    const jwt = res.accessToken || res.token;
    localStorage.setItem('dealflow_jwt_token', jwt);
    localStorage.setItem('dealflow_user', JSON.stringify(res.user));
    setToken(jwt);
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

  const portalLogin = async (email, magicLinkToken) => {
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

  const hasRole = (roles) => {
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
        isPortalAuthenticated: !!portalToken || (!!token && user?.role === 'Customer'),
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
