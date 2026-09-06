# DealFlow360 — REST API Specification & Endpoint Catalogue

This document provides a comprehensive catalogue of the RESTful HTTP APIs provided by **DealFlow360.API**, detailing route paths, HTTP methods, authorization requirements, payload structures, and response models.

---

## 1. Interactive API Documentation & OpenAPI Specification

The backend provides built-in interactive documentation powered by **Scalar** and **Microsoft.AspNetCore.OpenApi**:

- **Scalar Dashboard (UI):** `http://localhost:5042/scalar/v1`
- **OpenAPI 3.0 Document (JSON):** `http://localhost:5042/openapi/v1.json`

---

## 2. Global Standards & Conventions

- **Base URL:** `http://localhost:5042/api`
- **Content-Type:** `application/json` (except binary PDF downloads which stream `application/pdf`).
- **Authentication:** `Authorization: Bearer <accessToken>` header for protected endpoints.
- **Error Format:** RFC 7807 Problem Details:
  ```json
  {
    "type": "https://dealflow360.io/errors/validation",
    "title": "Bad Request",
    "status": 400,
    "detail": "Detailed explanation of the validation failure or rule constraint violation.",
    "traceId": "0HN...:00000001"
  }
  ```

---

## 3. Core API Endpoint Catalogue

### 3.1 Authentication (`/api/auth`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Anonymous | Authenticates staff or customer using email and password. Returns JWT access token, refresh token, and user profile. |
| `POST` | `/api/auth/refresh` | Anonymous | Exchanges a valid refresh token for a new access token. |
| `GET` | `/api/auth/me` | Authenticated | Retrieves the current session user context, claims, and role. |
| `POST` | `/api/auth/change-password` | Authenticated | Updates current user password. |

#### Login Request Payload:
```json
{
  "email": "rep@dealflow360.io",
  "password": "Rep@123"
}
```

#### Login Response Model:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6...",
  "refreshToken": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
  "expiresAtUtc": "2026-09-06T18:00:00Z",
  "user": {
    "id": 10,
    "name": "Priya Patel",
    "email": "rep@dealflow360.io",
    "role": "SalesRep",
    "customerId": null
  }
}
```

---

### 3.2 Quotations (`/api/quotations`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/quotations` | Staff | Retrieves paginated and filtered quotation proposals (by status, customer, date range, search). |
| `GET` | `/api/quotations/{id}` | Staff | Retrieves detailed quotation aggregate with lines, pricing, margin, risk score, and negotiation history. |
| `POST` | `/api/quotations` | SalesRep, Manager, Admin | Creates a new commercial quotation. Validates tier limits and triggers auto-approval if compliant. |
| `PUT` | `/api/quotations/{id}` | SalesRep, Manager, Admin | Updates header metadata (validity date, notes, currency). |
| `POST` | `/api/quotations/{id}/lines` | SalesRep, Manager, Admin | Appends a line item from the catalog, re-evaluating risk, margin, and tier governance. |
| `PUT` | `/api/quotations/{id}/lines/{lineId}` | SalesRep, Manager, Admin | Updates line item quantity or requested discount percentage. |
| `DELETE` | `/api/quotations/{id}/lines/{lineId}` | SalesRep, Manager, Admin | Removes a line item. |
| `POST` | `/api/quotations/{id}/submit-approval` | SalesRep, Manager, Admin | Formally submits proposal for internal governance review. |
| `POST` | `/api/quotations/{id}/send` | SalesRep, Manager, Admin | Marks quotation as sent to customer. |
| `POST` | `/api/quotations/{id}/generate-portal-link` | SalesRep, Manager, Admin | Generates cryptographic HMAC-SHA256 magic link for isolated client negotiation. |
| `POST` | `/api/quotations/{id}/convert-to-order` | SalesRep, Manager, Admin | Converts an approved quotation into an active fulfillment order. Automatically invokes warehouse allocation and billing generation. |
| `GET` | `/api/quotations/{id}/pdf` | Staff | Generates and streams commercial proposal PDF via QuestPDF. |
| `GET` | `/api/quotations/{id}/recommendations` | Staff | Retrieves real-time upsell and cross-sell suggestions evaluated by `UpsellCrossSellEngine`. |

---

### 3.3 Approvals & Governance (`/api/approvals`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/approvals` | Manager, Finance, Admin | Retrieves pending approval queue filtered by approval status (`Pending`, `Approved`, `Rejected`). |
| `GET` | `/api/approvals/{id}` | Manager, Finance, Admin | Retrieves detailed approval request including risk metrics and discount breakdown. |
| `POST` | `/api/approvals/{id}/approve` | Manager, Finance, Admin | Grants governance approval. Enforces zero self-approval. Escalates to Finance if risk $\ge 70$ or discount $> 15\%$. |
| `POST` | `/api/approvals/{id}/reject` | Manager, Finance, Admin | Rejects quotation discount request. Requires mandatory remarks ($\ge 10$ characters). |

#### Reject Request Payload:
```json
{
  "remarks": "Discount exceeds target margin for Q3; please negotiate maximum 8%."
}
```

