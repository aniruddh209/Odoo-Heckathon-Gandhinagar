export interface WarehouseDto {
  id: any;
  Id?: any;
  name: string;
  Name?: string;
  code: string;
  Code?: string;
  addressLine1?: string;
  city?: string;
  City?: string;
  country?: string;
  Country?: string;
  isCentralDepot?: boolean;
  shippingCostWeight?: number;
  isActive?: boolean;
}

export interface WarehouseStockDto {
  id: any;
  Id?: any;
  warehouseId: any;
  WarehouseId?: any;
  warehouseName?: string;
  productId?: any;
  ProductId?: any;
  productName?: string;
  ProductName?: string;
  productSku?: string;
  ProductSku?: string;
  productVariantId?: any;
  variantName?: string;
  quantityOnHand: number;
  QuantityOnHand?: number;
  quantityReserved: number;
  QuantityReserved?: number;
  quantityAvailable: number;
  QuantityAvailable?: number;
  lastStockCheckAt?: string;
}

export interface WarehouseAllocationItemDto {
  id?: any;
  orderId?: any;
  orderLineId?: any;
  productId?: any;
  ProductId?: any;
  productName?: string;
  ProductName?: string;
  productSku?: string;
  ProductSku?: string;
  warehouseId?: any;
  WarehouseId?: any;
  warehouseName?: string;
  WarehouseName?: string;
  allocatedQuantity?: number;
  AllocatedQuantity?: number;
  requestedQuantity?: number;
  RequestedQuantity?: number;
  estimatedShippingCost?: number;
  estimatedDeliveryDays?: number;
  estimatedDeliveryDate?: string;
  EstimatedDeliveryDate?: string;
  carrier?: string;
  Carrier?: string;
  status?: string;
  isManualOverride?: boolean;
}

export interface FulfillmentSplitPreviewDto {
  orderId?: any;
  orderNumber?: string;
  isMultiWarehouseSplit?: boolean;
  estimatedShippingCost?: number;
  estimatedDeliveryDays?: number;
  allocations?: WarehouseAllocationItemDto[];
  Allocations?: WarehouseAllocationItemDto[];
}

export interface ManualAllocationOverrideItem {
  orderLineId?: any;
  warehouseId?: any;
  allocatedQuantity?: number;
}

export interface ManualAllocationOverrideRequest {
  allocations?: ManualAllocationOverrideItem[];
  OrderId?: any;
  OrderLineId?: any;
  WarehouseId?: any;
  AllocatedQuantity?: number;
  OverrideReason?: string;
}

export interface BackorderDto {
  id: any;
  Id?: any;
  backorderNumber?: string;
  orderId?: any;
  orderLineId?: any;
  productId?: any;
  productName?: string;
  ProductName?: string;
  productSku?: string;
  ProductSku?: string;
  targetWarehouseId?: any;
  targetWarehouseName?: string;
  deficitQuantity?: number;
  quantity?: number;
  Quantity?: number;
  status?: string;
  arrivedStockQuantity?: number;
  estimatedRestockDate?: string;
  EstimatedRestockDate?: string;
  stockArrivedAt?: string;
  consolidatedAt?: string;
}
