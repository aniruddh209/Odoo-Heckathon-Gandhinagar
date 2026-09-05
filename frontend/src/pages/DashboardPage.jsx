import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quotationApi, reportApi, dealHealthApi, approvalApi, billingApi, adminApi } from '../api';
import {
  Button,
  StatusBadge,
  DataTable,
  LoadingSpinner,
  ErrorAlert,
  Badge,
} from '../components/ui';
import {
  Plus,
  TrendingUp,
  AlertCircle,
  DollarSign,
  Percent,
  ShieldAlert,
  Zap,
  RefreshCw,
  ArrowRight,
  GitPullRequest,
  CheckCircle2,
  Truck,
  FileText,
  Receipt,
  Users,
  Building2,
  Layers,
  Activity,
  Package,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user, isSalesRep, isSalesManager, isFinance, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [metrics, setMetrics] = useState({
    totalQuotedRevenue: 0,
    totalBookedRevenue: 0,
    averageMarginPercent: 0,
    averageRiskScore: 0,
    pendingApprovalsCount: 0,
    activeOrdersCount: 0,
    totalQuotes: 0,
  });

  const [pipelineOverview, setPipelineOverview] = useState(null);
  const [healthSummary, setHealthSummary] = useState(null);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [recentQuotes, setRecentQuotes] = useState([]);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [adminOverview, setAdminOverview] = useState(null);
  const [adminAuditLogs, setAdminAuditLogs] = useState([]);

  const calculateLocalMetrics = (quotes) => {
    const totalQuoted = quotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);
    const bookedRevenue = quotes
      .filter((q) => q.status === 'ConvertedToOrder')
      .reduce((sum, q) => sum + (q.grandTotal || 0), 0);
    const avgMargin = quotes.length > 0
      ? quotes.reduce((sum, q) => sum + (q.marginPercent || 0), 0) / quotes.length
      : 0;
    const avgRisk = quotes.length > 0
      ? quotes.reduce((sum, q) => sum + (q.riskScore || 0), 0) / quotes.length
      : 0;
    const pendingCount = quotes.filter((q) => q.status === 'PendingApproval').length;
    const activeOrders = quotes.filter((q) => q.status === 'ConvertedToOrder').length;

    // Local pipeline breakdown
    const stageMap = {
      Draft: { count: 0, total: 0 },
      Sent: { count: 0, total: 0 },
      PendingApproval: { count: 0, total: 0 },
      Approved: { count: 0, total: 0 },
      ConvertedToOrder: { count: 0, total: 0 },
      Rejected: { count: 0, total: 0 },
    };

    quotes.forEach((q) => {
      const st = q.status || 'Draft';
      if (!stageMap[st]) stageMap[st] = { count: 0, total: 0 };
      stageMap[st].count += 1;
      stageMap[st].total += (q.grandTotal || 0);
    });

    setPipelineOverview({
      totalPipelineValue: totalQuoted,
      totalDeals: quotes.length,
      stages: Object.entries(stageMap).map(([stageName, data]) => ({
        stageName,
        count: data.count,
        totalValue: data.total,
      })),
    });

    setMetrics({
      totalQuotedRevenue: totalQuoted,
      totalBookedRevenue: bookedRevenue,
      averageMarginPercent: Math.round(avgMargin * 10) / 10,
      averageRiskScore: Math.round(avgRisk * 10) / 10,
      pendingApprovalsCount: pendingCount,
      activeOrdersCount: activeOrders,
      totalQuotes: quotes.length,
    });
  };

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      // 1. Fetch real quotations (Sales Rep sees only their own, Managers/Admins see all)
      const quotesRes = await quotationApi.getQuotations(
        isSalesRep && !isAdmin && !isSalesManager ? { salesRepId: user?.id } : {}
      );
      const quotes = Array.isArray(quotesRes) ? quotesRes : quotesRes?.value || [];
      setRecentQuotes(quotes.slice(0, 6));

      // 2. Fetch authoritative report metrics if authorized
      if (isSalesManager || isFinance || isAdmin) {
        try {
          const reportData = await reportApi.getDashboardMetrics();
          setMetrics({
            totalQuotedRevenue: reportData.totalQuotedRevenue || 0,
            totalBookedRevenue: reportData.totalBookedRevenue || 0,
            averageMarginPercent: reportData.averageMarginPercent || 0,
            averageRiskScore: reportData.averageRiskScore || 0,
            pendingApprovalsCount: reportData.pendingApprovalsCount || 0,
            activeOrdersCount: reportData.activeOrdersCount || 0,
            totalQuotes: reportData.totalQuotationsCount || quotes.length,
          });
        } catch {
          calculateLocalMetrics(quotes);
        }

        // Pipeline Overview
        try {
          const pipeRes = await reportApi.getPipelineOverview();
          setPipelineOverview(pipeRes);
        } catch {
          calculateLocalMetrics(quotes);
        }

        // Deal Health Radar
        try {
          const healthData = await dealHealthApi.getDealHealthSummary();
          setHealthSummary(healthData);
        } catch (e) {
          console.warn('Deal health unavailable:', e);
        }

        // Pending Approvals Queue
        try {
          const pendingRes = await approvalApi.getPendingApprovals();
          const pList = Array.isArray(pendingRes) ? pendingRes : pendingRes?.value || [];
          setPendingApprovals(pList.slice(0, 4));
        } catch (e) {
          console.warn('Pending approvals unavailable:', e);
        }

        // Finance & Operations Telemetry
        if (isFinance || isAdmin) {
          try {
            const finSummary = await billingApi.getFinanceDashboardSummary();
            setFinanceSummary(finSummary);
          } catch (e) {
            console.warn('Finance summary unavailable:', e);
          }
        }

        // Admin Platform Overview & Audit Trail
        if (isAdmin) {
          try {
            const [overview, audit] = await Promise.all([
              adminApi.getPlatformOverview(),
              adminApi.getAuditLogs(6).catch(() => []),
            ]);
            setAdminOverview(overview);
            setAdminAuditLogs(Array.isArray(audit) ? audit : audit?.value || []);
          } catch (e) {
            console.warn('Admin platform overview unavailable:', e);
          }
        }
      } else {
        calculateLocalMetrics(quotes);
      }
    } catch (err) {
      setError(err.message || 'Failed to load live sales operations telemetry.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user, isSalesRep, isSalesManager, isFinance, isAdmin]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading) {
    return <LoadingSpinner message="Aggregating sales operations intelligence..." size="lg" />;
  }

  if (error) {
    return (
      <div className="py-8">
        <ErrorAlert message={error} onRetry={() => loadDashboardData(true)} />
      </div>
    );
  }

  const quoteColumns = [
    {
      header: 'Quotation #',
      accessor: 'quotationNumber',
      render: (q) => (
        <span className="font-semibold text-blue-600 hover:text-blue-700 font-mono">
          {q.quotationNumber}
        </span>
      ),
    },
    {
      header: 'Customer Account',
      accessor: 'customerName',
      render: (q) => (
        <div>
          <span className="font-medium text-slate-900 block">{q.customerName}</span>
          <span className="text-[11px] text-slate-400">Created: {new Date(q.createdAtUtc).toLocaleDateString()}</span>
        </div>
      ),
    },
    {
      header: 'Total Value',
      accessor: 'grandTotal',
      render: (q) => (
        <span className="font-semibold text-slate-900 font-mono">
          ${(q.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Gross Margin',
      accessor: 'marginPercent',
      render: (q) => <StatusBadge type="margin" value={q.marginPercent} />,
    },
    {
      header: 'Risk Score',
      accessor: 'riskScore',
      render: (q) => <StatusBadge type="risk" value={q.riskScore} />,
    },
    {
      header: 'Lifecycle State',
      accessor: 'status',
      render: (q) => <StatusBadge status={q.status} />,
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getStageBadgeColor = (stageName) => {
    switch (stageName) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Sent': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'UnderNegotiation': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'PendingApproval': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'ConvertedToOrder': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-8">
      {/* ── 1. Contextual Header ───────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b border-slate-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {getGreeting()}, {user?.fullName?.split(' ')[0] || 'Team'}
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              {user?.role || 'Live Governance'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time margin governance, automated tiered discount ceilings, and multi-depot fulfillment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            isLoading={isRefreshing}
            onClick={() => loadDashboardData(true)}
          >
            Refresh
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/workspace/quotations/new')}
          >
            Create Quotation
          </Button>
        </div>
      </div>

      {/* ── Admin Executive Platform Command Center (when user is Admin) ── */}
      {isAdmin && adminOverview && (
        <div className="p-5 rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-md space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
                  Admin Executive Command Center
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                    Platform Telemetry
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">
                  Global tenant health, organizational staffing, revenue realization, and catalog metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="xs"
                icon={Package}
                onClick={() => navigate('/admin/catalog')}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-600"
              >
                Products &amp; Pricing
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={Layers}
                onClick={() => navigate('/admin/governance')}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-600"
              >
                Governance &amp; Warehouses
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={FileText}
                onClick={() => navigate('/admin/reports')}
                className="bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-600"
              >
                Audit Reports
              </Button>
            </div>
          </div>

          {/* Key Admin Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-400 inline" /> Platform Staffing
              </span>
              <div className="text-xl font-bold text-white font-mono mt-1">
                {(adminOverview.totalSalesReps || 0) + (adminOverview.totalSalesManagers || 0) + (adminOverview.totalFinanceUsers || 0) + 1} <span className="text-xs font-normal text-slate-400">Users</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {adminOverview.totalSalesReps} Reps · {adminOverview.totalSalesManagers} Mgrs · {adminOverview.totalFinanceUsers} Fin · {adminOverview.totalCustomers} Cust
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-emerald-400 inline" /> Realized / Collected
              </span>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                ${(adminOverview.totalCollectedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                ${(adminOverview.totalInvoicedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} invoiced
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-purple-400 inline" /> Recurring Cadence
              </span>
              <div className="text-xl font-bold text-purple-300 font-mono mt-1">
                ${(adminOverview.monthlyRecurringRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} <span className="text-xs font-normal text-slate-400">MRR</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                ${(adminOverview.annualRecurringRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} ARR run-rate
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block flex items-center gap-1">
                <Truck className="w-3 h-3 text-amber-400 inline" /> Inventory &amp; Risk
              </span>
              <div className="text-xl font-bold text-amber-300 font-mono mt-1">
                {adminOverview.atRiskDealsCount} <span className="text-xs font-normal text-slate-400">At-Risk Deals</span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {adminOverview.backordersCount ?? adminOverview.openBackordersCount ?? 0} backorders · {adminOverview.totalWarehouses} depots · {adminOverview.totalProducts} products
              </span>
            </div>
          </div>

          {/* Status Breakdown & Audit Logs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
            {/* Quotation Status Distribution (7 cols) */}
            <div className="lg:col-span-7 bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2.5">
                Quotation Lifecycle Distribution ({adminOverview.totalQuotations} Total Proposals)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(adminOverview.quoteStatusDistribution || adminOverview.quotationStatusDistribution || {}).map(([st, count]) => (
                  <div key={st} className="p-2 rounded-lg bg-slate-900/60 border border-slate-700/60 flex items-center justify-between">
                    <span className="text-xs text-slate-300">{st}</span>
                    <span className="text-xs font-bold font-mono text-blue-300">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Administrative Audit Stream (5 cols) */}
            <div className="lg:col-span-5 bg-slate-800/40 border border-slate-700/60 rounded-xl p-3.5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  Recent Audit Trail
                </h3>
                <span className="text-[10px] text-slate-400">Live Governance</span>
              </div>
              {adminAuditLogs.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No administrative configuration changes recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {adminAuditLogs.map((log) => (
                    <div key={log.id} className="text-xs p-1.5 rounded bg-slate-900/60 border border-slate-700/40 flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-blue-300 font-mono">[{log.entityType}]</span>{' '}
                        <span className="text-slate-200">{log.action}</span>
                        {log.details && <span className="text-[11px] text-slate-400 block truncate max-w-[200px]">{log.details}</span>}
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Finance & Operations Command Center (when user is FinanceOperations) ── */}
      {isFinance && financeSummary && (
        <div className="p-5 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Finance &amp; Operations Command Center</h2>
                <p className="text-[11px] text-slate-500">Live operational queues, inventory allocation deficits, and receivable balances</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="xs"
                icon={ShieldAlert}
                onClick={() => navigate('/workspace/approvals')}
              >
                Approval Queue ({financeSummary.pendingFinanceApprovalsCount})
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={Truck}
                onClick={() => navigate('/workspace/fulfillment')}
              >
                Fulfillment ({financeSummary.unallocatedOrdersCount})
              </Button>
              <Button
                variant="primary"
                size="xs"
                icon={FileText}
                onClick={() => navigate('/workspace/billing')}
              >
                Ledger &amp; Invoices
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-amber-600 block">Pending Finance Approvals</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {financeSummary.pendingFinanceApprovalsCount}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                ${(financeSummary.pendingFinanceApprovalsValue || 0).toFixed(2)} exposure
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-blue-600 block">Unallocated Orders</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {financeSummary.unallocatedOrdersCount}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Ready for warehouse split
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-rose-600 block">Open Backorders</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {financeSummary.openBackordersCount}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Deficit awaiting stock
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-purple-600 block">Net Outstanding A/R</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                ${(financeSummary.totalOutstandingInvoicesAmount || 0).toFixed(2)}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {financeSummary.activeSchedulesCount} active subscription(s)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Real-Time Financial & Governance KPI Grid ──────── */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Pipeline Value */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Pipeline</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${metrics.totalQuotedRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-semibold text-slate-800">{metrics.totalQuotes}</span> active proposals
          </div>
        </div>

        {/* Booked Revenue */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Booked Revenue</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            ${metrics.totalBookedRevenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{metrics.activeOrdersCount} orders confirmed</span>
          </div>
        </div>

        {/* Avg Gross Margin */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Avg Gross Margin</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.averageMarginPercent}%
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            <span className={`font-semibold ${metrics.averageMarginPercent >= 25 ? 'text-emerald-600' : 'text-amber-600'}`}>
              {metrics.averageMarginPercent >= 25 ? 'Healthy Target (>=25%)' : 'Margin Attention Required'}
            </span>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pending Approvals</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {metrics.pendingApprovalsCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
            <span>Requiring manager authorization</span>
          </div>
        </div>
      </div>

      {/* ── 3. Attention Required & Deal Health Surveillance ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Approvals Triage (8 cols if manager, or full width if items) */}
        <div className={healthSummary ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-slate-900">Attention Required: Pending Approvals</h2>
              </div>
              {pendingApprovals.length > 0 && (
                <Button
                  variant="link"
                  size="xs"
                  onClick={() => navigate('/workspace/approvals')}
                >
                  View Desk ({pendingApprovals.length})
                </Button>
              )}
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-800">All Approvals Clear</p>
                <p className="text-xs text-slate-400 mt-0.5">No pending discount violations awaiting authorization.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingApprovals.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-blue-600 font-mono">{req.quotationNumber}</span>
                        <span className="text-xs font-medium text-slate-900">{req.customerName}</span>
                        <span className="text-[11px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono">
                          {req.salesRepName}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {req.reason || 'Requested discount exceeds standard rep authorization ceiling.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <span className="block font-bold text-xs text-slate-900 font-mono">
                          ${(req.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <StatusBadge type="risk" value={req.riskScore || 0} />
                      </div>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => navigate(`/workspace/quotations/${req.quotationId || req.id}`)}
                      >
                        Review
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Deal Health Surveillance Radar (5 cols) */}
        {healthSummary && (
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden h-full flex flex-col">
              <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-semibold text-slate-900">Deal Health Radar</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Score:</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {healthSummary.healthScore}%
                  </span>
                </div>
              </div>

              <div className="p-4 space-y-3 flex-1 flex flex-col justify-around">
                <div className="p-3 rounded-lg border border-amber-200/80 bg-amber-50/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-amber-900 block">Stalled Quotations</span>
                    <span className="text-[11px] text-amber-700">Inactive &gt; 5 days without response</span>
                  </div>
                  <span className="text-lg font-bold text-amber-900 font-mono">
                    {healthSummary.stalledDealsCount || 0}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-rose-200/80 bg-rose-50/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-rose-900 block">Discount Anomalies</span>
                    <span className="text-[11px] text-rose-700">Discount &gt; 2σ standard deviation</span>
                  </div>
                  <span className="text-lg font-bold text-rose-900 font-mono">
                    {healthSummary.discountAnomaliesCount || 0}
                  </span>
                </div>

                <div className="p-3 rounded-lg border border-purple-200/80 bg-purple-50/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-purple-900 block">High Risk Proposals</span>
                    <span className="text-[11px] text-purple-700">Risk score &gt; 50 requiring director signoff</span>
                  </div>
                  <span className="text-lg font-bold text-purple-900 font-mono">
                    {healthSummary.highRiskDealsCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── 4. Pipeline Snapshot ───────────────────────────────── */}
      {pipelineOverview && pipelineOverview.stages && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-semibold text-slate-900">Pipeline Progression Snapshot</h2>
            </div>
            <Button
              variant="link"
              size="xs"
              icon={ArrowRight}
              onClick={() => navigate('/workspace/pipeline')}
            >
              Open Kanban Board
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {pipelineOverview.stages.map((st) => (
              <div
                key={st.stageName}
                onClick={() => navigate('/workspace/pipeline')}
                className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 hover:bg-blue-50/40 hover:border-blue-200 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStageBadgeColor(st.stageName)}`}>
                    {st.stageName}
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">{st.count}</span>
                </div>
                <div className="text-xs font-semibold text-slate-800 font-mono mt-1">
                  ${(st.totalValue || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. Recent Quotations & Deal Flow Table ─────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Quotations &amp; Deal Flow</h2>
            <p className="text-xs text-slate-500">Live proposals tracked under automated margin governance.</p>
          </div>
          <Button
            variant="outline"
            size="xs"
            onClick={() => navigate('/workspace/quotations')}
          >
            View All Quotations
          </Button>
        </div>

        <DataTable
          columns={quoteColumns}
          data={recentQuotes}
          onRowClick={(q) => navigate(`/workspace/quotations/${q.id}`)}
          emptyMessage="No active quotations found"
          emptyDescription="Start closing deals by building your first structured quote."
          emptyAction={
            <Button
              variant="primary"
              size="xs"
              icon={Plus}
              onClick={() => navigate('/workspace/quotations/new')}
            >
              New Quotation
            </Button>
          }
        />
      </div>
    </div>
  );
};

export default DashboardPage;
