import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  LayoutDashboard,
  FileText,
  GitPullRequest,
  CheckSquare,
  Truck,
  CreditCard,
  Activity,
  BarChart3,
  Users,
  Settings,
  Package,
  Layers,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Shield,
  Zap,
  Sparkles,
} from 'lucide-react';

export const AppLayout = () => {
  const { user, role, isSalesRep, isSalesManager, isFinance, isAdmin, logout, login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switchingRole, setSwitchingRole] = useState(false);

  // Quick switch for reviewers
  const handleQuickRoleSwitch = async (targetRole) => {
    if (user?.role === targetRole) return;
    setSwitchingRole(true);
    const credentials = {
      SalesRep: { email: 'rep@dealflow360.io', password: 'Rep@123' },
      SalesManager: { email: 'manager@dealflow360.io', password: 'Manager@123' },
      FinanceOperations: { email: 'finance@dealflow360.io', password: 'Finance@123' },
      Admin: { email: 'admin@dealflow360.io', password: 'Admin@123' },
    };

    try {
      const creds = credentials[targetRole];
      if (creds) {
        await login(creds);
        toast.success('Role Switched', `Now logged in as ${targetRole}`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error('Switch Failed', err.message);
    } finally {
      setSwitchingRole(false);
    }
  };

  const navItems = [
    // Core Sales
    {
      group: 'Core Operations',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, visible: true },
        { label: 'Quotations & Deals', path: '/workspace/quotations', icon: FileText, visible: isSalesRep || isSalesManager || isAdmin },
        { label: 'CRM Pipeline', path: '/workspace/pipeline', icon: GitPullRequest, visible: isSalesRep || isSalesManager || isAdmin },
        { label: 'Customers', path: '/workspace/customers', icon: Users, visible: isSalesRep || isSalesManager || isAdmin },
      ],
    },
    // Governance & Approvals
    {
      group: 'Governance & Health',
      visible: isSalesManager || isFinance || isAdmin,
      items: [
        { label: 'Approvals Desk', path: '/workspace/approvals', icon: CheckSquare, visible: isSalesManager || isFinance || isAdmin },
        { label: 'Deal Health Radar', path: '/workspace/deal-health', icon: Activity, visible: isSalesManager || isAdmin },
      ],
    },
    // Operations & Revenue
    {
      group: 'Fulfillment & Billing',
      visible: isFinance || isAdmin || isSalesManager,
      items: [
        { label: 'Warehouse Allocation', path: '/workspace/fulfillment', icon: Truck, visible: isFinance || isAdmin },
        { label: 'Hybrid Billing & Invoices', path: '/workspace/billing', icon: CreditCard, visible: isFinance || isAdmin || isSalesManager },
      ],
    },
    // Intelligence & Reports
    {
      group: 'Analytics',
      visible: isSalesManager || isFinance || isAdmin,
      items: [
        { label: 'Sales Reports', path: '/workspace/reports', icon: BarChart3, visible: isSalesManager || isFinance || isAdmin },
      ],
    },
    // Administration
    {
      group: 'Master Setup',
      visible: isAdmin,
      items: [
        { label: 'Products & Price Lists', path: '/admin/products', icon: Package, visible: isAdmin },
        { label: 'Discount Matrix', path: '/admin/discounts', icon: Layers, visible: isAdmin },
        { label: 'Approval Chains', path: '/admin/approvals', icon: Shield, visible: isAdmin },
        { label: 'Warehouses & Stock', path: '/admin/warehouses', icon: Truck, visible: isAdmin },
        { label: 'Subscription Plans', path: '/admin/subscriptions', icon: Settings, visible: isAdmin },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-200 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold shadow-md shadow-blue-600/30">
            <Zap className="w-4 h-4 fill-white text-white" />
          </div>
          <div>
            <span className="font-bold text-base text-white tracking-tight">DealFlow<span className="text-blue-400">360</span></span>
            <span className="block text-[10px] uppercase font-semibold tracking-wider text-slate-400">Sales Operations</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navItems.map((group, gIdx) => {
          if (group.visible === false) return null;
          const visibleItems = group.items.filter((item) => item.visible);
          if (visibleItems.length === 0) return null;

          return (
            <div key={group.group || gIdx}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.group}
              </div>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={({ isActive }) => `
                        flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150
                        ${isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-2">
          <div className="min-w-0 pr-2">
            <p className="text-xs font-semibold text-white truncate">{user?.fullName || 'User'}</p>
            <p className="text-[11px] text-blue-400 truncate font-mono">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Log Out"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 z-30 border-r border-slate-800 shadow-xl">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative w-64 max-w-xs h-full z-10">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
              <span>DealFlow360</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 capitalize">
                {location.pathname.split('/')[2] || location.pathname.split('/')[1] || 'Dashboard'}
              </span>
            </div>
          </div>

          {/* Quick Role Switcher Bar */}
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex text-[11px] font-semibold text-slate-500 uppercase tracking-wider items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" /> Demo Role:
            </span>
            <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              {[
                { r: 'SalesRep', label: 'Rep' },
                { r: 'SalesManager', label: 'Manager' },
                { r: 'FinanceOperations', label: 'Finance' },
                { r: 'Admin', label: 'Admin' },
              ].map(({ r, label }) => (
                <button
                  key={r}
                  type="button"
                  disabled={switchingRole}
                  onClick={() => handleQuickRoleSwitch(r)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    user?.role === r
                      ? 'bg-white text-blue-700 shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
