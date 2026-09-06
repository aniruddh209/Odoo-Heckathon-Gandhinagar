# DealFlow360 — Actual Backend ↔ Frontend API Contract Master
**Source Branch**: `origin/Backend` (`backend/DealFlow360.API/DealFlow360.API`)  
**Frontend Branch**: `frontend`  
**API Convention**: `/api/...` (Strictly unversioned; no `/api/v1`)  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. Executive Summary & Architecture Principles

1. **Strict REST & Routing**:
   - All controller routes use ASP.NET Core `[Route("api/[controller]")]`.
   - All endpoints are accessible at `/api/<controller-slug>/...`.
   - Master data configuration (Products, Categories, Customer Tiers, Price Lists, Warehouses, Subscription Plans, Upsell Rules, Sales Teams, Users) is centralized in `AdminController` under `/api/admin/...`.
   - Read-only endpoints for master data required during quotation building (`/api/admin/products`, `/api/admin/categories`, `/api/admin/customer-tiers`, `/api/admin/price-lists`, `/api/admin/warehouses`, `/api/admin/subscription-plans`) have `[AllowAnonymous]`, enabling seamless lookup by sales reps and unauthenticated quote builders.

2. **Role-Based Access Control (RBAC)**:
   - `Admin`: Full access to `/api/admin/*`, plus all management views.
   - `SalesManager`: Approvals, Deal Health, Reports Dashboard & Pipeline, Customers, Quotations.
   - `SalesRep`: Quotations, Customers, Master Data lookup.
   - `FinanceOperations`: Approvals, Fulfillment (Allocation, Backorders, Replenishment), Billing, Invoices, Reports.
   - `Customer`: Customer Portal endpoints (`/api/customers/me/quotations`, `/api/customers/me/orders`, `/api/customers/me/invoices`).
   - `Anonymous / Magic Link Token`: Public customer portal (`/api/portal/quote/{token}`, `/api/portal/quote/{token}/lines/{lineId}/comment`, `/api/portal/quote/{token}/counter-offer`).

3. **Zero-Leak Customer Security**:
   - `CustomerQuoteDto` on `/api/portal/quote/{token}` rigorously excludes margin, cost price, risk scores, and internal manager remarks.

---

## 2. Complete Controller & Endpoint Contract (11 Controllers, 37 Actions)

### 2.1. AuthController (`/api/auth`)
Base Route: `/api/auth`  
Class Authorization: Public (except `/me`)

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | `LoginRequest`<br>• `email` (string)<br>• `password` (string) | `AuthResponse`<br>• `token` (string)<br>• `refreshToken` (string)<br>• `user` (UserSummaryDto: id, fullName, email, role, salesTeamId, customerId) | `authApi.login()`<br>`LoginPage.jsx` |
| `POST` | `/api/auth/register` | Public | `SignupRequest`<br>• `fullName` (string)<br>• `email` (string)<br>• `password` (string)<br>• `role` (string)<br>• `salesTeamId` (int?)<br>• `customerId` (int?) | `AuthResponse`<br>(token, refreshToken, user) | `authApi.register()` / `signup()`<br>`RegisterPage.jsx` |
| `POST` | `/api/auth/refresh-token` | Public | `string` (raw JSON string: refreshToken) | `AuthResponse`<br>(token, refreshToken, user) | `authApi.refreshToken()`<br>`apiClient.js` interceptor |
| `GET` | `/api/auth/me` | Authenticated | *None* | `UserResponse`<br>• `id` (int)<br>• `fullName` (string)<br>• `email` (string)<br>• `role` (string)<br>• `teamName` (string?)<br>• `salesTeamId` (int?)<br>• `customerId` (int?)<br>• `isActive` (bool)<br>• `createdAtUtc` (DateTime) | `authApi.me()`<br>`AuthContext.jsx` |

---

