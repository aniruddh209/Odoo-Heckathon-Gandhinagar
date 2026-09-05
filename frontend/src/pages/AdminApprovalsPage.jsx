import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, RefreshCw, Trash2, Edit2 } from 'lucide-react';
import { adminApi } from '../api';
import { PageHeader, Button, ErrorAlert, DataTable } from '../components/ui';

export const AdminApprovalsPage = () => {
  const [approvalPolicies, setApprovalPolicies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getApprovalRules();
      const list = Array.isArray(res) ? res : res?.value || [];
      // Sort by priority (tier)
      list.sort((a, b) => a.priority - b.priority);
      setApprovalPolicies(list);
    } catch (err) {
      setError(err.message || 'Failed to load approval policies.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <PageHeader
        title="Governance & Approval Hierarchy"
        subtitle="Sequential multi-tier delegation matrix and automatic SLA escalation triggers"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadPolicies}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={Plus}>
              New Rule
            </Button>
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadPolicies} />}

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
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-500">Loading rules...</td>
                </tr>
              ) : approvalPolicies.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-6 text-slate-500">No approval rules found.</td>
                </tr>
              ) : (
                approvalPolicies.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600">Tier {p.priority}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{p.approverRole}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-mono">
                      {p.maxDiscountPercent ? `Discount > ${p.maxDiscountPercent}%` : ''}
                      {p.maxDiscountPercent && p.minMarginPercent ? ' OR ' : ''}
                      {p.minMarginPercent ? `Margin < ${p.minMarginPercent}%` : ''}
                      {(p.maxDiscountPercent || p.minMarginPercent) && p.maxRiskScore ? ' OR ' : ''}
                      {p.maxRiskScore ? `Risk Score >= ${p.maxRiskScore}` : ''}
                      {!p.maxDiscountPercent && !p.minMarginPercent && !p.maxRiskScore ? 'Requires Approval' : ''}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${p.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminApprovalsPage;
