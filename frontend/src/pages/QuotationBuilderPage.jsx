import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import { formatCurrency } from '../utils/formatters';

export const QuotationBuilderPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State - Default Currency: Indian Rupee (INR)
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('INR');
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

      const paramCustId = searchParams.get('customerId');
      const paramProdId = searchParams.get('productId');
      const paramQty = parseInt(searchParams.get('quantity'), 10) || 1;
      const paramInquiryId = searchParams.get('inquiryId');
      const paramNotes = searchParams.get('notes');

      if (paramCustId && custList.some((c) => c.id === parseInt(paramCustId, 10))) {
        setSelectedCustomerId(paramCustId);
        const matchedCust = custList.find((c) => c.id === parseInt(paramCustId, 10));
        if (matchedCust?.currencyCode) {
          setCurrencyCode(matchedCust.currencyCode);
        }
      } else if (custList.length > 0) {
        setSelectedCustomerId(custList[0].id.toString());
        if (custList[0]?.currencyCode) {
          setCurrencyCode(custList[0].currencyCode);
        }
      }

      if (paramProdId) {
        const pId = parseInt(paramProdId, 10);
        const matchedProd = prodList.find((p) => p.id === pId);
        if (matchedProd) {
          setLines([
            {
              productId: matchedProd.id,
              variantId: '',
              quantity: paramQty,
              unitPrice: matchedProd.basePrice || 0,
              discountPercent: 0,
              discountAmount: 0,
            },
          ]);
        }
      }

      if (paramNotes) {
        try {
          setNotes(decodeURIComponent(paramNotes));
        } catch {
          setNotes(paramNotes);
        }
      } else if (paramInquiryId) {
        setNotes(`Created from Sales Inquiry #${paramInquiryId}`);
      }

      const defaultClose = new Date();
      defaultClose.setDate(defaultClose.getDate() + 14);
      setExpectedCloseDate(defaultClose.toISOString().split('T')[0]);
    } catch (err) {
      setError(err.message || 'Failed to load catalog data.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCustomer = customers.find(
    (c) => c.id === parseInt(selectedCustomerId, 10)
  );

  const tierLimit = Number(selectedCustomer?.tierMaxDiscount ?? selectedCustomer?.maxDiscountPercent ?? 15);

  const handleApplyTierAdvantage = (percent) => {
    const val = Number(percent) || 0;
    setOrderDiscountPercent(val.toString());
    toast.success('Tier Advantage Applied', `${val}% ${selectedCustomer?.tierName || ''} Tier discount advantage activated.`);
  };

  const handleResetDiscounts = () => {
    setOrderDiscountPercent('');
    setLines((prev) => prev.map((l) => ({ ...l, discountPercent: 0 })));
    toast.info('Discounts Reset', 'All manual and tier discounts have been reset to 0%.');
  };

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
        if (prod && value) {
          const vars = variantsMap[prod.id] || [];
          const v = vars.find((vx) => vx.id === parseInt(value, 10));
          if (v) {
            item.unitPrice = (prod.basePrice || 0) + (v.additionalPrice || 0);
          }
        } else if (prod) {
          item.unitPrice = prod.basePrice || 0;
        }
      }

      updated[index] = item;
      return updated;
    });
  };

  const handleRemoveLine = (index) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculations
  const subTotal = lines.reduce((acc, line) => {
    const qty = parseInt(line.quantity, 10) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    return acc + qty * price;
  }, 0);

  const lineDiscounts = lines.reduce((acc, line) => {
    const qty = parseInt(line.quantity, 10) || 0;
    const price = parseFloat(line.unitPrice) || 0;
    const disc = parseFloat(line.discountPercent) || 0;
    return acc + (qty * price * disc) / 100;
  }, 0);

  const orderDiscPct = parseFloat(orderDiscountPercent) || 0;
  const overallOrderDiscount = ((subTotal - lineDiscounts) * orderDiscPct) / 100;
  const discountTotal = lineDiscounts + overallOrderDiscount;

  const netTotal = Math.max(0, subTotal - discountTotal);
  const taxTotal = netTotal * 0.18; // Standard 18% GST
  const grandTotal = netTotal + taxTotal;

  // Governance limit checks
  const maxDiscountInQuote = Math.max(
    orderDiscPct,
    ...lines.map((l) => parseFloat(l.discountPercent) || 0),
    0
  );
  const triggersApproval = maxDiscountInQuote > tierLimit;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Validation Error', 'Please select a customer account.');
      return;
    }
    if (lines.length === 0) {
      toast.error('Validation Error', 'Please add at least one line item to the proposal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerId: parseInt(selectedCustomerId, 10),
        currencyCode: currencyCode,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate).toISOString() : null,
        notes: notes.trim() || null,
        lines: lines.map((l) => {
          const lineDisc = parseFloat(l.discountPercent) || 0;
          const effectiveDisc = lineDisc > 0 ? lineDisc : (orderDiscPct > 0 ? orderDiscPct : 0);
          return {
            productId: parseInt(l.productId, 10),
            variantId: l.variantId ? parseInt(l.variantId, 10) : null,
            quantity: parseInt(l.quantity, 10) || 1,
            unitPrice: parseFloat(l.unitPrice) || 0,
            discountPercent: effectiveDisc,
          };
        }),
      };

      const result = await quotationApi.createQuotation(payload);
      toast.success(
        'Quotation Created',
        `Proposal #${result.quotationNumber || result.id} has been generated.`
      );
      navigate(`/workspace/quotations/${result.id || result.quotationId}`);
    } catch (err) {
      toast.error('Submission Failed', err.message || 'Could not construct quotation.');
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

      {searchParams.get('inquiryId') && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">Auto-Populated from Sales Inquiry</span>
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-emerald-200/80 text-emerald-900">
                  #{searchParams.get('inquiryId')}
                </span>
              </div>
              <p className="text-xs text-emerald-800 mt-0.5">
                Customer account, requested product deliverables, and inquiry notes pre-filled. Customize manual discounts or activate customer tier advantage below.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-emerald-700 bg-white/80 px-2.5 py-1 rounded-md border border-emerald-200 self-start sm:self-auto">
            Live Quotation Bridge
          </span>
        </div>
      )}

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
                searchable
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                options={customers.map((c) => ({
                  value: c.id,
                  label: `${c.name} (${c.tierName || 'Standard'} Tier)`,
                }))}
              />

              <Select
                label="Currency"
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                options={[
                  { value: 'INR', label: 'INR (₹) - Indian Rupee (Default)' },
                  { value: 'USD', label: 'USD ($) - US Dollar' },
                  { value: 'EUR', label: 'EUR (€) - Euro' },
                  { value: 'GBP', label: 'GBP (£) - British Pound' },
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
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border border-blue-200/90 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-xs font-bold uppercase rounded-lg border shadow-2xs ${
                        selectedCustomer.tierName === 'Gold'
                          ? 'bg-amber-100 text-amber-950 border-amber-300'
                          : selectedCustomer.tierName === 'Silver'
                          ? 'bg-slate-200 text-slate-900 border-slate-300'
                          : 'bg-orange-100 text-orange-950 border-orange-300'
                      }`}
                    >
                      {selectedCustomer.tierName || 'Standard'} Tier
                    </span>
                    <div>
                      <span className="text-xs font-bold text-blue-950">
                        Tier Discount Ceiling: <span className="text-blue-700 font-extrabold">{tierLimit}%</span>
                      </span>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        {selectedCustomer.tierName === 'Gold'
                          ? 'Premium enterprise account with up to 15% pre-approved commercial discount advantage.'
                          : selectedCustomer.tierName === 'Silver'
                          ? 'Established business account with up to 10% pre-approved commercial discount advantage.'
                          : 'Standard business account with up to 5% pre-approved commercial discount advantage.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => handleApplyTierAdvantage(tierLimit)}
                      className="bg-white hover:bg-blue-50 text-blue-700 border-blue-300 font-bold text-xs shadow-2xs"
                    >
                      Apply {tierLimit}% Tier Advantage
                    </Button>
                    {(orderDiscountPercent || lines.some((l) => parseFloat(l.discountPercent) > 0)) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={handleResetDiscounts}
                        className="text-slate-500 hover:text-slate-700 text-xs"
                      >
                        Reset
                      </Button>
                    )}
                  </div>
                </div>
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
                      <th className="py-2.5 px-3 w-28 text-right">Unit Price ({currencyCode === 'USD' ? '$' : '₹'})</th>
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
                            <Select
                              searchable
                              placeholder="Select a product"
                              value={line.productId}
                              onChange={(e) => handleUpdateLine(idx, 'productId', e.target.value)}
                              options={products.map((p) => ({
                                value: p.id,
                                label: `[${p.sku}] ${p.name}`,
                              }))}
                            />
                          </td>

                          <td className="py-2.5 px-3">
                            <Select
                              placeholder="Base / Standard"
                              value={line.variantId || ''}
                              onChange={(e) => handleUpdateLine(idx, 'variantId', e.target.value)}
                              options={[
                                { value: '', label: 'Base / Standard' },
                                ...(variantsMap[line.productId] || []).map((v) => ({
                                  value: v.id,
                                  label: `${v.name} (+${formatCurrency(v.additionalPrice, currencyCode)})`,
                                }))
                              ]}
                            />
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
                            {formatCurrency(lineSubtotal, currencyCode)}
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

            {/* Overall Manual Deal Discount Control */}
            {lines.length > 0 && (
              <div className="p-4 bg-slate-50/90 rounded-xl border border-slate-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Overall Proposal Discount (%)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Apply blanket manual commercial discount across all proposal deliverables or use Tier Advantage above.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={orderDiscountPercent}
                      onChange={(e) => setOrderDiscountPercent(e.target.value)}
                      placeholder="0.0"
                      className={`w-28 h-9 px-3 text-center text-xs font-mono font-bold rounded-lg border focus:outline-none focus:ring-2 ${
                        orderDiscPct > tierLimit
                          ? 'border-amber-400 bg-amber-50 text-amber-900 focus:ring-amber-500'
                          : 'border-slate-300 bg-white focus:ring-blue-500'
                      }`}
                    />
                    <span className="ml-2 text-xs font-bold text-slate-600">%</span>
                  </div>
                  {orderDiscPct > 0 && (
                    <span
                      className={`text-[11px] font-semibold px-2 py-1 rounded-md border ${
                        orderDiscPct <= tierLimit
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-900 border-amber-300'
                      }`}
                    >
                      {orderDiscPct <= tierLimit ? '✓ Auto-Approved' : '⚠ Escalation'}
                    </span>
                  )}
                </div>
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
                <span className="font-mono text-slate-800">{formatCurrency(subTotal, currencyCode)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Commercial Discount</span>
                <span className="font-mono text-emerald-600">-{formatCurrency(discountTotal, currencyCode)}</span>
              </div>

              <div className="flex justify-between text-slate-500">
                <span>Estimated Tax (18% GST)</span>
                <span className="font-mono text-slate-800">{formatCurrency(taxTotal, currencyCode)}</span>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <span className="text-sm font-bold text-slate-900">Grand Total</span>
                <span className="text-2xl font-bold font-mono text-blue-600 tracking-tight">
                  {formatCurrency(grandTotal, currencyCode)}
                </span>
              </div>
            </div>

            {/* Governance & Tier Advantage Status */}
            {maxDiscountInQuote === 0 ? (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-800">Standard Catalog Pricing</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Zero discounts applied. Direct customer transmission available upon generation.
                  </span>
                </div>
              </div>
            ) : triggersApproval ? (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Approval Escalation Required</span>
                  <span className="text-[11px] text-amber-900 block mt-0.5 leading-relaxed">
                    Max discount ({maxDiscountInQuote}%) exceeds <strong>{selectedCustomer?.tierName || 'Standard'}</strong> Tier ceiling ({tierLimit}%). Automatically routes to Sales Management for signoff.
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-950 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-900">Tier Advantage Verified</span>
                  <span className="text-[11px] text-emerald-800 block mt-0.5 leading-relaxed">
                    Applied discount ({maxDiscountInQuote}%) is within <strong>{selectedCustomer?.tierName || 'Standard'}</strong> Tier ceiling (≤ {tierLimit}%). Auto-approved for instant transmission.
                  </span>
                </div>
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
