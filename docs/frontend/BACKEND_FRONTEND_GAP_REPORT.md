# DealFlow360 — Backend vs Frontend Integration Gap Analysis Report
**Backend Source Branch**: `origin/Backend` (`backend/DealFlow360.API/DealFlow360.API`)  
**Frontend Source Branch**: `frontend`  
**Date**: September 2026  
**Status**: Comprehensive Alignment Analysis Completed

---

## 1. Executive Summary

This report compares the actual implementation of the ASP.NET Core Web API on the `origin/Backend` branch against the React frontend on the `frontend` branch.

### Key Discoveries:
1. **Unversioned REST Routes**:
   - The backend uses unversioned `[Route("api/[controller]")]`. All endpoints are `/api/...`, not `/api/v1/...`.
2. **Master Data & Catalog Centralization in `AdminController`**:
   - Instead of separate controllers for `/api/products`, `/api/categories`, `/api/price-lists`, `/api/warehouses`, `/api/subscription-plans`, `/api/customer-tiers`, and `/api/sales-teams`, the backend centralizes these under `AdminController` (`/api/admin/...`).
   - Several key lookup endpoints (`products`, `categories`, `customer-tiers`, `price-lists`, `warehouses`, `subscription-plans`) are marked `[AllowAnonymous]`, so sales reps and quote builders can query them without administrative permissions.
3. **Consolidated Action Endpoints**:
   - Approvals: Backend uses a single endpoint `POST /api/approvals/{id}/action` with `{ action: "Approved"|"Rejected"|"Returned", reason: "..." }`, rather than three discrete endpoints (`/approve`, `/reject`, `/return`).
   - Quotation Actions: Backend uses `POST /api/quotations/{id}/submit-approval` (not `/submit`), `POST /api/quotations/{id}/convert-to-order` (not `/confirm-order`), and `POST /api/quotations/{id}/generate-portal-link` (not `/send-portal`).
   - Fulfillment: Backend provides `/api/fulfillment/preview/{orderId}` and `/api/fulfillment/allocate/{orderId}`, rather than nested sub-routes under `/api/orders/...`.
   - Billing: Backend provides `/api/billing/generate-order-billing/{orderId}` and `/api/billing/subscriptions/{scheduleId}/seat-change`.
   - Invoices: Backend exposes `/api/invoices` with `POST /api/invoices/{id}/pay` and `POST /api/invoices/{id}/credit-note`.

---

## 2. Detailed Gap Categorization

### Category 1: Working Integrations (Exact Matches)
These endpoints were implemented in the frontend with routes and payloads matching the actual backend:
- `POST /api/auth/login`: `{ email, password }` matches `LoginRequest`.
- `GET /api/auth/me`: Matches authenticated user profile lookup.
- `GET /api/quotations`: Matches query filtering by `salesRepId` and `status`.
- `GET /api/quotations/{id}`: Matches `QuotationDetailResponse`.
- `POST /api/quotations`: Matches `CreateQuotationRequest` with lines, customerId, priceListId.
- `PUT /api/quotations/{id}`: Matches `UpdateQuotationRequest`.
- `POST /api/quotations/{id}/lines`: Matches `AddLineRequest`.
- `PUT /api/quotations/{id}/lines/{lineId}`: Matches `UpdateLineRequest`.
- `DELETE /api/quotations/{id}/lines/{lineId}`: Matches line removal.
- `POST /api/quotations/{id}/recalculate`: Matches quotation recalculation.
- `GET /api/quotations/{id}/recommendations`: Matches ML upsell/cross-sell recommendation retrieval.
- `GET /api/customers`: Matches customer listing.
- `GET /api/customers/{id}`: Matches customer detail.
- `POST /api/customers`: Matches `CreateCustomerRequest`.
- `PUT /api/customers/{id}`: Matches `UpdateCustomerRequest`.
- `GET /api/invoices`: Matches invoice listing.
- `GET /api/invoices/{id}`: Matches invoice detail.

---

### Category 2: Route & URL Mismatches

