import React from 'react';
import { AlertTriangle, TrendingDown, ArrowUpRight } from 'lucide-react';
import { Button } from '../common/Button';

export const AnomalyAlertCard = ({
  anomaly,
  onInvestigate,
}) => {
  if (!anomaly) return null;
  const isHighSeverity = anomaly.Severity === 'High';

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        isHighSeverity
          ? 'bg-rose-50/50 border-rose-200'
          : 'bg-amber-50/50 border-amber-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start space-x-3">
          <div
            className={`p-2 rounded-lg mt-0.5 ${
              isHighSeverity ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isHighSeverity ? <AlertTriangle className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800 text-sm">{anomaly.RepName}</span>
              <span
                className={`text-[11px] px-2 py-0.5 font-bold rounded-full uppercase tracking-wider ${
                  isHighSeverity ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                }`}
              >
                {anomaly.AnomalyType}
              </span>
            </div>
            <p className="text-xs text-slate-600">{anomaly.Description}</p>
            <div className="text-[11px] text-slate-400">
              Confidence / Occurrence Rate: <strong className="text-slate-700">{anomaly.Occurrences} instances</strong> detected
            </div>
          </div>
        </div>

        {onInvestigate && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onInvestigate(anomaly.RepId)}
            className="shrink-0 bg-white"
          >
            Audit
            <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        )}
      </div>
    </div>
  );
};
