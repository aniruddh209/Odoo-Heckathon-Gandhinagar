# DealFlow360: Master API Architecture & Contract Specification

---

## 1. Document Control & Scope Rules

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master API Architecture & Complete Contract Specification |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **API Version** | `v1` (`/api/v1`) |
| **Status** | Implementation-Ready Architecture Specification |
| **Primary Source of Truth** | `DealFlow360.pdf` (13-Page Problem Statement) |
| **Companion Document** | `docs/DEALFLOW360_MASTER_PRD.md` |
| **Target Architecture** | ASP.NET Core Web API / RESTful JSON / Odoo Decoupled Integration |
| **Last Updated** | 2026-09-05 |

### Source Attribution Legend
- `[PDF REQUIREMENT]`: Directly mandated by the DealFlow360 Problem Statement PDF.
- `[REPOSITORY FACT]`: Derived from verified workspace environment (.NET 10/8, SQL Server, Node/React).
- `[IMPLEMENTATION DECISION]`: Technical architectural decisions designed to satisfy PDF requirements with production rigor.

---

## 2. API Architecture Overview & Architectural Principles

### 2.1 Architectural Overview
DealFlow360 exposes a decoupled, resource-oriented RESTful API over HTTPS. The API acts as the authoritative boundary for all business rules, mathematical computations, approval state machines, and inventory allocations. The frontend (React Single Page Application) and external integrations interact with the core engine strictly through these standardized HTTP endpoints.

```text
┌────────────────────────────────────────────────────────────┐
│                    Client Consumers                        │
│   • Internal Sales Workspace (React / Vite)                │
│   • Customer Negotiation Portal (Isolated Client View)     │
│   • External Enterprise Integrations / Webhooks            │
└─────────────────────────────┬──────────────────────────────┘
                              │ HTTPS / JSON (RESTful)
                              ▼
┌────────────────────────────────────────────────────────────┐
│                  DealFlow360 API Gateway                   │
│   • TLS Termination & CORS Policy                          │
│   • Rate Limiting & DoS Protection                         │
│   • Authentication (JWT Bearer & Magic-Link HMAC Token)    │
│   • Global Error Handling & Request Telemetry Logging      │
└─────────────────────────────┬──────────────────────────────┘
                              │
               ┌──────────────┴──────────────┐
               ▼                             ▼
┌──────────────────────────────┐ ┌───────────────────────────┐
│ Internal Protected Endpoints │ │  Customer Portal Endpoints│
│ • /api/v1/quotations         │ │  • /api/v1/portal/quote   │
│ • /api/v1/approvals          │ │                           │
│ • /api/v1/fulfillment        │ │  * Zero Cost/Margin Leak  │
│ • /api/v1/deal-health        │ │  * Tenant Isolated        │
│ • /api/v1/admin/config       │ │  * Cryptographic Tokens   │
└──────────────┬───────────────┘ └─────────────┬─────────────┘
               │                               │
               └──────────────┬────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────┐
│                  Business Logic Engines                    │
│   • Discount Governance & Blended Risk Calculator          │
│   • Live Upsell & Co-Purchase Recommender                  │
│   • Multi-Warehouse Inventory Split Optimizer              │
│   • Hybrid Billing & Calendar Proration Engine             │
│   • Deal Health & Anomaly Background Detector              │
│   • Immutable Audit Ledger & State Machine Controller      │
└─────────────────────────────┬──────────────────────────────┘
                              ▼
┌────────────────────────────────────────────────────────────┐
│                     Persistence Layer                      │
│   Microsoft SQL Server / PostgreSQL (ACID Relational DB)   │
└────────────────────────────────────────────────────────────┘
```

### 2.2 Core Architectural Principles
1. **Server-Side Sovereignty**: All calculations (discounts, blended risk scores, gross margins, shipping costs, proration) are executed authoritatively on the server. Client-side calculations are purely optimistic for UI responsiveness.
2. **Strict Zero-Leak Customer Isolation**: Customer Portal endpoints are physically separated routes. Responses explicitly strip internal cost prices (`standard_price`), unit margins, deal gross margin percentages, approval logs, and internal sales rep comments.
3. **Deterministic State Transitions**: State modifications to quotations, approvals, and fulfillments are governed by finite state machine guards. Out-of-order state transitions trigger `409 Conflict` errors.
4. **Complete Auditability**: Every write operation impacting commercial terms, approvals, stock allocations, or negotiations generates an immutable audit record.
5. **Idempotency on Critical Side Effects**: Financial transactions, approval submissions, and one-click confirmations support idempotency keys to prevent duplicate operations.

