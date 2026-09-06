# DEALFLOW360 — Frontend Architecture & Implementation Guide

## 1. Architectural Foundation

DealFlow360's frontend is engineered as a high-performance, enterprise-grade B2B SaaS CRM platform.

### Strict Architectural Principles
- **Hard Technology Lock**: Pure React 19, JavaScript (JSX/JS), Tailwind CSS v4, and Lucide React. **Strictly zero TypeScript** (.ts, .tsx, tsconfig.json).
- **Minimal Dependencies**: Zero external state libraries (no Redux, no Zustand, no TanStack Query, no Axios, no Formik). All remote and presentation states are managed via React standard primitives (`useState`, `useEffect`, `useCallback`, `useContext`).
- **Authoritative Backend Calculations**: The frontend acts purely as a presentation and user collection layer. Financial calculations (subtotals, multi-rate taxes, gross margins, blended risk scores, customer tier ceilings, inventory splits, prorations) are computed exclusively by the ASP.NET Core business engines.
- **RFC 7807 Error Normalization**: Centralized API client automatically translates standard ProblemDetails payloads into structured, accessible UI feedback.
- **Zero-Leak Security Boundary**: Public customer portal magic links strictly conceal internal cost prices, margins, risk scores, and approval rules.

---

## 2. Route Map & Role Permissions