### 2.2. AdminController (`/api/admin`)
Base Route: `/api/admin`  
Class Authorization: `Admin` (specific endpoints have `[AllowAnonymous]` for Rep/Public read access)

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Users** |
| `GET` | `/api/admin/users` | Admin | *None* | `List<UserResponse>` | `adminApi.getUsers()` |
| `POST` | `/api/admin/users` | Admin | `CreateUserRequest`<br>• `fullName`, `email`, `password`, `role`, `salesTeamId`?, `customerId`? | `UserResponse` | `adminApi.createUser()` |
| `PUT` | `/api/admin/users/{id}` | Admin | `UpdateUserRequest`<br>• `fullName`, `role`, `salesTeamId`?, `customerId`?, `isActive` | `UserResponse` | `adminApi.updateUser()` |
| **Customer Tiers** |
| `GET` | `/api/admin/customer-tiers` | `[AllowAnonymous]` | *None* | `List<CustomerTierResponse>`<br>• `id`, `name`, `maxDiscountPercent` | `adminApi.getCustomerTiers()`<br>`customerApi.getCustomerTiers()` |
| `POST` | `/api/admin/customer-tiers` | Admin | `CreateCustomerTierRequest`<br>• `name`, `maxDiscountPercent` | `CustomerTierResponse` | `adminApi.createCustomerTier()` |
| **Categories** |
| `GET` | `/api/admin/categories` | `[AllowAnonymous]` | *None* | `List<CategoryResponse>`<br>• `id`, `name`, `description`, `isActive` | `productApi.getCategories()` |
| `POST` | `/api/admin/categories` | Admin | `CreateCategoryRequest`<br>• `name`, `description`? | `CategoryResponse` | `productApi.createCategory()` |
| **Products** |
| `GET` | `/api/admin/products` | `[AllowAnonymous]` | *None* | `List<ProductListResponse>`<br>• `id`, `sku`, `name`, `categoryName`, `productType`, `basePrice`, `costPrice`, `taxRate`, `isActive` | `productApi.getProducts()`<br>`QuoteBuilder.jsx` |
| `POST` | `/api/admin/products` | Admin | `CreateProductRequest`<br>• `sku`, `name`, `categoryId`, `productType`, `basePrice`, `costPrice`, `taxRate`, `unit` | `ProductDetailResponse` | `productApi.createProduct()` |
| `PUT` | `/api/admin/products/{id}` | Admin | `UpdateProductRequest`<br>• `name`, `categoryId`, `productType`, `basePrice`, `costPrice`, `taxRate`, `unit`, `isActive` | `ProductDetailResponse` | `productApi.updateProduct()` |
| **Price Lists** |
| `GET` | `/api/admin/price-lists` | `[AllowAnonymous]` | *None* | `List<PriceListResponse>`<br>• `id`, `name`, `currencyCode`, `tierId`, `tierName`, `isActive`, `items: List<PriceListItemResponse>` | `productApi.getPriceLists()` |
| `POST` | `/api/admin/price-lists` | Admin | `CreatePriceListRequest`<br>• `name`, `currencyCode`, `tierId`? | `PriceListResponse` | `productApi.createPriceList()` |
| `POST` | `/api/admin/price-lists/{id}/items` | Admin | `UpsertPriceListItemRequest`<br>• `productId`, `currencyCode`, `unitPrice` | `PriceListItemResponse` | `productApi.addPriceListItem()` |
| **Discount Rules** |
| `GET` | `/api/admin/discount-rules` | Admin | *None* | `List<DiscountRuleResponse>`<br>• `id`, `tierId`, `tierName`, `categoryId`?, `categoryName`?, `maxDiscountPercent`, `managerThreshold`, `financeThreshold`, `isActive` | `adminApi.getDiscountRules()` |
| `POST` | `/api/admin/discount-rules` | Admin | `CreateDiscountRuleRequest`<br>• `tierId`, `categoryId`?, `maxDiscountPercent`, `managerThreshold`, `financeThreshold` | `DiscountRuleResponse` | `adminApi.createDiscountRule()` |
| **Approval Rules** |
| `GET` | `/api/admin/approval-rules` | Admin | *None* | `List<ApprovalRuleResponse>`<br>• `id`, `level`, `minRisk`, `maxRisk`, `requiredRole`, `sequence`, `isActive` | `adminApi.getApprovalRules()` |
| `POST` | `/api/admin/approval-rules` | Admin | `CreateApprovalRuleRequest`<br>• `level`, `minRisk`, `maxRisk`, `requiredRole`, `sequence` | `ApprovalRuleResponse` | `adminApi.createApprovalRule()` |
| **Warehouses & Stock** |
| `GET` | `/api/admin/warehouses` | `[AllowAnonymous]` | *None* | `List<WarehouseResponse>`<br>• `id`, `name`, `shippingCostWeight`, `isActive` | `fulfillmentApi.getWarehouses()` |
| `POST` | `/api/admin/warehouses` | Admin | `CreateWarehouseRequest`<br>• `name`, `shippingCostWeight` | `WarehouseResponse` | `adminApi.createWarehouse()` |
| `POST` | `/api/admin/warehouses/{id}/adjust-stock` | Admin | `AdjustStockRequest`<br>• `productId` (int)<br>• `onHand` (int) | `StockResponse`<br>• `id`, `warehouseId`, `warehouseName`, `productId`, `productName`, `productSku`, `onHand`, `reserved`, `available` | `adminApi.adjustStock()` |
| **Sales Teams** |
| `GET` | `/api/admin/sales-teams` | Admin | *None* | `List<SalesTeamResponse>`<br>• `id`, `name`, `isActive`, `memberCount` | `adminApi.getSalesTeams()` |
| `POST` | `/api/admin/sales-teams` | Admin | `CreateSalesTeamRequest`<br>• `name` | `SalesTeamResponse` | `adminApi.createSalesTeam()` |
| **Subscription Plans** |
| `GET` | `/api/admin/subscription-plans` | `[AllowAnonymous]` | *None* | `List<SubscriptionPlanResponse>`<br>• `id`, `name`, `billingFrequency`, `billingIntervalMonths`, `isActive` | `billingApi.getSubscriptionPlans()` |
| `POST` | `/api/admin/subscription-plans` | Admin | `CreateSubscriptionPlanRequest`<br>• `name`, `billingFrequency`, `billingIntervalMonths` | `SubscriptionPlanResponse` | `adminApi.createSubscriptionPlan()` |
| **Upsell Rules** |
| `GET` | `/api/admin/upsell-rules` | Admin | *None* | `List<UpsellRuleResponse>`<br>• `id`, `triggerProductId`, `triggerProductName`, `suggestedProductId`, `suggestedProductName`, `ruleType`, `score`, `isPromoted`, `isActive` | `adminApi.getUpsellRules()` |
| `POST` | `/api/admin/upsell-rules` | Admin | `CreateUpsellRuleRequest`<br>• `triggerProductId`, `suggestedProductId`, `ruleType`, `score`, `isPromoted` | `UpsellRuleResponse` | `adminApi.createUpsellRule()` |

