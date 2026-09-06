import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { customerApi, salesConnectionApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  StatusBadge,
  Badge,
  DataTable,
  LoadingSpinner,
  ErrorAlert,
  Drawer,
  SkeletonPortal,
  Modal,
  Input,
  Textarea,
  Select,
} from '../components/ui';
import { CustomerProposalView } from '../components/portal/CustomerProposalView';
import { ConnectSalesSection } from '../components/portal/ConnectSalesSection';
import {
  FileText,
  Package,
  CreditCard,
  LogOut,
  Zap,
  ShieldCheck,
  AlertCircle,
  Clock,
  Eye,
  Building,
  RefreshCw,
  UserCheck,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Truck,
  Layers,
  Sparkles,
  Printer,
  DollarSign,
  Wallet,
  QrCode,
  Shield,
  ArrowRight,
  Send,
  HelpCircle,
  Check,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const CustomerAccountPage = () => {
  const { user, isCustomer, logout } = useAuth();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const { id: routeQuoteId } = useParams();

  const tabFromQuery = searchParams.get('tab');
  const validTabs = ['quotes', 'connect', 'inquiries', 'orders', 'invoices', 'profile'];
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(tabFromQuery) ? tabFromQuery : 'quotes'
  ); // quotes, connect, inquiries, orders, invoices, profile

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t && validTabs.includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Quote Drawer for full proposal inspection & confirmation
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Selected Order Drawer
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isOrderDrawerOpen, setIsOrderDrawerOpen] = useState(false);

  // Selected Invoice Drawer
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceDrawerOpen, setIsInvoiceDrawerOpen] = useState(false);

  // Selected Inquiry Drawer
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [isInquiryDrawerOpen, setIsInquiryDrawerOpen] = useState(false);

  // Invoice Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingInvoice, setPayingInvoice] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CreditCard');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const loadCustomerData = useCallback(async () => {
    if (!isCustomer) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [qRes, oRes, iRes, inqRes, pRes] = await Promise.all([
        customerApi.getMyQuotations(),
        customerApi.getMyOrders(),
        customerApi.getMyInvoices(),
        salesConnectionApi.getMyRequests(),
        customerApi.getMyProfile(),
      ]);

      const loadedQuotes = Array.isArray(qRes) ? qRes : qRes?.value || [];
      const loadedInvoices = Array.isArray(iRes) ? iRes : iRes?.value || [];
      setQuotes(loadedQuotes);
      setOrders(Array.isArray(oRes) ? oRes : oRes?.value || []);
      setInvoices(loadedInvoices);
      setInquiries(Array.isArray(inqRes) ? inqRes : inqRes?.value || []);
      if (pRes) setProfile(pRes);

      // If quote drawer is open, keep selected quote updated
      if (selectedQuote) {
        const updated = loadedQuotes.find((q) => q.id === selectedQuote.id);
        if (updated) setSelectedQuote(updated);
      }

      // If invoice drawer is open, keep selected invoice updated
      if (selectedInvoice) {
        const updatedInv = loadedInvoices.find((i) => i.id === selectedInvoice.id);
        if (updatedInv) setSelectedInvoice(updatedInv);
      }
    } catch (err) {
      setError(err.message || 'Failed to load customer account records.');
    } finally {
      setIsLoading(false);
    }
  }, [isCustomer, selectedQuote, selectedInvoice]);

  useEffect(() => {
    let isCancelled = false;
    if (!isCustomer) {
      setIsLoading(false);
      return;
    }

    loadCustomerData();

    return () => {
      isCancelled = true;
    };
  }, [isCustomer, user?.id, loadCustomerData]);

  // Deep-linking: auto-open proposal if query param or route param is present
  useEffect(() => {
    const targetId = searchParams.get('quoteId') || routeQuoteId;
    if (targetId && quotes.length > 0) {
      const target = quotes.find((q) => String(q.id) === String(targetId));
      if (target) {
        setSelectedQuote(target);
        setIsDrawerOpen(true);
      }
    }
  }, [searchParams, routeQuoteId, quotes]);

  const handleOpenProposal = (quote) => {
    setSelectedQuote(quote);
    setIsDrawerOpen(true);
  };

  const handleOpenOrder = async (order) => {
    try {
      const detailed = await customerApi.getMyOrderById(order.id);
      setSelectedOrder(detailed);
      setIsOrderDrawerOpen(true);
    } catch (err) {
      toast.error('Failed to load order', err.message);
    }
  };

  const handleOpenInvoice = async (invoice) => {
    try {
      const detailed = await customerApi.getMyInvoiceById(invoice.id);
      setSelectedInvoice(detailed);
      setIsInvoiceDrawerOpen(true);
    } catch (err) {
      toast.error('Failed to load invoice', err.message);
    }
  };

  const handleOpenInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsInquiryDrawerOpen(true);
  };

  const handleOpenPaymentModal = (invoice) => {
    setPayingInvoice(invoice);
    setPaymentAmount(invoice.outstanding || invoice.total || '');
    setPaymentMethod('CreditCard');
    setPaymentRef(`PAY-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    if (!payingInvoice) return;

    const numAmount = parseFloat(paymentAmount);
    if (!numAmount || numAmount <= 0) {
      toast.error('Invalid Amount', 'Please enter a valid payment amount.');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await customerApi.payInvoice(payingInvoice.id, {
        amount: numAmount,
        paymentMethod,
        reference: paymentRef || `PAY-${Date.now()}`,
        notes: paymentNotes || `Customer Portal ${paymentMethod} Settlement`,
      });

      toast.success(
        'Payment Processed Successfully',
        `Payment of ${formatCurrency(numAmount, profile?.currencyCode || 'INR')} recorded for invoice ${payingInvoice.invoiceNumber}. Ref: ${res.reference || paymentRef}`
      );

      setIsPaymentModalOpen(false);
      setPayingInvoice(null);
      await loadCustomerData();

      // If invoice drawer is currently open, refresh detailed invoice
      if (selectedInvoice && selectedInvoice.id === payingInvoice.id) {
        const refreshedInv = await customerApi.getMyInvoiceById(payingInvoice.id);
        setSelectedInvoice(refreshedInv);
      }
    } catch (err) {
      toast.error('Payment Processing Failed', err.response?.data?.message || err.message || 'Unable to process transaction.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleConfirmQuotation = async (quotationId) => {
    try {
      const confirmed = await customerApi.confirmMyQuotation(quotationId);
      toast.success(
        'Proposal Formally Confirmed',
        `Quotation ${confirmed.quotationNumber} has been confirmed. Sales operations notified!`
      );
      await loadCustomerData();
      setSelectedQuote(confirmed);
    } catch (err) {
      toast.error('Confirmation Failed', err.message || 'Could not confirm quotation.');
      throw err;
    }
  };

  // KPI Computations
  const pendingQuotes = quotes.filter(
    (q) =>
      q.status === 'Sent' ||
      q.status === 'Draft' ||
      q.status === 'Approved' ||
      q.status === 'UnderNegotiation'
  );
  const pendingQuotesTotal = pendingQuotes.reduce(
    (acc, q) => acc + (q.grandTotal || 0),
    0
  );

  const outstandingInvoices = invoices.filter((i) => i.outstanding > 0);
  const totalOutstanding = outstandingInvoices.reduce(
    (acc, i) => acc + (i.outstanding || 0),
    0
  );

  const formatMoney = (amount, currency = 'INR') => formatCurrency(amount, currency);

  if (isLoading && quotes.length === 0) {
    return <SkeletonPortal />;
  }

  const quoteCols = [
    {
      header: 'Proposal #',
      accessor: 'quotationNumber',
      render: (q) => (
        <button
          type="button"
          onClick={() => handleOpenProposal(q)}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer"
        >
          {q.quotationNumber}
        </button>
      ),
    },
    {
      header: 'Deliverables',
      accessor: 'lines',
      render: (q) => {
        const count = q.lines?.length || 0;
        const recurringCount = (q.lines || []).filter(
          (l) =>
            l.isRecurring ||
            l.billingFrequency ||
            (l.productName || '').toLowerCase().includes('saas') ||
            (l.productName || '').toLowerCase().includes('subscription')
        ).length;

        return (
          <span className="text-slate-600 text-xs">
            {count} Item{count !== 1 ? 's' : ''}
            {recurringCount > 0 && (
              <span className="text-purple-600 font-medium ml-1">
                ({recurringCount} Recurring)
              </span>
            )}
          </span>
        );
      },
    },
    {
      header: 'Total Value',
      accessor: 'grandTotal',
      render: (q) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatMoney(q.grandTotal)}
        </span>
      ),
    },
    {
      header: 'Validity / Close',
      accessor: 'expectedCloseDate',
      render: (q) => (
        <span className="text-slate-500 text-xs flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-400" />
          {q.expectedCloseDate
            ? new Date(q.expectedCloseDate).toLocaleDateString()
            : '30 Days'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (q) => (
        <Button
          variant="outline"
          size="xs"
          icon={Eye}
          onClick={() => handleOpenProposal(q)}
        >
          Inspect &amp; Confirm
        </Button>
      ),
    },
  ];

  const orderCols = [
    {
      header: 'Order #',
      accessor: 'orderNumber',
      render: (o) => (
        <button
          type="button"
          onClick={() => handleOpenOrder(o)}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer"
        >
          {o.orderNumber}
        </button>
      ),
    },
    {
      header: 'Order Date',
      accessor: 'createdAtUtc',
      render: (o) => (
        <span className="text-slate-500 text-xs">
          {o.createdAtUtc ? new Date(o.createdAtUtc).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Confirmed Total',
      accessor: 'total',
      render: (o) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatMoney(o.total)}
        </span>
      ),
    },
    {
      header: 'Fulfillment Status',
      accessor: 'status',
      render: (o) => (
        <StatusBadge type="order" status={o.status || 'Confirmed'} />
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (o) => (
        <Button
          variant="outline"
          size="xs"
          icon={Truck}
          onClick={() => handleOpenOrder(o)}
        >
          Order &amp; Fulfillment
        </Button>
      ),
    },
  ];

  const invoiceCols = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (i) => (
        <button
          type="button"
          onClick={() => handleOpenInvoice(i)}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer"
        >
          {i.invoiceNumber}
        </button>
      ),
    },
    {
      header: 'Billing Type',
      accessor: 'type',
      render: (i) => (
        <Badge variant={i.type === 'Recurring' ? 'purple' : 'blue'} size="sm">
          {i.type === 'Recurring' ? 'Recurring SaaS' : 'One-Time'}
        </Badge>
      ),
    },
    {
      header: 'Due Date',
      accessor: 'dueDate',
      render: (i) => (
        <span className="text-slate-500 text-xs">
          {i.dueDate ? new Date(i.dueDate).toLocaleDateString() : 'Net-30'}
        </span>
      ),
    },
    {
      header: 'Total Invoiced',
      accessor: 'total',
      render: (i) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatMoney(i.total)}
        </span>
      ),
    },
    {
      header: 'Balance Due',
      accessor: 'outstanding',
      render: (i) => (
        <span
          className={`font-mono font-bold ${
            (i.outstanding || 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
          }`}
        >
          {formatMoney(i.outstanding)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (i) => <StatusBadge type="invoice" status={i.status} />,
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (i) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            icon={Eye}
            onClick={() => handleOpenInvoice(i)}
          >
            Breakdown
          </Button>
          {(i.outstanding || 0) > 0 && (
            <Button
              variant="success"
              size="xs"
              icon={CreditCard}
              onClick={() => handleOpenPaymentModal(i)}
            >
              Pay
            </Button>
          )}
        </div>
      ),
    },
  ];

  const inquiryCols = [
    {
      header: 'Tracking #',
      accessor: 'requestNumber',
      render: (r) => (
        <button
          type="button"
          onClick={() => handleOpenInquiry(r)}
          className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline text-left cursor-pointer"
        >
          {r.requestNumber}
        </button>
      ),
    },
    {
      header: 'Product & Brand',
      accessor: 'productName',
      render: (r) => (
        <div>
          <span className="font-semibold text-slate-900 block text-xs">{r.productName}</span>
          <span className="text-[10px] text-blue-600 font-medium">{r.companyName} • SKU: {r.productSku}</span>
        </div>
      ),
    },
    {
      header: 'Assigned Specialist',
      accessor: 'salesRepName',
      render: (r) => (
        <div>
          <span className="font-medium text-slate-800 text-xs block">{r.salesRepName}</span>
          <span className="text-[10px] text-slate-400 font-mono">{r.salesRepEmail}</span>
        </div>
      ),
    },
    {
      header: 'Qty',
      accessor: 'requestedQuantity',
      render: (r) => (
        <span className="font-mono font-bold text-slate-700 text-xs">
          {r.requestedQuantity}
        </span>
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
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.bg} ${s.text} ${s.border}`}>
            {r.status === 'QuoteCreated' ? 'Quotation Issued' : r.status}
          </span>
        );
      },
    },
    {
      header: 'Submitted',
      accessor: 'createdAtUtc',
      render: (r) => (
        <span className="text-slate-500 text-xs">
          {r.createdAtUtc ? new Date(r.createdAtUtc).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: 'id',
      render: (r) => (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="xs"
            icon={Eye}
            onClick={() => handleOpenInquiry(r)}
          >
            Details
          </Button>
          {r.quotationId && (
            <Button
              variant="primary"
              size="xs"
              icon={ArrowRight}
              onClick={() => {
                const targetQuote = quotes.find((q) => q.id === r.quotationId);
                if (targetQuote) {
                  handleOpenProposal(targetQuote);
                } else {
                  customerApi.getMyQuotationById(r.quotationId).then((q) => {
                    handleOpenProposal(q);
                  });
                }
              }}
              className="text-xs font-semibold"
            >
              View Quote #{r.quotationNumber || r.quotationId}
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50/75 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Executive Customer Hub Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-xs shadow-blue-500/20">
              <Zap className="w-5 h-5 fill-white text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-slate-900">
                  DealFlow<span className="text-blue-600">360</span>
                </span>
                <span className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Customer Executive Portal
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Building className="w-3 h-3 text-slate-400" />
                <span>Account: <strong>{user?.fullName || 'Client Partner'}</strong></span>
                <span className="text-slate-300">•</span>
                <span>{user?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Button
              variant="primary"
              size="xs"
              icon={Sparkles}
              onClick={() => setActiveTab('connect')}
              className="font-semibold flex items-center gap-1"
            >
              Request New Quotation
            </Button>
            <Button
              variant="outline"
              size="xs"
              icon={RefreshCw}
              isLoading={isLoading}
              onClick={loadCustomerData}
            >
              Sync
            </Button>
            <span className="text-xs text-slate-600 font-medium hidden lg:flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Verified Enterprise Account
            </span>
            <Button variant="outline" size="xs" icon={LogOut} onClick={logout}>
              Sign Out
            </Button>
          </div>
        </header>

        {error && <ErrorAlert message={error} onRetry={loadCustomerData} />}

        {/* Action-Required Banner if Pending Proposals */}
        {pendingQuotes.length > 0 && (
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-sm font-bold text-blue-950">
                  {pendingQuotes.length} Commercial Proposal{pendingQuotes.length !== 1 ? 's' : ''} Awaiting Your Review
                </h2>
                <p className="text-xs text-blue-700 mt-0.5">
                  Proposals worth {formatMoney(pendingQuotesTotal)} are ready for scope verification, line-item questions, or formal confirmation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="primary"
                size="xs"
                onClick={() => {
                  setActiveTab('quotes');
                  handleOpenProposal(pendingQuotes[0]);
                }}
              >
                Review Next Proposal
              </Button>
            </div>
          </div>
        )}

        {/* Executive KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Active Proposals
              </span>
              <FileText className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {quotes.length}
            </div>
            <p className="text-xs text-slate-500">
              {pendingQuotes.length} pending action • {formatMoney(pendingQuotesTotal)}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Confirmed Orders
              </span>
              <Package className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {orders.length}
            </div>
            <p className="text-xs text-slate-500">
              Active operational execution &amp; shipment
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Billing &amp; Invoices
              </span>
              <CreditCard className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-slate-900 tracking-tight">
              {formatMoney(totalOutstanding)}
            </div>
            <p className="text-xs text-slate-500">
              {outstandingInvoices.length} open invoice{outstandingInvoices.length !== 1 ? 's' : ''} across {invoices.length} total
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 gap-4 sm:gap-6 text-xs font-semibold overflow-x-auto touch-scroll pb-1">
          {[
            { id: 'quotes', label: `My Proposals (${quotes.length})`, icon: FileText },
            { id: 'connect', label: 'Connect to Sales', icon: Sparkles },
            { id: 'inquiries', label: `My Inquiries (${inquiries.length})`, icon: UserCheck },
            { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
            { id: 'invoices', label: `Invoices & Billing (${invoices.length})`, icon: CreditCard },
            { id: 'profile', label: 'Company Profile & Sales Rep', icon: Building },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 border-b-2 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content: Connect with Sales */}
        {activeTab === 'connect' && (
          <ConnectSalesSection
            profile={profile}
            onConnectionCreated={() => {
              loadCustomerData();
              setActiveTab('inquiries');
            }}
            onNavigateToInquiries={() => setActiveTab('inquiries')}
          />
        )}

        {/* Tab Content: My Inquiries */}
        {activeTab === 'inquiries' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Brand Representative Inquiries</h3>
                <p className="text-xs text-slate-500">Track status, assigned commercial specialists, and generated quotations</p>
              </div>
              <Button
                variant="primary"
                size="xs"
                icon={Sparkles}
                onClick={() => setActiveTab('connect')}
                className="font-semibold"
              >
                Request New Product Inquiries
              </Button>
            </div>
            <DataTable
              columns={inquiryCols}
              data={inquiries}
              emptyMessage="No sales inquiries on file"
              emptyDescription="Connect directly with certified brand representatives to configure equipment and receive formal quotations."
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => setActiveTab('connect')}
                  className="font-semibold"
                >
                  Connect to Sales
                </Button>
              }
            />
          </div>
        )}

        {/* Tab Content 1: Proposals */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            {/* Contracted Tier Advantage Highlight Bar */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-400/30">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {profile?.tierName || 'Standard Tier'} Account Advantage
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ≤ {profile?.tierMaxDiscount || 5}% Pre-Approved Limit
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Your organization is pre-approved for immediate commercial quote validation without multi-tier managerial escalation.
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                size="xs"
                icon={Sparkles}
                onClick={() => setActiveTab('connect')}
                className="shrink-0"
              >
                Request New Quote
              </Button>
            </div>

            <DataTable
              columns={quoteCols}
              data={quotes}
              emptyMessage="No commercial proposals on file"
              emptyDescription="Connect directly with our sales team to request a customized commercial proposal."
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => setActiveTab('connect')}
                  className="font-semibold"
                >
                  Connect to Sales
                </Button>
              }
            />
          </div>
        )}

        {/* Tab Content 2: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Confirmed Orders &amp; Fulfillment</h3>
                <p className="text-xs text-slate-500">Track shipments, warehouse allocations, and operational deliveries</p>
              </div>
              <Button
                variant="primary"
                size="xs"
                icon={Sparkles}
                onClick={() => setActiveTab('connect')}
                className="font-semibold"
              >
                Place New Inquiries
              </Button>
            </div>
            <DataTable
              columns={orderCols}
              data={orders}
              emptyMessage="No confirmed orders yet"
              emptyDescription="Confirmed proposals will transition here into active fulfillment orders."
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => setActiveTab('connect')}
                  className="font-semibold"
                >
                  Connect to Sales
                </Button>
              }
            />
          </div>
        )}

        {/* Tab Content 3: Invoices */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Commercial Invoices &amp; Statements</h3>
                <p className="text-xs text-slate-500">Review billed invoices, payment receipts, and settle outstanding balances online</p>
              </div>
              {outstandingInvoices.length > 0 && (
                <Button
                  variant="success"
                  size="xs"
                  icon={CreditCard}
                  onClick={() => handleOpenPaymentModal(outstandingInvoices[0])}
                  className="font-semibold"
                >
                  Pay Outstanding ({formatMoney(totalOutstanding)})
                </Button>
              )}
            </div>
            <DataTable
              columns={invoiceCols}
              data={invoices}
              emptyMessage="No invoices on file"
              emptyDescription="Issued statements and billing schedules will appear here."
              emptyAction={
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => setActiveTab('connect')}
                  className="font-semibold"
                >
                  Connect to Sales
                </Button>
              }
            />
          </div>
        )}

        {/* Tab Content 4: Company Profile & Sales Rep */}
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Company Organization Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <Building className="w-5 h-5 text-blue-600" />
                  <h3 className="text-sm font-bold text-slate-900">Commercial Account Profile</h3>
                </div>
                <Badge variant="blue" size="sm">
                  {profile?.tierName || 'Standard Tier'}
                </Badge>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Enterprise Name:</span>
                  <span className="font-bold text-slate-800">{profile?.name || user?.fullName}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Primary Billing Email:</span>
                  <span className="font-mono text-slate-800">{profile?.email || user?.email}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Contact Phone:</span>
                  <span className="font-mono text-slate-800">{profile?.phone || 'On file with Sales Ops'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Pre-Approved Discount Ceiling:</span>
                  <span className="font-mono font-bold text-emerald-600">≤ {profile?.tierMaxDiscount || 5}% Pre-Approved</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-50">
                  <span className="text-slate-500 font-medium">Account Currency:</span>
                  <span className="font-mono font-bold text-slate-800">{profile?.currencyCode || 'INR'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-slate-500 font-medium">Customer Since:</span>
                  <span className="text-slate-800">
                    {profile?.createdAtUtc ? new Date(profile.createdAtUtc).toLocaleDateString() : 'Active Partner'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Sales Representative Card */}
            <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-900">Dedicated Account Executive</h3>
                </div>
                <Badge variant="indigo" size="sm">
                  Commercial Support
                </Badge>
              </div>

              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex items-start gap-3.5">
                <div className="w-11 h-11 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs shadow-indigo-500/20">
                  {profile?.assignedSalesRepName ? profile.assignedSalesRepName.substring(0, 2).toUpperCase() : 'DF'}
                </div>
                <div className="space-y-1 text-xs">
                  <h4 className="font-bold text-slate-900">
                    {profile?.assignedSalesRepName || 'DealFlow Account Team'}
                  </h4>
                  <p className="text-slate-500">Commercial Account Executive</p>
                  <p className="text-indigo-700 font-mono text-[11px] flex items-center gap-1 mt-1">
                    <Mail className="w-3.5 h-3.5" />
                    {profile?.assignedSalesRepEmail || 'sales@dealflow360.com'}
                  </p>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={Sparkles}
                  onClick={() => setActiveTab('connect')}
                  className="w-full font-semibold justify-center"
                >
                  Connect to Sales Specialist
                </Button>
                <a
                  href={`mailto:${profile?.assignedSalesRepEmail || 'sales@dealflow360.com'}?subject=Inquiry%20regarding%20account%20${encodeURIComponent(profile?.name || '')}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact Account Executive via Email
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Drawer 1: Detailed Interactive Customer Proposal View */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={`Quotation ${selectedQuote?.quotationNumber || ''}`}
        subtitle={`Prepared for ${selectedQuote?.customerName || user?.fullName}`}
        width="xl"
      >
        {selectedQuote && (
          <CustomerProposalView
            quote={selectedQuote}
            onRefresh={loadCustomerData}
            onConfirmOverride={handleConfirmQuotation}
            onConnectSales={() => {
              setIsDrawerOpen(false);
              setActiveTab('connect');
            }}
            isEmbedded
          />
        )}
      </Drawer>

      {/* Drawer 2: Detailed Order & Fulfillment View */}
      <Drawer
        isOpen={isOrderDrawerOpen}
        onClose={() => setIsOrderDrawerOpen(false)}
        title={`Order ${selectedOrder?.orderNumber || ''}`}
        subtitle="Operational Fulfillment & Logistics Progress"
        width="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Order Status:</span>
                <StatusBadge type="order" status={selectedOrder.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Originating Quotation:</span>
                <button
                  type="button"
                  onClick={() => {
                    setIsOrderDrawerOpen(false);
                    const matchedQuote = quotes.find((q) => q.id === selectedOrder.quotationId);
                    if (matchedQuote) {
                      handleOpenProposal(matchedQuote);
                    }
                  }}
                  className="font-mono font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  #{selectedOrder.quotationNumber}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Order Placed:</span>
                <span className="text-slate-800">
                  {new Date(selectedOrder.createdAtUtc).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Assigned Carrier &amp; Logistics:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  DealFlow Express Logistics (Carrier Ref: DF-TRK-{selectedOrder.id}892)
                </span>
              </div>
            </div>

            {/* Fulfillment Status Progress Stepper */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 block">
                Fulfillment Milestone Tracker
              </span>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px]">
                <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                  Confirmed
                </div>
                <div className={`p-2 rounded-lg border ${['Processing', 'Shipped', 'Delivered'].includes(selectedOrder.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
                  Processing
                </div>
                <div className={`p-2 rounded-lg border ${['Shipped', 'Delivered'].includes(selectedOrder.status) ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <Truck className="w-4 h-4 mx-auto mb-1" />
                  Dispatched
                </div>
                <div className={`p-2 rounded-lg border ${selectedOrder.status === 'Delivered' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-bold' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  <CheckCircle2 className="w-4 h-4 mx-auto mb-1" />
                  Delivered
                </div>
              </div>
            </div>

            {/* Order Items Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Ordered Deliverables ({selectedOrder.lines?.length || 0})
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Net Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedOrder.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-slate-800 block">{line.productName}</span>
                          <span className="font-mono text-[10px] text-slate-400">{line.sku}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono">{line.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatMoney(line.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatMoney(line.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex justify-between items-center text-sm font-bold text-slate-900">
              <span>Total Order Value:</span>
              <span className="font-mono text-base text-blue-600">{formatMoney(selectedOrder.total)}</span>
            </div>
          </div>
        )}
      </Drawer>

      {/* Drawer 3: Detailed Invoice & Billing Statement View */}
      <Drawer
        isOpen={isInvoiceDrawerOpen}
        onClose={() => setIsInvoiceDrawerOpen(false)}
        title={`Invoice ${selectedInvoice?.invoiceNumber || ''}`}
        subtitle="Commercial Statement & Payment Breakdown"
        width="lg"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Invoice Status:</span>
                <StatusBadge type="invoice" status={selectedInvoice.status} />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Billing Category:</span>
                <Badge variant={selectedInvoice.type === 'Recurring' ? 'purple' : 'blue'} size="sm">
                  {selectedInvoice.type === 'Recurring' ? 'Recurring SaaS Schedule' : 'One-Time Deliverables'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Due Date:</span>
                <span className="font-medium text-slate-800">
                  {selectedInvoice.dueDate ? new Date(selectedInvoice.dueDate).toLocaleDateString() : 'Net-30'}
                </span>
              </div>
            </div>

            {/* Line Items Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                Invoiced Items &amp; Services
              </span>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase text-[10px]">
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {selectedInvoice.lines?.map((line) => (
                      <tr key={line.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{line.description}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{line.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-mono">{formatMoney(line.unitPrice)}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatMoney(line.netAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Reconciliation */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-mono text-slate-900">{formatMoney(selectedInvoice.subTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax Total (18%):</span>
                <span className="font-mono text-slate-900">{formatMoney(selectedInvoice.taxTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200">
                <span>Total Invoiced:</span>
                <span className="font-mono">{formatMoney(selectedInvoice.total)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Paid to Date:</span>
                <span className="font-mono">-{formatMoney(selectedInvoice.paidAmount)}</span>
              </div>
              <div className="flex justify-between text-base font-black pt-2 border-t border-slate-200">
                <span>Outstanding Balance:</span>
                <span className={`font-mono ${selectedInvoice.outstanding > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {formatMoney(selectedInvoice.outstanding)}
                </span>
              </div>
            </div>

            {/* Invoice Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={Printer}
                onClick={() => window.print()}
              >
                Print Statement / PDF
              </Button>

              {selectedInvoice.outstanding > 0 && (
                <Button
                  variant="success"
                  size="sm"
                  icon={CreditCard}
                  onClick={() => handleOpenPaymentModal(selectedInvoice)}
                  className="font-bold"
                >
                  Pay Outstanding Balance ({formatMoney(selectedInvoice.outstanding)})
                </Button>
              )}
            </div>

            {/* Payments History */}
            {selectedInvoice.payments?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Payment Receipts ({selectedInvoice.payments.length})
                </span>
                <div className="space-y-2">
                  {selectedInvoice.payments.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-emerald-950 block">{p.paymentMethod || 'Wire / Bank Transfer'}</span>
                        <span className="text-[11px] text-emerald-700 font-mono">Ref: {p.reference || 'N/A'} • {new Date(p.paidAtUtc).toLocaleDateString()}</span>
                      </div>
                      <span className="font-mono font-bold text-emerald-800 text-sm">
                        {formatMoney(p.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Credit Notes */}
            {selectedInvoice.creditNotes?.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                  Applied Credit Notes ({selectedInvoice.creditNotes.length})
                </span>
                <div className="space-y-2">
                  {selectedInvoice.creditNotes.map((c) => (
                    <div key={c.id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-amber-950 block">{c.creditNoteNumber}</span>
                        <span className="text-[11px] text-amber-700">Reason: {c.reason}</span>
                      </div>
                      <span className="font-mono font-bold text-amber-800 text-sm">
                        -{formatMoney(c.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Drawer 4: Detailed Inquiry & Specialist Tracking View */}
      <Drawer
        isOpen={isInquiryDrawerOpen}
        onClose={() => setIsInquiryDrawerOpen(false)}
        title={`Sales Inquiry ${selectedInquiry?.requestNumber || ''}`}
        subtitle="Commercial Engagement & Specialist Coordination"
        width="lg"
      >
        {selectedInquiry && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Inquiry Status:</span>
                <Badge variant={selectedInquiry.status === 'QuoteCreated' ? 'emerald' : 'blue'}>
                  {selectedInquiry.status === 'QuoteCreated' ? 'Quotation Issued' : selectedInquiry.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Submitted On:</span>
                <span className="text-slate-800 font-medium">
                  {new Date(selectedInquiry.createdAtUtc).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Preferred Contact Channel:</span>
                <span className="text-slate-800 font-semibold">{selectedInquiry.preferredContactMethod || 'Email'}</span>
              </div>
            </div>

            {/* Assigned Commercial Specialist */}
            <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-950 block">
                Assigned Brand Specialist
              </span>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                  {selectedInquiry.salesRepName ? selectedInquiry.salesRepName.substring(0, 2).toUpperCase() : 'SR'}
                </div>
                <div className="space-y-0.5 text-xs">
                  <h4 className="font-bold text-slate-900">{selectedInquiry.salesRepName}</h4>
                  <p className="text-indigo-700 font-mono text-[11px] flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {selectedInquiry.salesRepEmail}
                  </p>
                </div>
              </div>
            </div>

            {/* Requested Deliverable Details */}
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 block">
                Requested Configuration
              </span>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Product:</span>
                <span className="font-bold text-slate-900">{selectedInquiry.productName}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">Vendor Brand:</span>
                <span className="text-blue-600 font-semibold">{selectedInquiry.companyName}</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-slate-100">
                <span className="text-slate-500">SKU Code:</span>
                <span className="font-mono text-slate-700">{selectedInquiry.productSku}</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-500">Requested Volume:</span>
                <span className="font-mono font-bold text-slate-900">{selectedInquiry.requestedQuantity} Units</span>
              </div>
            </div>

            {/* Customer Message & Rep Notes */}
            {selectedInquiry.customerMessage && (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500 font-medium">Your Commercial Inquiries / Remarks:</span>
                <p className="text-slate-800 italic">{selectedInquiry.customerMessage}</p>
              </div>
            )}

            {selectedInquiry.repNotes && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-1">
                <span className="text-blue-900 font-bold">Specialist Feedback / Coordination Notes:</span>
                <p className="text-blue-800">{selectedInquiry.repNotes}</p>
              </div>
            )}

            {/* Direct Quotation Link Action */}
            {selectedInquiry.quotationId && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-emerald-950 font-medium">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>Custom commercial proposal #{selectedInquiry.quotationNumber || selectedInquiry.quotationId} generated!</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => {
                    setIsInquiryDrawerOpen(false);
                    const targetQuote = quotes.find((q) => q.id === selectedInquiry.quotationId);
                    if (targetQuote) {
                      handleOpenProposal(targetQuote);
                    } else {
                      customerApi.getMyQuotationById(selectedInquiry.quotationId).then((q) => {
                        handleOpenProposal(q);
                      });
                    }
                  }}
                  className="shrink-0 font-bold"
                >
                  Open Proposal Workspace
                </Button>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* MODAL: Customer Online Invoice Settlement Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Settle Invoice Online"
        description={`Make a digital payment against invoice ${payingInvoice?.invoiceNumber || ''}`}
      >
        <form onSubmit={handleSubmitPayment} className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Invoice Ref:</span>
              <span className="font-mono font-bold text-slate-900">{payingInvoice?.invoiceNumber}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Total Invoiced:</span>
              <span className="font-mono text-slate-900">{formatMoney(payingInvoice?.total || 0)}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-bold pt-1.5 border-t border-slate-200">
              <span>Outstanding Balance Due:</span>
              <span className="font-mono text-rose-600 text-sm">
                {formatMoney(payingInvoice?.outstanding ?? payingInvoice?.total ?? 0)}
              </span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Payment Gateway / Method
            </label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { id: 'CreditCard', label: 'Corporate Card / Credit', icon: CreditCard },
                { id: 'NetBanking', label: 'Net Banking / ACH', icon: Wallet },
                { id: 'UPI', label: 'Instant UPI / QR', icon: QrCode },
                { id: 'WireTransfer', label: 'Bank Wire / RTGS', icon: Building },
              ].map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20 shadow-xs font-semibold'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="truncate text-xs">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Payment Amount ({profile?.currencyCode || 'INR'})
              </label>
              <button
                type="button"
                onClick={() => setPaymentAmount(payingInvoice?.outstanding ?? payingInvoice?.total ?? '')}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Pay Full Balance
              </button>
            </div>
            <Input
              type="number"
              min="1"
              max={payingInvoice?.outstanding || payingInvoice?.total || 9999999}
              step="0.01"
              required
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
            />
          </div>

          {/* Reference and Notes */}
          <Input
            label="Transaction / Authorization Reference"
            required
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
            helperText="Gateway verification code or bank wire reference"
          />

          <Textarea
            label="Payment Remarks / Notes (Optional)"
            placeholder="e.g. Q3 Commercial Software License Settlement"
            value={paymentNotes}
            onChange={(e) => setPaymentNotes(e.target.value)}
            rows={2}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsPaymentModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="success"
              size="sm"
              isLoading={isSubmittingPayment}
              icon={Check}
              className="font-bold"
            >
              Confirm &amp; Settle ({formatMoney(parseFloat(paymentAmount) || 0)})
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerAccountPage;
