import { apiClient } from './apiClient.js';

export const productApi = {
  getCategories: () => apiClient.get('/admin/categories'),
  createCategory: (data) => apiClient.post('/admin/categories', data),

  getProducts: async () => {
    const result = await apiClient.get('/admin/products');
    if (Array.isArray(result)) {
      return {
        Items: result,
        TotalCount: result.length,
        PageNumber: 1,
        PageSize: result.length,
        TotalPages: 1,
      };
    }
    if (result && result.items) {
      return {
        Items: result.items,
        TotalCount: result.totalCount ?? result.items.length,
        PageNumber: result.pageNumber ?? 1,
        PageSize: result.pageSize ?? 10,
        TotalPages: result.totalPages ?? 1,
      };
    }
    return result;
  },

  getProductById: (id) => apiClient.get(`/admin/products/${id}`),
  createProduct: (data) => apiClient.post('/admin/products', data),
  updateProduct: (id, data) => apiClient.put(`/admin/products/${id}`, data),

  getPriceLists: () => apiClient.get('/admin/price-lists'),
  createPriceList: (data) => apiClient.post('/admin/price-lists', data),

  addPriceListItem: (priceListId, data) =>
    apiClient.post(`/admin/price-lists/${priceListId}/items`, data),
  updatePriceListItem: (priceListId, itemId, data) =>
    apiClient.post(`/admin/price-lists/${priceListId}/items`, data),
};