---

### 2.3. QuotationsController (`/api/quotations`)
Base Route: `/api/quotations`  
Class Authorization: `SalesRep`, `SalesManager`, `Admin`

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/quotations` | Rep / Mgr / Admin | Query: `salesRepId` (int?), `status` (QuoteStatus?) | `List<QuotationListResponse>`<br>• `id`, `quotationNumber`, `customerName`, `salesRepName`, `status`, `approvalStatus`, `grandTotal`, `marginPercent`, `riskScore`, `expectedCloseDate`, `createdAtUtc`, `updatedAtUtc` | `quotationApi.getQuotations()`<br>`QuotationListPage.jsx` |
| `GET` | `/api/quotations/{id}` | Rep / Mgr / Admin | Route: `id` (int) | `QuotationDetailResponse`<br>• Full details including `lines`, `approvalSteps`, `allowedActions`, totals, margin, risk | `quotationApi.getQuotationById()`<br>`QuoteDetailModal.jsx` |
| `POST` | `/api/quotations` | Rep / Mgr / Admin | `CreateQuotationRequest`<br>• `customerId` (int)<br>• `priceListId` (int?)<br>• `currencyCode` (string = "INR")<br>• `expectedCloseDate` (DateTime?)<br>• `notes` (string?)<br>• `lines` (List<AddLineRequest>?) | `QuotationDetailResponse` | `quotationApi.createQuotation()`<br>`QuoteBuilder.jsx` |
| `PUT` | `/api/quotations/{id}` | Rep / Mgr / Admin | Route: `id`<br>Body: `UpdateQuotationRequest`<br>• `priceListId` (int?)<br>• `expectedCloseDate` (DateTime?)<br>• `notes` (string?) | `QuotationDetailResponse` | `quotationApi.updateQuotation()` |
| `POST` | `/api/quotations/{id}/lines` | Rep / Mgr / Admin | Route: `id`<br>Body: `AddLineRequest`<br>• `productId` (int)<br>• `variantId` (int?)<br>• `quantity` (int)<br>• `unitPrice` (decimal)<br>• `discountPercent` (decimal)<br>• `subscriptionPlanId` (int?) | `QuotationDetailResponse` | `quotationApi.addLine()`<br>`QuoteBuilder.jsx` |
| `PUT` | `/api/quotations/{id}/lines/{lineId}` | Rep / Mgr / Admin | Route: `id`, `lineId`<br>Body: `UpdateLineRequest`<br>• `quantity` (int)<br>• `unitPrice` (decimal?)<br>• `discountPercent` (decimal)<br>• `variantId` (int?)<br>• `subscriptionPlanId` (int?) | `QuotationDetailResponse` | `quotationApi.updateLine()` |
| `DELETE` | `/api/quotations/{id}/lines/{lineId}` | Rep / Mgr / Admin | Route: `id`, `lineId` | `QuotationDetailResponse` | `quotationApi.deleteLine()` |
| `POST` | `/api/quotations/{id}/recalculate` | Rep / Mgr / Admin | Route: `id` | `QuotationDetailResponse` | `quotationApi.recalculate()` |
| `POST` | `/api/quotations/{id}/submit-approval` | Rep / Mgr / Admin | Route: `id` | `QuotationDetailResponse` | `quotationApi.submitForApproval()` |
| `GET` | `/api/quotations/{id}/recommendations` | Rep / Mgr / Admin | Route: `id` | `List<RecommendationResponse>`<br>• `productId`, `productName`, `sku`, `unitPrice`, `costPrice`, `marginPerUnit`, `currentQuoteMargin`, `marginAfterAddition`, `marginDeltaPercent`, `score`, `isPromoted`, `ruleType`, `reason` | `quotationApi.getRecommendations()`<br>`QuoteBuilder.jsx` |
| `POST` | `/api/quotations/{id}/generate-portal-link` | Rep / Mgr / Admin | Route: `id` | `{ portalLink: string }` | `quotationApi.generatePortalLink()` |
| `POST` | `/api/quotations/{id}/convert-to-order` | Rep / Mgr / Admin | Route: `id` | `OrderResponse`<br>• `id`, `orderNumber`, `quotationId`, `customerId`, `status`, `grandTotal`, `createdAtUtc` | `quotationApi.convertToOrder()` |

---

### 2.4. ApprovalsController (`/api/approvals`)
Base Route: `/api/approvals`  
Class Authorization: `SalesManager`, `FinanceOperations`, `Admin`

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/approvals/pending` | Mgr / Finance / Admin | Query: `level` (ApprovalLevel?: Manager, Finance) | `List<ApprovalQueueResponse>`<br>• `id`, `quotationId`, `quotationNumber`, `customerName`, `salesRepName`, `level`, `status`, `grandTotal`, `riskScore`, `requestedAtUtc`, `reason` | `approvalApi.getPendingApprovals()`<br>`ApprovalsQueue.jsx` |
| `GET` | `/api/approvals/{id}` | Mgr / Finance / Admin | Route: `id` (int) | `ApprovalDetailResponse`<br>• `id`, `quotationId`, `quotationNumber`, `customerName`, `salesRepName`, `level`, `status`, `grandTotal`, `riskScore`, `sequence`, `requestedAtUtc`, `actedAtUtc`, `actedByName`, `reason`, `history`, `actions` | `approvalApi.getApprovalById()`<br>`ApprovalActionModal.jsx` |
| `POST` | `/api/approvals/{id}/action` | Mgr / Finance / Admin | Route: `id`<br>Body: `ApprovalActionRequest`<br>• `action` ("Approved" \| "Rejected" \| "Returned")<br>• `reason` (string?) | `ApprovalDetailResponse` | `approvalApi.approve()`, `reject()`, `returnForRevision()` |

