import React from 'react';
import { BackorderDto } from '../../types';
import { AlertTriangle, Clock, PackageCheck, Truck } from 'lucide-react';
import { Button } from '../common/Button';

interface BackorderBannerProps {
  backorders: BackorderDto[];
  onPartialShip?: () => void;
  onHoldForConsolidation?: () => void;
}

export const BackorderBanner: React.FC<BackorderBannerProps> = ({
  backorders,
  onPartialShip,
  onHoldForConsolidation,
}) => {
  if (!backorders || backorders.length === 0) return null;

  return (
    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-950 text-sm">
              Stock Shortage Detected — {backorders.length} Item(s) Backordered
            </h4>
            <p className="text-xs text-amber-700">
              Immediate dispatch not fully possible with current on-hand warehouse inventory
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onPartialShip && (
            <Button
              size="sm"
              variant="outline"
              onClick={onPartialShip}
              className="bg-white border-amber-300 text-amber-900 hover:bg-amber-50"
            >
              <Truck className="w-3.5 h-3.5 mr-1.5" />
              Dispatch In-Stock Partial
            </Button>
          )}
          {onHoldForConsolidation && (
            <Button
              size="sm"
              onClick={onHoldForConsolidation}
              className="bg-amber-700 hover:bg-amber-800 text-white"
            >
              <Clock className="w-3.5 h-3.5 mr-1.5" />
              Hold for Consolidation
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {backorders.map((bo) => (
          <div
            key={bo.Id}
            className="bg-white/90 p-3 rounded-lg border border-amber-200/80 text-xs space-y-1.5 shadow-2xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800">{bo.ProductName}</span>
              <span className="font-mono text-amber-700 font-bold">Qty: {bo.Quantity}</span>
            </div>
            <div className="text-slate-400 font-mono text-[11px]">{bo.ProductSku}</div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-slate-500">
              <span>Estimated Replenishment:</span>
              <span className="font-medium text-slate-700">
                {bo.EstimatedRestockDate ? new Date(bo.EstimatedRestockDate).toLocaleDateString() : 'TBD'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
