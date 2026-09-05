import { apiClient } from './apiClient.js';

export const adminApi = {
  // Discount Rules
  getDiscountRules: () => apiClient.get('/discount-rules'),
  getDiscountMatrix: () => apiClient.get('/discount-rules'),
  createDiscountRule: (data) => apiClient.post('/discount-rules', data),
  updateDiscountRule: (id, data) => apiClient.put(`/discount-rules/${id}`, data),
  updateDiscountMatrixRule: (id, data) => apiClient.put(`/discount-rules/${id}`, data),

  // Approval Rules / Policies
  getApprovalRules: () => apiClient.get('/approval-rules'),
  getApprovalPolicies: () => apiClient.get('/approval-rules'),
  createApprovalRule: (data) => apiClient.post('/approval-rules', data),
  updateApprovalRule: (id, data) => apiClient.put(`/approval-rules/${id}`, data),
  updateApprovalPolicy: (id, data) => apiClient.put(`/approval-rules/${id}`, data),

  // Warehouses
  getWarehouses: () => apiClient.get('/warehouses'),
  createWarehouse: (data) => apiClient.post('/warehouses', data),
  updateWarehouse: (id, data) => apiClient.put(`/warehouses/${id}`, data),
  getWarehouseStock: (warehouseId) => apiClient.get(`/warehouses/${warehouseId}/stock`),
  updateStock: (warehouseId, productId, quantity) =>
    apiClient.put(`/warehouses/${warehouseId}/stock/${productId}`, { quantity }),

  // Subscription Plans
  getSubscriptionPlans: () => apiClient.get('/subscription-plans'),
  createSubscriptionPlan: (data) => apiClient.post('/subscription-plans', data),
  updateSubscriptionPlan: (id, data) => apiClient.put(`/subscription-plans/${id}`, data),

  // Upsell Rules
  getUpsellRules: () => apiClient.get('/upsell-rules'),
  createUpsellRule: (data) => apiClient.post('/upsell-rules', data),
  updateUpsellRule: (id, data) => apiClient.put(`/upsell-rules/${id}`, data),
};
