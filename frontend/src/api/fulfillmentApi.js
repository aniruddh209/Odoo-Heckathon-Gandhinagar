import { apiClient } from './apiClient.js';

export const fulfillmentApi = {
  getWarehouses: () => apiClient.get('/warehouses'),
  getWarehouseStocks: (warehouseId) =>
    apiClient.get(`/warehouses/${warehouseId}/stock`),

  getFulfillmentOrders: () => apiClient.get('/orders/pending-fulfillment'),

  getFulfillmentPreview: (orderId) =>
    apiClient.get(`/orders/${orderId}/fulfillment-preview`),
  getSplitRecommendation: (orderId) =>
    apiClient.get(`/orders/${orderId}/fulfillment-preview`),

  acceptFulfillment: (orderId) =>
    apiClient.post(`/orders/${orderId}/fulfillment/accept`),
  applySplitAllocation: (orderId) =>
    apiClient.post(`/orders/${orderId}/fulfillment/accept`),

  overrideFulfillment: (orderId, data) =>
    apiClient.put(`/orders/${orderId}/fulfillment/override`, data),
  manualAllocationOverride: (data) =>
    apiClient.put(`/orders/${data.OrderId || data.orderId}/fulfillment/override`, {
      allocations: [
        {
          orderLineId: Number(data.OrderLineId || data.orderLineId || 1),
          warehouseId: Number(data.WarehouseId || data.warehouseId),
          allocatedQuantity: Number(data.AllocatedQuantity || data.allocatedQuantity),
        },
      ],
    }),

  getBackorders: (orderId) =>
    orderId
      ? apiClient.get(`/orders/${orderId}/backorders`)
      : apiClient.get('/backorders'),

  consolidateBackorders: (orderId) =>
    apiClient.post(`/orders/${orderId}/backorders/consolidate`),
};
