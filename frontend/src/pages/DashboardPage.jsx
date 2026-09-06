import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quotationApi, reportApi, dealHealthApi, approvalApi, billingApi, adminApi } from '../api';
import {
  Button,
  StatusBadge,
  DataTable,
  MetricCard,
  PageHeader,
  SkeletonDashboard,
  ErrorAlert,
} from '../components/ui';
import {
  Plus,
  TrendingUp,
  AlertCircle,
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
  Layers,
  Activity,
  Package,
  IndianRupee,
} from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent, formatDate } from '../utils/formatters';

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

  const loadDashboardData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setError(null);

    try {
      // 1. Core Quotations stream
      const quotesRes = await quotationApi.getQuotations({ take: 20 });
      const quotesList = quotesRes.items || quotesRes.data || (Array.isArray(quotesRes) ? quotesRes : []);
      setRecentQuotes(quotesList.slice(0, 7));

      // 2. Authoritative Database Telemetry from Reports API
      const [metricsRes, pipeRes] = await Promise.all([
        reportApi.getDashboardMetrics(),
        reportApi.getPipelineOverview(),
      ]);

      if (metricsRes) {
        setMetrics({
          totalQuotedRevenue: metricsRes.totalQuotedRevenue ?? 0,
          totalBookedRevenue: metricsRes.totalBookedRevenue ?? 0,
          averageMarginPercent: metricsRes.averageMarginPercent ?? 0,
          averageRiskScore: metricsRes.averageRiskScore ?? 0,
          pendingApprovalsCount: metricsRes.pendingApprovalsCount ?? 0,
          activeOrdersCount: metricsRes.activeOrdersCount ?? 0,
          totalQuotes: metricsRes.totalQuotationsCount ?? quotesList.length,
        });
      }

      // 3. Pipeline Stages
      if (pipeRes && pipeRes.stages) {
        setPipelineOverview(pipeRes);
      }

      // 4. Deal Health Radar
      if (isSalesManager || isAdmin) {
        try {
          const healthRes = await dealHealthApi.getHealthSummary();
          setHealthSummary(healthRes);
        } catch {
          // Soft fail
        }
      }

      // 5. Approvals Attention Queue
      let retrievedApprovals = [];
      if (isSalesManager || isFinance || isAdmin) {
        try {
          const approvRes = await approvalApi.getPendingApprovals();
          const items = approvRes.items || approvRes.data || (Array.isArray(approvRes) ? approvRes : []);
          retrievedApprovals = items;
          setPendingApprovals(items.slice(0, 4));
        } catch {
          // Soft fail
        }
      }

      // 6. Finance Specific Summary
      if (isFinance) {
        try {
          const [invRes, schRes, orderRes] = await Promise.allSettled([
            billingApi.getInvoices({ take: 100 }),
            billingApi.getSubscriptionSchedules(),
            billingApi.getOrders({ take: 100 }),
          ]);

          const invoices = invRes.status === 'fulfilled' && invRes.value ? (invRes.value.items || invRes.value.data || (Array.isArray(invRes.value) ? invRes.value : [])) : [];
          const schedules = schRes.status === 'fulfilled' && schRes.value ? (schRes.value.items || schRes.value.data || (Array.isArray(schRes.value) ? schRes.value : [])) : [];
          const orders = orderRes.status === 'fulfilled' && orderRes.value ? (orderRes.value.items || orderRes.value.data || (Array.isArray(orderRes.value) ? orderRes.value : [])) : [];

          const totalOutstanding = invoices.reduce((s, inv) => s + (inv.amountOutstanding || inv.outstanding || 0), 0);
          const unallocatedCount = orders.filter((o) => o.status === 'Confirmed' || o.status === 'PartiallyAllocated').length;

          setFinanceSummary({
            totalInvoicesCount: invoices.length,
            totalOutstandingInvoicesAmount: totalOutstanding,
            activeSchedulesCount: schedules.filter((s) => s.status === 'Active' || s.isActive).length,
            unallocatedOrdersCount: unallocatedCount,
            openBackordersCount: 0,
            pendingFinanceApprovalsCount: retrievedApprovals.length,
            pendingFinanceApprovalsValue: retrievedApprovals.reduce((s, a) => s + (a.grandTotal || 0), 0),
          });
        } catch {
          // Soft fail
        }
      }

      // 7. Admin Executive Platform Overview & Live Audit Log
      if (isAdmin) {
        try {
          const [adminRes, auditRes] = await Promise.allSettled([
            adminApi.getAdminOverview(),
            adminApi.getAuditLogs(10),
          ]);

          if (adminRes.status === 'fulfilled' && adminRes.value) {
            setAdminOverview(adminRes.value);
          }
          if (auditRes.status === 'fulfilled' && auditRes.value) {
            const logs = auditRes.value.items || auditRes.value.data || (Array.isArray(auditRes.value) ? auditRes.value : []);
            setAdminAuditLogs(logs);
          }
        } catch {
          // Soft fail
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
      setError('Unable to synchronize operational telemetry. Viewing cached local calculations.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isSalesManager, isFinance, isAdmin]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading || isRefreshing) {
    return <SkeletonDashboard />;
  }

  const quoteColumns = [
    {
      header: 'Quote #',
      accessor: 'quotationNumber',
      render: (q) => (
        <span
          onClick={() => navigate(`/workspace/quotations/${q.id}`)}
          className="font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer font-mono"
        >
          {q.quotationNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (q) => (
        <div>
          <span className="font-semibold text-slate-900 block">{q.customerName}</span>
          <span className="text-[11px] text-slate-400 font-medium">
            Created: {formatDate(q.createdAtUtc)}
          </span>
        </div>
      ),
    },
    {
      header: 'Total Value',
      accessor: 'grandTotal',
      align: 'right',
      render: (q) => (
        <span className="font-bold text-slate-900 font-mono tracking-tight">
          {formatCurrency(q.grandTotal || 0)}
        </span>
      ),
    },
    {
      header: 'Gross Margin',
      accessor: 'marginPercent',
      align: 'center',
      render: (q) => <StatusBadge type="margin" value={q.marginPercent} />,
    },
    {
      header: 'Risk Score',
      accessor: 'riskScore',
      align: 'center',
      render: (q) => <StatusBadge type="risk" value={q.riskScore} />,
    },
    {
      header: 'Lifecycle State',
      accessor: 'status',
      align: 'center',
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
      case 'Draft': return 'bg-slate-50 text-slate-700 border-slate-200/80';
      case 'Sent': return 'bg-blue-50 text-blue-700 border-blue-200/80';
      case 'UnderNegotiation': return 'bg-purple-50 text-purple-700 border-purple-200/80';
      case 'PendingApproval': return 'bg-amber-50 text-amber-700 border-amber-200/80';
      case 'Approved': return 'bg-emerald-50 text-emerald-700 border-emerald-200/80';
      case 'ConvertedToOrder': return 'bg-indigo-50 text-indigo-700 border-indigo-200/80';
      case 'Rejected': return 'bg-rose-50 text-rose-700 border-rose-200/80';
      default: return 'bg-slate-50 text-slate-700 border-slate-200/80';
    }
  };

  return (
    <div className="space-y-8">
      {/* ── 1. Unified Page Header ───────────────────────────── */}
      <PageHeader
        title={`${getGreeting()}, ${user?.fullName?.split(' ')[0] || 'Team'}`}
        subtitle="Real-time margin governance, automated discount ceilings, and multi-depot fulfillment."
        badge={
          <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
            {user?.role || 'Live Governance'}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              isLoading={isRefreshing}
              onClick={() => loadDashboardData(true)}
            >
              Refresh Data
            </Button>
            {(isSalesRep || isSalesManager || isAdmin) && (
              <Button
                variant="primary"
                size="sm"
                icon={Plus}
                onClick={() => navigate('/workspace/quotations/new')}
              >
                Create Quotation
              </Button>
            )}
          </>
        }
      />

      {error && <ErrorAlert message={error} />}

      {/* ── 2. Admin Executive Platform Command Center (Rich White) ── */}
      {isAdmin && adminOverview && (
        <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-2xs">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
                  Admin Executive Command Center
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 font-semibold">
                    Platform Telemetry
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Global tenant health, organizational staffing, revenue realization, and catalog metrics
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="xs"
                icon={Package}
                onClick={() => navigate('/admin/products')}
              >
                Products &amp; Pricing
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={Layers}
                onClick={() => navigate('/admin/discounts')}
              >
                Governance Matrices
              </Button>
              <Button
                variant="outline"
                size="xs"
                icon={FileText}
                onClick={() => navigate('/workspace/reports')}
              >
                Revenue Reports
              </Button>
            </div>
          </div>

          {/* Key Admin Telemetry Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" /> Platform Staffing
              </span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {(adminOverview.totalSalesReps || 0) + (adminOverview.totalSalesManagers || 0) + (adminOverview.totalFinanceUsers || 0) + 1}{' '}
                <span className="text-xs font-normal text-slate-500">Staff Members</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {adminOverview.totalSalesReps} Reps · {adminOverview.totalSalesManagers} Mgrs · {adminOverview.totalFinanceUsers} Fin · {adminOverview.totalCustomers} Cust
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block flex items-center gap-1.5">
                <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Realized Revenue
              </span>
              <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
                {formatCurrency(adminOverview.totalPaid ?? adminOverview.totalCollectedRevenue ?? 0)}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {formatCurrency(adminOverview.totalInvoiced ?? adminOverview.totalInvoicedRevenue ?? 0)} invoiced to date
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-purple-600" /> Recurring Cadence
              </span>
              <div className="text-xl font-bold text-purple-700 font-mono mt-1">
                {formatCurrency(adminOverview.monthlyRecurringRevenue || 0)}{' '}
                <span className="text-xs font-normal text-slate-500">MRR</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {formatCurrency(adminOverview.annualRecurringRevenue || 0)} ARR run-rate
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-amber-600" /> Fulfillment &amp; Risk
              </span>
              <div className="text-xl font-bold text-amber-800 font-mono mt-1">
                {adminOverview.atRiskDealsCount}{' '}
                <span className="text-xs font-normal text-slate-500">At-Risk Deals</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {adminOverview.backordersCount ?? adminOverview.openBackordersCount ?? 0} backorders · {adminOverview.totalWarehouses} depots
              </span>
            </div>
          </div>

          {/* Status Breakdown & Audit Stream */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-1">
            <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Global Quotation Lifecycle ({adminOverview.totalQuotations} Proposals)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {Object.entries(adminOverview.quoteStatusDistribution || adminOverview.quotationStatusDistribution || {}).map(([st, count]) => (
                  <div key={st} className="p-2.5 rounded-lg bg-slate-50/80 border border-slate-200/70 flex items-center justify-between">
                    <span className="text-xs text-slate-700 font-medium">{st}</span>
                    <span className="text-xs font-bold font-mono text-blue-600">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-xl p-4 shadow-2xs">
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Audit Trail
                </h3>
                <span className="text-[10px] text-emerald-600 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200/60">Live</span>
              </div>
              {adminAuditLogs.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-400">
                  No administrative configuration changes recorded yet.
                </div>
              ) : (
                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {adminAuditLogs.map((log) => (
                    <div key={log.id} className="text-xs p-2 rounded-lg bg-slate-50/80 border border-slate-200/70 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <span className="font-semibold text-blue-700 font-mono">[{log.entityName || log.entityType}]</span>{' '}
                        <span className="text-slate-800">{log.action}</span>
                        {(log.reason || log.details) && (
                          <span className="text-[11px] text-slate-500 block truncate max-w-[220px]">
                            {log.reason || log.details}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                        {new Date(log.createdAtUtc || log.timestampUtc).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 3. Finance & Operations Command Center (Rich White) ── */}
      {isFinance && financeSummary && (
        <div className="p-6 rounded-2xl border border-slate-200/80 bg-white shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-600 flex items-center justify-center shadow-2xs">
                <Receipt className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Finance &amp; Operations Command Center</h2>
                <p className="text-[11px] text-slate-500">Operational queues, warehouse allocation deficits, and receivable balances</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Pending Finance Approvals</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {financeSummary.pendingFinanceApprovalsCount}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {formatCurrency(financeSummary.pendingFinanceApprovalsValue || 0)} exposure
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-blue-700 block">Unallocated Orders</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {financeSummary.unallocatedOrdersCount}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Ready for warehouse split
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-rose-700 block">Open Backorders</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {financeSummary.openBackordersCount}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                Deficit awaiting replenishment
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-bold text-purple-700 block">Net Outstanding A/R</span>
              <div className="text-xl font-bold text-slate-900 font-mono mt-1">
                {formatCurrency(financeSummary.totalOutstandingInvoicesAmount || 0)}
              </div>
              <span className="text-[11px] text-slate-500 block mt-0.5">
                {financeSummary.activeSchedulesCount} active subscription(s)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Standard Financial & Governance KPI Ribbon (Rich White & ₹ INR) ── */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <MetricCard
          label="Total Pipeline"
          value={formatCurrency(metrics.totalQuotedRevenue)}
          subtext={`${metrics.totalQuotes} active proposals`}
          icon={IndianRupee}
          variant="primary"
          onClick={() => navigate('/workspace/quotations')}
        />

        <MetricCard
          label="Booked Revenue"
          value={formatCurrency(metrics.totalBookedRevenue)}
          subtext={`${metrics.activeOrdersCount} orders confirmed`}
          icon={TrendingUp}
          variant="success"
          trend={{ value: 'Confirmed', isPositive: true }}
          onClick={() => navigate('/workspace/fulfillment')}
        />

        <MetricCard
          label="Average Gross Margin"
          value={formatPercent(metrics.averageMarginPercent)}
          subtext={metrics.totalQuotes === 0 ? 'No active proposals' : (metrics.averageMarginPercent >= 25 ? 'Target Exceeded (>=25%)' : 'Margin Attention Required')}
          icon={Percent}
          variant={metrics.totalQuotes === 0 ? 'default' : (metrics.averageMarginPercent >= 25 ? 'purple' : 'warning')}
        />

        <MetricCard
          label="Pending Approvals"
          value={metrics.pendingApprovalsCount}
          subtext="Requiring management authorization"
          icon={ShieldAlert}
          variant={metrics.pendingApprovalsCount > 0 ? 'warning' : 'default'}
          onClick={() => navigate('/workspace/approvals')}
        />
      </div>

      {/* ── 5. Operational Surveillance & Deal Health Radar ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Approvals Triage */}
        <div className={healthSummary ? 'lg:col-span-7 space-y-4' : 'lg:col-span-12 space-y-4'}>
          <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-bold text-slate-900">Attention Required: Pending Approvals</h2>
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
                <p className="text-xs font-bold text-slate-800">All Approvals Clear</p>
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
                        <span className="text-xs font-semibold text-slate-900">{req.customerName}</span>
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">
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
                          {formatCurrency(req.grandTotal || 0)}
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

        {/* Deal Health Surveillance Radar */}
        {healthSummary && (
          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs overflow-hidden h-full flex flex-col">
              <div className="px-5 py-4 bg-slate-50/70 border-b border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900">Deal Health Radar</h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400">Score:</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                    {healthSummary.healthScore}%
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-around">
                <div className="p-3.5 rounded-xl border border-amber-200/80 bg-amber-50/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">Stalled Quotations</span>
                    <span className="text-[11px] text-amber-700">Inactive &gt; 5 days without response</span>
                  </div>
                  <span className="text-lg font-bold text-amber-900 font-mono">
                    {healthSummary.stalledDealsCount || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200/80 bg-rose-50/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">Discount Anomalies</span>
                    <span className="text-[11px] text-rose-700">Discount &gt; 2σ standard deviation</span>
                  </div>
                  <span className="text-lg font-bold text-rose-900 font-mono">
                    {healthSummary.discountAnomaliesCount || 0}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl border border-purple-200/80 bg-purple-50/40 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-900 block">High Risk Proposals</span>
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

      {/* ── 6. Pipeline Progression Snapshot ──────────────────── */}
      {pipelineOverview && pipelineOverview.stages && (
        <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitPullRequest className="w-4 h-4 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">Pipeline Progression Snapshot</h2>
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
            {(pipelineOverview.stages.length > 0 ? pipelineOverview.stages : [
              { stageName: 'Draft', count: 0, totalValue: 0 },
              { stageName: 'Sent', count: 0, totalValue: 0 },
              { stageName: 'UnderNegotiation', count: 0, totalValue: 0 },
              { stageName: 'PendingApproval', count: 0, totalValue: 0 },
              { stageName: 'Approved', count: 0, totalValue: 0 },
              { stageName: 'ConvertedToOrder', count: 0, totalValue: 0 },
            ]).map((st) => (
              <div
                key={st.stageName}
                onClick={() => navigate('/workspace/pipeline')}
                className="p-3.5 rounded-xl border border-slate-200/70 bg-slate-50/60 hover:bg-blue-50/40 hover:border-blue-200/80 cursor-pointer transition-all duration-150 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStageBadgeColor(st.stageName)}`}>
                    {st.stageName}
                  </span>
                  <span className="text-xs font-bold text-slate-900 font-mono">{st.count}</span>
                </div>
                <div className="text-xs font-bold text-slate-800 font-mono mt-1">
                  {formatCurrency(st.totalValue || 0)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 7. Recent Quotations & Deal Flow Table ─────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Quotations &amp; Deal Flow</h2>
            <p className="text-xs text-slate-500">Latest business opportunities and draft agreements across your team</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={ArrowRight}
            onClick={() => navigate('/workspace/quotations')}
          >
            All Quotations
          </Button>
        </div>

        <DataTable
          columns={quoteColumns}
          data={recentQuotes}
          emptyMessage="No quotations generated yet. Click 'Create Quotation' to initiate a new enterprise deal."
          onRowClick={(q) => navigate(`/workspace/quotations/${q.id}`)}
        />
      </div>
    </div>
  );
};

export default DashboardPage;
