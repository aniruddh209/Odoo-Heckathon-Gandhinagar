import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationApi } from '../api';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Plus } from 'lucide-react';
import { QuotationStatus } from '../types';

const COLUMNS = [
  {
    id: 'draft',
    title: 'Draft & Pricing',
    statuses: [QuotationStatus.Draft],
    color: 'border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'in_review',
    title: 'Governance Review',
    statuses: [QuotationStatus.InReview],
    color: 'border-amber-400',
    badgeBg: 'bg-amber-100 text-amber-800',
  },
  {
    id: 'sent',
    title: 'Customer Negotiation',
    statuses: [QuotationStatus.SentToCustomer, QuotationStatus.Approved],
    color: 'border-blue-400',
    badgeBg: 'bg-blue-100 text-blue-800',
  },
  {
    id: 'accepted',
    title: 'Accepted / Bound',
    statuses: [QuotationStatus.Accepted],
    color: 'border-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-800',
  },
  {
    id: 'ordered',
    title: 'Converted to Order',
    statuses: [QuotationStatus.Ordered],
    color: 'border-purple-400',
    badgeBg: 'bg-purple-100 text-purple-800',
  },
];

export const PipelinePage = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    quotationApi.getQuotations({ PageNumber: 1, PageSize: 100 })
      .then((data) => {
        if (isMounted) {
          setQuotes(data?.Items || []);
        }
      })
      .catch((err) => console.error('Error fetching pipeline deals:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Commercial Deal Pipeline</h1>
          <p className="text-xs text-slate-500">
            Real-time stage velocity across quotation life cycle
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate('/quotations')}>
            Table View
          </Button>
          <Button onClick={() => navigate('/quotations/new')}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Quotation
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {COLUMNS.map((col) => {
            const columnQuotes = quotes.filter((q) => {
              const st = q.Status || q.status;
              return st ? col.statuses.includes(st) : false;
            });
            const columnTotal = columnQuotes.reduce((sum, q) => sum + (q.TotalAmount ?? q.totalNetAmount ?? 0), 0);

            return (
              <div key={col.id} className="flex flex-col bg-slate-100/70 rounded-xl p-3 border border-slate-200 min-w-[260px]">
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                      {col.title}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                      {columnQuotes.length}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 font-mono py-1.5 font-semibold">
                  Total: ${columnTotal.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>

                {/* Cards */}
                <div className="space-y-3 mt-2 flex-1">
                  {columnQuotes.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-lg">
                      No deals
                    </div>
                  ) : (
                    columnQuotes.map((q) => (
                      <div
                        key={q.Id}
                        onClick={() => navigate(`/quotations/${q.Id}`)}
                        className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs hover:shadow-xs hover:border-blue-400 cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-bold text-blue-600 text-xs">{q.QuotationNumber}</span>
                            <h4 className="font-semibold text-slate-800 text-sm line-clamp-1">{q.CustomerName}</h4>
                          </div>
                          {q.BlendedDiscountRiskScore !== undefined && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                q.BlendedDiscountRiskScore >= 61
                                  ? 'bg-rose-100 text-rose-800'
                                  : q.BlendedDiscountRiskScore >= 31
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                              title={`Blended Risk Score: ${q.BlendedDiscountRiskScore}`}
                            >
                              Risk: {q.BlendedDiscountRiskScore}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="font-mono font-black text-slate-900">
                            ${(q.TotalAmount ?? q.totalNetAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Exp: {q.ExpirationDate ? new Date(q.ExpirationDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'N/A'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
