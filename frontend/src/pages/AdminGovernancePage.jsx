import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  DataTable,
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import { Shield, Layers, Truck, Plus, RefreshCw, Settings } from 'lucide-react';

export const AdminGovernancePage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('tiers'); // tiers, discounts, approvals, warehouses, plans
  const [tiers, setTiers] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [approvalRules, setApprovalRules] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Rule Modal
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [tierId, setTierId] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('15.00');
  const [managerThreshold, setManagerThreshold] = useState('8.00');
  const [financeThreshold, setFinanceThreshold] = useState('12.00');
  const [isSubmittingRule, setIsSubmittingRule] = useState(false);

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tRes, dRes, aRes, wRes, pRes] = await Promise.all([
        adminApi.getCustomerTiers(),
        adminApi.getDiscountRules(),
        adminApi.getApprovalRules(),
        adminApi.getWarehouses(),
        adminApi.getSubscriptionPlans(),
      ]);

      const tList = Array.isArray(tRes) ? tRes : tRes?.value || [];
      const dList = Array.isArray(dRes) ? dRes : dRes?.value || [];
      const aList = Array.isArray(aRes) ? aRes : aRes?.value || [];
      const wList = Array.isArray(wRes) ? wRes : wRes?.value || [];
      const pList = Array.isArray(pRes) ? pRes : pRes?.value || [];

      setTiers(tList);
      setDiscountRules(dList);
      setApprovalRules(aList);
      setWarehouses(wList);
      setPlans(pList);
      if (tList.length > 0) setTierId(tList[0].id.toString());
    } catch (err) {
      setError(err.message || 'Failed to load governance matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateDiscountRule = async (e) => {
    e.preventDefault();
    setIsSubmittingRule(true);
    try {
      await adminApi.createDiscountRule({
        tierId: parseInt(tierId, 10),
        maxDiscountPercent: parseFloat(maxDiscount) || 0,
        managerThreshold: parseFloat(managerThreshold) || 0,
        financeThreshold: parseFloat(financeThreshold) || 0,
      });

      toast.success('Governance Rule Created', 'Discount thresholds updated.');
      setIsRuleModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to create rule', err.message);
    } finally {
      setIsSubmittingRule(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Querying governance matrices and approval engines..." size="lg" />;
  }

  const tierCols = [
    { header: 'Tier Name', accessor: 'name', render: (t) => <span className="font-bold text-slate-900">{t.name}</span> },
    { header: 'Ceiling Discount Limit', accessor: 'maxDiscountPercent', render: (t) => <span className="font-mono font-bold text-blue-600">{t.maxDiscountPercent}%</span> },
  ];

  const discountCols = [
    { header: 'Rule #', accessor: 'id', render: (r) => <span className="font-mono font-bold text-slate-700">DR-{r.id}</span> },
    { header: 'Target Tier', accessor: 'tierName', render: (r) => <span className="font-semibold text-slate-900">{r.tierName || `Tier #${r.tierId}`}</span> },
    { header: 'Category', accessor: 'categoryName', render: (r) => <span className="text-slate-600">{r.categoryName || 'Global Order'}</span> },
    { header: 'Max Ceiling', accessor: 'maxDiscountPercent', render: (r) => <span className="font-mono font-bold text-slate-900">{r.maxDiscountPercent}%</span> },
    { header: 'Manager Escalate', accessor: 'managerThreshold', render: (r) => <span className="font-mono font-semibold text-amber-700">&gt; {r.managerThreshold}%</span> },
    { header: 'Finance Escalate', accessor: 'financeThreshold', render: (r) => <span className="font-mono font-semibold text-rose-700">&gt; {r.financeThreshold}%</span> },
  ];

  const approvalCols = [
    { header: 'Level', accessor: 'level', render: (a) => <span className="font-bold text-slate-900">Level {a.sequence || 1}: {a.level}</span> },
    { header: 'Required Role', accessor: 'requiredRole', render: (a) => <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">{a.requiredRole}</span> },
    { header: 'Min Risk Score', accessor: 'minRisk', render: (a) => <span className="font-mono text-slate-700">{a.minRisk}</span> },
    { header: 'Max Risk Score', accessor: 'maxRisk', render: (a) => <span className="font-mono text-slate-700">{a.maxRisk}</span> },
  ];

  const warehouseCols = [
    { header: 'Warehouse Name', accessor: 'name', render: (w) => <span className="font-bold text-slate-900">{w.name}</span> },
    { header: 'Shipping Cost Weight', accessor: 'shippingCostWeight', render: (w) => <span className="font-mono text-slate-700">{w.shippingCostWeight}x Multiplier</span> },
  ];

  const planCols = [
    { header: 'Plan Name', accessor: 'name', render: (p) => <span className="font-bold text-slate-900">{p.name}</span> },
    { header: 'Billing Cadence', accessor: 'billingFrequency', render: (p) => <span className="font-semibold text-purple-700">{p.billingFrequency}</span> },
    { header: 'Interval (Months)', accessor: 'billingIntervalMonths', render: (p) => <span className="font-mono text-slate-700">{p.billingIntervalMonths} Month(s)</span> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Governance Matrices &amp; Business Rules</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure automated discount ceilings, approval routing chains, and warehouse locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadGovernanceData}>
            Refresh
          </Button>
          {activeTab === 'discounts' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsRuleModalOpen(true)}>
              Add Discount Rule
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadGovernanceData} />}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
        {[
          { id: 'tiers', label: `Customer Tiers (${tiers.length})`, icon: Layers },
          { id: 'discounts', label: `Discount Rules (${discountRules.length})`, icon: Shield },
          { id: 'approvals', label: `Approval Chains (${approvalRules.length})`, icon: Settings },
          { id: 'warehouses', label: `Warehouses (${warehouses.length})`, icon: Truck },
          { id: 'plans', label: `Subscription Plans (${plans.length})`, icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'tiers' && <DataTable columns={tierCols} data={tiers} />}
      {activeTab === 'discounts' && <DataTable columns={discountCols} data={discountRules} />}
      {activeTab === 'approvals' && <DataTable columns={approvalCols} data={approvalRules} />}
      {activeTab === 'warehouses' && <DataTable columns={warehouseCols} data={warehouses} />}
      {activeTab === 'plans' && <DataTable columns={planCols} data={plans} />}

      {/* Discount Rule Modal */}
      <Modal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        title="Configure Discount Governance Rule"
        description="Enforces automated approval escalation based on tier or category violation."
      >
        <form onSubmit={handleCreateDiscountRule} className="space-y-4">
          <Select
            label="Customer Tier"
            required
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            options={tiers.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Ceiling Limit (%)"
              type="number"
              step="0.1"
              required
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
            />
            <Input
              label="Manager Threshold (%)"
              type="number"
              step="0.1"
              required
              value={managerThreshold}
              onChange={(e) => setManagerThreshold(e.target.value)}
            />
            <Input
              label="Finance Threshold (%)"
              type="number"
              step="0.1"
              required
              value={financeThreshold}
              onChange={(e) => setFinanceThreshold(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsRuleModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingRule}>
              Save Rule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminGovernancePage;
