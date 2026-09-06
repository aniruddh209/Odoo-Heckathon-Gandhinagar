import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { quotationApi } from '../api';
import { useToast } from '../context/ToastContext';
import { KanbanColumn, DealDetailDrawer } from '../components/pipeline';
import { Button, ErrorAlert } from '../components/ui';
import {
  RefreshCw,
  Plus,
  Search,
  Filter,
  X,
  Layers,
  ChevronDown,
  LayoutGrid,
  List,
} from 'lucide-react';
import { formatCompactCurrency, formatCurrency } from '../utils/formatters';

const STAGES = [
  { key: 'Draft', title: 'Draft Proposals' },
  { key: 'PendingApproval', title: 'Pending Approval' },
  { key: 'Approved', title: 'Approved / Ready' },
  { key: 'UnderNegotiation', title: 'Client Negotiation' },
  { key: 'ConvertedToOrder', title: 'Confirmed Orders' },
];

export const PipelinePage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [quotes, setQuotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Search & Filter & View State
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [selectedRep, setSelectedRep] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all'); // all, low, medium, high
  const [selectedValueRange, setSelectedValueRange] = useState('all'); // all, under1L, 1Lto5L, over5L

  // Active Deal Drawer State
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Drag and Drop tracking
  const [draggingQuoteId, setDraggingQuoteId] = useState(null);

  // Mobile Active Stage Tab
  const [mobileActiveStage, setMobileActiveStage] = useState('Draft');

  useEffect(() => {
    loadPipeline();
  }, []);

  const loadPipeline = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await quotationApi.getQuotations();
      const list = Array.isArray(res) ? res : res?.value || [];
      setQuotes(list);
    } catch (err) {
      setError(err.message || 'Failed to load pipeline data.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Extract unique sales reps for filter dropdown
  const uniqueReps = useMemo(() => {
    const reps = new Set();
    quotes.forEach((q) => {
      if (q.salesRepName) reps.add(q.salesRepName);
    });
    return Array.from(reps);
  }, [quotes]);

  // Filtered quotes based on search and filters
  const filteredQuotes = useMemo(() => {
    return quotes.filter((q) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesCustomer = q.customerName?.toLowerCase().includes(query);
        const matchesNumber = q.quotationNumber?.toLowerCase().includes(query);
        const matchesRep = q.salesRepName?.toLowerCase().includes(query);
        if (!matchesCustomer && !matchesNumber && !matchesRep) return false;
      }

      // Sales Rep filter
      if (selectedRep !== 'all' && q.salesRepName !== selectedRep) {
        return false;
      }

      // Risk filter
      if (selectedRisk !== 'all') {
        const risk = Number(q.riskScore) || 0;
        if (selectedRisk === 'low' && risk >= 30) return false;
        if (selectedRisk === 'medium' && (risk < 30 || risk >= 70)) return false;
        if (selectedRisk === 'high' && risk < 70) return false;
      }

      // Value range filter
      if (selectedValueRange !== 'all') {
        const total = Number(q.grandTotal) || 0;
        if (selectedValueRange === 'under1L' && total >= 100000) return false;
        if (selectedValueRange === '1Lto5L' && (total < 100000 || total > 500000)) return false;
        if (selectedValueRange === 'over5L' && total <= 500000) return false;
      }

      return true;
    });
  }, [quotes, searchQuery, selectedRep, selectedRisk, selectedValueRange]);

  const activeFiltersCount =
    (selectedRep !== 'all' ? 1 : 0) +
    (selectedRisk !== 'all' ? 1 : 0) +
    (selectedValueRange !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSelectedRep('all');
    setSelectedRisk('all');
    setSelectedValueRange('all');
    setSearchQuery('');
  };

  const totalPipeline = filteredQuotes.reduce(
    (sum, q) => sum + (Number(q.grandTotal) || 0),
    0
  );

  // Handle Card Click -> Opens Detail Drawer
  const handleCardClick = (quote) => {
    setSelectedQuote(quote);
    setIsDrawerOpen(true);
  };

  // Handle Drag Start
  const handleCardDragStart = (e, quote) => {
    setDraggingQuoteId(quote.id);
    e.dataTransfer.setData('text/plain', String(quote.id));
    e.dataTransfer.setData('sourceStage', quote.status);
  };

  // Handle Drop with Workflow Validation
  const handleCardDrop = async (quoteId, targetStageKey) => {
    setDraggingQuoteId(null);
    const quote = quotes.find((q) => q.id === quoteId);
    if (!quote || quote.status === targetStageKey) return;

    // Workflow Rule 1: Moving Draft -> PendingApproval
    if (quote.status === 'Draft' && targetStageKey === 'PendingApproval') {
      try {
        await quotationApi.submitForApproval(quoteId);
        toast.success(`Quote ${quote.quotationNumber} submitted for approval`);
        loadPipeline(true);
      } catch (err) {
        toast.error(err.message || 'Failed to submit quote for approval');
      }
      return;
    }

    // Workflow Rule 2: Cannot jump straight to Approved
    if (targetStageKey === 'Approved') {
      toast.warning(
        'Approval governance required: Deals can only be approved through manager/finance review.'
      );
      return;
    }

    // Workflow Rule 3: Cannot jump straight to Confirmed
    if (targetStageKey === 'ConvertedToOrder') {
      toast.warning(
        'Customer confirmation required: Orders can only be confirmed via the Customer Portal.'
      );
      return;
    }

    // Workflow Rule 4: Disallow arbitrary stage skips
    toast.info(
      `Direct transition from ${quote.status} to ${targetStageKey} requires completing stage prerequisites.`
    );
  };

  return (
    <div className="space-y-4">
      {/* ─── 1. Clean SaaS Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/60">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              CRM Pipeline
            </h1>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200/80">
              {formatCompactCurrency(totalPipeline)} total
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Track active deals across each stage.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => loadPipeline(true)}
            disabled={isRefreshing}
            title="Refresh live pipeline data"
            className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg border border-slate-200/90 hover:bg-slate-50 text-slate-600 text-xs font-medium transition-colors flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-slate-400/20"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/workspace/quotations/new')}
            className="shadow-2xs font-semibold"
          >
            New Quote
          </Button>
        </div>
      </div>

      {/* ─── 2. Search & Compact Filters Bar ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search deals, customers, quotes..."
            className="w-full pl-8 pr-8 py-1.5 bg-white rounded-lg border border-slate-200/90 text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 absolute right-2 top-1/2 -translate-y-1/2"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* View Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100/80 p-0.5 rounded-lg border border-slate-200/60">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban Board</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'list'
                  ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Detailed List</span>
            </button>
          </div>

          {/* Filter Trigger & Popover */}
          <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400/20 ${
              activeFiltersCount > 0
                ? 'bg-blue-50/80 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors"
            >
              Clear
            </button>
          )}

          {/* Filter Popover Dropdown */}
          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setIsFilterOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1.5 w-72 p-3 bg-white rounded-xl border border-slate-200/90 shadow-lg z-40 space-y-3 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-semibold text-slate-900">Filter Deals</span>
                  <button
                    type="button"
                    onClick={() => setIsFilterOpen(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Risk Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Risk Level
                  </label>
                  <select
                    value={selectedRisk}
                    onChange={(e) => setSelectedRisk(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="low">Low Risk (&lt; 30)</option>
                    <option value="medium">Medium Risk (30–70)</option>
                    <option value="high">High Risk (&ge; 70)</option>
                  </select>
                </div>

                {/* Sales Rep Filter */}
                {uniqueReps.length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                      Sales Representative
                    </label>
                    <select
                      value={selectedRep}
                      onChange={(e) => setSelectedRep(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                    >
                      <option value="all">All Sales Representatives</option>
                      {uniqueReps.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Deal Value Filter */}
                <div>
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">
                    Deal Value Range
                  </label>
                  <select
                    value={selectedValueRange}
                    onChange={(e) => setSelectedValueRange(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-200 text-xs bg-white text-slate-800 focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Amounts</option>
                    <option value="under1L">Under ₹1,00,000</option>
                    <option value="1Lto5L">₹1,00,000 – ₹5,00,000</option>
                    <option value="over5L">Over ₹5,00,000</option>
                  </select>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] text-slate-500 hover:text-slate-800"
                  >
                    Reset All
                  </button>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => setIsFilterOpen(false)}
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} onRetry={() => loadPipeline()} />}

      {/* ─── 3. Mobile Stage Switcher (Responsive Tab Bar) ───────────────── */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200/60 text-xs no-scrollbar">
        {STAGES.map((s) => {
          const count = filteredQuotes.filter((q) => q.status === s.key).length;
          const isActive = mobileActiveStage === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setMobileActiveStage(s.key)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{s.title}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ─── 4. Kanban Board Layout ──────────────────────────────────────── */}
      {isLoading ? (
        // Column Skeleton Loading State
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3.5 overflow-x-auto pb-6">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className="bg-slate-50/70 rounded-2xl p-2.5 border border-slate-200/70 min-w-[250px] space-y-2.5 animate-pulse"
            >
              <div className="h-6 bg-slate-200/60 rounded-md w-3/4 mb-2" />
              <div className="h-20 bg-white rounded-xl border border-slate-200/60" />
              <div className="h-20 bg-white rounded-xl border border-slate-200/60" />
              <div className="h-20 bg-white rounded-xl border border-slate-200/60" />
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Quote #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Sales Rep</th>
                <th className="px-4 py-3">Stage</th>
                <th className="px-4 py-3 text-right">Value</th>
                <th className="px-4 py-3 text-right">Margin</th>
                <th className="px-4 py-3 text-center">Risk</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                    No deals match your filters.
                  </td>
                </tr>
              ) : (
                filteredQuotes.map((quote) => {
                  const risk = Number(quote.riskScore) || 0;
                  const margin = Number(quote.margin) || 0;
                  return (
                    <tr key={quote.id} className="hover:bg-slate-50/60 transition-colors group">
                      <td className="px-4 py-3 font-mono font-medium text-blue-600 text-xs">
                        <button onClick={() => handleCardClick(quote)} className="hover:underline">
                          {quote.quotationNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{quote.customerName}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-xs">
                        {quote.salesRepName || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">
                          {STAGES.find(s => s.key === quote.status)?.title || quote.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(quote.grandTotal, 'INR')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          margin >= 25 ? 'bg-emerald-50 text-emerald-700' :
                          margin >= 15 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {margin > 0 ? '+' : ''}{margin.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                          risk < 30 ? 'bg-emerald-50 text-emerald-700' :
                          risk < 70 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {risk < 30 ? 'Low' : risk < 70 ? 'Med' : 'High'} ({risk})
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button variant="outline" size="xs" onClick={() => handleCardClick(quote)}>
                          Inspect
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet: 5 Flexible Columns with Horizontal Scroll */}
          <div className="hidden md:flex gap-3.5 overflow-x-auto pb-6 items-start">
            {STAGES.map((stage) => {
              const stageQuotes = filteredQuotes.filter(
                (q) => q.status === stage.key
              );
              return (
                <KanbanColumn
                  key={stage.key}
                  stage={stage}
                  quotes={stageQuotes}
                  onCardClick={handleCardClick}
                  onCardDragStart={handleCardDragStart}
                  onCardDrop={handleCardDrop}
                  draggingQuoteId={draggingQuoteId}
                />
              );
            })}
          </div>

          {/* Mobile Single-Column View (Selected via Tab) */}
          <div className="md:hidden">
            {(() => {
              const activeStageObj = STAGES.find(
                (s) => s.key === mobileActiveStage
              ) || STAGES[0];
              const stageQuotes = filteredQuotes.filter(
                (q) => q.status === activeStageObj.key
              );
              return (
                <div className="w-full">
                  <KanbanColumn
                    stage={activeStageObj}
                    quotes={stageQuotes}
                    onCardClick={handleCardClick}
                    onCardDragStart={handleCardDragStart}
                    onCardDrop={handleCardDrop}
                    draggingQuoteId={draggingQuoteId}
                  />
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* ─── 5. Deal Detail Reveal Drawer ────────────────────────────────── */}
      <DealDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedQuote(null);
        }}
        quoteSummary={selectedQuote}
        onQuoteUpdated={() => loadPipeline(true)}
      />
    </div>
  );
};

export default PipelinePage;
