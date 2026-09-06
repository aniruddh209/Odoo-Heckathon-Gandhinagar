import React, { useState, useId } from 'react';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { X, Send, MessageSquare, User, Shield, Percent, Sparkles, ArrowRight, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export const LineNegotiationDrawer = ({
  isOpen,
  onClose,
  line,
  currency = 'INR',
  comments = [],
  isLoadingComments = false,
  onSendComment,
  onSendCounter,
  isSending = false,
  canNegotiate = true,
}) => {
  const [activeTab, setActiveTab] = useState('counter'); // 'counter' | 'chat'
  const [newComment, setNewComment] = useState('');
  const [proposedDiscount, setProposedDiscount] = useState(
    line?.discountPercent ? Math.min(50, line.discountPercent + 5) : 5
  );
  const [counterReason, setCounterReason] = useState('');

  const discountSliderId = useId();

  if (!isOpen || !line) return null;

  const unitBasePrice = line.unitPrice || line.UnitPrice || 0;
  const quantity = line.quantity || line.Quantity || 1;
  const currentDiscount = line.discountPercent ?? line.DiscountPercent ?? 0;

  // Current calculation
  const currentNetUnit = unitBasePrice * (1 - currentDiscount / 100);
  const currentTotal = currentNetUnit * quantity;

  // Proposed calculation
  const proposedNetUnit = unitBasePrice * (1 - proposedDiscount / 100);
  const proposedTotal = proposedNetUnit * quantity;
  const projectedSavings = Math.max(0, currentTotal - proposedTotal);

  const handleCommentSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (onSendComment) onSendComment(newComment.trim());
    setNewComment('');
  };

  const handleCounterSubmit = (e) => {
    e.preventDefault();
    if (onSendCounter) {
      onSendCounter({
        proposedDiscountPercent: parseFloat(proposedDiscount),
        reason: counterReason.trim(),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Percent className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Line Item Negotiation Hub</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[260px]">
                {line.productName || line.ProductName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white text-xs font-semibold px-4">
          <button
            type="button"
            onClick={() => setActiveTab('counter')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'counter'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Propose Counter-Discount
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'chat'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Discussion Thread ({comments.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {activeTab === 'counter' ? (
            <form onSubmit={handleCounterSubmit} className="space-y-4">
              {/* Item Baseline Metrics */}
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">List Unit Price</span>
                  <span className="font-mono font-bold text-slate-800">
                    {formatCurrency(unitBasePrice, currency)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Contract Quantity</span>
                  <span className="font-semibold text-slate-800">{quantity} units</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Discount</span>
                  <span className="font-bold text-blue-600">{currentDiscount}%</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Current Line Total</span>
                  <span className="font-mono font-bold text-slate-900">
                    {formatCurrency(currentTotal, currency)}
                  </span>
                </div>
              </div>

              {/* Real-time Counter Calculator */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label htmlFor={discountSliderId} className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Percent className="w-3.5 h-3.5 text-blue-600" />
                    Target Counter Discount (%)
                  </label>
                  <span className="font-mono font-bold text-base text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200">
                    {proposedDiscount}%
                  </span>
                </div>

                <input
                  id={discountSliderId}
                  type="range"
                  min="0"
                  max="40"
                  step="0.5"
                  value={proposedDiscount}
                  onChange={(e) => setProposedDiscount(parseFloat(e.target.value))}
                  disabled={!canNegotiate || isSending}
                  className="w-full accent-blue-600 cursor-pointer"
                />

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-200/60 text-center">
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase">New Net Price</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {formatCurrency(proposedNetUnit, currency)}
                    </span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-blue-100">
                    <span className="text-[10px] text-slate-400 block uppercase">New Line Total</span>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      {formatCurrency(proposedTotal, currency)}
                    </span>
                  </div>
                  <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-bold block uppercase">You Save</span>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {formatCurrency(projectedSavings, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Justification Textarea */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Business Justification / Volume Commitment
                </label>
                <textarea
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="e.g., Requesting 12% discount in exchange for quarterly volume scaling or immediate PO issuance..."
                  value={counterReason}
                  onChange={(e) => setCounterReason(e.target.value)}
                  disabled={!canNegotiate || isSending}
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="w-full"
                  isLoading={isSending}
                  disabled={!canNegotiate || isSending || proposedDiscount === currentDiscount}
                  icon={Sparkles}
                >
                  Submit Counter-Offer for Evaluation
                </Button>
                <p className="text-[10px] text-slate-400 text-center mt-1.5">
                  The automated pricing engine will verify pre-approved governance limits and alert your sales rep.
                </p>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {isLoadingComments ? (
                <div className="py-12 flex justify-center">
                  <LoadingSpinner size="md" />
                </div>
              ) : comments.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  No inquiries yet on this line item. Type below to ask questions directly.
                </div>
              ) : (
                comments.map((c) => {
                  const isCustomer = c.AuthorType === 'Customer' || c.authorType === 'Customer';
                  return (
                    <div
                      key={c.Id || c.id || Math.random()}
                      className={`flex flex-col space-y-1 ${isCustomer ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                        {isCustomer ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3 text-blue-500" />}
                        <span className="font-medium text-slate-600">{c.AuthorName || c.authorName || (isCustomer ? 'You' : 'Sales Representative')}</span>
                        <span>•</span>
                        <span>{c.CreatedAtUtc || c.CreatedAt ? new Date(c.CreatedAtUtc || c.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </div>
                      <div
                        className={`p-3 rounded-xl text-xs max-w-[85%] ${
                          isCustomer
                            ? 'bg-blue-600 text-white rounded-br-xs'
                            : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                        }`}
                      >
                        {c.Comment || c.comment}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Discussion Input Footer (Active in Chat Tab) */}
        {activeTab === 'chat' && (
          <form onSubmit={handleCommentSubmit} className="p-4 border-t border-slate-200 bg-white">
            <div className="relative">
              <input
                type="text"
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask about delivery dates, warranty, or scope..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={!newComment.trim() || isSending}
                className="absolute right-2 top-2 p-1.5 text-blue-600 hover:text-blue-800 disabled:text-slate-300 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

