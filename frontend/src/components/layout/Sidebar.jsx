import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
  Activity,
  BarChart3,
  Box,
  CheckSquare,
  DollarSign,
  FileText,
  Kanban,
  LayoutDashboard,
  Percent,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
} from 'lucide-react';
import { cn } from '../../utils/cn.js';

export const Sidebar = () => {
  const { hasRole } = useAuth();

  const sections = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Sales Workspace',
      items: [
        {
          label: 'Quotations',
          path: '/workspace/quotations',
          icon: <FileText className="w-4 h-4" />,
          roles: ['SalesRep', 'SalesManager', 'Admin'],
        },
        {
          label: 'Pipeline Kanban',
          path: '/workspace/pipeline',
          icon: <Kanban className="w-4 h-4" />,
          roles: ['SalesRep', 'SalesManager', 'Admin'],
        },
        {
          label: 'Customers 360',
          path: '/workspace/customers',
          icon: <Users className="w-4 h-4" />,
          roles: ['SalesRep', 'SalesManager', 'Admin'],
        },
        {
          label: 'Order Fulfillment',
          path: '/workspace/fulfillment',
          icon: <Truck className="w-4 h-4" />,
          roles: ['SalesRep', 'SalesManager', 'FinanceOperations', 'Admin'],
        },
      ],
    },
    {
      title: 'Governance & Operations',
      items: [
        {
          label: 'Approval Queue',
          path: '/workspace/approvals',
          icon: <CheckSquare className="w-4 h-4" />,
          roles: ['SalesManager', 'FinanceOperations', 'Admin'],
        },
        {
          label: 'Deal Health Radar',
          path: '/workspace/deal-health',
          icon: <Activity className="w-4 h-4" />,
          roles: ['SalesManager', 'Admin'],
        },
        {
          label: 'Reports & Export',
          path: '/workspace/reports',
          icon: <BarChart3 className="w-4 h-4" />,
          roles: ['SalesManager', 'FinanceOperations', 'Admin'],
        },
      ],
    },
    {
      title: 'Master Configuration',
      items: [
        {
          label: 'Team & Users',
          path: '/workspace/users',
          icon: <Users className="w-4 h-4" />,
          roles: ['SalesManager', 'Admin'],
        },
        {
          label: 'Products & Variants',
          path: '/admin/products',
          icon: <Box className="w-4 h-4" />,
          roles: ['Admin'],
        },
        {
          label: 'Price Lists',
          path: '/admin/pricing',
          icon: <DollarSign className="w-4 h-4" />,
          roles: ['Admin'],
        },
        {
          label: 'Discount Ceilings',
          path: '/admin/discounts',
          icon: <Percent className="w-4 h-4" />,
          roles: ['Admin', 'SalesManager'],
        },
        {
          label: 'Approval Chains',
          path: '/admin/approvals',
          icon: <ShieldCheck className="w-4 h-4" />,
          roles: ['Admin', 'SalesManager'],
        },
        {
          label: 'Warehouses & Stock',
          path: '/admin/warehouses',
          icon: <Truck className="w-4 h-4" />,
          roles: ['Admin', 'FinanceOperations'],
        },
        {
          label: 'Subscription Plans',
          path: '/admin/subscriptions',
          icon: <RefreshCw className="w-4 h-4" />,
          roles: ['Admin'],
        },
      ],
    },
  ];


  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-[calc(100vh-4rem)]">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {sections.map((section) => {
          // Filter items based on current role
          const visibleItems = section.items.filter((item) => {
            if (!item.roles) return true;
            return item.roles.some((r) => hasRole(r));
          });

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title}>
              <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {section.title}
              </div>
              <nav className="space-y-1">
                {visibleItems.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/dashboard'}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs font-semibold'
                          : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                      )
                    }
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>DealFlow360 v1.0</span>
        <span className="text-emerald-400 font-mono">Live Engine</span>
      </div>
    </aside>
  );
};
