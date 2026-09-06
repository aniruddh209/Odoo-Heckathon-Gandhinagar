import React, { useState } from 'react';
import {
  Button,
  StatusBadge,
  Badge,
  Modal,
  Input,
  Textarea,
  Select,
} from '../ui';
import {
  CheckCircle2,
  MessageSquare,
  Percent,
  Calendar,
  Layers,
  Repeat,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Send,
  FileEdit,
  AlertCircle,
  History,
  Clock,
  FileDown,
  RotateCcw,
  XCircle,
  Tag,
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { portalApi } from '../../api/portalApi';
import { customerApi } from '../../api/customerApi';
import { useToast } from '../../context/ToastContext';

export const CustomerProposalView = ({
  quote,
  token,
  onRefresh,
  onConfirmOverride,
  onConnectSales,
  isEmbedded = false,
}) => {
  const toast = useToast();

  // In-line Comment Modal State
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeLineForComment, setActiveLineForComment] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Counter Offer Modal State
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [activeLineForCounter, setActiveLineForCounter] = useState(null);
  const [proposedDiscount, setProposedDiscount] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  // Sales Rep Counter-Offer Action States
  const [isAcceptingRepCounter, setIsAcceptingRepCounter] = useState(false);
  const [rejectCounterModalOpen, setRejectCounterModalOpen] = useState(false);
  const [rejectCounterReason, setRejectCounterReason] = useState('');
  const [rejectCounterDiscount, setRejectCounterDiscount] = useState('');
  const [isRejectingRepCounter, setIsRejectingRepCounter] = useState(false);

  // Change Request Modal State
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [changeType, setChangeType] = useState('QuantityChange');
  const [changeLineId, setChangeLineId] = useState('');
  const [changeNewQty, setChangeNewQty] = useState('');
  const [changeDescription, setChangeDescription] = useState('');
  const [isSubmittingChange, setIsSubmittingChange] = useState(false);

  // Acceptance & Confirmation Modal State
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [signeeName, setSigneeName] = useState(quote?.customerName || '');
  const [termsAgreed, setTermsAgreed] = useState(false);
  const [isSubmittingConfirm, setIsSubmittingConfirm] = useState(false);

  // Expanded comments toggle by line ID
  const [expandedComments, setExpandedComments] = useState({});

  // PDF Download State
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      if (token) {
        await portalApi.downloadPdf(token, quote.quotationNumber || 'Proposal');
      } else {
        await customerApi.downloadMyQuotationPdf(quote.id, quote.quotationNumber || 'Proposal');
      }
      toast.success('Proposal PDF Downloaded', 'Official commercial quotation saved.');
    } catch (err) {
      toast.error('Download Failed', err.message || 'Could not download proposal PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  if (!quote) return null;

  const lines = quote.lines || [];

  // Group lines into One-Time Deliverables vs Recurring SaaS/Support Schedules
  const isLineRecurring = (l) => {
    if (l.isRecurring) return true;
    if (l.billingFrequency) return true;
    if (l.subscriptionPlanName) return true;
    const nameLower = (l.productName || '').toLowerCase();
    const skuLower = (l.sku || '').toLowerCase();
    return (
      nameLower.includes('subscription') ||
      nameLower.includes('saas') ||
      nameLower.includes('annual') ||
      nameLower.includes('monthly') ||
      skuLower.includes('sub-') ||
      skuLower.includes('saas-')
    );
  };

  const oneTimeLines = lines.filter((l) => !isLineRecurring(l));
  const recurringLines = lines.filter((l) => isLineRecurring(l));

  const isApproved = quote.status === 'Approved' || quote.approvalStatus === 'Approved';
  const isFinalized =
    quote.status === 'Confirmed' ||
    quote.status === 'ConvertedToOrder';
  const isRejected = quote.status === 'Rejected' || quote.status === 'Cancelled';
  const isPendingApproval = quote.status === 'PendingApproval' || quote.approvalStatus === 'Pending';
  const canConfirm = (isApproved || quote.status === 'Sent') && !isFinalized && !isRejected;
  const canNegotiate = !isFinalized && !isRejected && !isPendingApproval;

  // Formatting helpers
  const currency = quote.currencyCode || quote.currency || 'INR';
  const formatMoney = (amount) => formatCurrency(amount, currency);

  const toggleComments = (lineId) => {
    setExpandedComments((prev) => ({
      ...prev,
      [lineId]: !prev[lineId],
    }));
  };

  // Handlers for Modals
  const handleOpenComment = (line) => {
    setActiveLineForComment(line);
    setCommentText('');
    setCommentModalOpen(true);
  };

  const handleOpenCounter = (line) => {
    setActiveLineForCounter(line);
    setProposedDiscount(
      line.discountPercent ? String(line.discountPercent + 5) : '5'
    );
    setCounterReason('');
    setCounterModalOpen(true);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!activeLineForComment || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      if (token) {
        await portalApi.submitLineComment(token, activeLineForComment.id, commentText.trim());
      } else {
        await customerApi.submitLineComment(quote.id, activeLineForComment.id, commentText.trim());
      }
      toast.success('Inquiry Relayed', 'Your question has been sent to your dedicated account executive.');
      setCommentModalOpen(false);
      setCommentText('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error('Inquiry Relaying Failed', err.message || 'Could not submit inquiry.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitCounter = async (e) => {
    e.preventDefault();
    if (!activeLineForCounter) return;

    if (!canNegotiate) {
      toast.error('Terms Locked', 'Cannot submit counter proposals on an approved or finalized quotation.');
      return;
    }

    setIsSubmittingCounter(true);
    try {
      const payload = {
        lineId: activeLineForCounter.id,
        proposedDiscountPercent: parseFloat(proposedDiscount) || 0,
        reason: counterReason.trim(),
      };
      if (token) {
        await portalApi.submitCounterOffer(token, payload);
      } else {
        await customerApi.submitCounterOffer(quote.id, payload);
      }
      toast.success('Counter-Offer Submitted', 'Negotiation engine evaluated your request and alerted the sales team.');
      setCounterModalOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error('Counter-Offer Failed', err.message || 'Unable to submit counter proposal.');
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  const handleSubmitChangeRequest = async (e) => {
    e.preventDefault();
    if (!changeDescription.trim()) return;

    if (!canNegotiate) {
      toast.error('Terms Locked', 'Cannot submit change requests on an approved or finalized quotation.');
      return;
    }

    setIsSubmittingChange(true);
    try {
      const payload = {
        lineId: changeLineId ? parseInt(changeLineId, 10) : null,
        changeType,
        newQuantity: changeNewQty ? parseInt(changeNewQty, 10) : null,
        description: changeDescription.trim(),
      };
      if (token) {
        await portalApi.submitChangeRequest(token, payload);
      } else {
        await customerApi.submitChangeRequest(quote.id, payload);
      }
      toast.success(
        'Change Request Submitted',
        'Your requested changes have been sent to your account executive for review.'
      );
      setChangeModalOpen(false);
      setChangeDescription('');
      setChangeLineId('');
      setChangeNewQty('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error('Submission Failed', err.message || 'Could not submit change request.');
    } finally {
      setIsSubmittingChange(false);
    }
  };

  const handleAcceptRepCounter = async () => {
    setIsAcceptingRepCounter(true);
    try {
      if (token) {
        await portalApi.acceptRepCounterOffer(token);
      } else {
        await customerApi.acceptRepCounterOffer(quote.id);
      }
      toast.success(
        'Counter-Offer Accepted!',
        'Agreed terms are officially authorized and locked. You can now confirm the quotation.'
      );
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error('Acceptance Failed', err.message || 'Could not accept counter-offer.');
    } finally {
      setIsAcceptingRepCounter(false);
    }
  };

  const handleRejectRepCounter = async (e) => {
    e.preventDefault();
    setIsRejectingRepCounter(true);
    try {
      const payload = {
        reason: rejectCounterReason.trim() || 'Customer requested further adjustments.',
        counterDiscountPercent: rejectCounterDiscount ? parseFloat(rejectCounterDiscount) : null,
      };
      if (token) {
        await portalApi.rejectRepCounterOffer(token, payload);
      } else {
        await customerApi.rejectRepCounterOffer(quote.id, payload);
      }
      toast.info(
        'Counter-Offer Declined',
        'Your response and requirements have been relayed to the sales representative.'
      );
      setRejectCounterModalOpen(false);
      setRejectCounterReason('');
      setRejectCounterDiscount('');
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error('Decline Failed', err.message || 'Could not process decline.');
    } finally {
      setIsRejectingRepCounter(false);
    }
  };

  const handleConfirmQuote = async () => {
    if (!termsAgreed) {
      toast.warning('Agreement Required', 'Please check the box to confirm legal acceptance.');
      return;
    }

    setIsSubmittingConfirm(true);
    try {
      if (onConfirmOverride) {
        await onConfirmOverride(quote.id);
      } else if (token) {
        await portalApi.confirmQuote(token);
      } else {
        await customerApi.confirmMyQuotation(quote.id);
      }

      toast.success('Proposal Confirmed!', `Quotation ${quote.quotationNumber} is now formally confirmed.`);
      setConfirmModalOpen(false);
      if (onRefresh) await onRefresh();
    } catch (err) {
      toast.error('Confirmation Failed', err.message || 'Could not confirm proposal.');
    } finally {
      setIsSubmittingConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Proposal Document Surface */}
      <div className={`bg-white rounded-2xl overflow-hidden ${isEmbedded ? 'border border-slate-100 shadow-2xs' : 'border border-slate-200/90 shadow-sm'}`}>
        {/* Top Status Header Banner */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
              DF
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                  Commercial Proposal
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono font-bold text-slate-700">
                  {quote.quotationNumber}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                  v{quote.version || 1}
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {quote.customerName}
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <StatusBadge status={quote.status} />

            <Button
              variant="outline"
              size="sm"
              icon={FileDown}
              isLoading={isDownloadingPdf}
              onClick={handleDownloadPdf}
              className="border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
              title="Download official vector PDF proposal"
            >
              {isDownloadingPdf ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            {onConnectSales && (
              <Button
                variant="outline"
                size="sm"
                icon={Sparkles}
                onClick={onConnectSales}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Connect to Sales
              </Button>
            )}
            {canNegotiate && (
              <Button
                variant="outline"
                size="sm"
                icon={FileEdit}
                onClick={() => setChangeModalOpen(true)}
              >
                Request Changes
              </Button>
            )}
            {quote.hasRepCounterOffer && !isFinalized && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => setRejectCounterModalOpen(true)}
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Decline / Counter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  isLoading={isAcceptingRepCounter}
                  onClick={handleAcceptRepCounter}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Accept Counter-Offer
                </Button>
              </div>
            )}
            {isApproved && !isFinalized && (
              <Badge variant="emerald" dot>
                Approved &amp; Ready to Confirm
              </Badge>
            )}
            {canConfirm && !quote.hasRepCounterOffer && (
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => setConfirmModalOpen(true)}
              >
                Accept &amp; Confirm
              </Button>
            )}
            {isFinalized && (
              <Badge variant="emerald" dot>
                Confirmed Proposal
              </Badge>
            )}
          </div>
        </div>

        {/* Informational Status Banner */}
        {isApproved && !isFinalized && (
          <div className="px-6 py-3.5 bg-emerald-50 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Commercial Terms Officially Approved:</strong> This quotation has received executive governance authorization. Deliverable pricing, discounts, and terms are locked and ready for your final digital acceptance.
              </span>
            </div>
            {canConfirm && (
              <Button
                variant="primary"
                size="xs"
                icon={CheckCircle2}
                onClick={() => setConfirmModalOpen(true)}
                className="shrink-0 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Confirm Now
              </Button>
            )}
          </div>
        )}
        {quote.status === 'PendingApproval' && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-100 flex items-center gap-3 text-amber-800 text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Pending Governance Review:</strong> This quotation contains revised commercial terms and is currently undergoing internal review by sales leadership. Final confirmation will unlock once approved.
            </span>
          </div>
        )}

        {(quote.status === 'Confirmed' || quote.status === 'ConvertedToOrder') && (
          <div className="px-6 py-3.5 bg-emerald-50 border-b border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                <strong>Proposal Formally Confirmed & Converted:</strong> Order created and warehouse fulfillment & billing pipeline initialized.
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {quote.orderNumber && (
                <span className="bg-emerald-100/80 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300">
                  Order: {quote.orderNumber}
                </span>
              )}
              {quote.invoiceNumber && (
                <span className="bg-emerald-100/80 text-emerald-900 font-mono font-bold px-2 py-0.5 rounded border border-emerald-300">
                  Invoice: {quote.invoiceNumber}
                </span>
              )}
              {quote.activeSubscriptionsCount > 0 && (
                <span className="bg-indigo-100/80 text-indigo-900 font-bold px-2 py-0.5 rounded border border-indigo-300">
                  {quote.activeSubscriptionsCount} Subscriptions Active
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Active Sales Representative Counter-Offer Banner ── */}
        {quote.hasRepCounterOffer && !isFinalized && (
          <div className="px-6 py-4 bg-gradient-to-r from-amber-50 via-purple-50 to-indigo-50 border-b-2 border-indigo-300 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Sales Representative Counter-Offer Received
                  </h3>
                  {quote.repCounterDiscount != null && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs">
                      {quote.repCounterDiscount}% Revised Discount
                    </span>
                  )}
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                    Action Required
                  </span>
                </div>
                {quote.repCounterReason && (
                  <p className="text-xs text-slate-700 italic bg-white/80 px-3 py-1.5 rounded-lg border border-slate-200 mt-1">
                    "{quote.repCounterReason}"
                  </p>
                )}
                <p className="text-xs text-slate-600">
                  The sales representative has proposed these revised commercial terms. Accepting will lock in the agreed pricing, resolve internal approval escalations, and unlock instant order confirmation.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                className="border-slate-300 text-slate-700 hover:bg-white"
                onClick={() => setRejectCounterModalOpen(true)}
              >
                Decline / Counter
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                isLoading={isAcceptingRepCounter}
                onClick={handleAcceptRepCounter}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
              >
                Accept Counter-Offer
              </Button>
            </div>
          </div>
        )}

        {quote.status === 'UnderNegotiation' && !quote.hasRepCounterOffer && (
          <div className="px-6 py-3.5 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-purple-900 text-xs">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>
                <strong>Under Negotiation:</strong> Commercial terms are currently under discussion with your sales representative. Review the deliverables below, propose adjustments, or connect with your dedicated sales team.
              </span>
            </div>
          </div>
        )}

        {/* Document Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-medium">Proposal Reference</span>
              <span className="font-mono font-bold text-slate-800">{quote.quotationNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Offer Valid Until</span>
              <span className="font-medium text-slate-800 flex items-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {quote.expectedCloseDate
                  ? new Date(quote.expectedCloseDate).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : '30 Days from Issue'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Billing Currency</span>
              <span className="font-mono font-bold text-slate-800">{currency}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Commercial Status</span>
              <span className="font-medium text-slate-800 mt-0.5 block">{quote.status}</span>
            </div>
          </div>

          {/* Section 1: One-Time Deliverables */}
          {oneTimeLines.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <Layers className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  One-Time Deliverables &amp; Equipment ({oneTimeLines.length})
                </h2>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Deliverable Item</th>
                      <th className="py-3 px-3 text-right">Qty</th>
                      <th className="py-3 px-3 text-right">Unit Price</th>
                      <th className="py-3 px-3 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Net Total</th>
                      <th className="py-3 px-4 text-center">Interactive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {oneTimeLines.map((line) => {
                      const comments = line.comments || [];
                      const hasComments = comments.length > 0;
                      const isOpen = expandedComments[line.id];

                      return (
                        <React.Fragment key={line.id}>
                          <tr className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {line.productName}
                              {line.sku && (
                                <span className="block text-[10px] text-slate-400 font-mono font-normal mt-0.5">
                                  SKU: {line.sku}
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-right font-medium text-slate-800">
                              {line.quantity}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                              {formatMoney(line.unitPrice)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono">
                              {line.discountPercent > 0 ? (
                                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  -{line.discountPercent}%
                                </span>
                              ) : (
                                <span className="text-slate-400">0%</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                              {formatMoney(line.netAmount)}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  icon={MessageSquare}
                                  title="Submit inquiry on this line"
                                  onClick={() => handleOpenComment(line)}
                                >
                                  Inquiry
                                </Button>

                                {canNegotiate && (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    icon={Percent}
                                    title="Propose counter discount"
                                    onClick={() => handleOpenCounter(line)}
                                  >
                                    Counter
                                  </Button>
                                )}
                                {isApproved && !isFinalized && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 rounded border border-emerald-200">
                                    Approved
                                  </span>
                                )}

                                {hasComments && (
                                  <button
                                    type="button"
                                    onClick={() => toggleComments(line.id)}
                                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                    title={`${comments.length} message(s)`}
                                  >
                                    {isOpen ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                                        {comments.length}
                                        <ChevronDown className="w-3 h-3" />
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Line Comments In-line Thread */}
                          {hasComments && isOpen && (
                            <tr>
                              <td colSpan={6} className="bg-slate-50/90 px-6 py-3 border-b border-slate-100">
                                <div className="space-y-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                    Clarification &amp; Negotiation Thread
                                  </div>
                                  {comments.map((c) => (
                                    <div
                                      key={c.id}
                                      className="p-2.5 rounded-lg bg-white border border-slate-200 text-xs text-slate-700 shadow-2xs"
                                    >
                                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                        <span className="font-semibold text-slate-600">Customer Communication</span>
                                        <span>{new Date(c.createdAtUtc).toLocaleString()}</span>
                                      </div>
                                      <p className="leading-relaxed">{c.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 2: Recurring SaaS / Support Schedules */}
          {recurringLines.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Repeat className="w-4 h-4 text-purple-600" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-purple-900">
                    Recurring SaaS &amp; Support Subscriptions ({recurringLines.length})
                  </h2>
                </div>
                <Badge variant="purple" size="sm">
                  Subscription Schedules
                </Badge>
              </div>

              <div className="overflow-x-auto rounded-xl border border-purple-200/80 bg-purple-50/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-purple-100 bg-purple-50/60 text-purple-900 font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-4">Service / SaaS Plan</th>
                      <th className="py-3 px-3">Billing Cycle</th>
                      <th className="py-3 px-3 text-right">Licenses</th>
                      <th className="py-3 px-3 text-right">Rate / Period</th>
                      <th className="py-3 px-3 text-right">Discount</th>
                      <th className="py-3 px-4 text-right">Periodic Net</th>
                      <th className="py-3 px-4 text-center">Interactive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-100/60 text-slate-700">
                    {recurringLines.map((line) => {
                      const comments = line.comments || [];
                      const hasComments = comments.length > 0;
                      const isOpen = expandedComments[line.id];
                      const frequency = line.billingFrequency || 'Annual';

                      return (
                        <React.Fragment key={line.id}>
                          <tr className="hover:bg-purple-50/40 transition-colors">
                            <td className="py-3.5 px-4 font-semibold text-slate-900">
                              {line.productName}
                              <span className="block text-[10px] text-purple-700 font-medium mt-0.5">
                                Plan: {line.subscriptionPlanName || 'Enterprise Subscription'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <Badge variant="purple" size="sm">
                                {frequency}
                              </Badge>
                            </td>
                            <td className="py-3.5 px-3 text-right font-medium text-slate-800">
                              {line.quantity} Seats
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono text-slate-700">
                              {formatMoney(line.unitPrice)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono">
                              {line.discountPercent > 0 ? (
                                <span className="text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
                                  -{line.discountPercent}%
                                </span>
                              ) : (
                                <span className="text-slate-400">0%</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-purple-950 font-mono">
                              {formatMoney(line.netAmount)}
                              <span className="block text-[9px] text-purple-600 font-normal">
                                per {frequency.toLowerCase()}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  icon={MessageSquare}
                                  title="Submit inquiry on this line"
                                  onClick={() => handleOpenComment(line)}
                                >
                                  Inquiry
                                </Button>

                                {canNegotiate && (
                                  <Button
                                    variant="outline"
                                    size="xs"
                                    icon={Percent}
                                    title="Propose counter discount"
                                    onClick={() => handleOpenCounter(line)}
                                  >
                                    Counter
                                  </Button>
                                )}
                                {isApproved && !isFinalized && (
                                  <span className="px-1.5 py-0.5 text-[10px] font-semibold text-purple-700 bg-purple-50 rounded border border-purple-200">
                                    Approved
                                  </span>
                                )}

                                {hasComments && (
                                  <button
                                    type="button"
                                    onClick={() => toggleComments(line.id)}
                                    className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                  >
                                    {isOpen ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <span className="flex items-center gap-0.5 text-[10px] font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded-full">
                                        {comments.length}
                                        <ChevronDown className="w-3 h-3" />
                                      </span>
                                    )}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Line Comments In-line Thread */}
                          {hasComments && isOpen && (
                            <tr>
                              <td colSpan={7} className="bg-purple-50/75 px-6 py-3 border-b border-purple-100">
                                <div className="space-y-2">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700">
                                    Subscription Clarification Thread
                                  </div>
                                  {comments.map((c) => (
                                    <div
                                      key={c.id}
                                      className="p-2.5 rounded-lg bg-white border border-purple-200 text-xs text-slate-700 shadow-2xs"
                                    >
                                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                                        <span className="font-semibold text-slate-600">Customer Communication</span>
                                        <span>{new Date(c.createdAtUtc).toLocaleString()}</span>
                                      </div>
                                      <p className="leading-relaxed">{c.comment}</p>
                                    </div>
                                  ))}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Commercial Terms & Financials Summary Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200">
            {/* Left: Commitments & Delivery Notes */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Commercial Terms &amp; Fulfillment SLA
              </span>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                <p>
                  <strong>Payment Terms:</strong> Net 30 days from date of initial invoice.
                </p>
                <p>
                  <strong>Hardware &amp; Equipment Delivery:</strong> Standard express freight with tracked carrier logistics and 3-year hardware warranty.
                </p>
                <p>
                  <strong>Cloud &amp; SaaS SLA:</strong> Guaranteed 99.95% service availability with dedicated tier-1 support engineering.
                </p>
                {quote.notes && (
                  <div className="pt-2 border-t border-slate-200 text-slate-700">
                    <strong>Special Terms / Remarks:</strong>
                    <p className="mt-0.5 italic">{quote.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Authoritative Financial Totals */}
            <div className="space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Financial Summary
              </span>
              <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross List Subtotal:</span>
                  <span className="font-mono text-slate-900">{formatMoney(quote.subTotal)}</span>
                </div>

                {quote.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Negotiated Customer Savings:</span>
                    <span className="font-mono">-{formatMoney(quote.discountTotal)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600">
                  <span>Estimated Taxes (18%):</span>
                  <span className="font-mono text-slate-900">{formatMoney(quote.taxTotal)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline font-extrabold text-base text-slate-900">
                  <div>
                    <span>Total Proposal Value:</span>
                    <span className="block text-[10px] text-slate-400 font-normal">
                      Includes all deliverables and scheduled periods
                    </span>
                  </div>
                  <span className="font-mono text-xl text-blue-600">
                    {formatMoney(quote.grandTotal)}
                  </span>
                </div>

                {canConfirm && (
                  <div className="pt-4">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full"
                      icon={CheckCircle2}
                      onClick={() => setConfirmModalOpen(true)}
                    >
                      Accept &amp; Confirm Proposal
                    </Button>
                    <p className="text-[10px] text-center text-slate-400 mt-2">
                      Formal confirmation creates an active operational order.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Negotiation & Revision History Timeline */}
          {quote.changeRequests && quote.changeRequests.length > 0 && (
            <div className="space-y-3 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-500" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Negotiation &amp; Revision Log ({quote.changeRequests.length})
                </h2>
              </div>
              <div className="space-y-2.5">
                {quote.changeRequests.map((change) => (
                  <div
                    key={change.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200 text-[11px]">
                          {change.changeType || 'Change Request'}
                        </span>
                        <span className="text-slate-400 text-[11px] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(change.createdAtUtc).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{change.description}</p>
                    </div>
                    <Badge variant="blue" size="sm">
                      Logged in Audit Trail
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Line Item Inquiry Modal */}
      <Modal
        isOpen={commentModalOpen}
        onClose={() => setCommentModalOpen(false)}
        title="Submit Line Item Inquiry"
        description={`Ask a question or clarify scope for ${activeLineForComment?.productName}`}
      >
        <form onSubmit={handleSubmitComment} className="space-y-4">
          <Textarea
            label="Inquiry / Clarification Message"
            required
            placeholder="e.g., Can we get technical confirmation on hardware compatibility or lead times?"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            rows={4}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCommentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingComment}
              icon={Send}
            >
              Send Inquiry
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Counter Proposal Modal */}
      <Modal
        isOpen={counterModalOpen}
        onClose={() => setCounterModalOpen(false)}
        title="Propose Counter Discount Terms"
        description={`Submit commercial counter-terms for ${activeLineForCounter?.productName}`}
      >
        <form onSubmit={handleSubmitCounter} className="space-y-4">
          <Input
            label="Requested Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            required
            value={proposedDiscount}
            onChange={(e) => setProposedDiscount(e.target.value)}
            helperText="The negotiation engine will evaluate this proposal against company governance guidelines."
          />

          <Textarea
            label="Business Justification / Volume Commitment"
            placeholder="e.g., Requesting 12% discount in exchange for signing a multi-year service commitment."
            value={counterReason}
            onChange={(e) => setCounterReason(e.target.value)}
            rows={3}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCounterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingCounter}
              icon={Percent}
            >
              Submit Counter Offer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Two-Step Formal Acceptance & Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Formal Proposal Acceptance"
        description={`Confirm commercial quotation ${quote.quotationNumber} for ${quote.customerName}`}
      >
        <div className="space-y-4">
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Customer Name:</span>
              <span className="font-semibold text-slate-800">{quote.customerName}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Deliverables:</span>
              <span className="font-semibold text-slate-800">{lines.length} Line Item(s)</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-2 border-t border-slate-200 text-sm">
              <span>Total Authorized Amount:</span>
              <span className="font-mono text-blue-600">{formatMoney(quote.grandTotal)}</span>
            </div>
          </div>

          <Input
            label="Authorized Signee Name"
            required
            value={signeeName}
            onChange={(e) => setSigneeName(e.target.value)}
            placeholder="Full Name"
          />

          {/* Legal Acceptance Checkbox */}
          <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 flex items-start gap-3">
            <input
              id="terms-acceptance"
              type="checkbox"
              checked={termsAgreed}
              onChange={(e) => setTermsAgreed(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer w-4 h-4"
            />
            <label
              htmlFor="terms-acceptance"
              className="text-xs text-slate-700 leading-relaxed cursor-pointer"
            >
              I confirm that I am authorized to accept this proposal on behalf of{' '}
              <strong>{quote.customerName}</strong> and agree that this confirmation represents a binding commercial agreement under the specified terms.
            </label>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModalOpen(false)}
            >
              Review More
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingConfirm}
              disabled={!termsAgreed}
              icon={CheckCircle2}
              onClick={handleConfirmQuote}
            >
              Authorize &amp; Confirm Proposal
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal 4: Commercial Change Request Modal */}
      <Modal
        isOpen={changeModalOpen}
        onClose={() => setChangeModalOpen(false)}
        title="Submit Commercial Change Request"
        description={`Request modifications or adjustments to proposal ${quote.quotationNumber}`}
      >
        <form onSubmit={handleSubmitChangeRequest} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Change Category
            </label>
            <Select
              value={changeType}
              onChange={(e) => setChangeType(e.target.value)}
              options={[
                { value: 'QuantityChange', label: 'Quantity Adjustment' },
                { value: 'ScopeChange', label: 'Product / Scope Modification' },
                { value: 'Terms', label: 'Commercial / Payment Terms' },
                { value: 'General', label: 'General Inquiries & Other' }
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Associated Deliverable Line (Optional)
            </label>
            <Select
              value={changeLineId}
              onChange={(e) => setChangeLineId(e.target.value)}
              options={[
                { value: '', label: '-- Applies to Overall Proposal --' },
                ...lines.map((l) => ({
                  value: l.id,
                  label: `${l.productName} (${l.quantity}x @ ${formatMoney(l.unitPrice)})`
                }))
              ]}
            />
          </div>

          {changeType === 'QuantityChange' && (
            <Input
              label="Proposed Quantity"
              type="number"
              min="1"
              value={changeNewQty}
              onChange={(e) => setChangeNewQty(e.target.value)}
              placeholder="e.g. 5"
            />
          )}

          <Textarea
            label="Detailed Change Description / Reason"
            required
            placeholder="e.g., We would like to increase the license count to 25 units and defer hardware delivery by 2 weeks."
            value={changeDescription}
            onChange={(e) => setChangeDescription(e.target.value)}
            rows={4}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setChangeModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingChange}
              icon={Send}
            >
              Submit Change Request
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal 5: Decline / Counter Sales Rep Offer Modal */}
      <Modal
        isOpen={rejectCounterModalOpen}
        onClose={() => setRejectCounterModalOpen(false)}
        title="Respond to Sales Counter-Offer"
        description={`Decline or submit a counter-proposal on proposal ${quote.quotationNumber}`}
      >
        <form onSubmit={handleRejectRepCounter} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
            <span className="font-semibold text-slate-700 block">Current Sales Representative Proposal:</span>
            {quote.repCounterDiscount != null && (
              <span className="inline-block px-2.5 py-0.5 rounded bg-indigo-100 text-indigo-900 font-bold text-xs">
                {quote.repCounterDiscount}% Special Discount
              </span>
            )}
            {quote.repCounterReason && (
              <p className="text-slate-600 italic bg-white p-2 rounded border border-slate-100 mt-1">
                "{quote.repCounterReason}"
              </p>
            )}
          </div>

          <Textarea
            label="Reason for Declining / Feedback (Optional)"
            placeholder="e.g., We need a slightly higher discount to fit within our current budget limits."
            value={rejectCounterReason}
            onChange={(e) => setRejectCounterReason(e.target.value)}
            rows={3}
          />

          <Input
            label="Alternative Discount Request (%) (Optional)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            placeholder="e.g. 15"
            value={rejectCounterDiscount}
            onChange={(e) => setRejectCounterDiscount(e.target.value)}
            helperText="Specify an alternative percentage if you'd like to counter-offer back to the sales executive."
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectCounterModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isRejectingRepCounter}
              icon={Send}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              Relay Response
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerProposalView;
