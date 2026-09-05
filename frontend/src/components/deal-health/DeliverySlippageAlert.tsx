import React from 'react';
import { Truck, AlertCircle, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '../common/Button';

interface DeliverySlippageAlertProps {
  orderNumber: string;
  customerName: string;
  promisedDate: string;
  revisedDate: string;
  reason: string;
  onExpedite?: () => void;
}

export const DeliverySlippageAlert: React.FC<DeliverySlippageAlertProps> = ({
  orderNumber,
  customerName,
  promisedDate,
  revisedDate,
  reason,
  onExpedite,
}) => {
  return (
    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Truck className="w-4 h-4 text-amber-700" />
          <span className="font-bold text-slate-800">Delivery SLA Slippage: Order #{orderNumber}</span>
        </div>
        <span className="text-amber-800 font-semibold bg-amber-100 px-2 py-0.5 rounded-full text-[11px]">
          Fulfillment Delayed
        </span>
      </div>

      <div className="text-slate-600">
        Account: <strong className="text-slate-800">{customerName}</strong> — {reason}
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-amber-200/60 text-slate-500">
        <div className="flex items-center space-x-3">
          <span>Promised: <strong className="text-slate-700">{new Date(promisedDate).toLocaleDateString()}</strong></span>
          <span>→</span>
          <span>Revised: <strong className="text-rose-600">{new Date(revisedDate).toLocaleDateString()}</strong></span>
        </div>

        {onExpedite && (
          <Button size="sm" variant="outline" onClick={onExpedite} className="bg-white text-amber-900 border-amber-300">
            Expedite Shipment
          </Button>
        )}
      </div>
    </div>
  );
};
