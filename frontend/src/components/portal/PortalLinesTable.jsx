import React from 'react';
import { MessageSquare } from 'lucide-react';

export const PortalLinesTable = ({
  lines = [],
  currency = 'USD',
  onOpenLineChat,
  canNegotiate = true,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base">Agreed Line Items & Pricing</h3>
          <p className="text-xs text-slate-500">Review bill of materials and ask questions on specific items</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
          {lines.length} {lines.length === 1 ? 'Item' : 'Items'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-5">Item / Description</th>
              <th className="py-3.5 px-4 text-right">Quantity</th>
              <th className="py-3.5 px-4 text-right">Unit List</th>
              <th className="py-3.5 px-4 text-right">Discount</th>
              <th className="py-3.5 px-4 text-right">Your Net Price</th>
              <th className="py-3.5 px-5 text-right">Line Total ({currency})</th>
              {canNegotiate && <th className="py-3.5 px-4 text-center">Inquire</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {lines.map((line) => (
              <tr key={line.Id || line.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-5">
                  <div className="font-semibold text-slate-900">{line.ProductName}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">SKU: {line.ProductSku}</div>
                </td>
                <td className="py-4 px-4 text-right font-mono font-medium">{line.Quantity ?? line.quantity ?? 1}</td>
                <td className="py-4 px-4 text-right font-mono text-slate-500">
                  ${(line.UnitListPrice ?? line.unitPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-4 text-right">
                  {(line.DiscountPercentage ?? line.discountPercentage ?? 0) > 0 ? (
                    <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                      -{(line.DiscountPercentage ?? line.discountPercentage ?? 0)}%
                    </span>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
                <td className="py-4 px-4 text-right font-mono font-semibold text-slate-900">
                  ${(line.UnitNetPrice ?? line.unitPrice ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="py-4 px-5 text-right font-mono font-bold text-slate-900 text-base">
                  ${(line.Subtotal ?? line.subtotalAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                {canNegotiate && (
                  <td className="py-4 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onOpenLineChat(line)}
                      className="inline-flex items-center space-x-1 p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-xs font-medium cursor-pointer"
                      title="Discuss this line item with your account manager"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span className="hidden sm:inline">Discuss</span>
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