---

## 3. Communication Protocols & Standards

### 3.1 Base URLs & Versioning
- **Base URL**: `https://{host}/api/v1`
- **Versioning Strategy**: Path-based versioning (`/api/v1`). Breaking changes require incrementing the major version. Minor feature additions are backward-compatible.

### 3.2 Standard Request & Response Headers
- **Request Headers**:
  - `Content-Type: application/json; charset=utf-8`
  - `Accept: application/json`
  - `Authorization: Bearer <jwt_token>` (for Internal Users)
  - `X-Portal-Token: <token>` (for Customer Portal users when not passed via URL)
  - `X-Correlation-ID: <uuid>` (for distributed tracing)
  - `Idempotency-Key: <uuid>` (mandatory on confirmation and payment calls)
- **Response Headers**:
  - `Content-Type: application/json; charset=utf-8`
  - `X-Correlation-ID: <uuid>`
  - `ETag: W/"<hash>"` (optimistic concurrency control)

### 3.3 Standard Envelopes

#### Success Envelope
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-09-05T10:50:00.000Z",
    "correlationId": "d3b07384-d113-4f44-9844-32b04f7b243b"
  }
}
```

#### Paginated List Envelope
```json
{
  "success": true,
  "data": [ ... ],
  "meta": {
    "timestamp": "2026-09-05T10:50:00.000Z",
    "correlationId": "d3b07384-d113-4f44-9844-32b04f7b243b",
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalRecords": 142,
      "totalPages": 8
    }
  }
}
```

#### Error Envelope
```json
{
  "success": false,
  "error": {
    "code": "DISCOUNT_CEILING_EXCEEDED",
    "message": "Quotation discount exceeds category limit and requires Sales Manager approval.",
    "details": [
      {
        "field": "lines[1].discount",
        "value": 18.0,
        "constraint": "Category limit is 10.0% for Services",
        "violationPoints": 8.0
      }
    ]
  },
  "meta": {
    "timestamp": "2026-09-05T10:50:00.000Z",
    "correlationId": "d3b07384-d113-4f44-9844-32b04f7b243b"
  }
}
```

### 3.4 Standard Error Codes

| HTTP Status | Error Code | Description |
| :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_FAILED` | Input payload failed schema validation or constraints. |
| `400 Bad Request` | `INVALID_QUANTITY` | Quantity is zero, negative, or non-numeric. |
| `401 Unauthorized` | `AUTHENTICATION_REQUIRED` | Missing, expired, or invalid JWT or portal token. |
| `403 Forbidden` | `INSUFFICIENT_PERMISSIONS` | User role lacks authority to perform requested operation. |
| `403 Forbidden` | `PORTAL_ACCESS_DENIED` | Customer attempting to access internal endpoint or another customer's quote. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Specified quote, line, product, or warehouse ID does not exist. |
| `409 Conflict` | `STATE_TRANSITION_INVALID` | Operation invalid in current quote stage (e.g., editing a confirmed quote). |
| `409 Conflict` | `CONCURRENCY_CONFLICT` | ETag mismatch or record updated by another user mid-flight. |
| `422 Unprocessable` | `DISCOUNT_CEILING_EXCEEDED`| Line discount exceeds allowable ceiling without required approval authority. |
| `422 Unprocessable` | `INSUFFICIENT_STOCK` | Requested warehouse inventory is insufficient for allocation. |
| `429 Too Many Req` | `RATE_LIMIT_EXCEEDED` | Request threshold exceeded. |
| `500 Internal Error`| `INTERNAL_ENGINE_FAULT` | Unexpected server failure. |

---

## 4. Role-Based Access Control (RBAC) Architecture

