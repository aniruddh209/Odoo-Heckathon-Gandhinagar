import React, { useState, useEffect } from 'react';
import { productApi, customerApi } from '../api';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { DollarSign, Users } from 'lucide-react';

export const AdminPricingPage = () => {
  const [priceLists, setPriceLists] = useState([]);
  const [isLoadingPriceLists, setIsLoadingPriceLists] = useState(true);

  const [tiers, setTiers] = useState([]);
  const [isLoadingTiers, setIsLoadingTiers] = useState(true);

  useEffect(() => {
    setIsLoadingPriceLists(true);
    productApi.getPriceLists()
      .then((data) => setPriceLists(data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingPriceLists(false));

    setIsLoadingTiers(true);
    customerApi.getCustomerTiers()
      .then((data) => setTiers(data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingTiers(false));
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Pricing & Tier Matrices</h1>
          <p className="text-xs text-slate-500">
            Multi-currency price catalogs and customer account volume tiers
          </p>
        </div>
      </div>

      {/* Section 1: Price Lists */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-800 text-sm">Contracted Price Catalogs</h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
            {priceLists.length} Catalogs
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Catalog Name</th>
                <th className="py-3.5 px-4">Currency</th>
                <th className="py-3.5 px-4">Valid From</th>
                <th className="py-3.5 px-4">Valid To</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoadingPriceLists ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <LoadingSpinner size="md" />
                  </td>
                </tr>
              ) : priceLists.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                    No price lists configured.
                  </td>
                </tr>
              ) : (
                priceLists.map((pl) => (
                  <tr key={pl.Id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{pl.Name}</td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 font-bold">{pl.Currency}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {pl.ValidFrom ? new Date(pl.ValidFrom).toLocaleDateString() : 'Permanent'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {pl.ValidTo ? new Date(pl.ValidTo).toLocaleDateString() : 'Indefinite'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-emerald-50 text-emerald-700">
                        Active
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Customer Tiers */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800 text-sm">Customer Tier Definitions</h3>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full">
            {tiers.length} Tiers
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Tier Name</th>
                <th className="py-3.5 px-4 text-right">Min Annual Volume</th>
                <th className="py-3.5 px-4 text-right">Default Discount %</th>
                <th className="py-3.5 px-4">Standard Payment Terms</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoadingTiers ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center">
                    <LoadingSpinner size="md" />
                  </td>
                </tr>
              ) : tiers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-400 text-xs">
                    No customer tiers defined.
                  </td>
                </tr>
              ) : (
                tiers.map((t) => (
                  <tr key={t.Id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">{t.Name}</td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ${t.MinimumAnnualSpend?.toLocaleString() ?? 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-semibold text-amber-600">
                      {t.DefaultDiscountPercentage}%
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">{t.PaymentTerms || 'Net-30 Days'}</td>
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
