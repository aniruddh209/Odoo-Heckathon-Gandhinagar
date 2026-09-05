import React, { useState, useEffect } from 'react';
import { adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  DataTable,
  Modal,
  Input,
  Select,
  PageHeader,
  SkeletonDashboard,
  ErrorAlert,
  Badge,
} from '../components/ui';
import { Shield, Layers, Truck, Plus, RefreshCw, Settings, Edit2, Trash2, Box, CheckCircle2, XCircle, AlertTriangle, Sparkles, ShoppingBag, ArrowUpRight } from 'lucide-react';

export const AdminGovernancePage = ({ defaultTab = 'tiers' }) => {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [tiers, setTiers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discountRules, setDiscountRules] = useState([]);
  const [approvalRules, setApprovalRules] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [replenishmentRules, setReplenishmentRules] = useState([]);
  const [upsellRules, setUpsellRules] = useState([]);

  // Replenishment Rule Modal State
  const [isReplenishModalOpen, setIsReplenishModalOpen] = useState(false);
  const [editingReplenishRule, setEditingReplenishRule] = useState(null);
  const [replenishWarehouseId, setReplenishWarehouseId] = useState('');
  const [replenishProductId, setReplenishProductId] = useState('');
  const [replenishMinStock, setReplenishMinStock] = useState('10');
  const [replenishReorderQty, setReplenishReorderQty] = useState('25');
  const [replenishIsActive, setReplenishIsActive] = useState(true);
  const [isSubmittingReplenish, setIsSubmittingReplenish] = useState(false);

  // Upsell / Cross-Sell Rule Modal State
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
  const [editingUpsellRule, setEditingUpsellRule] = useState(null);
  const [upsellTriggerProductId, setUpsellTriggerProductId] = useState('');
  const [upsellSuggestedProductId, setUpsellSuggestedProductId] = useState('');
  const [upsellRuleType, setUpsellRuleType] = useState('Upsell');
  const [upsellScore, setUpsellScore] = useState('1.0');
  const [upsellIsPromoted, setUpsellIsPromoted] = useState(false);
  const [upsellIsActive, setUpsellIsActive] = useState(true);
  const [isSubmittingUpsell, setIsSubmittingUpsell] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (defaultTab) {
      setActiveTab(defaultTab);
    }
  }, [defaultTab]);

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

  // Warehouse Modal State (Create & Edit)
  const [isWarehouseModalOpen, setIsWarehouseModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);
  const [warehouseName, setWarehouseName] = useState('');
  const [warehouseShippingWeight, setWarehouseShippingWeight] = useState('1.0');
  const [warehouseIsActive, setWarehouseIsActive] = useState(true);
  const [isSubmittingWarehouse, setIsSubmittingWarehouse] = useState(false);

  // Warehouse Stocks Modal State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedWarehouseForStock, setSelectedWarehouseForStock] = useState(null);
  const [warehouseStocks, setWarehouseStocks] = useState([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState('');
  const [adjustOnHand, setAdjustOnHand] = useState('0');
  const [isSubmittingStock, setIsSubmittingStock] = useState(false);

  // Subscription Plan Modal State
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planName, setPlanName] = useState('');
  const [planBillingFrequency, setPlanBillingFrequency] = useState('Monthly');
  const [planIntervalMonths, setPlanIntervalMonths] = useState('1');
  const [planIsActive, setPlanIsActive] = useState(true);
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  useEffect(() => {
    loadGovernanceData();
  }, []);

  const loadGovernanceData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [tRes, cRes, dRes, aRes, wRes, pRes, prodRes, repRes, upRes] = await Promise.all([
        adminApi.getCustomerTiers(),
        adminApi.getCategories().catch(() => []),
        adminApi.getDiscountRules(),
        adminApi.getApprovalRules(),
        adminApi.getWarehouses(),
        adminApi.getSubscriptionPlans(),
        adminApi.getProducts().catch(() => []),
        adminApi.getReplenishmentRules().catch(() => []),
        adminApi.getUpsellRules().catch(() => []),
      ]);

      const tList = Array.isArray(tRes) ? tRes : tRes?.value || [];
      const cList = Array.isArray(cRes) ? cRes : cRes?.value || [];
      const dList = Array.isArray(dRes) ? dRes : dRes?.value || [];
      const aList = Array.isArray(aRes) ? aRes : aRes?.value || [];
      const wList = Array.isArray(wRes) ? wRes : wRes?.value || [];
      const pList = Array.isArray(pRes) ? pRes : pRes?.value || [];
      const prodList = Array.isArray(prodRes) ? prodRes : prodRes?.value || [];
      const repList = Array.isArray(repRes) ? repRes : repRes?.value || [];
      const upList = Array.isArray(upRes) ? upRes : upRes?.value || [];

      setTiers(tList);
      setCategories(cList);
      setDiscountRules(dList);
      setApprovalRules(aList);
      setWarehouses(wList);
      setPlans(pList);
      setProducts(prodList);
      setReplenishmentRules(repList);
      setUpsellRules(upList);
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

  // Warehouse Handlers
  const handleOpenCreateWarehouse = () => {
    setEditingWarehouse(null);
    setWarehouseName('');
    setWarehouseShippingWeight('1.0');
    setWarehouseIsActive(true);
    setIsWarehouseModalOpen(true);
  };

  const handleOpenEditWarehouse = (warehouse) => {
    setEditingWarehouse(warehouse);
    setWarehouseName(warehouse.name);
    setWarehouseShippingWeight(warehouse.shippingCostWeight?.toString() || '1.0');
    setWarehouseIsActive(warehouse.isActive !== false);
    setIsWarehouseModalOpen(true);
  };

  const handleSaveWarehouse = async (e) => {
    e.preventDefault();
    setIsSubmittingWarehouse(true);
    try {
      const payload = {
        name: warehouseName,
        shippingCostWeight: parseFloat(warehouseShippingWeight) || 1.0,
      };

      if (editingWarehouse) {
        await adminApi.updateWarehouse(editingWarehouse.id, {
          ...payload,
          isActive: warehouseIsActive,
        });
        toast.success('Warehouse Updated', `Warehouse "${warehouseName}" updated successfully.`);
      } else {
        await adminApi.createWarehouse(payload);
        toast.success('Warehouse Created', `Warehouse "${warehouseName}" added to system.`);
      }
      setIsWarehouseModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to save warehouse', err.message);
    } finally {
      setIsSubmittingWarehouse(false);
    }
  };

  const handleToggleWarehouseStatus = async (warehouse) => {
    try {
      await adminApi.toggleWarehouseStatus(warehouse.id);
      toast.success('Warehouse Status Updated', `${warehouse.name} is now ${warehouse.isActive ? 'Inactive' : 'Active'}.`);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to toggle warehouse status', err.message);
    }
  };

  // Warehouse Stock Handlers
  const handleOpenStockModal = async (warehouse) => {
    setSelectedWarehouseForStock(warehouse);
    setIsStockModalOpen(true);
    setIsLoadingStocks(true);
    try {
      const res = await adminApi.getWarehouseStocks(warehouse.id);
      const stockList = Array.isArray(res) ? res : res?.value || [];
      setWarehouseStocks(stockList);
      if (products.length > 0) {
        setAdjustProductId(products[0].id.toString());
      }
      setAdjustOnHand('0');
    } catch (err) {
      toast.error('Failed to load warehouse stock', err.message);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!selectedWarehouseForStock || !adjustProductId) return;
    setIsSubmittingStock(true);
    try {
      await adminApi.adjustStock(selectedWarehouseForStock.id, {
        productId: parseInt(adjustProductId, 10),
        onHand: parseInt(adjustOnHand, 10) || 0,
      });
      toast.success('Stock Level Adjusted', 'Inventory balances updated successfully.');
      // Refresh warehouse stock list
      const res = await adminApi.getWarehouseStocks(selectedWarehouseForStock.id);
      const stockList = Array.isArray(res) ? res : res?.value || [];
      setWarehouseStocks(stockList);
    } catch (err) {
      toast.error('Stock adjustment failed', err.message);
    } finally {
      setIsSubmittingStock(false);
    }
  };

  // Subscription Plan Handlers
  const handleOpenCreatePlan = () => {
    setEditingPlan(null);
    setPlanName('');
    setPlanBillingFrequency('Monthly');
    setPlanIntervalMonths('1');
    setPlanIsActive(true);
    setIsPlanModalOpen(true);
  };

  const handleOpenEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanBillingFrequency(plan.billingFrequency || 'Monthly');
    setPlanIntervalMonths(plan.billingIntervalMonths?.toString() || '1');
    setPlanIsActive(plan.isActive !== false);
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    setIsSubmittingPlan(true);
    try {
      const payload = {
        name: planName,
        billingFrequency: planBillingFrequency,
        billingIntervalMonths: parseInt(planIntervalMonths, 10) || 1,
      };

      if (editingPlan) {
        await adminApi.updateSubscriptionPlan(editingPlan.id, {
          ...payload,
          isActive: planIsActive,
        });
        toast.success('Plan Updated', `Plan "${planName}" updated successfully.`);
      } else {
        await adminApi.createSubscriptionPlan(payload);
        toast.success('Plan Created', `Subscription plan "${planName}" created.`);
      }
      setIsPlanModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to save subscription plan', err.message);
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  const handleTogglePlanStatus = async (plan) => {
    try {
      await adminApi.toggleSubscriptionPlanStatus(plan.id);
      toast.success('Plan Status Updated', `${plan.name} is now ${plan.isActive ? 'Inactive' : 'Active'}.`);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to toggle plan status', err.message);
    }
  };

  // Replenishment Rule Handlers
  const handleOpenCreateReplenishRule = () => {
    setEditingReplenishRule(null);
    setReplenishWarehouseId(warehouses[0]?.id?.toString() || '1');
    setReplenishProductId(products[0]?.id?.toString() || '1');
    setReplenishMinStock('10');
    setReplenishReorderQty('25');
    setReplenishIsActive(true);
    setIsReplenishModalOpen(true);
  };

  const handleOpenEditReplenishRule = (rule) => {
    setEditingReplenishRule(rule);
    setReplenishWarehouseId(rule.warehouseId?.toString() || (warehouses[0]?.id?.toString() || '1'));
    setReplenishProductId(rule.productId?.toString() || (products[0]?.id?.toString() || '1'));
    setReplenishMinStock(rule.minStockLevel?.toString() || '10');
    setReplenishReorderQty(rule.reorderQuantity?.toString() || '25');
    setReplenishIsActive(rule.isActive !== false);
    setIsReplenishModalOpen(true);
  };

  const handleSaveReplenishRule = async (e) => {
    e.preventDefault();
    setIsSubmittingReplenish(true);
    try {
      const payload = {
        warehouseId: parseInt(replenishWarehouseId, 10),
        productId: parseInt(replenishProductId, 10),
        minStockLevel: parseInt(replenishMinStock, 10) || 0,
        reorderQuantity: parseInt(replenishReorderQty, 10) || 0,
        isActive: replenishIsActive,
      };

      if (editingReplenishRule) {
        await adminApi.updateReplenishmentRule(editingReplenishRule.id, payload);
        toast.success('Replenishment Rule Updated', `Rule RR-${editingReplenishRule.id} updated successfully.`);
      } else {
        await adminApi.createReplenishmentRule(payload);
        toast.success('Replenishment Rule Created', 'Automated replenishment trigger active.');
      }
      setIsReplenishModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to save replenishment rule', err.message);
    } finally {
      setIsSubmittingReplenish(false);
    }
  };

  const handleDeleteReplenishRule = async (ruleId) => {
    if (!window.confirm(`Delete replenishment rule RR-${ruleId}?`)) return;
    try {
      await adminApi.deleteReplenishmentRule(ruleId);
      toast.success('Rule Deleted', `Replenishment rule RR-${ruleId} removed.`);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to delete rule', err.message);
    }
  };

  // Upsell / Cross-Sell Rule Handlers
  const handleOpenCreateUpsellRule = () => {
    setEditingUpsellRule(null);
    setUpsellTriggerProductId(products[0]?.id?.toString() || '1');
    setUpsellSuggestedProductId(products[1]?.id?.toString() || products[0]?.id?.toString() || '1');
    setUpsellRuleType('Upsell');
    setUpsellScore('1.0');
    setUpsellIsPromoted(false);
    setUpsellIsActive(true);
    setIsUpsellModalOpen(true);
  };

  const handleOpenEditUpsellRule = (rule) => {
    setEditingUpsellRule(rule);
    setUpsellTriggerProductId(rule.triggerProductId?.toString() || (products[0]?.id?.toString() || '1'));
    setUpsellSuggestedProductId(rule.suggestedProductId?.toString() || (products[1]?.id?.toString() || '1'));
    setUpsellRuleType(rule.ruleType || 'Upsell');
    setUpsellScore((rule.score || 1.0).toString());
    setUpsellIsPromoted(rule.isPromoted === true);
    setUpsellIsActive(rule.isActive !== false);
    setIsUpsellModalOpen(true);
  };

  const handleSaveUpsellRule = async (e) => {
    e.preventDefault();
    if (upsellTriggerProductId === upsellSuggestedProductId) {
      toast.error('Validation Error', 'Trigger product and suggested product cannot be the same item.');
      return;
    }
    setIsSubmittingUpsell(true);
    try {
      const payload = {
        triggerProductId: parseInt(upsellTriggerProductId, 10),
        suggestedProductId: parseInt(upsellSuggestedProductId, 10),
        ruleType: upsellRuleType,
        score: parseFloat(upsellScore) || 1.0,
        isPromoted: upsellIsPromoted,
        isActive: upsellIsActive,
      };

      if (editingUpsellRule) {
        await adminApi.updateUpsellRule(editingUpsellRule.id, payload);
        toast.success('Recommendation Rule Updated', `Rule UR-${editingUpsellRule.id} updated successfully.`);
      } else {
        await adminApi.createUpsellRule(payload);
        toast.success('Recommendation Rule Created', `${upsellRuleType} strategy rule active.`);
      }
      setIsUpsellModalOpen(false);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to save upsell rule', err.message);
    } finally {
      setIsSubmittingUpsell(false);
    }
  };

  const handleDeleteUpsellRule = async (ruleId) => {
    if (!window.confirm(`Delete recommendation rule UR-${ruleId}?`)) return;
    try {
      await adminApi.deleteUpsellRule(ruleId);
      toast.success('Rule Deleted', `Recommendation rule UR-${ruleId} removed.`);
      await loadGovernanceData();
    } catch (err) {
      toast.error('Failed to delete rule', err.message);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
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
    { header: 'Category', accessor: 'categoryName', render: (r) => <span className="text-slate-600 font-medium">{r.categoryName || 'Global Order'}</span> },
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
    {
      header: 'Status',
      accessor: 'isActive',
      render: (w) => (
        <Badge variant={w.isActive ? 'success' : 'neutral'}>
          {w.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (w) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={Box}
            onClick={() => handleOpenStockModal(w)}
            className="text-xs py-1 px-2 h-7 text-indigo-600 hover:text-indigo-700"
          >
            Manage Stock
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEditWarehouse(w)}
            className="text-xs py-1 px-2 h-7"
          >
            Edit
          </Button>
          <Button
            variant={w.isActive ? 'outline' : 'primary'}
            size="sm"
            icon={w.isActive ? XCircle : CheckCircle2}
            onClick={() => handleToggleWarehouseStatus(w)}
            className="text-xs py-1 px-2 h-7"
          >
            {w.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const planCols = [
    { header: 'Plan Name', accessor: 'name', render: (p) => <span className="font-bold text-slate-900">{p.name}</span> },
    { header: 'Billing Cadence', accessor: 'billingFrequency', render: (p) => <span className="font-semibold text-purple-700">{p.billingFrequency}</span> },
    { header: 'Interval (Months)', accessor: 'billingIntervalMonths', render: (p) => <span className="font-mono text-slate-700">{p.billingIntervalMonths} Month(s)</span> },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (p) => (
        <Badge variant={p.isActive ? 'success' : 'neutral'}>
          {p.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            icon={Edit2}
            onClick={() => handleOpenEditPlan(p)}
            className="text-xs py-1 px-2 h-7"
          >
            Edit
          </Button>
          <Button
            variant={p.isActive ? 'outline' : 'primary'}
            size="sm"
            icon={p.isActive ? XCircle : CheckCircle2}
            onClick={() => handleTogglePlanStatus(p)}
            className="text-xs py-1 px-2 h-7"
          >
            {p.isActive ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  const replenishCols = [
    { header: 'Rule #', accessor: 'id', render: (r) => <span className="font-mono font-bold text-slate-700">RR-{r.id}</span> },
    { header: 'Depot / Warehouse', accessor: 'warehouseName', render: (r) => <span className="font-semibold text-slate-900">{r.warehouseName || `Warehouse #${r.warehouseId}`}</span> },
    {
      header: 'Product Item',
      accessor: 'productName',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900 block">{r.productName}</span>
          <span className="text-[11px] font-mono text-slate-400">{r.productSku}</span>
        </div>
      ),
    },
    { header: 'Min Stock Level', accessor: 'minStockLevel', render: (r) => <span className="font-mono font-bold text-amber-600">{r.minStockLevel} Units</span> },
    { header: 'Reorder Quantity', accessor: 'reorderQuantity', render: (r) => <span className="font-mono font-bold text-blue-600">{r.reorderQuantity} Units</span> },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (r) => <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (r) => (
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleOpenEditReplenishRule(r)} className="text-xs py-1 px-2 h-7">
            Edit
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteReplenishRule(r.id)} className="text-xs py-1 px-2 h-7">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const upsellCols = [
    { header: 'Rule #', accessor: 'id', render: (u) => <span className="font-mono font-bold text-slate-700">UR-{u.id}</span> },
    {
      header: 'Trigger Product',
      accessor: 'triggerProductName',
      render: (u) => <span className="font-semibold text-slate-900">{u.triggerProductName || `Product #${u.triggerProductId}`}</span>,
    },
    {
      header: 'Suggested Product',
      accessor: 'suggestedProductName',
      render: (u) => <span className="font-semibold text-blue-700">{u.suggestedProductName || `Product #${u.suggestedProductId}`}</span>,
    },
    {
      header: 'Strategy Type',
      accessor: 'ruleType',
      render: (u) => (
        <Badge variant={u.ruleType === 'Upsell' ? 'indigo' : 'cyan'}>
          {u.ruleType}
        </Badge>
      ),
    },
    { header: 'Affinity Score', accessor: 'score', render: (u) => <span className="font-mono font-bold text-slate-800">{u.score?.toFixed(1) || '1.0'}</span> },
    {
      header: 'Promoted',
      accessor: 'isPromoted',
      render: (u) => (
        <Badge variant={u.isPromoted ? 'warning' : 'neutral'}>
          {u.isPromoted ? 'Promoted' : 'Standard'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessor: 'isActive',
      render: (u) => <Badge variant={u.isActive ? 'success' : 'neutral'}>{u.isActive ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      header: 'Actions',
      accessor: 'actions',
      render: (u) => (
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="sm" icon={Edit2} onClick={() => handleOpenEditUpsellRule(u)} className="text-xs py-1 px-2 h-7">
            Edit
          </Button>
          <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDeleteUpsellRule(u.id)} className="text-xs py-1 px-2 h-7">
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const stockCols = [
    { header: 'SKU', accessor: 'productSKU', render: (s) => <span className="font-mono font-bold text-slate-800">{s.productSKU}</span> },
    { header: 'Product Name', accessor: 'productName', render: (s) => <span className="font-medium text-slate-900">{s.productName}</span> },
    { header: 'On Hand', accessor: 'onHand', render: (s) => <span className="font-mono font-bold text-slate-900">{s.onHand}</span> },
    { header: 'Reserved', accessor: 'reserved', render: (s) => <span className="font-mono font-semibold text-amber-700">{s.reserved}</span> },
    {
      header: 'Available',
      accessor: 'available',
      render: (s) => (
        <span className={`font-mono font-bold ${s.available < 5 ? 'text-rose-600' : 'text-emerald-700'}`}>
          {s.available}
        </span>
      ),
    },
    {
      header: 'Quick Action',
      accessor: 'actions',
      render: (s) => (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setAdjustProductId(s.productId.toString());
            setAdjustOnHand(s.onHand.toString());
          }}
          className="text-xs py-0.5 px-2 h-6"
        >
          Select to Adjust
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Governance Matrices & Business Rules"
        subtitle="Configure automated discount ceilings, approval routing chains, warehouses, and subscription plans."
        badge="Governance Engine"
        badgeVariant="indigo"
        actions={
          <div className="flex items-center gap-2.5">
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
            {activeTab === 'warehouses' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreateWarehouse}>
                Add Warehouse
              </Button>
            )}
            {activeTab === 'replenishment' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreateReplenishRule}>
                Add Replenishment Rule
              </Button>
            )}
            {activeTab === 'upsell' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreateUpsellRule}>
                Add Upsell / Cross-Sell Rule
              </Button>
            )}
            {activeTab === 'plans' && (
              <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenCreatePlan}>
                Add Subscription Plan
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadGovernanceData} />}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'tiers', label: `Customer Tiers (${tiers.length})`, icon: Layers },
          { id: 'discounts', label: `Discount Rules (${discountRules.length})`, icon: Shield },
          { id: 'approvals', label: `Approval Chains (${approvalRules.length})`, icon: Settings },
          { id: 'warehouses', label: `Warehouses (${warehouses.length})`, icon: Truck },
          { id: 'replenishment', label: `Replenishment Rules (${replenishmentRules.length})`, icon: Box },
          { id: 'upsell', label: `Upsell & Cross-Sell (${upsellRules.length})`, icon: Sparkles },
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
      {activeTab === 'replenishment' && <DataTable columns={replenishCols} data={replenishmentRules} emptyMessage="No replenishment rules configured" emptyDescription="Define safety stocks and reorder thresholds across warehouses." />}
      {activeTab === 'upsell' && <DataTable columns={upsellCols} data={upsellRules} emptyMessage="No upsell / cross-sell rules configured" emptyDescription="Define cross-sell recommendations and bundle upsells." />}
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

      {/* Warehouse Modal (Create & Edit) */}
      <Modal
        isOpen={isWarehouseModalOpen}
        onClose={() => setIsWarehouseModalOpen(false)}
        title={editingWarehouse ? `Edit Warehouse: ${editingWarehouse.name}` : 'Add New Warehouse'}
        description="Configure warehouse fulfillment location and shipping weight multiplier."
      >
        <form onSubmit={handleSaveWarehouse} className="space-y-4">
          <Input
            label="Warehouse Name"
            type="text"
            required
            value={warehouseName}
            onChange={(e) => setWarehouseName(e.target.value)}
            placeholder="e.g. Central Distribution Hub"
          />
          <Input
            label="Shipping Cost Weight Multiplier"
            type="number"
            step="0.1"
            min="0.1"
            required
            value={warehouseShippingWeight}
            onChange={(e) => setWarehouseShippingWeight(e.target.value)}
            helperText="Multiplier applied during dynamic shipping rate estimation (default 1.0)."
          />
          {editingWarehouse && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="warehouseIsActive"
                checked={warehouseIsActive}
                onChange={(e) => setWarehouseIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="warehouseIsActive" className="text-xs font-medium text-slate-700">
                Warehouse is active and accepting order fulfillment allocations
              </label>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsWarehouseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingWarehouse}>
              {editingWarehouse ? 'Save Changes' : 'Create Warehouse'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Warehouse Stock Inventory Modal */}
      <Modal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        title={`Stock Inventory: ${selectedWarehouseForStock?.name || ''}`}
        description="Inspect inventory levels, view reserved quantities, and execute manual stock adjustments."
        maxWidth="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Stock Adjustment Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Box className="w-4 h-4 text-blue-600" />
              Adjust Product Inventory
            </h3>
            <form onSubmit={handleAdjustStock} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Product</label>
                <select
                  className="w-full h-9 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  required
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">New On-Hand Level</label>
                <input
                  type="number"
                  min="0"
                  className="w-full h-9 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  value={adjustOnHand}
                  onChange={(e) => setAdjustOnHand(e.target.value)}
                  required
                />
              </div>
              <div>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingStock} className="w-full h-9">
                  Update Stock
                </Button>
              </div>
            </form>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-amber-500 inline" />
              On-Hand balance cannot be set below currently reserved units.
            </p>
          </div>

          {/* Current Stocks Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Current Warehouse Stock Allocations
            </h3>
            {isLoadingStocks ? (
              <LoadingSpinner message="Loading warehouse stock balances..." size="sm" />
            ) : warehouseStocks.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-500 border border-dashed border-slate-200 rounded">
                No product inventory recorded for this warehouse yet. Use the form above to add initial stock.
              </div>
            ) : (
              <DataTable columns={stockCols} data={warehouseStocks} />
            )}
          </div>

          <div className="pt-3 flex justify-end border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsStockModalOpen(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Replenishment Rule Modal */}
      <Modal
        isOpen={isReplenishModalOpen}
        onClose={() => setIsReplenishModalOpen(false)}
        title={editingReplenishRule ? `Edit Replenishment Rule RR-${editingReplenishRule.id}` : 'Add Replenishment Rule'}
        description="Configure automated reorder triggers and safety stock thresholds per warehouse."
      >
        <form onSubmit={handleSaveReplenishRule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Warehouse / Depot</label>
            <select
              className="w-full h-9 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={replenishWarehouseId}
              onChange={(e) => setReplenishWarehouseId(e.target.value)}
              required
            >
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Target Product Line</label>
            <select
              className="w-full h-9 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={replenishProductId}
              onChange={(e) => setReplenishProductId(e.target.value)}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <Input
            label="Minimum Safety Stock Level"
            type="number"
            min="0"
            required
            value={replenishMinStock}
            onChange={(e) => setReplenishMinStock(e.target.value)}
            helperText="Inventory dropping below this threshold triggers automated replenishment orders."
          />

          <Input
            label="Standard Reorder Quantity"
            type="number"
            min="1"
            required
            value={replenishReorderQty}
            onChange={(e) => setReplenishReorderQty(e.target.value)}
            helperText="Batch units ordered automatically upon hitting the minimum safety stock."
          />

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="replenishIsActive"
              checked={replenishIsActive}
              onChange={(e) => setReplenishIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="replenishIsActive" className="text-xs font-medium text-slate-700">
              Rule is active and actively monitored by inventory daemon
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsReplenishModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingReplenish}>
              {editingReplenishRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Upsell / Cross-Sell Rule Modal */}
      <Modal
        isOpen={isUpsellModalOpen}
        onClose={() => setIsUpsellModalOpen(false)}
        title={editingUpsellRule ? `Edit Recommendation Rule UR-${editingUpsellRule.id}` : 'Add Upsell / Cross-Sell Rule'}
        description="Configure product affinity triggers and AI recommendation scores for quotation workflows."
      >
        <form onSubmit={handleSaveUpsellRule} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Trigger Product (In Quote)</label>
            <select
              className="w-full h-9 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={upsellTriggerProductId}
              onChange={(e) => setUpsellTriggerProductId(e.target.value)}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Suggested Product (Recommendation)</label>
            <select
              className="w-full h-9 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={upsellSuggestedProductId}
              onChange={(e) => setUpsellSuggestedProductId(e.target.value)}
              required
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          <Select
            label="Recommendation Strategy"
            required
            value={upsellRuleType}
            onChange={(e) => setUpsellRuleType(e.target.value)}
            options={[
              { value: 'Upsell', label: 'Upsell (Higher tier / upgraded model)' },
              { value: 'CrossSell', label: 'Cross-Sell (Complementary accessories / add-ons)' },
            ]}
          />

          <Input
            label="Affinity Score (0.1 - 10.0)"
            type="number"
            step="0.1"
            min="0.1"
            max="10.0"
            required
            value={upsellScore}
            onChange={(e) => setUpsellScore(e.target.value)}
            helperText="Relative weight ranking for AI recommendations in the sales rep workspace."
          />

          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="upsellIsPromoted"
                checked={upsellIsPromoted}
                onChange={(e) => setUpsellIsPromoted(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="upsellIsPromoted" className="text-xs font-medium text-slate-700">
                Promote with special badge in sales representative quote builder
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="upsellIsActive"
                checked={upsellIsActive}
                onChange={(e) => setUpsellIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="upsellIsActive" className="text-xs font-medium text-slate-700">
                Rule is active and eligible for AI recommendation engine
              </label>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsUpsellModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingUpsell}>
              {editingUpsellRule ? 'Save Changes' : 'Create Rule'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Subscription Plan Modal (Create & Edit) */}
      <Modal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        title={editingPlan ? `Edit Subscription Plan: ${editingPlan.name}` : 'Add Subscription Plan'}
        description="Configure subscription intervals for recurring billing schedules."
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <Input
            label="Plan Name"
            type="text"
            required
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            placeholder="e.g. Enterprise Annual, Starter Monthly"
          />

          <Select
            label="Billing Cadence"
            required
            value={planBillingFrequency}
            onChange={(e) => setPlanBillingFrequency(e.target.value)}
            options={[
              { value: 'Monthly', label: 'Monthly' },
              { value: 'Quarterly', label: 'Quarterly' },
              { value: 'SemiAnnual', label: 'Semi-Annual' },
              { value: 'Yearly', label: 'Yearly / Annual' },
            ]}
          />

          <Input
            label="Billing Interval (Months)"
            type="number"
            min="1"
            max="60"
            required
            value={planIntervalMonths}
            onChange={(e) => setPlanIntervalMonths(e.target.value)}
            helperText="Cycle duration in months (e.g., 1 for Monthly, 3 for Quarterly, 12 for Annual)."
          />

          {editingPlan && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="planIsActive"
                checked={planIsActive}
                onChange={(e) => setPlanIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="planIsActive" className="text-xs font-medium text-slate-700">
                Plan is active and eligible for quotation subscription billing lines
              </label>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsPlanModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingPlan}>
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminGovernancePage;
