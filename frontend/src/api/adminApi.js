import { apiClient } from './apiClient.js';

export const adminApi = {
  // Users
  getUsers: () => apiClient.get('/admin/users'),
  createUser: (data) => apiClient.post('/admin/users', data),
  updateUser: (id, data) => apiClient.put(`/admin/users/${id}`, data),

  // Discount Rules
  getDiscountRules: () => apiClient.get('/admin/discount-rules'),
  getDiscountMatrix: () => apiClient.get('/admin/discount-rules'),
  createDiscountRule: (data) => apiClient.post('/admin/discount-rules', data),

  // Approval Rules
  getApprovalRules: () => apiClient.get('/admin/approval-rules'),
  getApprovalPolicies: () => apiClient.get('/admin/approval-rules'),
  createApprovalRule: (data) => apiClient.post('/admin/approval-rules', data),

  // Warehouses
  getWarehouses: () => apiClient.get('/admin/warehouses'),
  createWarehouse: (data) => apiClient.post('/admin/warehouses', data),
  adjustStock: (id, data) => apiClient.post(`/admin/warehouses/${id}/adjust-stock`, data),

  // Subscription Plans
  getSubscriptionPlans: () => apiClient.get('/admin/subscription-plans'),
  createSubscriptionPlan: (data) => apiClient.post('/admin/subscription-plans', data),

  // Upsell Rules
  getUpsellRules: () => apiClient.get('/admin/upsell-rules'),
  createUpsellRule: (data) => apiClient.post('/admin/upsell-rules', data),

  // Sales Teams
  getSalesTeams: () => apiClient.get('/admin/sales-teams'),
  createSalesTeam: (data) => apiClient.post('/admin/sales-teams', data),

  // Customer Tiers
  getCustomerTiers: () => apiClient.get('/admin/customer-tiers'),
  createCustomerTier: (data) => apiClient.post('/admin/customer-tiers', data),
};

