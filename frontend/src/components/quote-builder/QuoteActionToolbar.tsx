import React from 'react';
import { QuotationDto, QuotationStatus } from '../../types';
import { Button } from '../common/Button';
import {
  Send,
  CheckCircle2,
  FileText,
  Copy,
  ExternalLink,
  RotateCcw,
  ShoppingCart,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface QuoteActionToolbarProps {
  quotation: QuotationDto;
  onSubmitForApproval: () => void;
  onSendToCustomer: () => void;
  onConvertToOrder: () => void;
  onRevise: () => void;
  onCopyPortalLink: () => void;
  isSubmitting?: boolean;
  isSending?: boolean;
  isConverting?: boolean;
}

export const QuoteActionToolbar: React.FC<QuoteActionToolbarProps> = ({
  quotation,
  onSubmitForApproval,
  onSendToCustomer,
  onConvertToOrder,
  onRevise,
  onCopyPortalLink,
  isSubmitting = false,
  isSending = false,
  isConverting = false,
}) => {
  const status = quotation.Status;
  const isDraft = status === QuotationStatus.Draft;
  const isInReview = status === QuotationStatus.InReview;
  const isApproved = status === QuotationStatus.Approved;
  const isSent = status === QuotationStatus.SentToCustomer;
  const isAccepted = status === QuotationStatus.Accepted;
  const isOrdered = status === QuotationStatus.Ordered;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
      {/* Status indicator & version info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-sm text-slate-500">
          <FileText className="w-4 h-4 text-slate-400" />
          <span>Version: <strong className="text-slate-700">v{quotation.VersionNumber}</strong></span>
        </div>
        {quotation.ExpirationDate && (
          <>
            <span className="text-slate-300">•</span>
            <div className="flex items-center space-x-1 text-xs text-slate-500">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Expires: {new Date(quotation.ExpirationDate).toLocaleDateString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        {/* Revise Button available in Sent, Accepted, or Rejected */}
        {(isSent || isAccepted || status === QuotationStatus.Rejected) && (
          <Button variant="outline" size="sm" onClick={onRevise}>
            <RotateCcw className="w-4 h-4 mr-1.5" />
            Create Revision
          </Button>
        )}

        {/* Portal link for customer */}
        {(isSent || isAccepted || isOrdered) && (
          <Button variant="outline" size="sm" onClick={onCopyPortalLink} title="Copy Customer Negotiation Portal URL">
            <ExternalLink className="w-4 h-4 mr-1.5" />
            Portal Link
          </Button>
        )}

        {/* Draft -> Submit for Approval or Send to Customer if no approval needed */}
        {isDraft && (
          <>
            {quotation.ApprovalRequired ? (
              <Button
                variant="primary"
                size="sm"
                onClick={onSubmitForApproval}
                isLoading={isSubmitting}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                Submit for Approval
              </Button>
            ) : (
              <Button
                variant="primary"
                size="sm"
                onClick={onSendToCustomer}
                isLoading={isSending}
              >
                <Send className="w-4 h-4 mr-1.5" />
                Send to Customer
              </Button>
            )}
          </>
        )}

        {/* In Review state indicator */}
        {isInReview && (
          <div className="flex items-center text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg border border-amber-200">
            <Clock className="w-4 h-4 mr-1.5 text-amber-600 animate-pulse" />
            Pending Management Approval
          </div>
        )}

        {/* Approved state: can send to customer or convert */}
        {isApproved && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={onSendToCustomer}
              isLoading={isSending}
            >
              <Send className="w-4 h-4 mr-1.5" />
              Send to Customer
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onConvertToOrder}
              isLoading={isConverting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <ShoppingCart className="w-4 h-4 mr-1.5" />
              Convert to Order
            </Button>
          </>
        )}

        {/* Sent state: direct convert or wait customer */}
        {isSent && (
          <Button
            variant="primary"
            size="sm"
            onClick={onConvertToOrder}
            isLoading={isConverting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ShoppingCart className="w-4 h-4 mr-1.5" />
            Convert to Order
          </Button>
        )}

        {/* Accepted state */}
        {isAccepted && !isOrdered && (
          <Button
            variant="primary"
            size="sm"
            onClick={onConvertToOrder}
            isLoading={isConverting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            Confirm & Create Order
          </Button>
        )}
      </div>
    </div>
  );
};
