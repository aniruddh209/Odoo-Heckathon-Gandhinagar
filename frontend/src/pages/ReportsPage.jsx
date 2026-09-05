import React, { useState, useEffect } from 'react';
import { reportApi, quotationApi } from '../api';
import { Button, StatusBadge, DataTable, LoadingSpinner, ErrorAlert } from '../components/ui';
import { Download, RefreshCw } from 'lucide-react';

export const ReportsPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [metricsRes, quotesRes] = await Promise.all([
        reportApi.getDashboardMetrics(),
        quotationApi.getQuotations(),
      ]);

      setMetrics(metricsRes);
      setQuotes(Array.isArray(quotesRes) ? quotesRes : quotesRes?.value || []);
    } catch (err) {
      setError(err.message || 'Failed to aggregate sales operations report.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!quotes.length) return;
    const headers = ['QuotationNumber,CustomerName,SalesRepName,Status,GrandTotal,MarginPercent,RiskScore,CreatedAtUtc'];
    const rows = quotes.map((q) =>
      `"${q.quotationNumber}","${q.customerName}","${q.salesRepName}","${q.status}",${q.grandTotal},${q.marginPercent},${q.riskScore},"${q.createdAtUtc}"`
    );
    const blob = new Blob([[...headers, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dealflow360-sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  if (isLoading) {
    return <LoadingSpinner message="Generating executive performance audit..." size="lg" />;
  }

  // Tier performance grouping
  const tierSummary = quotes.reduce((acc, q) => {
    const tier = q.customerTierName || 'Standard';
    if (!acc[tier]) acc[tier] = { count: 0, total: 0, marginSum: 0 };
    acc[tier].count += 1;
    acc[tier].total += q.grandTotal || 0;
    acc[tier].marginSum += q.marginPercent || 0;
    return acc;
  }, {});

  const tierColumns = [
    {
      header: 'Customer Tier',
      accessor: 'tier',
      render: (t) => <span className="font-bold text-slate-900">{t.tier} Tier</span>,
    },
    {
      header: 'Proposals Count',
      accessor: 'count',
      render: (t) => <span className="font-semibold text-slate-700">{t.count} Deals</span>,
    },
    {
      header: 'Aggregate Quoted Revenue',
      accessor: 'total',
      render: (t) => (
        <span className="font-bold text-slate-900 font-mono">
          ${t.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Realized Gross Margin',
      accessor: 'avgMargin',
      render: (t) => <StatusBadge type="margin" value={t.avgMargin} />,
    },
  ];

  const tierData = Object.entries(tierSummary).map(([tier, val]) => ({
    tier,
    count: val.count,
    total: val.total,
    avgMargin: val.count > 0 ? val.marginSum / val.count : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Sales Intelligence &amp; Performance Audit</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational revenue governance, margin preservation, and discount compliance metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadReports}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export CSV / XLS
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadReports} />}

      {/* Primary KPI Ribbon */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Quoted Volume</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ${(metrics.totalQuotedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              {metrics.totalQuotationsCount} Total Proposals
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Booked Revenue</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ${(metrics.totalBookedRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
              Confirmed Sale Orders
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Average Deal Margin</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {metrics.averageMarginPercent}%
            </div>
            <span className="text-xs text-purple-600 font-semibold mt-1 block">
              Protected Gross Margin
            </span>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Invoiced &amp; Collected</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              ${(metrics.totalPaid || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </div>
            <span className="text-xs text-slate-500 mt-1 block">
              Total Invoiced: ${(metrics.totalInvoiced || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default ReportsPage;
