import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { quotationApi, approvalApi } from '../../api';
import { Drawer, Button, StatusBadge, Modal, Textarea } from '../ui';
import {
  ExternalLink,
  Send,
  CheckCircle,
  XCircle,
  RotateCcw,
  User,
  Building2,
  Calendar,
  Layers,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  MessageSquare,
  FileDown,
} from 'lucide-react';
import { formatCurrency, formatDate, formatPercent } from '../../utils/formatters';
import { RepNegotiationModal } from '../quotation/RepNegotiationModal';

export const DealDetailDrawer = ({
  isOpen,
  onClose,
  quoteSummary,
  onQuoteUpdated,
}) => {
  const navigate = useNavigate();
  const { user, isSalesManager, isFinance, isAdmin } = useAuth();
  const isApprover = isSalesManager || isFinance || isAdmin;
  const toast = useToast();

  const [fullQuote, setFullQuote] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Quick Approval modal state
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState('Approve');
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  const activeQuote = fullQuote || quoteSummary;

  useEffect(() => {
    if (isOpen && quoteSummary?.id) {
      loadFullDetails(quoteSummary.id);
    } else {
      setFullQuote(null);
    }
  }, [isOpen, quoteSummary?.id]);

  const loadFullDetails = async (id) => {
    setIsLoadingDetails(true);
    try {
      const data = await quotationApi.getQuotationById(id);
      setFullQuote(data);
    } catch (err) {
      // Fallback silently to summary data
      console.warn('Could not load detailed quote lines:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleCopyPortalLink = () => {
    if (!activeQuote?.id) return;
    const link = `${window.location.origin}/portal/quote/${activeQuote.id}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    toast.success('Customer portal negotiation link copied to clipboard');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const [isRepNegotiateOpen, setIsRepNegotiateOpen] = useState(false);
  const [isSendingQuote, setIsSendingQuote] = useState(false);

  const handleSendQuote = async () => {
    if (!activeQuote?.id) return;
    setIsSendingQuote(true);
    try {
      const res = await quotationApi.sendQuotation(activeQuote.id);
      toast.success(res.message || 'Quotation sent to client');
      await loadFullDetails(activeQuote.id);
      onQuoteUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to send quotation');
    } finally {
      setIsSendingQuote(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!activeQuote?.id) return;
    setIsSubmittingApproval(true);
    try {
      const res = await quotationApi.submitForApproval(activeQuote.id);
      toast.success(res.message || 'Quotation submitted for approval');
      setFullQuote(res);
      onQuoteUpdated?.();
    } catch (err) {
      toast.error(err.message || 'Failed to submit quote for approval');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleExecuteDecision = async () => {
    if (!activeQuote?.id) return;
    setIsSubmittingDecision(true);
    try {
      await approvalApi.actionQuotationApproval(activeQuote.id, {
        action: decisionAction,
        reason: decisionReason || `${decisionAction}d from Pipeline Deal Drawer`,
      });
      toast.success(`Quotation ${decisionAction}d successfully`);
      setIsDecisionModalOpen(false);
      setDecisionReason('');
      await loadFullDetails(activeQuote.id);
      onQuoteUpdated?.();
    } catch (err) {
      toast.error(err.message || `Failed to ${decisionAction.toLowerCase()} quotation`);
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  if (!quoteSummary && !fullQuote) return null;

  const riskScore = Number(activeQuote?.riskScore) || 0;
  const marginPercent = Number(activeQuote?.marginPercent) || 0;

  const getStageTitle = (status) => {
    switch (status) {
      case 'Draft': return 'Draft Proposal';
      case 'PendingApproval': return 'Pending Approval';
      case 'Approved': return 'Approved / Ready';
      case 'UnderNegotiation': return 'Client Negotiation';
      case 'ConvertedToOrder': return 'Confirmed Order';
      default: return status || 'Unknown';
    }
  };

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        width="md"
        title={activeQuote?.customerName || 'Deal Details'}
        subtitle={activeQuote?.quotationNumber || 'Quotation Overview'}
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
            <div className="flex items-center gap-2">
              {/* Action: Send to Customer if Draft or Approved */}
              {(activeQuote?.status === 'Draft' || activeQuote?.status === 'Approved') && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Send}
                  loading={isSendingQuote}
                  onClick={handleSendQuote}
                >
                  Send Quote
                </Button>
              )}

              {/* Action: Negotiate Terms if Sent or UnderNegotiation */}
              {(activeQuote?.status === 'Sent' || activeQuote?.status === 'UnderNegotiation' || activeQuote?.hasPendingCounterOffer) && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={MessageSquare}
                  onClick={() => setIsRepNegotiateOpen(true)}
                  className={
                    activeQuote?.hasPendingCounterOffer
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-indigo-600 hover:bg-indigo-700'
                  }
                >
                  Negotiate
                </Button>
              )}

              {/* Contextual Action: Submit for approval if Draft */}
              {activeQuote?.status === 'Draft' && activeQuote?.approvalStatus !== 'Approved' && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={Send}
                  loading={isSubmittingApproval}
                  onClick={handleSubmitForApproval}
                >
                  Submit Approval
                </Button>
              )}

              {/* Contextual Action: Quick Review/Approve if Pending */}
              {activeQuote?.status === 'PendingApproval' && isApprover && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle}
                  onClick={() => setIsDecisionModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Review Deal
                </Button>
              )}

              {/* Quick Action: Download PDF */}
              <Button
                variant="outline"
                size="sm"
                icon={FileDown}
                onClick={() => quotationApi.downloadPdf(activeQuote.id, activeQuote.quotationNumber)}
                title="Download official vector PDF quotation"
              >
                PDF
              </Button>

              {/* Primary Action: Open Full Quote Page */}
              <Button
                variant="primary"
                size="sm"
                icon={ExternalLink}
                onClick={() => {
                  onClose();
                  navigate(`/workspace/quotations/${activeQuote.id}`);
                }}
              >
                Open Quote
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-6 text-sm">
          {/* Top Deal Header Card */}
          <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[11px] font-mono text-slate-400 block">
                  {activeQuote?.quotationNumber}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-0.5">
                  {activeQuote?.customerName}
                </h3>
              </div>
              <StatusBadge status={activeQuote?.status} size="sm" />
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Total Deal Value</span>
                <span className="text-lg font-bold font-mono text-slate-900">
                  {formatCurrency(activeQuote?.grandTotal || 0, activeQuote?.currency || 'INR')}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-medium block">Stage</span>
                <span className="text-xs font-semibold text-slate-700">
                  {getStageTitle(activeQuote?.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Active Customer Counter-Offer Highlight in Pipeline Drawer */}
          {activeQuote?.hasPendingCounterOffer && (
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <MessageSquare className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-amber-950 block">
                    Customer Counter-Offer: {activeQuote.latestCounterDiscount}% Discount
                  </span>
                  {activeQuote.latestCounterReason && (
                    <p className="text-amber-900 mt-0.5 italic">"{activeQuote.latestCounterReason}"</p>
                  )}
                </div>
              </div>
              <Button
                variant="primary"
                size="xs"
                className="bg-amber-600 hover:bg-amber-700 shrink-0"
                onClick={() => setIsRepNegotiateOpen(true)}
              >
                Negotiate
              </Button>
            </div>
          )}

          {/* Deal Specifics Matrix */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Deal Metrics
            </h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 bg-white rounded-lg border border-slate-200/70">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" /> Sales Rep
                </span>
                <span className="text-xs font-semibold text-slate-900 mt-1 block truncate">
                  {activeQuote?.salesRepName || 'Unassigned'}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200/70">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-slate-400" /> Margin
                </span>
                <span
                  className={`text-xs font-bold font-mono mt-1 block ${
                    marginPercent >= 20
                      ? 'text-emerald-700'
                      : marginPercent >= 15
                      ? 'text-amber-700'
                      : 'text-rose-600'
                  }`}
                >
                  {marginPercent > 0 ? `+${marginPercent.toFixed(1)}%` : `${marginPercent.toFixed(1)}%`}
                </span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200/70">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-slate-400" /> Risk Assessment
                </span>
                <div className="mt-1 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      riskScore >= 70
                        ? 'bg-rose-500'
                        : riskScore >= 30
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span className="text-xs font-semibold text-slate-800">
                    {riskScore >= 70 ? 'High Risk' : riskScore >= 30 ? 'Medium' : 'Low Risk'}
                    {riskScore > 0 ? ` (${Math.round(riskScore)})` : ''}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-lg border border-slate-200/70">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" /> Created
                </span>
                <span className="text-xs font-semibold text-slate-700 mt-1 block">
                  {formatDate(activeQuote?.createdAtUtc || new Date())}
                </span>
              </div>
            </div>
          </div>

          {/* Governance & Approval Track */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Approval Governance
            </h4>
            <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Approval Requirement:</span>
                <span className="font-semibold text-slate-900">
                  {riskScore >= 70
                    ? 'Finance Operations Required'
                    : riskScore >= 30
                    ? 'Sales Manager Required'
                    : 'Auto-Approved (Low Risk)'}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-600">Current Status:</span>
                <span
                  className={`font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                    activeQuote?.approvalStatus === 'Approved'
                      ? 'bg-emerald-50 text-emerald-700'
                      : activeQuote?.approvalStatus === 'Pending'
                      ? 'bg-amber-50 text-amber-700'
                      : activeQuote?.approvalStatus === 'Rejected'
                      ? 'bg-rose-50 text-rose-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {activeQuote?.approvalStatus || 'None'}
                </span>
              </div>
            </div>
          </div>

          {/* Product Lines Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-slate-400" /> Products & Services
              </h4>
              <span className="text-[11px] text-slate-400 font-mono">
                {fullQuote?.lines?.length ? `${fullQuote.lines.length} items` : ''}
              </span>
            </div>

            {isLoadingDetails ? (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Loading line items...
              </div>
            ) : fullQuote?.lines && fullQuote.lines.length > 0 ? (
              <div className="rounded-xl border border-slate-200/80 overflow-hidden divide-y divide-slate-100">
                {fullQuote.lines.map((line) => (
                  <div key={line.id} className="p-2.5 bg-white flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-slate-800 block truncate">
                        {line.productName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Qty: {line.quantity} × {formatCurrency(line.unitPrice)}
                        {line.discountPercent > 0 && ` (${line.discountPercent}% off)`}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      {formatCurrency(line.netAmount || (line.unitPrice * line.quantity))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                Line details available upon opening quote.
              </div>
            )}
          </div>

          {/* Customer Portal Share Link */}
          {(activeQuote?.status === 'Approved' || activeQuote?.status === 'UnderNegotiation') && (
            <div className="p-3 bg-blue-50/40 rounded-xl border border-blue-200/60 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-blue-900 block">Customer Portal Link</span>
                <span className="text-[11px] text-blue-600 block truncate">
                  Share direct portal review & negotiation link
                </span>
              </div>
              <Button
                variant="outline"
                size="xs"
                icon={copiedLink ? Check : Copy}
                onClick={handleCopyPortalLink}
                className="shrink-0 bg-white"
              >
                {copiedLink ? 'Copied' : 'Copy Link'}
              </Button>
            </div>
          )}
        </div>
      </Drawer>

      {/* Quick Approval / Rejection Modal */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={`Review Quotation ${activeQuote?.quotationNumber}`}
        subtitle="Record your governance decision and update quotation status."
        size="md"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDecisionModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={isSubmittingDecision}
              onClick={handleExecuteDecision}
              className={
                decisionAction === 'Approve'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : decisionAction === 'Reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }
            >
              Confirm {decisionAction}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Decision Action</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecisionAction('Approve')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  decisionAction === 'Approve'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Approve
              </button>
              <button
                type="button"
                onClick={() => setDecisionAction('RequestRevision')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  decisionAction === 'RequestRevision'
                    ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                Revise
              </button>
              <button
                type="button"
                onClick={() => setDecisionAction('Reject')}
                className={`p-2.5 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  decisionAction === 'Reject'
                    ? 'border-rose-500 bg-rose-50 text-rose-700 ring-2 ring-rose-500/20'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                Reject
              </button>
            </div>
          </div>

          <Textarea
            label="Decision Note / Reason"
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
            placeholder={`Provide context for ${decisionAction.toLowerCase()}ing this deal...`}
            rows={3}
          />
        </div>
      </Modal>

      {/* Sales Representative Negotiation Modal */}
      <RepNegotiationModal
        isOpen={isRepNegotiateOpen}
        onClose={() => setIsRepNegotiateOpen(false)}
        quote={activeQuote}
        onSuccess={() => {
          loadFullDetails(activeQuote?.id);
          onQuoteUpdated?.();
        }}
      />
    </>
  );
};

export default DealDetailDrawer;