---

### 3.4 Invoices & Billing (`/api/invoices`, `/api/billing`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/invoices` | Staff | Lists commercial invoices with `orderId`, `orderNumber`, status, totals, and outstanding balances. |
| `GET` | `/api/invoices/{id}` | Staff | Retrieves invoice detail with line breakdown, payment logs, and credit notes. |
| `POST` | `/api/invoices/{id}/pay` | Finance, Admin | Records an incoming payment against an invoice. Updates status to `Paid` when fully settled. |
| `POST` | `/api/invoices/{id}/credit-notes` | Finance, Admin | Issues a credit memo reducing the outstanding balance. |
| `GET` | `/api/billing/subscriptions` | Manager, Finance, Admin | Retrieves active SaaS subscription schedules. |
| `POST` | `/api/billing/subscriptions/{id}/cancel` | Finance, Admin | Cancels an active subscription schedule. |
| `POST` | `/api/billing/subscriptions/{id}/adjust-seats` | Finance, Admin | Adjusts subscription seat count with calendar-accurate mid-cycle proration. |

#### Payment Request Payload:
```json
{
  "amount": 150000.00,
  "paymentMethod": "WireTransfer",
  "reference": "UTR-20260906-88992"
}
```

---

### 3.5 Multi-Warehouse Fulfillment (`/api/fulfillment`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/fulfillment/orders` | Staff | Retrieves orders ready for fulfillment or in packing/dispatch state. |
| `GET` | `/api/fulfillment/orders/{id}` | Staff | Retrieves order warehouse allocation breakdown and backorder items. |
| `POST` | `/api/fulfillment/orders/{id}/allocate` | Staff | Executes greedy warehouse allocation algorithm. |
| `POST` | `/api/fulfillment/orders/{id}/dispatch` | Staff | Dispatches package, assigns tracking number, and decrements physical inventory stock. |
| `GET` | `/api/fulfillment/warehouses` | Staff | Lists active warehouse facilities and current stock counts. |

---

### 3.6 Customer Portal Surface (`/api/portal` & `/api/customers/me`)

#### Public / Magic Link Endpoints (`/api/portal/quote/{token}`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/portal/quote/{token}` | Anonymous (HMAC Token) | Retrieves Zero-Leak quotation view for client inspection. |
| `GET` | `/api/portal/quote/{token}/pdf` | Anonymous (HMAC Token) | Downloads commercial proposal PDF via token validation. |
| `POST` | `/api/portal/quote/{token}/confirm` | Anonymous (HMAC Token) | Formally authorizes and confirms proposal into an active order. |
| `POST` | `/api/portal/quote/{token}/counter-offer` | Anonymous (HMAC Token) | Submits customer counter-discount. Re-routes to approval if above tier. |
| `POST` | `/api/portal/quote/{token}/counter-offer/accept` | Anonymous (HMAC Token) | Accepts Sales Representative's negotiated counter-offer. |
| `POST` | `/api/portal/quote/{token}/counter-offer/reject` | Anonymous (HMAC Token) | Rejects Sales Representative's negotiated counter-offer. |
| `POST` | `/api/portal/quote/{token}/lines/{lineId}/comment` | Anonymous (HMAC Token) | Submits a question/comment on a specific line item. |

#### Authenticated Customer Portal (`/api/customers/me/*`)
| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers/me/quotations` | Customer, Admin | Retrieves quotations issued to the authenticated customer account. |
| `GET` | `/api/customers/me/quotations/{id}` | Customer, Admin | Retrieves quotation detail (enforces organizational ownership). |
| `GET` | `/api/customers/me/quotations/{id}/pdf` | Customer, Admin | Downloads PDF for own quotation. |
| `POST` | `/api/customers/me/quotations/{id}/confirm` | Customer, Admin | Formally binds quotation into active order. |
| `POST` | `/api/customers/me/quotations/{id}/counter-offer` | Customer, Admin | Submits counter-offer. |
| `GET` | `/api/customers/me/orders` | Customer, Admin | Retrieves confirmed orders and fulfillment status. |
| `GET` | `/api/customers/me/invoices` | Customer, Admin | Retrieves commercial invoices and payment receipts. |
| `GET` | `/api/customers/me/profile` | Customer, Admin | Retrieves organization profile, tier level, and assigned sales rep. |

---

### 3.7 Deal Health & Reporting (`/api/dealhealth`, `/api/reports`)

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/dealhealth/summary` | Manager, Admin | Retrieves stalled deal counts, discount variance anomalies ($>2\sigma$), and pipeline health score. |
| `GET` | `/api/reports/sales-performance` | Manager, Finance, Admin | Retrieves aggregate sales velocity, closed revenue, and rep quota attainment. |
| `GET` | `/api/reports/discount-governance` | Manager, Finance, Admin | Analyzes discount variance by tier, category, and approval outcome. |
| `GET` | `/api/reports/revenue-leakage` | Manager, Finance, Admin | Identifies margin erosion from excessive discounting and split shipment costs. |