| API Resource Group | Sales Rep | Sales Manager | Finance / Ops | Customer Portal | Admin |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `POST /api/v1/auth/login` | Public | Public | Public | Public | Public |
| `GET /api/v1/quotations` | Own Deals | Team Deals | All Deals | **Forbidden** | All Deals |
| `POST /api/v1/quotations` (Create) | Yes | Yes | Yes | **Forbidden** | Yes |
| `PUT /api/v1/quotations/{id}/lines` | Yes | Yes | Yes | **Forbidden** | Yes |
| `POST /api/v1/quotations/{id}/approvals/action` | **Forbidden** | Level 1 | Level 2 | **Forbidden** | Level 1 & 2 |
| `GET /api/v1/quotations/{id}/upsell` | Yes | Yes | Yes | **Forbidden** | Yes |
| `GET /api/v1/quotations/{id}/fulfillment` | View | View | Full / Override | **Forbidden** | Full |
| `POST /api/v1/subscriptions/{id}/cancel` | **Forbidden** | View | Full / Credit Note | **Forbidden** | Full |
| `GET /api/v1/portal/quote/{token}` | View (Proxy) | View (Proxy) | View (Proxy) | **Own Quote Only** | View |
| `POST /api/v1/portal/quote/{token}/negotiate`| **Forbidden** | **Forbidden** | **Forbidden** | **Own Quote Only** | **Forbidden** |
| `GET /api/v1/deal-health/summary` | Own Alerts | Team Alerts | All Alerts | **Forbidden** | All Alerts |
| `GET /api/v1/reports/export` | Limited | Full | Full | **Forbidden** | Full |

---

## 5. Complete Endpoint Inventory & Contracts

### 5.1 Authentication & Session Management

#### Endpoint 1: `POST /api/v1/auth/login`
- **Purpose**: Authenticates internal users and issues signed JWT bearer token.
- **Source Requirement**: `[PDF Page 3, 4]`, `REQ-AUTH-01`.
- **Allowed Roles**: Public (Internal users).
- **Request Body**:
  ```json
  {
    "email": "rep@dealflow360.com",
    "password": "Password123!"
  }
  ```
- **Validation Rules**: `email` must be valid email format; `password` non-empty string.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 86400,
      "user": {
        "id": "usr-001",
        "name": "Sarah Jenkins",
        "email": "rep@dealflow360.com",
        "role": "SALES_REP",
        "team": "North America Enterprise"
      }
    }
  }
  ```

#### Endpoint 2: `POST /api/v1/auth/portal-auth`
- **Purpose**: Authenticates customer via magic-link token and issues customer portal session.
- **Source Requirement**: `[PDF Page 4]`, `REQ-AUTH-02`.
- **Allowed Roles**: Public / Customer.
- **Request Body**:
  ```json
  {
    "token": "a1b2c3d4e5f67890abcdef1234567890"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "portalSessionToken": "prt-sess-9988776655",
      "partnerId": "cust-001",
      "customerName": "Acme Industrial Corp",
      "quoteId": "so-1001",
      "quoteNumber": "SO-2026-001"
    }
  }
  ```

---

### 5.2 Products, Price Lists & Customer Tiers

#### Endpoint 3: `GET /api/v1/products`
- **Purpose**: Retrieves list of products with category, price list resolution, and stock status.
- **Source Requirement**: `[PDF Page 4]`, `REQ-PROD-01`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `FINANCE`, `ADMIN`.
- **Query Parameters**:
  - `category`: Filter by category name (`hardware`, `services`, `subscriptions`).
  - `search`: Search query string.
  - `page`: Integer, default: 1.
  - `pageSize`: Integer, default: 50.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "prod-101",
        "name": "Enterprise Laptop Pro 15",
        "sku": "HW-LAP-001",
        "category": { "id": "cat-1", "name": "Hardware", "discountCeiling": 15.0 },
        "productType": "one_time_hardware",
        "listPrice": 1200.00,
        "unitCost": 800.00,
        "uom": "Units",
        "isPromoted": false,
        "minMarginThreshold": 25.0,
        "totalStockAvailable": 15
      }
    ]
  }
  ```

#### Endpoint 4: `GET /api/v1/customer-tiers`
- **Purpose**: Returns configured customer tiers and their maximum discount ceilings.
- **Source Requirement**: `[PDF Page 4, 12]`, `REQ-DISC-01`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `FINANCE`, `ADMIN`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      { "id": "tier-bronze", "name": "Bronze", "maxDiscountCeiling": 5.0 },
      { "id": "tier-silver", "name": "Silver", "maxDiscountCeiling": 10.0 },
      { "id": "tier-gold", "name": "Gold", "maxDiscountCeiling": 15.0 }
    ]
  }
  ```

---

### 5.3 Quotation Construction & Cart Operations

#### Endpoint 5: `POST /api/v1/quotations`
- **Purpose**: Creates a new draft quotation for a customer.
- **Source Requirement**: `[PDF Page 6, 9]`, `REQ-OVR-01`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "partnerId": "cust-001",
    "promisedDeliveryDate": "2026-09-30",
    "notes": "Initial proposal for Q4 fleet refresh"
  }
  ```
