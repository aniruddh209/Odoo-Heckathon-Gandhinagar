import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { getStoredToken, getStoredUser, clearStoredAuth } from '../api/apiClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      if (storedToken) {
        try {
          const me = await authApi.getMe();
          setUser(me);
        } catch {
          clearStoredAuth();
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();

    const handleUnauthorized = () => {
      clearStoredAuth();
      setToken(null);
      setUser(null);
      navigate('/login', { replace: true, state: null });
    };

    window.addEventListener('dealflow:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('dealflow:unauthorized', handleUnauthorized);
  }, [navigate]);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    setToken(res.accessToken);
    setUser(res.user);
    return res;
  };

  const signup = async (userData) => {
    const res = await authApi.signup(userData);
    setToken(res.accessToken);
    setUser(res.user);
    return res;
  };

  const logout = () => {
    authApi.logout();
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true, state: null });
  };

  const role = user?.role || null;

  const roleFlags = useMemo(() => ({
    isSalesRep: role === 'SalesRep' || role === 'Admin',
    isSalesManager: role === 'SalesManager' || role === 'Admin',
    isFinance: role === 'FinanceOperations' || role === 'Admin',
    isAdmin: role === 'Admin',
    isCustomer: role === 'Customer',
  }), [role]);

  const hasRole = (roles) => {
    if (!role) return false;
    const allowed = Array.isArray(roles) ? roles : [roles];
    // Strict isolation: if a route/feature is specifically for Customer, non-customers (even Admin) do not have this role
    if (allowed.length === 1 && allowed[0] === 'Customer') {
      return role === 'Customer';
    }
    // Admin has superuser access to internal enterprise staff workspaces
    if (role === 'Admin') return true;
    return allowed.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        role,
        ...roleFlags,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
        hasRole,
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

export default AuthProvider;
