import React from 'react';
import { formatCurrency, formatPercent } from '../../utils/formatters';
import { ArrowUpRight } from 'lucide-react';

export const KanbanCard = ({
  quote,
  onClick,
  onDragStart,
  isDragging = false,
}) => {
  // Risk indicator calculation
  const riskScore = Number(quote.riskScore) || 0;
  const getRiskInfo = () => {
    if (riskScore >= 70) {
      return {
        label: riskScore > 0 ? `High · ${Math.round(riskScore)}` : 'High Risk',
        dotColor: 'bg-rose-500',
        textColor: 'text-rose-700',
        bg: 'bg-rose-50/60',
      };
    }
    if (riskScore >= 30) {
      return {
        label: riskScore > 0 ? `Med · ${Math.round(riskScore)}` : 'Medium',
        dotColor: 'bg-amber-500',
        textColor: 'text-amber-700',
        bg: 'bg-amber-50/60',
      };
    }
    return {
      label: 'Low Risk',
      dotColor: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      bg: 'bg-emerald-50/60',
    };
  };

  const risk = getRiskInfo();

  // Margin indicator calculation
  const marginVal = Number(quote.marginPercent) || 0;
  const getMarginStyle = () => {
    if (marginVal >= 20) {
      return 'text-emerald-700';
    }
    if (marginVal >= 15) {
      return 'text-amber-700';
    }
    return 'text-rose-600 font-semibold';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(quote);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      draggable
      onDragStart={(e) => onDragStart?.(e, quote)}
      onClick={() => onClick?.(quote)}
      onKeyDown={handleKeyDown}
      title={`${quote.customerName} (${quote.quotationNumber}) - Click to inspect details`}
      className={`group relative p-3 bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-xs transition-all duration-150 cursor-pointer space-y-2 select-none shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
        isDragging ? 'opacity-40 scale-95 shadow-inner' : 'opacity-100'
      }`}
    >
      {/* Row 1: Customer Name (Primary) & Subtle Arrow Icon on hover */}
      <div className="flex items-start justify-between gap-1.5">
        <h4 className="text-xs sm:text-[13px] font-semibold text-slate-900 truncate flex-1 tracking-tight">
          {quote.customerName || 'Unnamed Customer'}
        </h4>
        <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0 mt-0.5" />
      </div>

      {/* Row 2: Quote ID (Secondary, muted) */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span className="truncate">{quote.quotationNumber}</span>
      </div>

      {/* Row 3: Deal Amount (Strong numeric value) */}
      <div className="pt-0.5">
        <span className="text-sm font-bold text-slate-900 font-mono tracking-tight">
          {formatCurrency(quote.grandTotal || 0, quote.currency || 'INR')}
        </span>
      </div>

      {/* Row 4: Subtle Status/Risk Indicator & Margin */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
        {/* Risk Dot */}
        <div className={`inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-md ${risk.bg}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${risk.dotColor} shrink-0`} />
          <span className={`text-[10.5px] font-medium ${risk.textColor}`}>
            {risk.label}
          </span>
        </div>

        {/* Margin */}
        <span className={`text-[10.5px] font-mono ${getMarginStyle()}`} title={`Margin: ${marginVal.toFixed(1)}%`}>
          {marginVal > 0 ? `+${marginVal.toFixed(1)}%` : `${marginVal.toFixed(1)}%`}
        </span>
      </div>
    </div>
  );
};

export default KanbanCard;