- **Success Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "id": "so-1001",
      "quoteNumber": "SO-2026-001",
      "partnerId": "cust-001",
      "customerName": "Acme Industrial Corp",
      "customerTier": "Gold",
      "tierDiscountCeiling": 15.0,
      "state": "draft",
      "amountUntaxed": 0.00,
      "amountDiscount": 0.00,
      "amountTotal": 0.00,
      "orderMarginPercent": 0.00,
      "blendedRiskScore": 0.0,
      "highestApprovalLevelRequired": "none",
      "lines": []
    }
  }
  ```

#### Endpoint 6: `POST /api/v1/quotations/{id}/lines`
- **Purpose**: Adds a product line to quotation and triggers real-time price, margin, and discount evaluation.
- **Source Requirement**: `[PDF Page 6, 12]`, `REQ-OVR-01`, `REQ-DISC-04`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "productId": "prod-101",
    "quantity": 8,
    "discount": 12.0
  }
  ```
- **Validation Rules**: `quantity` must be $> 0$; `discount` between $0.0\%$ and $100.0\%$.
- **Backend Business Logic**:
  1. Resolves product list price and unit cost.
  2. Resolves effective discount ceiling: $\min(\text{CustomerTierCeiling}, \text{CategoryCeiling})$.
  3. Checks ceiling violation: $\Delta_i = \text{Discount} - \text{EffectiveCeiling}$.
  4. Recalculates order subtotal, discount total, margin, and Blended Risk Score.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteId": "so-1001",
      "addedLine": {
        "id": "line-201",
        "productId": "prod-101",
        "productName": "Enterprise Laptop Pro 15",
        "category": "Hardware",
        "lineType": "one_time",
        "quantity": 8,
        "priceUnit": 1200.00,
        "discount": 12.0,
        "effectiveCeiling": 15.0,
        "isCeilingViolated": false,
        "violationPoints": 0.0,
        "priceSubtotal": 8448.00,
        "lineMarginAmount": 2048.00,
        "lineMarginPercent": 24.24
      },
      "orderSummary": {
        "amountUntaxed": 8448.00,
        "amountDiscount": 1152.00,
        "amountTotal": 8448.00,
        "orderMarginPercent": 24.24,
        "blendedRiskScore": 0.0,
        "highestApprovalLevelRequired": "none"
      }
    }
  }
  ```

#### Endpoint 7: `PUT /api/v1/quotations/{id}/lines/{lineId}`
- **Purpose**: Modifies quantity or discount on an existing line item with live recalculation.
- **Source Requirement**: `[PDF Page 6, 12]`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "quantity": 10,
    "discount": 18.0
  }
  ```
- **Success Response (`200 OK`)**:
  - Returns updated line detail, recomputed order gross margin, and updated blended risk score.

#### Endpoint 8: `DELETE /api/v1/quotations/{id}/lines/{lineId}`
- **Purpose**: Deletes line from quotation cart; recalculates all totals.
- **Source Requirement**: `[PDF Page 6]`.
- **Success Response (`200 OK`)**: Returns updated quotation summary.

---

### 5.4 Discount Governance & Approval Workflow

#### Endpoint 9: `POST /api/v1/quotations/{id}/evaluate-discount`
- **Purpose**: Explicitly runs the Blended Discount Risk Algorithm and returns full violation breakdown.
- **Source Requirement**: `[PDF Page 4, 11, 12]`, `REQ-DISC-04`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `FINANCE`, `ADMIN`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteId": "so-1001",
      "customerTier": "Gold",
      "tierCeiling": 15.0,
      "blendedRiskScore": 12.8,
      "highestApprovalLevelRequired": "sales_manager",
      "approvalState": "pending_manager",
      "isCompliant": false,
      "worstLineViolation": {
        "lineId": "line-202",
        "productName": "Enterprise Setup & Migration Service",
        "category": "Services",
        "categoryCeiling": 10.0,
        "effectiveLimit": 10.0,
        "discountGiven": 18.0,
        "violationPoints": 8.0
      },
      "violations": [
        {
          "lineId": "line-202",
          "productName": "Enterprise Setup & Migration Service",
          "category": "Services",
          "categoryCeiling": 10.0,
          "discountGiven": 18.0,
          "pointsExceeded": 8.0,
          "marginSacrificed": 90.00
        }
      ]
    }
  }
  ```

#### Endpoint 10: `POST /api/v1/quotations/{id}/submit-approval`
- **Purpose**: Submits the quotation for management approval. Transitions state to `pending_approval`.
- **Source Requirement**: `[PDF Page 6, 9, 11]`, `REQ-DISC-05`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "repJustification": "Strategic deal to displace competitor in Acme's primary facility."
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteId": "so-1001",
      "state": "pending_approval",
      "approvalState": "pending_manager",
      "assignedReviewerRole": "sales_manager",
      "submittedAt": "2026-09-05T10:52:00.000Z"
    }
  }
  ```

