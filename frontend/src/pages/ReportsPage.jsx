import React, { useState, useEffect, useMemo } from 'react';
import { reportApi, quotationApi, adminApi } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  Button,
  StatusBadge,
  DataTable,
  PageHeader,
  MetricCard,
  SkeletonDashboard,
  ErrorAlert,
  Badge,
} from '../components/ui';
import { Download, RefreshCw, Filter, Layers, DollarSign, TrendingUp, ShieldAlert, CheckCircle2, FileText, Users } from 'lucide-react';

export const ReportsPage = () => {
  const { isAdmin, isSalesManager, isFinance } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [platformOverview, setPlatformOverview] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Multi-Filter State
  const [selectedSalesRep, setSelectedSalesRep] = useState('');
  const [selectedTier, setSelectedTier] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('all'); // all, 7d, 30d, 90d

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [metricsRes, quotesRes, tiersRes, overviewRes] = await Promise.all([
        reportApi.getDashboardMetrics(),
        quotationApi.getQuotations(),
        adminApi.getCustomerTiers().catch(() => []),
        (isAdmin || isSalesManager) ? adminApi.getPlatformOverview().catch(() => null) : Promise.resolve(null),
      ]);

      setMetrics(metricsRes);
      setQuotes(Array.isArray(quotesRes) ? quotesRes : quotesRes?.value || []);
      setTiers(Array.isArray(tiersRes) ? tiersRes : tiersRes?.value || []);
      setPlatformOverview(overviewRes);
    } catch (err) {
      setError(err.message || 'Failed to aggregate sales operations report.');
    } finally {
      setIsLoading(false);
    }
  };

  // Distinct sales reps from quotes
  const salesRepsList = useMemo(() => {
    const map = new Map();
    quotes.forEach((q) => {
      if (q.salesRepName) {
        map.set(q.salesRepName, q.salesRepName);
      }
    });
    return Array.from(map.values()).sort();
  }, [quotes]);

  // Distinct customer tiers from quotes or tier table
  const tierOptions = useMemo(() => {
    const set = new Set();
    tiers.forEach((t) => set.add(t.name));
    quotes.forEach((q) => {
      if (q.customerTierName) set.add(q.customerTierName);
    });
    return Array.from(set).sort();
  }, [tiers, quotes]);

  // Filtered quotes based on multi-filter selections
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      // Sales Rep filter
      if (selectedSalesRep && q.salesRepName !== selectedSalesRep) return false;

      // Tier filter
      if (selectedTier && (q.customerTierName || 'Standard') !== selectedTier) return false;

      // Status filter
      if (selectedStatus && q.status !== selectedStatus) return false;

      // Period filter
      if (selectedPeriod !== 'all' && q.createdAtUtc) {
        const quoteDate = new Date(q.createdAtUtc);
        const now = new Date();
        const diffDays = (now - quoteDate) / (1000 * 60 * 60 * 24);
        if (selectedPeriod === '7d' && diffDays > 7) return false;
        if (selectedPeriod === '30d' && diffDays > 30) return false;
        if (selectedPeriod === '90d' && diffDays > 90) return false;
      }

      return true;
    });
  }, [quotes, selectedSalesRep, selectedTier, selectedStatus, selectedPeriod]);

  // Dynamic metrics recalculated based on filtered quotes
  const filteredMetrics = useMemo(() => {
    const totalCount = filteredQuotes.length;
    const totalQuoted = filteredQuotes.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
    const bookedQuotes = filteredQuotes.filter((q) => q.status === 'ConvertedToOrder');
    const totalBooked = bookedQuotes.reduce((acc, q) => acc + (q.grandTotal || 0), 0);
    const avgMargin = totalCount > 0
      ? filteredQuotes.reduce((acc, q) => acc + (q.marginPercent || 0), 0) / totalCount
      : 0;
    const avgRisk = totalCount > 0
      ? filteredQuotes.reduce((acc, q) => acc + (q.riskScore || 0), 0) / totalCount
      : 0;

    // Status distribution in filtered dataset
    const statusDist = {};
    filteredQuotes.forEach((q) => {
      const st = q.status || 'Draft';
      statusDist[st] = (statusDist[st] || 0) + 1;
    });

    return {
      totalCount,
      totalQuoted,
      totalBooked,
      ordersCount: bookedQuotes.length,
      avgMargin: Math.round(avgMargin * 10) / 10,
      avgRisk: Math.round(avgRisk * 10) / 10,
      statusDist,
    };
  }, [filteredQuotes]);

  // Tier performance grouping on filtered quotes
  const tierSummary = useMemo(() => {
    return filteredQuotes.reduce((acc, q) => {
      const tier = q.customerTierName || 'Standard';
      if (!acc[tier]) acc[tier] = { count: 0, total: 0, marginSum: 0, booked: 0 };
      acc[tier].count += 1;
      acc[tier].total += q.grandTotal || 0;
      acc[tier].marginSum += q.marginPercent || 0;
      if (q.status === 'ConvertedToOrder') acc[tier].booked += q.grandTotal || 0;
      return acc;
    }, {});
  }, [filteredQuotes]);

  const handleExportCSV = () => {
    if (!filteredQuotes.length) return;
    const headers = ['QuotationNumber,CustomerName,SalesRepName,CustomerTier,Status,GrandTotal,MarginPercent,RiskScore,CreatedAtUtc'];
    const rows = filteredQuotes.map((q) =>
      `"${q.quotationNumber}","${q.customerName}","${q.salesRepName}","${q.customerTierName || 'Standard'}","${q.status}",${q.grandTotal},${q.marginPercent},${q.riskScore},"${q.createdAtUtc}"`
    );
    const blob = new Blob([[headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealflow360-filtered-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const clearFilters = () => {
    setSelectedSalesRep('');
    setSelectedTier('');
    setSelectedStatus('');
    setSelectedPeriod('all');
  };

  const hasActiveFilters = selectedSalesRep || selectedTier || selectedStatus || selectedPeriod !== 'all';

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const tierColumns = [
    {
      header: 'Customer Tier',
      accessor: 'tier',
      render: (t) => <span className="font-bold text-slate-900">{t.tier} Tier</span>,
    },
    {
      header: 'Proposals Count',
      accessor: 'count',
      render: (t) => <span className="font-semibold text-slate-700 font-mono">{t.count} Deals</span>,
    },
    {
      header: 'Quoted Volume',
      accessor: 'total',
      render: (t) => (
        <span className="font-bold text-slate-900 font-mono">
          ${t.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Booked Revenue',
      accessor: 'booked',
      render: (t) => (
        <span className="font-semibold text-emerald-700 font-mono">
          ${t.booked.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Avg Margin',
      accessor: 'avgMargin',
      render: (t) => <StatusBadge type="margin" value={t.avgMargin} />,
    },
  ];

  const tierData = Object.entries(tierSummary).map(([tier, val]) => ({
    tier,
    count: val.count,
    total: val.total,
    booked: val.booked,
    avgMargin: val.count > 0 ? val.marginSum / val.count : 0,
  }));

  const quoteColumns = [
    {
      header: 'Quote #',
      accessor: 'quotationNumber',
      render: (q) => <span className="font-mono font-bold text-blue-600">{q.quotationNumber}</span>,
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (q) => (
        <div>
          <span className="font-medium text-slate-900 block">{q.customerName}</span>
          <span className="text-[11px] text-slate-400">{q.customerTierName || 'Standard'} Tier</span>
        </div>
      ),
    },
    {
      header: 'Sales Rep',
      accessor: 'salesRepName',
      render: (q) => <span className="text-slate-700 font-medium">{q.salesRepName}</span>,
    },
    {
      header: 'Total Value',
      accessor: 'grandTotal',
      render: (q) => (
        <span className="font-mono font-bold text-slate-900">
          ${(q.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Margin',
      accessor: 'marginPercent',
      render: (q) => <StatusBadge type="margin" value={q.marginPercent} />,
    },
    {
      header: 'Risk',
      accessor: 'riskScore',
      render: (q) => <StatusBadge type="risk" value={q.riskScore} />,
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (q) => <StatusBadge status={q.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Platform Analytics & Revenue Intelligence"
        subtitle="Operational revenue governance, subscription MRR/ARR run-rates, and multi-filter margin compliance audits."
        badge={`${filteredQuotes.length} Deals Analyzed`}
        actions={
          <div className="flex items-center gap-2.5">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadReports}>
              Refresh
            </Button>
            <Button variant="primary" size="sm" icon={Download} onClick={handleExportCSV}>
              Export Filtered CSV ({filteredQuotes.length})
            </Button>
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadReports} />}

      {/* Platform-Wide Executive Telemetry (if Admin or PlatformOverview available) */}
      {platformOverview && (
        <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-700">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Platform-Wide Executive Revenue Run-Rate
            </span>
            <span className="text-[11px] text-slate-400">Database Ground Truth · Real Aggregations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Quoted</span>
              <div className="text-base font-bold text-white font-mono mt-0.5">
                ${(platformOverview.totalQuotedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400">{platformOverview.totalQuotations} quotes</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Total Booked</span>
              <div className="text-base font-bold text-emerald-400 font-mono mt-0.5">
                ${(platformOverview.totalBookedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-emerald-300/80">{platformOverview.totalOrders} sale orders</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Invoiced / Collected</span>
              <div className="text-base font-bold text-blue-300 font-mono mt-0.5">
                ${(platformOverview.totalCollectedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-slate-400">${(platformOverview.totalInvoicedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} invoiced</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Monthly Recurring (MRR)</span>
              <div className="text-base font-bold text-purple-300 font-mono mt-0.5">
                ${(platformOverview.monthlyRecurringRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
              <span className="text-[10px] text-purple-200/80">${(platformOverview.annualRecurringRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })} ARR</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">At-Risk Deals</span>
              <div className="text-base font-bold text-rose-400 font-mono mt-0.5">
                {platformOverview.atRiskDealsCount}
              </div>
              <span className="text-[10px] text-rose-300/80">Risk Score &gt; 50</span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Backorders &amp; Depots</span>
              <div className="text-base font-bold text-amber-300 font-mono mt-0.5">
                {platformOverview.backordersCount ?? platformOverview.openBackordersCount ?? 0} <span className="text-xs font-normal text-slate-400">BOs</span>
              </div>
              <span className="text-[10px] text-slate-400">{platformOverview.totalWarehouses} warehouses</span>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-blue-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Multi-Dimension Audit Filters
            </h2>
            {hasActiveFilters && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Active Filter Applied
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="xs" onClick={clearFilters}>
              Reset Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Sales Rep Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Sales Rep</label>
            <select
              value={selectedSalesRep}
              onChange={(e) => setSelectedSalesRep(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Sales Representatives</option>
              {salesRepsList.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Tier Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Tier</label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Customer Tiers</option>
              {tierOptions.map((t) => (
                <option key={t} value={t}>
                  {t} Tier
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lifecycle Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="Draft">Draft</option>
              <option value="Sent">Sent</option>
              <option value="UnderNegotiation">Under Negotiation</option>
              <option value="PendingApproval">Pending Approval</option>
              <option value="Approved">Approved</option>
              <option value="ConvertedToOrder">Converted To Order</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* Date Period Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Creation Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Dynamic Recalculated KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Filtered Volume"
          value={`$${filteredMetrics.totalQuoted.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          icon={DollarSign}
          variant="indigo"
          description={`${filteredMetrics.totalCount} Matching Proposals`}
        />
        <MetricCard
          label="Filtered Booked"
          value={`$${filteredMetrics.totalBooked.toLocaleString('en-US', { minimumFractionDigits: 0 })}`}
          icon={TrendingUp}
          variant="emerald"
          description={`${filteredMetrics.ordersCount} Confirmed Orders`}
        />
        <MetricCard
          label="Average Deal Margin"
          value={`${filteredMetrics.avgMargin}%`}
          icon={Layers}
          variant="purple"
          description="Realized Margin Preservation"
        />
        <MetricCard
          label="Average Risk Score"
          value={filteredMetrics.avgRisk}
          icon={ShieldAlert}
          variant="amber"
          description="Governance Risk Rating"
        />
      </div>

      {/* Quotation Status Distribution Breakdown */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
          Filtered Quotation Lifecycle Distribution
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { st: 'Draft', label: 'Draft' },
            { st: 'Sent', label: 'Sent' },
            { st: 'UnderNegotiation', label: 'Negotiation' },
            { st: 'PendingApproval', label: 'Pending Appr' },
            { st: 'Approved', label: 'Approved' },
            { st: 'ConvertedToOrder', label: 'Ordered' },
            { st: 'Rejected', label: 'Rejected' },
          ].map(({ st, label }) => {
            const count = filteredMetrics.statusDist[st] || 0;
            return (
              <div
                key={st}
                onClick={() => setSelectedStatus(selectedStatus === st ? '' : st)}
                className={`p-2.5 rounded-lg border text-center cursor-pointer transition-all ${
                  selectedStatus === st
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                    : 'border-slate-100 bg-slate-50/70 hover:border-slate-200 hover:bg-slate-100/50'
                }`}
              >
                <span className="text-[11px] font-semibold text-slate-600 block">{label}</span>
                <span className="text-base font-bold font-mono text-slate-900 mt-0.5 block">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Tier Margin Performance */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Tier-Based Margin Discipline</h2>
          <span className="text-xs text-slate-500">Ceiling governance results</span>
        </div>

        <DataTable
          columns={tierColumns}
          data={tierData}
          emptyMessage="No tier data available"
          emptyDescription="Proposals will populate tier metrics once created."
        />
      </div>

      {/* Filtered Quotations Detail Audit Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Filtered Deal Pipeline Audit</h2>
            <p className="text-xs text-slate-500">Individual proposals matching active filter criteria.</p>
          </div>
          <span className="text-xs text-slate-500 font-mono font-semibold">
            Showing {filteredQuotes.length} of {quotes.length} total quotes
          </span>
        </div>

        <DataTable
          columns={quoteColumns}
          data={filteredQuotes}
          emptyMessage="No quotations match filter criteria"
          emptyDescription="Try broadening your sales rep, customer tier, or date range filters."
        />
      </div>
    </div>
  );
};

export default ReportsPage;
