import { apiClient } from './client';
import type {
  BackorderDto,
  FulfillmentSplitPreviewDto,
  ManualAllocationOverrideRequest,
  WarehouseDto,
  WarehouseStockDto,
} from '@/types/fulfillment';

export const fulfillmentApi = {
  getWarehouses: () => apiClient.get<WarehouseDto[]>('/warehouses'),

  getWarehouseStocks: (warehouseId: number | string) =>
    apiClient.get<WarehouseStockDto[]>(`/warehouses/${warehouseId}/stock`),

  getFulfillmentOrders: () => apiClient.get<any[]>('/orders/pending-fulfillment'),

  getFulfillmentPreview: (orderId: number | string) =>
    apiClient.get<FulfillmentSplitPreviewDto>(`/orders/${orderId}/fulfillment-preview`),
  getSplitRecommendation: (orderId: number | string) =>
    apiClient.get<FulfillmentSplitPreviewDto>(`/orders/${orderId}/fulfillment-preview`),

  acceptFulfillment: (orderId: number | string) =>
    apiClient.post<{ message: string; status: string }>(`/orders/${orderId}/fulfillment/accept`),
  applySplitAllocation: (orderId: number | string) =>
    apiClient.post<{ message: string; status: string }>(`/orders/${orderId}/fulfillment/accept`),

  overrideFulfillment: (orderId: number | string, data: ManualAllocationOverrideRequest) =>
    apiClient.put<FulfillmentSplitPreviewDto>(`/orders/${orderId}/fulfillment/override`, data),
  manualAllocationOverride: (data: any) =>
    apiClient.put<FulfillmentSplitPreviewDto>(`/orders/${data.OrderId || data.orderId}/fulfillment/override`, {
      allocations: [
        {
          orderLineId: Number(data.OrderLineId || data.orderLineId || 1),
          warehouseId: Number(data.WarehouseId || data.warehouseId),
          allocatedQuantity: Number(data.AllocatedQuantity || data.allocatedQuantity),
        },
      ],
    }),

  getBackorders: (orderId?: number | string) =>
    orderId
      ? apiClient.get<BackorderDto[]>(`/orders/${orderId}/backorders`)
      : apiClient.get<BackorderDto[]>('/backorders'),

  consolidateBackorders: (orderId: number | string) =>
    apiClient.post<{ message: string; consolidatedShipmentId?: number }>(
      `/orders/${orderId}/backorders/consolidate`
    ),
};