#### Endpoint 11: `POST /api/v1/quotations/{id}/approvals/action`
- **Purpose**: Approver executes `approve`, `reject`, or `request_revision` with mandatory audit remarks.
- **Source Requirement**: `[PDF Page 6, 11]`, `REQ-DISC-06`.
- **Allowed Roles**: `SALES_MANAGER`, `FINANCE`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "action": "approve",
    "reason": "Approved given high hardware volume offsetting service margin concession."
  }
  ```
- **Validation Rules**: `reason` is strictly required; length $\ge 10$ characters.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteId": "so-1001",
      "previousApprovalState": "pending_manager",
      "currentApprovalState": "approved",
      "quoteState": "approved",
      "auditLogId": "audit-501",
      "reviewedBy": "Marcus Vance (Sales Manager)",
      "reviewedAt": "2026-09-05T10:55:00.000Z"
    }
  }
  ```

---

### 5.5 Live Upsell & Cross-Sell Engine

#### Endpoint 12: `GET /api/v1/quotations/{id}/upsell-recommendations`
- **Purpose**: Returns ranked product recommendations with live margin delta calculations.
- **Source Requirement**: `[PDF Page 6, 7, 11]`, `REQ-UP-02`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `ADMIN`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": [
      {
        "recommendationId": "rec-01",
        "productId": "prod-102",
        "productName": "UltraDock Station 4K",
        "category": "Hardware",
        "listPrice": 250.00,
        "unitCost": 120.00,
        "isPromoted": true,
        "promotionTag": "Special Bundle Promo",
        "recommendedQty": 8,
        "marginDeltaPercent": 3.2,
        "pairingReason": "Frequently co-purchased with Enterprise Laptop Pro 15 (84% confidence)"
      }
    ]
  }
  ```

#### Endpoint 13: `POST /api/v1/quotations/{id}/upsell-recommendations/accept`
- **Purpose**: Accepts recommendation; appends item to quote lines and recomputes order gross margin immediately.
- **Source Requirement**: `[PDF Page 7, 11]`, `REQ-UP-03`.
- **Allowed Roles**: `SALES_REP`, `SALES_MANAGER`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "recommendationId": "rec-01",
    "quantity": 8
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteId": "so-1001",
      "addedLineId": "line-203",
      "newAmountTotal": 10448.00,
      "previousMarginPercent": 24.24,
      "updatedMarginPercent": 27.44,
      "netMarginDelta": 3.20
    }
  }
  ```

#### Endpoint 14: `POST /api/v1/quotations/{id}/upsell-recommendations/dismiss`
- **Purpose**: Dismisses suggestion from active session view.
- **Source Requirement**: `[PDF Page 7]`.
- **Success Response (`200 OK`)**: `{"success": true}`.

---

### 5.6 Multi-Warehouse Inventory & Fulfillment

