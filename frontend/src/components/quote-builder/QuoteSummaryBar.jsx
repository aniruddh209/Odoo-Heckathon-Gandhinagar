import React from 'react';
import { Button } from '../common/Button.jsx';
import { RefreshCw, TrendingUp, ShieldAlert } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const QuoteSummaryBar = ({
  quotation,
  onRecalculate,
  isRecalculating = false,
}) => {
  const currency = quotation.CurrencyCode ?? quotation.currency ?? 'INR';
  const subtotal = quotation.SubtotalAmount ?? quotation.totalGrossAmount ?? 0;
  const discount = quotation.TotalDiscountAmount ?? quotation.totalDiscountAmount ?? 0;
  const tax = quotation.TaxAmount ?? quotation.taxAmount ?? 0;
  const total = quotation.TotalAmount ?? quotation.totalNetAmount ?? (subtotal - discount + tax);
  const cost = quotation.TotalCostPrice ?? quotation.totalCostAmount;
  const marginAmt = quotation.OrderGrossMarginAmount ?? quotation.orderGrossMarginAmount;
  const marginPct = quotation.OrderGrossMarginPercent ?? quotation.orderGrossMarginPercent ?? 0;
  const isHealthyMargin = marginPct >= 25;
  const isDangerousMargin = marginPct < 15;

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200/80 p-5">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        {/* Financial Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 w-full lg:w-auto">
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">List Subtotal</span>
            <span className="text-lg font-semibold text-slate-800 font-mono">
              {formatCurrency(subtotal, currency)}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Total Discount</span>
            <span className="text-lg font-semibold text-amber-600 font-mono">
              -{formatCurrency(discount, currency)}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Tax ({tax > 0 ? 'Applied' : '0%'})</span>
            <span className="text-lg font-semibold text-slate-700 font-mono">
              {formatCurrency(tax, currency)}
            </span>
          </div>

          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Net Grand Total</span>
            <span className="text-2xl font-black text-blue-950 font-mono">
              {formatCurrency(total, currency)}
            </span>
          </div>
        </div>

        {/* Staff-Only Cost & Margin Card */}
        {cost !== undefined && (
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 px-4 py-3 rounded-lg w-full lg:w-auto justify-between lg:justify-start">
            <div className="text-left">
              <span className="text-xs text-slate-400 block font-medium">Standard Cost</span>
              <span className="text-sm font-mono text-slate-600">
                {formatCurrency(cost, currency)}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div className="text-left">
              <span className="text-xs text-slate-400 block font-medium">Gross Margin</span>
              <span className="text-sm font-mono font-semibold text-slate-800">
                {formatCurrency(marginAmt ?? 0, currency)}
              </span>
            </div>

            <div className="h-8 w-px bg-slate-200" />

            <div>
              <span className="text-xs text-slate-400 block font-medium">Margin %</span>
              <span
                className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                  isDangerousMargin
                    ? 'bg-rose-100 text-rose-800'
                    : isHealthyMargin
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isDangerousMargin ? (
                  <ShieldAlert className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-1" />
                )}
                {marginPct.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Server Authority Recalculate CTA */}
        {onRecalculate && (
          <div className="w-full lg:w-auto flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={onRecalculate}
              isLoading={isRecalculating}
              title="Force backend server recalculation of tiers, line discounts, and margins"
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${isRecalculating ? 'animate-spin' : ''}`} />
              Recalculate Pricing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
