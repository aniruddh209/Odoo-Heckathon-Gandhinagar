import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const ProrationModal = ({
  isOpen,
  onClose,
  subscription,
  plans = [],
  onConfirm,
  isSubmitting = false,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState(subscription?.PlanId || '');
  const [quantity, setQuantity] = useState(subscription?.Quantity || 1);
  const [effectiveImmediately, setEffectiveImmediately] = useState(true);

  const selectedPlan = plans.find((p) => p.Id === selectedPlanId) || plans[0];
  const currency = subscription?.Currency || 'INR';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      NewPlanId: selectedPlanId !== subscription?.PlanId ? selectedPlanId : undefined,
      NewQuantity: quantity !== subscription?.Quantity ? quantity : undefined,
      EffectiveDate: effectiveImmediately ? new Date().toISOString() : subscription?.CurrentPeriodEnd,
    });
  };

  if (!subscription) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Adjust Subscription Plan & Seats"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-lg text-xs text-blue-900 flex items-start space-x-2">
          <Calculator className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Automated Server Proration</span>
            <p className="mt-0.5 text-blue-800">
              Unused days in the current cycle will be computed to the exact second by the backend billing engine, issuing a net credit/debit adjustment invoice automatically.
            </p>
          </div>
        </div>

        {/* Current vs Target Plan */}
        <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200/80">
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Current Tier</span>
            <span className="font-bold text-slate-800">{subscription.PlanName || subscription.planName}</span>
            <span className="text-slate-500 block font-mono mt-0.5">{formatCurrency(subscription.PeriodicPrice ?? subscription.periodicPrice ?? 0, currency)}/cycle</span>
          </div>
          <div>
            <span className="text-slate-400 block mb-1 font-medium">Target Tier</span>
            <span className="font-bold text-blue-700">{selectedPlan ? (selectedPlan.Name || selectedPlan.name) : 'Selecting...'}</span>
            <span className="text-slate-500 block font-mono mt-0.5">
              {formatCurrency(selectedPlan ? (selectedPlan.PeriodicPrice ?? selectedPlan.periodicPrice ?? 0) : 0, currency)}/cycle
            </span>
          </div>
        </div>

        <Select
          label="Change Plan Tier"
          value={selectedPlanId}
          onChange={(e) => setSelectedPlanId(e.target.value)}
          options={plans.map((p) => ({
            value: p.Id || p.id || '',
            label: `${p.Name || p.name} — ${formatCurrency(p.PeriodicPrice ?? p.periodicPrice ?? 0, currency)}/${p.BillingFrequency || p.billingInterval || 'Month'}`,
          }))}
        />

        <Input
          label="Licensed Seat / Unit Quantity"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
          required
        />

        <div className="pt-2">
          <label className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={effectiveImmediately}
              onChange={(e) => setEffectiveImmediately(e.target.checked)}
            />
            <span>Apply immediately with real-time proration (Uncheck to schedule at next renewal)</span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Confirm Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ProrationModal;