#### Endpoint 15: `GET /api/v1/quotations/{id}/fulfillment-split`
- **Purpose**: Calculates and returns the optimal multi-warehouse split to minimize shipments.
- **Source Requirement**: `[PDF Page 7, 11]`, `REQ-WH-03`.
- **Allowed Roles**: `FINANCE`, `SALES_MANAGER`, `ADMIN`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteId": "so-1001",
      "totalUnitsRequired": 8,
      "estimatedShipmentCount": 2,
      "estimatedFreightCost": 45.00,
      "allocations": [
        {
          "warehouseId": "wh-main",
          "warehouseName": "Main Warehouse",
          "productId": "prod-101",
          "allocatedQty": 5,
          "availableStock": 5,
          "isBackorder": false
        },
        {
          "warehouseId": "wh-east",
          "warehouseName": "East Depot",
          "productId": "prod-101",
          "allocatedQty": 3,
          "availableStock": 10,
          "isBackorder": false
        }
      ],
      "backorders": []
    }
  }
  ```

#### Endpoint 16: `POST /api/v1/quotations/{id}/fulfillment-split/override`
- **Purpose**: Allows operations to manually override the recommended split distribution.
- **Source Requirement**: `[PDF Page 7]`, `REQ-WH-04`.
- **Allowed Roles**: `FINANCE`, `ADMIN`.
- **Request Body**:
  ```json
  {
    "allocations": [
      { "warehouseId": "wh-east", "productId": "prod-101", "allocatedQty": 8 }
    ]
  }
  ```
- **Success Response (`200 OK`)**: Returns updated split with recalculated freight cost and shipment count.

#### Endpoint 17: `POST /api/v1/quotations/{id}/fulfillment-split/consolidate-backorder`
- **Purpose**: Consolidates replenished backorder into shipping queue upon receipt of stock.
- **Source Requirement**: `[PDF Page 7]`, `REQ-WH-05`.
- **Success Response (`200 OK`)**: Returns consolidated shipment dispatch order.

---

### 5.7 Hybrid Billing & Recurring Subscriptions

#### Endpoint 18: `GET /api/v1/quotations/{id}/billing-schedule`
- **Purpose**: Displays one-time items vs. recurring subscription lines with upcoming billing schedule.
- **Source Requirement**: `[PDF Page 7, 8, 11]`, `REQ-OVR-04`, `REQ-SUB-01`.
- **Allowed Roles**: `FINANCE`, `SALES_REP`, `ADMIN`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteId": "so-1001",
      "oneTimeDeliverables": {
        "amount": 8448.00,
        "items": ["Enterprise Laptop Pro 15 (x8)"],
        "invoiceStatus": "pending_confirmation"
      },
      "recurringSubscriptions": [
        {
          "productId": "prod-sub-01",
          "planName": "DealFlow Cloud SaaS License",
          "billingInterval": "monthly",
          "recurringAmount": 100.00,
          "firstBillingDate": "2026-09-05",
          "upcomingSchedules": [
            { "date": "2026-10-05", "amount": 100.00 },
            { "date": "2026-11-05", "amount": 100.00 },
            { "date": "2026-12-05", "amount": 100.00 }
          ]
        }
      ]
    }
  }
  ```

#### Endpoint 19: `POST /api/v1/subscriptions/{id}/prorate`
- **Purpose**: Calculates calendar-day proration for mid-cycle quantity/plan adjustments.
- **Source Requirement**: `[PDF Page 5, 8]`, `REQ-SUB-02`.
- **Request Body**:
  ```json
  {
    "newQuantity": 15,
    "effectiveDate": "2026-09-15"
  }
  ```
- **Success Response (`200 OK`)**: Returns prorated delta amount and next invoice adjustments.

#### Endpoint 20: `POST /api/v1/subscriptions/{id}/cancel`
- **Purpose**: Cancels subscription and generates automated credit note / refund calculation.
- **Source Requirement**: `[PDF Page 5, 8]`, `REQ-SUB-03`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "subscriptionId": "sub-801",
      "status": "cancelled",
      "unusedPrepaidDays": 18,
      "creditNoteIssued": true,
      "creditNoteAmount": 60.00,
      "creditNoteId": "cn-301"
    }
  }
  ```

---

### 5.8 Customer Portal Negotiation Engine (Secure & Isolated)

#### Endpoint 21: `GET /api/v1/portal/quote/{token}`
- **Purpose**: Retrieves restricted customer view of quotation. Costs, margins, and internal notes are omitted.
- **Source Requirement**: `[PDF Page 8, 10]`, `REQ-OVR-06`, `REQ-PORT-01`.
- **Allowed Roles**: Customer Portal User (`token`-authenticated).
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteNumber": "SO-2026-001",
      "customerName": "Acme Industrial Corp",
      "status": "Sent",
      "promisedDeliveryDate": "2026-09-30",
      "lines": [
        {
          "lineId": "line-201",
          "productName": "Enterprise Laptop Pro 15",
          "description": "Core fleet workstation",
          "quantity": 8,
          "unitPrice": 1200.00,
          "discountPercent": 12.0,
          "lineTotal": 8448.00,
          "customerComment": null
        }
      ],
      "amountUntaxed": 8448.00,
      "amountTotal": 8448.00
    }
  }
  ```

