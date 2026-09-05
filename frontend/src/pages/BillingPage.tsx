import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
import { SubscriptionDto, ChangeSubscriptionRequest, InvoiceDto } from '../types';

export const BillingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'invoices' | 'subscriptions'>('invoices');
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Payment Recording Modal State
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('ACH / Wire');
  const [transactionRef, setTransactionRef] = useState('');

  // Proration Modal State
  const [selectedSub, setSelectedSub] = useState<SubscriptionDto | null>(null);

  // Queries
  const { data: invoices = [], isLoading: isLoadingInvoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => billingApi.getInvoices(),
  });

  const { data: subscriptions = [], isLoading: isLoadingSubs } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => billingApi.getSubscriptions(),
  });

  const { data: plans = [] } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: () => billingApi.getSubscriptionPlans(),
  });

  // Mutations
  const recordPaymentMutation = useMutation({
    mutationFn: ({ invoiceId, amount, method, ref }: { invoiceId: string; amount: number; method: string; ref: string }) =>
      billingApi.recordPayment(invoiceId, { Amount: amount, PaymentMethod: method, TransactionReference: ref }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setSelectedInvoiceId(null);
      setAlertMessage({ type: 'success', text: 'Payment recorded and invoice marked as Paid!' });
    },
    onError: (err: any) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to record payment.' });
    },
  });

  const changeSubMutation = useMutation({
    mutationFn: ({ subId, req }: { subId: string; req: ChangeSubscriptionRequest }) =>
      billingApi.changeSubscription(subId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setSelectedSub(null);
      setAlertMessage({ type: 'success', text: 'Subscription modified. Prorated invoice generated!' });
    },
    onError: (err: any) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to update subscription.' });
    },
  });

  const cancelSubMutation = useMutation({
    mutationFn: (subId: string) =>
      billingApi.cancelSubscription(subId, { CancellationReason: 'Client requested termination' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setAlertMessage({ type: 'success', text: 'Subscription cancelled.' });
    },
  });

  const handleOpenPayment = (invId: string) => {
    const inv = invoices.find((i: InvoiceDto) => String(i.Id ?? i.id) === String(invId));
    if (inv) {
      setSelectedInvoiceId(invId);
      setPaymentAmount(inv.TotalAmount ?? inv.totalAmount ?? 0);
      setTransactionRef(`TX-${Date.now().toString().slice(-6)}`);
    }
  };

  const handleConfirmPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;
    recordPaymentMutation.mutate({
      invoiceId: selectedInvoiceId,
      amount: paymentAmount,
      method: paymentMethod,
      ref: transactionRef,
    });
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
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
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
              {invoices.map((inv: InvoiceDto) => (
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
            subscriptions.map((sub: SubscriptionDto) => (
              <SubscriptionSchedule
                key={sub.Id || sub.id}
                subscription={sub}
                schedules={sub.BillingSchedules || sub.billingSchedules}
                onChangePlan={() => setSelectedSub(sub)}
                onCancel={(subId: string) => {
                  if (confirm('Cancel this subscription?')) {
                    cancelSubMutation.mutate(subId);
                  }
                }}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPaymentAmount(parseFloat(e.target.value) || 0)}
            required
          />

          <Select
            label="Payment Channel"
            value={paymentMethod}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setPaymentMethod(e.target.value)}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTransactionRef(e.target.value)}
            required
          />

          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setSelectedInvoiceId(null)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={recordPaymentMutation.isPending}>
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
          isSubmitting={changeSubMutation.isPending}
          onConfirm={(req: ChangeSubscriptionRequest) => {
            const subId = selectedSub.Id ?? selectedSub.id;
            changeSubMutation.mutate({ subId: String(subId), req });
          }}
        />
      )}
    </div>
  );
};
