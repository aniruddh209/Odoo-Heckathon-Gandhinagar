import React, { useState, useEffect } from 'react';
import { customerApi, adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  DataTable,
  Modal,
  Input,
  Select,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import { Users, Plus, Mail, Phone, RefreshCw } from 'lucide-react';

export const CustomerListPage = () => {
  const toast = useToast();
  const [customers, setCustomers] = useState([]);
  const [tiers, setTiers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // New Customer Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tierId, setTierId] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [cRes, tRes] = await Promise.all([
        customerApi.getCustomers(),
        adminApi.getCustomerTiers(),
      ]);

      const cList = Array.isArray(cRes) ? cRes : cRes?.value || [];
      const tList = Array.isArray(tRes) ? tRes : tRes?.value || [];

      setCustomers(cList);
      setTiers(tList);
      if (tList.length > 0) setTierId(tList[0].id.toString());
    } catch (err) {
      setError(err.message || 'Failed to load customer accounts.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await customerApi.createCustomer({
        name,
        email,
        phone,
        tierId: parseInt(tierId, 10),
        currencyCode,
      });

      toast.success('Customer Created', `${name} added to accounts.`);
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');
      await loadCustomers();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Querying customer enterprise accounts..." size="lg" />;
  }

  const columns = [
    {
      header: 'Account Name',
      accessor: 'name',
      render: (c) => <span className="font-bold text-slate-900">{c.name}</span>,
    },
    {
      header: 'Contact Email',
      accessor: 'email',
      render: (c) => (
        <span className="text-slate-600 flex items-center gap-1.5 font-mono text-xs">
          <Mail className="w-3.5 h-3.5 text-slate-400" />
          {c.email || '—'}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (c) => (
        <span className="text-slate-600 flex items-center gap-1.5 text-xs">
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          {c.phone || '—'}
        </span>
      ),
    },
    {
      header: 'Assigned Tier',
      accessor: 'tierName',
      render: (c) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          {c.tierName} Tier
        </span>
      ),
    },
    {
      header: 'Currency',
      accessor: 'currencyCode',
      render: (c) => <span className="font-mono text-xs text-slate-600">{c.currencyCode}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Customer Accounts</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise customer registry, tier assignment, and commercial pricing policies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadCustomers}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsModalOpen(true)}
          >
            New Customer
          </Button>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadCustomers} />}

      <DataTable
        columns={columns}
        data={customers}
        emptyMessage="No customer accounts registered"
        emptyDescription="Create a customer account to begin generating proposals."
      />

      {/* New Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Enterprise Customer"
        description="Assign tier discount limits and default currency code."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Company / Account Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Acme Global Solutions"
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@company.com"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1-555-0100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Customer Tier"
              required
              value={tierId}
              onChange={(e) => setTierId(e.target.value)}
              options={tiers.map((t) => ({
                value: t.id,
                label: `${t.name} (Max ${t.maxDiscountPercent}%)`,
              }))}
            />

            <Select
              label="Default Currency"
              value={currencyCode}
              onChange={(e) => setCurrencyCode(e.target.value)}
              options={[
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
                { value: 'INR', label: 'INR (₹)' },
              ]}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Customer
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CustomerListPage;
