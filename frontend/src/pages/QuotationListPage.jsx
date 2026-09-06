import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  FileText,
  FileDown,
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';

export const QuotationListPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [quotations, setQuotations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => {
    loadQuotations();
  }, []);

  const loadQuotations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await quotationApi.getQuotations({ take: 100 });
      const items = res.items || res.data || (Array.isArray(res) ? res : []);
      setQuotations(items);
    } catch (err) {
      setError(err.message || 'Failed to retrieve quotations.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredQuotes = quotations.filter((q) => {
    const matchesSearch =
      !searchQuery ||
      q.quotationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.salesRepName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || q.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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
        <span className="font-bold text-slate-900 font-mono tracking-tight">
          {formatCurrency(q.grandTotal || 0, q.currency || 'INR')}
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
    {
      header: 'PDF',
      accessor: 'id',
      render: (q) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            quotationApi.downloadPdf(q.id, q.quotationNumber);
          }}
          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          title="Download vector PDF quotation"
        >
          <FileDown className="w-4 h-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Quotations &amp; Deal Workspace"
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
      <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
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