| Domain Area | Frontend Previous Call | Actual Backend Route | Remediation Required |
| :--- | :--- | :--- | :--- |
| **Catalog - Products** | `GET /api/products` | `GET /api/admin/products` | Update `productApi.getProducts()` to query `/admin/products`. |
| **Catalog - Products** | `POST /api/products` | `POST /api/admin/products` | Update `productApi.createProduct()` to query `/admin/products`. |
| **Catalog - Products** | `PUT /api/products/{id}` | `PUT /api/admin/products/{id}` | Update `productApi.updateProduct()` to query `/admin/products/{id}`. |
| **Catalog - Categories**| `GET /api/categories` | `GET /api/admin/categories` | Update `productApi.getCategories()` to query `/admin/categories`. |
| **Catalog - Categories**| `POST /api/categories` | `POST /api/admin/categories` | Update `productApi.createCategory()` to query `/admin/categories`. |
| **Catalog - PriceLists**| `GET /api/price-lists` | `GET /api/admin/price-lists` | Update `productApi.getPriceLists()` to query `/admin/price-lists`. |
| **Catalog - PriceLists**| `POST /api/price-lists`| `POST /api/admin/price-lists` | Update `productApi.createPriceList()` to query `/admin/price-lists`. |
| **Customer Tiers** | `GET /api/customer-tiers` | `GET /api/admin/customer-tiers` | Update `customerApi.getCustomerTiers()` to query `/admin/customer-tiers`. |
| **Warehouses** | `GET /api/warehouses` | `GET /api/admin/warehouses` | Update `fulfillmentApi.getWarehouses()` to query `/admin/warehouses`. |
| **Subscription Plans** | `GET /api/subscription-plans` | `GET /api/admin/subscription-plans` | Update `billingApi.getSubscriptionPlans()` to query `/admin/subscription-plans`. |
| **Discount Rules** | `GET /api/discount-rules` | `GET /api/admin/discount-rules` | Update `adminApi.getDiscountRules()` to query `/admin/discount-rules`. |
| **Approval Rules** | `GET /api/approval-rules` | `GET /api/admin/approval-rules` | Update `adminApi.getApprovalRules()` to query `/admin/approval-rules`. |
| **Upsell Rules** | `GET /api/upsell-rules` | `GET /api/admin/upsell-rules` | Update `adminApi.getUpsellRules()` to query `/admin/upsell-rules`. |
| **Sales Teams** | `GET /api/sales-teams` | `GET /api/admin/sales-teams` | Update `adminApi.getSalesTeams()` to query `/admin/sales-teams`. |
| **Quotation Approval** | `POST /api/quotations/{id}/submit` | `POST /api/quotations/{id}/submit-approval` | Update `quotationApi.submitForApproval()` to `/quotations/${id}/submit-approval`. |
| **Quotation Convert** | `POST /api/quotations/{id}/confirm-order` | `POST /api/quotations/{id}/convert-to-order` | Update `quotationApi.convertToOrder()` to `/quotations/${id}/convert-to-order`. |
| **Quotation Portal Link**| `POST /api/quotations/{id}/send-portal` | `POST /api/quotations/{id}/generate-portal-link`| Update `quotationApi.generatePortalLink()` to `/quotations/${id}/generate-portal-link`. |
| **Deal Health Summary** | `GET /api/dashboard/deal-health` | `GET /api/dealhealth/summary` | Update `healthApi.getDealHealthSummary()` to `/dealhealth/summary`. |
| **Reports Pipeline** | `GET /api/pipeline` | `GET /api/reports/pipeline` | Update `quotationApi.getPipeline()` and `reportApi` to `/reports/pipeline`. |
| **Reports Dashboard** | `GET /api/reports/sales-summary` | `GET /api/reports/dashboard` | Update `reportApi.getDashboardMetrics()` to `/reports/dashboard`. |
| **Fulfillment Preview** | `GET /api/orders/{id}/fulfillment-preview` | `GET /api/fulfillment/preview/{orderId}` | Update `fulfillmentApi.getFulfillmentPreview()` to `/fulfillment/preview/${orderId}`. |
| **Fulfillment Allocate**| `POST /api/orders/{id}/fulfillment/accept` | `POST /api/fulfillment/allocate/{orderId}` | Update `fulfillmentApi.executeAllocation()` to `/fulfillment/allocate/${orderId}`. |
| **Fulfillment Backorders**| `GET /api/backorders` | `GET /api/fulfillment/backorders` | Update `fulfillmentApi.getBackorders()` to `/fulfillment/backorders`. |
| **Billing Generation** | `POST /api/orders/{id}/billing/generate` | `POST /api/billing/generate-order-billing/{orderId}` | Update `billingApi.generateOrderBilling()` to `/billing/generate-order-billing/${orderId}`. |
| **Portal Magic View** | `GET /api/portal/quotations/{id}` | `GET /api/portal/quote/{token}` | Update `portalApi.getQuoteByToken()` to `/portal/quote/${token}`. |

