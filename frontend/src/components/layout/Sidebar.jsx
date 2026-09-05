import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  FileText,
  GitPullRequest,
  Users,
  CheckSquare,
  Activity,
  UserCheck,
  Truck,
  CreditCard,
  BarChart3,
  Package,
  Layers,
  Shield,
  Settings,
  Zap,
  LogOut,
  X,
} from 'lucide-react';

export const Sidebar = ({ onCloseMobile, isMobile = false }) => {
  const { user, isSalesRep, isSalesManager, isFinance, isAdmin, logout } = useAuth();

  const navigationGroups = [
    {
      group: 'Workspace',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, visible: true },
        { label: 'Quotations & Deals', path: '/workspace/quotations', icon: FileText, visible: isSalesRep || isSalesManager || isAdmin },
        { label: 'Pipeline Kanban', path: '/workspace/pipeline', icon: GitPullRequest, visible: isSalesRep || isSalesManager || isAdmin },
        { label: 'Customers 360', path: '/workspace/customers', icon: Users, visible: isSalesRep || isSalesManager || isAdmin },
      ],
    },
    {
      group: 'Operations & Governance',
      visible: isSalesManager || isFinance || isAdmin,
      items: [
        { label: 'Approvals Desk', path: '/workspace/approvals', icon: CheckSquare, visible: isSalesManager || isFinance || isAdmin },
        { label: 'Deal Health Radar', path: '/workspace/deal-health', icon: Activity, visible: isSalesManager || isAdmin },
        { label: 'Warehouse Allocation', path: '/workspace/fulfillment', icon: Truck, visible: isSalesRep || isSalesManager || isFinance || isAdmin },
        { label: 'Billing & Invoices', path: '/workspace/billing', icon: CreditCard, visible: isFinance || isAdmin || isSalesManager },
      ],
    },
    {
      group: 'Analytics',
      visible: isSalesManager || isFinance || isAdmin,
      items: [
        { label: 'Revenue Reports', path: '/workspace/reports', icon: BarChart3, visible: isSalesManager || isFinance || isAdmin },
      ],
    },
    {
      group: 'Administration',
      visible: isAdmin || isSalesManager,
      items: [
        { label: 'Catalog & Pricing', path: '/admin/products', icon: Package, visible: isAdmin },
        { label: 'Discount Matrix', path: '/admin/discounts', icon: Layers, visible: isAdmin || isSalesManager },
        { label: 'Approval Chains', path: '/admin/approvals', icon: Shield, visible: isAdmin || isSalesManager },
        { label: 'Warehouses & Stock', path: '/admin/warehouses', icon: Truck, visible: isAdmin || isFinance },
        { label: 'Subscription Plans', path: '/admin/subscriptions', icon: Settings, visible: isAdmin },
        { label: 'Users & Roles', path: '/workspace/users', icon: UserCheck, visible: isAdmin || isSalesManager },
      ],
    },
  ];

  const getInitials = (name) => {
    if (!name) return 'DF';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'SalesRep': return 'Sales Representative';
      case 'SalesManager': return 'Sales Manager';
      case 'FinanceOperations': return 'Finance & Ops';
      case 'Admin': return 'Platform Administrator';
      case 'Customer': return 'Customer';
      default: return role || 'Staff Member';
    }
  };

  return (
    <aside className="flex flex-col h-full bg-slate-950 text-slate-300 select-none border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800/80 bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black shadow-sm shadow-blue-600/30 ring-1 ring-blue-400/30">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base text-white tracking-tight">
                DealFlow<span className="text-blue-400">360</span>
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-900/50 text-blue-300 border border-blue-700/50">
                PRO
              </span>
            </div>
            <span className="block text-[10px] font-medium text-slate-400 tracking-wide">
              Sales &amp; Revenue Ops
            </span>
          </div>
        </div>

        {isMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto py-5 px-3 space-y-6">
        {navigationGroups.map((group, gIdx) => {
          if (group.visible === false) return null;
          const visibleItems = group.items.filter((item) => item.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group || gIdx}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                {group.group}
              </div>
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group
                        ${
                          isActive
                            ? 'bg-blue-600/15 text-blue-400 font-semibold border-l-2 border-blue-500 shadow-2xs'
                            : 'text-slate-400 hover:bg-slate-900/90 hover:text-slate-200'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Persona & Sign Out Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950">
        <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs">
              {getInitials(user?.fullName)}
            </div>
            <div className="min-w-0 pr-1">
              <p className="text-xs font-semibold text-white truncate leading-tight">
                {user?.fullName || 'User'}
              </p>
              <span className="text-[10px] text-blue-400 block truncate font-medium mt-0.5">
                {getRoleDisplayName(user?.role)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sign out of session"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
