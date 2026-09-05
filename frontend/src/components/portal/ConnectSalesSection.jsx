import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Package, 
  UserCheck, 
  Send, 
  Mail, 
  Phone, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Search, 
  ChevronRight,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { salesConnectionApi } from '../../api';
import { Button, ErrorAlert, Select } from '../ui';

export const ConnectSalesSection = ({ onConnectionCreated, onNavigateToInquiries }) => {
  const [companies, setCompanies] = useState([]);
  const [products, setProducts] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [error, setError] = useState(null);

  // Selection states
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Resolution state
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedRep, setResolvedRep] = useState(null);
  const [resolutionError, setResolutionError] = useState(null);

  // Form states
  const [quantity, setQuantity] = useState(1);
  const [preferredContact, setPreferredContact] = useState('Email');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(null);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setIsLoadingCatalog(true);
    setError(null);
    try {
      const [compsRes, prodsRes] = await Promise.all([
        salesConnectionApi.getCompanies(),
        salesConnectionApi.getProducts()
      ]);
      const compList = Array.isArray(compsRes) ? compsRes : compsRes?.value || [];
      const prodList = Array.isArray(prodsRes) ? prodsRes : prodsRes?.value || [];
      setCompanies(compList);
      setProducts(prodList);
    } catch (err) {
      setError(err.message || 'Failed to load brand catalog.');
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Handle Product Selection
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSubmitSuccess(null);
    setSubmitError(null);

    // Auto-match company if product has a mapped company
    if (product.companyId) {
      const matchingCompany = companies.find(c => c.id === product.companyId);
      if (matchingCompany) {
        setSelectedCompany(matchingCompany);
        triggerResolution(product.id, matchingCompany.id);
        return;
      }
    }

    // If company already selected, re-resolve
    if (selectedCompany) {
      triggerResolution(product.id, selectedCompany.id);
    }
  };

  // Handle Company Selection
  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setSubmitSuccess(null);
    setSubmitError(null);

    if (selectedProduct) {
      triggerResolution(selectedProduct.id, company.id);
    }
  };

  // Trigger Resolution
  const triggerResolution = async (productId, companyId) => {
    setIsResolving(true);
    setResolutionError(null);
    setResolvedRep(null);
    try {
      const res = await salesConnectionApi.resolveRepresentative({ companyId, productId });
      if (res && res.found) {
        setResolvedRep(res);
      } else {
        setResolutionError(res?.matchReason || 'No representative could be assigned for this selection.');
      }
    } catch (err) {
      setResolutionError(err.message || 'Error resolving representative.');
    } finally {
      setIsResolving(false);
    }
  };

  // Submit Connection Request
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedCompany || !resolvedRep) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      const payload = {
        companyId: selectedCompany.id,
        productId: selectedProduct.id,
        requestedQuantity: parseInt(quantity, 10) || 1,
        preferredContactMethod: preferredContact,
        customerMessage: message.trim() || undefined
      };

      const res = await salesConnectionApi.createConnectionRequest(payload);
      setSubmitSuccess(res);
      setMessage('');
      if (onConnectionCreated) {
        onConnectionCreated(res);
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to submit inquiry.';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered products
  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || 
           p.sku.toLowerCase().includes(q) || 
           (p.categoryName && p.categoryName.toLowerCase().includes(q)) ||
           (p.companyName && p.companyName.toLowerCase().includes(q));
  });

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white border-b border-slate-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Representative Resolution</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">
              Connect Directly with Brand Sales Representatives
            </h2>
            <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
              Select your required product line and vendor brand. Our deterministic routing engine instantly pairs you with the certified commercial representative for priority quotation and consultative pricing.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1.5 rounded-lg border border-emerald-500/30 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Official SLA &amp; Direct Pricing
            </span>
          </div>
        </div>
      </div>

      {error && <div className="p-6"><ErrorAlert message={error} onRetry={loadCatalog} /></div>}

      <div className="p-6 space-y-8">
        {/* STEP 1: Select Product */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-mono">1</span>
                Select Catalog Product
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Choose the product solution you are evaluating for your enterprise</p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products or SKU..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>
          </div>

          {isLoadingCatalog ? (
            <div className="text-center py-8 text-slate-400 text-xs">Loading available enterprise catalog...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
              {filteredProducts.map((p) => {
                const isSelected = selectedProduct?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProduct(p)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 shadow-xs ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {p.sku}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {p.categoryName}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{p.name}</h4>
                      {p.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{p.description}</p>
                      )}
                    </div>
                    <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-[10px] font-medium text-slate-400">
                        Brand: <strong className="text-slate-700">{p.companyName || 'Universal'}</strong>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ₹{p.basePrice?.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* STEP 2: Select Company / Brand */}
        <section>
          <div className="mb-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-mono">2</span>
              Select Vendor / Operating Company
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Select the manufacturer or brand holding the contract warranty</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {companies.map((c) => {
              const isSelected = selectedCompany?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => handleSelectCompany(c)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/60 shadow-xs ring-1 ring-blue-600'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                      {c.code?.substring(0, 2) || 'CO'}
                    </div>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                      {c.code}
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900">{c.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                    {c.description || 'Enterprise Technology Partner'}
                  </p>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>{c.productCount} Products</span>
                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                      Select <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* STEP 3: Resolved Representative Contact Card */}
        <section className="bg-slate-50 rounded-xl p-5 border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              Assigned Commercial Specialist
            </h3>
            {isResolving && (
              <span className="text-xs text-blue-600 flex items-center gap-1.5 font-medium animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Executing routing resolution...
              </span>
            )}
          </div>

          {!selectedProduct || !selectedCompany ? (
            <div className="text-center py-6 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg bg-white">
              Please choose both a product and operating company above to preview your assigned sales representative.
            </div>
          ) : resolutionError ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block mb-0.5">Routing Notice</strong>
                {resolutionError}
              </div>
            </div>
          ) : resolvedRep ? (
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  {resolvedRep.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'SR'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-900">{resolvedRep.fullName}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                      Verified Representative
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>{resolvedRep.role}</span>
                    <span>•</span>
                    <span className="text-slate-700 font-medium">{resolvedRep.teamName}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                    <a href={`mailto:${resolvedRep.email}`} className="flex items-center gap-1.5 hover:text-blue-600 font-mono text-[11px]">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      {resolvedRep.email}
                    </a>
                    {resolvedRep.phone && (
                      <span className="flex items-center gap-1.5 text-[11px] font-mono">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {resolvedRep.phone}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200/80 md:max-w-xs text-left">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  Routing Rationale
                </span>
                <p className="text-xs text-slate-700 font-medium leading-snug">
                  {resolvedRep.matchReason}
                </p>
                {resolvedRep.specialization && (
                  <span className="inline-block mt-2 text-[10px] px-2 py-0.5 rounded bg-blue-100/70 text-blue-800 font-medium">
                    {resolvedRep.specialization}
                  </span>
                )}
              </div>
            </div>
          ) : null}
        </section>

        {/* STEP 4: Submit Connection Request Form */}
        {selectedProduct && selectedCompany && resolvedRep && (
          <form onSubmit={handleSubmit} className="border-t border-slate-200 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              Submit Direct Connection Inquiry
            </h3>

            {submitSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-sm font-bold block">Inquiry Dispatched Successfully!</strong>
                    <p className="text-xs text-emerald-800 mt-1">
                      Tracking Reference: <span className="font-mono font-bold">{submitSuccess.requestNumber}</span>. Your assigned representative <strong>{resolvedRep.fullName}</strong> has been notified directly and will follow up with quotation pricing.
                    </p>
                  </div>
                </div>
                {onNavigateToInquiries && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={onNavigateToInquiries}
                    className="shrink-0 bg-white"
                  >
                    View In My Inquiries
                  </Button>
                )}
              </div>
            )}

            {submitError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm font-bold block">Inquiry Notice</strong>
                  <p className="text-xs text-rose-800 mt-0.5">{submitError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Preferred Contact Method
                </label>
                <Select
                  value={preferredContact}
                  onChange={(e) => setPreferredContact(e.target.value)}
                  options={[
                    { value: 'Email', label: 'Email Communication' },
                    { value: 'Phone', label: 'Direct Phone Call' },
                    { value: 'VideoCall', label: 'Executive Video Consultation' },
                    { value: 'Portal', label: 'Customer Portal Notifications' }
                  ]}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Project Notes &amp; Specifications (Optional)
                </label>
                <textarea
                  rows="3"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Outline any volume delivery schedules, custom hardware configurations, or discount thresholds needed..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                icon={Send}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-6 py-2.5 font-semibold shadow-xs"
              >
                {isSubmitting ? 'Dispatching Connection Request...' : 'Connect with Sales Representative'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ConnectSalesSection;
