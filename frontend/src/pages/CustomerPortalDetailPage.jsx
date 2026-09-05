import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { portalApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  StatusBadge,
  Modal,
  Input,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import {
  ShieldCheck,
  MessageSquare,
  Percent,
  CheckCircle,
  Send,
  Zap,
} from 'lucide-react';

export const CustomerPortalDetailPage = () => {
  const { token } = useParams();
  const toast = useToast();

  const [quote, setQuote] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Line Comment Modal
  const [commentModalOpen, setCommentModalOpen] = useState(false);
  const [activeLine, setActiveLine] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  // Counter Offer Modal
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [counterLine, setCounterLine] = useState(null);
  const [proposedDiscount, setProposedDiscount] = useState('');
  const [counterReason, setCounterReason] = useState('');
  const [isSubmittingCounter, setIsSubmittingCounter] = useState(false);

  useEffect(() => {
    loadCustomerQuote();
  }, [token]);

  const loadCustomerQuote = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await portalApi.getQuoteByToken(token);
      setQuote(data);
    } catch (err) {
      setError(err.message || 'The customer quotation link is invalid or has expired.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenComment = (line) => {
    setActiveLine(line);
    setCommentText('');
    setCommentModalOpen(true);
  };

  const handleOpenCounter = (line) => {
    setCounterLine(line);
    setProposedDiscount(line.discountPercent ? (line.discountPercent + 5).toString() : '5');
    setCounterReason('');
    setCounterModalOpen(true);
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!activeLine || !commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      await portalApi.submitLineComment(token, activeLine.id, commentText);
      toast.success('Inquiry Submitted', 'Your inquiry has been relayed to the account executive.');
      setCommentModalOpen(false);
      await loadCustomerQuote();
    } catch (err) {
      toast.error('Submission Failed', err.message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleSubmitCounter = async (e) => {
    e.preventDefault();
    if (!counterLine) return;

    setIsSubmittingCounter(true);
    try {
      const updatedQuote = await portalApi.submitCounterOffer(token, {
        lineId: counterLine.id,
        proposedDiscountPercent: parseFloat(proposedDiscount) || 0,
        reason: counterReason,
      });

      setQuote(updatedQuote);
      toast.success('Counter-Offer Relayed', 'Your proposal was submitted. Deal is now in active negotiation.');
      setCounterModalOpen(false);
    } catch (err) {
      toast.error('Counter Offer Failed', err.message);
    } finally {
      setIsSubmittingCounter(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <LoadingSpinner message="Verifying cryptographic magic link..." size="lg" />
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <ErrorAlert
            title="Invalid Quotation Access"
            message={error || 'This link has expired or reached maximum authorization attempts.'}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Customer Portal Top Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base">DealFlow<span className="text-blue-600">360</span></span>
              <span className="block text-[10px] text-slate-500 font-medium">Customer Proposal Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-semibold text-slate-600">Verified Client Session</span>
          </div>
        </div>

        {/* Commercial Proposal Document Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-8">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">Official Commercial Proposal</span>
              <h1 className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight mt-0.5">
                {quote.quotationNumber}
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Prepared for: <strong className="text-slate-900">{quote.customerName}</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <StatusBadge status={quote.status} />
              {quote.expectedCloseDate && (
                <p className="text-[11px] text-slate-400 mt-2">
                  Offer Valid Until: {new Date(quote.expectedCloseDate).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>

          {/* Line Items Presentation */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Product &amp; Service Deliverables
            </h2>

            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase text-[11px]">
                    <th className="py-3 px-4">Item &amp; Description</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-3 text-right">Unit Price</th>
                    <th className="py-3 px-3 text-right">Discount</th>
                    <th className="py-3 px-4 text-right">Total ({quote.currencyCode || 'USD'})</th>
                    <th className="py-3 px-4 text-center">Negotiate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {quote.lines?.map((line) => (
                    <React.Fragment key={line.id}>
                      <tr className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {line.productName}
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">{line.sku}</span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-medium">{line.quantity}</td>
                        <td className="py-3.5 px-3 text-right font-mono">${(line.unitPrice || 0).toFixed(2)}</td>
                        <td className="py-3.5 px-3 text-right font-mono">
                          {line.discountPercent > 0 ? (
                            <span className="text-emerald-700 font-semibold">-{line.discountPercent}%</span>
                          ) : (
                            <span className="text-slate-400">0%</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                          ${(line.netAmount || 0).toFixed(2)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="xs"
                              icon={MessageSquare}
                              title="Ask question on this line"
                              onClick={() => handleOpenComment(line)}
                            >
                              Inquiry
                            </Button>
                            <Button
                              variant="outline"
                              size="xs"
                              icon={Percent}
                              title="Counter propose discount"
                              onClick={() => handleOpenCounter(line)}
                            >
                              Counter
                            </Button>
                          </div>
                        </td>
                      </tr>

                      {/* Comments Feed on Line */}
                      {line.comments && line.comments.length > 0 && (
                        <tr>
                          <td colSpan={6} className="bg-slate-50/75 px-6 py-2 border-b border-slate-100">
                            <div className="space-y-1">
                              {line.comments.map((c) => (
                                <div key={c.id} className="text-[11px] text-slate-600 flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                  <span>{c.comment}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Summary */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4 border-t border-slate-200">
            <div className="max-w-md text-xs text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 block">Notes &amp; Delivery Commitments:</span>
              <p className="leading-relaxed">
                {quote.notes || 'Payment terms net-30 upon shipment delivery. Standard hardware warranty and 99.9% uptime SLA included.'}
              </p>
            </div>

            <div className="w-full sm:w-64 space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900">${(quote.subTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Special Discounts:</span>
                <span className="font-mono">-${(quote.discountTotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sales Tax (18%):</span>
                <span className="font-mono text-slate-900">${(quote.taxTotal || 0).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-base text-slate-900">
                <span>Final Proposal Total:</span>
                <span className="font-mono text-blue-600">${(quote.grandTotal || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Line Comment Modal */}
        <Modal
          isOpen={commentModalOpen}
          onClose={() => setCommentModalOpen(false)}
          title="Submit Line Item Inquiry"
          description={`Ask a question regarding ${activeLine?.productName}`}
        >
          <form onSubmit={handleSubmitComment} className="space-y-4">
            <Textarea
              label="Your Message"
              required
              placeholder="e.g., Can we adjust specifications, delivery date, or packaging?"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={4}
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setCommentModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingComment} icon={Send}>
                Send Inquiry
              </Button>
            </div>
          </form>
        </Modal>

        {/* Counter Offer Modal */}
        <Modal
          isOpen={counterModalOpen}
          onClose={() => setCounterModalOpen(false)}
          title="Submit Counter Proposal"
          description={`Propose revised commercial terms for ${counterLine?.productName}`}
        >
          <form onSubmit={handleSubmitCounter} className="space-y-4">
            <Input
              label="Proposed Discount (%)"
              type="number"
              min="0"
              max="100"
              step="0.5"
              required
              value={proposedDiscount}
              onChange={(e) => setProposedDiscount(e.target.value)}
            />

            <Textarea
              label="Commercial Justification / Volume Context"
              placeholder="e.g., Requesting 15% discount based on upfront annual commitment."
              value={counterReason}
              onChange={(e) => setCounterReason(e.target.value)}
              rows={3}
            />

            <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setCounterModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingCounter} icon={CheckCircle}>
                Relay Counter Offer
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </div>
  );
};

export default CustomerPortalDetailPage;
