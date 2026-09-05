import React from 'react';
import { Percent } from 'lucide-react';

export const AdminDiscountsPage: React.FC = () => {
  const discountRules = [
    {
      id: 'd-1',
      name: 'Standard Rep Discretionary Ceiling',
      scope: 'Global Quotations',
      maxDiscount: 10.0,
      marginFloor: 25.0,
      approvalTrigger: 'Auto-Approved under 10%',
      status: 'Active',
    },
    {
      id: 'd-2',
      name: 'Tier 1 Sales Manager Delegation',
      scope: 'Enterprise Segment',
      maxDiscount: 20.0,
      marginFloor: 20.0,
      approvalTrigger: 'Sales Manager Review',
      status: 'Active',
    },
    {
      id: 'd-3',
      name: 'Executive VP & Finance Delegation',
      scope: 'Strategic Accounts',
      maxDiscount: 35.0,
      marginFloor: 15.0,
      approvalTrigger: 'Dual Executive Escalation',
      status: 'Active',
    },
    {
      id: 'd-4',
      name: 'Volume Quantity Break (100+ units)',
      scope: 'Catalog Line Items',
      maxDiscount: 12.5,
      marginFloor: 22.0,
      approvalTrigger: 'Automated System Rebate',
      status: 'Active',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Discount Governance & Margin Floors</h1>
          <p className="text-xs text-slate-500">
            Commercial boundaries, delegation ceilings, and profit margin protection rules
          </p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Percent className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-slate-800 text-sm">Active Delegation Policies</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Policy Name</th>
                <th className="py-3.5 px-4">Applicable Scope</th>
                <th className="py-3.5 px-4 text-right">Max Discount Ceiling</th>
                <th className="py-3.5 px-4 text-right">Protected Margin Floor</th>
                <th className="py-3.5 px-4">Governance Action</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {discountRules.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/70">
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.name}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{r.scope}</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600">{r.maxDiscount}%</td>
                  <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">{r.marginFloor}%</td>
                  <td className="py-3.5 px-4 text-xs text-slate-600">{r.approvalTrigger}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                      {r.status}
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
