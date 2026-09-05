import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { customerApi } from '../api';
import {
  Button,
  StatusBadge,
  DataTable,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import { FileText, Package, CreditCard, LogOut, Zap, ShieldCheck } from 'lucide-react';

export const CustomerAccountPage = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('quotes'); // quotes, orders, invoices
  const [quotes, setQuotes] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

      setQuotes(Array.isArray(qRes) ? qRes : qRes?.value || []);
      setOrders(Array.isArray(oRes) ? oRes : oRes?.value || []);
      setInvoices(Array.isArray(iRes) ? iRes : iRes?.value || []);
    } catch (err) {
      setError(err.message || 'Failed to load customer account records.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading client portal dashboard..." size="lg" />;
  }

  const quoteCols = [
    { header: 'Proposal #', accessor: 'quotationNumber', render: (q) => <span className="font-mono font-bold text-blue-600">{q.quotationNumber}</span> },
    { header: 'Proposal Total', accessor: 'grandTotal', render: (q) => <span className="font-bold text-slate-900 font-mono">${(q.grandTotal || 0).toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (q) => <StatusBadge status={q.status} /> },
  ];

  const orderCols = [
    { header: 'Order #', accessor: 'orderNumber', render: (o) => <span className="font-mono font-bold text-blue-600">{o.orderNumber}</span> },
    { header: 'Confirmed Total', accessor: 'total', render: (o) => <span className="font-bold text-slate-900 font-mono">${(o.total || 0).toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (o) => <StatusBadge status={o.status || 'Confirmed'} /> },
  ];

  const invoiceCols = [
    { header: 'Invoice #', accessor: 'invoiceNumber', render: (i) => <span className="font-mono font-bold text-blue-600">{i.invoiceNumber}</span> },
    { header: 'Total Due', accessor: 'total', render: (i) => <span className="font-bold text-slate-900 font-mono">${(i.total || 0).toFixed(2)}</span> },
    { header: 'Outstanding', accessor: 'outstanding', render: (i) => <span className="font-bold text-rose-600 font-mono">${(i.outstanding || 0).toFixed(2)}</span> },
    { header: 'Status', accessor: 'status', render: (i) => <StatusBadge status={i.status} /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50/60 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Customer Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
              <Zap className="w-4 h-4 fill-white text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-900">Client Portal: {user?.fullName}</h1>
              <p className="text-xs text-slate-500">Secure customer account management &amp; billing.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Customer Account
            </span>
            <Button
              variant="outline"
              size="xs"
              icon={LogOut}
              onClick={logout}
            >
              Sign Out
            </Button>
          </div>
        </div>

        {error && <ErrorAlert message={error} onRetry={loadCustomerData} />}

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 space-x-6 text-xs font-semibold">
          {[
            { id: 'quotes', label: `My Proposals (${quotes.length})`, icon: FileText },
            { id: 'orders', label: `My Orders (${orders.length})`, icon: Package },
            { id: 'invoices', label: `My Invoices (${invoices.length})`, icon: CreditCard },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 border-b-2 flex items-center gap-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'quotes' && (
          <DataTable
            columns={quoteCols}
            data={quotes}
            emptyMessage="No quotations found"
            emptyDescription="Proposals prepared by your account manager will appear here."
          />
        )}

        {activeTab === 'orders' && (
          <DataTable
            columns={orderCols}
            data={orders}
            emptyMessage="No confirmed orders"
            emptyDescription="Orders will appear once quote confirmation is completed."
          />
        )}

        {activeTab === 'invoices' && (
          <DataTable
            columns={invoiceCols}
            data={invoices}
            emptyMessage="No invoices on file"
            emptyDescription="Invoices and billing summaries will appear here."
          />
        )}
      </div>
    </div>
  );
};

export default CustomerAccountPage;
