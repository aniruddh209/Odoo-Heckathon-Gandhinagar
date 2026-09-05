import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { LoadingSpinner } from '../common/LoadingSpinner.jsx';
import { AlertCircle } from 'lucide-react';
import { Button } from '../common/Button.jsx';

export const ProtectedRoute = ({
  children,
  allowedRoles,
  forPortal = false,
  isPortalRoute = false,
}) => {
  const { isAuthenticated, isPortalAuthenticated, isLoading, user, hasRole } = useAuth();
  const isPortal = forPortal || isPortalRoute;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingSpinner size="lg" text="Authenticating DealFlow360 session..." />
      </div>
    );
  }

  // Customer Portal Route Protection
  if (isPortal) {
    if (!isPortalAuthenticated) {
      return <Navigate to="/portal/login" replace />;
    }
    return <>{children}</>;
  }

  // Internal Staff Route Protection
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Check Role Permissions
  if (allowedRoles && allowedRoles.length > 0) {
    const isAllowed = allowedRoles.some((r) => hasRole(r));
    if (!isAllowed) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
          <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500 max-w-md mb-6">
            Your current role (<span className="font-semibold text-slate-800">{user.role}</span>) does not
            have permission to view this operational area. Contact your system administrator.
          </p>
          <Button variant="outline" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      );
    }
  }

  return <>{children}</>;
};
