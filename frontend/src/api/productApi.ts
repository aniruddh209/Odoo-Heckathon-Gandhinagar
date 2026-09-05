import { apiClient } from './client';
import type {
  PriceListDto,
  PriceListItemDto,
  ProductCategoryDto,
  ProductDto,
  ProductVariantDto,
} from '@/types/catalog';

export interface GetProductsParams {
  PageNumber?: number;
  PageSize?: number;
  SearchTerm?: string;
  categoryId?: number;
}

export const productApi = {
  getCategories: () => apiClient.get<ProductCategoryDto[]>('/categories'),
  createCategory: (data: Partial<ProductCategoryDto>) => apiClient.post<ProductCategoryDto>('/categories', data),
  updateCategory: (id: number | string, data: Partial<ProductCategoryDto>) => apiClient.put<ProductCategoryDto>(`/categories/${id}`, data),

  getProducts: async (searchOrParams?: string | GetProductsParams, categoryId?: number) => {
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
    const result = await apiClient.get<any>(`/products${query ? `?${query}` : ''}`);
    if (Array.isArray(result)) {
      return {
        Items: result as ProductDto[],
        TotalCount: result.length,
        PageNumber: 1,
        PageSize: result.length,
        TotalPages: 1,
      };
    }
    if (result && result.items) {
      return {
        Items: result.items as ProductDto[],
        TotalCount: result.totalCount ?? result.items.length,
        PageNumber: result.pageNumber ?? 1,
        PageSize: result.pageSize ?? 10,
        TotalPages: result.totalPages ?? 1,
      };
    }
    return result;
  },

  getProductById: (id: number | string) => apiClient.get<ProductDto>(`/products/${id}`),
  createProduct: (data: Partial<ProductDto>) => apiClient.post<ProductDto>('/products', data),
  updateProduct: (id: number | string, data: Partial<ProductDto>) => apiClient.put<ProductDto>(`/products/${id}`, data),

  getProductVariants: (productId: number | string) => apiClient.get<ProductVariantDto[]>(`/products/${productId}/variants`),
  createProductVariant: (productId: number | string, data: Partial<ProductVariantDto>) =>
    apiClient.post<ProductVariantDto>(`/products/${productId}/variants`, data),

  getPriceLists: () => apiClient.get<PriceListDto[]>('/price-lists'),
  createPriceList: (data: Partial<PriceListDto>) => apiClient.post<PriceListDto>('/price-lists', data),
  updatePriceList: (id: number | string, data: Partial<PriceListDto>) => apiClient.put<PriceListDto>(`/price-lists/${id}`, data),

  addPriceListItem: (priceListId: number | string, data: Partial<PriceListItemDto>) =>
    apiClient.post<PriceListItemDto>(`/price-lists/${priceListId}/items`, data),
  updatePriceListItem: (priceListId: number | string, itemId: number | string, data: Partial<PriceListItemDto>) =>
    apiClient.put<PriceListItemDto>(`/price-lists/${priceListId}/items/${itemId}`, data),
  deletePriceListItem: (priceListId: number | string, itemId: number | string) =>
    apiClient.delete<{ message: string }>(`/price-lists/${priceListId}/items/${itemId}`),
};