---

### 2.5. CustomersController (`/api/customers`)
Base Route: `/api/customers`  
Class Authorization: Authenticated (Internal roles for general endpoints; `Customer,Admin` for `/me/...`)

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/customers` | Rep / Mgr / Admin | *None* | `List<CustomerListResponse>`<br>• `id`, `name`, `email`, `phone`, `tierName`, `currencyCode`, `isActive` | `customerApi.getCustomers()` |
| `GET` | `/api/customers/{id}` | Rep / Mgr / Admin | Route: `id` (int) | `CustomerDetailResponse`<br>• `id`, `name`, `email`, `phone`, `tierId`, `tierName`, `tierMaxDiscount`, `currencyCode`, `isActive`, `createdAtUtc` | `customerApi.getCustomerById()` |
| `POST` | `/api/customers` | Rep / Mgr / Admin | `CreateCustomerRequest`<br>• `name`, `email`?, `phone`?, `tierId`, `currencyCode` | `CustomerDetailResponse` | `customerApi.createCustomer()` |
| `PUT` | `/api/customers/{id}` | Rep / Mgr / Admin | Route: `id`<br>Body: `UpdateCustomerRequest`<br>• `name`, `email`?, `phone`?, `tierId`, `currencyCode`, `isActive` | `CustomerDetailResponse` | `customerApi.updateCustomer()` |
| `GET` | `/api/customers/me/quotations` | Customer / Admin | *None* (resolved from JWT) | `List<PortalQuotationListResponse>` | `portalApi.getMyQuotations()` |
| `GET` | `/api/customers/me/orders` | Customer / Admin | *None* (resolved from JWT) | `List<OrderResponse>` | `portalApi.getMyOrders()` |
| `GET` | `/api/customers/me/invoices` | Customer / Admin | *None* (resolved from JWT) | `List<InvoiceListResponse>` | `portalApi.getMyInvoices()` |

---

### 2.6. DealHealthController (`/api/dealhealth`)
Base Route: `/api/dealhealth`  
Class Authorization: `SalesManager`, `Admin`

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/dealhealth/summary` | Mgr / Admin | *None* | `DealHealthSummaryResponse`<br>• `totalActiveDeals`<br>• `healthyCount`, `atRiskCount`, `criticalCount`<br>• `stalledDealsCount`<br>• `discountAnomaliesCount`<br>• `highRiskDealsCount`<br>• `healthScore`<br>• `alerts: List<DealHealthAlertResponse>` | `healthApi.getDealHealthSummary()`<br>`DealHealthDashboard.jsx` |

