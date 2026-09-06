import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.js';
import { LogOut, RefreshCw, Shield, User as UserIcon } from 'lucide-react';
import { Badge } from '../common/Badge.jsx';

export const TopNav = () => {
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleReload = () => {
    setIsRefreshing(true);
    window.dispatchEvent(new Event('dealflow_refresh'));
    setTimeout(() => setIsRefreshing(false), 600);
  };

  const roleBadgeVariant = {
    Admin: 'purple',
    SalesManager: 'primary',
    SalesRep: 'default',
    FinanceOperations: 'warning',
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white border-b border-slate-200 shadow-xs">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
          D
        </div>
        <div>
          <span className="font-bold text-base text-slate-900 tracking-tight">DealFlow360</span>
          <span className="ml-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            Ops Engine
          </span>
        </div>
      </div>

      {/* Global Actions & User Profile */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleReload}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          title="Reload system data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          <span>Reload Data</span>
        </button>

        {user && (
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900">{user.fullName || user.FullName}</div>
                <div className="text-[11px] text-slate-500">{user.email || user.Email}</div>
              </div>
            </div>

            <Badge variant={roleBadgeVariant[user.role] || 'default'} size="sm">
              <Shield className="w-3 h-3 mr-1" />
              {user.role}
            </Badge>

            <button
              onClick={() => logout()}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1 cursor-pointer"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
