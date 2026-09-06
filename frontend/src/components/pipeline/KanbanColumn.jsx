import React, { useState } from 'react';
import { KanbanCard } from './KanbanCard';
import { formatCompactCurrency } from '../../utils/formatters';
import { Inbox } from 'lucide-react';

export const KanbanColumn = ({
  stage,
  quotes = [],
  onCardClick,
  onCardDragStart,
  onCardDrop,
  draggingQuoteId,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const stageTotal = quotes.reduce((sum, q) => sum + (Number(q.grandTotal) || 0), 0);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const quoteId = e.dataTransfer.getData('text/plain');
    if (quoteId) {
      onCardDrop?.(Number(quoteId), stage.key);
    }
  };

  // Subtle accent indicator
  const getStageAccent = (key) => {
    switch (key) {
      case 'Draft':
        return { dot: 'bg-slate-400', countBg: 'bg-slate-100 text-slate-600' };
      case 'PendingApproval':
        return { dot: 'bg-amber-400', countBg: 'bg-amber-50 text-amber-700' };
      case 'Approved':
        return { dot: 'bg-emerald-500', countBg: 'bg-emerald-50 text-emerald-700' };
      case 'UnderNegotiation':
        return { dot: 'bg-blue-500', countBg: 'bg-blue-50 text-blue-700' };
      case 'ConvertedToOrder':
        return { dot: 'bg-slate-700', countBg: 'bg-slate-100 text-slate-700' };
      default:
        return { dot: 'bg-slate-400', countBg: 'bg-slate-100 text-slate-600' };
    }
  };

  const accent = getStageAccent(stage.key);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`bg-slate-50/70 rounded-2xl p-2.5 border transition-all duration-150 flex flex-col min-w-[250px] max-w-[320px] flex-1 ${
        isDragOver
          ? 'border-blue-400 bg-blue-50/30 ring-2 ring-blue-400/20'
          : 'border-slate-200/70 hover:border-slate-300/70'
      }`}
    >
      {/* Column Header */}
      <div className="px-2 pt-1 pb-2.5 mb-2 border-b border-slate-200/70">
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={`w-2 h-2 rounded-full ${accent.dot} shrink-0`} />
            <h3 className="text-xs font-bold text-slate-800 tracking-tight truncate">
              {stage.title}
            </h3>
          </div>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${accent.countBg} border border-slate-200/50`}
          >
            {quotes.length}
          </span>
        </div>

        {/* Secondary Info: Count & Total Value */}
        <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500 font-medium">
          <span>{quotes.length === 1 ? '1 deal' : `${quotes.length} deals`}</span>
          <span className="font-mono font-semibold text-slate-700">
            {formatCompactCurrency(stageTotal)}
          </span>
        </div>
      </div>

      {/* Cards Scroll Area */}
      <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-270px)] min-h-[140px] px-0.5 py-0.5">
        {quotes.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-center p-3 rounded-xl border border-dashed border-slate-200 text-slate-400">
            <Inbox className="w-5 h-5 mb-1.5 text-slate-300 stroke-[1.5]" />
            <span className="text-[11px] font-medium">No deals here</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Stage is currently empty</span>
          </div>
        ) : (
          quotes.map((q) => (
            <KanbanCard
              key={q.id}
              quote={q}
              onClick={onCardClick}
              onDragStart={onCardDragStart}
              isDragging={draggingQuoteId === q.id}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
