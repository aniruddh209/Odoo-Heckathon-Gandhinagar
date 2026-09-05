import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
import { QuotationStatus } from '../types';
import { FilePlus2, AlertCircle, ArrowLeft } from 'lucide-react';

export const QuotationBuilderPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const isNew = !id || id === 'new';
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  // New quote draft form state
  const [newCustomerId, setNewCustomerId] = useState('');
  const [newPriceListId, setNewPriceListId] = useState('');
  const [newExpirationDate, setNewExpirationDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [newNotes, setNewNotes] = useState('');

  // Dropdown options
  const [customers, setCustomers] = useState([]);
  const [priceLists, setPriceLists] = useState([]);

  // Active quotation state
  const [quotation, setQuotation] = useState(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(!isNew);
  const [isError, setIsError] = useState(false);

  // Upsell recommendations
  const [recommendations, setRecommendations] = useState([]);
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);

  // Button loading states
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [isSendingCustomer, setIsSendingCustomer] = useState(false);
  const [isConvertingOrder, setIsConvertingOrder] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [isAddingRecId, setIsAddingRecId] = useState(null);

  // Load Customers & Price Lists
  useEffect(() => {
    customerApi.getCustomers({ PageNumber: 1, PageSize: 100 })
      .then((data) => setCustomers(data?.Items || []))
      .catch((err) => console.error(err));

    productApi.getPriceLists()
      .then((data) => setPriceLists(data || []))
      .catch((err) => console.error(err));
  }, []);

  // Fetch Quotation and Recs
  const fetchQuotation = async () => {
    if (isNew || !id) return;
    setIsLoadingQuote(true);
    setIsError(false);
    try {
      const q = await quotationApi.getQuotation(id);
      setQuotation(q);
      loadRecommendations(id);
    } catch (err) {
      console.error(err);
      setIsError(true);
    } finally {
      setIsLoadingQuote(false);
    }
  };

  const loadRecommendations = async (quoteId) => {
    setIsLoadingRecs(true);
    try {
      const recs = await quotationApi.getUpsellRecommendations(quoteId);
      setRecommendations(recs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id, isNew]);

  const handleCreateDraft = async (e) => {
    e.preventDefault();
    if (!newCustomerId) {
      setAlertMessage({ type: 'danger', text: 'Please select an authorized customer account.' });
      return;
    }

    setIsCreatingDraft(true);
    try {
      const created = await quotationApi.createQuotation({
        CustomerId: newCustomerId,
        PriceListId: newPriceListId || undefined,
        ExpirationDate: new Date(newExpirationDate).toISOString(),
        Notes: newNotes || undefined,
      });
      navigate(`/quotations/${created.Id}`);
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to create quotation.' });
    } finally {
      setIsCreatingDraft(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const updated = await quotationApi.recalculatePricing(id);
      setQuotation(updated);
      setAlertMessage({ type: 'success', text: 'Pricing, discount rules, and gross margin recalculated by server.' });
      loadRecommendations(id);
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Recalculation failed.' });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleAddProduct = async (req) => {
    try {
      await quotationApi.addQuotationLine(id, req);
      setAlertMessage({ type: 'success', text: 'Line item added successfully.' });
      fetchQuotation();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to add line item.' });
    }
  };

  const handleUpdateLine = async (lineId, data) => {
    try {
      await quotationApi.updateQuotationLine(id, lineId, data);
      fetchQuotation();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to update line item.' });
    }
  };

  const handleDeleteLine = async (lineId) => {
    try {
      await quotationApi.deleteQuotationLine(id, lineId);
      setAlertMessage({ type: 'success', text: 'Line item deleted.' });
      fetchQuotation();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to delete line item.' });
    }
  };

  const handleSubmitForApproval = async () => {
    setIsSubmittingApproval(true);
    try {
      await quotationApi.submitForApproval(id);
      setAlertMessage({ type: 'success', text: 'Quotation submitted for governance approval review.' });
      fetchQuotation();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Approval submission failed.' });
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const handleSendToCustomer = async () => {
    setIsSendingCustomer(true);
    try {
      await quotationApi.sendToCustomer(id);
      setAlertMessage({ type: 'success', text: 'Quotation dispatched to customer portal successfully.' });
      fetchQuotation();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Customer dispatch failed.' });
    } finally {
      setIsSendingCustomer(false);
    }
  };

  const handleConvertToOrder = async () => {
    setIsConvertingOrder(true);
    try {
      const order = await quotationApi.convertToOrder(id);
      setAlertMessage({ type: 'success', text: `Quotation converted to Order #${order?.OrderNumber || ''}!` });
      setTimeout(() => navigate('/fulfillment'), 1500);
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Order conversion failed.' });
    } finally {
      setIsConvertingOrder(false);
    }
  };

  const handleClone = async () => {
    try {
      const newQuote = await quotationApi.cloneQuotation(id);
      navigate(`/quotations/${newQuote.Id}`);
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Clone failed.' });
    }
  };

  const handleCopyPortalLink = () => {
    const url = `${window.location.origin}/portal/quotes/${id}`;
    navigator.clipboard.writeText(url);
    setAlertMessage({ type: 'success', text: 'Customer negotiation portal link copied to clipboard!' });
  };

  const handleAddRecommendation = async (rec) => {
    if (!id) return;
    setIsAddingRecId(rec.ProductId);
    try {
      await quotationApi.addQuotationLine(id, {
        ProductId: rec.ProductId,
        Quantity: rec.SuggestedQuantity,
        DiscountPercentage: 0,
      });
      fetchQuotation();
    } catch (err) {
      console.error(err);
    } finally {
      setIsAddingRecId(null);
    }
  };

  // NEW QUOTATION FORM
  if (isNew) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-6 animate-in fade-in">
        <button
          onClick={() => navigate('/quotations')}
          className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
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
              onChange={(e) => setNewCustomerId(e.target.value)}
              options={customers.map((c) => ({
                value: c.Id,
                label: `${c.CompanyName} (${c.TierName || 'Standard Tier'})`,
              }))}
              required
            />

            <Select
              label="Contracted Price List"
              value={newPriceListId}
              onChange={(e) => setNewPriceListId(e.target.value)}
              options={priceLists.map((pl) => ({
                value: pl.Id,
                label: `${pl.Name} (${pl.Currency})`,
              }))}
            />

            <Input
              label="Offer Expiration Date"
              type="date"
              value={newExpirationDate}
              onChange={(e) => setNewExpirationDate(e.target.value)}
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
              <Button type="submit" isLoading={isCreatingDraft}>
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
        className="inline-flex items-center text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
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
            fetchQuotation();
            setAlertMessage({ type: 'success', text: 'Quotation header updated.' });
          });
        }}
      />

      {/* State-Driven Action Toolbar */}
      <QuoteActionToolbar
        quotation={quotation}
        onSubmitForApproval={handleSubmitForApproval}
        onSendToCustomer={handleSendToCustomer}
        onConvertToOrder={handleConvertToOrder}
        onRevise={handleClone}
        onCopyPortalLink={handleCopyPortalLink}
        isSubmitting={isSubmittingApproval}
        isSending={isSendingCustomer}
        isConverting={isConvertingOrder}
      />

      {/* Main Quotation Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <LineItemsTable
            lines={quotation.Lines || []}
            currency={quotation.Currency}
            isReadOnly={isReadOnly}
            onUpdateLine={handleUpdateLine}
            onDeleteLine={handleDeleteLine}
            onAddProductClick={() => setIsAddModalOpen(true)}
          />

          <QuoteSummaryBar
            quotation={quotation}
            onRecalculate={handleRecalculate}
            isRecalculating={isRecalculating}
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
            isAddingId={isAddingRecId}
          />
        </div>
      </div>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        priceListId={quotation.PriceListId}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
};
