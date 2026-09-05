import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { quotationApi, customerApi, productApi } from '../api';
import {
  QuotationHeader,
  LineItemsTable,
  AddProductModal,
  QuoteSummaryBar,
  RiskScoreCard,
  RecommendationPanel,
  QuoteActionToolbar,
} from '../components/quote-builder';
import { Button } from '../components/common/Button';
import { Select } from '../components/common/Select';
import { Input } from '../components/common/Input';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  QuotationDto,
  QuotationStatus,
  CreateQuotationRequest,
  AddQuotationLineRequest,
  UpdateQuotationLineRequest,
  UpsellRecommendationDto,
  CustomerDto,
  PriceListDto,
} from '../types';
import { FilePlus2, AlertCircle, ArrowLeft } from 'lucide-react';

export const QuotationBuilderPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = !id || id === 'new';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // New quote draft form state
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newPriceListId, setNewPriceListId] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newNotes, setNewNotes] = useState('');

  // Fetch Customers & Price Lists for creation or header edit
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customerApi.getCustomers({ PageNumber: 1, PageSize: 100 }),
  });

  const { data: priceLists = [] } = useQuery({
    queryKey: ['price-lists'],
    queryFn: () => productApi.getPriceLists(),
  });

  // Fetch Quotation if editing existing
  const {
    data: quotation,
    isLoading: isLoadingQuote,
    isError,
  } = useQuery({
    queryKey: ['quotation', id],
    queryFn: () => quotationApi.getQuotation(id!),
    enabled: !isNew && !!id,
  });

  // Fetch Upsell Recommendations
  const { data: recommendations = [], isLoading: isLoadingRecs } = useQuery({
    queryKey: ['quotation-recs', id],
    queryFn: () => quotationApi.getUpsellRecommendations(id!),
    enabled: !isNew && !!id,
  });

  // Mutations
  const createMutation = useMutation<QuotationDto, Error, CreateQuotationRequest>({
    mutationFn: (req: CreateQuotationRequest) => quotationApi.createQuotation(req),
    onSuccess: (data: QuotationDto) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      navigate(`/quotations/${data.Id}`);
    },
    onError: (err: Error) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to create quotation.' });
    },
  });

  const recalculateMutation = useMutation<QuotationDto, Error, void>({
    mutationFn: () => quotationApi.recalculatePricing(id!),
    onSuccess: (data: QuotationDto) => {
      queryClient.setQueryData(['quotation', id], data);
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setAlertMessage({ type: 'success', text: 'Pricing, discount rules, and gross margin recalculated by server.' });
    },
    onError: (err: Error) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Recalculation failed.' });
    },
  });

  const addLineMutation = useMutation({
    mutationFn: (req: AddQuotationLineRequest) => quotationApi.addQuotationLine(id!, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotation-recs', id] });
      setAlertMessage({ type: 'success', text: 'Line item added successfully.' });
    },
  });

  const updateLineMutation = useMutation({
    mutationFn: ({ lineId, data }: { lineId: string; data: UpdateQuotationLineRequest }) =>
      quotationApi.updateQuotationLine(id!, lineId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotation-recs', id] });
    },
  });

  const deleteLineMutation = useMutation({
    mutationFn: (lineId: string) => quotationApi.deleteQuotationLine(id!, lineId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotation-recs', id] });
      setAlertMessage({ type: 'success', text: 'Line item deleted.' });
    },
  });

  const submitApprovalMutation = useMutation({
    mutationFn: () => quotationApi.submitForApproval(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setAlertMessage({ type: 'success', text: 'Quotation submitted for governance approval review.' });
    },
  });

  const sendCustomerMutation = useMutation({
    mutationFn: () => quotationApi.sendToCustomer(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setAlertMessage({ type: 'success', text: 'Quotation dispatched to customer portal successfully.' });
    },
  });

  const convertOrderMutation = useMutation<any, Error, void>({
    mutationFn: () => quotationApi.convertToOrder(id!),
    onSuccess: (order: any) => {
      queryClient.invalidateQueries({ queryKey: ['quotation', id] });
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      setAlertMessage({ type: 'success', text: `Quotation converted to Order #${order.OrderNumber}!` });
      setTimeout(() => navigate('/fulfillment'), 1500);
    },
  });

  const cloneMutation = useMutation<QuotationDto, Error, void>({
    mutationFn: () => quotationApi.cloneQuotation(id!),
    onSuccess: (newQuote: QuotationDto) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      navigate(`/quotations/${newQuote.Id}`);
    },
  });

  const handleCreateDraft = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerId) {
      setAlertMessage({ type: 'danger', text: 'Please select an authorized customer account.' });
      return;
    }

    createMutation.mutate({
      CustomerId: newCustomerId,
      PriceListId: newPriceListId || undefined,
      ExpirationDate: new Date(newExpirationDate).toISOString(),
      Notes: newNotes || undefined,
    });
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}/portal/quotes/${id}`;
    navigator.clipboard.writeText(url);
    setAlertMessage({ type: 'success', text: 'Customer negotiation portal link copied to clipboard!' });
  };

  const handleAddRecommendation = (rec: UpsellRecommendationDto) => {
    if (!id) return;
    addLineMutation.mutate({
      ProductId: rec.ProductId,
      Quantity: rec.SuggestedQuantity,
      DiscountPercentage: 0,
    });
  };

  // NEW QUOTATION FORM
  if (isNew) {
    const customers = customersData?.Items || [];
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in">
        <button
          onClick={() => navigate('/quotations')}
          className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Quotations
        </button>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <FilePlus2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Initiate New Quotation</h2>
              <p className="text-xs text-slate-500">
                Select customer account, contracted price list tier, and initial validity window.
              </p>
            </div>
          </div>

          {alertMessage && (
            <Alert
              variant={alertMessage.type}
              message={alertMessage.text}
              onClose={() => setAlertMessage(null)}
            />
          )}

          <form onSubmit={handleCreateDraft} className="space-y-4">
            <Select
              label="Customer Account"
              value={newCustomerId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewCustomerId(e.target.value)}
              options={customers.map((c: CustomerDto) => ({
                value: c.Id,
                label: `${c.CompanyName} (${c.TierName || 'Standard Tier'})`,
              }))}
              required
            />

            <Select
              label="Contracted Price List"
              value={newPriceListId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewPriceListId(e.target.value)}
              options={priceLists.map((pl: PriceListDto) => ({
                value: pl.Id,
                label: `${pl.Name} (${pl.Currency})`,
              }))}
            />

            <Input
              label="Offer Expiration Date"
              type="date"
              value={newExpirationDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewExpirationDate(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Internal Commercial Notes
              </label>
              <textarea
                rows={3}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Key customer requirements, special terms, project scope notes..."
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={() => navigate('/quotations')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={createMutation.isPending}>
                Create Draft Quotation
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // LOADING OR ERROR
  if (isLoadingQuote) {
    return (
      <div className="py-32 flex justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (isError || !quotation) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Quotation Not Found</h3>
        <p className="text-xs text-slate-500">
          The requested quotation could not be located or you lack permissions to view it.
        </p>
        <Button onClick={() => navigate('/quotations')}>Return to Quotation List</Button>
      </div>
    );
  }

  const isReadOnly =
    quotation.Status !== QuotationStatus.Draft &&
    quotation.Status !== QuotationStatus.InReview;

  return (
    <div className="space-y-6 pb-12 animate-in fade-in">
      <button
        onClick={() => navigate('/quotations')}
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Quotation Workspace
      </button>

      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.text}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Quotation Header Card */}
      <QuotationHeader
        quotation={quotation}
        onUpdateHeader={(data) => {
          quotationApi.updateQuotation(quotation.Id, data).then(() => {
            queryClient.invalidateQueries({ queryKey: ['quotation', id] });
            setAlertMessage({ type: 'success', text: 'Quotation header updated.' });
          });
        }}
      />

      {/* State-Driven Action Toolbar */}
      <QuoteActionToolbar
        quotation={quotation}
        onSubmitForApproval={() => submitApprovalMutation.mutate()}
        onSendToCustomer={() => sendCustomerMutation.mutate()}
        onConvertToOrder={() => convertOrderMutation.mutate()}
        onRevise={() => cloneMutation.mutate()}
        onCopyPortalLink={handleCopyPortalLink}
        isSubmitting={submitApprovalMutation.isPending}
        isSending={sendCustomerMutation.isPending}
        isConverting={convertOrderMutation.isPending}
      />

      {/* Main Quotation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LineItemsTable
            lines={quotation.Lines || []}
            currency={quotation.Currency}
            isReadOnly={isReadOnly}
            onUpdateLine={(lineId: string, data: UpdateQuotationLineRequest) => updateLineMutation.mutate({ lineId, data })}
            onDeleteLine={(lineId: string) => deleteLineMutation.mutate(lineId)}
            onAddProductClick={() => setIsAddModalOpen(true)}
          />

          <QuoteSummaryBar
            quotation={quotation}
            onRecalculate={() => recalculateMutation.mutate()}
            isRecalculating={recalculateMutation.isPending}
          />
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          <RiskScoreCard
            score={quotation.BlendedDiscountRiskScore ?? 0}
            discountPercentage={
              (quotation.SubtotalAmount ?? quotation.totalGrossAmount ?? 0) > 0
                ? ((quotation.TotalDiscountAmount ?? quotation.totalDiscountAmount ?? 0) /
                    (quotation.SubtotalAmount ?? quotation.totalGrossAmount ?? 1)) * 100
                : 0
            }
            marginPercentage={quotation.OrderGrossMarginPercent ?? 0}
            totalAmount={quotation.TotalAmount ?? quotation.totalNetAmount}
            isApprovalRequired={quotation.ApprovalRequired}
          />

          <RecommendationPanel
            recommendations={recommendations}
            isLoading={isLoadingRecs}
            onAddRecommendation={handleAddRecommendation}
            isAddingId={addLineMutation.isPending ? 'loading' : null}
          />
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        priceListId={quotation.PriceListId}
        onAddProduct={(req: AddQuotationLineRequest) => addLineMutation.mutate(req)}
      />
    </div>
  );
};
