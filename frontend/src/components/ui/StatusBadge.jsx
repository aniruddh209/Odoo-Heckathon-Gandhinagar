import React from 'react';

export const StatusBadge = ({
  status,
  type = 'quote', // 'quote', 'approval', 'order', 'invoice', 'margin', 'risk'
  value, // for margin or risk
  size = 'md',
  className = '',
}) => {
  // Margin & Risk numeric badges
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
        {label} Margin
      </span>
    );
  }

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
        {label} ({value.toFixed(0)})
      </span>
    );
  }

  const normalized = String(status || '').trim();

  // Status mappings
  const statusStyles = {
    // Quotations
    Draft: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400',
      label: 'Draft',
    },
    PendingApproval: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500 animate-pulse',
      label: 'Pending Approval',
    },
    Approved: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Approved',
    },
    Sent: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Sent to Client',
    },
    UnderNegotiation: {
      bg: 'bg-purple-50 text-purple-700 border-purple-200',
      dot: 'bg-purple-500 animate-pulse',
      label: 'Negotiation',
    },
    ConvertedToOrder: {
      bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      dot: 'bg-indigo-600',
      label: 'Order Confirmed',
    },
    Rejected: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500',
      label: 'Rejected',
    },
    Returned: {
      bg: 'bg-orange-50 text-orange-700 border-orange-200',
      dot: 'bg-orange-500',
      label: 'Returned for Edit',
    },

    // Orders & Fulfillment
    Confirmed: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Confirmed',
    },
    Processing: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Processing',
    },
    PartiallyFulfilled: {
      bg: 'bg-yellow-50 text-yellow-800 border-yellow-200',
      dot: 'bg-yellow-500',
      label: 'Partial Split',
    },
    Fulfilled: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Fulfilled',
    },

    // Invoices
    Issued: {
      bg: 'bg-blue-50 text-blue-700 border-blue-200',
      dot: 'bg-blue-500',
      label: 'Issued',
    },
    PartiallyPaid: {
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
      dot: 'bg-amber-500',
      label: 'Partial Payment',
    },
    Paid: {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      dot: 'bg-emerald-500',
      label: 'Paid',
    },
    Overdue: {
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
      dot: 'bg-rose-500 animate-pulse',
      label: 'Overdue',
    },
  };

  const current = statusStyles[normalized] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: normalized || 'Unknown',
  };

  const sizeClasses = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium select-none ${current.bg} ${sizeClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${current.dot}`} aria-hidden="true" />
      {current.label}
    </span>
  );
};

export default StatusBadge;
