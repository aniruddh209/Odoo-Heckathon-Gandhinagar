import React from 'react';
import { Button } from '../common/Button';
import { Clock, User, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const StalledDealsFeed = ({
  alerts = [],
  onNudgeRep,
}) => {
  const navigate = useNavigate();

  if (alerts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-400">
        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <p className="text-sm font-medium text-slate-600">Pipeline Moving Normally</p>
        <p className="text-xs text-slate-400 mt-0.5">No deals currently exceeding stage SLA thresholds.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-600" />
          <h3 className="font-bold text-slate-800 text-sm">Stalled Deals SLA Monitor</h3>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
          {alerts.length} flagged
        </span>
      </div>

      <div className="divide-y divide-slate-100">
        {alerts.map((deal) => (
          <div key={deal.DealId || deal.dealId} className="p-4 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-800 text-sm">{deal.QuotationNumber}</span>
                <span className="text-slate-400">•</span>
                <span className="text-xs text-slate-600 font-medium">{deal.CustomerName}</span>
              </div>
              <div className="flex items-center space-x-4 text-xs text-slate-500">
                <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                  Stalled for {deal.DaysStalled} days in {deal.CurrentStage}
                </span>
                <span className="font-mono text-slate-700 font-bold">${(deal.TotalAmount ?? deal.totalAmount ?? 0).toLocaleString()}</span>
                <span className="flex items-center text-slate-400">
                  <User className="w-3 h-3 mr-1" />
                  {deal.SalesRepName}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              {onNudgeRep && (
                <Button size="sm" variant="outline" onClick={() => onNudgeRep(deal.DealId || deal.dealId)}>
                  Nudge Rep
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/quotations/${deal.DealId || deal.dealId}`)}
              >
                Inspect
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
