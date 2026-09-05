import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fulfillmentApi, quotationApi, adminApi } from '../api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../hooks/useAuth';
import {
  Button,
  Select,
  Input,
  Modal,
  Badge,
  StatusBadge,
  DataTable,
  PageHeader,
  SkeletonDashboard,
  ErrorAlert,
} from '../components/ui';
import {
  Truck,
  CheckCircle2,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Plus,
  Trash2,
  Boxes,
} from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

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
  const [isConsolidating, setIsConsolidating] = useState(false);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [overrideAllocations, setOverrideAllocations] = useState([]);
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
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

  const handleOpenOverrideModal = () => {
    if (preview?.allocations && preview.allocations.length > 0) {
      setOverrideAllocations(
        preview.allocations.map((a) => ({
          warehouseId: a.warehouseId,
          productId: a.productId,
          productName: a.productName,
          quantity: a.quantity,
        }))
      );
    } else {
      setOverrideAllocations([
        {
          warehouseId: warehouses[0]?.id || 1,
          productId: 1,
          productName: 'Default Item',
          quantity: 1,
        },
      ]);
    }
    setIsOverrideModalOpen(true);
  };

  const handleAddOverrideRow = () => {
    const firstRow = overrideAllocations[0] || {};
    setOverrideAllocations([
      ...overrideAllocations,
      {
        warehouseId: warehouses[1]?.id || warehouses[0]?.id || 1,
        productId: firstRow.productId || 1,
        productName: firstRow.productName || 'Default Item',
        quantity: 1,
      },
    ]);
  };

  const handleRemoveOverrideRow = (index) => {
    setOverrideAllocations(overrideAllocations.filter((_, idx) => idx !== index));
  };

  const handleUpdateOverrideRow = (index, field, value) => {
    const updated = [...overrideAllocations];
    updated[index] = { ...updated[index], [field]: value };
    setOverrideAllocations(updated);
  };

  const handleSaveOverride = async (e) => {
    e.preventDefault();
    if (!selectedOrderId || overrideAllocations.length === 0) return;
    setIsSubmittingOverride(true);
    try {
      const payload = overrideAllocations.map((a) => ({
        warehouseId: parseInt(a.warehouseId, 10),
        productId: parseInt(a.productId, 10),
        quantity: parseInt(a.quantity, 10) || 1,
      }));

      const res = await fulfillmentApi.overrideAllocation(selectedOrderId, payload);
      setPreview(res);
      toast.success('Manual Override Applied', 'Custom warehouse distribution committed to inventory.');
      setIsOverrideModalOpen(false);
      // Reload orders and backorders
      const [bo, ords] = await Promise.all([
        fulfillmentApi.getBackorders(),
        fulfillmentApi.getOrders().catch(() => null),
      ]);
      setBackorders(Array.isArray(bo) ? bo : bo?.value || []);
      if (Array.isArray(ords)) setOrders(ords);
    } catch (err) {
      toast.error('Override Failed', err.message);
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleConsolidateBackorders = async () => {
    if (!selectedOrderId) return;
    setIsConsolidating(true);
    try {
      const res = await fulfillmentApi.consolidateBackorders(selectedOrderId);
      toast.success(
        'Consolidation Complete',
        res.message || `Consolidated ${res.consolidatedBackordersCount || 0} backorder units from warehouse receipts.`
      );
      // Reload preview and backorders
      await Promise.all([
        loadAllocationPreview(selectedOrderId),
        fulfillmentApi.getBackorders().then((bo) => setBackorders(Array.isArray(bo) ? bo : bo?.value || [])),
      ]);
    } catch (err) {
      toast.error('Consolidation Failed', err.message);
    } finally {
      setIsConsolidating(false);
    }
  };

  if (isLoading) {
    return <SkeletonDashboard />;
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
      <PageHeader
        title="Multi-Warehouse Fulfillment Split"
        subtitle="Greedy cost-weighted stock distribution, shipment optimization, and backorder consolidation."
        badge={`${orders.length} Orders`}
        actions={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={loadInitialData}
          >
            Refresh Stock
          </Button>
        }
      />

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
                label: `${o.orderNumber} - ${o.customerName} (${formatCurrency(o.total || 0)})`,
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
                <div className="flex items-center gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CheckCircle2}
                    isLoading={isAllocating}
                    onClick={handleExecuteAllocation}
                  >
                    Accept Suggested Split
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={SlidersHorizontal}
                    onClick={handleOpenOverrideModal}
                  >
                    Manual Override
                  </Button>
                </div>
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
                Logistics Surcharge: {formatCurrency(preview.totalShipmentCost || 0)}
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
                        {formatCurrency(al.shipmentCost || 0)}
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

      {/* Manual Split Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Manual Warehouse Split Override"
        description="Override system-suggested warehouse routes and manually allocate unit quantities across fulfillment depots."
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSaveOverride} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Distribution Allocations
              </span>
              <Button
                type="button"
                variant="outline"
                size="xs"
                icon={Plus}
                onClick={handleAddOverrideRow}
              >
                Add Depot Split Line
              </Button>
            </div>

            {overrideAllocations.map((row, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-5">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Fulfillment Warehouse
                  </label>
                  <select
                    className="w-full h-8 px-2 text-xs rounded border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={row.warehouseId}
                    onChange={(e) => handleUpdateOverrideRow(idx, 'warehouseId', e.target.value)}
                    required
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Product Item
                  </label>
                  <span className="text-xs font-medium text-slate-900 block truncate py-1">
                    {row.productName || `Product #${row.productId}`}
                  </span>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Units
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full h-8 px-2 text-xs rounded border border-slate-300 bg-white font-mono font-bold text-right focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={row.quantity}
                    onChange={(e) => handleUpdateOverrideRow(idx, 'quantity', e.target.value)}
                    required
                  />
                </div>

                <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                  {overrideAllocations.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOverrideRow(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsOverrideModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmittingOverride}
            >
              Commit Split Override
            </Button>
          </div>
        </form>
      </Modal>

      {/* Active Backorders Desk */}
      <div className="space-y-3 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Active Operational Backorders</h2>
            <p className="text-xs text-slate-500">Unfulfilled line quantities awaiting replenishment receipts.</p>
          </div>
          {canExecuteFulfillment && (
            <Button
              variant="outline"
              size="sm"
              icon={Boxes}
              isLoading={isConsolidating}
              onClick={handleConsolidateBackorders}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              Consolidate Backorders
            </Button>
          )}
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
