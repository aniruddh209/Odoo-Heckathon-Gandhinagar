import React, { useState } from 'react';
import { Button } from '../common/Button';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { X, Send, MessageSquare, User, Shield } from 'lucide-react';

export const LineNegotiationDrawer = ({
  isOpen,
  onClose,
  line,
  comments = [],
  isLoadingComments = false,
  onSendComment,
  isSending = false,
}) => {
  const [newComment, setNewComment] = useState('');

  if (!isOpen || !line) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onSendComment(newComment.trim());
    setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Line Item Negotiation</h3>
              <p className="text-xs text-slate-500 font-mono truncate max-w-[260px]">{line.ProductName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Summary Card */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">SKU:</span>
            <span className="font-mono text-slate-700">{line.ProductSku}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Contract Quantity:</span>
            <span className="font-semibold text-slate-800">{line.Quantity}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Net Unit Price:</span>
            <span className="font-mono font-bold text-slate-900">${(line.UnitNetPrice ?? line.unitPrice ?? 0).toFixed(2)}</span>
          </div>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoadingComments ? (
            <div className="py-12 flex justify-center">
              <LoadingSpinner size="md" />
            </div>
          ) : comments.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              No comments yet on this line item. Type below to inquire or suggest alternatives.
            </div>
          ) : (
            comments.map((c) => {
              const isCustomer = c.AuthorType === 'Customer';
              return (
                <div
                  key={c.Id || c.id}
                  className={`flex flex-col space-y-1 ${isCustomer ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                    {isCustomer ? <User className="w-3 h-3" /> : <Shield className="w-3 h-3 text-blue-500" />}
                    <span className="font-medium text-slate-600">{c.AuthorName}</span>
                    <span>•</span>
                    <span>{c.CreatedAt ? new Date(c.CreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                  </div>
                  <div
                    className={`p-3 rounded-xl text-xs max-w-[85%] ${
                      isCustomer
                        ? 'bg-blue-600 text-white rounded-br-xs'
                        : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {c.Comment}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Comment Input Footer */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-200 bg-white">
          <div className="relative">
            <input
              type="text"
              className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ask about bulk pricing, specifications, or lead times..."
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
      </div>
    </div>
  );
};
