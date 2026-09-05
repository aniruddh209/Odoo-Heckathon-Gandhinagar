import { apiClient } from './client';
import type { WarehouseDto, WarehouseStockDto } from '@/types/fulfillment';
import type { SubscriptionPlanDto } from '@/types/billing';

export interface DiscountRuleDto {
  id: number;
  customerTierId?: number;
  customerTierName?: string;
  productCategoryId?: number;
  categoryName?: string;
  maxRepDiscountPercent: number;
  managerApprovalFloorPercent: number;
  financeApprovalFloorPercent: number;
  effectiveDate?: string;
  isActive: boolean;
}

export interface ApprovalRuleStepDto {
  id: number;
  approvalRuleId: number;
  requiredRoleId: number;
  roleName?: string;
  stepOrder: number;
  stepName: string;
  canAutoApprove: boolean;
}

export interface ApprovalRuleDto {
  id: number;
  ruleName: string;
  minRiskScore: number;
  maxRiskScore?: number;
  minOrderValue: number;
  isActive: boolean;
  steps?: ApprovalRuleStepDto[];
}

export interface UpsellCrossSellRuleDto {
  id: number;
  sourceProductId: number;
  sourceProductName?: string;
  recommendedProductId: number;
  recommendedProductName?: string;
  ruleType: 'CrossSell' | 'Upsell' | 'BundleAddon';
  confidenceScore: number;
  isPromoted: boolean;
  promotionalText?: string;
  minMarginThreshold: number;
  isActive: boolean;
}

export const adminApi = {
  // Discount Rules
  getDiscountRules: () => apiClient.get<DiscountRuleDto[]>('/discount-rules'),
  createDiscountRule: (data: Partial<DiscountRuleDto>) => apiClient.post<DiscountRuleDto>('/discount-rules', data),
  updateDiscountRule: (id: number, data: Partial<DiscountRuleDto>) => apiClient.put<DiscountRuleDto>(`/discount-rules/${id}`, data),

  // Approval Rules
  getApprovalRules: () => apiClient.get<ApprovalRuleDto[]>('/approval-rules'),
  createApprovalRule: (data: Partial<ApprovalRuleDto>) => apiClient.post<ApprovalRuleDto>('/approval-rules', data),
  updateApprovalRule: (id: number, data: Partial<ApprovalRuleDto>) => apiClient.put<ApprovalRuleDto>(`/approval-rules/${id}`, data),

  // Warehouses
  getWarehouses: () => apiClient.get<WarehouseDto[]>('/warehouses'),
  createWarehouse: (data: Partial<WarehouseDto>) => apiClient.post<WarehouseDto>('/warehouses', data),
  updateWarehouse: (id: number, data: Partial<WarehouseDto>) => apiClient.put<WarehouseDto>(`/warehouses/${id}`, data),
  getWarehouseStock: (warehouseId: number) => apiClient.get<WarehouseStockDto[]>(`/warehouses/${warehouseId}/stock`),
  updateStock: (warehouseId: number, productId: number, quantity: number) =>
    apiClient.put<WarehouseStockDto>(`/warehouses/${warehouseId}/stock/${productId}`, { quantity }),

  // Subscription Plans
  getSubscriptionPlans: () => apiClient.get<SubscriptionPlanDto[]>('/subscription-plans'),
  createSubscriptionPlan: (data: Partial<SubscriptionPlanDto>) => apiClient.post<SubscriptionPlanDto>('/subscription-plans', data),
  updateSubscriptionPlan: (id: number, data: Partial<SubscriptionPlanDto>) => apiClient.put<SubscriptionPlanDto>(`/subscription-plans/${id}`, data),

  // Upsell Rules
  getUpsellRules: () => apiClient.get<UpsellCrossSellRuleDto[]>('/upsell-rules'),
  createUpsellRule: (data: Partial<UpsellCrossSellRuleDto>) => apiClient.post<UpsellCrossSellRuleDto>('/upsell-rules', data),
  updateUpsellRule: (id: number, data: Partial<UpsellCrossSellRuleDto>) => apiClient.put<UpsellCrossSellRuleDto>(`/upsell-rules/${id}`, data),
};
