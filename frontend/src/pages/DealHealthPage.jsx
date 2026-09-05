import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealHealthApi } from '../api';
import {
  Button,
  StatusBadge,
  DataTable,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import {
  Activity,
  AlertTriangle,
  Clock,
  ShieldAlert,
  TrendingDown,
  RefreshCw,
  ArrowRight,
  Zap,
} from 'lucide-react';

export const DealHealthPage = () => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHealthData();
  }, []);

  const loadHealthData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await dealHealthApi.getDealHealthSummary();
      setSummary(res);
    } catch (err) {
      setError(err.message || 'Failed to query deal health surveillance telemetry.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Scanning active opportunities for risk signals and stalled quotes..." size="lg" />;
  }

  const alertColumns = [
    {
      header: 'Quote #',
      accessor: 'quotationNumber',
      render: (a) => (
        <span className="font-mono font-bold text-xs text-blue-600">
          {a.quotationNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (a) => <span className="font-semibold text-slate-900">{a.customerName || 'Direct Deal'}</span>,
    },
    {
      header: 'Signal Type',
      accessor: 'signalType',
      render: (a) => (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
          {a.signalType || a.alertType}
        </span>
      ),
    },
    {
      header: 'Severity',
      accessor: 'severity',
      render: (a) => {
        const colors = {
          Critical: 'bg-rose-50 text-rose-700 border-rose-200',
          High: 'bg-amber-50 text-amber-700 border-amber-200',
          Medium: 'bg-yellow-50 text-yellow-800 border-yellow-200',
          Low: 'bg-blue-50 text-blue-700 border-blue-200',
        };
        return (
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors[a.severity] || colors.Low}`}>
            {a.severity}
          </span>
        );
      },
    },
    {
      header: 'Risk Telemetry',
      accessor: 'message',
      render: (a) => <span className="text-xs text-slate-600">{a.message}</span>,
    },
    {
      header: 'Action',
      render: (a) => (
        <Button
          variant="outline"
          size="xs"
          onClick={() => navigate(`/workspace/quotations/${a.quotationId}`)}
        >
          Rescue Deal
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900">Deal Health &amp; Anomaly Radar</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Background Monitoring
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Surveillance for stalled quotes (&gt;5 days), rep discount standard deviation outliers (&gt;2σ), and delivery slippages.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={loadHealthData}
        >
          Refresh Radar
        </Button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadHealthData} />}

      {/* Health Overview Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-[10px] font-bold uppercase text-slate-400 block">Overall Health Score</span>
            <div className="text-2xl font-bold text-slate-900 mt-1 font-mono">
              {summary.healthScore}%
            </div>
            <span className="text-xs text-emerald-600 font-semibold mt-1 block">
              {summary.healthyCount} of {summary.totalActiveDeals} deals healthy
            </span>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs">
            <div className="flex items-center justify-between text-amber-800">
              <span className="text-[10px] font-bold uppercase block">Stalled Opportunities</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-bold text-amber-950 mt-1 font-mono">
              {summary.stalledDealsCount || 0}
            </div>
            <span className="text-xs text-amber-700 mt-1 block font-medium">
              &gt;5 days without customer touch
            </span>
          </div>

          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 shadow-xs">
            <div className="flex items-center justify-between text-rose-800">
              <span className="text-[10px] font-bold uppercase block">Discount Anomalies</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-bold text-rose-950 mt-1 font-mono">
              {summary.discountAnomaliesCount || 0}
            </div>
            <span className="text-xs text-rose-700 mt-1 block font-medium">
              &gt;2σ discount outliers detected
            </span>
          </div>

          <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40 shadow-xs">
            <div className="flex items-center justify-between text-purple-800">
              <span className="text-[10px] font-bold uppercase block">High Risk Governance</span>
              <ShieldAlert className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-950 mt-1 font-mono">
              {summary.highRiskDealsCount || 0}
            </div>
            <span className="text-xs text-purple-700 mt-1 block font-medium">
              Risk score &gt; 50 threshold
            </span>
          </div>
        </div>
      )}

      {/* Active Alerts Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Active Anomaly Signals &amp; Nudges</h2>
          <span className="text-xs text-slate-500 font-semibold">{summary?.alerts?.length || 0} alerts detected</span>
        </div>

        <DataTable
          columns={alertColumns}
          data={summary?.alerts || []}
          emptyMessage="No anomaly signals detected"
          emptyDescription="All deals are actively progressing within standard discount and cycle parameters."
        />
      </div>
    </div>
  );
};

export default DealHealthPage;
