import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { quotationApi } from '../api';
import {
  Button,
  Input,
  Select,
  StatusBadge,
  DataTable,
  PageHeader,
  ErrorAlert,
} from '../components/ui';
import { Plus, Search, Filter, RefreshCw, FileText } from 'lucide-react';

export const QuotationListPage = () => {
  const { user, isSalesRep, isSalesManager, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [quotes, setQuotes] = useState([]);
  const [filteredQuotes, setFilteredQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadQuotations();
  }, [user]);

  const loadQuotations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const filterParams = {};
      if (isSalesRep && !isAdmin && !isSalesManager) {
        filterParams.salesRepId = user?.id;
      }
      if (statusFilter) {
        filterParams.status = statusFilter;
      }

      const res = await quotationApi.getQuotations(filterParams);
      const list = Array.isArray(res) ? res : res?.value || [];
      setQuotes(list);
      setFilteredQuotes(list);
    } catch (err) {
      setError(err.message || 'Failed to retrieve quotations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let result = [...quotes];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.quotationNumber?.toLowerCase().includes(q) ||
          item.customerName?.toLowerCase().includes(q) ||
          item.salesRepName?.toLowerCase().includes(q)
      );
    }

    if (statusFilter) {
      result = result.filter((item) => item.status === statusFilter);
    }

    setFilteredQuotes(result);
  }, [searchQuery, statusFilter, quotes]);

  const columns = [
    {
      header: 'Quote #',
      accessor: 'quotationNumber',
      render: (q) => (
        <span className="font-semibold text-blue-600 hover:text-blue-800 font-mono text-xs">
          {q.quotationNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (q) => (
        <div>
          <span className="font-semibold text-slate-900 block">{q.customerName}</span>
          <span className="text-[11px] text-slate-500">Rep: {q.salesRepName}</span>
        </div>
      ),
    },
    {
      header: 'Deal Value',
      accessor: 'grandTotal',
      render: (q) => (
        <span className="font-bold text-slate-900">
          ${(q.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Gross Margin',
      accessor: 'marginPercent',
      render: (q) => <StatusBadge type="margin" value={q.marginPercent} />,
    },
    {
      header: 'Risk Score',
      accessor: 'riskScore',
      render: (q) => <StatusBadge type="risk" value={q.riskScore} />,
    },
    {
      header: 'Lifecycle State',
      accessor: 'status',
      render: (q) => <StatusBadge status={q.status} />,
    },
    {
      header: 'Approval State',
      accessor: 'approvalStatus',
      render: (q) => (
        <span className={`text-xs font-semibold ${
          q.approvalStatus === 'Approved' ? 'text-emerald-700' :
          q.approvalStatus === 'Pending' ? 'text-amber-700' : 'text-slate-500'
        }`}>
          {q.approvalStatus || 'None'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quotations & Deal Workspace"
        subtitle="Active sales proposals, pricing governance, and approval compliance tracking."
        badge={`${filteredQuotes.length} Deals`}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={RefreshCw}
              onClick={loadQuotations}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => navigate('/workspace/quotations/new')}
            >
              Create Quotation
            </Button>
          </div>
        }
      />

      {/* Filter and Search Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full">
          <Input
            icon={Search}
            placeholder="Search by quotation #, customer, or rep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="w-full sm:w-56">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            placeholder="All Statuses"
            options={[
              { value: '', label: 'All Lifecycle Statuses' },
              { value: 'Draft', label: 'Draft' },
              { value: 'PendingApproval', label: 'Pending Approval' },
              { value: 'Approved', label: 'Approved' },
              { value: 'Sent', label: 'Sent to Customer' },
              { value: 'UnderNegotiation', label: 'Under Negotiation' },
              { value: 'ConvertedToOrder', label: 'Converted to Order' },
            ]}
          />
        </div>
      </div>

      {error && (
        <ErrorAlert message={error} onRetry={loadQuotations} />
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredQuotes}
        isLoading={isLoading}
        onRowClick={(q) => navigate(`/workspace/quotations/${q.id}`)}
        emptyMessage="No quotations matching criteria"
        emptyDescription="Create a quote or adjust search filters to locate deal proposals."
        emptyAction={
          <Button
            variant="primary"
            size="xs"
            icon={Plus}
            onClick={() => navigate('/workspace/quotations/new')}
          >
            New Quotation
          </Button>
        }
      />
    </div>
  );
};

export default QuotationListPage;
