export interface ProductCategoryDto {
  id: any;
  Id?: any;
  name: string;
  Name?: string;
  code: string;
  Code?: string;
  parentCategoryId?: number;
  maxCategoryDiscount?: number;
}

export type ProductType = 'OneTimeHardware' | 'Service' | 'RecurringSubscription';

export interface ProductDto {
  id: any;
  Id?: any;
  sku: string;
  Sku?: string;
  name: string;
  Name?: string;
  categoryId?: any;
  CategoryId?: any;
  categoryName?: string;
  CategoryName?: string;
  productType?: ProductType;
  ProductType?: ProductType;
  listPrice?: number;
  ListPrice?: number;
  basePrice?: number;
  BasePrice?: number;
  standardCostPrice?: number;
  StandardCostPrice?: number;
  costPrice?: number;
  CostPrice?: number;
  description?: string;
  Description?: string;
  uom?: string;
  taxRatePercent?: number;
  isPromoted?: boolean;
  minMarginThreshold?: number;
  isActive?: boolean;
  IsActive?: boolean;
  variants?: ProductVariantDto[];
  Variants?: ProductVariantDto[];
}

export interface ProductVariantDto {
  id: any;
  Id?: any;
  productId: any;
  ProductId?: any;
  sku: string;
  Sku?: string;
  variantName: string;
  VariantName?: string;
  priceExtra?: number;
  PriceAdjustment?: number;
  costExtra?: number;
  isActive?: boolean;
}

export interface ProductAttributeDto {
  id: any;
  Id?: any;
  name: string;
  description?: string;
  values?: AttributeValueDto[];
}

export interface AttributeValueDto {
  id: any;
  Id?: any;
  productAttributeId: any;
  value: string;
  displayOrder?: number;
}

export interface PriceListDto {
  id: any;
  Id?: any;
  name: string;
  Name?: string;
  currencyCode?: string;
  Currency?: string;
  CurrencyCode?: string;
  isActive?: boolean;
  validFrom?: string;
  ValidFrom?: string;
  validTo?: string;
  ValidTo?: string;
  items?: PriceListItemDto[];
}

export interface PriceListItemDto {
  id: any;
  Id?: any;
  priceListId: any;
  productId: any;
  productName?: string;
  minQuantity?: number;
  fixedPrice?: number;
}

export interface CustomerTierDto {
  id: any;
  Id?: any;
  name: string;
  Name?: string;
  maxDiscountCeiling?: number;
  defaultPriceListId?: any;
  description?: string;
  MinimumAnnualSpend?: number;
  DefaultDiscountPercentage?: number;
  PaymentTerms?: string;
}

export interface CustomerDto {
  id: any;
  Id?: any;
  name?: string;
  Name?: string;
  companyName?: string;
  CompanyName?: string;
  email: string;
  customerTierId?: any;
  customerTierName?: string;
  tierName?: string;
  TierName?: string;
  assignedRepId?: any;
  repName?: string;
  phone?: string;
  addressLine1?: string;
  city?: string;
  country?: string;
  portalToken?: string;
  isActive?: boolean;
}
