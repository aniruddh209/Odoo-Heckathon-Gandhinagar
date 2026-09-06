import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { LogOut, ShieldCheck } from 'lucide-react';

export const PortalLayout = () => {
  const { portalCustomerName, portalLogout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    portalLogout();
    navigate('/portal/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Customer Portal Clean White-Labeled Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between min-h-16 py-2.5 px-4 sm:px-6 bg-white border-b border-slate-200 shadow-xs flex-wrap sm:flex-nowrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-xs shadow-blue-500/20 shrink-0">
            D
          </div>
          <div>
            <span className="font-bold text-base text-slate-900 tracking-tight">DealFlow360</span>
            <span className="ml-2 text-xs font-medium text-slate-500 hidden xs:inline">Customer Negotiation Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-100 py-1 px-3 rounded-full">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Client Portal</span>
            {portalCustomerName && (
              <span className="font-semibold text-slate-900 pl-1 border-l border-slate-200">
                {portalCustomerName}
              </span>
            )}
          </div>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Portal</span>
          </button>
        </div>
      </header>

      <main className="flex-1 p-3 sm:p-6 md:p-8 max-w-5xl mx-auto w-full">
        <Outlet />
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200">
        &copy; {new Date().getFullYear()} DealFlow360. All commercial proposals subject to final binding agreement.
      </footer>
    </div>
  );
};
