import React, { useState, useEffect } from 'react';
import { fulfillmentApi } from '../api';
import { Building2, Package, MapPin } from 'lucide-react';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AdminWarehousesPage = () => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoadingWarehouses, setIsLoadingWarehouses] = useState(true);

  const [stocks, setStocks] = useState([]);
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);

  useEffect(() => {
    setIsLoadingWarehouses(true);
    fulfillmentApi.getWarehouses()
      .then((data) => {
        setWarehouses(data || []);
        if (data && data.length > 0 && !selectedWarehouseId) {
          setSelectedWarehouseId(data[0].Id);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingWarehouses(false));
  }, []);

  const activeWarehouse =
    warehouses.find((w) => w.Id === selectedWarehouseId) ||
    (warehouses.length > 0 ? warehouses[0] : null);

  useEffect(() => {
    if (!activeWarehouse?.Id) {
      setStocks([]);
      return;
    }
    setIsLoadingStocks(true);
    fulfillmentApi.getWarehouseStocks(activeWarehouse.Id)
      .then((data) => setStocks(data || []))
      .catch((err) => console.error(err))
      .finally(() => setIsLoadingStocks(false));
  }, [activeWarehouse?.Id]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Warehouse Network & Stock Hubs</h1>
        <p className="text-xs text-slate-500">
          Distribution centers, fulfillment proximity routing & real-time on-hand inventory
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Warehouses List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Fulfillment Hubs</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              {warehouses.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoadingWarehouses ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : warehouses.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No warehouses configured.
              </div>
            ) : (
              warehouses.map((w) => {
                const isSelected = activeWarehouse?.Id === w.Id;
                return (
                  <div
                    key={w.Id}
                    onClick={() => setSelectedWarehouseId(w.Id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{w.Name}</span>
                      <span className="text-xs font-mono font-bold text-blue-600">{w.Code}</span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{w.City ? `${w.City}, ${w.Country || 'US'}` : 'Primary Regional Center'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Live Stock Table */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-slate-700" />
              <h3 className="font-bold text-slate-800 text-sm">
                On-Hand Inventory: {activeWarehouse?.Name || 'Selected Hub'}
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Hub Code: {activeWarehouse?.Code || '-'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">SKU</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4 text-right">Physical On-Hand</th>
                  <th className="py-3.5 px-4 text-right">Reserved in Orders</th>
                  <th className="py-3.5 px-4 text-right">Available to Promise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {isLoadingStocks ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center">
                      <LoadingSpinner size="md" />
                    </td>
                  </tr>
                ) : stocks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      No stock records found for this location.
                    </td>
                  </tr>
                ) : (
                  stocks.map((s) => (
                    <tr key={s.Id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{s.ProductSku}</td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{s.ProductName}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-slate-700">{s.QuantityOnHand}</td>
                      <td className="py-3.5 px-4 text-right font-mono text-amber-600">{s.QuantityReserved}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-700">
                        {s.QuantityAvailable}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
