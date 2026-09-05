import React from 'react';
import { Button } from '../common/Button';
import { FileText, CreditCard } from 'lucide-react';

export const OneTimeInvoiceCard = ({
  invoice,
  onRecordPayment,
  onDownloadPdf,
}) => {
  const isPaid = invoice?.Status === 'Paid';
  const isOverdue = invoice?.Status === 'Overdue';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm">{invoice?.InvoiceNumber}</span>
          </div>
          <span className="text-xs text-slate-400 mt-0.5 block">Customer: {invoice?.CustomerName}</span>
        </div>

        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
            isPaid
              ? 'bg-emerald-100 text-emerald-800'
              : isOverdue
              ? 'bg-rose-100 text-rose-800'
              : 'bg-amber-100 text-amber-800'
          }`}
        >
          {invoice?.Status || 'Pending'}
        </span>
      </div>

      {/* Dates and Totals */}
      <div className="grid grid-cols-2 gap-4 py-2 border-y border-slate-100 text-xs">
        <div>
          <span className="text-slate-400 block">Due Date</span>
          <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-slate-700'}`}>
            {invoice?.DueDate ? new Date(invoice.DueDate).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 block">Invoice Total</span>
          <span className="font-mono text-base font-bold text-slate-900">
            ${(invoice?.TotalAmount ?? invoice?.totalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Invoice Lines summary */}
      {invoice?.Lines && invoice.Lines.length > 0 && (
        <div className="space-y-1.5 text-xs text-slate-600">
          <span className="text-slate-400 text-[11px] block">Billed Items ({invoice.Lines.length})</span>
          {invoice.Lines.slice(0, 3).map((line) => (
            <div key={line.Id || line.id} className="flex justify-between">
              <span className="truncate max-w-[200px]">{line.Description || 'Hardware / Service Delivery'}</span>
              <span className="font-mono text-slate-700">${(line.Total ?? line.total ?? 0).toFixed(2)}</span>
            </div>
          ))}
          {invoice.Lines.length > 3 && (
            <div className="text-[11px] text-slate-400">+{invoice.Lines.length - 3} more items...</div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end space-x-2 pt-2">
        {onDownloadPdf && (
          <Button variant="outline" size="sm" onClick={() => onDownloadPdf(invoice.Id)}>
            Download PDF
          </Button>
        )}
        {!isPaid && onRecordPayment && (
          <Button size="sm" onClick={() => onRecordPayment(invoice.Id)} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <CreditCard className="w-3.5 h-3.5 mr-1.5" />
            Record Payment
          </Button>
        )}
      </div>
    </div>
  );
};
