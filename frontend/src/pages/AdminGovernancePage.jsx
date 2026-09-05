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
import { Shield, Layers, Truck, Plus, RefreshCw, Settings, Edit2, Trash2 } from 'lucide-react';

export const AdminGovernancePage = () => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('tiers'); // tiers, discounts, approvals, warehouses, plans
  const [tiers, setTiers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [approvalRules, setApprovalRules] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit Tier Modal State
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [editingTier, setEditingTier] = useState(null);
  const [tierName, setTierName] = useState('');
  const [tierMaxDiscount, setTierMaxDiscount] = useState('');
  const [isSubmittingTier, setIsSubmittingTier] = useState(false);

  // Discount Rule Modal State
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [editingDiscountRule, setEditingDiscountRule] = useState(null);
  const [discountTierId, setDiscountTierId] = useState('');
  const [discountCategoryId, setDiscountCategoryId] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('15.00');
  const [managerThreshold, setManagerThreshold] = useState('8.00');
  const [financeThreshold, setFinanceThreshold] = useState('12.00');
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);

  // Approval Rule Modal State
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [editingApprovalRule, setEditingApprovalRule] = useState(null);
  const [approvalLevel, setApprovalLevel] = useState('Manager');
  const [approvalRole, setApprovalRole] = useState('SalesManager');
  const [approvalSequence, setApprovalSequence] = useState('1');
  const [approvalMinRisk, setApprovalMinRisk] = useState('30.00');
  const [approvalMaxRisk, setApprovalMaxRisk] = useState('69.99');
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tRes, cRes, dRes, aRes, wRes, pRes] = await Promise.all([
        adminApi.getCustomerTiers(),
        adminApi.getCategories().catch(() => []),
        adminApi.getDiscountRules(),
        adminApi.getApprovalRules(),
        adminApi.getWarehouses(),
        adminApi.getSubscriptionPlans(),
      ]);

      const tList = Array.isArray(tRes) ? tRes : tRes?.value || [];
      const cList = Array.isArray(cRes) ? cRes : cRes?.value || [];
      const dList = Array.isArray(dRes) ? dRes : dRes?.value || [];
      const aList = Array.isArray(aRes) ? aRes : aRes?.value || [];
      const wList = Array.isArray(wRes) ? wRes : wRes?.value || [];
      const pList = Array.isArray(pRes) ? pRes : pRes?.value || [];

      setTiers(tList);
      setCategories(cList);
      setDiscountRules(dList);
      setApprovalRules(aList);
      setWarehouses(wList);
      setPlans(pList);
      if (tList.length > 0 && !discountTierId) setDiscountTierId(tList[0].id.toString());
    } catch (err) {
      setError(err.message || 'Failed to load governance matrix.');
    } finally {
      setIsLoading(false);
    }
  };

  // Tier Edit Handlers
  const handleOpenEditTier = (tier) => {
    setEditingTier(tier);
    setTierName(tier.name);
    setTierMaxDiscount(tier.maxDiscountPercent?.toString() || '0');
    setIsTierModalOpen(true);
  };

  const handleSaveTier = async (e) => {
    e.preventDefault();
    if (!editingTier) return;
    setIsSubmittingTier(true);
    try {
      await adminApi.updateCustomerTier(editingTier.id, {
        name: tierName,
        maxDiscountPercent: parseFloat(tierMaxDiscount) || 0,
      });
      toast.success('Customer Tier Updated', `Ceiling discount for ${tierName} updated.`);
      setIsTierModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to update tier', err.message);
    } finally {
      setIsSubmittingTier(false);
    }
  };

  // Discount Rule Handlers
  const handleOpenCreateDiscountRule = () => {
    setEditingDiscountRule(null);
    if (tiers.length > 0) setDiscountTierId(tiers[0].id.toString());
    setDiscountCategoryId('');
    setMaxDiscount('15.00');
    setManagerThreshold('8.00');
    setFinanceThreshold('12.00');
    setIsDiscountModalOpen(true);
  };

  const handleOpenEditDiscountRule = (rule) => {
    setEditingDiscountRule(rule);
    setDiscountTierId(rule.tierId?.toString() || (tiers[0]?.id?.toString() || ''));
    setDiscountCategoryId(rule.categoryId ? rule.categoryId.toString() : '');
    setMaxDiscount(rule.maxDiscountPercent?.toString() || '15.00');
    setManagerThreshold(rule.managerThreshold?.toString() || '8.00');
    setFinanceThreshold(rule.financeThreshold?.toString() || '12.00');
    setIsDiscountModalOpen(true);
  };

  const handleSaveDiscountRule = async (e) => {
    e.preventDefault();
    setIsSubmittingDiscount(true);
    try {
      const payload = {
        tierId: parseInt(discountTierId, 10),
        categoryId: discountCategoryId ? parseInt(discountCategoryId, 10) : null,
        maxDiscountPercent: parseFloat(maxDiscount) || 0,
        managerThreshold: parseFloat(managerThreshold) || 0,
        financeThreshold: parseFloat(financeThreshold) || 0,
      };

      if (editingDiscountRule) {
        await adminApi.updateDiscountRule(editingDiscountRule.id, {
          ...payload,
          isActive: true,
        });
        toast.success('Discount Rule Updated', `Rule DR-${editingDiscountRule.id} updated successfully.`);
      } else {
        await adminApi.createDiscountRule(payload);
        toast.success('Discount Rule Created', 'New discount threshold rule enforced.');
      }
      setIsDiscountModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to save discount rule', err.message);
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleDeleteDiscountRule = async (ruleId) => {
    if (!window.confirm(`Are you sure you want to delete discount rule DR-${ruleId}?`)) return;
    try {
      await adminApi.deleteDiscountRule(ruleId);
      toast.success('Discount Rule Deleted', `Rule DR-${ruleId} removed.`);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to delete rule', err.message);
    }
  };

  // Approval Rule Handlers
  const handleOpenCreateApprovalRule = () => {
    setEditingApprovalRule(null);
    setApprovalLevel('Manager');
    setApprovalRole('SalesManager');
    setApprovalSequence((approvalRules.length + 1).toString());
    setApprovalMinRisk('30.00');
    setApprovalMaxRisk('69.99');
    setIsApprovalModalOpen(true);
  };

  const handleOpenEditApprovalRule = (rule) => {
    setEditingApprovalRule(rule);
    setApprovalLevel(rule.level);
    setApprovalRole(rule.requiredRole);
    setApprovalSequence(rule.sequence?.toString() || '1');
    setApprovalMinRisk(rule.minRisk?.toString() || '0');
    setApprovalMaxRisk(rule.maxRisk?.toString() || '100');
    setIsApprovalModalOpen(true);
  };

  const handleSaveApprovalRule = async (e) => {
    e.preventDefault();
    setIsSubmittingApproval(true);
    try {
      const payload = {
        level: approvalLevel,
        requiredRole: approvalRole,
        sequence: parseInt(approvalSequence, 10) || 1,
        minRisk: parseFloat(approvalMinRisk) || 0,
        maxRisk: parseFloat(approvalMaxRisk) || 0,
      };

      if (editingApprovalRule) {
        await adminApi.updateApprovalRule(editingApprovalRule.id, {
          ...payload,
          isActive: true,
        });
        toast.success('Approval Rule Updated', `Level ${payload.level} chain updated.`);
      } else {
        await adminApi.createApprovalRule(payload);
        toast.success('Approval Rule Created', `Level ${payload.level} rule added to governance pipeline.`);
      }
      setIsApprovalModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to save approval rule', err.message);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleDeleteApprovalRule = async (ruleId) => {
    if (!window.confirm(`Are you sure you want to delete approval rule #${ruleId}?`)) return;
    try {
      await adminApi.deleteApprovalRule(ruleId);
      toast.success('Approval Rule Deleted', `Rule #${ruleId} removed from chain.`);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to delete approval rule', err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Querying governance matrices and approval engines..." size="lg" />;
  }

  const tierCols = [
    { header: 'Tier Name', accessor: 'name', render: (t) => <span className="font-bold text-slate-900">{t.name}</span> },
    {
      header: 'Ceiling Discount Limit',
      accessor: 'maxDiscountPercent',
      render: (t) => <span className="font-mono font-bold text-blue-600">{t.maxDiscountPercent}%</span>,
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (t) => (
        <Button
          variant="outline"
          size="sm"
          icon={Edit2}
          onClick={() => handleOpenEditTier(t)}
          className="text-xs py-1 px-2 h-7"
        >
          Edit Limit
        </Button>
      ),
    },
  ];

  const discountCols = [
    { header: 'Rule #', accessor: 'id', render: (r) => <span className="font-mono font-bold text-slate-700">DR-{r.id}</span> },
    { header: 'Target Tier', accessor: 'tierName', render: (r) => <span className="font-semibold text-slate-900">{r.tierName || `Tier #${r.tierId}`}</span> },
    { header: 'Category', accessor: 'categoryName', render: (r) => <span className="text-slate-600">{r.categoryName || 'Global Order'}</span> },
    { header: 'Max Ceiling', accessor: 'maxDiscountPercent', render: (r) => <span className="font-mono font-bold text-slate-900">{r.maxDiscountPercent}%</span> },
    { header: 'Manager Escalate', accessor: 'managerThreshold', render: (r) => <span className="font-mono font-semibold text-amber-700">&gt; {r.managerThreshold}%</span> },
    { header: 'Finance Escalate', accessor: 'financeThreshold', render: (r) => <span className="font-mono font-semibold text-rose-700">&gt; {r.financeThreshold}%</span> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEditDiscountRule(r)}
            className="text-xs py-1 px-2 h-7"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => handleDeleteDiscountRule(r.id)}
            className="text-xs py-1 px-2 h-7"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const approvalCols = [
    { header: 'Level', accessor: 'level', render: (a) => <span className="font-bold text-slate-900">Level {a.sequence || 1}: {a.level}</span> },
    { header: 'Required Role', accessor: 'requiredRole', render: (a) => <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold">{a.requiredRole}</span> },
    { header: 'Min Risk Score', accessor: 'minRisk', render: (a) => <span className="font-mono text-slate-700">{a.minRisk}</span> },
    { header: 'Max Risk Score', accessor: 'maxRisk', render: (a) => <span className="font-mono text-slate-700">{a.maxRisk}</span> },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEditApprovalRule(a)}
            className="text-xs py-1 px-2 h-7"
          >
            Edit
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={Trash2}
            onClick={() => handleDeleteApprovalRule(a.id)}
            className="text-xs py-1 px-2 h-7"
          >
            Delete
          </Button>
        </div>
      ),
    },
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
            Configure automated discount ceilings, approval routing chains, and pricing parameters.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadGovernanceData}>
            Refresh
          </Button>
          {activeTab === 'discounts' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreateDiscountRule}>
              Add Discount Rule
            </Button>
          )}
          {activeTab === 'approvals' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreateApprovalRule}>
              Add Approval Rule
            </Button>
          )}
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadGovernanceData} />}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold overflow-x-auto">
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
              className={`py-3 border-b-2 flex items-center gap-2 transition-colors whitespace-nowrap ${
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

      {/* Edit Tier Modal */}
      <Modal
        isOpen={isTierModalOpen}
        onClose={() => setIsTierModalOpen(false)}
        title="Update Customer Tier Ceilings"
        description="Adjust discount governance ceilings for this customer tier."
      >
        <form onSubmit={handleSaveTier} className="space-y-4">
          <Input
            label="Tier Name"
            type="text"
            required
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
          />
          <Input
            label="Maximum Discount Ceiling (%)"
            type="number"
            step="0.1"
            min="0"
            max="100"
            required
            value={tierMaxDiscount}
            onChange={(e) => setTierMaxDiscount(e.target.value)}
            helperText="Quotations exceeding this limit trigger automated high-risk flags."
          />
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsTierModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingTier}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>

      {/* Discount Rule Modal (Create & Edit) */}
      <Modal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        title={editingDiscountRule ? `Edit Discount Rule DR-${editingDiscountRule.id}` : 'Configure Discount Governance Rule'}
        description="Enforces automated approval escalation based on tier or category violation."
      >
        <form onSubmit={handleSaveDiscountRule} className="space-y-4">
          <Select
            label="Customer Tier"
            required
            value={discountTierId}
            onChange={(e) => setDiscountTierId(e.target.value)}
            options={tiers.map((t) => ({
              value: t.id,
              label: t.name,
            }))}
          />

          {categories.length > 0 && (
            <Select
              label="Target Product Category (Optional)"
              value={discountCategoryId}
              onChange={(e) => setDiscountCategoryId(e.target.value)}
              options={[
                { value: '', label: 'Global (All Categories)' },
                ...categories.map((c) => ({
                  value: c.id,
                  label: c.name,
                })),
              ]}
            />
          )}

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
            <Button variant="outline" size="sm" onClick={() => setIsDiscountModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingDiscount}>
              {editingDiscountRule ? 'Save Rule' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Approval Rule Modal (Create & Edit) */}
      <Modal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        title={editingApprovalRule ? `Edit Approval Chain (Level ${approvalLevel})` : 'Configure Approval Chain Stage'}
        description="Defines the risk range and authoritative role required for this signoff stage."
      >
        <form onSubmit={handleSaveApprovalRule} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Level Name"
              type="text"
              required
              placeholder="e.g. Manager, Finance"
              value={approvalLevel}
              onChange={(e) => setApprovalLevel(e.target.value)}
            />
            <Input
              label="Execution Sequence"
              type="number"
              min="1"
              max="10"
              required
              value={approvalSequence}
              onChange={(e) => setApprovalSequence(e.target.value)}
              helperText="Order in multi-step approval workflow"
            />
          </div>

          <Select
            label="Required Authoritative Role"
            required
            value={approvalRole}
            onChange={(e) => setApprovalRole(e.target.value)}
            options={[
              { value: 'SalesManager', label: 'Sales Manager' },
              { value: 'Finance', label: 'Finance' },
              { value: 'Admin', label: 'Administrator' },
            ]}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Minimum Risk Score"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={approvalMinRisk}
              onChange={(e) => setApprovalMinRisk(e.target.value)}
            />
            <Input
              label="Maximum Risk Score"
              type="number"
              step="0.1"
              min="0"
              max="100"
              required
              value={approvalMaxRisk}
              onChange={(e) => setApprovalMaxRisk(e.target.value)}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsApprovalModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingApproval}>
              {editingApprovalRule ? 'Save Stage' : 'Create Stage'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminGovernancePage;