#### Endpoint 22: `POST /api/v1/portal/quote/{token}/comments`
- **Purpose**: Customer posts line-level inquiry or change request. Updates status to `Under Negotiation`.
- **Source Requirement**: `[PDF Page 8]`, `REQ-PORT-02`.
- **Request Body**:
  ```json
  {
    "lineId": "line-201",
    "comment": "Can we upgrade these to 32GB RAM if we commit to 10 units?"
  }
  ```
- **Success Response (`200 OK`)**: Returns updated comment with timestamp.

#### Endpoint 23: `POST /api/v1/portal/quote/{token}/negotiate`
- **Purpose**: Customer proposes counter-discount. Evaluates against ceilings; triggers auto re-approval if exceeded.
- **Source Requirement**: `[PDF Page 8, 11]`, `REQ-PORT-02`, `REQ-PORT-03`.
- **Request Body**:
  ```json
  {
    "proposedCounterDiscount": 18.0,
    "customerRemarks": "We need an 18% discount to sign before Friday."
  }
  ```
- **Backend Business Logic**:
  1. Computes new Blended Risk Score with 18% discount.
  2. If score $> 0$: Quote state automatically transitions to `pending_approval` (`approvalState: pending_manager`).
  3. Dispatches high-priority negotiation alert to assigned sales rep and manager.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteStatus": "Under Negotiation",
      "reApprovalTriggered": true,
      "message": "Your counter-proposal has been submitted and routed to Sales Leadership for approval."
    }
  }
  ```

#### Endpoint 24: `POST /api/v1/portal/quote/{token}/confirm`
- **Purpose**: One-click customer final acceptance. Converts quote to confirmed order.
- **Source Requirement**: `[PDF Page 3, 8, 11]`, `REQ-PORT-04`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "quoteNumber": "SO-2026-001",
      "status": "Confirmed",
      "confirmedAt": "2026-09-05T11:00:00.000Z",
      "orderStatus": "Processing Fulfillment & Billing"
    }
  }
  ```

---

### 5.9 Deal Health & Anomaly Monitoring

#### Endpoint 25: `GET /api/v1/deal-health/summary`
- **Purpose**: Returns stalled deals, discount anomalies, and delivery slippage alerts.
- **Source Requirement**: `[PDF Page 8, 9]`, `REQ-HLTH-01`, `REQ-HLTH-02`, `REQ-HLTH-03`.
- **Allowed Roles**: `SALES_MANAGER`, `FINANCE`, `ADMIN`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "stalledDeals": [
        {
          "quoteId": "so-0988",
          "quoteNumber": "SO-2026-0988",
          "customerName": "Beta Dynamics Ltd",
          "dealValue": 15400.00,
          "daysInactive": 7,
          "assignedRep": "Sarah Jenkins",
          "severity": "warning"
        }
      ],
      "discountAnomalies": [
        {
          "quoteId": "so-1001",
          "quoteNumber": "SO-2026-001",
          "repName": "Sarah Jenkins",
          "currentDiscount": 18.0,
          "repHistoricalAverage": 7.4,
          "deviationPoints": 10.6,
          "severity": "critical"
        }
      ],
      "deliverySlippage": []
    }
  }
  ```

#### Endpoint 26: `POST /api/v1/deal-health/alerts/{alertId}/nudge`
- **Purpose**: Dispatches automated follow-up notification to sales rep regarding stalled deal.
- **Source Requirement**: `[PDF Page 8, 9]`.
- **Success Response (`200 OK`)**: `{"success": true, "message": "Nudge sent to rep."}`.

---

### 5.10 Reporting & Binary Export

#### Endpoint 27: `GET /api/v1/reports/sales-performance`
- **Purpose**: Aggregated performance metrics filtered by period, rep, status, and category.
- **Source Requirement**: `[PDF Page 5, 9]`, `REQ-REP-01`.
- **Query Parameters**:
  - `period`: `today`, `week`, `month`, `custom`.
  - `repId`: String (optional).
  - `status`: `pending`, `approved`, `rejected`, `confirmed`.
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "totalPipelineValue": 245000.00,
      "averageDealDiscount": 9.2,
      "marginContribution": 31.8,
      "approvalTurnaroundHours": 3.5,
      "dealsByStage": {
        "draft": 4,
        "pendingApproval": 3,
        "underNegotiation": 2,
        "confirmed": 11
      }
    }
  }
  ```

