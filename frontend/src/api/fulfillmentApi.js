import { apiClient } from './apiClient.js';

export const fulfillmentApi = {
  getWarehouses: () => apiClient.get('/admin/warehouses'),
  getWarehouseStocks: (warehouseId) =>
    apiClient.get(`/admin/warehouses/${warehouseId}/stock`),

  getFulfillmentOrders: () => apiClient.get('/fulfillment/backorders'),

  getFulfillmentPreview: (orderId) =>
    apiClient.get(`/fulfillment/preview/${orderId}`),
  getSplitRecommendation: (orderId) =>
    apiClient.get(`/fulfillment/preview/${orderId}`),

  executeAllocation: (orderId) =>
    apiClient.post(`/fulfillment/allocate/${orderId}`),
  acceptFulfillment: (orderId) =>
    apiClient.post(`/fulfillment/allocate/${orderId}`),
  applySplitAllocation: (orderId) =>
    apiClient.post(`/fulfillment/allocate/${orderId}`),

  getBackorders: () =>
    apiClient.get('/fulfillment/backorders'),

  replenishStock: (warehouseId, productId) =>
    apiClient.post(`/fulfillment/replenish?warehouseId=${warehouseId}&productId=${productId}`),

  adjustStock: (warehouseId, productId, onHand) =>
    apiClient.post(`/admin/warehouses/${warehouseId}/adjust-stock`, {
      productId: Number(productId),
      onHand: Number(onHand),
    }),
};