---

### Category 3: DTO & Parameter Mismatches

1. **Approval Decision Processing**:
   - *Previous Frontend*: Separate endpoints `POST /api/approvals/{id}/approve`, `POST /api/approvals/{id}/reject`, `POST /api/approvals/{id}/return`.
   - *Actual Backend*: Unified `POST /api/approvals/{id}/action` with body:
     ```json
     {
       "action": "Approved", // or "Rejected" or "Returned"
       "reason": "Remarks text..."
     }
     ```
   - *Fix*: Update `approvalApi.approve()`, `approvalApi.reject()`, and `approvalApi.returnForRevision()` to send `{ action: "Approved"|"Rejected"|"Returned", reason: remarks }` to `/approvals/${id}/action`.

2. **Auth Registration**:
   - *Previous Frontend*: `POST /api/auth/signup`
   - *Actual Backend*: `POST /api/auth/register` with `SignupRequest` (`fullName`, `email`, `password`, `role`, `salesTeamId`?, `customerId`?).
   - *Fix*: Update `authApi.register()` and aliased `signup()` to target `/auth/register`.

3. **Auth Token Refresh**:
   - *Previous Frontend*: `POST /api/auth/refresh` with `{ refreshToken }`
   - *Actual Backend*: `POST /api/auth/refresh-token` with raw JSON string `refreshToken`.
   - *Fix*: Update `authApi.refresh()` to call `/auth/refresh-token` with raw token.

4. **Invoice Payment & Credit Note**:
   - *Previous Frontend*: `POST /api/invoices/{id}/payments`, `POST /api/invoices/{id}/credit-notes`
   - *Actual Backend*: `POST /api/invoices/{id}/pay` with `{ amount, paymentMethod, reference }`, and `POST /api/invoices/{id}/credit-note` with `{ amount, reason, orderLineId }`.
   - *Fix*: Update `billingApi.recordPayment()` and `billingApi.createCreditNote()`.

5. **Customer Portal Counter Offer**:
   - *Previous Frontend*: Sent general discount percent to `/portal/quotations/{id}/counter-discount`.
   - *Actual Backend*: Token-based `POST /api/portal/quote/{token}/counter-offer` with:
     ```json
     {
       "lineId": 12,
       "proposedDiscountPercent": 15.0,
       "reason": "Volume commitment"
     }
     ```
   - *Fix*: Update `portalApi.submitCounterOffer()` to match token and payload shape.

6. **Portal Line Comments**:
   - *Previous Frontend*: `POST /api/portal/quotation-lines/{id}/comments`
   - *Actual Backend*: `POST /api/portal/quote/{token}/lines/{lineId}/comment` with body as plain string.
   - *Fix*: Update `portalApi.submitLineComment()`.

---

### Category 4: Master Data Routing Architecture

In `DealFlow360`, configuration and administrative master data is consolidated under `AdminController`.
However, because sales representatives need to read products, categories, customer tiers, and price lists while composing quotations, the backend exposes these GET endpoints with `[AllowAnonymous]`.