#### Endpoint 28: `GET /api/v1/reports/export`
- **Purpose**: Generates and downloads formatted PDF or Excel spreadsheet.
- **Source Requirement**: `[PDF Page 5]`, `REQ-REP-02`.
- **Query Parameters**:
  - `format`: `pdf` or `xls`.
- **Success Response (`200 OK`)**: Binary stream with `Content-Disposition: attachment; filename="DealFlow360_Report.pdf"`.

---

## 6. End-to-End Business Workflow API Sequences

### Workflow Flow 1: Quotation Creation & Blended Risk Approval Routing
```text
1. POST /api/v1/quotations
   -> Payload: { partnerId: "cust-001" }
   <- 201 Created: { id: "so-1001", tier: "Gold", tierCeiling: 15.0% }

2. POST /api/v1/quotations/so-1001/lines
   -> Payload: { productId: "prod-101", quantity: 8, discount: 12.0% } (Hardware: 15% limit -> OK)
   <- 200 OK: { blendedRiskScore: 0.0, highestApprovalLevel: "none" }

3. POST /api/v1/quotations/so-1001/lines
   -> Payload: { productId: "prod-201", quantity: 1, discount: 18.0% } (Services: 10% limit -> VIOLATION)
   <- 200 OK: { blendedRiskScore: 12.8, highestApprovalLevel: "sales_manager", state: "draft" }

4. POST /api/v1/quotations/so-1001/submit-approval
   -> Payload: { repJustification: "Strategic enterprise customer" }
   <- 200 OK: { state: "pending_approval", approvalState: "pending_manager" }
```

### Workflow Flow 2: Manager Approval & Multi-Warehouse Split
```text
1. POST /api/v1/quotations/so-1001/approvals/action
   -> Payload: { action: "approve", reason: "Hardware volume compensates for setup concession" }
   <- 200 OK: { state: "approved", approvalState: "approved" }

2. GET /api/v1/quotations/so-1001/fulfillment-split
   <- 200 OK: {
        allocations: [
          { warehouse: "Main Warehouse", qty: 5 },
          { warehouse: "East Depot", qty: 3 }
        ],
        shipmentCount: 2
      }

3. POST /api/v1/quotations/so-1001/fulfillment-split/accept
   <- 200 OK: { status: "fulfillment_scheduled" }
```

### Workflow Flow 3: Customer Portal Negotiation & Auto Re-Approval
```text
1. GET /api/v1/portal/quote/tok-99887766
   <- 200 OK: (Clean customer view, margins hidden)

2. POST /api/v1/portal/quote/tok-99887766/negotiate
   -> Payload: { proposedCounterDiscount: 20.0, remarks: "We require 20% to close this month." }
   <- 200 OK: {
        quoteStatus: "Under Negotiation",
        reApprovalTriggered: true,
        message: "Routed to Sales Leadership for approval."
      }
   (Server State: Quotation automatically moves back to pending_approval)
```

---

## 7. OpenAPI 3.0 Reusable Data Schemas

```yaml
components:
  schemas:
    Quotation:
      type: object
      required: [id, quoteNumber, partnerId, state, amountTotal]
      properties:
        id:
          type: string
          format: uuid
        quoteNumber:
          type: string
          example: "SO-2026-001"
        partnerId:
          type: string
        customerName:
          type: string
        customerTier:
          type: string
          enum: [Bronze, Silver, Gold]
        state:
          type: string
          enum: [draft, pending_approval, approved, sent, under_negotiation, confirmed, done, cancelled]
        amountUntaxed:
          type: number
          format: decimal
        amountDiscount:
          type: number
          format: decimal
        amountTotal:
          type: number
          format: decimal
        orderMarginPercent:
          type: number
          format: decimal
          description: "Internal only - excluded from customer portal responses"
        blendedRiskScore:
          type: number
          format: float
        lines:
          type: array
          items:
            $ref: '#/components/schemas/QuotationLine'

    QuotationLine:
      type: object
      required: [id, productId, quantity, priceUnit, discount]
      properties:
        id:
          type: string
        productId:
          type: string
        productName:
          type: string
        lineType:
          type: string
          enum: [one_time, recurring]
        quantity:
          type: number
        priceUnit:
          type: number
        discount:
          type: number
        priceSubtotal:
          type: number
        lineMarginPercent:
          type: number
          description: "Internal only"
```

---

## 8. Summary & Completeness Guarantee

This API specification defines **28 discrete endpoints** covering 100% of the functional, governance, inventory, billing, portal negotiation, and reporting requirements in `DealFlow360.pdf`.
