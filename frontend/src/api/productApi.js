import { apiClient } from './apiClient.js';

export const productApi = {
  getCategories: () => apiClient.get('/categories'),
  createCategory: (data) => apiClient.post('/categories', data),
  updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data),

  getProducts: async (searchOrParams, categoryId) => {
    const params = new URLSearchParams();
    if (typeof searchOrParams === 'string') {
      if (searchOrParams) params.append('search', searchOrParams);
      if (categoryId) params.append('categoryId', categoryId.toString());
    } else if (searchOrParams && typeof searchOrParams === 'object') {
      if (searchOrParams.SearchTerm) params.append('search', searchOrParams.SearchTerm);
      if (searchOrParams.categoryId) params.append('categoryId', searchOrParams.categoryId.toString());
      if (searchOrParams.PageNumber) params.append('pageNumber', searchOrParams.PageNumber.toString());
      if (searchOrParams.PageSize) params.append('pageSize', searchOrParams.PageSize.toString());
    }
    const query = params.toString();
    const result = await apiClient.get(`/products${query ? `?${query}` : ''}`);
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

  getProductById: (id) => apiClient.get(`/products/${id}`),
  createProduct: (data) => apiClient.post('/products', data),
  updateProduct: (id, data) => apiClient.put(`/products/${id}`, data),

  getProductVariants: (productId) => apiClient.get(`/products/${productId}/variants`),
  createProductVariant: (productId, data) =>
    apiClient.post(`/products/${productId}/variants`, data),

  getPriceLists: () => apiClient.get('/price-lists'),
  createPriceList: (data) => apiClient.post('/price-lists', data),
  updatePriceList: (id, data) => apiClient.put(`/price-lists/${id}`, data),

  addPriceListItem: (priceListId, data) =>
    apiClient.post(`/price-lists/${priceListId}/items`, data),
  updatePriceListItem: (priceListId, itemId, data) =>
    apiClient.put(`/price-lists/${priceListId}/items/${itemId}`, data),
  deletePriceListItem: (priceListId, itemId) =>
    apiClient.delete(`/price-lists/${priceListId}/items/${itemId}`),
};
