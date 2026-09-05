import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { dealHealthApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  StatusBadge,
  DataTable,
  PageHeader,
  MetricCard,
  SkeletonDashboard,
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
  Bell,
  Send,
} from 'lucide-react';

export const DealHealthPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

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

  const handleNudgeRep = async (alert) => {
    const qId = alert.quotationId || alert.entityId;
    if (!qId) return;
    setActionLoadingId(`nudge-${qId}`);
    try {
      const res = await dealHealthApi.nudgeRep(qId, {
        message: `Surveillance Alert (${alert.signalType || 'Stalled'}): ${alert.message}`,
      });
      toast.success('Rep Nudged', res.message || 'Follow-up notification sent to sales representative.');
    } catch (err) {
      toast.error('Failed to nudge rep', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleEscalateDeal = async (alert) => {
    const qId = alert.quotationId || alert.entityId;
    if (!qId) return;
    setActionLoadingId(`esc-${qId}`);
    try {
      const res = await dealHealthApi.escalateDeal(qId, {
        reason: `Automated Risk Escalation: ${alert.message}`,
      });
      toast.success('Deal Escalated', res.message || 'Critical anomaly escalated to Sales Governance management.');
    } catch (err) {
      toast.error('Failed to escalate deal', err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
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
      header: 'Governance Actions',
      render: (a) => {
        const qId = a.quotationId || a.entityId;
        return (
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="xs"
              icon={Bell}
              isLoading={actionLoadingId === `nudge-${qId}`}
              onClick={() => handleNudgeRep(a)}
              className="text-amber-700 border-amber-200 hover:bg-amber-50"
            >
              Nudge Rep
            </Button>
            <Button
              variant="outline"
              size="xs"
              icon={ShieldAlert}
              isLoading={actionLoadingId === `esc-${qId}`}
              onClick={() => handleEscalateDeal(a)}
              className="text-rose-700 border-rose-200 hover:bg-rose-50"
            >
              Escalate
            </Button>
            <Button
              variant="outline"
              size="xs"
              icon={ArrowRight}
              onClick={() => navigate(`/workspace/quotations/${qId}`)}
            >
              Inspect
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Deal Health & Anomaly Radar"
        subtitle="Surveillance for stalled quotes (>5 days), rep discount outliers (>2σ), and delivery slippages."
        badge="Active Radar"
        badgeVariant="emerald"
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadHealthData}
          >
            Refresh Radar
          </Button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadHealthData} />}

      {/* Health Overview Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MetricCard
            label="Overall Health Score"
            value={`${summary.healthScore}%`}
            icon={Activity}
            variant="emerald"
            description={`${summary.healthyCount} of ${summary.totalActiveDeals} deals healthy`}
          />
          <MetricCard
            label="Stalled Opportunities"
            value={summary.stalledDealsCount || 0}
            icon={Clock}
            variant="amber"
            description=">5 days without customer touch"
          />
          <MetricCard
            label="Discount Anomalies"
            value={summary.discountAnomaliesCount || 0}
            icon={AlertTriangle}
            variant="rose"
            description=">2σ discount outliers detected"
          />
          <MetricCard
            label="High Risk Governance"
            value={summary.highRiskDealsCount || 0}
            icon={ShieldAlert}
            variant="indigo"
            description="Risk score > 50 threshold"
          />
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
