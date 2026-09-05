import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { approvalApi } from '../api';
import {
  Button,
  StatusBadge,
  DataTable,
  Drawer,
  Textarea,
  Select,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldAlert,
  AlertTriangle,
  FileText,
  Clock,
  User,
  DollarSign,
  RefreshCw,
} from 'lucide-react';

export const ApprovalDetailPage = () => {
  const { user, isSalesManager, isFinance, isAdmin } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [approvals, setApprovals] = useState([]);
  const [filteredApprovals, setFilteredApprovals] = useState([]);
  const [levelFilter, setLevelFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected for Action
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [actionReason, setActionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await approvalApi.getPendingApprovals(levelFilter || null);
      const list = Array.isArray(res) ? res : res?.value || [];
      setApprovals(list);
      setFilteredApprovals(list);
    } catch (err) {
      setError(err.message || 'Failed to load pending approvals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!levelFilter) {
      setFilteredApprovals(approvals);
    } else {
      setFilteredApprovals(approvals.filter((a) => a.level === levelFilter));
    }
  }, [levelFilter, approvals]);

  const handleAction = async (actionType) => {
    if (!selectedApproval) return;

    if ((actionType === 'Reject' || actionType === 'RequestRevision') && actionReason.trim().length < 10) {
      toast.error('Detailed Reason Required', 'Please provide an explanation of at least 10 characters for why this proposal is being returned or rejected.');
      return;
    }

    setIsSubmitting(true);
    try {
      await approvalApi.actionApproval(selectedApproval.id, {
        action: actionType,
        reason: actionReason || `Approved under standard authority by ${user?.fullName}.`,
      });

      const label = actionType === 'Approve' ? 'Approved' : actionType === 'RequestRevision' ? 'Returned for Revision' : 'Rejected';
      toast.success(
        'Action Processed',
        `Quote ${selectedApproval.quotationNumber} marked as ${label}.`
      );

      setSelectedApproval(null);
      setActionReason('');
      await loadApprovals();
    } catch (err) {
      toast.error('Approval Action Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Quote #',
      accessor: 'quotationNumber',
      render: (a) => (
        <span className="font-mono font-semibold text-blue-600 text-xs">
          {a.quotationNumber}
        </span>
      ),
    },
    {
      header: 'Customer',
      accessor: 'customerName',
      render: (a) => <span className="font-semibold text-slate-900">{a.customerName}</span>,
    },
    {
      header: 'Sales Rep',
      accessor: 'salesRepName',
      render: (a) => <span className="text-slate-600">{a.salesRepName}</span>,
    },
    {
      header: 'Required Authority',
      accessor: 'level',
      render: (a) => (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
          Level: {a.level}
        </span>
      ),
    },
    {
      header: 'Deal Value',
      accessor: 'grandTotal',
      render: (a) => (
        <span className="font-bold text-slate-900">
          ${(a.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: 'Blended Risk',
      accessor: 'riskScore',
      render: (a) => <StatusBadge type="risk" value={a.riskScore} />,
    },
    {
      header: 'Action',
      render: (a) => (
        <Button
          variant="outline"
          size="xs"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedApproval(a);
            setActionReason('');
          }}
        >
          Review & Decide
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Governance & Approval Desk</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Evaluate deep discounts, margin anomalies, and high-risk commercial proposals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadApprovals}
          >
            Refresh Queue
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">Filter Level:</span>
          <Select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-48"
            options={[
              { value: '', label: 'All Review Levels' },
              { value: 'Manager', label: 'Sales Manager (Level 1)' },
              { value: 'Finance', label: 'Finance Director (Level 2)' },
            ]}
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Pending Decisions: <strong className="text-slate-900">{filteredApprovals.length}</strong>
        </span>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadApprovals} />}

      <DataTable
        columns={columns}
        data={filteredApprovals}
        isLoading={isLoading}
        onRowClick={(a) => {
          setSelectedApproval(a);
          setActionReason('');
        }}
        emptyMessage="No pending approvals in queue"
        emptyDescription="All discount requests are currently compliant or already authorized."
      />

      {/* Triage Decision Drawer */}
      <Drawer
        isOpen={!!selectedApproval}
        onClose={() => setSelectedApproval(null)}
        title="Discount Approval Decision"
        subtitle={`Evaluation for ${selectedApproval?.quotationNumber} • ${selectedApproval?.customerName}`}
        width="md"
      >
        {selectedApproval && (
          <div className="space-y-6">
            {/* Risk & Terms Callout */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                  Blended Risk Assessment
                </span>
                <StatusBadge type="risk" value={selectedApproval.riskScore} />
              </div>

              <div className="text-xs text-amber-950 leading-relaxed">
                {selectedApproval.reason ||
                  'The requested proposal discount exceeds established customer tier or product category limits.'}
              </div>

              <div className="pt-2 border-t border-amber-200/80 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-amber-800 text-[11px] block">Deal Grand Total</span>
                  <strong className="text-sm font-bold text-amber-950">
                    ${(selectedApproval.grandTotal || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </strong>
                </div>
                <div>
                  <span className="text-amber-800 text-[11px] block">Submitted Rep</span>
                  <strong className="text-sm font-bold text-amber-950">
                    {selectedApproval.salesRepName}
                  </strong>
                </div>
              </div>
            </div>

            {/* Quick link to view full quote */}
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="xs"
                icon={FileText}
                onClick={() => navigate(`/workspace/quotations/${selectedApproval.quotationId}`)}
              >
                Inspect Line-by-Line Quote
              </Button>
            </div>

            {/* Decision Remarks */}
            <div className="space-y-2">
              <Textarea
                label="Audit Remarks / Explanation"
                required
                placeholder="Enter justification or specific instructions for revision..."
                value={actionReason}
                onChange={(e) => setActionReason(e.target.value)}
                rows={4}
                helperText="Required when rejecting or returning proposals for amendment."
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <Button
                variant="success"
                fullWidth
                size="md"
                icon={CheckCircle2}
                isLoading={isSubmitting}
                onClick={() => handleAction('Approve')}
              >
                Approve Quotation
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  isLoading={isSubmitting}
                  className="border-amber-300 text-amber-800 hover:bg-amber-50"
                  onClick={() => handleAction('RequestRevision')}
                >
                  Return for Edit
                </Button>

                <Button
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  isLoading={isSubmitting}
                  onClick={() => handleAction('Reject')}
                >
                  Reject Proposal
                </Button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default ApprovalDetailPage;
