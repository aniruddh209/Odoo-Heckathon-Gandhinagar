import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const AdminApprovalsPage: React.FC = () => {
  const approvalPolicies = [
    {
      tier: 1,
      role: 'Sales Manager',
      trigger: 'Blended Risk Score ≥ 31 OR Discount > 10% OR Margin < 25%',
      slaHours: 24,
      escalationTarget: 'VP Commercial Sales',
      status: 'Active',
    },
    {
      tier: 2,
      role: 'Finance Operations / VP Commercial',
      trigger: 'Blended Risk Score ≥ 61 OR Discount > 20% OR Margin < 18%',
      slaHours: 48,
      escalationTarget: 'Chief Financial Officer (CFO)',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Governance & Approval Hierarchy</h1>
        <p className="text-xs text-slate-500">
          Sequential multi-tier delegation matrix and automatic SLA escalation triggers
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Escalation Matrix Rules</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tier Level</th>
                <th className="py-3.5 px-4">Authorized Approver Role</th>
                <th className="py-3.5 px-4">Trigger Policy Condition</th>
                <th className="py-3.5 px-4 text-right">Response SLA</th>
                <th className="py-3.5 px-4">Timeout Escalation Target</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {approvalPolicies.map((p) => (
                <tr key={p.tier} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">Tier {p.tier}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{p.role}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">{p.trigger}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{p.slaHours} hrs</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{p.escalationTarget}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
