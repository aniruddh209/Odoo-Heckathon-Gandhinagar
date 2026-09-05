import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quotationApi, healthApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/common/Button';
import { StalledDealsFeed, AnomalyAlertCard } from '../components/deal-health';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  TrendingUp,
  DollarSign,
  FileText,
  AlertTriangle,
  Plus,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { QuotationDto, QuotationStatus, Role } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const { data: quotesData, isLoading: isLoadingQuotes } = useQuery({
    queryKey: ['dashboard-quotes'],
    queryFn: () => quotationApi.getQuotations({ PageNumber: 1, PageSize: 6 }),
  });

  const { data: alerts = [] } = useQuery({
    queryKey: ['deal-alerts'],
    queryFn: () => healthApi.getDealAlerts(),
  });

  const { data: anomalies = [] } = useQuery({
    queryKey: ['rep-anomalies'],
    queryFn: () => healthApi.getRepAnomalies(),
    enabled: hasRole([Role.SalesManager, Role.FinanceOperations, Role.Admin]),
  });

  const quotes = quotesData?.Items || [];

  // Derived metrics
  const totalPipeline = quotes.reduce((acc: number, q: QuotationDto) => acc + (q.TotalAmount ?? q.totalNetAmount ?? 0), 0);
  const avgMargin = quotes.length
    ? quotes.reduce((acc: number, q: QuotationDto) => acc + (q.OrderGrossMarginPercent ?? 28), 0) / quotes.length
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {user?.FullName || 'Colleague'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            DealFlow360 Live Commercial Pipeline, Policy Governance & Margin Cockpit
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button onClick={() => navigate('/quotations/new')}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Quotation
          </Button>
          {hasRole([Role.SalesManager, Role.FinanceOperations, Role.Admin]) && (
            <Button variant="outline" onClick={() => navigate('/approvals')}>
              <ShieldCheck className="w-4 h-4 mr-1.5" />
              Approvals Inbox
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Pipeline</span>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            ${totalPipeline.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </div>
          <span className="text-xs text-emerald-600 font-semibold flex items-center mt-1">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            Live contract valuation
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Deal Margin</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {avgMargin.toFixed(1)}%
          </div>
          <span className="text-xs text-slate-500 mt-1 block">
            Target threshold: <strong className="text-slate-700">25.0%</strong>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Quotation Flow</span>
            <FileText className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {quotesData?.TotalCount ?? quotes.length}
          </div>
          <span className="text-xs text-slate-500 mt-1 block">Across all stages</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SLA Risk Deals</span>
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">
            {alerts.length}
          </div>
          <span className="text-xs text-amber-600 mt-1 block">Stalled past SLA limit</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Recent Commercial Quotations</h3>
              <p className="text-xs text-slate-500">Live draft, review, and customer negotiation cycles</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/quotations')}>
              View All
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoadingQuotes ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : quotes.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No quotations found in current cycle. Click &quot;New Quotation&quot; to begin.
              </div>
            ) : (
              quotes.map((quote: QuotationDto) => (
                <div
                  key={quote.Id}
                  onClick={() => navigate(`/quotations/${quote.Id}`)}
                  className="p-4 hover:bg-slate-50/80 cursor-pointer transition-colors flex items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{quote.QuotationNumber}</span>
                      <span className="text-xs text-slate-400">•</span>
                      <span className="text-xs font-semibold text-slate-700">{quote.CustomerName}</span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-slate-400">
                      <span>Expires: {quote.ExpirationDate ? new Date(quote.ExpirationDate).toLocaleDateString() : 'N/A'}</span>
                      {quote.OrderGrossMarginPercent !== undefined && (
                        <span>Margin: <strong className="text-slate-600">{quote.OrderGrossMarginPercent.toFixed(1)}%</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      ${(quote.TotalAmount ?? quote.totalNetAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                        quote.Status === QuotationStatus.Accepted || quote.Status === QuotationStatus.Ordered
                          ? 'bg-emerald-100 text-emerald-800'
                          : quote.Status === QuotationStatus.InReview
                          ? 'bg-amber-100 text-amber-800'
                          : quote.Status === QuotationStatus.SentToCustomer
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {quote.Status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <StalledDealsFeed alerts={alerts} />

          {anomalies.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Rep Behavior Anomalies
                </h4>
                <span className="text-xs text-rose-600 font-semibold">{anomalies.length} Flagged</span>
              </div>
              {anomalies.slice(0, 2).map((a) => (
                <AnomalyAlertCard key={a.RepId} anomaly={a} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
