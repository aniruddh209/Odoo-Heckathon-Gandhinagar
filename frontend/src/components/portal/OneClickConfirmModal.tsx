import React, { useState } from 'react';
import { CustomerConfirmRequest } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

interface OneClickConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotationNumber: string;
  totalAmount: number;
  onConfirm: (request: CustomerConfirmRequest) => void;
  isSubmitting?: boolean;
}

export const OneClickConfirmModal: React.FC<OneClickConfirmModalProps> = ({
  isOpen,
  onClose,
  quotationNumber,
  totalAmount,
  onConfirm,
  isSubmitting = false,
}) => {
  const [poNumber, setPoNumber] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signatoryName.trim()) {
      setError('Authorized Signatory Name is required to bind this order.');
      return;
    }
    if (!agreedToTerms) {
      setError('You must accept the standard commercial terms and conditions.');
      return;
    }

    onConfirm({
      PoNumber: poNumber.trim() || undefined,
      Signature: signatoryName.trim(),
    });
  };

  const handleClose = () => {
    setPoNumber('');
    setSignatoryName('');
    setAgreedToTerms(false);
    setError(null);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Confirm Order — Quote #${quotationNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 flex items-center justify-between">
          <div>
            <span className="text-xs text-emerald-700 block">Net Binding Amount:</span>
            <span className="text-2xl font-black font-mono">
              ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
        </div>

        <Input
          label="Customer Purchase Order (PO) Number"
          placeholder="e.g., PO-2026-98124 (Optional)"
          value={poNumber}
          onChange={(e) => setPoNumber(e.target.value)}
        />

        <Input
          label="Authorized Signatory Name / Title"
          placeholder="e.g. Jane Doe, VP Procurement"
          value={signatoryName}
          onChange={(e) => {
            setSignatoryName(e.target.value);
            if (error) setError(null);
          }}
          required
        />

        <div className="pt-2">
          <label className="flex items-start space-x-2.5 text-xs text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                if (error) setError(null);
              }}
            />
            <span>
              I confirm that I am authorized to bind our organization and accept the pricing, payment schedule, and terms stipulated in Quotation #{quotationNumber}.
            </span>
          </label>
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Execute Binding Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
