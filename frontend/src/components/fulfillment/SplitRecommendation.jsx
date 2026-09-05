import React from 'react';
import { Button } from '../common/Button';
import { Building2, Truck, Calendar, CheckCircle, Sliders, AlertCircle } from 'lucide-react';

export const SplitRecommendation = ({
  split,
  onApplySplit,
  onManualOverride,
  isApplying = false,
}) => {
  const allocations = split?.Allocations || split?.allocations || [];
  const isFullySatisfied = allocations.length > 0 && allocations.every((a) => (a.AllocatedQuantity ?? a.allocatedQuantity ?? 0) >= (a.RequestedQuantity ?? a.requestedQuantity ?? 0));

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900">Multi-Warehouse Optimization</h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proximity and stock-level routing computed by fulfillment engine
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onManualOverride}>
            <Sliders className="w-4 h-4 mr-1.5" />
            Manual Override
          </Button>
          <Button size="sm" onClick={onApplySplit} isLoading={isApplying}>
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Confirm Allocation
          </Button>
        </div>
      </div>

      {/* Split overview status */}
      <div className={`p-4 rounded-lg flex items-center space-x-3 text-sm ${
        isFullySatisfied ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
      }`}>
        {isFullySatisfied ? (
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
        ) : (
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
        )}
        <div className="flex-1">
          <span className="font-semibold">
            {isFullySatisfied
              ? '100% Stock Allocation Achieved Across Network'
              : 'Partial Allocation Detected — Some items require backorder splitting'}
          </span>
          <div className="text-xs opacity-90 mt-0.5">
            Strategy: Prioritize least shipment hops while satisfying SLA.
          </div>
        </div>
      </div>

      {/* Allocation breakdown table */}
      <div className="overflow-x-auto border border-slate-200 rounded-lg">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Warehouse</th>
              <th className="py-3 px-4">Product / SKU</th>
              <th className="py-3 px-4 text-right">Requested Qty</th>
              <th className="py-3 px-4 text-right">Allocated Qty</th>
              <th className="py-3 px-4">Estimated Delivery</th>
              <th className="py-3 px-4">Shipping Method</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {allocations.map((item, idx) => (
              <tr key={`${item.WarehouseId}-${item.ProductId}-${idx}`} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <div className="font-semibold text-slate-800 flex items-center space-x-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.WarehouseName}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">WH-ID: {item.WarehouseId ? item.WarehouseId.substring(0, 8) : 'WH'}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-slate-800">{item.ProductName}</div>
                  <div className="text-xs text-slate-400 font-mono">{item.ProductSku}</div>
                </td>
                <td className="py-3 px-4 text-right font-mono">{item.RequestedQuantity ?? item.requestedQuantity ?? 0}</td>
                <td className="py-3 px-4 text-right">
                  <span className={`font-mono font-bold ${(item.AllocatedQuantity ?? item.allocatedQuantity ?? 0) < (item.RequestedQuantity ?? item.requestedQuantity ?? 0) ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {item.AllocatedQuantity ?? item.allocatedQuantity ?? 0}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-1 text-xs text-slate-600">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {item.EstimatedDeliveryDate
                        ? new Date(item.EstimatedDeliveryDate).toLocaleDateString()
                        : 'Standard Ground (3-5d)'}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-1 text-xs text-slate-600">
                    <Truck className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.Carrier || 'FedEx Priority Freight'}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
