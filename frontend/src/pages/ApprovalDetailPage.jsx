import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { approvalApi, quotationApi } from '../api';
import { useAuth } from '../hooks/useAuth';
import { ApprovalStepper, RiskDetailBreakdown, ApprovalDecisionModal } from '../components/approvals';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { ShieldAlert, CheckCircle2, Clock, Eye } from 'lucide-react';

export const ApprovalDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { hasRole } = useAuth();

  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [selectedRequestId, setSelectedRequestId] = useState(id || null);
  const [quotation, setQuotation] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isSubmittingDecision, setIsSubmittingDecision] = useState(false);
  const [alertMessage, setAlertMessage] = useState(null);

  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    try {
      const data = await approvalApi.getPendingApprovals();
      setRequests(data || []);
      if (!selectedRequestId && data && data.length > 0) {
        setSelectedRequestId(String(data[0].Id ?? data[0].id));
      }
    } catch (err) {
      console.error('Error fetching pending approvals:', err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // Pick active request
  const activeRequest =
    requests.find((r) => String(r.Id ?? r.id) === String(selectedRequestId || id)) ||
    (requests.length > 0 ? requests[0] : null);

  const reqQuoteId = activeRequest?.QuotationId ?? activeRequest?.quotationId;

  // When active request changes, load quotation
  useEffect(() => {
    if (!reqQuoteId) {
      setQuotation(null);
      return;
    }
    let isMounted = true;
    quotationApi.getQuotation(reqQuoteId)
      .then((q) => {
        if (isMounted) setQuotation(q);
      })
      .catch((err) => console.error('Error loading quotation for approval:', err));

    return () => {
      isMounted = false;
    };
  }, [reqQuoteId]);

  const handleDecision = async (action, comments) => {
    if (!activeRequest) return;
    const reqId = activeRequest.Id ?? activeRequest.id;
    setIsSubmittingDecision(true);
    try {
      await approvalApi.recordDecision(String(reqId), { Action: action, Comments: comments });
      setIsDecisionModalOpen(false);
      setAlertMessage({
        type: 'success',
        text: `Quotation has been successfully ${action.toLowerCase()}d.`,
      });
      fetchRequests();
    } catch (err) {
      setAlertMessage({
        type: 'danger',
        text: err?.message || 'Failed to submit governance decision.',
      });
    } finally {
      setIsSubmittingDecision(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Governance & Approval Desk</h1>
          <p className="text-xs text-slate-500">
            Tier 1 & Tier 2 policy evaluations for high-discount & low-margin quotations
          </p>
        </div>

        {activeRequest && (
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/quotations/${reqQuoteId}`)}
            >
              <Eye className="w-4 h-4 mr-1.5" />
              View Quotation
            </Button>
            <Button
              size="sm"
              onClick={() => setIsDecisionModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ShieldAlert className="w-4 h-4 mr-1.5" />
              Make Governance Decision
            </Button>
          </div>
        )}
      </div>

      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.text}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Main Layout: Master-Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Inbox List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h3 className="font-bold text-slate-800 text-sm">Pending Review Queue</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full">
              {requests.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
            {isLoadingRequests ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : requests.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                All approval queues are clear. No pending policy exceptions.
              </div>
            ) : (
              requests.map((req) => {
                const reqId = req.Id ?? req.id;
                const isSelected = (activeRequest?.Id ?? activeRequest?.id) === reqId;
                const quoteNum = req.QuotationNumber || req.quotationNumber;
                const custName = req.CustomerName || req.customerName;
                const riskScore = req.BlendedRiskScore ?? req.blendedRiskScore ?? 0;
                const netTotal = req.TotalAmount ?? req.totalNetAmount ?? 0;
                const created = req.CreatedAt || req.submittedAt;

                return (
                  <div
                    key={reqId}
                    onClick={() => setSelectedRequestId(String(reqId))}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{quoteNum}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          riskScore >= 61
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Risk: {riskScore}
                      </span>
                    </div>

                    <div className="text-xs font-semibold text-slate-700">{custName}</div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
                      <span className="font-mono text-slate-900 font-bold">${netTotal.toLocaleString()}</span>
                      <span>{created ? new Date(created).toLocaleDateString() : 'Today'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Approval Detail */}
        <div className="lg:col-span-2 space-y-6">
          {activeRequest ? (
            <>
              <RiskDetailBreakdown request={activeRequest} quotation={quotation} />
              <ApprovalStepper request={activeRequest} />
            </>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700">No Request Selected</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select an approval request from the queue on the left to inspect risk breakdown and record a decision.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {activeRequest && (
        <ApprovalDecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          quotationNumber={activeRequest.QuotationNumber || activeRequest.quotationNumber || ''}
          isSubmitting={isSubmittingDecision}
          onConfirm={handleDecision}
        />
      )}
    </div>
  );
};
