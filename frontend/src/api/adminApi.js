import { apiClient } from './apiClient';

export const adminApi = {
  // Platform Analytics & Audit Logs
  getPlatformOverview: () => apiClient.get('admin/analytics/platform-overview'),
  getAuditLogs: (take = 50) => apiClient.get(`admin/audit-logs?take=${take}`),

  // Users
  getUsers: () => apiClient.get('admin/users'),
  createUser: (data) => apiClient.post('admin/users', data),
  updateUser: (id, data) => apiClient.put(`admin/users/${id}`, data),

  // Customer Tiers
  getCustomerTiers: () => apiClient.get('admin/customer-tiers'),
  createCustomerTier: (data) => apiClient.post('admin/customer-tiers', data),
  updateCustomerTier: (id, data) => apiClient.put(`admin/customer-tiers/${id}`, data),

  // Categories
  getCategories: () => apiClient.get('admin/categories'),
  createCategory: (data) => apiClient.post('admin/categories', data),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.isActive !== undefined && params.isActive !== null) query.append('isActive', params.isActive);
    const qs = query.toString();
    return apiClient.get(qs ? `admin/products?${qs}` : 'admin/products');
  },
  getProductById: (id) => apiClient.get(`admin/products/${id}`),
  createProduct: (data) => apiClient.post('admin/products', data),
  updateProduct: (id, data) => apiClient.put(`admin/products/${id}`, data),
  toggleProductStatus: (id) => apiClient.post(`admin/products/${id}/toggle-status`),

  // Price Lists
  getPriceLists: () => apiClient.get('admin/price-lists'),
  getPriceListById: (id) => apiClient.get(`admin/price-lists/${id}`),
  createPriceList: (data) => apiClient.post('admin/price-lists', data),
  updatePriceList: (id, data) => apiClient.put(`admin/price-lists/${id}`, data),
  togglePriceListStatus: (id) => apiClient.post(`admin/price-lists/${id}/toggle-status`),
  upsertPriceListItem: (id, data) => apiClient.post(`admin/price-lists/${id}/items`, data),
  deletePriceListItem: (priceListId, productId) => apiClient.delete(`admin/price-lists/${priceListId}/items/${productId}`),
  deletePriceList: (id) => apiClient.delete(`admin/price-lists/${id}`),

  // Discount Rules
  getDiscountRules: () => apiClient.get('admin/discount-rules'),
  createDiscountRule: (data) => apiClient.post('admin/discount-rules', data),
  updateDiscountRule: (id, data) => apiClient.put(`admin/discount-rules/${id}`, data),
  deleteDiscountRule: (id) => apiClient.delete(`admin/discount-rules/${id}`),

  // Approval Rules
  getApprovalRules: () => apiClient.get('admin/approval-rules'),
  createApprovalRule: (data) => apiClient.post('admin/approval-rules', data),
  updateApprovalRule: (id, data) => apiClient.put(`admin/approval-rules/${id}`, data),
  deleteApprovalRule: (id) => apiClient.delete(`admin/approval-rules/${id}`),

  // Warehouses & Stock
  getWarehouses: () => apiClient.get('admin/warehouses'),
  getWarehouseById: (id) => apiClient.get(`admin/warehouses/${id}`),
  createWarehouse: (data) => apiClient.post('admin/warehouses', data),
  updateWarehouse: (id, data) => apiClient.put(`admin/warehouses/${id}`, data),
  toggleWarehouseStatus: (id) => apiClient.post(`admin/warehouses/${id}/toggle-status`),
  getWarehouseStocks: (id) => apiClient.get(`admin/warehouses/${id}/stock`),
  getAllInventory: () => apiClient.get('admin/inventory'),
  adjustStock: (id, data) => apiClient.post(`admin/warehouses/${id}/adjust-stock`, data),

  // Sales Teams
  getSalesTeams: () => apiClient.get('admin/sales-teams'),
  createSalesTeam: (data) => apiClient.post('admin/sales-teams', data),

  // Subscription Plans
  getSubscriptionPlans: () => apiClient.get('admin/subscription-plans'),
  createSubscriptionPlan: (data) => apiClient.post('admin/subscription-plans', data),
  updateSubscriptionPlan: (id, data) => apiClient.put(`admin/subscription-plans/${id}`, data),
  toggleSubscriptionPlanStatus: (id) => apiClient.post(`admin/subscription-plans/${id}/toggle-status`),

  // Upsell Rules
  getUpsellRules: () => apiClient.get('admin/upsell-rules'),
  createUpsellRule: (data) => apiClient.post('admin/upsell-rules', data),
  updateUpsellRule: (id, data) => apiClient.put(`admin/upsell-rules/${id}`, data),
  deleteUpsellRule: (id) => apiClient.delete(`admin/upsell-rules/${id}`),

  // Product Variants
  getProductVariants: (productId) => apiClient.get(`admin/products/${productId}/variants`),
  createProductVariant: (productId, data) => apiClient.post(`admin/products/${productId}/variants`, data),
  updateProductVariant: (productId, variantId, data) => apiClient.put(`admin/products/${productId}/variants/${variantId}`, data),
  deleteProductVariant: (productId, variantId) => apiClient.delete(`admin/products/${productId}/variants/${variantId}`),

  // Replenishment Rules
  getReplenishmentRules: (warehouseId) => apiClient.get(warehouseId ? `admin/replenishment-rules?warehouseId=${warehouseId}` : 'admin/replenishment-rules'),
  createReplenishmentRule: (data) => apiClient.post('admin/replenishment-rules', data),
  updateReplenishmentRule: (id, data) => apiClient.put(`admin/replenishment-rules/${id}`, data),
  deleteReplenishmentRule: (id) => apiClient.delete(`admin/replenishment-rules/${id}`),
};

export default adminApi;
