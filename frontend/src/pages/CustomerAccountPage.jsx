import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  StatusBadge,
  DataTable,
  LoadingSpinner,
  ErrorAlert,
  Drawer,
} from '../components/ui';
import { CustomerProposalView } from '../components/portal/CustomerProposalView';
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
} from 'lucide-react';

export const CustomerAccountPage = () => {
  const { user, logout } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('quotes'); // quotes, orders, invoices
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected Quote Drawer for full proposal inspection & confirmation
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [qRes, oRes, iRes] = await Promise.all([
        customerApi.getMyQuotations(),
        customerApi.getMyOrders(),
        customerApi.getMyInvoices(),
      ]);

      const loadedQuotes = Array.isArray(qRes) ? qRes : qRes?.value || [];
      setQuotes(loadedQuotes);
      setOrders(Array.isArray(oRes) ? oRes : oRes?.value || []);
      setInvoices(Array.isArray(iRes) ? iRes : iRes?.value || []);

      // If drawer is open, keep selected quote updated
      if (selectedQuote) {
        const updated = loadedQuotes.find((q) => q.id === selectedQuote.id);
        if (updated) setSelectedQuote(updated);
      }
    } catch (err) {
      setError(err.message || 'Failed to load customer account records.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenProposal = (quote) => {
    setSelectedQuote(quote);
    setIsDrawerOpen(true);
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

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (isLoading && quotes.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <LoadingSpinner message="Loading client portal dashboard..." size="lg" />
      </div>
    );
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
        <span className="font-mono font-bold text-blue-600">
          {o.orderNumber}
        </span>
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
  ];

  const invoiceCols = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (i) => (
        <span className="font-mono font-bold text-blue-600">
          {i.invoiceNumber}
        </span>
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
  ];

  return (
    <div className="min-h-screen bg-slate-50/75 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Executive Customer Hub Navigation Bar */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
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

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="xs"
              icon={RefreshCw}
              isLoading={isLoading}
              onClick={loadCustomerData}
            >
              Sync
            </Button>
            <span className="text-xs text-slate-600 font-medium hidden md:flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
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
        <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
          {[
            { id: 'quotes', label: `My Proposals (${quotes.length})`, icon: FileText },
            { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
            { id: 'invoices', label: `Invoices & Billing (${invoices.length})`, icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content 1: Proposals */}
        {activeTab === 'quotes' && (
          <div className="space-y-4">
            <DataTable
              columns={quoteCols}
              data={quotes}
              emptyMessage="No commercial proposals on file"
              emptyDescription="Proposals prepared by your dedicated account executive will appear here."
            />
          </div>
        )}

        {/* Tab Content 2: Orders */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <DataTable
              columns={orderCols}
              data={orders}
              emptyMessage="No confirmed orders yet"
              emptyDescription="Confirmed proposals will transition here into active fulfillment orders."
            />
          </div>
        )}

        {/* Tab Content 3: Invoices */}
        {activeTab === 'invoices' && (
          <div className="space-y-4">
            <DataTable
              columns={invoiceCols}
              data={invoices}
              emptyMessage="No invoices on file"
              emptyDescription="Issued statements and billing schedules will appear here."
            />
          </div>
        )}
      </div>

      {/* Drawer: Detailed Interactive Customer Proposal View */}
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
            isEmbedded
          />
        )}
      </Drawer>
    </div>
  );
};

export default CustomerAccountPage;
