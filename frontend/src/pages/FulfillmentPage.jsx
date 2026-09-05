import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fulfillmentApi, quotationApi, adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import {
  Button,
  Select,
  StatusBadge,
  DataTable,
  LoadingSpinner,
  ErrorAlert,
} from '../components/ui';
import {
  Truck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export const FulfillmentPage = () => {
  const [searchParams] = useSearchParams();
  const initialOrderId = searchParams.get('orderId');
  const toast = useToast();
  const { hasRole } = useAuth();
  const canExecuteFulfillment = hasRole('FinanceOperations') || hasRole('Admin');

  const [orders, setOrders] = useState([]);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrderId || '');
  const [preview, setPreview] = useState(null);
  const [backorders, setBackorders] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAllocating, setIsAllocating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedOrderId) {
      loadAllocationPreview(selectedOrderId);
    }
  }, [selectedOrderId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [ordersRes, boRes, whRes] = await Promise.all([
        fulfillmentApi.getOrders().catch(() => null),
        fulfillmentApi.getBackorders(),
        adminApi.getWarehouses(),
      ]);

      const bList = Array.isArray(boRes) ? boRes : boRes?.value || [];
      const wList = Array.isArray(whRes) ? whRes : whRes?.value || [];

      let mappedOrders = [];
      if (Array.isArray(ordersRes) && ordersRes.length > 0) {
        mappedOrders = ordersRes.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          customerName: o.customerName,
          total: o.total,
          status: o.status,
          hasAllocations: o.hasAllocations,
        }));
      } else {
        const quotesRes = await quotationApi.getQuotations({ status: 'ConvertedToOrder' }).catch(() => []);
        const qList = Array.isArray(quotesRes) ? quotesRes : quotesRes?.value || [];
        mappedOrders = qList.map((q) => ({
          id: q.orderId || q.id,
          quotationId: q.id,
          orderNumber: q.orderNumber || `ORD-${q.quotationNumber.replace('QT-', '')}`,
          customerName: q.customerName,
          total: q.grandTotal,
          status: 'Confirmed',
          hasAllocations: false,
        }));
      }

      setOrders(mappedOrders);
      setBackorders(bList);
      setWarehouses(wList);

      if (mappedOrders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(mappedOrders[0].id.toString());
      }
    } catch (err) {
      setError(err.message || 'Failed to load fulfillment data.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllocationPreview = async (orderId) => {
    try {
      const res = await fulfillmentApi.previewAllocation(orderId);
      setPreview(res);
    } catch (err) {
      console.warn('Preview allocation error:', err);
      setPreview(null);
    }
  };

  const handleExecuteAllocation = async () => {
    if (!selectedOrderId) return;
    setIsAllocating(true);
    try {
      const res = await fulfillmentApi.executeAllocation(selectedOrderId);
      setPreview(res);
      toast.success('Allocation Executed', 'Warehouse delivery splits committed to inventory.');
      // Refresh backorders and orders
      const [bo, ords] = await Promise.all([
        fulfillmentApi.getBackorders(),
        fulfillmentApi.getOrders().catch(() => null),
      ]);
      setBackorders(Array.isArray(bo) ? bo : bo?.value || []);
      if (Array.isArray(ords)) {
        setOrders(ords);
      }
    } catch (err) {
      toast.error('Allocation Failed', err.message);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleCancelBackorder = async (backorderId) => {
    try {
      await fulfillmentApi.cancelBackorder(backorderId);
      toast.success('Backorder Cancelled', `Backorder BO-${backorderId} marked as cancelled.`);
      const bo = await fulfillmentApi.getBackorders();
      setBackorders(Array.isArray(bo) ? bo : bo?.value || []);
      if (selectedOrderId) {
        await loadAllocationPreview(selectedOrderId);
      }
    } catch (err) {
      toast.error('Cancellation Failed', err.message);
    }
  };

  const handleReplenish = async (warehouseId, productId) => {
    try {
      await fulfillmentApi.replenishStock(warehouseId, productId);
      toast.success('Stock Replenished', 'Backorders consolidated automatically.');
      const bo = await fulfillmentApi.getBackorders();
      setBackorders(Array.isArray(bo) ? bo : bo?.value || []);
      if (selectedOrderId) {
        await loadAllocationPreview(selectedOrderId);
      }
    } catch (err) {
      toast.error('Replenish Failed', err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Querying multi-warehouse inventory depots..." size="lg" />;
  }

  const selectedOrder = orders.find((o) => o.id.toString() === selectedOrderId.toString());
  const isAlreadyAllocated = selectedOrder?.status === 'Allocated' || selectedOrder?.status === 'Fulfilled' || selectedOrder?.hasAllocations;

  const backorderColumns = [
    { header: 'Backorder #', accessor: 'id', render: (b) => <span className="font-mono font-bold text-slate-700">BO-{b.id}</span> },
    { header: 'Product Item', accessor: 'productName', render: (b) => <span className="font-semibold text-slate-900">{b.productName}</span> },
    { header: 'Deficit Quantity', accessor: 'quantity', render: (b) => <span className="font-bold text-rose-600">{b.quantity} Units</span> },
    { header: 'Status', accessor: 'status', render: (b) => <StatusBadge status={b.status || 'Processing'} /> },
    ...(canExecuteFulfillment
      ? [
          {
            header: 'Actions',
            render: (b) => (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => handleReplenish(warehouses[0]?.id || 1, b.productId)}
                >
                  Replenish
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => handleCancelBackorder(b.id)}
                >
                  Cancel
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Multi-Warehouse Fulfillment Split</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Greedy cost-weighted stock distribution, shipment optimization, and backorder consolidation.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={RefreshCw}
          onClick={loadInitialData}
        >
          Refresh Stock
        </Button>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadInitialData} />}

      {/* Order Selector */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Truck className="w-5 h-5 text-blue-600 shrink-0" />
          <div className="w-full sm:w-80">
            <Select
              label="Select Confirmed Sale Order"
              value={selectedOrderId}
              onChange={(e) => setSelectedOrderId(e.target.value)}
              options={orders.map((o) => ({
                value: o.id,
                label: `${o.orderNumber} - ${o.customerName} ($${o.total?.toFixed(2)})`,
              }))}
            />
          </div>
        </div>

        {preview && (
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            {canExecuteFulfillment ? (
              isAlreadyAllocated ? (
                <div className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Allocation Committed to Warehouses</span>
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  isLoading={isAllocating}
                  onClick={handleExecuteAllocation}
                >
                  Commit Warehouse Allocation
                </Button>
              )
            ) : (
              <div className="px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-600 font-medium flex items-center gap-2">
                <Truck className="w-3.5 h-3.5 text-slate-500" />
                <span>Sales Rep: Real-Time Depot Tracking (Read-Only)</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Allocation Preview View */}
      {preview ? (
        <div className="space-y-6">
          {/* Metrics summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Fulfillment Strategy</span>
              <span className="text-base font-bold text-slate-900 mt-1 block">
                {preview.isFullyAllocated ? 'Single Delivery Route' : 'Split Multi-Depot Delivery'}
              </span>
              <span className={`text-xs font-semibold mt-1 inline-block ${preview.isFullyAllocated ? 'text-emerald-600' : 'text-amber-600'}`}>
                {preview.isFullyAllocated ? '100% Stock Available' : 'Partial Stock / Backorder Triggered'}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Estimated Shipments</span>
              <span className="text-base font-bold text-slate-900 mt-1 block font-mono">
                {preview.totalShipments || 1} Separate Dispatches
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Logistics Surcharge: ${(preview.totalShipmentCost || 0).toFixed(2)}
              </span>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Backorder Deficit</span>
              <span className="text-base font-bold text-slate-900 mt-1 block font-mono">
                {preview.backorders?.length || 0} Line Items
              </span>
              <span className="text-xs text-slate-500 mt-1 block">
                Auto-consolidates upon vendor delivery receipt
              </span>
            </div>
          </div>

          {/* Allocation Breakdown Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Warehouse Distribution Breakdown
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-[11px] font-semibold text-slate-500 uppercase">
                    <th className="py-3 px-4">Allocated Warehouse</th>
                    <th className="py-3 px-4">Assigned Product</th>
                    <th className="py-3 px-4 text-right">Units Allocated</th>
                    <th className="py-3 px-4 text-right">Delivery Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {preview.allocations?.map((al, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        {al.warehouseName || `Warehouse #${al.warehouseId}`}
                      </td>
                      <td className="py-3.5 px-4">{al.productName || 'Order Product Line'}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {al.quantity} Units
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono">
                        ${(al.shipmentCost || 0).toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-slate-400 border border-dashed rounded-xl border-slate-200 bg-white text-xs">
          Select a confirmed sale order to preview warehouse stock allocation splits.
        </div>
      )}

      {/* Active Backorders Desk */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Active Operational Backorders</h2>
            <p className="text-xs text-slate-500">Unfulfilled line quantities awaiting replenishment receipts.</p>
          </div>
        </div>

        <DataTable
          columns={backorderColumns}
          data={backorders}
          emptyMessage="Zero Active Backorders"
          emptyDescription="All confirmed order quantities have been fulfilled across designated warehouses."
        />
      </div>
    </div>
  );
};

export default FulfillmentPage;
