import React, { useState, useEffect } from 'react';
import { billingApi, adminApi } from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  Button,
  StatusBadge,
  DataTable,
  Modal,
  Input,
  Select,
  Textarea,
  PageHeader,
  MetricCard,
  SkeletonDashboard,
  ErrorAlert,
} from '../components/ui';
import {
  DollarSign,
  Calendar,
  RefreshCw,
  FileText,
  Receipt,
  Eye,
  CheckCircle2,
  XCircle,
  PlusCircle,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const BillingPage = () => {
  const { isFinance, isAdmin } = useAuth();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState('invoices'); // 'invoices' | 'schedules' | 'creditNotes'
  const [invoices, setInvoices] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [creditNotes, setCreditNotes] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Invoice Detail Modal
  const [selectedDetailInvoice, setSelectedDetailInvoice] = useState(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Payment Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('WireTransfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Credit Note Modal
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditReason, setCreditReason] = useState('');
  const [isProcessingCredit, setIsProcessingCredit] = useState(false);

  // Subscription Seat Change Modal
  const [isSeatModalOpen, setIsSeatModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [newSeatQty, setNewSeatQty] = useState(10);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [isProcessingSeat, setIsProcessingSeat] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [invRes, schedRes, cnRes, planRes] = await Promise.all([
        billingApi.getInvoices(),
        billingApi.getSchedules().catch(() => []),
        billingApi.getCreditNotes().catch(() => []),
        adminApi.getSubscriptionPlans().catch(() => []),
      ]);

      const invList = Array.isArray(invRes) ? invRes : invRes?.value || [];
      const sList = Array.isArray(schedRes) ? schedRes : schedRes?.value || [];
      const cList = Array.isArray(cnRes) ? cnRes : cnRes?.value || [];
      const pList = Array.isArray(planRes) ? planRes : planRes?.value || [];

      setInvoices(invList);
      setSchedules(sList);
      setCreditNotes(cList);
      setPlans(pList);
    } catch (err) {
      setError(err.message || 'Failed to load invoices and billing schedules.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetail = async (inv) => {
    setIsLoadingDetail(true);
    try {
      const detail = await billingApi.getInvoiceById(inv.id);
      setSelectedDetailInvoice(detail);
    } catch (err) {
      toast.error('Failed to load details', err.message);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleOpenPayment = (inv) => {
    setSelectedInvoice(inv);
    setPaymentAmount(inv.outstanding?.toString() || inv.total?.toString() || '0');
    setPaymentRef(`TXN-${Math.random().toString(36).substring(2, 8).toUpperCase()}`);
    setIsPaymentModalOpen(true);
  };

  const handleOpenCredit = (inv) => {
    setSelectedInvoice(inv);
    const maxCredit = inv.outstanding !== undefined ? inv.outstanding : inv.total || 0;
    setCreditAmount(Math.min(100, maxCredit).toFixed(2));
    setCreditReason('');
    setIsCreditModalOpen(true);
  };

  const handleOpenSeatChange = (sched) => {
    setSelectedSchedule(sched);
    setNewSeatQty(sched.quantity || 10);
    setSelectedPlanId('');
    setIsSeatModalOpen(true);
  };

  const handleGenerateNextInvoice = async (scheduleId) => {
    try {
      const inv = await billingApi.generateNextRecurringInvoice(scheduleId);
      toast.success('Recurring Invoice Generated', `Invoice ${inv.invoiceNumber} created and cycle advanced.`);
      await loadBillingData();
    } catch (err) {
      toast.error('Generation Failed', err.message);
    }
  };

  const handleCancelSchedule = async (scheduleId) => {
    if (!window.confirm('Are you sure you want to cancel this recurring subscription schedule?')) return;
    try {
      await billingApi.cancelSchedule(scheduleId, 'Customer cancellation request processed by Finance');
      toast.success('Subscription Cancelled', 'Recurring schedule has been marked cancelled.');
      await loadBillingData();
    } catch (err) {
      toast.error('Cancellation Failed', err.message);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amountNum = parseFloat(paymentAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Invalid Amount', 'Payment amount must be greater than zero.');
      return;
    }

    setIsProcessingPayment(true);
    try {
      await billingApi.recordPayment(selectedInvoice.id, {
        amount: amountNum,
        paymentMethod,
        reference: paymentRef,
      });

      toast.success('Payment Recorded', `Successfully reconciled $${amountNum.toFixed(2)} against ${selectedInvoice.invoiceNumber}.`);
      setIsPaymentModalOpen(false);
      await loadBillingData();
      if (selectedDetailInvoice && selectedDetailInvoice.id === selectedInvoice.id) {
        handleOpenDetail(selectedInvoice);
      }
    } catch (err) {
      toast.error('Payment Error', err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCreateCreditNote = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    const amountNum = parseFloat(creditAmount);
    if (!amountNum || amountNum <= 0) {
      toast.error('Invalid Amount', 'Credit note amount must be greater than zero.');
      return;
    }

    if (!creditReason.trim()) {
      toast.error('Reason Required', 'Please enter a business justification.');
      return;
    }

    setIsProcessingCredit(true);
    try {
      await billingApi.createCreditNote(selectedInvoice.id, {
        amount: amountNum,
        reason: creditReason.trim(),
      });

      toast.success('Credit Note Issued', `Reconciliation credit of $${amountNum.toFixed(2)} applied.`);
      setIsCreditModalOpen(false);
      await loadBillingData();
      if (selectedDetailInvoice && selectedDetailInvoice.id === selectedInvoice.id) {
        handleOpenDetail(selectedInvoice);
      }
    } catch (err) {
      toast.error('Credit Note Error', err.message);
    } finally {
      setIsProcessingCredit(false);
    }
  };

  const handleApplySeatChange = async (e) => {
    e.preventDefault();
    const targetScheduleId = selectedSchedule?.id || (schedules[0]?.id || 1);
    setIsProcessingSeat(true);
    try {
      const res = await billingApi.applySeatChange(targetScheduleId, {
        newQuantity: parseInt(newSeatQty, 10),
        newPlanId: selectedPlanId ? parseInt(selectedPlanId, 10) : null,
      });

      toast.success(
        'Subscription Prorated',
        `Adjusted to ${res.quantity} seats. Prorated difference: ${formatCurrency(res.proratedAdjustmentAmount || 0)}`
      );
      setIsSeatModalOpen(false);
      await loadBillingData();
    } catch (err) {
      toast.error('Proration Failed', err.message);
    } finally {
      setIsProcessingSeat(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const invoiceColumns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (inv) => (
        <button
          onClick={() => handleOpenDetail(inv)}
          className="font-mono font-bold text-xs text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{inv.invoiceNumber}</span>
        </button>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (inv) => <span className="font-semibold text-slate-900">{inv.customerName}</span>,
    },
    {
      header: 'Billing Type',
      accessor: 'type',
      render: (inv) => (
        <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
          inv.type === 'Recurring' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
        }`}>
          {inv.type || 'Commercial'}
        </span>
      ),
    },
    {
      header: 'Total Due',
      accessor: 'total',
      render: (inv) => (
        <span className="font-bold text-slate-900 font-mono">
          {formatCurrency(inv.total || 0)}
        </span>
      ),
    },
    {
      header: 'Paid Amount',
      accessor: 'paidAmount',
      render: (inv) => (
        <span className="font-mono text-emerald-600 font-medium">
          {formatCurrency(inv.paidAmount || 0)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      accessor: 'outstanding',
      render: (inv) => (
        <span className={`font-mono font-semibold ${inv.outstanding > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
          {formatCurrency(inv.outstanding || 0)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      header: 'Actions',
      render: (inv) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="xs"
            icon={Eye}
            onClick={() => handleOpenDetail(inv)}
          >
            Details
          </Button>
          {(isFinance || isAdmin) ? (
            <>
              {inv.status !== 'Paid' && inv.status !== 'Voided' && (
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleOpenPayment(inv)}
                >
                  Pay
                </Button>
              )}
              {inv.status !== 'Voided' && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleOpenCredit(inv)}
                >
                  Credit
                </Button>
              )}
            </>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Read-Only</span>
          )}
        </div>
      ),
    },
  ];

  const scheduleColumns = [
    {
      header: 'Schedule #',
      accessor: 'id',
      render: (s) => <span className="font-mono font-bold text-slate-700">SCH-{s.id}</span>,
    },
    {
      header: 'Customer & Order',
      render: (s) => (
        <div>
          <div className="font-semibold text-slate-900">{s.customerName || 'Customer'}</div>
          <div className="text-[11px] text-slate-400 font-mono">{s.orderNumber}</div>
        </div>
      ),
    },
    {
      header: 'Subscription Plan',
      accessor: 'planName',
      render: (s) => (
        <div>
          <span className="font-semibold text-purple-700">{s.planName || s.subscriptionPlanName}</span>
          <span className="ml-2 text-[10px] uppercase font-bold text-slate-500 bg-purple-50 px-1.5 py-0.5 rounded">
            {s.billingFrequency}
          </span>
        </div>
      ),
    },
    {
      header: 'Seats',
      accessor: 'quantity',
      render: (s) => <span className="font-bold text-slate-900">{s.quantity} Seats</span>,
    },
    {
      header: 'Unit Rate',
      accessor: 'unitPrice',
      render: (s) => <span className="font-mono text-slate-700">{formatCurrency(s.unitPrice || 0)}/seat</span>,
    },
    {
      header: 'Next Billing',
      accessor: 'nextBillingDate',
      render: (s) => (
        <span className="text-xs text-slate-600 font-medium">
          {s.nextBillingDate ? new Date(s.nextBillingDate).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-1.5">
          {(isFinance || isAdmin) ? (
            <>
              {s.status === 'Active' && (
                <>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => handleGenerateNextInvoice(s.id)}
                  >
                    Bill Cycle
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => handleOpenSeatChange(s)}
                  >
                    Prorate
                  </Button>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="text-rose-600 hover:text-rose-700"
                    onClick={() => handleCancelSchedule(s.id)}
                  >
                    Cancel
                  </Button>
                </>
              )}
            </>
          ) : (
            <span className="text-[11px] text-slate-400 italic">Read-Only</span>
          )}
        </div>
      ),
    },
  ];

  const creditNoteColumns = [
    {
      header: 'Credit Note #',
      accessor: 'id',
      render: (cn) => <span className="font-mono font-bold text-rose-600">CN-{cn.id}</span>,
    },
    {
      header: 'Related Invoice',
      accessor: 'invoiceNumber',
      render: (cn) => <span className="font-mono text-blue-600 font-semibold">{cn.invoiceNumber}</span>,
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (cn) => <span className="font-medium text-slate-900">{cn.customerName}</span>,
    },
    {
      header: 'Credit Amount',
      accessor: 'amount',
      render: (cn) => <span className="font-mono font-bold text-rose-600">-{formatCurrency(cn.amount || 0)}</span>,
    },
    {
      header: 'Business Reason',
      accessor: 'reason',
      render: (cn) => <span className="text-xs text-slate-700">{cn.reason}</span>,
    },
    {
      header: 'Issued At',
      accessor: 'createdAtUtc',
      render: (cn) => (
        <span className="text-xs text-slate-500">
          {cn.createdAtUtc ? new Date(cn.createdAtUtc).toLocaleDateString() : 'N/A'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Billing, Invoicing & Subscription Operations"
        subtitle="Manage one-time commercial equipment invoices, recurring cloud subscriptions, payments, and credit adjustments."
        badge={`${invoices.length} Invoices`}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadBillingData}
            >
              Refresh
            </Button>
            {(isFinance || isAdmin) && (
              <Button
                variant="primary"
                size="sm"
                icon={Calendar}
                onClick={() => {
                  setSelectedSchedule(schedules[0] || null);
                  setIsSeatModalOpen(true);
                }}
              >
                Seat Proration Engine
              </Button>
            )}
          </div>
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadBillingData} />}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Commercial Invoices"
          value={invoices.length}
          icon={Receipt}
          variant="primary"
          subtext={`Outstanding balance: ${formatCurrency(invoices.reduce((acc, i) => acc + (i.outstanding || 0), 0))}`}
        />
        <MetricCard
          label="Active Subscriptions"
          value={schedules.filter((s) => s.status === 'Active').length}
          icon={Calendar}
          variant="purple"
          subtext="Automated recurring schedules"
        />
        <MetricCard
          label="Issued Credit Notes"
          value={creditNotes.length}
          icon={Receipt}
          variant="danger"
          subtext={`Total adjustments: -${formatCurrency(creditNotes.reduce((acc, c) => acc + (c.amount || 0), 0))}`}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'invoices'
              ? 'bg-blue-50 text-blue-700 border border-blue-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          onClick={() => setActiveTab('invoices')}
        >
          Commercial Invoices ({invoices.length})
        </button>
        <button
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'schedules'
              ? 'bg-purple-50 text-purple-700 border border-purple-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          onClick={() => setActiveTab('schedules')}
        >
          Recurring Subscriptions ({schedules.length})
        </button>
        <button
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
            activeTab === 'creditNotes'
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
          onClick={() => setActiveTab('creditNotes')}
        >
          Credit Notes Registry ({creditNotes.length})
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'invoices' && (
        <div className="space-y-3">
          <DataTable
            columns={invoiceColumns}
            data={invoices}
            emptyMessage="No commercial invoices issued"
            emptyDescription="Confirm a sale order from the quotations workspace to generate commercial billing records."
          />
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="space-y-3">
          <DataTable
            columns={scheduleColumns}
            data={schedules}
            emptyMessage="No recurring subscription schedules"
            emptyDescription="Orders containing recurring SaaS line items will automatically establish recurring billing contracts here."
          />
        </div>
      )}

      {activeTab === 'creditNotes' && (
        <div className="space-y-3">
          <DataTable
            columns={creditNoteColumns}
            data={creditNotes}
            emptyMessage="No credit notes issued"
            emptyDescription="Reconciliation credit memos authorized by finance will be logged in this audit registry."
          />
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedDetailInvoice && (
        <Modal
          isOpen={Boolean(selectedDetailInvoice)}
          onClose={() => setSelectedDetailInvoice(null)}
          title={`Invoice ${selectedDetailInvoice.invoiceNumber}`}
          description={`Details and ledger for ${selectedDetailInvoice.customerName}`}
        >
          <div className="space-y-4 text-xs">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <StatusBadge status={selectedDetailInvoice.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Total</span>
                <span className="font-bold text-slate-900 font-mono">{formatCurrency(selectedDetailInvoice.total || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Paid</span>
                <span className="font-bold text-emerald-600 font-mono">{formatCurrency(selectedDetailInvoice.paidAmount || 0)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Outstanding</span>
                <span className="font-bold text-rose-600 font-mono">{formatCurrency(selectedDetailInvoice.outstanding || 0)}</span>
              </div>
            </div>

            {/* Line Items */}
            <div>
              <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider">Billed Line Items</h4>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Qty</th>
                      <th className="p-2 text-right">Unit Price</th>
                      <th className="p-2 text-right">Tax</th>
                      <th className="p-2 text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedDetailInvoice.lines?.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 font-medium text-slate-900">{line.productName}</td>
                        <td className="p-2 text-right">{line.quantity}</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(line.unitPrice || 0)}</td>
                        <td className="p-2 text-right font-mono">{formatCurrency(line.taxAmount || 0)}</td>
                        <td className="p-2 text-right font-bold font-mono">{formatCurrency(line.netAmount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Payments */}
            {selectedDetailInvoice.payments?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider">Payment Ledger</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2">Date</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Ref</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetailInvoice.payments.map((p, idx) => (
                        <tr key={idx}>
                          <td className="p-2">{new Date(p.paidAtUtc).toLocaleDateString()}</td>
                          <td className="p-2">{p.paymentMethod}</td>
                          <td className="p-2 font-mono">{p.reference || 'N/A'}</td>
                          <td className="p-2 text-right font-bold font-mono text-emerald-600">{formatCurrency(p.amount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Credit Notes */}
            {selectedDetailInvoice.creditNotes?.length > 0 && (
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 uppercase text-[10px] tracking-wider">Credit Memos</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-[10px] font-semibold text-slate-600 uppercase border-b border-slate-200">
                      <tr>
                        <th className="p-2">CN #</th>
                        <th className="p-2">Reason</th>
                        <th className="p-2 text-right">Credit Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedDetailInvoice.creditNotes.map((c, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-mono font-bold text-rose-600">CN-{c.id}</td>
                          <td className="p-2">{c.reason}</td>
                          <td className="p-2 text-right font-bold font-mono text-rose-600">-{formatCurrency(c.amount || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-3 flex justify-end gap-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setSelectedDetailInvoice(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        title="Reconcile Payment"
        description={`Registering transaction against ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <Input
            label="Payment Amount ($)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
          />

          <Select
            label="Settlement Method"
            required
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'WireTransfer', label: 'Wire Transfer / ACH' },
              { value: 'CreditCard', label: 'Corporate Credit Card' },
              { value: 'Cheque', label: 'Cashier Cheque' },
              { value: 'BankTransfer', label: 'Direct Bank Transfer' },
            ]}
          />

          <Input
            label="Bank Reference / Transaction ID"
            value={paymentRef}
            onChange={(e) => setPaymentRef(e.target.value)}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsPaymentModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isProcessingPayment}
            >
              Post Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Credit Note Modal */}
      <Modal
        isOpen={isCreditModalOpen}
        onClose={() => setIsCreditModalOpen(false)}
        title="Issue Credit Adjustment"
        description={`Credit memo adjustment on invoice ${selectedInvoice?.invoiceNumber}`}
      >
        <form onSubmit={handleCreateCreditNote} className="space-y-4">
          <Input
            label="Credit Amount (₹)"
            type="number"
            step="0.01"
            min="0.01"
            required
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />

          <Textarea
            label="Business Justification"
            required
            placeholder="Enter reason for concession or SLA credit..."
            value={creditReason}
            onChange={(e) => setCreditReason(e.target.value)}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsCreditModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              size="sm"
              isLoading={isProcessingCredit}
            >
              Authorize Credit Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mid-Cycle Seat Proration Modal */}
      <Modal
        isOpen={isSeatModalOpen}
        onClose={() => setIsSeatModalOpen(false)}
        title="Mid-Cycle Subscription Proration"
        description={`Calculating calendar seat adjustments for ${selectedSchedule?.planName || 'active subscription schedule'}`}
      >
        <form onSubmit={handleApplySeatChange} className="space-y-4">
          <Input
            label="Adjusted User Seat Count"
            type="number"
            min="1"
            required
            value={newSeatQty}
            onChange={(e) => setNewSeatQty(e.target.value)}
            helperText="Increasing or decreasing seats automatically calculates exact prorated adjustment for remaining billing cycle days."
          />

          <Select
            label="Target Plan Tier (Optional)"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            options={[
              { value: '', label: 'Keep current tier' },
              ...plans.map((p) => ({
                value: p.id,
                label: `${p.name} (${p.billingFrequency})`,
              })),
            ]}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsSeatModalOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isProcessingSeat}
            >
              Apply Proration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
