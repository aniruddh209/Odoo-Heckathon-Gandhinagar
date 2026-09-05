import React, { useState, useEffect } from 'react';
import { billingApi } from '../api';
import {
  OneTimeInvoiceCard,
  SubscriptionSchedule,
  ProrationModal,
} from '../components/billing';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { FileText, Repeat } from 'lucide-react';

export const BillingPage = () => {
  const [activeTab, setActiveTab] = useState('invoices');
  const [alertMessage, setAlertMessage] = useState(null);

  // Payment Recording Modal State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('ACH / Wire');
  const [transactionRef, setTransactionRef] = useState('');
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  // Proration Modal State
  const [selectedSub, setSelectedSub] = useState(null);
  const [isChangingSub, setIsChangingSub] = useState(false);

  // Data states
  const [invoices, setInvoices] = useState([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(true);

  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(true);

  const [plans, setPlans] = useState([]);

  const fetchInvoices = async () => {
    setIsLoadingInvoices(true);
    try {
      const data = await billingApi.getInvoices();
      setInvoices(data || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setIsLoadingInvoices(false);
    }
  };

  const fetchSubscriptions = async () => {
    setIsLoadingSubs(true);
    try {
      const data = await billingApi.getSubscriptions();
      setSubscriptions(data || []);
    } catch (err) {
      console.error('Error fetching subscriptions:', err);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const data = await billingApi.getSubscriptionPlans();
      setPlans(data || []);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchSubscriptions();
    fetchPlans();
  }, []);

  const handleOpenPayment = (invId) => {
    const inv = invoices.find((i) => String(i.Id ?? i.id) === String(invId));
    if (inv) {
      setSelectedInvoiceId(invId);
      setPaymentAmount(inv.TotalAmount ?? inv.totalAmount ?? 0);
      setTransactionRef(`TX-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleConfirmPayment = async (e) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    setIsRecordingPayment(true);
    try {
      await billingApi.recordPayment(selectedInvoiceId, {
        Amount: paymentAmount,
        PaymentMethod: paymentMethod,
        TransactionReference: transactionRef,
      });
      setSelectedInvoiceId(null);
      setAlertMessage({ type: 'success', text: 'Payment recorded and invoice marked as Paid!' });
      fetchInvoices();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to record payment.' });
    } finally {
      setIsRecordingPayment(false);
    }
  };

  const handleChangeSubscription = async (req) => {
    if (!selectedSub) return;
    const subId = selectedSub.Id ?? selectedSub.id;
    setIsChangingSub(true);
    try {
      await billingApi.changeSubscription(String(subId), req);
      setSelectedSub(null);
      setAlertMessage({ type: 'success', text: 'Subscription modified. Prorated invoice generated!' });
      fetchSubscriptions();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to update subscription.' });
    } finally {
      setIsChangingSub(false);
    }
  };

  const handleCancelSubscription = async (subId) => {
    if (!confirm('Cancel this subscription?')) return;
    try {
      await billingApi.cancelSubscription(subId, { CancellationReason: 'Client requested termination' });
      setAlertMessage({ type: 'success', text: 'Subscription cancelled.' });
      fetchSubscriptions();
    } catch (err) {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to cancel subscription.' });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Subscriptions</h1>
          <p className="text-xs text-slate-500">
            One-time hardware invoicing, recurring SLA contracts & server-authoritative proration
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setActiveTab('invoices')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'invoices' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <FileText className="w-4 h-4" />
              <span>One-Time Invoices</span>
            </span>
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'subscriptions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span className="flex items-center space-x-1.5">
              <Repeat className="w-4 h-4" />
              <span>Recurring Subscriptions</span>
            </span>
          </button>
        </div>
      </div>

      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.text}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          {isLoadingInvoices ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : invoices.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No invoices generated yet. Invoices are automatically spawned when orders are fulfilled or subscriptions billed.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {invoices.map((inv) => (
                <OneTimeInvoiceCard
                  key={inv.Id || inv.id}
                  invoice={inv}
                  onRecordPayment={(id) => handleOpenPayment(id)}
                  onDownloadPdf={() => setAlertMessage({ type: 'success', text: `Downloading PDF invoice...` })}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-5">
          {isLoadingSubs ? (
            <div className="py-20 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
              No recurring subscription contracts found.
            </div>
          ) : (
            subscriptions.map((sub) => (
              <SubscriptionSchedule
                key={sub.Id || sub.id}
                subscription={sub}
                schedules={sub.BillingSchedules || sub.billingSchedules}
                onChangePlan={() => setSelectedSub(sub)}
                onCancel={(subId) => handleCancelSubscription(subId)}
              />
            ))
          )}
        </div>
      )}

      {/* Record Payment Modal */}
      <Modal
        isOpen={!!selectedInvoiceId}
        onClose={() => setSelectedInvoiceId(null)}
        title="Record Commercial Payment"
        size="md"
      >
        <form onSubmit={handleConfirmPayment} className="space-y-4">
          <Input
            label="Payment Amount ($)"
            type="number"
            min="0.01"
            step="0.01"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Select
            label="Payment Channel"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            options={[
              { value: 'ACH / Wire', label: 'ACH / Corporate Wire Transfer' },
              { value: 'Credit Card', label: 'Commercial Credit Card' },
              { value: 'Net-30 Terms', label: 'Direct Bank Settlement (Net-30)' },
              { value: 'Cheque', label: 'Cashier Cheque' },
            ]}
          />

          <Input
            label="Transaction / Wire Reference #"
            value={transactionRef}
            onChange={(e) => setTransactionRef(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setSelectedInvoiceId(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isRecordingPayment}>
              Confirm Payment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Proration Adjustment Modal */}
      {selectedSub && (
        <ProrationModal
          isOpen={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          subscription={selectedSub}
          plans={plans}
          isSubmitting={isChangingSub}
          onConfirm={handleChangeSubscription}
        />
      )}
    </div>
  );
};
