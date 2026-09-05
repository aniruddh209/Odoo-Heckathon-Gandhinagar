import React from 'react';
import type { QuotationDto, QuotationStatus } from '@/types/quotation';
import { Badge, type BadgeVariant } from '@/components/common/Badge';
import { Calendar, User, Building2, Clock } from 'lucide-react';

interface QuotationHeaderProps {
  quotation: QuotationDto;
  onUpdateHeader?: (data: any) => void;
}

export const QuotationHeader: React.FC<QuotationHeaderProps> = ({ quotation, onUpdateHeader }) => {
  const status = quotation.Status || quotation.status || 'Draft';
  const quotationNumber = quotation.QuotationNumber || quotation.quotationNumber;
  const customerTier = quotation.CustomerTier || quotation.customerTier;
  const customerName = quotation.CustomerName || quotation.customerName;
  const repName = quotation.SalesRepName || quotation.repName;
  const createdAt = quotation.CreatedAt || quotation.createdAt;
  const promisedDeliveryDate = quotation.promisedDeliveryDate || quotation.expirationDate || quotation.ExpirationDate;
  const customerNotes = quotation.customerNotes || quotation.Notes || quotation.notes;

  const statusVariants: Record<string, BadgeVariant> = {
    Draft: 'default',
    PendingApproval: 'warning',
    InReview: 'warning',
    Approved: 'success',
    Sent: 'info',
    SentToCustomer: 'info',
    UnderNegotiation: 'purple',
    Confirmed: 'success',
    Accepted: 'success',
    Ordered: 'success',
    Rejected: 'danger',
    RevisionRequested: 'warning',
    Cancelled: 'danger',
    Expired: 'danger',
  };

  const tierVariants: Record<string, BadgeVariant> = {
    Bronze: 'bronze',
    Silver: 'silver',
    Gold: 'gold',
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            {quotationNumber}
          </h1>
          <Badge variant={statusVariants[status] || 'default'} size="md">
            {status}
          </Badge>
          {customerTier && (
            <Badge variant={tierVariants[customerTier] || 'default'} size="md">
              {customerTier} Tier
            </Badge>
          )}
        </div>

        <div className="text-xs text-slate-500 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Created: {createdAt ? new Date(createdAt).toLocaleDateString() : 'Today'}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Customer</span>
            <span className="font-semibold text-slate-900">{customerName}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-700">
          <User className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sales Representative</span>
            <span className="font-semibold text-slate-900">{repName || 'Self'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-700">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-semibold">Promised Delivery Date</span>
            <span className="font-semibold text-slate-900">
              {promisedDeliveryDate
                ? new Date(promisedDeliveryDate).toLocaleDateString()
                : 'Standard Dispatch'}
            </span>
          </div>
        </div>
      </div>

      {customerNotes && (
        <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold uppercase text-[10px] block mb-0.5">
            Customer Negotiation Notes:
          </span>
          <p className="text-slate-700 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            &quot;{customerNotes}&quot;
          </p>
        </div>
      )}
    </div>
  );
};
