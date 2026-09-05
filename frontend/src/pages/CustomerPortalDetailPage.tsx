import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { CustomerQuoteLineDto, CustomerCounterDiscountRequest, CustomerConfirmRequest } from '../types';
import { ArrowLeft, AlertCircle } from 'lucide-react';

export const CustomerPortalDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [activeLineChat, setActiveLineChat] = useState<CustomerQuoteLineDto | null>(null);
  const [isCounterDiscountOpen, setIsCounterDiscountOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Load quotation via customer portal zero-leak API
  const {
    data: quote,
    isLoading: isLoadingQuote,
    isError,
  } = useQuery({
    queryKey: ['portal-quote', id],
    queryFn: () => portalApi.getQuotation(id!),
    enabled: !!id,
  });

  const activeLineId = activeLineChat?.Id ?? activeLineChat?.id;

  // Load line comments when drawer is opened
  const { data: comments = [], isLoading: isLoadingComments } = useQuery({
    queryKey: ['line-comments', activeLineId],
    queryFn: () => portalApi.getLineComments(activeLineId!),
    enabled: !!activeLineId,
  });

  // Mutations
  const confirmMutation = useMutation({
    mutationFn: (req: CustomerConfirmRequest) => portalApi.confirmQuotation(id!, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-quote', id] });
      setIsConfirmModalOpen(false);
      setAlertMessage({
        type: 'success',
        text: 'Order successfully confirmed! Our fulfillment & billing operations have received your purchase confirmation.',
      });
    },
    onError: (err: any) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to confirm quotation.' });
    },
  });

  const discountMutation = useMutation({
    mutationFn: (req: CustomerCounterDiscountRequest) => portalApi.requestCounterDiscount(id!, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-quote', id] });
      setIsCounterDiscountOpen(false);
      setAlertMessage({
        type: 'success',
        text: 'Your counter-offer proposal has been submitted to your dedicated account director.',
      });
    },
    onError: (err: any) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to submit counter offer.' });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: (comment: string) => portalApi.addLineComment(activeLineId!, { Comment: comment }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['line-comments', activeLineId] });
    },
  });

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
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800"
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
        onOpenLineChat={(line: CustomerQuoteLineDto) => setActiveLineChat(line)}
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
        onSendComment={(c: string) => addCommentMutation.mutate(c)}
        isSending={addCommentMutation.isPending}
      />

      {/* Counter Offer Modal */}
      <CounterDiscountModal
        isOpen={isCounterDiscountOpen}
        onClose={() => setIsCounterDiscountOpen(false)}
        currentTotal={total}
        onConfirm={(req: CustomerCounterDiscountRequest) => discountMutation.mutate(req)}
        isSubmitting={discountMutation.isPending}
      />

      {/* One-Click Binding Confirm Modal */}
      <OneClickConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        quotationNumber={quoteNum}
        totalAmount={total}
        onConfirm={(req: CustomerConfirmRequest) => confirmMutation.mutate(req)}
        isSubmitting={confirmMutation.isPending}
      />
    </div>
  );
};
