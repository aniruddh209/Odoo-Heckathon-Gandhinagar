import { apiClient } from './apiClient';

export const fulfillmentApi = {
  getOrders: async () => {
    return apiClient.get('fulfillment/orders');
  },

  previewAllocation: async (orderId) => {
    return apiClient.get(`fulfillment/preview/${orderId}`);
  },

  executeAllocation: async (orderId) => {
    return apiClient.post(`fulfillment/allocate/${orderId}`);
  },

  getBackorders: async () => {
    return apiClient.get('fulfillment/backorders');
  },

  cancelBackorder: async (id) => {
    return apiClient.post(`fulfillment/backorders/${id}/cancel`);
  },

  replenishStock: async (warehouseId, productId) => {
    return apiClient.post(`fulfillment/replenish?warehouseId=${warehouseId}&productId=${productId}`);
  },
};

export default fulfillmentApi;
