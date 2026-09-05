import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { portalApi } from '../api';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FileText, Calendar, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const CustomerQuotationsPage = () => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    portalApi.getQuotations()
      .then((data) => {
        if (isMounted) setQuotes(data || []);
      })
      .catch((err) => console.error('Error fetching portal quotations:', err))
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Your Commercial Quotations</h1>
          <p className="text-xs text-slate-500">
            Review live proposals, negotiate line items, and confirm binding purchase orders
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="py-24 flex justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            No quotations currently assigned to your account.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {quotes.map((q) => (
              <div
                key={q.Id}
                onClick={() => navigate(`/portal/quotes/${q.Id}`)}
                className="p-5 hover:bg-slate-50/80 cursor-pointer transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-900 text-base font-mono">Quote #{q.QuotationNumber}</span>
                    <span className="text-xs text-slate-400 font-mono">v{q.VersionNumber}</span>
                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                        q.Status === 'Accepted' || q.Status === 'Ordered'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                          : 'bg-blue-50 text-blue-700 border-blue-200/80'
                      }`}
                    >
                      {q.Status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-4 text-xs text-slate-500">
                    <span className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Valid until {q.ExpirationDate ? formatDate(q.ExpirationDate) : 'N/A'}
                    </span>
                    <span>•</span>
                    <span>{q.Lines?.length || 0} Products</span>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block uppercase font-medium">Net Total</span>
                    <span className="text-xl font-bold font-mono text-slate-900">
                      {formatCurrency(q.TotalAmount ?? q.totalNetAmount ?? 0, q.Currency || 'INR')}
                    </span>
                  </div>

                  <Button size="sm" variant="outline">
                    Review Proposal
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerQuotationsPage;
