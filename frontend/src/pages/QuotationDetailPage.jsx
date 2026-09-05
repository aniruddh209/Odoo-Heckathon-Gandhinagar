import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { quotationApi, adminApi } from '../api';
import {
  Button,
  StatusBadge,
  Drawer,
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import {
  ArrowLeft,
  Plus,
  Send,
  CheckCircle,
  FileCheck,
  Sparkles,
  ExternalLink,
  Copy,
  Trash2,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';

export const QuotationDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [quote, setQuote] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('lines'); // lines, recommendations, approvals, portal

  // Drawer for adding a line item
  const [isAddLineOpen, setIsAddLineOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [lineQty, setLineQty] = useState(1);
  const [lineDiscount, setLineDiscount] = useState(0);
  const [linePrice, setLinePrice] = useState(0);
  const [isSubmittingLine, setIsSubmittingLine] = useState(false);

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
      navigate(`/workspace/fulfillment?orderId=${order.id}`);
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

  if (isLoading) {
    return <LoadingSpinner message="Loading quotation workspace and telemetry..." size="lg" />;
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

          {isConverted && (
            <Button
              variant="primary"
              size="sm"
              icon={FileCheck}
              onClick={() => navigate('/workspace/fulfillment')}
            >
              Manage Fulfillment
            </Button>
          )}
        </div>
      </div>

      {/* ── 2. Authoritative Financial Summary Strip ──────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Subtotal</span>
          <span className="text-base font-bold text-slate-900 mt-0.5 block">
            ${(quote.subTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Discounts</span>
          <span className="text-base font-bold text-rose-600 mt-0.5 block">
            -${(quote.discountTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Taxes (18%)</span>
          <span className="text-base font-bold text-slate-700 mt-0.5 block">
            ${(quote.taxTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 block">Grand Total</span>
          <span className="text-base font-extrabold text-blue-900 mt-0.5 block">
            ${(quote.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Internal Cost</span>
          <span className="text-base font-bold text-slate-700 mt-0.5 block">
            ${(quote.costTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            { id: 'recommendations', label: `Live Upsell Engine (${recommendations.length})` },
            { id: 'approvals', label: 'Governance & Approval Steps' },
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

        {!isConverted && activeTab === 'lines' && (
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
                      ${(line.unitPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`font-semibold ${line.discountPercent > 10 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {line.discountPercent}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-right font-bold text-slate-900">
                      ${(line.netAmount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-slate-500">
                      ${(line.costPrice || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <span className={`font-semibold ${line.marginAmount >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                        ${(line.marginAmount || 0).toFixed(2)}
                      </span>
                    </td>
                    {!isConverted && (
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

          {recommendations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl border-slate-200">
              No matching co-purchase recommendations for the current cart composition.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((rec) => (
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
                      <span className="font-bold text-slate-900">${rec.unitPrice?.toFixed(2)}</span>
                      <span className="text-emerald-600 font-semibold flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5" />
                        +{rec.marginDeltaPercent?.toFixed(1)}% Deal Margin
                      </span>
                    </div>
                  </div>

                  {!isConverted && (
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleAcceptRecommendation(rec)}
                    >
                      Add to Quote
                    </Button>
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
              label: `${p.name} ($${p.basePrice?.toFixed(2)}) [${p.sku}]`,
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
              label="Unit Price ($)"
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
    </div>
  );
};

export default QuotationDetailPage;
