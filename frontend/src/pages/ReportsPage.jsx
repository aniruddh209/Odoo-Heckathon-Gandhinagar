import React, { useState, useEffect, useMemo } from 'react';
import { reportApi, quotationApi, adminApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Button,
  StatusBadge,
  DataTable,
  PageHeader,
  MetricCard,
  SkeletonDashboard,
  ErrorAlert,
  Badge,
  Select,
} from '../components/ui';
import { Download, RefreshCw, Filter, Layers, IndianRupee, TrendingUp, ShieldAlert, CheckCircle2, FileText, Users } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercent } from '../utils/formatters';

export const ReportsPage = () => {
  const { isAdmin, isSalesManager, isFinance } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [platformOverview, setPlatformOverview] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportingXls, setIsExportingXls] = useState(false);
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
        adminApi.getCustomerTiers(),
        (isAdmin || isSalesManager) ? adminApi.getPlatformOverview() : Promise.resolve(null),
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

  const handleExportPDF = async () => {
    setIsExportingPdf(true);
    try {
      await reportApi.downloadPdf();
      toast.success('PDF Export Successful', 'Executive Sales & Pipeline report PDF generated.');
    } catch (err) {
      toast.error('PDF Export Failed', err.message);
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportXLS = async () => {
    setIsExportingXls(true);
    try {
      await reportApi.downloadXls();
      toast.success('XLS Export Successful', 'Sales Operations and KPIs spreadsheet generated.');
    } catch (err) {
      toast.error('XLS Export Failed', err.message);
    } finally {
      setIsExportingXls(false);
    }
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
          {formatCurrency(t.total)}
        </span>
      ),
    },
    {
      header: 'Booked Revenue',
      accessor: 'booked',
      render: (t) => (
        <span className="font-semibold text-emerald-700 font-mono">
          {formatCurrency(t.booked)}
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
          {formatCurrency(q.grandTotal || 0)}
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
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadReports}>
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              isLoading={isExportingPdf}
              onClick={handleExportPDF}
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              isLoading={isExportingXls}
              onClick={handleExportXLS}
            >
              Export XLS
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
        <div className="p-5 rounded-xl border border-slate-200/80 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-blue-600" /> Platform-Wide Executive Revenue Run-Rate
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Database Ground Truth · Real Aggregations</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3 rounded-lg bg-slate-50/70 border border-slate-200/80">
              <span className="text-[10px] uppercase font-semibold text-slate-500 block">Total Quoted</span>
              <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                {formatCurrency(platformOverview.totalQuotedRevenue || 0)}
              </div>
              <span className="text-[10px] text-slate-500">{platformOverview.totalQuotations} quotes</span>
            </div>

            <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100">
              <span className="text-[10px] uppercase font-semibold text-emerald-700 block">Total Booked</span>
              <div className="text-base font-bold text-emerald-800 font-mono mt-0.5">
                {formatCurrency(platformOverview.totalBookedRevenue || 0)}
              </div>
              <span className="text-[10px] text-emerald-600 font-medium">{platformOverview.totalOrders} sale orders</span>
            </div>

            <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-100">
              <span className="text-[10px] uppercase font-semibold text-blue-700 block">Invoiced / Collected</span>
              <div className="text-base font-bold text-blue-900 font-mono mt-0.5">
                {formatCurrency(platformOverview.totalCollectedRevenue || 0)}
              </div>
              <span className="text-[10px] text-blue-600">{formatCurrency(platformOverview.totalInvoicedRevenue || 0)} invoiced</span>
            </div>

            <div className="p-3 rounded-lg bg-purple-50/50 border border-purple-100">
              <span className="text-[10px] uppercase font-semibold text-purple-700 block">Monthly Recurring (MRR)</span>
              <div className="text-base font-bold text-purple-900 font-mono mt-0.5">
                {formatCurrency(platformOverview.monthlyRecurringRevenue || 0)}
              </div>
              <span className="text-[10px] text-purple-600">{formatCurrency(platformOverview.annualRecurringRevenue || 0)} ARR</span>
            </div>

            <div className="p-3 rounded-lg bg-rose-50/50 border border-rose-100">
              <span className="text-[10px] uppercase font-semibold text-rose-700 block">At-Risk Deals</span>
              <div className="text-base font-bold text-rose-800 font-mono mt-0.5">
                {platformOverview.atRiskDealsCount}
              </div>
              <span className="text-[10px] text-rose-600 font-medium">Risk Score &gt; 50</span>
            </div>

            <div className="p-3 rounded-lg bg-amber-50/50 border border-amber-100">
              <span className="text-[10px] uppercase font-semibold text-amber-800 block">Backorders &amp; Depots</span>
              <div className="text-base font-bold text-amber-900 font-mono mt-0.5">
                {platformOverview.backordersCount ?? platformOverview.openBackordersCount ?? 0} <span className="text-xs font-normal text-amber-700">BOs</span>
              </div>
              <span className="text-[10px] text-amber-700">{platformOverview.totalWarehouses} warehouses</span>
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
            <Select
              value={selectedSalesRep}
              onChange={(e) => setSelectedSalesRep(e.target.value)}
              options={[
                { value: '', label: 'All Sales Representatives' },
                ...salesRepsList.map((rep) => ({ value: rep, label: rep })),
              ]}
            />
          </div>

          {/* Customer Tier Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Customer Tier</label>
            <Select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              options={[
                { value: '', label: 'All Customer Tiers' },
                ...tierOptions.map((t) => ({ value: t, label: `${t} Tier` })),
              ]}
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Lifecycle Status</label>
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Draft', label: 'Draft' },
                { value: 'Sent', label: 'Sent' },
                { value: 'UnderNegotiation', label: 'Under Negotiation' },
                { value: 'PendingApproval', label: 'Pending Approval' },
                { value: 'Approved', label: 'Approved' },
                { value: 'ConvertedToOrder', label: 'Converted To Order' },
                { value: 'Rejected', label: 'Rejected' },
              ]}
            />
          </div>

          {/* Date Period Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">Creation Period</label>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={[
                { value: 'all', label: 'All Time' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
                { value: '90d', label: 'Last 90 Days' },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Recalculated KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <MetricCard
          label="Filtered Volume"
          value={formatCurrency(filteredMetrics.totalQuoted)}
          icon={IndianRupee}
          variant="indigo"
          description={`${filteredMetrics.totalCount} Matching Proposals`}
        />
        <MetricCard
          label="Filtered Booked"
          value={formatCurrency(filteredMetrics.totalBooked)}
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
