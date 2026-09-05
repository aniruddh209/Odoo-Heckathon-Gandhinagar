import React from 'react';
import { ApprovalRequestDto, ApprovalActionDto } from '../../types';
import { CheckCircle2, XCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';

interface ApprovalStepperProps {
  request: ApprovalRequestDto;
}

export const ApprovalStepper: React.FC<ApprovalStepperProps> = ({ request }) => {
  const actions = request.Actions || [];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900">Governance Approval Workflow</h3>
          <p className="text-xs text-slate-500">
            Sequential tier evaluation based on quotation risk score ({request.BlendedRiskScore})
          </p>
        </div>
        <span
          className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
            request.Status === 'Approved'
              ? 'bg-emerald-100 text-emerald-800'
              : request.Status === 'Rejected'
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {request.Status}
        </span>
      </div>

      {/* Stepper Timeline */}
      <div className="space-y-6">
        {actions.length === 0 ? (
          <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <Clock className="w-5 h-5 text-amber-600 animate-pulse" />
            <div>
              <div className="font-semibold">Awaiting Management Review</div>
              <div className="text-xs text-amber-700">
                Triggered due to {request.TriggerReason || 'Commercial margin/discount thresholds'}.
              </div>
            </div>
          </div>
        ) : (
          actions.map((act, index) => {
            const isApproved = act.Action === 'Approved';
            const isRejected = act.Action === 'Rejected';
            return (
              <div key={act.Id || index} className="flex items-start space-x-4">
                <div
                  className={`p-2 rounded-full mt-0.5 ${
                    isApproved
                      ? 'bg-emerald-100 text-emerald-600'
                      : isRejected
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {isApproved ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : isRejected ? (
                    <XCircle className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5" />
                  )}
                </div>

                <div className="flex-1 bg-slate-50 rounded-lg p-4 border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-800 text-sm">
                        Tier {act.TierLevel || index + 1} Reviewer: {act.ApproverName || 'Designated Approver'}
                      </span>
                      <span className="text-xs text-slate-400 block">
                        Role: {act.ApproverRole || 'Manager'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {act.ActionDate ? new Date(act.ActionDate).toLocaleString() : 'Pending'}
                    </span>
                  </div>

                  {act.Comments && (
                    <div className="mt-2 text-xs bg-white p-2.5 rounded border border-slate-200 text-slate-700">
                      <strong className="text-slate-900">Remarks: </strong>
                      {act.Comments}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
