import React from 'react';
import {
  Clock,
  CheckCircle2,
  Send,
  MessageSquare,
  PackageCheck,
  XCircle,
  RotateCcw,
  AlertTriangle,
  FileText,
  Truck,
  Receipt,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export const StatusBadge = ({
  status,
  type = 'quote', // 'quote', 'approval', 'order', 'invoice', 'margin', 'risk', 'general'
  value, // for margin or risk
  size = 'md',
  className = '',
}) => {
  // Margin numeric badges
  if (type === 'margin' && typeof value === 'number') {
    let variant = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let dotColor = 'bg-emerald-500';
    let label = `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

    if (value < 15) {
      variant = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
    } else if (value < 25) {
      variant = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variant} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span className="font-mono">{label}</span> Margin
      </span>
    );
  }

  // Risk numeric badges
  if (type === 'risk' && typeof value === 'number') {
    let variant = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let dotColor = 'bg-emerald-500';
    let label = 'Low Risk';

    if (value > 50) {
      variant = 'bg-rose-50 text-rose-700 border-rose-200';
      dotColor = 'bg-rose-500';
      label = 'Critical Risk';
    } else if (value > 20) {
      variant = 'bg-amber-50 text-amber-700 border-amber-200';
      dotColor = 'bg-amber-500';
      label = 'Elevated Risk';
    }

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${variant} ${className}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{label}</span>
        <span className="font-mono text-[11px] opacity-80">({value.toFixed(0)})</span>
      </span>
    );
  }

  const normalized = String(status || '').trim();

  // Status mapping database
  const statusStyles = {
    // Quotation States
    Draft: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      icon: FileText,
      iconColor: 'text-slate-500',
      label: 'Draft',
    },
    PendingApproval: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600',
      label: 'Pending Approval',
    },
    Approved: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      label: 'Approved',
    },
    Sent: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Send,
      iconColor: 'text-blue-600',
      label: 'Sent to Client',
    },
    UnderNegotiation: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: MessageSquare,
      iconColor: 'text-purple-600',
      label: 'Negotiation',
    },
    Confirmed: {
      bg: 'bg-teal-50 text-teal-700 border-teal-200',
      icon: CheckCircle2,
      iconColor: 'text-teal-600',
      label: 'Client Confirmed',
    },
    ConvertedToOrder: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: PackageCheck,
      iconColor: 'text-indigo-600',
      label: 'Order Confirmed',
    },
    Rejected: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
      iconColor: 'text-rose-600',
      label: 'Rejected',
    },
    Returned: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: RotateCcw,
      iconColor: 'text-orange-600',
      label: 'Returned for Revision',
    },
    RevisionRequired: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      icon: RotateCcw,
      iconColor: 'text-orange-600',
      label: 'Revision Required',
    },
    ManagerApproved: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: ShieldCheck,
      iconColor: 'text-blue-600',
      label: 'Manager Approved',
    },
    FinanceApproved: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
      iconColor: 'text-emerald-600',
      label: 'Finance Approved',
    },

    // Order & Fulfillment States
    Processing: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600',
      label: 'Processing',
    },
    PartiallyAllocated: {
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      icon: Truck,
      iconColor: 'text-yellow-600',
      label: 'Partially Allocated',
    },
    Allocated: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Truck,
      iconColor: 'text-blue-600',
      label: 'Allocated',
    },
    PartiallyFulfilled: {
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      icon: Truck,
      iconColor: 'text-yellow-600',
      label: 'Partial Split',
    },
    Fulfilled: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      label: 'Fulfilled',
    },
    Backorder: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      label: 'Open Backorder',
    },
    Cancelled: {
      bg: 'bg-slate-100 text-slate-500 border-slate-200',
      icon: XCircle,
      iconColor: 'text-slate-400',
      label: 'Cancelled',
    },

    // Invoices & Billing
    Issued: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Receipt,
      iconColor: 'text-blue-600',
      label: 'Issued',
    },
    PartiallyPaid: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
      iconColor: 'text-amber-600',
      label: 'Partially Paid',
    },
    Paid: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      label: 'Paid in Full',
    },
    Overdue: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertTriangle,
      iconColor: 'text-rose-600',
      label: 'Overdue',
    },

    // General States
    Active: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2,
      iconColor: 'text-emerald-600',
      label: 'Active',
    },
    Inactive: {
      bg: 'bg-slate-100 text-slate-600 border-slate-200',
      icon: XCircle,
      iconColor: 'text-slate-400',
      label: 'Inactive',
    },
  };

  const current = statusStyles[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: FileText,
    iconColor: 'text-slate-400',
    label: normalized || 'Unknown',
  };

  const Icon = current.icon;
  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium select-none ${current.bg} ${sizeClasses} ${className}`}
    >
      <Icon className={`w-3 h-3 shrink-0 ${current.iconColor}`} aria-hidden="true" />
      <span>{current.label}</span>
    </span>
  );
};

export default StatusBadge;
