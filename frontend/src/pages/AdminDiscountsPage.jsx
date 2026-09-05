import React, { useState, useEffect } from 'react';
import { Percent, RefreshCw } from 'lucide-react';
import { adminApi } from '../api';
import { PageHeader, Button, ErrorAlert } from '../components/ui';

export const AdminDiscountsPage = () => {
  const [discountRules, setDiscountRules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await adminApi.getDiscountRules();
      const list = Array.isArray(res) ? res : res?.value || [];
      setDiscountRules(list);
    } catch (err) {
      setError(err.message || 'Failed to load discount rules.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <PageHeader
        title="Discount Governance & Margin Floors"
        subtitle="Commercial boundaries, delegation ceilings, and profit margin protection rules"
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadRules}>
            Refresh
          </Button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadRules} />}

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
                <th className="py-3.5 px-4">Rule #</th>
                <th className="py-3.5 px-4">Target Tier</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4 text-right">Max Discount Ceiling</th>
                <th className="py-3.5 px-4 text-right">Manager Threshold</th>
                <th className="py-3.5 px-4 text-right">Finance Threshold</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-500">Loading rules...</td>
                </tr>
              ) : discountRules.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-6 text-slate-500">No discount rules found.</td>
                </tr>
              ) : (
                discountRules.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">DR-{r.id}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{r.tierName || `Tier #${r.tierId}`}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">{r.categoryName || 'Global Order'}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-amber-600">{r.maxDiscountPercent}%</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">&gt; {r.managerThreshold}%</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">&gt; {r.financeThreshold}%</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${r.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
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

export default AdminDiscountsPage;
