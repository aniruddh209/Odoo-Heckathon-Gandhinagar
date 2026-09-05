import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { quotationApi } from '../api';
import { Button } from '../components/common/Button';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Plus,
  Search,
  Eye,
  Copy,
  Trash2,
} from 'lucide-react';
import { QuotationDto, QuotationStatus } from '../types';

export const QuotationListPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['quotations', page, searchTerm, statusFilter],
    queryFn: () =>
      quotationApi.getQuotations({
        PageNumber: page,
        PageSize: 10,
        SearchTerm: searchTerm || undefined,
        Status: (statusFilter as QuotationStatus) || undefined,
      }),
  });

  const cloneMutation = useMutation({
    mutationFn: (id: string) => quotationApi.cloneQuotation(id),
    onSuccess: (newQuote: QuotationDto) => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
      navigate(`/quotations/${newQuote.Id}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => quotationApi.deleteQuotation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotations'] });
    },
  });

  const quotes: QuotationDto[] = data?.Items || [];
  const totalPages = data?.TotalPages || 1;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quotation Workspace</h1>
          <p className="text-xs text-slate-500">
            Create, price, and govern dynamic commercial offers and contracts
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => navigate('/pipeline')}>
            Kanban View
          </Button>
          <Button onClick={() => navigate('/quotations/new')}>
            <Plus className="w-4 h-4 mr-1.5" />
            New Quotation
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by quote #, customer name, contact..."
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="w-full md:w-56">
          <select
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Workflow Statuses</option>
            <option value={QuotationStatus.Draft}>Draft</option>
            <option value={QuotationStatus.InReview}>In Review (Approvals)</option>
            <option value={QuotationStatus.Approved}>Approved</option>
            <option value={QuotationStatus.SentToCustomer}>Sent to Customer</option>
            <option value={QuotationStatus.Accepted}>Accepted / Bound</option>
            <option value={QuotationStatus.Ordered}>Converted to Order</option>
            <option value={QuotationStatus.Rejected}>Rejected</option>
            <option value={QuotationStatus.Expired}>Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Quote #</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Expires</th>
                <th className="py-3.5 px-4 text-right">Discount</th>
                <th className="py-3.5 px-4 text-right">Margin %</th>
                <th className="py-3.5 px-4 text-right">Net Total</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <LoadingSpinner size="md" />
                  </td>
                </tr>
              ) : quotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No quotations match your criteria.
                  </td>
                </tr>
              ) : (
                quotes.map((q: QuotationDto) => {
                  const isDraft = q.Status === QuotationStatus.Draft;
                  return (
                    <tr key={q.Id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span
                          onClick={() => navigate(`/quotations/${q.Id}`)}
                          className="font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                        >
                          {q.QuotationNumber}
                        </span>
                        <div className="text-xs text-slate-400">v{q.VersionNumber}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800">{q.CustomerName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {q.ExpirationDate ? new Date(q.ExpirationDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-600">
                        {(q.TotalDiscountAmount ?? q.totalDiscountAmount ?? 0) > 0 ? `-$${(q.TotalDiscountAmount ?? q.totalDiscountAmount ?? 0).toLocaleString()}` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {q.OrderGrossMarginPercent !== undefined ? (
                          <span
                            className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full ${
                              q.OrderGrossMarginPercent < 15
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}
                          >
                            {q.OrderGrossMarginPercent.toFixed(1)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        ${(q.TotalAmount ?? q.totalNetAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                            q.Status === QuotationStatus.Accepted || q.Status === QuotationStatus.Ordered
                              ? 'bg-emerald-100 text-emerald-800'
                              : q.Status === QuotationStatus.InReview
                              ? 'bg-amber-100 text-amber-800'
                              : q.Status === QuotationStatus.SentToCustomer
                              ? 'bg-indigo-100 text-indigo-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {q.Status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/quotations/${q.Id}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                            title="Inspect quotation"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => cloneMutation.mutate(q.Id)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                            title="Clone quotation"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {isDraft && (
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete draft quotation ${q.QuotationNumber}?`)) {
                                  deleteMutation.mutate(q.Id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                              title="Delete draft"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages} ({data?.TotalCount || 0} total quotations)
            </span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
