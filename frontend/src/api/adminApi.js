import { apiClient } from './apiClient';

export const adminApi = {
  // Users
  getUsers: () => apiClient.get('admin/users'),
  createUser: (data) => apiClient.post('admin/users', data),
  updateUser: (id, data) => apiClient.put(`admin/users/${id}`, data),

  // Customer Tiers
  getCustomerTiers: () => apiClient.get('admin/customer-tiers'),
  createCustomerTier: (data) => apiClient.post('admin/customer-tiers', data),

  // Categories
  getCategories: () => apiClient.get('admin/categories'),
  createCategory: (data) => apiClient.post('admin/categories', data),

  // Products
  getProducts: () => apiClient.get('admin/products'),
  createProduct: (data) => apiClient.post('admin/products', data),
  updateProduct: (id, data) => apiClient.put(`admin/products/${id}`, data),

  // Price Lists
  getPriceLists: () => apiClient.get('admin/price-lists'),
  createPriceList: (data) => apiClient.post('admin/price-lists', data),
  upsertPriceListItem: (id, data) => apiClient.post(`admin/price-lists/${id}/items`, data),

  // Discount Rules
  getDiscountRules: () => apiClient.get('admin/discount-rules'),
  createDiscountRule: (data) => apiClient.post('admin/discount-rules', data),

  // Approval Rules
  getApprovalRules: () => apiClient.get('admin/approval-rules'),
  createApprovalRule: (data) => apiClient.post('admin/approval-rules', data),

  // Warehouses
  getWarehouses: () => apiClient.get('admin/warehouses'),
  createWarehouse: (data) => apiClient.post('admin/warehouses', data),
  adjustStock: (id, data) => apiClient.post(`admin/warehouses/${id}/adjust-stock`, data),

  // Sales Teams
  getSalesTeams: () => apiClient.get('admin/sales-teams'),
  createSalesTeam: (data) => apiClient.post('admin/sales-teams', data),

  // Subscription Plans
  getSubscriptionPlans: () => apiClient.get('admin/subscription-plans'),
  createSubscriptionPlan: (data) => apiClient.post('admin/subscription-plans', data),

  // Upsell Rules
  getUpsellRules: () => apiClient.get('admin/upsell-rules'),
  createUpsellRule: (data) => apiClient.post('admin/upsell-rules', data),
};

export default adminApi;
