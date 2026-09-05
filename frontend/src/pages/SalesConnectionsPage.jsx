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
  ChevronRight,
  ChevronLeft,
  Calendar,
  XCircle,
  MessageSquare,
  Check,
} from 'lucide-react';
import { salesConnectionApi } from '../api';
import {
  PageHeader,
  Button,
  DataTable,
  Drawer,
  Modal,
  ErrorAlert,
  LoadingSpinner,
  Badge,
  StatusBadge,
  Input,
  Select,
  Textarea,
} from '../components/ui';
import { useToast } from '../context/ToastContext';
import { formatCurrency, formatDate } from '../utils/formatters';

export const SalesConnectionsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  // Primary Data State
  const [inquiries, setInquiries] = useState([]);
  const [summary, setSummary] = useState({
    total: 0,
    new: 0,
    accepted: 0,
    inProgress: 0,
    contacted: 0,
    qualified: 0,
    quoteCreated: 0,
    converted: 0,
    rejected: 0,
    closed: 0,
  });
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Drawer / Inspection State
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Modal Action States
  const [activeModal, setActiveModal] = useState(null); // 'accept', 'contact', 'qualify', 'reject'
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Action Form Inputs
  const [acceptNotes, setAcceptNotes] = useState('');
  const [contactMethod, setContactMethod] = useState('Phone');
  const [contactNotes, setContactNotes] = useState('');
  const [contactOutcome, setContactOutcome] = useState('Discussion Completed');
  const [qualifyNotes, setQualifyNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Budget mismatch');
  const [rejectionCustomNotes, setRejectionCustomNotes] = useState('');

  // Initial Load & Query Debounce
  useEffect(() => {
    loadData();
  }, [page, pageSize, statusFilter, companyFilter, sortBy]);

  // Load Companies once on mount
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const res = await salesConnectionApi.getCompanies();
      const list = Array.isArray(res) ? res : res?.value || [];
      setCompanies(list);
    } catch {
      // Non-critical
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const pagedRes = await salesConnectionApi.getWorkspaceInquiriesPaged({
        search: searchQuery.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        companyId: companyFilter !== 'ALL' ? parseInt(companyFilter, 10) : undefined,
        sortBy,
        page,
        pageSize,
      });

      const items = Array.isArray(pagedRes?.items) ? pagedRes.items : [];
      setInquiries(items);
      setTotalCount(pagedRes?.totalCount || items.length);

      if (pagedRes?.summary) {
        setSummary(pagedRes.summary);
      } else {
        try {
          const sumRes = await salesConnectionApi.getInquiriesSummary();
          if (sumRes) setSummary(sumRes);
        } catch {
          // ignore
        }
      }

      if (selectedInquiry) {
        const refreshed = items.find((i) => i.id === selectedInquiry.id);
        if (refreshed) {
          setSelectedInquiry(refreshed);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to load sales inquiries workspace.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setCompanyFilter('ALL');
    setSortBy('newest');
    setPage(1);
  };

  // Drawer handlers
  const handleOpenDrawer = (item) => {
    setSelectedInquiry(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedInquiry(null);
  };

  // Quick Action Modal Triggers
  const triggerAcceptModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setAcceptNotes('');
    setActiveModal('accept');
  };

  const triggerContactModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setContactMethod(inquiry.preferredContactMethod || 'Phone');
    setContactNotes('');
    setContactOutcome('Requirements Discussed');
    setActiveModal('contact');
  };

  const triggerQualifyModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setQualifyNotes('');
    setActiveModal('qualify');
  };

  const triggerRejectModal = (inquiry) => {
    setSelectedInquiry(inquiry);
    setRejectionReason('Budget mismatch');
    setRejectionCustomNotes('');
    setActiveModal('reject');
  };

  // Action Executions with Conflict (409) Protection
  const handleAcceptSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedInquiry) return;
    setIsSubmittingAction(true);
    try {
      const updated = await salesConnectionApi.acceptInquiry(selectedInquiry.id, {
        notes: acceptNotes.trim() || undefined,
      });
      toast.success('Inquiry Accepted', `Inquiry #${updated.requestNumber} accepted and claimed into your active pipeline.`);
      setActiveModal(null);
      setSelectedInquiry(updated);
      loadData();
    } catch (err) {
      if (err.status === 409 || err.message?.includes('already') || err.message?.includes('conflict')) {
        toast.error('Conflict', 'This inquiry has already been modified or claimed by another session. Refreshed.');
      } else {
        toast.error('Acceptance Failed', err.message || 'Failed to accept inquiry.');
      }
      loadData();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedInquiry) return;
    if (!contactNotes.trim()) {
      toast.error('Validation Error', 'Please record customer interaction notes before saving.');
      return;
    }
    setIsSubmittingAction(true);
    try {
      const updated = await salesConnectionApi.contactCustomer(selectedInquiry.id, {
        contactMethod,
        notes: contactNotes.trim(),
        outcome: contactOutcome.trim(),
      });
      toast.success('Outreach Logged', `Customer outreach logged for #${updated.requestNumber}. Status is now Contacted.`);
      setActiveModal(null);
      setSelectedInquiry(updated);
      loadData();
    } catch (err) {
      if (err.status === 409 || err.message?.includes('conflict')) {
        toast.error('Conflict', 'Inquiry state was changed. Data refreshed.');
      } else {
        toast.error('Log Failed', err.message || 'Failed to log customer interaction.');
      }
      loadData();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleQualifySubmit = async (e) => {
    e?.preventDefault();
    if (!selectedInquiry) return;
    if (!qualifyNotes.trim()) {
      toast.error('Validation Error', 'Please provide qualification notes (budget, timeline, technical scope).');
      return;
    }
    setIsSubmittingAction(true);
    try {
      const updated = await salesConnectionApi.qualifyInquiry(selectedInquiry.id, {
        repNotes: qualifyNotes.trim(),
      });
      toast.success('Inquiry Qualified', `Inquiry #${updated.requestNumber} successfully Qualified! Ready for commercial quotation.`);
      setActiveModal(null);
      setSelectedInquiry(updated);
      loadData();
    } catch (err) {
      if (err.status === 409 || err.message?.includes('conflict')) {
        toast.error('Conflict', 'Inquiry state was updated elsewhere. Refreshed.');
      } else {
        toast.error('Qualification Failed', err.message || 'Failed to qualify inquiry.');
      }
      loadData();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleRejectSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedInquiry) return;
    const finalReason = rejectionCustomNotes.trim()
      ? `${rejectionReason}: ${rejectionCustomNotes.trim()}`
      : rejectionReason;

    setIsSubmittingAction(true);
    try {
      const updated = await salesConnectionApi.rejectInquiry(selectedInquiry.id, {
        rejectionReason: finalReason,
      });
      toast.success('Inquiry Disqualified', `Inquiry #${updated.requestNumber} marked as Disqualified / Rejected.`);
      setActiveModal(null);
      setSelectedInquiry(updated);
      loadData();
    } catch (err) {
      if (err.status === 409 || err.message?.includes('conflict')) {
        toast.error('Conflict', 'Inquiry was already updated.');
      } else {
        toast.error('Disqualification Failed', err.message || 'Failed to disqualify inquiry.');
      }
      loadData();
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // 1-Click Quotation Generator Bridge
  const handleCreateQuoteOneClick = async (inquiry) => {
    const target = inquiry || selectedInquiry;
    if (!target) return;

    setIsSubmittingAction(true);
    try {
      const res = await salesConnectionApi.createQuoteFromConnection(target.id);
      toast.success('Quotation Created', `Quotation #${res.quotationNumber} created successfully! Redirecting to pricing engine...`);
      setIsDrawerOpen(false);
      navigate(`/workspace/quotations/${res.quotationId}`);
    } catch (err) {
      toast.error('Quotation Failed', err.message || 'Failed to generate quotation from inquiry.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Open in Quotation Builder (Pre-populates all inquiry fields)
  const handleOpenInQuoteBuilder = (target) => {
    const item = target || selectedInquiry;
    if (!item) return;

    const queryParams = new URLSearchParams({
      customerId: (item.customerId || '').toString(),
      productId: (item.productId || '').toString(),
      quantity: (item.requestedQuantity || 1).toString(),
      inquiryId: item.requestNumber || '',
      notes: `Generated from Inquiry #${item.requestNumber} (${item.companyName || ''} - ${item.productName || ''}). Customer request: ${item.customerMessage || 'Standard RFP Request'}`,
    });

    setIsDrawerOpen(false);
    navigate(`/workspace/quotations/new?${queryParams.toString()}`);
  };

  // Pagination Helpers
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const startItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  // Table Column Definitions
  const columns = [
    {
      header: 'Tracking Ref',
      accessor: 'requestNumber',
      render: (r) => (
        <div>
          <button
            type="button"
            onClick={() => handleOpenDrawer(r)}
            className="font-mono font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer flex items-center gap-1"
          >
            <span>{r.requestNumber}</span>
            <ArrowUpRight className="w-3 h-3 text-blue-400" />
          </button>
          <span className="text-[11px] text-slate-400 block mt-0.5 font-mono">
            {formatDate(r.createdAtUtc)}
          </span>
        </div>
      ),
    },
    {
      header: 'Customer Account',
      accessor: 'customerName',
      render: (r) => (
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="font-semibold text-xs text-slate-900">{r.customerName}</span>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
              {r.customerTierName || 'Bronze'} ({r.tierDiscountPercent || 5}%)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono block">
            {r.customerEmail || 'Enterprise Client'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">
            Prefers: <span className="text-slate-600 font-semibold">{r.preferredContactMethod || 'Email'}</span>
          </span>
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
          <span className="text-[11px] text-slate-500 font-mono">
            ₹{r.basePrice?.toLocaleString('en-IN')} × {r.requestedQuantity} {r.requestedQuantity > 1 ? 'Units' : 'Unit'}
          </span>
        </div>
      ),
    },
    {
      header: 'Est. Deal Value',
      accessor: 'basePrice',
      render: (r) => {
        const estValue = (r.basePrice || 0) * (r.requestedQuantity || 1);
        return (
          <div>
            <span className="font-bold font-mono text-xs text-slate-900 block">
              ₹{estValue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">List Pipeline</span>
          </div>
        );
      },
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
      render: (r) => <StatusBadge status={r.status} size="sm" />,
    },
    {
      header: 'Quick Action',
      accessor: 'id',
      render: (r) => {
        return (
          <div className="flex items-center gap-1.5">
            {r.status === 'Pending' && (
              <>
                <Button
                  variant="primary"
                  size="xs"
                  icon={Check}
                  onClick={() => triggerAcceptModal(r)}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-semibold"
                >
                  Accept
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  icon={XCircle}
                  onClick={() => triggerRejectModal(r)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold"
                >
                  Reject
                </Button>
              </>
            )}

            {r.status === 'Accepted' && (
              <>
                <Button
                  variant="primary"
                  size="xs"
                  icon={FileText}
                  onClick={() => handleOpenInQuoteBuilder(r)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                >
                  Create Quote
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  icon={Zap}
                  onClick={() => handleCreateQuoteOneClick(r)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs"
                  title="Instant 1-Click Quote with Tier Discount"
                >
                  1-Click Quote
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  icon={Phone}
                  onClick={() => triggerContactModal(r)}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-semibold text-xs"
                >
                  Contact
                </Button>
              </>
            )}

            {r.status === 'Contacted' && (
              <>
                <Button
                  variant="primary"
                  size="xs"
                  icon={ShieldCheck}
                  onClick={() => triggerQualifyModal(r)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
                >
                  Qualify
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  icon={FileText}
                  onClick={() => handleOpenInQuoteBuilder(r)}
                  className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-semibold text-xs"
                >
                  Generate Quote
                </Button>
              </>
            )}

            {r.status === 'Qualified' && !r.quotationId && (
              <>
                <Button
                  variant="primary"
                  size="xs"
                  icon={FileText}
                  onClick={() => handleOpenInQuoteBuilder(r)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs text-xs"
                >
                  Generate Quote
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  icon={Zap}
                  onClick={() => handleCreateQuoteOneClick(r)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-semibold text-xs"
                >
                  1-Click
                </Button>
              </>
            )}

            {r.quotationId && (
              <Button
                variant="outline"
                size="xs"
                icon={FileText}
                onClick={() => navigate(`/workspace/quotations/${r.quotationId}`)}
                className="text-emerald-700 border-emerald-300 hover:bg-emerald-50 font-semibold"
              >
                View Quote
              </Button>
            )}

            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenDrawer(r)}
              className="text-slate-600 hover:text-slate-900 border-slate-200 font-medium"
            >
              Review
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Sales Inquiries Workspace"
        subtitle="Operational inbox for customer-generated product requests. Review context, accept inquiries, qualify requirements, and generate commercial quotations."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadData}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadData} />}

      {/* KPI Metric Summary Cards - Clickable Interactive Filters */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <button
          type="button"
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-blue-50/70 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Requests</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2 tracking-tight">
            {summary.total}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">All assigned</p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Pending'); setPage(1); }}
          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2 tracking-tight">
            {summary.new}
          </div>
          <p className="text-[11px] text-amber-700/80 mt-0.5 font-medium">Awaiting acceptance</p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Accepted'); setPage(1); }}
          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
            statusFilter === 'Accepted'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Accepted</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2 tracking-tight">
            {summary.accepted}
          </div>
          <p className="text-[11px] text-emerald-700/80 mt-0.5 font-medium">Ready to quote</p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Contacted'); setPage(1); }}
          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
            statusFilter === 'Contacted'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>In Contact</span>
            <MessageSquare className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 mt-2 tracking-tight">
            {summary.contacted}
          </div>
          <p className="text-[11px] text-blue-700/80 mt-0.5 font-medium">Outreach open</p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('Qualified'); setPage(1); }}
          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
            statusFilter === 'Qualified'
              ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-indigo-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Qualified Deals</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2 tracking-tight">
            {summary.qualified}
          </div>
          <p className="text-[11px] text-indigo-700/80 mt-0.5 font-medium">Scope verified</p>
        </button>

        <button
          type="button"
          onClick={() => { setStatusFilter('QuoteCreated'); setPage(1); }}
          className={`p-3.5 rounded-xl text-left border transition-all cursor-pointer ${
            statusFilter === 'QuoteCreated' || statusFilter === 'Converted'
              ? 'bg-purple-50/80 border-purple-400 ring-2 ring-purple-500/30 shadow-xs'
              : 'bg-white border-slate-200 hover:border-purple-300 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Quoted &amp; Won</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-2 tracking-tight">
            {summary.quoteCreated + summary.converted}
          </div>
          <p className="text-[11px] text-purple-700/80 mt-0.5 font-medium">Proposals live</p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL', label: 'All Inquiries' },
            { id: 'Pending', label: `New (${summary.new})` },
            { id: 'Accepted', label: 'Accepted' },
            { id: 'Contacted', label: 'Contacted' },
            { id: 'Qualified', label: 'Qualified' },
            { id: 'QuoteCreated', label: 'Quotation Issued' },
            { id: 'Converted', label: 'Converted' },
            { id: 'Rejected', label: 'Disqualified' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setPage(1);
              }}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                statusFilter === tab.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2.5 flex-1">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reference, customer, brand, SKU..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
              />
            </div>

            <Select
              value={companyFilter}
              onChange={(e) => {
                setCompanyFilter(e.target.value);
                setPage(1);
              }}
              className="min-w-[180px]"
              options={[
                { value: 'ALL', label: 'All Vendor Brands' },
                ...companies.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />

            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="min-w-[180px]"
              options={[
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
                { value: 'customer', label: 'Customer Name (A-Z)' },
                { value: 'status', label: 'Status Order' },
              ]}
            />

            <Button type="submit" variant="outline" size="sm" className="text-xs">
              Search
            </Button>

            {(searchQuery || statusFilter !== 'ALL' || companyFilter !== 'ALL' || sortBy !== 'newest') && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 underline font-medium cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium shrink-0">
            Showing <strong className="text-slate-800">{startItem}</strong>-
            <strong className="text-slate-800">{endItem}</strong> of{' '}
            <strong className="text-slate-800">{totalCount}</strong> inquiries
          </div>
        </form>
      </div>

      {/* Main Inquiries Table */}
      <DataTable
        columns={columns}
        data={inquiries}
        isLoading={isLoading}
        emptyMessage="No customer sales inquiries found matching criteria"
        emptyDescription="Inbound customer connections resolved for you by the routing engine will appear here."
      />

      {/* Table Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Items per page:</span>
            <Select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value, 10));
                setPage(1);
              }}
              className="w-24"
              options={[
                { value: 10, label: '10' },
                { value: 20, label: '20' },
                { value: 50, label: '50' },
              ]}
            />
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="xs"
              icon={ChevronLeft}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-xs font-semibold text-slate-700 px-2 font-mono">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="xs"
              icon={ChevronRight}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail & Action Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={handleCloseDrawer}
        title={selectedInquiry ? `Inquiry #${selectedInquiry.requestNumber}` : 'Inquiry Context'}
        subtitle="Inbound commercial request context, client specifications, and sales pipeline actions"
        width="lg"
      >
        {selectedInquiry && (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Lifecycle Status:</span>
                <StatusBadge status={selectedInquiry.status} />
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Received: {formatDate(selectedInquiry.createdAtUtc)}
              </span>
            </div>

            {/* Visual Lifecycle Stepper */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Inquiry Progression Timeline
              </h4>

              <div className="grid grid-cols-5 gap-1 pt-1 text-center">
                {/* Step 1: Received */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
                    ✓
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 mt-1.5">Inbound</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {selectedInquiry.createdAtUtc ? new Date(selectedInquiry.createdAtUtc).toLocaleDateString() : ''}
                  </span>
                </div>

                {/* Step 2: Accepted */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedInquiry.acceptedAtUtc || ['Contacted', 'Qualified', 'QuoteCreated', 'Converted'].includes(selectedInquiry.status)
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : selectedInquiry.status === 'Pending'
                        ? 'bg-amber-100 text-amber-800 border-2 border-amber-400 animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {selectedInquiry.acceptedAtUtc || ['Contacted', 'Qualified', 'QuoteCreated', 'Converted'].includes(selectedInquiry.status)
                      ? '✓'
                      : '2'}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Accepted</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {selectedInquiry.acceptedAtUtc ? new Date(selectedInquiry.acceptedAtUtc).toLocaleDateString() : 'Awaiting'}
                  </span>
                </div>

                {/* Step 3: Contacted */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedInquiry.contactedAtUtc || ['Qualified', 'QuoteCreated', 'Converted'].includes(selectedInquiry.status)
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : selectedInquiry.status === 'Accepted'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-400 animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {selectedInquiry.contactedAtUtc || ['Qualified', 'QuoteCreated', 'Converted'].includes(selectedInquiry.status)
                      ? '✓'
                      : '3'}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Contacted</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {selectedInquiry.contactedAtUtc ? new Date(selectedInquiry.contactedAtUtc).toLocaleDateString() : 'Pending'}
                  </span>
                </div>

                {/* Step 4: Qualified */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedInquiry.qualifiedAtUtc || ['QuoteCreated', 'Converted'].includes(selectedInquiry.status)
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : selectedInquiry.status === 'Contacted'
                        ? 'bg-indigo-100 text-indigo-800 border-2 border-indigo-400 animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {selectedInquiry.qualifiedAtUtc || ['QuoteCreated', 'Converted'].includes(selectedInquiry.status)
                      ? '✓'
                      : '4'}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Qualified</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {selectedInquiry.qualifiedAtUtc ? new Date(selectedInquiry.qualifiedAtUtc).toLocaleDateString() : 'Pending'}
                  </span>
                </div>

                {/* Step 5: Quoted */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      selectedInquiry.quotationId
                        ? 'bg-emerald-600 text-white shadow-2xs'
                        : selectedInquiry.status === 'Qualified'
                        ? 'bg-emerald-100 text-emerald-800 border-2 border-emerald-400 animate-pulse'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {selectedInquiry.quotationId ? '✓' : '5'}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-700 mt-1.5">Quotation</span>
                  <span className="text-[9px] text-slate-400 font-mono">
                    {selectedInquiry.quotationNumber ? `#${selectedInquiry.quotationNumber}` : 'Pending'}
                  </span>
                </div>
              </div>

              {selectedInquiry.status === 'Rejected' && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2 mt-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Disqualified / Rejected: </strong>
                    <span>{selectedInquiry.rejectionReason || 'Commercial fit mismatch'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Context Cards: Customer & Product */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Customer Account
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600">
                    ID #{selectedInquiry.customerId}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">{selectedInquiry.customerName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{selectedInquiry.customerEmail}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
                  <span>Preferred Channel:</span>
                  <span className="font-semibold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedInquiry.preferredContactMethod || 'Email'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Requested Product
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    {selectedInquiry.companyName}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{selectedInquiry.productName}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">SKU: {selectedInquiry.productSku}</p>
                </div>
                <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-500">₹{selectedInquiry.basePrice?.toLocaleString('en-IN')} × {selectedInquiry.requestedQuantity}</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₹{((selectedInquiry.basePrice || 0) * (selectedInquiry.requestedQuantity || 1))?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {selectedInquiry.customerMessage && (
              <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-1.5">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Client Project Scope &amp; Notes
                </span>
                <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-lg border border-blue-100">
                  "{selectedInquiry.customerMessage}"
                </p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Engine 14 Routing &amp; Representative Assignment
              </span>
              <div className="grid grid-cols-2 gap-3 text-slate-600">
                <div>
                  <span className="text-[11px] text-slate-400 block">Assigned Representative:</span>
                  <strong className="text-slate-900 text-xs">{selectedInquiry.salesRepName}</strong>
                  <span className="text-[11px] text-slate-500 block font-mono">{selectedInquiry.salesRepEmail}</span>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 block">Routing Resolution Logic:</span>
                  <span className="text-slate-700 text-xs font-medium">
                    {selectedInquiry.resolutionReason || 'Default Account Manager rule'}
                  </span>
                </div>
              </div>
            </div>

            {selectedInquiry.repNotes && (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Representative Interaction Log
                </span>
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs whitespace-pre-wrap leading-relaxed shadow-xs">
                  {selectedInquiry.repNotes}
                </div>
              </div>
            )}

            {/* Action Toolbar */}
            <div className="p-5 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-4 shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold tracking-tight">Stage Actions &amp; Quotation Gateway</h4>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Execute current lifecycle transition or convert into pricing engine proposal.
                  </p>
                </div>
                <StatusBadge status={selectedInquiry.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-700/80">
                {selectedInquiry.status === 'Pending' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={Check}
                      disabled={isSubmittingAction}
                      onClick={() => triggerAcceptModal(selectedInquiry)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                    >
                      Accept &amp; Claim Inquiry
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XCircle}
                      disabled={isSubmittingAction}
                      onClick={() => triggerRejectModal(selectedInquiry)}
                      className="text-rose-300 border-rose-800 hover:bg-rose-950/40 text-xs"
                    >
                      Disqualify
                    </Button>
                  </>
                )}

                {selectedInquiry.status === 'Accepted' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={FileText}
                      disabled={isSubmittingAction}
                      onClick={() => handleOpenInQuoteBuilder(selectedInquiry)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs"
                    >
                      Generate Quotation
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Zap}
                      disabled={isSubmittingAction}
                      onClick={() => handleCreateQuoteOneClick(selectedInquiry)}
                      className="bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300 text-xs font-semibold"
                      title="Instant 1-Click Quote with Customer Tier Discount"
                    >
                      Instant 1-Click Quote
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Phone}
                      disabled={isSubmittingAction}
                      onClick={() => triggerContactModal(selectedInquiry)}
                      className="text-xs font-semibold"
                    >
                      Log Customer Contact
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={ShieldCheck}
                      disabled={isSubmittingAction}
                      onClick={() => triggerQualifyModal(selectedInquiry)}
                      className="text-xs font-semibold"
                    >
                      Qualify Directly
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      icon={XCircle}
                      disabled={isSubmittingAction}
                      onClick={() => triggerRejectModal(selectedInquiry)}
                      className="text-rose-300 border-rose-800 hover:bg-rose-950/40 text-xs"
                    >
                      Disqualify
                    </Button>
                  </>
                )}

                {selectedInquiry.status === 'Contacted' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={FileText}
                      disabled={isSubmittingAction}
                      onClick={() => handleOpenInQuoteBuilder(selectedInquiry)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs"
                    >
                      Generate Quotation
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={ShieldCheck}
                      disabled={isSubmittingAction}
                      onClick={() => triggerQualifyModal(selectedInquiry)}
                      className="text-xs font-semibold"
                    >
                      Qualify Requirements
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Phone}
                      disabled={isSubmittingAction}
                      onClick={() => triggerContactModal(selectedInquiry)}
                      className="text-xs font-semibold"
                    >
                      Log Another Contact
                    </Button>
                  </>
                )}

                {selectedInquiry.status === 'Qualified' && !selectedInquiry.quotationId && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={FileText}
                      disabled={isSubmittingAction}
                      onClick={() => handleOpenInQuoteBuilder(selectedInquiry)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-xs"
                    >
                      Generate Quotation
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Zap}
                      disabled={isSubmittingAction}
                      onClick={() => handleCreateQuoteOneClick(selectedInquiry)}
                      className="text-xs font-semibold"
                    >
                      {isSubmittingAction ? 'Generating...' : '1-Click Instant Quote'}
                    </Button>
                  </>
                )}

                {selectedInquiry.quotationId && (
                  <div className="flex items-center justify-between w-full">
                    <div className="text-xs text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Commercial Quotation #{selectedInquiry.quotationNumber || selectedInquiry.quotationId} active</span>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      icon={ArrowUpRight}
                      onClick={() => {
                        setIsDrawerOpen(false);
                        navigate(`/workspace/quotations/${selectedInquiry.quotationId}`);
                      }}
                      className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
                    >
                      Open Quotation Workspace
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* MODAL 1: ACCEPT INQUIRY */}
      <Modal
        isOpen={activeModal === 'accept'}
        onClose={() => setActiveModal(null)}
        title="Accept & Claim Sales Inquiry"
        description="Claim this customer inquiry into your active pipeline to initiate engagement."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmittingAction}
              onClick={handleAcceptSubmit}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
            >
              {isSubmittingAction ? 'Claiming...' : 'Confirm Acceptance'}
            </Button>
          </>
        }
      >
        {selectedInquiry && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900">
              <strong className="block font-semibold">Inquiry #{selectedInquiry.requestNumber}</strong>
              <span>
                {selectedInquiry.customerName} • {selectedInquiry.productName} ({selectedInquiry.requestedQuantity} Units)
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Optional Rep Acceptance Note
              </label>
              <Textarea
                rows={3}
                value={acceptNotes}
                onChange={(e) => setAcceptNotes(e.target.value)}
                placeholder="E.g., Reviewing client's infrastructure needs. Scheduled preliminary reach out for tomorrow morning."
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 2: CONTACT CUSTOMER */}
      <Modal
        isOpen={activeModal === 'contact'}
        onClose={() => setActiveModal(null)}
        title="Record Customer Interaction"
        description="Log outreach details, discussion notes, and conversation outcomes."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmittingAction}
              onClick={handleContactSubmit}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold"
            >
              {isSubmittingAction ? 'Saving...' : 'Save Interaction Log'}
            </Button>
          </>
        }
      >
        {selectedInquiry && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Contact Channel
                </label>
                <Select
                  value={contactMethod}
                  onChange={(e) => setContactMethod(e.target.value)}
                  options={[
                    { value: 'Phone', label: 'Phone Call' },
                    { value: 'Email', label: 'Direct Email' },
                    { value: 'VideoCall', label: 'Video Conference (Teams/Meet)' },
                    { value: 'InPerson', label: 'On-site Meeting' },
                  ]}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Interaction Outcome
                </label>
                <Select
                  value={contactOutcome}
                  onChange={(e) => setContactOutcome(e.target.value)}
                  options={[
                    { value: 'Requirements Discussed', label: 'Requirements Discussed' },
                    { value: 'Technical Demo Scheduled', label: 'Technical Demo Scheduled' },
                    { value: 'Quotation Requested', label: 'Quotation Requested' },
                    { value: 'Follow-up Required', label: 'Follow-up Required' },
                    { value: 'Unreachable / Left Voicemail', label: 'Unreachable / Left Voicemail' },
                  ]}
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Meeting &amp; Discussion Notes <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={4}
                value={contactNotes}
                onChange={(e) => setContactNotes(e.target.value)}
                placeholder="Detail key customer requirements, budget constraints, expected timeline, delivery address..."
                required
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 3: QUALIFY INQUIRY */}
      <Modal
        isOpen={activeModal === 'qualify'}
        onClose={() => setActiveModal(null)}
        title="Qualify Enterprise Opportunity"
        description="Verify project budget, decision timeline, and product alignment before issuing commercial pricing."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isSubmittingAction}
              onClick={handleQualifySubmit}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
            >
              {isSubmittingAction ? 'Qualifying...' : 'Confirm Qualification'}
            </Button>
          </>
        }
      >
        {selectedInquiry && (
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-indigo-950">
              <strong className="block font-semibold">Qualification Target</strong>
              <span>
                {selectedInquiry.customerName} • Est. Value: ₹{((selectedInquiry.basePrice || 0) * (selectedInquiry.requestedQuantity || 1))?.toLocaleString('en-IN')}
              </span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Qualification Assessment &amp; Commercial Scope <span className="text-rose-500">*</span>
              </label>
              <Textarea
                rows={4}
                value={qualifyNotes}
                onChange={(e) => setQualifyNotes(e.target.value)}
                placeholder="Confirm BANT criteria: Budget confirmed, Authority verified, Need validated, Timeline established..."
                required
              />
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL 4: DISQUALIFY / REJECT */}
      <Modal
        isOpen={activeModal === 'reject'}
        onClose={() => setActiveModal(null)}
        title="Disqualify Sales Inquiry"
        description="Record disqualification rationale to maintain clean sales pipeline metrics."
        size="md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setActiveModal(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={isSubmittingAction}
              onClick={handleRejectSubmit}
              className="font-bold"
            >
              {isSubmittingAction ? 'Disqualifying...' : 'Confirm Disqualification'}
            </Button>
          </>
        }
      >
        {selectedInquiry && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Disqualification Reason <span className="text-rose-500">*</span>
              </label>
              <Select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                options={[
                  { value: 'Budget mismatch', label: 'Budget mismatch / Insufficient funding' },
                  { value: 'Product technical out of scope', label: 'Product technical out of scope' },
                  { value: 'Competitor vendor chosen', label: 'Competitor vendor chosen' },
                  { value: 'Customer project cancelled/postponed', label: 'Customer project cancelled/postponed' },
                  { value: 'Unresponsive after multiple contact attempts', label: 'Unresponsive after multiple attempts' },
                  { value: 'Duplicate or inadvertent inquiry', label: 'Duplicate or inadvertent inquiry' },
                ]}
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Additional Comments &amp; Context
              </label>
              <Textarea
                rows={3}
                value={rejectionCustomNotes}
                onChange={(e) => setRejectionCustomNotes(e.target.value)}
                placeholder="Optional notes explaining customer feedback or future re-engagement date..."
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SalesConnectionsPage;
