import React, { useState, useEffect } from 'react';
import { billingApi, adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  StatusBadge,
  DataTable,
  Modal,
  Input,
  Select,
  Textarea,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import {
  DollarSign,
  Calendar,
  RefreshCw,
} from 'lucide-react';

export const BillingPage = () => {
  const toast = useToast();

  const [invoices, setInvoices] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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
      const [invRes, planRes] = await Promise.all([
        billingApi.getInvoices(),
        adminApi.getSubscriptionPlans(),
      ]);

      const invList = Array.isArray(invRes) ? invRes : invRes?.value || [];
      const pList = Array.isArray(planRes) ? planRes : planRes?.value || [];

      setInvoices(invList);
      setPlans(pList);
    } catch (err) {
      setError(err.message || 'Failed to load invoices and billing schedules.');
    } finally {
      setIsLoading(false);
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
    setCreditAmount('100.00');
    setCreditReason('');
    setIsCreditModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsProcessingPayment(true);
    try {
      await billingApi.recordPayment(selectedInvoice.id, {
        amount: parseFloat(paymentAmount) || 0,
        paymentMethod,
        reference: paymentRef,
      });

      toast.success('Payment Recorded', `Successfully reconciled $${paymentAmount} against ${selectedInvoice.invoiceNumber}.`);
      setIsPaymentModalOpen(false);
      await loadBillingData();
    } catch (err) {
      toast.error('Payment Error', err.message);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCreateCreditNote = async (e) => {
    e.preventDefault();
    if (!selectedInvoice) return;

    setIsProcessingCredit(true);
    try {
      await billingApi.createCreditNote(selectedInvoice.id, {
        amount: parseFloat(creditAmount) || 0,
        reason: creditReason || 'Customer satisfaction credit adjustment',
      });

      toast.success('Credit Note Issued', `Reconciliation credit applied.`);
      setIsCreditModalOpen(false);
      await loadBillingData();
    } catch (err) {
      toast.error('Credit Note Error', err.message);
    } finally {
      setIsProcessingCredit(false);
    }
  };

  const handleApplySeatChange = async (e) => {
    e.preventDefault();
    setIsProcessingSeat(true);
    try {
      await billingApi.applySeatChange(1, {
        newQuantity: parseInt(newSeatQty, 10),
        newPlanId: selectedPlanId ? parseInt(selectedPlanId, 10) : null,
      });

      toast.success('Subscription Prorated', `Seat adjustment calculated and next invoice adjusted.`);
      setIsSeatModalOpen(false);
    } catch (err) {
      toast.error('Proration Failed', err.message);
    } finally {
      setIsProcessingSeat(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Querying hybrid invoices and recurring contracts..." size="lg" />;
  }

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoiceNumber',
      render: (inv) => (
        <span className="font-mono font-bold text-xs text-blue-600">{inv.invoiceNumber}</span>
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
        <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
          {inv.type || 'Commercial'}
        </span>
      ),
    },
    {
      header: 'Total Due',
      accessor: 'total',
      render: (inv) => (
        <span className="font-bold text-slate-900 font-mono">
          ${(inv.total || 0).toFixed(2)}
        </span>
      ),
    },
    {
      header: 'Outstanding',
      accessor: 'outstanding',
      render: (inv) => (
        <span className={`font-mono font-semibold ${inv.outstanding > 0 ? 'text-rose-600' : 'text-slate-500'}`}>
          ${(inv.outstanding || 0).toFixed(2)}
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
          {inv.status !== 'Paid' && (
            <Button
              variant="outline"
              size="xs"
              onClick={() => handleOpenPayment(inv)}
            >
              Record Payment
            </Button>
          )}
          <Button
            variant="ghost"
            size="xs"
            onClick={() => handleOpenCredit(inv)}
          >
            Credit Note
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hybrid Billing & Subscription Operations</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Unified management for immediate one-time equipment invoices and recurring subscription contracts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadBillingData}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Calendar}
            onClick={() => setIsSeatModalOpen(true)}
          >
            Test Mid-Cycle Proration
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadBillingData} />}

      {/* Distinction Callout Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40">
          <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs mb-1">
            <DollarSign className="w-4 h-4 text-blue-600" />
            Commercial Capital Goods (One-Time)
          </div>
          <p className="text-xs text-blue-700 leading-relaxed">
            Invoiced immediately upon sale order confirmation with standard net-30 settlement terms and tax collection.
          </p>
        </div>

        <div className="p-4 rounded-xl border border-purple-200 bg-purple-50/40">
          <div className="flex items-center gap-2 text-purple-900 font-semibold text-xs mb-1">
            <Calendar className="w-4 h-4 text-purple-600" />
            Recurring Cloud Subscriptions (SaaS Schedules)
          </div>
          <p className="text-xs text-purple-700 leading-relaxed">
            Automated calendar billing schedules (Monthly/Quarterly/Annual) with exact day-rate proration on seat adjustments.
          </p>
        </div>
      </div>

      {/* Commercial Invoices Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Customer Commercial Invoices</h2>
          <span className="text-xs text-slate-500">{invoices.length} total records</span>
        </div>

        <DataTable
          columns={columns}
          data={invoices}
          emptyMessage="No commercial invoices issued"
          emptyDescription="Confirm a sale order from the quotations workspace to generate commercial billing records."
        />
      </div>

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
            label="Credit Amount ($)"
            type="number"
            step="0.01"
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
        title="Simulate Mid-Cycle Subscription Adjustment"
        description="Calendar proration calculated automatically using exact daily billing rates."
      >
        <form onSubmit={handleApplySeatChange} className="space-y-4">
          <Input
            label="Adjusted User Seat Count"
            type="number"
            min="1"
            required
            value={newSeatQty}
            onChange={(e) => setNewSeatQty(e.target.value)}
            helperText="Increasing or decreasing seats computes prorated credit or debit for remaining cycle days."
          />

          <Select
            label="Subscription Plan Tier"
            value={selectedPlanId}
            onChange={(e) => setSelectedPlanId(e.target.value)}
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.billingFrequency})`,
            }))}
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
              Execute Proration
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BillingPage;
