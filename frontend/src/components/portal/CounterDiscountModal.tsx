import React, { useState } from 'react';
import { CustomerCounterDiscountRequest } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { AlertCircle, DollarSign, Percent } from 'lucide-react';

interface CounterDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTotal: number;
  onConfirm: (request: CustomerCounterDiscountRequest) => void;
  isSubmitting?: boolean;
}

export const CounterDiscountModal: React.FC<CounterDiscountModalProps> = ({
  isOpen,
  onClose,
  currentTotal,
  onConfirm,
  isSubmitting = false,
}) => {
  const [mode, setMode] = useState<'percent' | 'target'>('target');
  const [discountPercent, setDiscountPercent] = useState<number>(5);
  const [targetAmount, setTargetAmount] = useState<number>(Math.round(currentTotal * 0.95));
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide a brief justification to help our sales director evaluate your request.');
      return;
    }

    if (mode === 'target' && targetAmount >= currentTotal) {
      setError('Counter offer target amount must be lower than the current total amount.');
      return;
    }

    if (mode === 'percent' && discountPercent <= 0) {
      setError('Discount percentage must be greater than 0%.');
      return;
    }

    onConfirm({
      RequestedDiscountPercentage: mode === 'percent' ? discountPercent : undefined,
      RequestedTotalAmount: mode === 'target' ? targetAmount : undefined,
      Notes: notes.trim(),
    });
  };

  const handleClose = () => {
    setNotes('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Request Commercial Counter-Offer"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
          <span className="text-slate-400">Current Quote Total:</span>
          <div className="text-xl font-bold font-mono text-slate-900">
            ${currentTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Counter mode toggle */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Proposal Format</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('target')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                mode === 'target'
                  ? 'bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-600/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              <span>Specific Target Price</span>
            </button>

            <button
              type="button"
              onClick={() => setMode('percent')}
              className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center space-x-2 transition-all ${
                mode === 'percent'
                  ? 'bg-blue-50 border-blue-600 text-blue-800 ring-2 ring-blue-600/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Percent className="w-4 h-4" />
              <span>Overall Discount %</span>
            </button>
          </div>
        </div>

        {mode === 'target' ? (
          <Input
            label="Your Target Total ($)"
            type="number"
            min="1"
            max={currentTotal}
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
            required
          />
        ) : (
          <Input
            label="Requested Discount (%)"
            type="number"
            min="1"
            max="50"
            step="0.5"
            value={discountPercent}
            onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
            required
          />
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Commercial Rationale <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={3}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. Budget cap of $45,000 for Q3, or commitment to order an additional 200 units if price meets $42,000..."
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              if (error) setError(null);
            }}
            required
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Submit Counter-Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
};
