import React from 'react';
import { Button } from '../common/Button';
import { Calendar, CheckCircle2, MessageSquare, Download } from 'lucide-react';

export const PortalQuoteHeader = ({
  quote,
  onOpenConfirmModal,
  onOpenDiscountModal,
  onDownloadPdf,
}) => {
  if (!quote) return null;
  const isAccepted = quote.Status === 'Accepted' || quote.Status === 'Ordered';
  const isExpired = quote.Status === 'Expired';
  const canNegotiate = !isAccepted && !isExpired;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 md:p-8 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-full uppercase tracking-wider">
              Formal Quotation
            </span>
            <span
              className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${
                isAccepted
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isExpired
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              }`}
            >
              {quote.Status}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
            Quotation #{quote.QuotationNumber}
          </h1>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
            <div>
              Prepared for: <strong className="text-slate-800">{quote.CustomerName}</strong>
            </div>
            <span>•</span>
            <div className="flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Valid until: {quote.ExpirationDate ? new Date(quote.ExpirationDate).toLocaleDateString() : 'N/A'}</span>
            </div>
            <span>•</span>
            <div>
              Version: <strong className="text-slate-700">v{quote.VersionNumber}</strong>
            </div>
          </div>
        </div>

        {/* Primary Customer Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {onDownloadPdf && (
            <Button variant="outline" size="md" onClick={onDownloadPdf}>
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          )}

          {canNegotiate && (
            <>
              <Button variant="outline" size="md" onClick={onOpenDiscountModal}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Request Counter Offer
              </Button>

              <Button
                size="md"
                onClick={onOpenConfirmModal}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-semibold"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Accept & Confirm Order
              </Button>
            </>
          )}

          {isAccepted && (
            <div className="flex items-center space-x-2 bg-emerald-50 text-emerald-800 px-4 py-2.5 rounded-xl border border-emerald-200 text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Quotation Confirmed & In Processing</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
