import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationApi } from '../api';
import { Button, StatusBadge, PageHeader, SkeletonDashboard, ErrorAlert } from '../components/ui';
import { RefreshCw } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

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
    return <SkeletonDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="CRM Deal Pipeline"
        subtitle="Stage-by-stage deal velocity, margin preservation, and conversion tracking."
        badge={`Total: ${formatCurrency(totalPipeline)}`}
        badgeVariant="indigo"
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadPipeline}
          >
            Refresh
          </Button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadPipeline} />}

      {/* Kanban Board Columns */}
      <div className="flex overflow-x-auto touch-scroll gap-4 items-start pb-6 snap-x snap-mandatory md:snap-none -mx-3 sm:mx-0 px-3 sm:px-0">
        {stages.map((stage) => {
          const stageQuotes = quotes.filter((q) => q.status === stage.key);
          const stageTotal = stageQuotes.reduce((sum, q) => sum + (q.grandTotal || 0), 0);

          return (
            <div
              key={stage.key}
              className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 w-[84vw] sm:w-[320px] md:w-[280px] lg:w-[300px] shrink-0 flex flex-col max-h-[75vh] shadow-2xs snap-center"
            >
              {/* Column Header */}
              <div className="pb-3 mb-3 border-b border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 truncate">{stage.title}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200/80 shadow-2xs">
                    {stageQuotes.length}
                  </span>
                </div>
                <div className="mt-1 text-[11px] font-mono text-slate-500 font-medium">
                  {formatCurrency(stageTotal)}
                </div>
              </div>

              {/* Cards Scrollable Area */}
              <div className="space-y-2.5 overflow-y-auto pr-1 touch-scroll">
                {stageQuotes.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs italic">
                    No deals in this stage
                  </div>
                ) : (
                  stageQuotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/workspace/quotations/${q.id}`)}
                      className="p-3.5 bg-white rounded-xl border border-slate-200/80 hover:border-blue-400 hover:shadow-xs transition-all cursor-pointer space-y-2 shadow-2xs"
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
                          {formatCurrency(q.grandTotal || 0, q.currency || 'INR')}
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
