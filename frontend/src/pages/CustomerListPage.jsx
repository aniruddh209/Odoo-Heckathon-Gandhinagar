import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { customerApi, adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import {
  Button,
  DataTable,
  Modal,
  Input,
  Select,
  PageHeader,
  ErrorAlert,
} from '../components/ui';
import {
  Users,
  Plus,
  Mail,
  Phone,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';

export const CustomerListPage = () => {
  const navigate = useNavigate();
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
  const [currencyCode, setCurrencyCode] = useState('INR');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Credentials Generated Modal
  const [createdCredential, setCreatedCredential] = useState(null);
  const [copied, setCopied] = useState(false);

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
      const res = await customerApi.createCustomer({
        name: name.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        tierId: parseInt(tierId, 10),
        currencyCode,
      });

      toast.success('Customer Created', `${name} registered successfully.`);
      setIsModalOpen(false);
      setName('');
      setEmail('');
      setPhone('');

      // Check if temporary password returned
      if (res?.temporaryPassword) {
        setCreatedCredential({
          customerName: res.customer?.name || name,
          email: res.user?.email || email,
          temporaryPassword: res.temporaryPassword,
        });
      }

      await loadCustomers();
    } catch (err) {
      toast.error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (!createdCredential) return;
    const text = `Customer Portal Access Credentials:\nURL: ${window.location.origin}/login\nEmail: ${createdCredential.email}\nTemporary Password: ${createdCredential.temporaryPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const columns = [
    {
      header: 'Account Name',
      accessor: 'name',
      render: (c) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
            {c.name}
          </span>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded-md font-medium border border-blue-100 flex items-center gap-0.5">
            360 <ExternalLink className="w-2.5 h-2.5" />
          </span>
        </div>
      ),
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
    {
      header: 'Action',
      render: (c) => (
        <Button
          variant="outline"
          size="xs"
          icon={ArrowRight}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/workspace/customers/${c.id}`);
          }}
        >
          View 360
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Customer Accounts"
        subtitle="Enterprise customer registry, commercial tiers, and Customer 360 workspaces."
        badge={`${customers.length} Accounts`}
        actions={
          <div className="flex items-center gap-2.5">
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
        }
      />

      {error && <ErrorAlert message={error} onRetry={loadCustomers} />}

      <DataTable
        columns={columns}
        data={customers}
        isLoading={isLoading}
        emptyMessage="No customer accounts registered"
        emptyDescription="Create a customer account to begin generating proposals."
        onRowClick={(c) => navigate(`/workspace/customers/${c.id}`)}
      />

      {/* New Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register Enterprise Customer"
        description="Creates customer account and provisions portal credentials atomically."
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <Input
            label="Company / Account Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sharma Technologies Pvt. Ltd."
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Contact / Portal Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@sharmatech.in"
            />
            <Input
              label="Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98201 12345"
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
                { value: 'INR', label: 'INR (₹)' },
                { value: 'USD', label: 'USD ($)' },
                { value: 'EUR', label: 'EUR (€)' },
                { value: 'GBP', label: 'GBP (£)' },
              ]}
            />
          </div>

          <p className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
            Note: Providing an email address will automatically provision a Customer Portal login with a secure 14-character temporary password.
          </p>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
              Save Customer & Provision
            </Button>
          </div>
        </form>
      </Modal>

      {/* Temporary Password / Credentials Modal */}
      {createdCredential && (
        <Modal
          isOpen={true}
          onClose={() => setCreatedCredential(null)}
          title="Customer Portal Access Provisioned"
          description="A customer account and portal login have been created in Microsoft SQL Server."
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Security Notice:</span> This temporary password is only displayed once. Please securely send these credentials to the client contact.
              </div>
            </div>

            <div className="bg-slate-900 text-slate-100 p-4 rounded-xl space-y-2.5 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Customer:</span>
                <span className="text-white font-semibold">{createdCredential.customerName}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Portal Login:</span>
                <span className="text-white">{createdCredential.email}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400">Temporary Password:</span>
                <span className="text-emerald-400 font-bold text-sm tracking-wider bg-slate-800 px-2 py-0.5 rounded">
                  {createdCredential.temporaryPassword}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                icon={copied ? Check : Copy}
                onClick={copyToClipboard}
              >
                {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setCreatedCredential(null)}
              >
                Done
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CustomerListPage;
