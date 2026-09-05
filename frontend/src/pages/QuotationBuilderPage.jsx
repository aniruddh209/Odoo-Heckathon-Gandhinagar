import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { quotationApi, customerApi, adminApi } from '../api';
import {
  Button,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

export const QuotationBuilderPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');

  // Cart Lines
  const [lines, setLines] = useState([]);

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custRes, prodRes] = await Promise.all([
        customerApi.getCustomers(),
        adminApi.getProducts(),
      ]);

      const custList = Array.isArray(custRes) ? custRes : custRes?.value || [];
      const prodList = Array.isArray(prodRes) ? prodRes : prodRes?.value || [];

      setCustomers(custList);
      setProducts(prodList);

      if (custList.length > 0) {
        setSelectedCustomerId(custList[0].id.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to load catalog data.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCustomer = customers.find(
    (c) => c.id === parseInt(selectedCustomerId, 10)
  );

  const handleAddBlankLine = () => {
    if (products.length === 0) return;
    const defaultProduct = products[0];
    setLines((prev) => [
      ...prev,
      {
        productId: defaultProduct.id,
        quantity: 1,
        unitPrice: defaultProduct.basePrice || 0,
        discountPercent: 0,
      },
    ]);
  };

  const handleUpdateLine = (index, field, value) => {
    setLines((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: value };

      if (field === 'productId') {
        const prod = products.find((p) => p.id === parseInt(value, 10));
        if (prod) {
          item.unitPrice = prod.basePrice || 0;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveLine = (index) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Optimistic calculation for immediate UI responsiveness
  const subTotal = lines.reduce(
    (sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0),
    0
  );
  const discountTotal = lines.reduce(
    (sum, l) =>
      sum + (l.quantity || 0) * (l.unitPrice || 0) * ((l.discountPercent || 0) / 100),
    0
  );
  const grandTotal = (subTotal - discountTotal) * 1.18; // 18% Tax

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Validation Error', 'Please select an active customer.');
      return;
    }

    if (lines.length === 0) {
      toast.error('Validation Error', 'Please add at least one line item to the quotation.');
      return;
    }

    setIsSubmitting(true);
    try {
      const requestPayload = {
        customerId: parseInt(selectedCustomerId, 10),
        currencyCode,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
        notes,
        lines: lines.map((l) => ({
          productId: parseInt(l.productId, 10),
          quantity: parseInt(l.quantity, 10) || 1,
          unitPrice: parseFloat(l.unitPrice) || 0,
          discountPercent: parseFloat(l.discountPercent) || 0,
        })),
      };

      const created = await quotationApi.createQuotation(requestPayload);
      toast.success('Quotation Created', `Proposal ${created.quotationNumber} initialized.`);
      navigate(`/workspace/quotations/${created.id}`);
    } catch (err) {
      toast.error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Initializing quotation builder..." size="lg" />;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/workspace/quotations')}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">New Deal Quotation</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured proposal with automated tier discount ceilings and gross margin rules.
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer & Agreement Terms Card */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
            1. Customer Account & Agreement Terms
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Customer Account"
              required
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              options={customers.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.tierName || 'Standard'})`,
              }))}
            />

            <Select
              label="Currency"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              options={[
                { value: 'USD', label: 'USD ($) - US Dollar' },
                { value: 'EUR', label: 'EUR (€) - Euro' },
                { value: 'GBP', label: 'GBP (£) - British Pound' },
                { value: 'INR', label: 'INR (₹) - Indian Rupee' },
              ]}
            />

            <Input
              label="Target Close Date"
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
            />
          </div>

          {selectedCustomer && (
            <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-blue-950">Active Tier: {selectedCustomer.tierName}</span>
                <p className="text-blue-800 text-[11px] mt-0.5">
                  Standard tier discount ceiling: {selectedCustomer.tierName === 'Gold' ? '15%' : selectedCustomer.tierName === 'Silver' ? '10%' : '5%'}. Exceeding this triggers automated approval routing.
                </p>
              </div>
              <span className="font-semibold text-blue-900 bg-white px-2.5 py-1 rounded-md border border-blue-200">
                Tier Ceiling Enforced
              </span>
            </div>
          )}
        </div>

        {/* Product Line Items */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              2. Products & Commercial Pricing
            </h2>
            <Button
              type="button"
              variant="outline"
              size="xs"
              icon={Plus}
              onClick={handleAddBlankLine}
            >
              Add Item
            </Button>
          </div>

          {lines.length === 0 ? (
            <div className="text-center py-8 border border-dashed rounded-xl border-slate-200 text-slate-500 text-xs">
              No products added yet. Click &quot;Add Item&quot; to begin building proposal lines.
            </div>
          ) : (
            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                >
                  <div className="sm:col-span-5">
                    <Select
                      label={`Product Item #${idx + 1}`}
                      value={line.productId}
                      onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                      options={products.map((p) => ({
                        value: p.id,
                        label: `${p.name} ($${p.basePrice?.toFixed(2)})`,
                      }))}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Quantity"
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={(e) => handleUpdateLine(idx, 'quantity', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Unit Price ($)"
                      type="number"
                      step="0.01"
                      value={line.unitPrice}
                      onChange={(e) => handleUpdateLine(idx, 'unitPrice', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <Input
                      label="Discount (%)"
                      type="number"
                      min="0"
                      max="100"
                      value={line.discountPercent}
                      onChange={(e) => handleUpdateLine(idx, 'discountPercent', e.target.value)}
                    />
                  </div>

                  <div className="sm:col-span-1 flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveLine(idx)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200 transition-colors"
                      title="Delete line"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Notes & Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="sm:col-span-2">
            <Textarea
              label="Commercial Terms & Notes"
              placeholder="Enter special payment terms, delivery expectations, or remarks..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900">${subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Discounts:</span>
                <span className="font-mono">-${discountTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax (18%):</span>
                <span className="font-mono text-slate-900">${((subTotal - discountTotal) * 0.18).toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Estimated Grand Total:</span>
                <span className="text-blue-600 font-mono">${grandTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                size="md"
                isLoading={isSubmitting}
              >
                Create & Calculate Proposal
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuotationBuilderPage;
