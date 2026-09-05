import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

export const ApprovalDecisionModal = ({
  isOpen,
  onClose,
  quotationNumber,
  onConfirm,
  isSubmitting = false,
}) => {
  const [decision, setDecision] = useState('Approve');
  const [comments, setComments] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (decision === 'Reject' && !comments.trim()) {
      setError('Comments are strictly mandatory when rejecting a commercial quotation.');
      return;
    }
    setError(null);
    onConfirm(decision, comments.trim());
  };

  const handleClose = () => {
    setComments('');
    setError(null);
    setDecision('Approve');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Governance Decision — ${quotationNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Decision Action</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setDecision('Approve');
                setError(null);
              }}
              className={`p-3 rounded-lg border text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                decision === 'Approve'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Approve Quotation</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDecision('Reject');
                setError(null);
              }}
              className={`p-3 rounded-lg border text-sm font-semibold flex items-center justify-center space-x-2 transition-all ${
                decision === 'Reject'
                  ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-500/20'
                  : 'border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>Reject Request</span>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Governance Remarks / Audit Log Note{' '}
            {decision === 'Reject' ? <span className="text-rose-600">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
          </label>
          <textarea
            rows={3}
            className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              decision === 'Reject'
                ? 'Specify policy reasons for rejection (e.g. margin below 18% requires volume commitment)...'
                : 'Optional approval notes or conditions for Sales Ops...'
            }
            value={comments}
            onChange={(e) => {
              setComments(e.target.value);
              if (error) setError(null);
            }}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            className={decision === 'Reject' ? 'bg-rose-600 hover:bg-rose-700 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}
          >
            Submit {decision}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