| Route | Workspace Name | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/login` | Authentication | Public | Enterprise login with 1-click demo persona quick-select. |
| `/` | Root Index | Authenticated | Redirects automatically to `/dashboard`. |
| `/dashboard` | Sales Command Center | All internal roles | Executive sales KPIs, attention queue, deal health radar, recent proposals. |
| `/workspace/quotations` | Quotations Registry | SalesRep, SalesManager, Admin | Master searchable table of deals, margins, risk scores, and lifecycle states. |
| `/workspace/quotations/new` | Quotation Builder | SalesRep, SalesManager, Admin | Structured multi-line quote creation with tier discount ceiling guidance. |
| `/workspace/quotations/:id` | Quotation Workspace | SalesRep, SalesManager, Admin | Comprehensive proposal workspace, AI upsell recommendations, approval submission, order conversion. |
| `/workspace/pipeline` | CRM Pipeline Kanban | SalesRep, SalesManager, Admin | Multi-stage deal board with stage volume aggregations. |
| `/workspace/approvals` | Approval Decision Desk | SalesManager, FinanceOperations, Admin | Tiered discount triage queue, risk analysis, and action desk (Approve, RequestRevision, Reject). |
| `/workspace/fulfillment` | Warehouse Split Simulator | FinanceOperations, Admin | Cost-weighted multi-depot stock allocation and backorder consolidation. |
| `/workspace/billing` | Billing & Invoices | FinanceOperations, Admin | Commercial invoices, payment recording modal, and subscription seat proration. |
| `/workspace/deal-health` | Deal Health Surveillance | SalesManager, Admin | Anomaly radar detecting stalled proposals (>5 days) and discount outliers (>2σ). |
| `/workspace/reports` | Sales Performance Audit | SalesManager, FinanceOperations, Admin | Sales rep margin discipline audits, tier compliance, and CSV export. |
| `/workspace/customers` | Customer Registry | SalesRep, SalesManager, Admin | Enterprise accounts directory with tier assignments and credit limits. |
| `/portal/my-account` | Customer Account Portal | Customer, Admin | Authenticated customer portal view. |
| `/portal/quote/:token` | Customer Quote Portal | Public (Token-secured) | Zero-leak customer proposal review, line-level comments, and counter-discount proposals. |
| `/admin/*` | Master Setup Desks | Admin | Product catalog, price lists, discount matrices, approval chains, and warehouse depots. |

---

## 3. API Mapping & Backend Controllers

All requests flow through the centralized `src/api/apiClient.js` with base route `/api/` (proxied via Vite to `http://localhost:5042`).

| Domain API File | Backend Controller | Key Operations |
| :--- | :--- | :--- |
| `authApi.js` | `AuthController` | `POST /api/auth/login`<br>`GET /api/auth/me`<br>`POST /api/auth/refresh-token` |
| `quotationApi.js` | `QuotationsController` | `GET /api/quotations`<br>`POST /api/quotations`<br>`GET /api/quotations/:id`<br>`POST /api/quotations/:id/recalculate`<br>`POST /api/quotations/:id/submit-approval`<br>`GET /api/quotations/:id/recommendations`<br>`POST /api/quotations/:id/convert-to-order`<br>`POST /api/quotations/:id/generate-portal-link` |
| `approvalApi.js` | `ApprovalsController` | `GET /api/approvals/pending`<br>`GET /api/approvals/:id`<br>`POST /api/approvals/:id/action` |
| `fulfillmentApi.js` | `FulfillmentController` | `GET /api/fulfillment/preview/:orderId`<br>`POST /api/fulfillment/allocate/:orderId`<br>`GET /api/fulfillment/backorders`<br>`POST /api/fulfillment/replenish` |
| `billingApi.js` | `BillingController`<br>`InvoicesController` | `GET /api/billing/subscriptions`<br>`POST /api/billing/subscriptions/prorate`<br>`GET /api/invoices`<br>`POST /api/invoices/:id/payments`<br>`POST /api/invoices/:id/credit-note` |
| `dealHealthApi.js` | `DealHealthController` | `GET /api/dealhealth/summary`<br>`GET /api/dealhealth/anomalies`<br>`GET /api/dealhealth/stalled` |
| `reportApi.js` | `ReportsController` | `GET /api/reports/dashboard`<br>`GET /api/reports/pipeline`<br>`GET /api/reports/sales-performance` |
| `customerApi.js` | `CustomersController` | `GET /api/customers`<br>`GET /api/customers/:id` |
| `adminApi.js` | `AdminController` | `GET /api/admin/products`<br>`GET /api/admin/customer-tiers`<br>`GET /api/admin/price-lists`<br>`GET /api/admin/discount-rules`<br>`GET /api/admin/approval-rules`<br>`GET /api/admin/warehouses` |
| `portalApi.js` | `PortalController` | `GET /api/portal/quote/:token`<br>`POST /api/portal/quote/:token/comment`<br>`POST /api/portal/quote/:token/counter-discount`<br>`POST /api/portal/quote/:token/confirm` |

---

## 4. Authentication & Session Flow

1. **Credentials Dispatch**: User inputs credentials or selects 1-click demo persona on `/login`.
2. **Token Acquisition**: Backend returns `AuthResponse` containing `AccessToken` (JWT) and `MeResponse`.
3. **Storage & Interception**: Token stored in `localStorage` under `dealflow_token`. Every subsequent `apiRequest` automatically injects `Authorization: Bearer <token>`.
4. **Session Revalidation**: On app load, `AuthContext` calls `GET /api/auth/me`. If token is expired or invalid, it gracefully purges state and redirects to `/login`.
5. **Unauthorized Interception**: `apiClient.js` intercepts 401 responses and dispatches a global `dealflow:unauthorized` event to reset the session.
6. **1-Click Role Switcher**: Top header provides an instant demo persona bar allowing reviewers to switch between SalesRep, SalesManager, FinanceOperations, and Admin without logging out.

---

## 5. Design System Primitives

All UI components reside in `src/components/ui/` and share strict design rules:
- **Buttons** (`Button.jsx`): Variants (`primary`, `secondary`, `outline`, `danger`, `success`, `ghost`, `link`), sizes (`xs`, `sm`, `md`, `lg`), focus-visible rings, disabled and loading spinner states.
- **Form Controls** (`Input.jsx`, `Select.jsx`, `Textarea.jsx`): Explicit `htmlFor` / `id` matching, start/end icons, `role="alert"` inline validation errors.
- **Badges** (`Badge.jsx`, `StatusBadge.jsx`): Semantic color tokens:
  - Margin Health: Green (`Healthy >= 25%`), Amber (`Attention >= 15%`), Red (`Critical < 15%`).
  - Deal Risk: Green (`Low 0-20`), Amber (`Medium 21-50`), Red (`High > 50`).
- **Data Display** (`DataTable.jsx`): Responsive scrolling table with column formatters, row-click hooks, empty state fallback, and animated loading indicators.
- **Overlays** (`Modal.jsx`, `Drawer.jsx`): Accessible modals and sliding drawers with backdrop-blur and keyboard/click-outside dismissals.
- **Feedback** (`ToastContext.jsx`, `LoadingSpinner.jsx`, `ErrorAlert.jsx`, `EmptyState.jsx`): Non-intrusive notifications and section-level retryable error states.

---

## 6. Known Backend Nuances Handled

1. **Approval Action Enum**: The backend `ApprovalRoutingEngine` expects `Approve`, `RequestRevision`, or `Reject`. The frontend normalizes user actions to these exact strings.
2. **Rejection / Revision Minimum Character Limit**: The backend strictly validates that reasons for rejection or revision request must be at least 10 characters (`reason.Trim().Length >= 10`). The UI enforces this validation before network dispatch.
3. **Product Catalog Route**: Products are retrieved via `GET /api/admin/products` which is marked with `[AllowAnonymous]` to permit quoting by Sales Representatives.
4. **Role Permissions on Reports**: `/api/reports/dashboard` requires `SalesManager`, `FinanceOperations`, or `Admin`. When viewed by a `SalesRep`, the dashboard automatically falls back to an authoritative local aggregation of the rep's quotations, eliminating unauthorized 403 errors and zero fabrication.
