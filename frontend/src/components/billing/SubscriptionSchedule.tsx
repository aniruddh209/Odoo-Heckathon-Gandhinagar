import React from 'react';
import { SubscriptionDto, BillingScheduleDto } from '../../types';
import { Button } from '../common/Button';
import { Repeat, Calendar, ShieldCheck, ArrowUpRight, XCircle } from 'lucide-react';

interface SubscriptionScheduleProps {
  subscription: SubscriptionDto;
  schedules?: BillingScheduleDto[];
  onChangePlan?: (subscriptionId: string) => void;
  onCancel?: (subscriptionId: string) => void;
}

export const SubscriptionSchedule: React.FC<SubscriptionScheduleProps> = ({
  subscription,
  schedules = [],
  onChangePlan,
  onCancel,
}) => {
  const isActive = subscription.Status === 'Active';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
            <Repeat className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900">{subscription.PlanName}</h3>
              <span
                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                  isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {subscription.Status}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Contract: {subscription.SubscriptionNumber}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onChangePlan && isActive && (
            <Button size="sm" variant="outline" onClick={() => onChangePlan(subscription.Id)}>
              <ArrowUpRight className="w-3.5 h-3.5 mr-1.5" />
              Adjust Seats / Tier
            </Button>
          )}
          {onCancel && isActive && (
            <Button size="sm" variant="outline" onClick={() => onCancel(subscription.Id)} className="text-rose-600 hover:bg-rose-50 border-rose-200">
              <XCircle className="w-3.5 h-3.5 mr-1.5" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Subscription Core Details */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-400 block mb-1">Recurring Cadence</span>
          <span className="font-semibold text-slate-800 text-sm capitalize">{subscription.BillingFrequency}</span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-400 block mb-1">Periodic Amount</span>
          <span className="font-mono font-bold text-slate-900 text-sm">
            ${(subscription.PeriodicPrice ?? subscription.periodicPrice ?? 0).toFixed(2)} / {subscription.BillingFrequency === 'Annual' ? 'yr' : 'mo'}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-400 block mb-1">Current Period Ends</span>
          <span className="font-semibold text-slate-800 text-sm">
            {subscription.CurrentPeriodEnd ? new Date(subscription.CurrentPeriodEnd).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-slate-400 block mb-1">Auto-Renewal</span>
          <span className="font-semibold text-emerald-700 text-sm flex items-center">
            <ShieldCheck className="w-3.5 h-3.5 mr-1" />
            {subscription.AutoRenew ? 'Enabled' : 'Manual Renew'}
          </span>
        </div>
      </div>

      {/* Upcoming Invoicing Schedule */}
      {schedules.length > 0 && (
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Upcoming Billing Milestones
          </h4>
          <div className="space-y-2">
            {schedules.map((sch) => (
              <div
                key={sch.Id || sch.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 text-xs hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span className="font-medium text-slate-700">
                    {sch.ScheduledDate ? new Date(sch.ScheduledDate).toLocaleDateString() : 'N/A'}
                  </span>
                  <span className="text-slate-400">({sch.PeriodDescription})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-mono font-bold text-slate-800">${(sch.Amount ?? sch.amount ?? 0).toFixed(2)}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      sch.Status === 'Processed'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {sch.Status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
