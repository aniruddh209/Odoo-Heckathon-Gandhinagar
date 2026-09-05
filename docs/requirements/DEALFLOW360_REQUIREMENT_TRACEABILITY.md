# DealFlow360: Master Requirement Traceability Matrix

---

## 1. Document Control & Authority Model

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master Requirement Traceability Matrix |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **Version** | 3.0.0 (Locked Stack: React + ASP.NET Core + SQL Server) |
| **Authority Hierarchy** | 1. `DealFlow360.pdf` (Business Truth)<br>2. `DealFlow360_ASPNet_SQLServer_React_Complete_Implementation_Spec.pdf` (Engineering Reference)<br>3. This Traceability Matrix |
| **Last Updated** | 2026-09-05 |

---

## 2. Complete Traceability Matrix (39 Enterprise Requirements)

| Req ID | PDF Source | Business Requirement Scope | Backend Service (.NET) | Primary API Endpoint | Database Entity/Table | Frontend Screen | Test Case ID | Spec Ref |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **REQ-AUTH-01** | Page 2–3 | Internal User Auth & RBAC (SalesRep, SalesManager, Finance, Admin) | `AuthService` | `POST /api/auth/login`<br>`GET /api/auth/me` | `Users`, `Roles` | `/login`<br>`Navbar` | `TC-AUTH-01` | Spec §7, §24 |
| **REQ-AUTH-02** | Page 4, 8 | Customer Portal Auth via Secure Magic Link Token | `AuthService` | `POST /api/portal/auth/login`<br>`POST /api/portal/auth/magic-link` | `Customers` | `/portal/login` | `TC-AUTH-02` | Spec §16, §24 |
| **REQ-ADMIN-01**| Page 4 | Admin Setup (Products, Tiers, Ceilings, Warehouses, Plans) | `AdminConfigService` | `POST /api/products`<br>`POST /api/price-lists`<br>`POST /api/discount-rules` | `Products`, `PriceLists`, `DiscountRules` | `/admin/*` | `TC-ADM-01` | Spec §8, §24 |
| **REQ-PROD-01** | Page 4 | Catalog Master (Hardware, Services, Recurring Subscriptions) | `ProductService` | `GET /api/products`<br>`POST /api/products` | `Products`, `ProductCategories` | `/admin/products`<br>`QuoteBuilder` | `TC-PROD-01` | Spec §8, §15 |
| **REQ-PROD-02** | Page 4 | Product Variant Configuration & Attributes | `ProductService` | `GET /api/products/{id}/variants` | `ProductVariants` | `QuoteBuilder` | `TC-PROD-02` | Spec §8 |
| **REQ-PROD-03** | Page 4 | Customer Tier Pricing (Bronze 5%, Silver 10%, Gold 15%) | `PriceListService` | `GET /api/customer-tiers`<br>`GET /api/price-lists` | `CustomerTiers`, `PriceLists`, `PriceListItems` | `/admin/pricing`<br>`QuoteBuilder` | `TC-TIER-01` | Spec §8, §11 |
| **REQ-DISC-01** | Page 4, 12 | Per-Line Allowed Ceiling: $\min(\text{TierCeiling}, \text{CatCeiling})$ | `DiscountService` | `POST /api/quotations/{id}/lines`<br>`POST /api/quotations/{id}/recalculate` | `DiscountRules`, `CustomerTiers` | `QuoteBuilder`<br>`CartSummary` | `TC-DISC-01` | Spec §11.1 |
| **REQ-DISC-02** | Page 4, 12 | Category Ceilings (Hardware vs Service Differential Limits) | `DiscountService` | `GET /api/discount-rules` | `DiscountRules`, `ProductCategories` | `/admin/discounts` | `TC-DISC-02` | Spec §11.1 |
| **REQ-DISC-03** | Page 11, 14 | Line Overage Points: $\max(0, \text{Discount} - \text{Ceiling})$ | `DiscountService` | `POST /api/quotations/{id}/lines` | `QuotationLines` | `QuoteLineItem` | `TC-DISC-03` | Spec §11.2 |
| **REQ-DISC-04** | Page 11, 14 | Blended Risk Score: $\frac{\sum(\text{LineNet} \times \text{Overage})}{\sum(\text{LineNet})}$ | `DiscountService` | `POST /api/quotations/{id}/recalculate` | `Quotations` | `RiskScoreBadge`<br>`CartSummary` | `TC-RISK-01` | Spec §11.3 |
| **REQ-DISC-05** | Page 4, 14 | Automatic Routing: 0 (None), >0–5 (Manager), >5–10 (Finance), >10 (Critical) | `ApprovalService` | `POST /api/quotations/{id}/submit` | `ApprovalRules`, `ApprovalRequests` | `ApprovalQueue` | `TC-APPR-01` | Spec §11.4 |
| **REQ-DISC-06** | Page 4, 6 | Immutable Approval Audit Action Trail with Mandatory Remarks | `AuditService` | `POST /api/approvals/{id}/approve`<br>`POST /api/approvals/{id}/reject`<br>`POST /api/approvals/{id}/return` | `ApprovalActions`, `AuditLogs` | `ApprovalDetailModal` | `TC-AUD-01` | Spec §12, §27 |
| **REQ-DISC-07** | Page 14, 25 | Invalidation of Prior Approvals on Quote Line/Discount Edit | `ApprovalService` | `PUT /api/quotations/{id}/lines/{lineId}` | `ApprovalRequests` | `QuoteBuilder` | `TC-APPR-02` | Spec §11.5, §22 |
| **REQ-UP-01** | Page 5, 7 | Co-Purchase Ranking (+30 Promo, +20 Affinity, +20 Margin, +10 Cat) | `RecommendationService` | `GET /api/quotations/{id}/recommendations` | `UpsellCrossSellRules`, `Products` | `UpsellDrawer` | `TC-UP-01` | Spec §13.1 |
| **REQ-UP-02** | Page 6, 7 | Live Upsell Gross Margin Delta Simulation | `RecommendationService` | `GET /api/quotations/{id}/recommendations` | `Products`, `QuotationLines` | `UpsellCard` | `TC-UP-02` | Spec §13.2 |
| **REQ-UP-03** | Page 6, 7 | 1-Click Upsell Acceptance & Instant Cart Reprice | `RecommendationService` | `POST /api/quotations/{id}/recommendations/{id}/accept` | `QuotationLines`, `Quotations` | `QuoteBuilder` | `TC-UP-03` | Spec §13.2 |
| **REQ-WH-01** | Page 4, 17 | Multi-Warehouse Master & Shipping Cost Weightings | `FulfillmentService` | `GET /api/warehouses` | `Warehouses` | `/admin/warehouses` | `TC-WH-01` | Spec §14.1 |
| **REQ-WH-02** | Page 4, 17 | Stock Availability Tracking ($\text{Available} = \text{OnHand} - \text{Reserved}$) | `FulfillmentService` | `GET /api/warehouses/{id}/stock` | `InventoryStocks` | `FulfillmentModal` | `TC-WH-02` | Spec §14.1 |
| **REQ-WH-03** | Page 4, 17 | Cost-Weighted Greedy Warehouse Allocation Optimization | `FulfillmentService` | `GET /api/orders/{id}/fulfillment-preview` | `WarehouseAllocations` | `FulfillmentScreen` | `TC-WH-03` | Spec §14.1 |
| **REQ-WH-04** | Page 7, 17 | Manual Split Fulfillment Override by Operations | `FulfillmentService` | `PUT /api/orders/{id}/fulfillment/override` | `WarehouseAllocations` | `FulfillmentScreen` | `TC-WH-04` | Spec §14.2 |
| **REQ-WH-05** | Page 7, 17 | Backorder Reservation & Auto-Consolidation Trigger on Restock | `FulfillmentService` | `POST /api/orders/{id}/backorders/consolidate` | `Backorders`, `WarehouseAllocations` | `BackorderBanner` | `TC-WH-05` | Spec §14.2 |
| **REQ-SUB-01** | Page 5, 18 | Hybrid Invoicing (One-Time $\rightarrow$ Commercial Invoice, Recurring $\rightarrow$ Schedule) | `BillingService` | `GET /api/orders/{id}/billing`<br>`POST /api/orders/{id}/billing/generate` | `Invoices`, `BillingSchedules` | `BillingScreen` | `TC-SUB-01` | Spec §15.1 |
| **REQ-SUB-02** | Page 5, 18 | Calendar-Accurate Mid-Cycle Seat Proration | `BillingService` | `POST /api/subscriptions/{id}/change` | `BillingSchedules`, `SubscriptionPlans` | `ProrationModal` | `TC-SUB-02` | Spec §15.3 |
| **REQ-SUB-03** | Page 5, 18 | Subscription Cancellation & Credit Note Generation | `BillingService` | `POST /api/subscriptions/{id}/cancel`<br>`POST /api/invoices/{id}/credit-notes` | `CreditNotes`, `Invoices` | `BillingScreen` | `TC-SUB-03` | Spec §15.2 |
| **REQ-PORT-01**| Page 8, 19 | Separate Restricted Customer Negotiation Portal Surface | `NegotiationService` | `GET /api/portal/quotations/{id}` | `Quotations` | `/portal/quotations/:id` | `TC-PORT-01` | Spec §16.1 |
| **REQ-PORT-02**| Page 8, 19 | Zero-Leak Customer Boundary (Shield Cost, Margin, Risk, Internal Notes)| `NegotiationService` | `GET /api/portal/quotations/{id}` | `PortalQuotationResponse` | `/portal/quotations/:id` | `TC-PORT-02` | Spec §16.1, §20 |
| **REQ-PORT-03**| Page 8, 19 | Customer Line-Level Inquiries & Comment Feed | `NegotiationService` | `POST /api/portal/quotations/{id}/line-requests` | `QuotationLineComments` | `PortalCommentDrawer` | `TC-PORT-03` | Spec §16.2 |
| **REQ-PORT-04**| Page 8, 19 | Customer Counter-Discount with Auto Re-Approval Trigger | `NegotiationService` | `POST /api/portal/quotations/{id}/counter-discount` | `QuotationChanges`, `ApprovalRequests` | `PortalCounterBar` | `TC-PORT-04` | Spec §16.3 |
| **REQ-PORT-05**| Page 3, 19 | 1-Click Final Order Confirmation by Customer | `NegotiationService` | `POST /api/portal/quotations/{id}/confirm` | `Quotations`, `Orders` | `PortalActionBar` | `TC-PORT-05` | Spec §16.3 |
| **REQ-HLTH-01**| Page 8, 20 | Stalled Deal Detection (>5 Days Inactivity) | `DealHealthService` | `GET /api/dashboard/deal-health` | `DealHealthSnapshots` | `HealthDashboard` | `TC-HLTH-01` | Spec §17.1 |
| **REQ-HLTH-02**| Page 8, 20 | Sales Rep Discount Anomaly Detection ($>2\sigma$ Rolling Baseline) | `DealHealthService` | `GET /api/deal-health/alerts` | `DealHealthSnapshots`, `Users` | `AnomalyCard` | `TC-HLTH-02` | Spec §17.1 |
| **REQ-HLTH-03**| Page 8, 20 | Promised Delivery Date Slippage Alert | `DealHealthService` | `GET /api/deal-health/alerts` | `DealHealthSnapshots`, `Quotations` | `SlippageAlert` | `TC-HLTH-03` | Spec §17.1 |
| **REQ-HLTH-04**| Page 20 | Transparent 0–100 Health Score (Healthy 70–100, At Risk 40–69, Critical 0–39)| `DealHealthService` | `GET /api/quotations/{id}/health` | `DealHealthSnapshots` | `DealHealthBadge` | `TC-HLTH-04` | Spec §17.2 |
| **REQ-HLTH-05**| Page 8, 20 | Manager Nudge & Executive Escalation Action Dispatch | `DealHealthService` | `POST /api/deal-health/alerts/{id}/nudge`<br>`POST /api/deal-health/alerts/{id}/escalate` | `Notifications` | `AlertActionMenu` | `TC-HLTH-05` | Spec §17.3 |
| **REQ-REP-01** | Page 5, 22 | Sales Reporting with Period, Rep/Team, Status, Category Filters | `ReportingService` | `GET /api/reports/sales-summary`<br>`GET /api/reports/quotations` | Dapper Views / `Orders`, `Quotations` | `/reports` | `TC-REP-01` | Spec §19 |
| **REQ-REP-02** | Page 5, 22 | Formatted Binary File Exports (PDF & Excel) | `ReportingService` | `GET /api/reports/export/pdf`<br>`GET /api/reports/export/xls` | `QuestPDF`, `ClosedXML` | `ReportExportModal` | `TC-REP-02` | Spec §19 |
| **REQ-ORD-01** | Page 21 | Immutable Order Conversion Guard from Approved/Confirmed Quote | `QuotationService` | `POST /api/quotations/{id}/confirm-order` | `Orders`, `OrderLines` | `OrderSummaryScreen` | `TC-ORD-01` | Spec §21 |
| **REQ-PAY-01** | Page 21 | Payment Recording & Cumulative Balance Updates (Unpaid/PartiallyPaid/Paid) | `BillingService` | `POST /api/invoices/{id}/payments` | `Payments`, `Invoices` | `PaymentModal` | `TC-PAY-01` | Spec §21 |
| **REQ-TEST-01**| Page 11, 31 | 8-Step Must-Pass Quick Test Flow & 5-Minute Judge Demo Script | Full Suite | End-to-End Test Suite | All Tables | All Screens | `TC-QTF-01..08` | Spec §28, §34 |

---

## 3. Completeness & Traceability Verification

- **Total Requirements Itemized**: **39**
- **Requirements Traced to ASP.NET Core Backend Service**: **39 (100%)**
- **Requirements Traced to API Endpoints**: **39 (100%)**
- **Requirements Traced to SQL Server Tables**: **39 (100%)**
- **Requirements Traced to React Screens/Components**: **39 (100%)**
- **Requirements Traced to Automated Test Cases**: **39 (100%)**
- **Orphan Requirements Detected**: **0**
