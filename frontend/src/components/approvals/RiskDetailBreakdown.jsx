import React from 'react';
import { AlertTriangle, TrendingDown, DollarSign, ShieldAlert, Award } from 'lucide-react';

export const RiskDetailBreakdown = ({
  request,
  quotation,
}) => {
  const score = request?.BlendedRiskScore ?? 0;
  const isHighRisk = score >= 61;
  const isMediumRisk = score >= 31 && score < 61;

  const totalDiscount = quotation?.TotalDiscountAmount ?? quotation?.totalDiscountAmount ?? 0;
  const subtotal = quotation?.SubtotalAmount ?? quotation?.totalGrossAmount ?? 1;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-5">
      <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
        <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">Risk Policy Exception Analysis</h4>
          <p className="text-xs text-slate-500">Breakdown of criteria that exceeded commercial delegation authority</p>
        </div>
      </div>

      {/* Trigger Highlight */}
      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-sm">
        <span className="font-bold block mb-0.5">Primary Policy Violation:</span>
        <span>{request?.TriggerReason || 'Discount and/or Gross Margin policy breached standard thresholds.'}</span>
      </div>

      {/* Metric Decomposition */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span>Risk Score</span>
          </div>
          <div className={`text-xl font-black font-mono ${isHighRisk ? 'text-rose-600' : isMediumRisk ? 'text-amber-600' : 'text-emerald-600'}`}>
            {score} / 100
          </div>
          <span className="text-[11px] text-slate-400">
            {isHighRisk ? 'Dual-Tier Escalation' : isMediumRisk ? 'Manager Escalation' : 'Standard Tier'}
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
            <span>Requested Value</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">
            ${(quotation?.TotalAmount ?? quotation?.totalNetAmount ?? request?.TotalAmount ?? 0).toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400">Net Contract Total</span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
            <span>Total Discount</span>
          </div>
          <div className="text-xl font-black font-mono text-amber-600">
            {quotation ? `$${totalDiscount.toLocaleString()}` : `${request?.DiscountPercentage ?? 0}%`}
          </div>
          <span className="text-[11px] text-slate-400">
            {totalDiscount > 0 ? `Avg ${((totalDiscount / (subtotal || 1)) * 100).toFixed(1)}%` : 'Off List Price'}
          </span>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500 mb-1">
            <Award className="w-3.5 h-3.5 text-indigo-500" />
            <span>Gross Margin</span>
          </div>
          <div className="text-xl font-black font-mono text-slate-900">
            {quotation?.OrderGrossMarginPercent !== undefined ? `${quotation.OrderGrossMarginPercent.toFixed(1)}%` : 'N/A'}
          </div>
          <span className="text-[11px] text-slate-400">
            Standard floor is 25.0%
          </span>
        </div>
      </div>
    </div>
  );
};