Therefore:
- In `frontend/src/api/productApi.js`, queries for products, categories, and price lists route to `/admin/products`, `/admin/categories`, and `/admin/price-lists`.
- In `frontend/src/api/customerApi.js`, `getCustomerTiers()` routes to `/admin/customer-tiers`.
- In `frontend/src/api/fulfillmentApi.js`, `getWarehouses()` routes to `/admin/warehouses`.
- In `frontend/src/api/billingApi.js`, `getSubscriptionPlans()` routes to `/admin/subscription-plans`.

---

## 3. Actionable Remediation Matrix

| Frontend API File | Functions to Adjust | Changes Implemented |
| :--- | :--- | :--- |
| `frontend/src/api/approvalApi.js` | `approve`, `reject`, `returnForRevision`, `recordDecision` | Consolidate to `POST /approvals/${id}/action` with payload `{ action, reason }`. |
| `frontend/src/api/quotationApi.js` | `submitForApproval`, `convertToOrder`, `generatePortalLink`, `getPipeline` | Update routes to `/quotations/${id}/submit-approval`, `/quotations/${id}/convert-to-order`, `/quotations/${id}/generate-portal-link`, and `/reports/pipeline`. |
| `frontend/src/api/adminApi.js` | All endpoints | Ensure `/admin/` prefix on all paths: `/admin/discount-rules`, `/admin/approval-rules`, `/admin/warehouses`, `/admin/subscription-plans`, `/admin/upsell-rules`, `/admin/sales-teams`, `/admin/users`, `/admin/products`, `/admin/categories`, `/admin/price-lists`, `/admin/customer-tiers`. |
| `frontend/src/api/productApi.js` | `getProducts`, `createProduct`, `updateProduct`, `getCategories`, `createCategory`, `getPriceLists`, `createPriceList`, `addPriceListItem` | Route to `/admin/products`, `/admin/categories`, `/admin/price-lists`. |
| `frontend/src/api/fulfillmentApi.js` | `getWarehouses`, `getFulfillmentPreview`, `acceptFulfillment`/`executeAllocation`, `getBackorders`, `replenishStock` | Route to `/admin/warehouses`, `/fulfillment/preview/${orderId}`, `/fulfillment/allocate/${orderId}`, `/fulfillment/backorders`, `/fulfillment/replenish`. |
| `frontend/src/api/billingApi.js` | `getSubscriptionPlans`, `generateBilling`, `recordPayment`, `createCreditNote`, `changeSubscription` | Route to `/admin/subscription-plans`, `/billing/generate-order-billing/${orderId}`, `/invoices/${id}/pay`, `/invoices/${id}/credit-note`, `/billing/subscriptions/${scheduleId}/seat-change`. |
| `frontend/src/api/healthApi.js` | `getDealHealthSummary` | Route to `/dealhealth/summary`. |
| `frontend/src/api/portalApi.js` | `getQuoteByToken`, `submitLineComment`, `submitCounterOffer`, `getMyQuotations`, `getMyOrders`, `getMyInvoices` | Route to `/portal/quote/${token}`, `/portal/quote/${token}/lines/${lineId}/comment`, `/portal/quote/${token}/counter-offer`, and `/customers/me/...`. |
| `frontend/src/api/reportApi.js` | `getDashboardMetrics`, `getPipelineOverview` | Route to `/reports/dashboard` and `/reports/pipeline`. |
| `frontend/src/api/authApi.js` | `register`/`signup`, `refresh`/`refreshToken` | Route to `/auth/register` and `/auth/refresh-token`. |

---

## 4. Verification & Testing Strategy

1. **Static Analysis & Build Verification**:
   - Verify every file is clean ES6+ JavaScript (`.js`/`.jsx`). Zero TypeScript files.
   - Run `npm run build` in `frontend/` to confirm zero linting, syntax, or Vite bundling failures.
2. **Contract Alignment Verification**:
   - Ensure all request signatures match the C# DTOs found in `origin/Backend`.
   - Ensure fallbacks or alias mappings exist so existing UI components continue functioning seamlessly without prop breakdown.
