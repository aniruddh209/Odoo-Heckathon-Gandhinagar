import { apiClient } from './apiClient';

export const fulfillmentApi = {
  previewAllocation: async (orderId) => {
    return apiClient.get(`fulfillment/preview/${orderId}`);
  },

  executeAllocation: async (orderId) => {
    return apiClient.post(`fulfillment/allocate/${orderId}`);
  },

  getBackorders: async () => {
    return apiClient.get('fulfillment/backorders');
  },

  replenishStock: async (warehouseId, productId) => {
    return apiClient.post(`fulfillment/replenish?warehouseId=${warehouseId}&productId=${productId}`);
  },
};

export default fulfillmentApi;
