import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCheck,
  Building2,
  Package,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  FileText,
  Mail,
  Phone,
  ArrowUpRight,
  Send,
  Zap,
  ShieldCheck,
  Tag,
  ChevronRight
} from 'lucide-react';
import { salesConnectionApi } from '../api';
import {
  PageHeader,
  Button,
  DataTable,
  Drawer,
  ErrorAlert,
  LoadingSpinner,
  Badge
} from '../components/ui';
import { useToast } from '../context/ToastContext';

export const SalesConnectionsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [requests, setRequests] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Request Drawer
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Action Drawer Form State
  const [drawerStatus, setDrawerStatus] = useState('Pending');
  const [repNotes, setRepNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isCreatingQuote, setIsCreatingQuote] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqsRes, compsRes] = await Promise.all([
        salesConnectionApi.getWorkspaceRequests(),
        salesConnectionApi.getCompanies()
      ]);
      const reqList = Array.isArray(reqsRes) ? reqsRes : reqsRes?.value || [];
      const compList = Array.isArray(compsRes) ? compsRes : compsRes?.value || [];
      setRequests(reqList);
      setCompanies(compList);

      if (selectedRequest) {
        const updated = reqList.find(r => r.id === selectedRequest.id);
        if (updated) setSelectedRequest(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to load sales connections workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDrawer = (req) => {
    setSelectedRequest(req);
    setDrawerStatus(req.status);
    setRepNotes(req.repNotes || '');
    setRejectionReason(req.rejectionReason || '');
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedRequest(null);
  };

  const handleUpdateStatus = async (e) => {
    e?.preventDefault();
    if (!selectedRequest) return;

    setIsUpdatingStatus(true);
    try {
      const statusValueMap = {
        Pending: 1,
        Contacted: 2,
        Qualified: 3,
        QuoteCreated: 4,
        Converted: 5,
        Rejected: 6,
        Closed: 7
      };

      const payload = {
        status: statusValueMap[drawerStatus] || 2,
        repNotes: repNotes.trim() || undefined,
        rejectionReason: drawerStatus === 'Rejected' ? (rejectionReason.trim() || undefined) : undefined
      };

      const updated = await salesConnectionApi.updateStatus(selectedRequest.id, payload);
      toast?.showSuccess?.(`Inquiry #${updated.requestNumber} status updated to ${updated.status}`);
      setSelectedRequest(updated);
      loadData();
    } catch (err) {
      toast?.showError?.(err.message || 'Failed to update status.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleCreateQuote = async () => {
    if (!selectedRequest) return;

    setIsCreatingQuote(true);
    try {
      const res = await salesConnectionApi.createQuoteFromConnection(selectedRequest.id);
      toast?.showSuccess?.(`Quotation #${res.quotationNumber} generated successfully! Transitioning to Quotation Workspace...`);
      setIsDrawerOpen(false);
      navigate(`/workspace/quotations/${res.quotationId}`);
    } catch (err) {
      toast?.showError?.(err.message || 'Failed to generate quotation.');
    } finally {
      setIsCreatingQuote(false);
    }
  };

  // KPIs
  const totalCount = requests.length;
  const pendingCount = requests.filter(r => r.status === 'Pending').length;
  const inProgressCount = requests.filter(r => r.status === 'Contacted' || r.status === 'Qualified').length;
  const quoteCreatedCount = requests.filter(r => r.status === 'QuoteCreated' || r.status === 'Converted').length;

  // Filtered requests
  const filteredRequests = requests.filter(r => {
    if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
    if (companyFilter !== 'ALL' && String(r.companyId) !== String(companyFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.requestNumber?.toLowerCase().includes(q) ||
        r.customerName?.toLowerCase().includes(q) ||
        r.productName?.toLowerCase().includes(q) ||
        r.productSku?.toLowerCase().includes(q) ||
        r.companyName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const columns = [
    {
      header: 'Tracking Ref',
      accessor: 'requestNumber',
      render: (r) => (
        <div>
          <button
            type="button"
            onClick={() => handleOpenDrawer(r)}
            className="font-mono font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer"
          >
            {r.requestNumber}
          </button>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            {r.createdAtUtc ? new Date(r.createdAtUtc).toLocaleDateString() : ''}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer Account',
      accessor: 'customerName',
      render: (r) => (
        <div>
          <span className="font-semibold text-xs text-slate-900 block">{r.customerName}</span>
          <span className="text-[11px] text-slate-400 font-mono">{r.customerEmail || 'Enterprise Client'}</span>
        </div>
      ),
    },
    {
      header: 'Brand & Product',
      accessor: 'productName',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-mono">
              {r.companyName}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">({r.productSku})</span>
          </div>
          <span className="font-medium text-xs text-slate-800 block line-clamp-1">{r.productName}</span>
          <span className="text-[11px] text-slate-500 font-mono font-bold">
            ₹{r.basePrice?.toLocaleString('en-IN')} × {r.requestedQuantity}
          </span>
        </div>
      ),
    },
    {
      header: 'Assigned Specialist',
      accessor: 'salesRepName',
      render: (r) => (
        <div>
          <span className="text-xs font-semibold text-slate-800 block">{r.salesRepName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{r.salesRepEmail}</span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (r) => {
        const statusMap = {
          Pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
          Contacted: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
          Qualified: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
          QuoteCreated: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
          Converted: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
          Rejected: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
          Closed: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' }
        };
        const s = statusMap[r.status] || { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
        return (
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
            {r.status === 'QuoteCreated' ? 'Quotation Issued' : r.status}
          </span>
        );
      },
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            onClick={() => handleOpenDrawer(r)}
          >
            Review &amp; Action
          </Button>
          {r.quotationId && (
            <Button
              variant="outline"
              size="xs"
              icon={FileText}
              onClick={() => navigate(`/workspace/quotations/${r.quotationId}`)}
              className="text-emerald-700 border-emerald-200 hover:bg-emerald-50"
            >
              View Quote
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in">
      <PageHeader
        title="Customer Sales Connections & Brand Inquiries"
        subtitle="Manage inbound customer product connections, qualify enterprise interest, and convert inquiries into quotations."
        actions={
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={loadData}>
            Refresh
          </Button>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Inbound Inquiries</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {totalCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all mapped vendor brands</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2 tracking-tight">
            {pendingCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Awaiting initial sales outreach</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Contacted / Qualified</span>
            <Zap className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2 tracking-tight">
            {inProgressCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Active commercial discussion</p>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Converted to Quotations</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 tracking-tight">
            {quoteCreatedCount}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Proposals active in pricing engine</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Inquiries' },
            { id: 'Pending', label: 'Pending' },
            { id: 'Contacted', label: 'Contacted' },
            { id: 'Qualified', label: 'Qualified' },
            { id: 'QuoteCreated', label: 'Quotation Issued' },
            { id: 'Closed', label: 'Closed / Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Company Filter & Search */}
        <div className="flex items-center gap-3">
          <select
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Vendor Brands</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reference, customer..."
              className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredRequests}
        isLoading={isLoading}
        emptyMessage="No customer sales inquiries found"
        emptyDescription="Inbound customer connections for products and brands will appear here."
      />

      {/* Action & Quotation Generation Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={selectedRequest ? `Sales Connection #${selectedRequest.requestNumber}` : 'Inquiry Details'}
        subtitle="Review customer product interest, record sales progress, and generate commercial quotations"
        size="lg"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Top Overview Banner */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Customer &amp; Product Details
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                  {selectedRequest.preferredContactMethod || 'Email'} Preferred
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Customer Account</span>
                  <strong className="text-slate-900 text-sm">{selectedRequest.customerName}</strong>
                  <span className="text-slate-500 block font-mono text-[11px]">{selectedRequest.customerEmail}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Product &amp; Operating Company</span>
                  <strong className="text-slate-900 text-sm">{selectedRequest.productName}</strong>
                  <span className="text-blue-600 block font-semibold text-[11px]">
                    {selectedRequest.companyName} • SKU: {selectedRequest.productSku}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Requested Units</span>
                  <strong className="text-slate-900 text-sm font-mono">{selectedRequest.requestedQuantity} Units</strong>
                  <span className="text-slate-500 block text-[11px]">
                    Base List: ₹{selectedRequest.basePrice?.toLocaleString('en-IN')} / unit
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Assigned Representative</span>
                  <strong className="text-slate-900 text-sm">{selectedRequest.salesRepName}</strong>
                  <span className="text-slate-500 block font-mono text-[11px]">{selectedRequest.salesRepEmail}</span>
                </div>
              </div>

              {/* Customer Notes */}
              {selectedRequest.customerMessage && (
                <div className="pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Customer Project Message
                  </span>
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
                    "{selectedRequest.customerMessage}"
                  </div>
                </div>
              )}

              {/* Resolution Reason */}
              {selectedRequest.resolutionReason && (
                <div className="pt-2 text-[11px] text-slate-500">
                  <strong className="text-slate-700 font-medium">Resolution Rule: </strong>
                  {selectedRequest.resolutionReason}
                </div>
              )}
            </div>

            {/* If Quotation Already Created */}
            {selectedRequest.quotationId && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Official Quotation Generated (#{selectedRequest.quotationNumber || selectedRequest.quotationId})
                    </h4>
                    <p className="text-[11px] text-emerald-800">
                      This inquiry has already been converted into a commercial quotation in the pricing engine.
                    </p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="xs"
                  icon={ArrowUpRight}
                  onClick={() => {
                    setIsDrawerOpen(false);
                    navigate(`/workspace/quotations/${selectedRequest.quotationId}`);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                >
                  Open Quotation
                </Button>
              </div>
            )}

            {/* 1-Click Quotation Generator Action */}
            {!selectedRequest.quotationId && (
              <div className="p-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-white text-[11px] font-semibold">
                    <Zap className="w-3.5 h-3.5 fill-white" />
                    <span>1-Click Engine Transition</span>
                  </div>
                  <span className="text-[11px] text-blue-100 font-mono">
                    Est. Value: ₹{(selectedRequest.basePrice * selectedRequest.requestedQuantity)?.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight">Convert to Official Quotation</h4>
                  <p className="text-xs text-blue-100 mt-0.5 leading-relaxed">
                    Instantly launches the DealFlow360 Quotation Engine. Pre-populates the customer account, assigns this representative, mounts the selected product line item, and executes discount governance &amp; margin calculation.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={isCreatingQuote}
                  icon={FileText}
                  onClick={handleCreateQuote}
                  className="w-full bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs py-2.5 shadow-xs"
                >
                  {isCreatingQuote ? 'Launching Pricing Engine...' : 'Generate Commercial Quotation Now'}
                </Button>
              </div>
            )}

            {/* Status & Progress Form */}
            <form onSubmit={handleUpdateStatus} className="border-t border-slate-200 pt-5 space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Progress Status &amp; Representative Notes
              </h4>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lifecycle Status
                </label>
                <select
                  value={drawerStatus}
                  onChange={(e) => setDrawerStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  <option value="Pending">Pending Review</option>
                  <option value="Contacted">Contacted Customer</option>
                  <option value="Qualified">Qualified Enterprise Lead</option>
                  <option value="QuoteCreated" disabled>Quotation Issued (Triggered via Create Quote)</option>
                  <option value="Converted">Converted to Order</option>
                  <option value="Rejected">Rejected / Disqualified</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              {drawerStatus === 'Rejected' && (
                <div>
                  <label className="block text-xs font-semibold text-rose-700 mb-1">
                    Disqualification / Rejection Rationale
                  </label>
                  <input
                    type="text"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="E.g., Out of scope, budget mismatch, competitor selected..."
                    className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Representative Action Notes (Internal)
                </label>
                <textarea
                  rows="3"
                  value={repNotes}
                  onChange={(e) => setRepNotes(e.target.value)}
                  placeholder="Record customer meeting notes, technical requirements, delivery constraints..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isUpdatingStatus}
                  className="bg-slate-900 text-white text-xs px-5 py-2 font-semibold"
                >
                  {isUpdatingStatus ? 'Saving Updates...' : 'Save Progress'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default SalesConnectionsPage;
