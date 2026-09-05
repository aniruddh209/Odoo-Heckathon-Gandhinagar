import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationApi } from '../api';
import { Button, StatusBadge, LoadingSpinner, ErrorAlert } from '../components/ui';
import { RefreshCw } from 'lucide-react';

export const PipelinePage = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await quotationApi.getQuotations();
      const list = Array.isArray(res) ? res : res?.value || [];
      setQuotes(list);
    } catch (err) {
      setError(err.message || 'Failed to load pipeline.');
    } finally {
      setIsLoading(false);
    }
  };

  const stages = [
    { key: 'Draft', title: 'Draft Proposals', border: 'border-slate-300' },
    { key: 'PendingApproval', title: 'Pending Approval', border: 'border-amber-400' },
    { key: 'Approved', title: 'Approved / Ready', border: 'border-emerald-500' },
    { key: 'UnderNegotiation', title: 'Client Negotiation', border: 'border-purple-400' },
    { key: 'ConvertedToOrder', title: 'Confirmed Orders', border: 'border-indigo-500' },
  ];

  const totalPipeline = quotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);

  if (isLoading) {
    return <LoadingSpinner message="Aggregating sales pipeline stages..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">CRM Deal Pipeline</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Stage-by-stage deal velocity, margin preservation, and conversion tracking.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">Total Pipeline</span>
            <span className="text-base font-extrabold text-blue-700 font-mono block">
              ${totalPipeline.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadPipeline}
          >
            Refresh
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadPipeline} />}

      {/* Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start overflow-x-auto pb-6">
        {stages.map((stage) => {
          const stageQuotes = quotes.filter((q) => q.status === stage.key);
          const stageTotal = stageQuotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);

          return (
            <div
              key={stage.key}
              className="bg-slate-100/70 rounded-xl p-3 border border-slate-200/80 min-w-[240px] flex flex-col max-h-[75vh]"
            >
              {/* Column Header */}
              <div className="pb-3 mb-3 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{stage.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.2 rounded-full bg-white text-slate-600 border border-slate-200">
                    {stageQuotes.length}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-500 font-medium">
                  ${stageTotal.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                </div>
              </div>

              {/* Cards Scrollable Area */}
              <div className="space-y-2.5 overflow-y-auto pr-1">
                {stageQuotes.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No deals in this stage
                  </div>
                ) : (
                  stageQuotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/workspace/quotations/${q.id}`)}
                      className="p-3 bg-white rounded-lg border border-slate-200/80 hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-bold text-blue-600 truncate">
                          {q.quotationNumber}
                        </span>
                        <StatusBadge type="margin" value={q.marginPercent} />
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-slate-900 truncate">
                          {q.customerName}
                        </h4>
                        <span className="text-[11px] text-slate-500 block truncate">
                          Rep: {q.salesRepName}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 font-mono">
                          ${(q.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 0 })}
                        </span>
                        {q.riskScore > 0 ? (
                          <StatusBadge type="risk" value={q.riskScore} size="sm" />
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold">Low Risk</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelinePage;
