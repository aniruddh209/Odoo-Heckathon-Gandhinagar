import React from 'react';
import { Button } from '../common/Button.jsx';
import { Trash2, TrendingUp, AlertTriangle } from 'lucide-react';

export const LineItemsTable = ({
  lines = [],
  currency = 'USD',
  isReadOnly = false,
  onUpdateLine,
  onDeleteLine,
  onAddProductClick,
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="font-semibold text-slate-800">Quotation Line Items</h3>
          <p className="text-xs text-slate-500">Live products, contracted pricing, and margin breakdown</p>
        </div>
        {!isReadOnly && (
          <Button size="sm" onClick={onAddProductClick}>
            + Add Product
          </Button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">#</th>
              <th className="py-3 px-4">Product / SKU</th>
              <th className="py-3 px-4 text-right">Qty</th>
              <th className="py-3 px-4 text-right">Unit List ({currency})</th>
              <th className="py-3 px-4 text-right">Discount %</th>
              <th className="py-3 px-4 text-right">Unit Net ({currency})</th>
              <th className="py-3 px-4 text-right">Cost ({currency})</th>
              <th className="py-3 px-4 text-right">Margin %</th>
              <th className="py-3 px-4 text-right">Subtotal ({currency})</th>
              {!isReadOnly && <th className="py-3 px-4 text-center">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {lines.length === 0 ? (
              <tr>
                <td colSpan={isReadOnly ? 9 : 10} className="py-8 text-center text-slate-400">
                  No line items added yet. Click &quot;Add Product&quot; to build this quotation.
                </td>
              </tr>
            ) : (
              lines.map((line, idx) => {
                const lineId = line.Id ?? line.id;
                const productName = line.ProductName || line.productName;
                const productSku = line.ProductSku || line.productSku;
                const quantity = line.Quantity ?? line.quantity ?? 1;
                const discount = line.DiscountPercentage ?? line.discountPercentage ?? 0;
                const discountReason = line.DiscountReason || line.discountReason;
                const unitList = line.UnitListPrice ?? line.unitPrice ?? 0;
                const unitNet = line.UnitNetPrice ?? (unitList * (1 - discount / 100));
                const subtotal = line.Subtotal ?? line.subtotalAmount ?? (unitNet * quantity);
                const marginPct = line.LineMarginPercent ?? line.lineMarginPercent;
                const isLowMargin = marginPct !== undefined && marginPct < 15;

                return (
                  <tr key={lineId || idx} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 text-slate-400 text-xs">{idx + 1}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{productName}</div>
                      <div className="text-xs text-slate-400 font-mono">{productSku}</div>
                      {discountReason && (
                        <div className="text-xs text-amber-600 mt-0.5">Note: {discountReason}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isReadOnly ? (
                        <span className="font-semibold">{quantity}</span>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          className="w-16 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          value={quantity}
                          onChange={(e) =>
                            onUpdateLine(String(lineId), {
                              quantity: Math.max(1, parseInt(e.target.value) || 1),
                              discountPercentage: discount,
                              discountReason: discountReason,
                            })
                          }
                        />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {unitList.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {isReadOnly ? (
                        <span className={discount > 0 ? 'text-amber-600 font-semibold' : ''}>
                          {discount}%
                        </span>
                      ) : (
                        <div className="inline-flex items-center space-x-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.5"
                            className="w-16 px-2 py-1 border border-slate-200 rounded text-right text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            value={discount}
                            onChange={(e) =>
                              onUpdateLine(String(lineId), {
                                quantity: quantity,
                                discountPercentage: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)),
                                discountReason: discountReason,
                              })
                            }
                          />
                          <span className="text-xs text-slate-400">%</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-medium text-slate-900">
                      {unitNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-slate-500">
                      {line.UnitCostPrice !== undefined || line.unitCostPrice !== undefined
                        ? ((line.UnitCostPrice ?? line.unitCostPrice) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {marginPct !== undefined ? (
                        <span
                          className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                            isLowMargin
                              ? 'bg-rose-50 text-rose-700'
                              : marginPct > 35
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-blue-50 text-blue-700'
                          }`}
                        >
                          {isLowMargin ? <AlertTriangle className="w-3 h-3 mr-1" /> : <TrendingUp className="w-3 h-3 mr-1" />}
                          {marginPct.toFixed(1)}%
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    {!isReadOnly && (
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onDeleteLine(String(lineId))}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remove line"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
