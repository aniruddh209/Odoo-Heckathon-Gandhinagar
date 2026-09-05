import React from 'react';
import { Button } from '../common/Button.jsx';
import { Sparkles, Plus, TrendingUp } from 'lucide-react';

export const RecommendationPanel = ({
  recommendations = [],
  isLoading = false,
  onAddRecommendation,
  isAddingId = null,
}) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm animate-pulse">
        <div className="h-5 bg-slate-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-100 rounded"></div>
          <div className="h-16 bg-slate-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm text-center">
        <Sparkles className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-semibold text-slate-700">AI Upsell & Margin Optimization</h4>
        <p className="text-xs text-slate-400 mt-1">
          Add line items to receive automated complementary product & warranty suggestions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-indigo-100 p-5 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-sm">Recommended Upsell & Bundles</h4>
            <p className="text-xs text-slate-500">Suggested by basket frequency and margin enhancement</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
          {recommendations.length} available
        </span>
      </div>

      <div className="space-y-3">
        {recommendations.map((rec) => {
          const prodId = rec.ProductId ?? rec.productId;
          const prodName = rec.ProductName || rec.productName;
          const prodSku = rec.ProductSku || rec.productSku;
          const estPrice = rec.EstimatedPrice ?? rec.unitPrice ?? 0;
          const sugQty = rec.SuggestedQuantity ?? rec.suggestedQuantity ?? 1;
          const marginDelta = rec.MarginContribution ?? rec.projectedMarginDeltaPercent;
          const isAdding = isAddingId === prodId;

          return (
            <div
              key={prodId}
              className="p-3 bg-slate-50 hover:bg-indigo-50/40 border border-slate-200/80 rounded-lg transition-colors flex items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-semibold text-slate-800">{prodName}</span>
                  <span className="text-xs text-slate-400 font-mono">({prodSku})</span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-1">{rec.Reason || rec.reason || 'Recommended complement'}</p>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-600 font-medium">
                    Suggested Qty: {sugQty}
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="font-mono text-slate-800 font-semibold">
                    ${estPrice.toFixed(2)}
                  </span>
                  {marginDelta !== undefined && (
                    <>
                      <span className="text-slate-400">•</span>
                      <span className="text-emerald-700 font-semibold flex items-center">
                        <TrendingUp className="w-3 h-3 mr-0.5" />
                        +{marginDelta.toFixed(1)}% Margin
                      </span>
                    </>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={() => onAddRecommendation(rec)}
                isLoading={isAdding}
                className="shrink-0 text-indigo-700 border-indigo-200 hover:bg-indigo-50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
