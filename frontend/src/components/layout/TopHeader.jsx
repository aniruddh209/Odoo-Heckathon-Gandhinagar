import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Menu,
  Search,
  Plus,
  ChevronRight,
  Database,
  LogOut,
  User as UserIcon,
  Shield,
  Activity,
  Bell,
  RotateCw,
  ExternalLink,
  FileText,
  Kanban,
  XSquare,
} from 'lucide-react';
import { Button } from '../ui';

export const TopHeader = ({ onOpenMobile }) => {
  const { user, isSalesRep, isSalesManager, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Determine path breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const getBreadcrumbTitle = (part) => {
    switch (part) {
      case 'workspace': return 'Workspace';
      case 'quotations': return 'Quotations';
      case 'pipeline': return 'Pipeline';
      case 'customers': return 'Customers';
      case 'approvals': return 'Approvals Desk';
      case 'deal-health': return 'Deal Health';
      case 'fulfillment': return 'Fulfillment';
      case 'billing': return 'Billing & Invoices';
      case 'reports': return 'Reports';
      case 'admin': return 'Administration';
      case 'products': return 'Catalog';
      case 'pricing': return 'Price Lists';
      case 'discounts': return 'Discount Matrix';
      case 'warehouses': return 'Warehouses & Stock';
      case 'subscriptions': return 'Subscription Plans';
      case 'users': return 'Users & Team';
      case 'dashboard': return 'Dashboard';
      case 'new': return 'New Quote';
      default: return part.startsWith('QT-') || !isNaN(part) ? `#${part}` : part;
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/workspace/quotations?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Admin':
        return { label: 'Administrator', bg: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'SalesManager':
        return { label: 'Sales Manager', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' };
      case 'FinanceOperations':
        return { label: 'Finance & Ops', bg: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'SalesRep':
        return { label: 'Sales Rep', bg: 'bg-blue-50 text-blue-700 border-blue-200' };
      default:
        return { label: role || 'Staff', bg: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
  };

  const roleInfo = getRoleBadge(user?.role);

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          aria-label="Open sidebar menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 font-medium truncate">
          <Link to="/dashboard" className="text-slate-400 hover:text-slate-700 transition-colors">
            DealFlow360
          </Link>
          {pathParts.map((part, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />
              <span className={idx === pathParts.length - 1 ? 'text-slate-900 font-semibold truncate' : 'text-slate-500 truncate'}>
                {getBreadcrumbTitle(part)}
              </span>
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Center: Global Search Bar */}
      <div className="hidden md:flex items-center max-w-sm w-full mx-4">
        <form onSubmit={handleSearchSubmit} className="w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Quick search quotes, customers, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs rounded-lg border border-slate-200 bg-slate-50/75 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </form>
      </div>

      {/* Right: Section 4 B1 Top Menu Actions, Role Badge, Quick Action, Profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Section 4 B1 Workspace Top Menu */}
        <div className="hidden lg:flex items-center gap-1 border-r border-slate-200 pr-2 sm:pr-3">
          <Link
            to="/workspace/quotations"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${location.pathname.includes('/quotations') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Quotations</span>
          </Link>
          <Link
            to="/workspace/pipeline"
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${location.pathname.includes('/pipeline') ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Pipeline</span>
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            title="Reload Workspace Data"
            className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Reload</span>
          </button>
          {(isAdmin || isSalesManager) && (
            <Link
              to="/admin/products"
              title="Go to Back-end Configuration"
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Back-end</span>
            </Link>
          )}
          <button
            type="button"
            onClick={() => logout()}
            title="Close Workspace / Log Out"
            className="px-2 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 transition-colors flex items-center gap-1"
          >
            <XSquare className="w-3.5 h-3.5" />
            <span>Close</span>
          </button>
        </div>

        {/* Engine Status */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200/80 text-[11px] font-mono text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>MSSQL Live</span>
        </div>

        {/* Role Pill - Prominently Displayed */}
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs ${roleInfo.bg}`}>
          {roleInfo.label}
        </span>

        {/* Quick New Quote Action */}
        {(isSalesRep || isSalesManager || isAdmin) && (
          <Button
            variant="primary"
            size="xs"
            icon={Plus}
            onClick={() => navigate('/workspace/quotations/new')}
            className="hidden sm:inline-flex h-8 shadow-xs font-semibold"
          >
            New Quote
          </Button>
        )}

        {/* User Profile Popover Trigger */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
            aria-label="User profile menu"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.fullName?.slice(0, 1) || 'U'}
            </div>
          </button>

          {/* User Popover Menu */}
          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg z-50 p-2 space-y-2">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {user?.fullName || 'User'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                    {user?.email || 'user@dealflow360.io'}
                  </p>
                  <div className="mt-2">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${roleInfo.bg}`}>
                      {roleInfo.label}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/dashboard');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                  >
                    <Activity className="w-4 h-4 text-slate-400" />
                    <span>My Dashboard</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
