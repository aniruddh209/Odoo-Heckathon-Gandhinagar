import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fulfillmentApi } from '../api';
import {
  SplitRecommendation,
  AllocationOverrideModal,
  BackorderBanner,
} from '../components/fulfillment';
import { Button } from '../components/common/Button';
import { Alert } from '../components/common/Alert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Building2, Package } from 'lucide-react';
import { ManualAllocationOverrideRequest, WarehouseDto } from '../types';

export const FulfillmentPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);

  // Warehouses
  const { data: warehouses = [], isLoading: isLoadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => fulfillmentApi.getWarehouses(),
  });

  // Backorders
  const { data: backorders = [], isLoading: isLoadingBackorders } = useQuery({
    queryKey: ['backorders'],
    queryFn: () => fulfillmentApi.getBackorders(),
  });

  // Pending orders
  const { data: orders = [], isLoading: isLoadingOrders } = useQuery({
    queryKey: ['fulfillment-orders'],
    queryFn: () => fulfillmentApi.getFulfillmentOrders(),
  });

  // Active selected order
  const activeOrder = orders.find((o: any) => o.Id === selectedOrderId) || (orders.length > 0 ? orders[0] : null);

  // Split recommendation for active order
  const { data: splitPreview, isLoading: isLoadingSplit } = useQuery({
    queryKey: ['fulfillment-split', activeOrder?.Id],
    queryFn: () => fulfillmentApi.getSplitRecommendation(activeOrder!.Id),
    enabled: !!activeOrder?.Id,
  });

  // Apply split mutation
  const applySplitMutation = useMutation({
    mutationFn: (orderId: string) => fulfillmentApi.applySplitAllocation(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-orders'] });
      queryClient.invalidateQueries({ queryKey: ['fulfillment-split'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setAlertMessage({ type: 'success', text: 'Multi-warehouse stock allocations confirmed and pick lists created!' });
    },
    onError: (err: any) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to apply split allocation.' });
    },
  });

  // Override mutation
  const overrideMutation = useMutation({
    mutationFn: (req: ManualAllocationOverrideRequest) => fulfillmentApi.manualAllocationOverride(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fulfillment-split'] });
      setIsOverrideModalOpen(false);
      setAlertMessage({ type: 'success', text: 'Manual warehouse allocation override applied.' });
    },
    onError: (err: any) => {
      setAlertMessage({ type: 'danger', text: err?.message || 'Failed to apply allocation override.' });
    },
  });

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Multi-Warehouse Fulfillment</h1>
          <p className="text-xs text-slate-500">
            Intelligent inventory split routing, delivery SLA optimization & manual override control
          </p>
        </div>
      </div>

      {alertMessage && (
        <Alert
          variant={alertMessage.type}
          message={alertMessage.text}
          onClose={() => setAlertMessage(null)}
        />
      )}

      {/* Backorder shortage warning banner */}
      <BackorderBanner
        backorders={backorders}
        onPartialShip={() => setAlertMessage({ type: 'success', text: 'Partial shipments queued for in-stock lines.' })}
        onHoldForConsolidation={() => setAlertMessage({ type: 'success', text: 'Order held for complete replenishment consolidation.' })}
      />

      {/* Warehouse Hubs Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isLoadingWarehouses ? (
          <div className="col-span-3 py-6 flex justify-center">
            <LoadingSpinner size="md" />
          </div>
        ) : (
          warehouses.map((w: WarehouseDto) => (
            <div key={w.Id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{w.Name}</h4>
                  <p className="text-xs text-slate-400 font-mono">Code: {w.Code} | {w.City || 'Central Hub'}</p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded-full">
                Active Node
              </span>
            </div>
          ))
        )}
      </div>

      {/* Main Execution Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders Queue */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-slate-800 text-sm">Orders Ready for Allocation</h3>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              {orders.length}
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {isLoadingOrders ? (
              <div className="py-12 flex justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No orders pending fulfillment allocation.
              </div>
            ) : (
              orders.map((order: any) => {
                const isSelected = (activeOrder?.Id || orders[0]?.Id) === order.Id;
                return (
                  <div
                    key={order.Id}
                    onClick={() => setSelectedOrderId(order.Id)}
                    className={`p-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900 text-sm">{order.OrderNumber}</span>
                      <span className="text-xs font-mono font-bold text-slate-900">${order.TotalAmount.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-slate-600 font-medium">{order.CustomerName}</div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                      <span>Destination: {order.ShippingCity || 'Direct Consign'}</span>
                      <span className="capitalize text-slate-500 font-semibold">{order.FulfillmentStatus || 'Unassigned'}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Multi-Warehouse Split Recommendation */}
        <div className="lg:col-span-2">
          {isLoadingSplit ? (
            <div className="bg-white rounded-xl border border-slate-200 p-16 flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
          ) : splitPreview && activeOrder ? (
            <SplitRecommendation
              split={splitPreview}
              onApplySplit={() => applySplitMutation.mutate(activeOrder.Id)}
              onManualOverride={() => setIsOverrideModalOpen(true)}
              isApplying={applySplitMutation.isPending}
            />
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
              <Package className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700">Select an Order</h3>
              <p className="text-xs text-slate-400 mt-1">
                Select an order from the list on the left to compute and preview multi-warehouse split allocations.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Override Modal */}
      {activeOrder && (
        <AllocationOverrideModal
          isOpen={isOverrideModalOpen}
          onClose={() => setIsOverrideModalOpen(false)}
          orderId={activeOrder.Id}
          orderNumber={activeOrder.OrderNumber}
          warehouses={warehouses}
          isSubmitting={overrideMutation.isPending}
          onConfirm={(req: ManualAllocationOverrideRequest) => overrideMutation.mutate(req)}
        />
      )}
    </div>
  );
};
