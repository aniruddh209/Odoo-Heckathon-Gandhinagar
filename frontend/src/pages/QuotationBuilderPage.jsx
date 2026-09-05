import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { quotationApi, customerApi, adminApi } from '../api';
import {
  Button,
  Input,
  Select,
  Textarea,
  PageHeader,
  SkeletonQuoteBuilder,
  ErrorAlert,
} from '../components/ui';
import {
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
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
  const [variantsMap, setVariantsMap] = useState({});
  const [orderDiscountPercent, setOrderDiscountPercent] = useState('');

  useEffect(() => {
    loadPrerequisites();
  }, []);

  const loadPrerequisites = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [custRes, prodRes] = await Promise.all([
        customerApi.getCustomers(),
        adminApi.getProducts({ isActive: true }),
      ]);

      const custList = Array.isArray(custRes) ? custRes : custRes?.value || [];
      const prodList = Array.isArray(prodRes) ? prodRes : prodRes?.value || [];

      setCustomers(custList);
      setProducts(prodList);

      // Preload variants for products
      const varEntries = await Promise.all(
        prodList.map(async (p) => {
          try {
            const vars = await adminApi.getProductVariants(p.id);
            return [p.id, Array.isArray(vars) ? vars : []];
          } catch {
            return [p.id, []];
          }
        })
      );
      setVariantsMap(Object.fromEntries(varEntries));

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
        variantId: '',
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
        item.variantId = '';
        const prod = products.find((p) => p.id === parseInt(value, 10));
        if (prod) {
          item.unitPrice = prod.basePrice || 0;
        }
      }

      if (field === 'variantId') {
        item.variantId = value;
        const prod = products.find((p) => p.id === parseInt(item.productId, 10));
        const prodVars = variantsMap[item.productId] || [];
        const variant = prodVars.find((v) => v.id === parseInt(value, 10));
        const addPrice = variant ? parseFloat(variant.additionalPrice) || 0 : 0;
        item.unitPrice = (prod?.basePrice || 0) + addPrice;
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleApplyOrderDiscount = () => {
    if (!orderDiscountPercent && orderDiscountPercent !== 0) return;
    const p = Math.max(0, Math.min(100, parseFloat(orderDiscountPercent) || 0));
    setLines((prev) => prev.map((l) => ({ ...l, discountPercent: p })));
    toast.success('Order Discount Applied', `Applied ${p}% discount across all ${lines.length} line(s).`);
  };

  const handleRemoveLine = (index) => {
    setLines((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Optimistic calculation for immediate UI responsiveness
  const subTotal = lines.reduce(
    (sum, l) => sum + (parseInt(l.quantity, 10) || 0) * (parseFloat(l.unitPrice) || 0),
    0
  );
  const discountTotal = lines.reduce(
    (sum, l) =>
      sum + (parseInt(l.quantity, 10) || 0) * (parseFloat(l.unitPrice) || 0) * ((parseFloat(l.discountPercent) || 0) / 100),
    0
  );
  const taxableAmount = subTotal - discountTotal;
  const taxTotal = taxableAmount * 0.18; // 18% standard GST/Tax
  const grandTotal = taxableAmount + taxTotal;

  // Check if any line exceeds customer tier limit
  const maxDiscountInQuote = lines.reduce((max, l) => Math.max(max, parseFloat(l.discountPercent) || 0), 0);
  const tierLimit = selectedCustomer?.maxDiscountPercent || (selectedCustomer?.tierName === 'Gold' ? 15 : selectedCustomer?.tierName === 'Silver' ? 10 : 5);
  const triggersApproval = maxDiscountInQuote > tierLimit;

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
          variantId: l.variantId ? parseInt(l.variantId, 10) : null,
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
    return <SkeletonQuoteBuilder />;
  }

  return (
    <div className="space-y-6">
      {/* Unified Page Header */}
      <PageHeader
        breadcrumbs={[
          { label: 'Quotations', path: '/workspace/quotations' },
          { label: 'New Deal Proposal' },
        ]}
        title="Construct Commercial Quotation"
        subtitle="Configure deal pricing, product allocations, and automated margin governance ceilings."
      />

      {error && <ErrorAlert message={error} />}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Details & Line Items (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer & Contract Terms */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              1. Customer Account &amp; Contract Terms
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
              <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-bold text-blue-950">Active Tier: {selectedCustomer.tierName}</span>
                  <p className="text-blue-800 text-[11px] mt-0.5">
                    Tier discount limit: {tierLimit}%. Exceeding this triggers automated approval escalation.
                  </p>
                </div>
                <span className="font-semibold text-blue-900 bg-white px-2.5 py-1 rounded-md border border-blue-200 self-start sm:self-auto text-[11px]">
                  Ceiling: {tierLimit}%
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Products & Line Items */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                2. Products &amp; Deliverables ({lines.length})
              </h2>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={Plus}
                onClick={handleAddBlankLine}
              >
                Add Product Line
              </Button>
            </div>

            {lines.length === 0 ? (
              <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-xl space-y-3 bg-slate-50/50">
                <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">No items added to proposal yet</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click the button below to add your first product or subscription service.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={handleAddBlankLine}
                >
                  Add First Product
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 bg-slate-50/80">
                      <th className="py-2.5 px-3 min-w-[180px]">Product / Service</th>
                      <th className="py-2.5 px-3 min-w-[160px]">Product Variant</th>
                      <th className="py-2.5 px-3 w-20 text-center">Qty</th>
                      <th className="py-2.5 px-3 w-28 text-right">Unit Price ($)</th>
                      <th className="py-2.5 px-3 w-24 text-center">Discount (%)</th>
                      <th className="py-2.5 px-3 w-28 text-right">Subtotal</th>
                      <th className="py-2.5 px-2 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lines.map((line, idx) => {
                      const lineSubtotal = (parseInt(line.quantity, 10) || 0) * (parseFloat(line.unitPrice) || 0) * (1 - (parseFloat(line.discountPercent) || 0) / 100);
                      const isLineExceeding = (parseFloat(line.discountPercent) || 0) > tierLimit;

                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3">
                            <select
                              className="w-full h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                              value={line.productId}
                              onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  [{p.sku}] {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-2.5 px-3">
                            <select
                              className="w-full h-8 px-2 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                              value={line.variantId || ''}
                              onChange={(e) => handleUpdateLine(idx, 'variantId', e.target.value)}
                            >
                              <option value="">Base / Standard</option>
                              {(variantsMap[line.productId] || []).map((v) => (
                                <option key={v.id} value={v.id}>
                                  {v.name} (+${v.additionalPrice})
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="1"
                              value={line.quantity}
                              onChange={(e) => handleUpdateLine(idx, 'quantity', e.target.value)}
                              className="w-full h-8 px-2 text-center text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={line.unitPrice}
                              onChange={(e) => handleUpdateLine(idx, 'unitPrice', e.target.value)}
                              className="w-full h-8 px-2 text-right text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={line.discountPercent}
                                onChange={(e) => handleUpdateLine(idx, 'discountPercent', e.target.value)}
                                className={`w-full h-8 px-2 text-center text-xs rounded-lg border focus:outline-none focus:ring-1 font-mono ${
                                  isLineExceeding
                                    ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500'
                                    : 'border-slate-300 focus:ring-blue-500'
                                }`}
                              />
                            </div>
                          </td>

                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                            ${lineSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>

                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveLine(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Commercial Terms & Notes */}
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              3. Special Commercial Terms &amp; Scope Notes
            </h2>
            <Textarea
              placeholder="Enter payment milestone terms, special SLA delivery commitments, or customer-specific requests..."
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        {/* Right Column: Sticky Summary & Governance Status (4 cols) */}
        <div className="lg:col-span-4 space-y-4 sticky top-20">
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                Commercial Summary
              </span>
              <span className="text-[11px] font-mono text-slate-400">{currencyCode}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal ({lines.length} lines)</span>
                <span className="font-mono text-slate-800">${subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Commercial Discount</span>
                <span className="font-mono text-emerald-600">-${discountTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax (18%)</span>
                <span className="font-mono text-slate-800">${taxTotal.toFixed(2)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-bold font-mono text-blue-600 tracking-tight">
                  ${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Governance Warning Badge */}
            {triggersApproval ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Approval Escalation Required</span>
                  <span className="text-[11px] text-amber-800 block mt-0.5">
                    Discount ({maxDiscountInQuote}%) exceeds tier ceiling ({tierLimit}%). Proposal will require Manager signoff.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-[11px] font-medium">Within tier discount limits. Instant signoff eligible.</span>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isSubmitting}
              icon={ArrowRight}
              className="mt-2"
            >
              Generate Quotation
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default QuotationBuilderPage;