---

### 2.7. FulfillmentController (`/api/fulfillment`)
Base Route: `/api/fulfillment`  
Class Authorization: `FinanceOperations`, `Admin`

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/fulfillment/preview/{orderId}` | Finance / Admin | Route: `orderId` (int) | `FulfillmentPreviewResponse`<br>• `orderId`, `orderNumber`, `isFullyAllocated`<br>• `allocations: List<AllocationResponse>`<br>• `backorders: List<BackorderResponse>`<br>• `lines: List<LineAllocationPreview>`<br>• `totalShipments`, `totalShipmentCost` | `fulfillmentApi.getFulfillmentPreview()`<br>`FulfillmentDashboard.jsx` |
| `POST` | `/api/fulfillment/allocate/{orderId}` | Finance / Admin | Route: `orderId` (int) | `FulfillmentPreviewResponse` | `fulfillmentApi.executeAllocation()` |
| `GET` | `/api/fulfillment/backorders` | Finance / Admin | *None* | `List<BackorderResponse>`<br>• `id`, `orderId`, `orderLineId`, `productId`, `productName`, `quantity`, `status`, `createdAtUtc` | `fulfillmentApi.getBackorders()` |
| `POST` | `/api/fulfillment/replenish` | Finance / Admin | Query: `warehouseId` (int), `productId` (int) | `{ message: string }` | `fulfillmentApi.replenishStock()` |

---

### 2.8. BillingController (`/api/billing`)
Base Route: `/api/billing`  
Class Authorization: `FinanceOperations`, `Admin`

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/billing/generate-order-billing/{orderId}` | Finance / Admin | Route: `orderId` (int) | `BillingOverviewResponse`<br>• `orderId`, `orderNumber`, `hasCommercialInvoice`, `invoiceNumber`, `invoiceTotal`, `activeSubscriptionsCount`, `invoices`, `recurringSchedules` | `billingApi.generateOrderBilling()`<br>`BillingDashboard.jsx` |
| `POST` | `/api/billing/subscriptions/{scheduleId}/seat-change` | Finance / Admin | Route: `scheduleId` (int)<br>Body: `SubscriptionChangeRequest`<br>• `newPlanId` (int?)<br>• `newQuantity` (int) | `BillingScheduleResponse` | `billingApi.changeSubscription()` |

