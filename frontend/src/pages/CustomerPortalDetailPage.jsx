import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { portalApi } from '../api';
import {
  PortalQuoteHeader,
  PortalLinesTable,
  LineNegotiationDrawer,
  CounterDiscountModal,
  OneClickConfirmModal,
} from '../components/portal';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/common/Button';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const CustomerPortalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [activeLineChat, setActiveLineChat] = useState(null);
  const [isCounterDiscountOpen, setIsCounterDiscountOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const [quote, setQuote] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [isError, setIsError] = useState(false);

  const [comments, setComments] = useState([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const [isConfirming, setIsConfirming] = useState(false);
  const [isSubmittingDiscount, setIsSubmittingDiscount] = useState(false);
  const [isSendingComment, setIsSendingComment] = useState(false);

  const fetchQuotation = async () => {
    if (!id) return;
    setIsLoadingQuote(true);
    setIsError(false);
    try {
      const q = await portalApi.getQuotation(id);
      setQuote(q);
    } catch (err) {
      console.error('Error loading portal quote:', err);
      setIsError(true);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const activeLineId = activeLineChat?.Id ?? activeLineChat?.id;

  const fetchComments = async (lineId) => {
    if (!lineId) {
      setComments([]);
      return;
    }
    setIsLoadingComments(true);
    try {
      const c = await portalApi.getLineComments(lineId);
      setComments(c || []);
    } catch (err) {
      console.error('Error fetching line comments:', err);
    } finally {
      setIsLoadingComments(false);
    }
  };

  useEffect(() => {
    if (activeLineId) {
      fetchComments(activeLineId);
    }
  }, [activeLineId]);

  const handleConfirmOrder = async (req) => {
    setIsConfirming(true);
    try {
      await portalApi.confirmQuotation(id, req);
      setIsConfirmModalOpen(false);
      setAlertMessage({
        type: 'success',
        text: 'Order successfully confirmed! Our fulfillment & billing operations have received your purchase confirmation.',
      });
      fetchQuotation();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to confirm quotation.' });
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCounterDiscount = async (req) => {
    setIsSubmittingDiscount(true);
    try {
      await portalApi.requestCounterDiscount(id, req);
      setIsCounterDiscountOpen(false);
      setAlertMessage({
        type: 'success',
        text: 'Your counter-offer proposal has been submitted to your dedicated account director.',
      });
      fetchQuotation();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to submit counter offer.' });
    } finally {
      setIsSubmittingDiscount(false);
    }
  };

  const handleSendComment = async (commentText) => {
    if (!activeLineId) return;
    setIsSendingComment(true);
    try {
      await portalApi.addLineComment(activeLineId, { Comment: commentText });
      fetchComments(activeLineId);
    } catch (err) {
      console.error('Error sending comment:', err);
    } finally {
      setIsSendingComment(false);
    }
  };

  if (isLoadingQuote) {
    return (
      <div className="py-32 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !quote) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Quotation Link Inactive</h3>
        <p className="text-xs text-slate-500">
          This quotation link has expired, been revised, or requires updated portal credentials.
        </p>
        <Button onClick={() => navigate('/portal/quotes')}>Return to My Quotations</Button>
      </div>
    );
  }

  const subtotal = quote.SubtotalAmount ?? quote.totalGrossAmount ?? 0;
  const discount = quote.TotalDiscountAmount ?? quote.totalDiscountAmount ?? 0;
  const tax = quote.TaxAmount ?? quote.taxAmount ?? 0;
  const total = quote.TotalAmount ?? quote.totalNetAmount ?? (subtotal - discount + tax);
  const quoteNum = quote.QuotationNumber || quote.quotationNumber || '';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 animate-in fade-in">
      <button
        onClick={() => navigate('/portal/quotes')}
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Quotation Portal
      </button>

      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.text}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Zero-Leak Customer Quote Header */}
      <PortalQuoteHeader
        quote={quote}
        onOpenConfirmModal={() => setIsConfirmModalOpen(true)}
        onOpenDiscountModal={() => setIsCounterDiscountOpen(true)}
        onDownloadPdf={() => setAlertMessage({ type: 'success', text: 'Generating formal signed PDF...' })}
      />

      {/* Financial Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4">
          Financial Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
          <div>
            <span className="text-xs text-slate-400 block">List Price</span>
            <span className="text-lg font-bold font-mono text-slate-800">
              ${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Commercial Savings</span>
            <span className="text-lg font-bold font-mono text-emerald-600">
              -${discount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Applicable Tax</span>
            <span className="text-lg font-bold font-mono text-slate-700">
              ${tax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <div>
            <span className="text-xs text-slate-400 block">Binding Total</span>
            <span className="text-2xl font-black font-mono text-blue-950">
              ${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Lines Table */}
      <PortalLinesTable
        lines={quote.Lines || quote.lines || []}
        currency={quote.Currency || quote.currency}
        onOpenLineChat={(line) => setActiveLineChat(line)}
        canNegotiate={quote.Status !== 'Accepted' && quote.Status !== 'Ordered' && quote.status !== 'Confirmed'}
      />

      {/* Commercial Terms & Notes */}
      {(quote.Notes || quote.customerNotes) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-xs text-slate-600 space-y-1.5">
          <span className="font-bold text-slate-800 block">Contract Terms & Conditions</span>
          <p className="leading-relaxed">{quote.Notes || quote.customerNotes}</p>
        </div>
      )}

      {/* Line Negotiation Drawer */}
      <LineNegotiationDrawer
        isOpen={!!activeLineChat}
        onClose={() => setActiveLineChat(null)}
        line={activeLineChat}
        comments={comments}
        isLoadingComments={isLoadingComments}
        onSendComment={handleSendComment}
        isSending={isSendingComment}
      />

      {/* Counter Offer Modal */}
      <CounterDiscountModal
        isOpen={isCounterDiscountOpen}
        onClose={() => setIsCounterDiscountOpen(false)}
        currentTotal={total}
        onConfirm={handleCounterDiscount}
        isSubmitting={isSubmittingDiscount}
      />

      {/* One-Click Binding Confirm Modal */}
      <OneClickConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        quotationNumber={quoteNum}
        totalAmount={total}
        onConfirm={handleConfirmOrder}
        isSubmitting={isConfirming}
      />
    </div>
  );
};
