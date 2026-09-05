import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { quotationApi, adminApi, fulfillmentApi, approvalApi } from '../api';
import {
  Button,
  StatusBadge,
  Drawer,
  Modal,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
  SkeletonQuoteDetail,
} from '../components/ui';
import {
  ArrowLeft,
  Plus,
  Send,
  CheckCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  FileCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Trash2,
  RefreshCw,
  TrendingUp,
  Edit2,
  MessageSquare,
  Truck,
  AlertTriangle,
  DollarSign,
  Tag,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const QuotationDetailPage = () => {
  const { id } = useParams();
  const { user, isSalesManager, isFinance, isAdmin } = useAuth();
  const isApprover = isSalesManager || isFinance || isAdmin;
  const navigate = useNavigate();
  const toast = useToast();

  const [quote, setQuote] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('lines'); // lines, negotiation, recommendations, approvals, fulfillment

  // Governance decision modal state
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [decisionAction, setDecisionAction] = useState('Approve');
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);


  // Drawer for adding a line item
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [lineQty, setLineQty] = useState(1);
  const [lineDiscount, setLineDiscount] = useState(0);
  const [linePrice, setLinePrice] = useState(0);
  const [isSubmittingLine, setIsSubmittingLine] = useState(false);

  // Drawer for editing a line item
  const [editingLine, setEditingLine] = useState(null);
  const [editQty, setEditQty] = useState(1);
  const [editDiscount, setEditDiscount] = useState(0);
  const [editPrice, setEditPrice] = useState(0);
  const [isUpdatingLine, setIsUpdatingLine] = useState(false);

  // Line Price Negotiation modal state
  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);
  const [negotiatingLine, setNegotiatingLine] = useState(null);
  const [targetUnitPrice, setTargetUnitPrice] = useState(0);
  const [targetDiscountPercent, setTargetDiscountPercent] = useState(0);
  const [targetQuantity, setTargetQuantity] = useState(1);
  const [negotiateReason, setNegotiateReason] = useState('');
  const [isSubmittingNegotiation, setIsSubmittingNegotiation] = useState(false);

  // Deal-wide negotiation modal state
  const [isDealNegotiateModalOpen, setIsDealNegotiateModalOpen] = useState(false);
  const [dealDiscountPercent, setDealDiscountPercent] = useState(5);
  const [dealNegotiateReason, setDealNegotiateReason] = useState('');
  const [isSubmittingDealNegotiation, setIsSubmittingDealNegotiation] = useState(false);

  // Dismissed recommendations list
  const [dismissedRecIds, setDismissedRecIds] = useState([]);

  // Fulfillment preview data for quote detail view
  const [fulfillmentPreview, setFulfillmentPreview] = useState(null);
  const [isLoadingFulfillment, setIsLoadingFulfillment] = useState(false);

  // Line comment reply state: { [lineId]: string }
  const [lineReplyTexts, setLineReplyTexts] = useState({});
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);

  // Portal Link Modal
  const [portalLink, setPortalLink] = useState('');
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  useEffect(() => {
    loadQuoteData();
    loadCatalog();
  }, [id]);

  const loadQuoteData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await quotationApi.getQuotationById(id);
      setQuote(data);

      // Also load upsell recommendations
      try {
        const recs = await quotationApi.getRecommendations(id);
        setRecommendations(Array.isArray(recs) ? recs : []);
      } catch (e) {
        console.warn('Could not load recommendations:', e);
      }
    } catch (err) {
      setError(err.message || 'Failed to load quotation.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCatalog = async () => {
    try {
      const prods = await adminApi.getProducts();
      setProducts(Array.isArray(prods) ? prods : prods?.value || []);
    } catch (e) {
      console.warn('Failed to load products:', e);
    }
  };

  const handleProductSelect = (pId) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === parseInt(pId, 10));
    if (prod) {
      setLinePrice(prod.basePrice || 0);
    }
  };

  const handleAddLine = async (e) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setIsSubmittingLine(true);
    try {
      await quotationApi.addLineItem(id, {
        productId: parseInt(selectedProductId, 10),
        quantity: parseInt(lineQty, 10) || 1,
        unitPrice: parseFloat(linePrice) || 0,
        discountPercent: parseFloat(lineDiscount) || 0,
      });

      toast.success('Line Added', 'Quotation and gross margins recalculated.');
      setIsAddLineOpen(false);
      setSelectedProductId('');
      setLineQty(1);
      setLineDiscount(0);
      await loadQuoteData();
    } catch (err) {
      toast.error('Add Line Failed', err.message);
    } finally {
      setIsSubmittingLine(false);
    }
  };

  const handleRemoveLine = async (lineId) => {
    try {
      await quotationApi.removeLineItem(id, lineId);
      toast.success('Line Removed', 'Totals and margin rules recalculated.');
      await loadQuoteData();
    } catch (err) {
      toast.error('Remove Failed', err.message);
    }
  };

  const handleSubmitApproval = async () => {
    try {
      const updated = await quotationApi.submitForApproval(id);
      setQuote(updated);
      if (updated.approvalStatus === 'Approved') {
        toast.success('Auto-Approved', 'Quote passed all customer tier discount limits.');
      } else {
        toast.info('Approval Triggered', `Routed for governance review. Risk Score: ${updated.riskScore}`);
      }
    } catch (err) {
      toast.error('Submission Failed', err.message);
    }
  };

  const handleRecalculate = async () => {
    try {
      const updated = await quotationApi.recalculate(id);
      setQuote(updated);
      toast.success('Recalculated', 'Margin engine updated authoritative totals.');
    } catch (err) {
      toast.error('Recalculate Failed', err.message);
    }
  };

  const handleConvertToOrder = async () => {
    try {
      const order = await quotationApi.convertToOrder(id);
      toast.success('Converted to Order', `Sale Order ${order.orderNumber} successfully confirmed.`);
      if (isFinance || isAdmin) {
        navigate(`/workspace/fulfillment?orderId=${order.id}`);
      } else {
        await loadQuoteData();
      }
    } catch (err) {
      toast.error('Conversion Failed', err.message);
    }
  };

  const handleGeneratePortal = async () => {
    try {
      const res = await quotationApi.generatePortalLink(id);
      setPortalLink(res.portalLink);
      setIsPortalModalOpen(true);
    } catch (err) {
      toast.error('Portal Error', err.message);
    }
  };

  const handleAcceptRecommendation = async (rec) => {
    try {
      await quotationApi.addLineItem(id, {
        productId: rec.productId,
        quantity: 1,
        unitPrice: rec.unitPrice,
        discountPercent: 0,
      });
      toast.success('Upsell Accepted', `${rec.productName} added to proposal.`);
      await loadQuoteData();
    } catch (err) {
      toast.error('Failed to add suggestion', err.message);
    }
  };

  const handleOpenEditLine = (line) => {
    setEditingLine(line);
    setEditQty(line.quantity);
    setEditDiscount(line.discountPercent || 0);
    setEditPrice(line.unitPrice);
  };

  const handleUpdateLine = async (e) => {
    e.preventDefault();
    if (!editingLine) return;

    setIsUpdatingLine(true);
    try {
      await quotationApi.updateLineItem(id, editingLine.id, {
        quantity: parseInt(editQty, 10) || 1,
        unitPrice: parseFloat(editPrice) || 0,
        discountPercent: parseFloat(editDiscount) || 0,
      });

      toast.success('Line Updated', 'Line updated. If previously approved, proposal has returned to Draft to enforce governance verification.');
      setEditingLine(null);
      await loadQuoteData();
    } catch (err) {
      toast.error('Update Line Failed', err.message);
    } finally {
      setIsUpdatingLine(false);
    }
  };

  const handleOpenNegotiateLine = (line) => {
    setNegotiatingLine(line);
    setTargetUnitPrice(line.unitPrice || 0);
    setTargetDiscountPercent(line.discountPercent || 0);
    setTargetQuantity(line.quantity || 1);
    setNegotiateReason('');
    setIsNegotiateModalOpen(true);
  };

  const handleSubmitNegotiateLine = async (e) => {
    e.preventDefault();
    if (!negotiatingLine) return;

    if (quote?.status === 'Approved' || quote?.approvalStatus === 'Approved') {
      toast.error('Terms Locked', 'Cannot negotiate prices on an approved quotation. Commercial terms are locked.');
      return;
    }

    setIsSubmittingNegotiation(true);
    try {
      await quotationApi.negotiateLinePrice(id, negotiatingLine.id, {
        targetUnitPrice: parseFloat(targetUnitPrice) || 0,
        targetDiscountPercent: parseFloat(targetDiscountPercent) || 0,
        quantity: parseInt(targetQuantity, 10) || 1,
        reason: negotiateReason.trim() || 'Commercial counter-pricing proposed by Sales Representative.',
      });

      toast.success(
        'Counter-Offer Applied',
        `Updated line pricing for ${negotiatingLine.productName}. Status changed to Under Negotiation.`
      );
      setIsNegotiateModalOpen(false);
      setNegotiatingLine(null);
      await loadQuoteData();
    } catch (err) {
      toast.error('Negotiation Failed', err.message || 'Could not apply counter-pricing.');
    } finally {
      setIsSubmittingNegotiation(false);
    }
  };

  const handleOpenNegotiateDeal = () => {
    setDealDiscountPercent(quote?.customerTierMaxDiscount || 5);
    setDealNegotiateReason('');
    setIsDealNegotiateModalOpen(true);
  };

  const handleSubmitNegotiateDeal = async (e) => {
    e.preventDefault();

    if (quote?.status === 'Approved' || quote?.approvalStatus === 'Approved') {
      toast.error('Terms Locked', 'Cannot negotiate terms on an approved quotation. Commercial terms are locked.');
      return;
    }

    setIsSubmittingDealNegotiation(true);
    try {
      await quotationApi.negotiateDeal(id, {
        overallDiscountPercent: parseFloat(dealDiscountPercent) || 0,
        reason: dealNegotiateReason.trim() || 'Deal-wide discount counter-offer proposed by Sales Representative.',
      });

      toast.success(
        'Deal Terms Updated',
        `Deal-wide discount of ${dealDiscountPercent}% applied. Status changed to Under Negotiation.`
      );
      setIsDealNegotiateModalOpen(false);
      await loadQuoteData();
    } catch (err) {
      toast.error('Deal Negotiation Failed', err.message || 'Could not apply deal terms.');
    } finally {
      setIsSubmittingDealNegotiation(false);
    }
  };

  const handleSendLineComment = async (lineId) => {
    const text = lineReplyTexts[lineId]?.trim();
    if (!text) return;

    setIsSubmittingReply(true);
    try {
      await quotationApi.addLineComment(id, lineId, text);
      toast.success('Reply Sent', 'Your response has been added to the customer inquiry thread.');
      setLineReplyTexts((prev) => ({ ...prev, [lineId]: '' }));
      await loadQuoteData();
    } catch (err) {
      toast.error('Failed to post reply', err.message);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleDismissRecommendation = (productId) => {
    setDismissedRecIds((prev) => [...prev, productId]);
    toast.info('Suggestion Dismissed', 'Recommendation hidden from view.');
  };

  const handleQuotationApproval = async (actionType) => {
    if ((actionType === 'Reject' || actionType === 'RequestRevision') && decisionReason.trim().length < 10) {
      toast.error('Detailed Reason Required', 'Please provide an explanation of at least 10 characters.');
      return;
    }

    setIsSubmittingDecision(true);
    try {
      await approvalApi.actionQuotationApproval(id, {
        action: actionType,
        reason: decisionReason.trim() || `Approved under standard authority by ${user?.fullName}.`,
      });

      const label = actionType === 'Approve' ? 'Approved' : actionType === 'RequestRevision' ? 'Returned for Revision' : 'Rejected';
      toast.success('Governance Decision Processed', `Quotation ${quote.quotationNumber} marked as ${label}.`);
      setIsDecisionModalOpen(false);
      setDecisionReason('');
      await loadQuoteData();
    } catch (err) {
      toast.error('Approval Action Failed', err.message);
    } finally {
      setIsSubmittingDecision(false);
    }
  };


  const loadFulfillmentPreview = async (orderId) => {
    if (!orderId) return;
    setIsLoadingFulfillment(true);
    try {
      const res = await fulfillmentApi.previewAllocation(orderId);
      setFulfillmentPreview(res);
    } catch (err) {
      console.warn('Failed to load fulfillment preview:', err);
    } finally {
      setIsLoadingFulfillment(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fulfillment' && quote?.orderId) {
      loadFulfillmentPreview(quote.orderId);
    }
  }, [activeTab, quote?.orderId]);

  if (isLoading) {
    return <SkeletonQuoteDetail />;
  }

  if (error || !quote) {
    return (
      <div className="py-8">
        <ErrorAlert message={error || 'Quotation not found.'} onRetry={loadQuoteData} />
      </div>
    );
  }

  const isApproved = quote.status === 'Approved' || quote.approvalStatus === 'Approved';
  const isConverted = quote.status === 'ConvertedToOrder';
  const isFinalized = isConverted || quote.status === 'Confirmed';
  const canNegotiate = !isApproved && !isFinalized;

  return (
    <div className="space-y-6">
      {/* ── 1. Top Navigation & Identity ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/workspace/quotations')}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Back to quotes"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-bold text-slate-900 font-mono tracking-tight">
                {quote.quotationNumber}
              </h1>
              <StatusBadge status={quote.status} />
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                Tier: {quote.customerTierName || 'Standard'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Client: <strong className="text-slate-700">{quote.customerName}</strong> • Owner: <span className="text-slate-700">{quote.salesRepName}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {!isConverted && (
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={handleRecalculate}
            >
              Recalculate
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={ExternalLink}
            onClick={handleGeneratePortal}
          >
            Client Portal Link
          </Button>

          {!isApproved && !isConverted && (
            <Button
              variant="primary"
              size="sm"
              icon={Send}
              onClick={handleSubmitApproval}
            >
              Submit for Approval
            </Button>
          )}

          {isApproved && !isConverted && (
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle}
              onClick={handleConvertToOrder}
            >
              Confirm Sale Order
            </Button>
          )}

          {isConverted && (isFinance || isAdmin) && (
            <Button
              variant="primary"
              size="sm"
              icon={FileCheck}
              onClick={() => navigate(`/workspace/fulfillment?orderId=${quote.orderId || quote.id}`)}
            >
              Manage Fulfillment
            </Button>
          )}
        </div>
      </div>

      {/* ── Pending Governance Approval Action Banner ─────────── */}
      {quote.status === 'PendingApproval' && (
        <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-amber-950 text-sm">
                  Quotation Requires Governance Authorization
                </h3>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-200/70 text-amber-900">
                  Authority Level: {quote.approvalSteps?.find((s) => s.status === 'Pending')?.level || 'Manager'}
                </span>
                <StatusBadge type="risk" value={quote.riskScore} />
              </div>
              <p className="text-xs text-amber-800 mt-1">
                <strong>Trigger Reason:</strong> {quote.approvalSteps?.find((s) => s.status === 'Pending')?.reason || 'Commercial terms exceed standard sales rep authorization ceiling.'}
              </p>
            </div>
          </div>

          {/* Action buttons for authorized approvers */}
          {isApprover && (
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="success"
                size="sm"
                icon={CheckCircle2}
                onClick={() => {
                  setDecisionAction('Approve');
                  setDecisionReason('');
                  setIsDecisionModalOpen(true);
                }}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={RotateCcw}
                className="border-amber-400 text-amber-900 hover:bg-amber-100/60"
                onClick={() => {
                  setDecisionAction('RequestRevision');
                  setDecisionReason('');
                  setIsDecisionModalOpen(true);
                }}
              >
                Return for Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => {
                  setDecisionAction('Reject');
                  setDecisionReason('');
                  setIsDecisionModalOpen(true);
                }}
              >
                Reject
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Rejection / Revision Required Governance Banner ────── */}
      {(quote.status === 'Rejected' || quote.status === 'RevisionRequired' || quote.approvalStatus === 'Rejected' || quote.approvalStatus === 'RevisionRequired') && (

        <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/90 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
          <div className="flex-1 text-xs">
            <h3 className="font-bold text-rose-900 text-sm">
              {quote.status === 'Rejected' || quote.approvalStatus === 'Rejected'
                ? 'Quotation Rejected by Governance Authority'
                : 'Revision Requested by Sales Management'}
            </h3>
            {quote.approvalSteps?.find((s) => s.reason && (s.status === 'Rejected' || s.status === 'RevisionRequired')) ? (
              <p className="text-rose-800 mt-1">
                <strong>Reviewer Remarks:</strong> {quote.approvalSteps.find((s) => s.reason && (s.status === 'Rejected' || s.status === 'RevisionRequired')).reason}
              </p>
            ) : quote.approvalSteps?.[0]?.reason ? (
              <p className="text-rose-800 mt-1">
                <strong>Reviewer Remarks:</strong> {quote.approvalSteps[0].reason}
              </p>
            ) : null}
            <p className="text-rose-700 mt-1 font-medium">
              Action required: Edit line items below to adjust quantities or reduce discount percentages within approved thresholds, then click "Submit for Approval" to restart governance verification.
            </p>
          </div>
        </div>
      )}

      {/* ── Active Negotiation Banner ─────────────────────────── */}
      {quote.status === 'UnderNegotiation' && (
        <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <MessageSquare className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
            <div className="text-xs">
              <h3 className="font-bold text-indigo-900 text-sm flex items-center gap-2">
                Active Commercial Negotiation
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-200 text-indigo-800 uppercase tracking-wider">
                  Live Counter-Offers Active
                </span>
              </h3>
              <p className="text-indigo-800 mt-1">
                Commercial counter-pricing is active on this quotation. Customer sees revised terms on their portal in real time.
                You can propose further adjustments per deliverable item or deal-wide anytime.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="xs"
              className="border-indigo-300 text-indigo-800 hover:bg-indigo-100"
              onClick={() => setActiveTab('negotiation')}
            >
              Open Negotiation Hub
            </Button>
            {canNegotiate && (
              <Button
                variant="primary"
                size="xs"
                icon={Sparkles}
                onClick={handleOpenNegotiateDeal}
              >
                Negotiate Deal
              </Button>
            )}
          </div>
        </div>
      )}

      {/* ── 2. Authoritative Financial Summary Strip ──────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Subtotal</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
            {formatCurrency(quote.subTotal || 0, quote.currency || 'INR')}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Discount</span>
          <span className="text-base font-bold text-emerald-600 mt-0.5 block font-mono">
            -{formatCurrency(quote.discountTotal || 0, quote.currency || 'INR')}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Tax / GST</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block font-mono">
            +{formatCurrency(quote.taxTotal || 0, quote.currency || 'INR')}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/50 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 block">Grand Total</span>
          <span className="text-base font-bold text-blue-900 mt-0.5 block font-mono">
            {formatCurrency(quote.grandTotal || 0, quote.currency || 'INR')}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Gross Margin</span>
          <div className="mt-0.5">
            <StatusBadge type="margin" value={quote.marginPercent} />
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Blended Risk</span>
          <div className="mt-0.5">
            <StatusBadge type="risk" value={quote.riskScore} />
          </div>
        </div>
      </div>

      {/* ── 3. Workspace Navigation Tabs ──────────────────────── */}
      <div className="border-b border-slate-200 flex items-center justify-between">
        <nav className="flex space-x-6 text-xs font-semibold">
          {[
            { id: 'lines', label: `Quotation Lines (${quote.lines?.length || 0})` },
            {
              id: 'negotiation',
              label: `Customer Inquiries (${quote.lines?.reduce((acc, l) => acc + (l.comments?.length || 0), 0) || 0})`,
            },
            {
              id: 'recommendations',
              label: `Live Upsell Engine (${recommendations.filter((r) => !dismissedRecIds.includes(r.productId)).length})`,
            },
            { id: 'approvals', label: 'Governance & Approval Steps' },
            ...(isConverted || quote.orderId
              ? [{ id: 'fulfillment', label: `Order Fulfillment (${quote.orderStatus || 'Confirmed'})` }]
              : []),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'lines' && !isConverted && (
          <div className="flex items-center gap-2">
            {canNegotiate && (
              <Button
                variant="outline"
                size="xs"
                icon={Sparkles}
                onClick={handleOpenNegotiateDeal}
              >
                Negotiate Deal
              </Button>
            )}
            {!isApproved && (
              <Button
                variant="primary"
                size="xs"
                icon={Plus}
                onClick={() => setIsAddLineOpen(true)}
              >
                Add Product Line
              </Button>
            )}
          </div>
        )}
      </div>

      {/* ── 4. Tab Contents ───────────────────────────────────── */}
      {activeTab === 'lines' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Discount</th>
                  <th className="py-3 px-3 text-right">Net Total</th>
                  <th className="py-3 px-3 text-right">Unit Cost</th>
                  <th className="py-3 px-3 text-right">Line Margin</th>
                  {!isConverted && <th className="py-3 px-4 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {quote.lines?.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">{line.productName}</span>
                      <span className="font-mono text-[10px] text-slate-400">{line.sku || line.productSKU}</span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium">
                        {line.productType}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                      {line.quantity}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {formatCurrency(line.unitPrice || 0, quote.currency || 'INR')}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`font-semibold ${line.discountPercent > 10 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {line.discountPercent}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900 font-mono">
                      {formatCurrency(line.netAmount || 0, quote.currency || 'INR')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      {formatCurrency(line.costPrice || 0, quote.currency || 'INR')}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      <span className={`font-semibold ${line.marginAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {formatCurrency(line.marginAmount || 0, quote.currency || 'INR')}
                      </span>
                    </td>
                    {!isConverted && (
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {canNegotiate ? (
                            <button
                              type="button"
                              onClick={() => handleOpenNegotiateLine(line)}
                              className="px-2 py-1 text-[11px] font-semibold rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200/80 flex items-center gap-1 transition-all shadow-2xs cursor-pointer"
                              title="Propose Counter-Price / Commercial Negotiation"
                            >
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              Negotiate
                            </button>
                          ) : isApproved ? (
                            <span
                              className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0"
                              title="Quotation is approved. Commercial terms are locked."
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Locked
                            </span>
                          ) : null}
                          {!isApproved && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditLine(line)}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                                title="Edit quantity or discount"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveLine(line.id)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Remove item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Customer Inquiries & Negotiation Tab ─────────── */}
      {activeTab === 'negotiation' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Customer Negotiation & Inquiry Hub
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct deliverable feedback, counter-pricing proposals, and audit thread between Sales Representative and Client.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              {canNegotiate && (
                <Button
                  variant="outline"
                  size="xs"
                  icon={Sparkles}
                  onClick={handleOpenNegotiateDeal}
                >
                  Propose Deal Discount
                </Button>
              )}
              {isApproved && (
                <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Terms Approved &amp; Locked
                </span>
              )}
              <StatusBadge status={quote.status} />
            </div>
          </div>

          {!quote.lines || quote.lines.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 text-xs">
              No deliverable line items in this quotation yet.
            </div>
          ) : (
            <div className="space-y-4">
              {quote.lines.map((line) => {
                const comments = line.comments || [];
                return (
                  <div key={line.id} className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
                    <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-900">{line.productName}</span>
                          <span className="font-mono text-[10px] text-slate-400">SKU: {line.sku || line.productSKU}</span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs mt-1">
                          <span className="text-slate-500">Qty: <strong>{line.quantity}</strong></span>
                          <span className="text-slate-500">
                            Unit Price: <strong className="font-mono">{formatCurrency(line.unitPrice || 0, quote.currencyCode || quote.currency || 'INR')}</strong>
                          </span>
                          <span className="text-blue-600 font-semibold">Discount: {line.discountPercent}%</span>
                          <span className="text-slate-700 font-mono">
                            Net Total: <strong className="text-slate-900">{formatCurrency(line.netAmount || 0, quote.currencyCode || quote.currency || 'INR')}</strong>
                          </span>
                        </div>
                      </div>

                      {canNegotiate ? (
                        <Button
                          variant="outline"
                          size="xs"
                          icon={Sparkles}
                          className="border-blue-300 text-blue-700 hover:bg-blue-50 shrink-0"
                          onClick={() => handleOpenNegotiateLine(line)}
                        >
                          Propose Counter Price
                        </Button>
                      ) : isApproved ? (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 shrink-0">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Locked
                        </span>
                      ) : null}
                    </div>

                    <div className="p-4 space-y-3">
                      {comments.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-1">
                          No inquiries or notes submitted for this item yet. Click "Propose Counter Price" above to offer customized terms to the client.
                        </p>
                      ) : (
                        comments.map((c) => {
                          const isCustomer = c.comment?.startsWith('Customer (') || c.authorRole === 'Customer';
                          const isRepCounter = c.comment?.includes('[Sales Rep Counter-Offer]');
                          return (
                            <div
                              key={c.id}
                              className={`p-3 rounded-lg text-xs ${
                                isRepCounter
                                  ? 'bg-amber-50/90 border border-amber-200 text-amber-950 font-medium'
                                  : isCustomer
                                  ? 'bg-blue-50/70 border border-blue-200 text-blue-900'
                                  : 'bg-slate-100/80 border border-slate-200 text-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-semibold text-[11px] flex items-center gap-1.5">
                                  {isRepCounter ? (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                      Sales Representative Counter-Offer
                                    </>
                                  ) : isCustomer ? (
                                    'Client Portal Inquiry'
                                  ) : (
                                    c.userName || c.authorName || 'Sales Representative Response'
                                  )}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(c.createdAtUtc).toLocaleString()}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap">{c.comment}</p>
                            </div>
                          );
                        })
                      )}

                      {/* Reply Box for Sales Rep */}
                      {!isConverted && (
                        <div className="pt-2 flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Type your message or response to client..."
                            value={lineReplyTexts[line.id] || ''}
                            onChange={(e) =>
                              setLineReplyTexts((prev) => ({ ...prev, [line.id]: e.target.value }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSendLineComment(line.id);
                            }}
                            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                          <Button
                            variant="primary"
                            size="xs"
                            icon={Send}
                            isLoading={isSubmittingReply}
                            onClick={() => handleSendLineComment(line.id)}
                          >
                            Reply
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                  Automated Co-Purchase Upsell Engine
                </h3>
                <p className="text-xs text-blue-700 mt-0.5">
                  Live suggestions ranked by projected gross margin contribution.
                </p>
              </div>
            </div>
          </div>

          {recommendations.filter((r) => !dismissedRecIds.includes(r.productId)).length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 text-xs">
              No matching co-purchase recommendations for the current cart composition.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations
                .filter((r) => !dismissedRecIds.includes(r.productId))
                .map((rec) => (
                  <div
                    key={rec.productId}
                    className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex items-start justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900">{rec.productName}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800">
                          {rec.ruleType || 'Upsell'}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{rec.sku}</span>
                      <p className="text-xs text-slate-500 mt-1">{rec.reason}</p>

                      <div className="mt-3 flex items-center gap-3 text-xs">
                        <span className="font-bold text-slate-900 font-mono">{formatCurrency(rec.unitPrice || 0, quote.currency || 'INR')}</span>
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          <TrendingUp className="w-3.5 h-3.5" />
                          +{rec.marginDeltaPercent?.toFixed(1)}% Deal Margin
                        </span>
                      </div>
                    </div>

                    {!isConverted && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleAcceptRecommendation(rec)}
                        >
                          Add to Quote
                        </Button>
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDismissRecommendation(rec.productId)}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Multi-Tier Approval Audit Ledger
              </h3>
              <StatusBadge status={quote.approvalStatus} />
            </div>

            <div className="p-4 space-y-3">
              {quote.approvalSteps && quote.approvalSteps.length > 0 ? (
                quote.approvalSteps.map((step) => (
                  <div
                    key={step.id}
                    className="p-3 rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">
                        Level {step.sequence}: {step.level} Approval
                      </span>
                      <p className="text-slate-500 mt-0.5">
                        {step.reason || 'Triggered by blended discount risk ceiling violation.'}
                      </p>
                      {step.actedByName && (
                        <p className="text-[11px] text-slate-400 mt-1">
                          Acted by <strong className="text-slate-600">{step.actedByName}</strong> on {new Date(step.actedAtUtc).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={step.status} />
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  This quotation has not required escalated discount approvals.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── 5. Fulfillment & Warehouse Distribution Tab ────────── */}
      {activeTab === 'fulfillment' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Truck className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Order Fulfillment & Warehouse Allocation
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time stock depot distribution and shipment breakdown for confirmed deal.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-700">
                {quote.orderNumber || `ORD-${quote.quotationNumber?.replace('QT-', '')}`}
              </span>
              <Button
                variant="outline"
                size="xs"
                icon={ExternalLink}
                onClick={() => navigate(`/workspace/fulfillment?orderId=${quote.orderId || quote.id}`)}
              >
                Open Fulfillment View
              </Button>
            </div>
          </div>

          {isLoadingFulfillment ? (
            <LoadingSpinner message="Fetching live warehouse inventory allocations..." size="sm" />
          ) : fulfillmentPreview ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Fulfillment Strategy</span>
                  <span className={`text-sm font-bold mt-1 block ${fulfillmentPreview.isFullyAllocated ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {fulfillmentPreview.isFullyAllocated ? 'Fully Allocated (100% In Stock)' : 'Split Delivery / Backordered'}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Estimated Shipments</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
                    {fulfillmentPreview.totalShipments || 1} Separate Dispatches
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white shadow-xs">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Logistics Surcharge</span>
                  <span className="text-sm font-bold text-slate-900 mt-1 block font-mono">
                    {formatCurrency(fulfillmentPreview.totalShipmentCost || 0, quote.currency || 'INR')}
                  </span>
                </div>
              </div>

              {/* Items Allocation Breakdown Table */}
              <div className="rounded-xl border border-slate-200/80 bg-white overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200/80 font-semibold text-xs text-slate-700">
                  Item Warehouse Allocation Details
                </div>
                <div className="divide-y divide-slate-100 text-xs">
                  {fulfillmentPreview.allocations && fulfillmentPreview.allocations.length > 0 ? (
                    fulfillmentPreview.allocations.map((alloc, idx) => (
                      <div key={idx} className="p-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                          <span className="font-semibold text-slate-900 block">
                            {alloc.productName || `Line Item #${alloc.orderLineId}`}
                          </span>
                          <div className="flex items-center gap-3 text-slate-500 mt-1">
                            <span>Allocated Quantity: <strong className="text-slate-800">{alloc.quantity} units</strong></span>
                            <span>Freight Surcharge: {formatCurrency(alloc.shipmentCost || 0, quote.currency || 'INR')}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-medium text-[11px]">
                            {alloc.warehouseName || `Depot #${alloc.warehouseId}`}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-slate-400">No warehouse allocations found.</div>
                  )}

                  {fulfillmentPreview.backorders && fulfillmentPreview.backorders.length > 0 && (
                    <div className="p-3 bg-amber-50/70 border-t border-amber-200">
                      <span className="font-bold text-amber-900 text-xs block mb-2">Backordered Items Pending Replenishment:</span>
                      <div className="space-y-1">
                        {fulfillmentPreview.backorders.map((bo, idx) => (
                          <div key={idx} className="flex items-center justify-between text-xs text-amber-800">
                            <span>{bo.productName}</span>
                            <span className="font-bold text-rose-600">{bo.quantity} Units Deficit</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 text-xs">
              Unable to load warehouse allocation data for Order #{quote.orderId}.
            </div>
          )}
        </div>
      )}

      {/* ── 5. Add Line Item Drawer ───────────────────────────── */}
      <Drawer
        isOpen={isAddLineOpen}
        onClose={() => setIsAddLineOpen(false)}
        title="Add Product to Proposal"
        subtitle="Catalog pricing and customer tier discount boundaries apply."
      >
        <form onSubmit={handleAddLine} className="space-y-4">
          <Select
            label="Select Product"
            required
            value={selectedProductId}
            onChange={(e) => handleProductSelect(e.target.value)}
            placeholder="-- Choose from catalog --"
            options={products.map((p) => ({
              value: p.id,
              label: `${p.name} (${formatCurrency(p.basePrice, quote?.currency || 'INR')}) [${p.sku}]`,
            }))}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              value={lineQty}
              onChange={(e) => setLineQty(e.target.value)}
            />

            <Input
              label={`Unit Price (${quote?.currency === 'USD' ? '$' : '₹'})`}
              type="number"
              step="0.01"
              required
              value={linePrice}
              onChange={(e) => setLinePrice(e.target.value)}
            />
          </div>

          <Input
            label="Requested Discount (%)"
            type="number"
            min="0"
            max="100"
            step="0.5"
            value={lineDiscount}
            onChange={(e) => setLineDiscount(e.target.value)}
            helperText="Exceeding tier limit automatically triggers manager approval."
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddLineOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingLine}
            >
              Insert Line
            </Button>
          </div>
        </form>
      </Drawer>

      {/* ── Edit Line Item Drawer ────────────────────────────── */}
      <Drawer
        isOpen={!!editingLine}
        onClose={() => setEditingLine(null)}
        title="Edit Line Item"
        subtitle="Modifying items on an approved quote automatically resets status to Draft for governance verification."
      >
        {editingLine && (
          <form onSubmit={handleUpdateLine} className="space-y-4">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
              <span className="font-semibold text-slate-900 block text-sm">{editingLine.productName}</span>
              <span className="font-mono text-slate-400 text-[10px]">SKU: {editingLine.sku || editingLine.productSKU}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Quantity"
                type="number"
                min="1"
                required
                value={editQty}
                onChange={(e) => setEditQty(e.target.value)}
              />

              <Input
                label={`Unit Price (${quote?.currency === 'USD' ? '$' : '₹'})`}
                type="number"
                step="0.01"
                required
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
              />
            </div>

            <Input
              label="Discount Percentage (%)"
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={editDiscount}
              onChange={(e) => setEditDiscount(e.target.value)}
              helperText="Exceeding client tier ceiling triggers approval workflow."
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingLine(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isUpdatingLine}
              >
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </Drawer>

      {/* ── 6. Client Portal Magic Link Modal ─────────────────── */}
      <Modal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        title="Secure Customer Negotiation Link"
        description="Cryptographically isolated SHA-256 HMAC magic link for zero-leak customer negotiation."
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-[11px] font-mono text-slate-800 break-all select-all">
              {window.location.origin}{portalLink}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              icon={Copy}
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}${portalLink}`);
                toast.success('Copied', 'Customer portal URL copied to clipboard.');
              }}
            >
              Copy Link
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={ExternalLink}
              onClick={() => window.open(portalLink, '_blank')}
            >
              Open Client Portal
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 7. Governance Decision Modal ──────────────────────────── */}
      <Modal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        title={
          decisionAction === 'Approve'
            ? 'Approve Commercial Quotation'
            : decisionAction === 'RequestRevision'
            ? 'Return Quotation for Revision'
            : 'Reject Quotation Proposal'
        }
        description={`Quotation ${quote?.quotationNumber} • Account: ${quote?.customerName}`}
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 flex justify-between items-center">
            <span>Blended Deal Risk Score:</span>
            <StatusBadge type="risk" value={quote?.riskScore} />
          </div>

          <Textarea
            label={decisionAction === 'Approve' ? 'Approval Justification (Optional)' : 'Audited Reason / Remarks'}
            required={decisionAction !== 'Approve'}
            placeholder={
              decisionAction === 'Approve'
                ? 'Authorized based on strategic account expansion...'
                : 'Provide specific instructions (min 10 characters) explaining what needs adjustment...'
            }
            value={decisionReason}
            onChange={(e) => setDecisionReason(e.target.value)}
            rows={4}
            helperText={
              decisionAction !== 'Approve'
                ? 'Minimum 10 characters required for governance audit trail.'
                : 'Remarks will be recorded in approval ledger.'
            }
          />

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={decisionAction === 'Approve' ? 'success' : decisionAction === 'RequestRevision' ? 'primary' : 'danger'}
              size="sm"
              isLoading={isSubmittingDecision}
              onClick={() => handleQuotationApproval(decisionAction)}
            >
              {decisionAction === 'Approve' ? 'Confirm Approval' : decisionAction === 'RequestRevision' ? 'Send Return Remarks' : 'Confirm Rejection'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── 8. Sales Rep Line Price Negotiation Modal ───────────── */}
      <Modal
        isOpen={isNegotiateModalOpen}
        onClose={() => setIsNegotiateModalOpen(false)}
        title="Propose Counter-Price / Commercial Negotiation"
        description={`Item: ${negotiatingLine?.productName} • SKU: ${negotiatingLine?.sku || negotiatingLine?.productSKU}`}
      >
        {negotiatingLine && (() => {
          const qty = parseInt(targetQuantity, 10) || 1;
          const uPrice = parseFloat(targetUnitPrice) || 0;
          const disc = Math.max(0, Math.min(100, parseFloat(targetDiscountPercent) || 0));
          const lineGross = qty * uPrice;
          const discAmt = (lineGross * disc) / 100;
          const lineNet = lineGross - discAmt;
          const cost = (negotiatingLine.costPrice || 0) * qty;
          const marginAmt = lineNet - cost;
          const marginPct = lineNet > 0 ? (marginAmt / lineNet) * 100 : 0;
          const tierCeiling = quote?.customerTierMaxDiscount || 5;
          const exceedsTier = disc > tierCeiling;

          return (
            <form onSubmit={handleSubmitNegotiateLine} className="space-y-4 text-xs">
              {/* Reference metrics */}
              <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Base Cost Price</span>
                  <span className="font-mono font-bold text-slate-700">
                    {formatCurrency(negotiatingLine.costPrice || 0, quote.currencyCode || quote.currency || 'INR')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Customer Tier</span>
                  <span className="font-bold text-slate-800">
                    {quote.customerTierName || 'Standard'} (Max {tierCeiling}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Current Net</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(negotiatingLine.netAmount || 0, quote.currencyCode || quote.currency || 'INR')}
                  </span>
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <Input
                  label="Target Unit Price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={targetUnitPrice}
                  onChange={(e) => setTargetUnitPrice(e.target.value)}
                  helperText="Adjust item unit price"
                />

                <Input
                  label="Target Discount (%)"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  required
                  value={targetDiscountPercent}
                  onChange={(e) => setTargetDiscountPercent(e.target.value)}
                  helperText={`Tier ceiling: ${tierCeiling}%`}
                />

                <Input
                  label="Quantity"
                  type="number"
                  min="1"
                  required
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(e.target.value)}
                />
              </div>

              {/* Commercial Rationale */}
              <Textarea
                label="Commercial Rationale / Audit Note"
                required
                placeholder="Explain the commercial reason for this counter-offer (e.g., Strategic volume discount approved)..."
                value={negotiateReason}
                onChange={(e) => setNegotiateReason(e.target.value)}
                rows={3}
                helperText="Will be recorded in the customer negotiation thread and audit log."
              />

              {/* Live Preview Card */}
              <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 space-y-2">
                <div className="flex items-center justify-between font-semibold text-blue-900">
                  <span>Projected Line Total:</span>
                  <span className="font-mono text-sm font-extrabold text-blue-700">
                    {formatCurrency(lineNet, quote.currencyCode || quote.currency || 'INR')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600 text-[11px]">
                  <span>Projected Line Margin:</span>
                  <span className={`font-mono font-bold ${marginPct >= 20 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {marginPct.toFixed(1)}% ({formatCurrency(marginAmt, quote.currencyCode || quote.currency || 'INR')})
                  </span>
                </div>

                {/* Tier Policy Indicator */}
                <div className={`p-2 rounded-lg text-[11px] font-medium border ${
                  exceedsTier
                    ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                    : 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
                }`}>
                  {exceedsTier ? (
                    <span>⚠️ Discount ({disc}%) exceeds customer {quote.customerTierName} Tier ceiling ({tierCeiling}%). Submitting will route this deal to Management for Governance Review.</span>
                  ) : (
                    <span>✅ Within customer {quote.customerTierName} Tier ceiling ({tierCeiling}%). Commercial advantage pre-approved.</span>
                  )}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsNegotiateModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={Sparkles}
                  isLoading={isSubmittingNegotiation}
                >
                  Apply Counter-Offer
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>

      {/* ── 9. Sales Rep Deal-Wide Discount Negotiation Modal ────── */}
      <Modal
        isOpen={isDealNegotiateModalOpen}
        onClose={() => setIsDealNegotiateModalOpen(false)}
        title="Propose Deal-Wide Commercial Discount"
        description={`Quotation ${quote?.quotationNumber} • Account: ${quote?.customerName}`}
      >
        {(() => {
          const disc = Math.max(0, Math.min(100, parseFloat(dealDiscountPercent) || 0));
          const tierCeiling = quote?.customerTierMaxDiscount || 5;
          const exceedsTier = disc > tierCeiling;

          return (
            <form onSubmit={handleSubmitNegotiateDeal} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Customer Account:</span>
                  <span className="font-bold text-slate-800">{quote?.customerName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Customer Tier & Advantage:</span>
                  <span className="font-bold text-blue-700">
                    {quote?.customerTierName || 'Bronze'} (Max Pre-Approved: {tierCeiling}%)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Current Total Deliverables:</span>
                  <span className="font-mono font-bold text-slate-800">{quote?.lines?.length || 0} line item(s)</span>
                </div>
              </div>

              <Input
                label="Overall Deal Discount (%)"
                type="number"
                step="0.1"
                min="0"
                max="100"
                required
                value={dealDiscountPercent}
                onChange={(e) => setDealDiscountPercent(e.target.value)}
                helperText={`Applies uniformly across all deliverables in this proposal.`}
              />

              <Textarea
                label="Commercial Justification / Audit Note"
                required
                placeholder="State the strategic reason for this overall deal counter-discount..."
                value={dealNegotiateReason}
                onChange={(e) => setDealNegotiateReason(e.target.value)}
                rows={3}
                helperText="Will be recorded in the customer proposal audit log."
              />

              {/* Tier Alert */}
              <div className={`p-2.5 rounded-lg text-[11px] font-medium border ${
                exceedsTier
                  ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                  : 'bg-emerald-100/70 border-emerald-300 text-emerald-900'
              }`}>
                {exceedsTier ? (
                  <span>⚠️ Discount ({disc}%) exceeds customer {quote?.customerTierName} Tier ceiling ({tierCeiling}%). Deal will trigger management governance review.</span>
                ) : (
                  <span>✅ Within customer {quote?.customerTierName} Tier ceiling ({tierCeiling}%). Deal remains auto-approved for customer signature.</span>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <Button variant="outline" size="sm" type="button" onClick={() => setIsDealNegotiateModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  icon={Sparkles}
                  isLoading={isSubmittingDealNegotiation}
                >
                  Apply Deal Counter-Offer
                </Button>
              </div>
            </form>
          );
        })()}
      </Modal>
    </div>
  );
};


export default QuotationDetailPage;