---

### 2.9. InvoicesController (`/api/invoices`)
Base Route: `/api/invoices`  
Class Authorization: `FinanceOperations`, `Admin`

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | Finance / Admin | *None* | `List<InvoiceListResponse>`<br>• `id`, `invoiceNumber`, `customerName`, `type`, `status`, `total`, `paidAmount`, `outstanding`, `dueDate`, `createdAtUtc` | `billingApi.getInvoices()` |
| `GET` | `/api/invoices/{id}` | Finance / Admin | Route: `id` (int) | `InvoiceDetailResponse`<br>• `id`, `invoiceNumber`, `orderId`, `orderNumber`, `customerId`, `customerName`, `type`, `status`, `subTotal`, `taxTotal`, `total`, `paidAmount`, `outstanding`, `dueDate`, `createdAtUtc`, `lines`, `payments`, `creditNotes` | `billingApi.getInvoiceById()` |
| `POST` | `/api/invoices/{id}/pay` | Finance / Admin | Route: `id`<br>Body: `RecordPaymentRequest`<br>• `amount` (decimal)<br>• `paymentMethod` (string)<br>• `reference` (string?) | `InvoiceDetailResponse` | `billingApi.recordPayment()` |
| `POST` | `/api/invoices/{id}/credit-note` | Finance / Admin | Route: `id`<br>Body: `CreateCreditNoteRequest`<br>• `amount` (decimal)<br>• `reason` (string)<br>• `orderLineId` (int?) | `InvoiceDetailResponse` | `billingApi.createCreditNote()` |

---

### 2.10. PortalController (`/api/portal`)
Base Route: `/api/portal`  
Class Authorization: `[AllowAnonymous]` (Token validation handled within service)

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/portal/quote/{token}` | Public / Token | Route: `token` (string) | `CustomerQuoteDto`<br>• `id`, `quotationNumber`, `customerName`, `status`, `currencyCode`, `subTotal`, `discountTotal`, `taxTotal`, `grandTotal`, `expectedCloseDate`, `notes`, `lines: List<CustomerQuoteLineDto>` | `portalApi.getQuoteByToken()`<br>`PortalQuoteView.jsx` |
| `POST` | `/api/portal/quote/{token}/lines/{lineId}/comment` | Public / Token | Route: `token`, `lineId`<br>Body: `string` (raw JSON string comment) | `{ message: string }` | `portalApi.submitLineComment()` |
| `POST` | `/api/portal/quote/{token}/counter-offer` | Public / Token | Route: `token`<br>Body: `CounterDiscountRequest`<br>• `lineId` (int)<br>• `proposedDiscountPercent` (decimal)<br>• `reason` (string?) | `CustomerQuoteDto` | `portalApi.submitCounterOffer()` |

---

### 2.11. ReportsController (`/api/reports`)
Base Route: `/api/reports`  
Class Authorization: `SalesManager`, `FinanceOperations`, `Admin`

| HTTP Method | Route | Auth / Roles | Request DTO / Parameters | Response DTO / Structure | Frontend Consumer |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/dashboard` | Mgr / Finance / Admin | Query: `salesRepId` (int?) | `DashboardMetricsResponse`<br>• `openQuotationValue`, `approvedQuoteCount`, `pendingQuoteCount`, `rejectedQuoteCount`, `weightedPipelineValue`, `discountAnomalyCount`, `stalledQuoteCount`, `ordersAwaitingFulfillment`, `backorderCount`, `backorderValue`, `outstandingInvoiceAmount`, `overdueInvoiceCount`, `recurringRevenueScheduled` | `reportApi.getDashboardMetrics()`<br>`ExecutiveDashboard.jsx` |
| `GET` | `/api/reports/pipeline` | Mgr / Finance / Admin | *None* | `PipelineResponse`<br>• `totalPipelineValue`, `totalDeals`, `stages: List<PipelineStageDto>` | `reportApi.getPipelineOverview()`<br>`quotationApi.getPipeline()` |
