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

export const Sidebar = ({ onCloseMobile, isMobile = false, isCollapsed = false }) => {
  const { user, isSalesRep, isSalesManager, isFinance, isAdmin, logout } = useAuth();

  const navigationGroups = [
    {
      group: 'Workspace',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, visible: true },
        { label: 'Sales Inquiries', path: '/workspace/inquiries', icon: UserCheck, visible: isSalesRep || isSalesManager || isAdmin },
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
    <aside className="flex flex-col h-full bg-white text-slate-700 select-none border-r border-slate-200/80 shadow-xs">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200/80 bg-white shrink-0">
        <div className={`flex items-center gap-3 ${isCollapsed ? 'justify-center w-full' : ''}`}>
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black shadow-xs ring-2 ring-blue-600/10 shrink-0">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          {!isCollapsed && (
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base text-slate-900 tracking-tight">
                  DealFlow<span className="text-blue-600">360</span>
                </span>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/80">
                  PRO
                </span>
              </div>
              <span className="block text-[10px] font-medium text-slate-400 tracking-wide">
                Sales &amp; Revenue Ops
              </span>
            </div>
          )}
        </div>

        {isMobile && !isCollapsed && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
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
              {!isCollapsed && (
                <div className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.group}
                </div>
              )}
              <div className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onCloseMobile}
                      title={isCollapsed ? item.label : undefined}
                      className={({ isActive }) => `
                        flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 group
                        ${
                          isActive
                            ? 'bg-blue-50/80 text-blue-700 font-semibold border-l-2 border-blue-600 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }
                      `}
                    >
                      {({ isActive }) => (
                        <>
                          <Icon className={`w-4 h-4 shrink-0 transition-transform duration-150 group-hover:scale-105 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-600'}`} />
                          {!isCollapsed && <span className="truncate">{item.label}</span>}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Persona & Sign Out Footer */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/50 shrink-0">
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'justify-between p-2.5'} rounded-xl bg-white border border-slate-200/80 shadow-2xs`}>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs" title={isCollapsed ? user?.fullName || 'User' : undefined}>
              {getInitials(user?.fullName)}
            </div>
            {!isCollapsed && (
              <div className="min-w-0 pr-1">
                <p className="text-xs font-semibold text-slate-900 truncate leading-tight">
                  {user?.fullName || 'User'}
                </p>
                <span className="text-[10px] text-slate-500 block truncate font-medium mt-0.5">
                  {getRoleDisplayName(user?.role)}
                </span>
              </div>
            )}
          </div>

          {!isCollapsed && (
            <button
              type="button"
              onClick={logout}
              title="Sign out of session"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
