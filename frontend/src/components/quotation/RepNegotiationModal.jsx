import React, { useState, useEffect } from 'react';
import { Modal, Button, Input, Textarea, Select } from '../ui';
import { useToast } from '../../context/ToastContext';
import { quotationApi } from '../../api';
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  DollarSign,
  Percent,
  Ban,
  Lock,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const RepNegotiationModal = ({
  isOpen,
  onClose,
  quote,
  onSuccess,
}) => {
  const toast = useToast();
  const [activeAction, setActiveAction] = useState('accept'); // 'accept' | 'counter' | 'disqualify'
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Accept state
  const [acceptNote, setAcceptNote] = useState('');

  // Reject & Counter state
  const [selectedLineId, setSelectedLineId] = useState('');
  const [counterDiscount, setCounterDiscount] = useState('');
  const [counterPrice, setCounterPrice] = useState('');
  const [counterReason, setCounterReason] = useState('');

  // Disqualify state
  const [disqualifyReason, setDisqualifyReason] = useState('Price Mismatch / Unrealistic Customer Expectation');
  const [disqualifyNote, setDisqualifyNote] = useState('');

  const tierLimit = quote?.customerTierMaxDiscount ?? 5;
  const hasCounterOffer = Boolean(quote?.hasPendingCounterOffer || quote?.latestCounterDiscount != null);
  const pendingCounterDiscount = quote?.latestCounterDiscount ?? 0;
  const isPendingCounterWithinTier = pendingCounterDiscount <= tierLimit;

  // Initialize line and counter discount when modal opens
  useEffect(() => {
    if (isOpen && quote) {
      if (hasCounterOffer) {
        setActiveAction('accept');
        setAcceptNote(`Agreed to customer counter-offer of ${pendingCounterDiscount}% discount.`);
      } else {
        setActiveAction('counter');
      }

      // Default to first line if available
      if (quote.lines && quote.lines.length > 0) {
        const line = quote.latestCounterLineId
          ? quote.lines.find((l) => l.id === quote.latestCounterLineId) || quote.lines[0]
          : quote.lines[0];

        setSelectedLineId(line.id);
        setCounterDiscount(line.discountPercent || 0);
        setCounterPrice(line.unitPrice || 0);
      }
      setCounterReason('');
      setDisqualifyNote('');
    }
  }, [isOpen, quote, hasCounterOffer, pendingCounterDiscount]);

  const handleLineSelect = (lineId) => {
    setSelectedLineId(lineId);
    const line = quote.lines?.find((l) => l.id === parseInt(lineId, 10));
    if (line) {
      setCounterDiscount(line.discountPercent || 0);
      setCounterPrice(line.unitPrice || 0);
    }
  };

  const handleAcceptOffer = async () => {
    setIsSubmitting(true);
    try {
      const res = await quotationApi.acceptCounterOffer(quote.id, {
        note: acceptNote.trim() || `Accepted customer counter-offer of ${pendingCounterDiscount}%.`,
      });

      if (res.isAutoApproved) {
        toast.success(
          'Counter-Offer Accepted & Auto-Approved',
          `Discount (${pendingCounterDiscount}%) is within ${quote.customerTierName || 'Customer'} tier limit (≤ ${tierLimit}%). Quote is approved!`
        );
      } else {
        toast.info(
          'Counter-Offer Accepted',
          `Discount (${pendingCounterDiscount}%) exceeds tier ceiling (≤ ${tierLimit}%). Sent for Manager Approval.`
        );
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Failed to Accept Counter-Offer', err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectAndCounter = async () => {
    const discountVal = parseFloat(counterDiscount);
    if (isNaN(discountVal) || discountVal < 0 || discountVal > 100) {
      toast.error('Invalid Discount', 'Please provide a valid discount percentage between 0 and 100.');
      return;
    }

    if (!counterReason.trim()) {
      toast.error('Note Required', 'Please provide an explanatory message or justification for the customer.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        lineId: selectedLineId ? parseInt(selectedLineId, 10) : null,
        counterDiscountPercent: discountVal,
        counterUnitPrice: counterPrice ? parseFloat(counterPrice) : null,
        reason: counterReason.trim(),
        disqualifyDeal: false,
      };

      const res = await quotationApi.rejectCounterOffer(quote.id, payload);
      toast.success(
        'Counter-Offer Dispatched',
        res.message || `Counter-offer of ${discountVal}% sent to customer.`
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Failed to Send Counter-Offer', err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisqualify = async () => {
    if (!disqualifyNote.trim()) {
      toast.error('Justification Required', 'Please provide a justification for disqualifying this quotation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await quotationApi.disqualifyQuotation(quote.id, {
        reason: disqualifyReason,
        note: disqualifyNote.trim(),
      });

      toast.info('Quotation Disqualified', res.message || 'The deal has been marked as Lost/Disqualified.');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error('Failed to Disqualify', err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!quote) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Commercial Negotiation — ${quote.quotationNumber}`}
      subtitle={`Sales Representative Negotiation Console for ${quote.customerName}`}
      size="lg"
    >
      <div className="space-y-5">
        {/* Customer Tier & Governance Banner */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="text-slate-600">Client Governance Tier:</span>
            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
              {quote.customerTierName || 'Standard'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <span>Pre-Approved Ceiling:</span>
            <span className="text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              ≤ {tierLimit}% Discount
            </span>
          </div>
        </div>

        {/* Customer Counter-Offer Highlight Card */}
        {hasCounterOffer && (
          <div
            className={`p-4 rounded-xl border ${
              isPendingCounterWithinTier
                ? 'bg-emerald-50/80 border-emerald-300'
                : 'bg-amber-50/80 border-amber-300'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      isPendingCounterWithinTier
                        ? 'bg-emerald-200 text-emerald-900'
                        : 'bg-amber-200 text-amber-900'
                    }`}
                  >
                    Customer Counter-Offer Received
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-900">
                    Requested Discount: {pendingCounterDiscount}%
                  </span>
                </div>
                {quote.latestCounterReason && (
                  <p className="text-xs text-slate-700 italic pt-1">
                    "{quote.latestCounterReason}"
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-500 block">Status</span>
                <span
                  className={`text-xs font-semibold ${
                    isPendingCounterWithinTier ? 'text-emerald-700' : 'text-amber-700'
                  }`}
                >
                  {isPendingCounterWithinTier ? '✓ Within Tier Limit' : '⚠ Exceeds Tier Limit'}
                </span>
              </div>
            </div>

            {/* Governance Outcome Explanation */}
            <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-xs">
              {isPendingCounterWithinTier ? (
                <p className="text-emerald-800 flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  Accepting this counter-offer ({pendingCounterDiscount}%) will auto-approve the quote immediately and clear any manager approvals!
                </p>
              ) : (
                <p className="text-amber-800 flex items-center gap-1.5 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                  Accepting this counter-offer ({pendingCounterDiscount}%) exceeds pre-approved {tierLimit}% ceiling and will route to Manager Approval.
                </p>
              )}
            </div>
          </div>
        )}

        {/* 3 Option Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          {hasCounterOffer && (
            <button
              type="button"
              onClick={() => setActiveAction('accept')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                activeAction === 'accept'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              1. Accept Counter-Offer
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveAction('counter')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeAction === 'counter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
            {hasCounterOffer ? '2. Reject & Counter-Offer' : 'Dispatch Counter-Offer'}
          </button>

          <button
            type="button"
            onClick={() => setActiveAction('disqualify')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              activeAction === 'disqualify'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Ban className="w-4 h-4" />
            {hasCounterOffer ? '3. Disqualify Deal' : 'Disqualify Deal'}
          </button>
        </div>

        {/* TAB 1: ACCEPT COUNTER-OFFER */}
        {activeAction === 'accept' && hasCounterOffer && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-2 text-xs">
              <h4 className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Confirm Acceptance of Customer Proposed Terms
              </h4>
              <p className="text-emerald-900 leading-relaxed">
                By accepting, the quotation discount will be updated to{' '}
                <strong>{pendingCounterDiscount}%</strong>.
                {isPendingCounterWithinTier
                  ? ' Since this is within the customer pre-approved tier discount ceiling, the quotation will be marked as Approved and the discount locked against unauthorized modification.'
                  : ' Since this exceeds the pre-approved tier discount ceiling, the quotation will be submitted for manager approval.'}
              </p>
            </div>

            <Textarea
              label="Sales Representative Remarks / Call Notes"
              value={acceptNote}
              onChange={(e) => setAcceptNote(e.target.value)}
              placeholder="e.g., Spoke with customer procurement lead. Agreed to 11% for 1-year contract commitment."
              rows={3}
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700"
                isLoading={isSubmitting}
                onClick={handleAcceptOffer}
              >
                Accept Customer Terms ({pendingCounterDiscount}%)
              </Button>
            </div>
          </div>
        )}

        {/* TAB 2: REJECT & COUNTER-OFFER */}
        {activeAction === 'counter' && (
          <div className="space-y-4 pt-1">
            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl text-xs space-y-1">
              <span className="font-bold text-blue-950 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4 text-blue-600" />
                Propose Revised Commercial Terms
              </span>
              <p className="text-blue-900">
                Send a counter-offer back to the customer. If within the tier ceiling (≤ {tierLimit}%), the terms can be auto-approved upon customer acceptance.
              </p>
            </div>

            {quote.lines && quote.lines.length > 1 && (
              <Select
                label="Target Quotation Line"
                value={selectedLineId}
                onChange={(e) => handleLineSelect(e.target.value)}
                options={quote.lines.map((l) => ({
                  value: l.id,
                  label: `${l.productName} — Current: ${l.discountPercent || 0}% discount (${formatCurrency(l.unitPrice, quote.currency)})`,
                }))}
              />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Input
                  label="Proposed Counter Discount (%)"
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  required
                  value={counterDiscount}
                  onChange={(e) => setCounterDiscount(e.target.value)}
                  helperText={
                    parseFloat(counterDiscount) <= tierLimit
                      ? `✓ Within Tier Safe Zone (≤ ${tierLimit}%)`
                      : `⚠ Exceeds Tier Limit (${tierLimit}%). Manager approval will trigger.`
                  }
                />
              </div>

              <div>
                <Input
                  label="Target Unit Price"
                  type="number"
                  step="0.01"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  helperText="Optional direct unit price adjustment"
                />
              </div>
            </div>

            {/* Quick Helper buttons */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Quick Sets:</span>
              <button
                type="button"
                onClick={() => setCounterDiscount(tierLimit)}
                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
              >
                Match Tier Limit ({tierLimit}%)
              </button>
              {hasCounterOffer && (
                <button
                  type="button"
                  onClick={() => {
                    const mid = ((pendingCounterDiscount + (quote.lines?.[0]?.discountPercent || 0)) / 2).toFixed(1);
                    setCounterDiscount(mid);
                  }}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition-colors cursor-pointer"
                >
                  Split Difference
                </button>
              )}
            </div>

            <Textarea
              label="Message to Customer / Value Justification"
              required
              value={counterReason}
              onChange={(e) => setCounterReason(e.target.value)}
              placeholder="e.g., We cannot match 11% due to component costs, but we can offer 10.5% with priority delivery and 1-year service warranty included."
              rows={3}
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleRejectAndCounter}
              >
                Dispatch Counter-Offer ({counterDiscount || 0}%)
              </Button>
            </div>
          </div>
        )}

        {/* TAB 3: DISQUALIFY DEAL */}
        {activeAction === 'disqualify' && (
          <div className="space-y-4 pt-1">
            <div className="p-3.5 bg-rose-50/60 border border-rose-200 rounded-xl space-y-1.5 text-xs">
              <h4 className="font-bold text-rose-950 flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-600" />
                Disqualify Quotation & Mark Deal as Lost
              </h4>
              <p className="text-rose-900 leading-relaxed">
                If the customer's pricing expectations are economically unviable or fall below company margin floors, you can formally close negotiations and disqualify this deal.
              </p>
            </div>

            <Select
              label="Disqualification Primary Reason"
              value={disqualifyReason}
              onChange={(e) => setDisqualifyReason(e.target.value)}
              options={[
                { value: 'Price Mismatch / Unrealistic Customer Expectation', label: 'Price Mismatch / Unrealistic Customer Expectation' },
                { value: 'Competitor Undercut Below Acceptable Floor', label: 'Competitor Undercut Below Acceptable Floor' },
                { value: 'Customer Budget Frozen / Defunded', label: 'Customer Budget Frozen / Defunded' },
                { value: 'Delivery Timeline Unachievable', label: 'Delivery Timeline Unachievable' },
                { value: 'Customer Non-Responsive / Withdrawn', label: 'Customer Non-Responsive / Withdrawn' },
              ]}
            />

            <Textarea
              label="Sales Rep Detailed Rationale"
              required
              value={disqualifyNote}
              onChange={(e) => setDisqualifyNote(e.target.value)}
              placeholder="Explain why this deal cannot proceed to close (e.g. Customer demanded 25% discount which brings gross margin below 5%)."
              rows={3}
            />

            <div className="pt-2 flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleDisqualify}
              >
                Confirm Deal Disqualification
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default RepNegotiationModal;
