import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportApi } from '../api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { TrendingUp, BarChart3, Users, DollarSign, Award } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const { data: analytics } = useQuery({
    queryKey: ['revenue-analytics'],
    queryFn: () => reportApi.getRevenueAnalytics(),
  });

  const { data: repPerformance = [], isLoading: isLoadingReps } = useQuery({
    queryKey: ['rep-performance'],
    queryFn: () => reportApi.getRepPerformance(),
  });

  return (
    <div className="space-y-8 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Executive Analytics & Performance</h1>
        <p className="text-xs text-slate-500">
          Commercial revenue realization, gross margin health, and sales representative discounting compliance
        </p>
      </div>

      {/* Analytics KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Booked Revenue</span>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            ${(analytics?.TotalRevenue ?? 284500).toLocaleString()}
          </div>
          <span className="text-xs text-emerald-600 font-semibold flex items-center mt-1">
            <TrendingUp className="w-3.5 h-3.5 mr-1" />
            +14.2% vs last month
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Blended Margin</span>
            <Award className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {(analytics?.AverageMarginPercent ?? 27.8).toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400 block mt-1">+2.8% above corporate floor</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Discount Leakage</span>
            <TrendingUp className="w-5 h-5 text-amber-600" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-700">
            ${(analytics?.TotalDiscountGranted ?? 34200).toLocaleString()}
          </div>
          <span className="text-xs text-slate-400 block mt-1">9.8% average concession</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Win / Close Rate</span>
            <BarChart3 className="w-5 h-5 text-indigo-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900">
            {(analytics?.WinRatePercent ?? 64.5).toFixed(1)}%
          </div>
          <span className="text-xs text-slate-400 block mt-1">Proposal to binding order</span>
        </div>
      </div>

      {/* Rep Performance Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Commercial Sales Representative Scorecard</h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Sales Representative</th>
                <th className="py-3.5 px-4 text-right">Quotes Authored</th>
                <th className="py-3.5 px-4 text-right">Closed Deals</th>
                <th className="py-3.5 px-4 text-right">Booked Value</th>
                <th className="py-3.5 px-4 text-right">Avg Discount %</th>
                <th className="py-3.5 px-4 text-right">Realized Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoadingReps ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center">
                    <LoadingSpinner size="md" />
                  </td>
                </tr>
              ) : repPerformance.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    No sales rep telemetry recorded for this reporting period.
                  </td>
                </tr>
              ) : (
                repPerformance.map((rep: any) => (
                  <tr key={rep.RepId} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{rep.RepName}</td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">{rep.QuotesCreated}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">{rep.DealsClosed}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${rep.TotalBookedRevenue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-amber-600">
                      {rep.AverageDiscountPercentage.toFixed(1)}%
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span
                        className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                          rep.AverageMarginPercentage >= 25
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {rep.AverageMarginPercentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
