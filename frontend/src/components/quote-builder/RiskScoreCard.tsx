import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface RiskScoreCardProps {
  score?: number;
  discountPercentage?: number;
  marginPercentage?: number;
  totalAmount?: number;
  isApprovalRequired?: boolean;
}

export const RiskScoreCard: React.FC<RiskScoreCardProps> = ({
  score = 0,
  discountPercentage = 0,
  marginPercentage = 0,
  totalAmount = 0,
  isApprovalRequired = false,
}) => {
  const getRiskLevel = (val: number) => {
    if (val >= 61) return { label: 'High Risk', color: 'rose', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' };
    if (val >= 31) return { label: 'Medium Risk', color: 'amber', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
    return { label: 'Low Risk', color: 'emerald', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
  };

  const risk = getRiskLevel(score);

  return (
    <div className={`rounded-xl border p-5 ${risk.bg} ${risk.border} shadow-sm transition-all`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            {score >= 61 ? (
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            ) : score >= 31 ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            )}
            <h4 className="font-bold text-slate-900">Blended Deal Risk Score</h4>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated by backend rule engine from margin erosion, discount size & credit tier.
          </p>
        </div>

        {/* Score Pill */}
        <div className="text-right">
          <span className={`text-2xl font-black font-mono ${risk.text}`}>{score}</span>
          <span className="text-xs text-slate-400"> / 100</span>
          <div className={`text-xs font-bold uppercase tracking-wider ${risk.text}`}>
            {risk.label}
          </div>
        </div>
      </div>

      {/* Progress Bar Gauge */}
      <div className="w-full bg-slate-200/80 rounded-full h-2.5 my-4 overflow-hidden">
        <div
          className={`h-2.5 rounded-full transition-all duration-500 ${
            score >= 61 ? 'bg-rose-600' : score >= 31 ? 'bg-amber-500' : 'bg-emerald-600'
          }`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      {/* Risk Dimension Details */}
      <div className="grid grid-cols-3 gap-2 pt-2 text-xs border-t border-slate-200/60">
        <div>
          <span className="text-slate-500 block">Avg Discount</span>
          <span className="font-semibold text-slate-800">{discountPercentage.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-slate-500 block">Gross Margin</span>
          <span className="font-semibold text-slate-800">{marginPercentage.toFixed(1)}%</span>
        </div>
        <div>
          <span className="text-slate-500 block">Contract Size</span>
          <span className="font-semibold text-slate-800">${totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Governance Routing Notice */}
      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-start space-x-2 text-xs">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <div className="text-slate-600">
          {score >= 61 ? (
            <span className="font-medium text-rose-700">
              Requires Dual Approval: Sales Manager + VP / Finance Operations prior to customer dispatch.
            </span>
          ) : score >= 31 ? (
            <span className="font-medium text-amber-800">
              Requires Sales Manager approval before quotation can be sent to customer.
            </span>
          ) : isApprovalRequired ? (
            <span className="font-medium text-slate-700">
              Standard line policy review required before dispatch.
            </span>
          ) : (
            <span className="font-medium text-emerald-700">
              Within standard commercial delegation limit. Eligible for direct dispatch.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
