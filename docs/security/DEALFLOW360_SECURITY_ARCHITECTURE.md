# DealFlow360: Master Security Architecture & Data Protection Blueprint

---

## 1. Executive Summary & Security Philosophy

DealFlow360 operates under a strict **Zero-Trust & Zero-Leak** security architecture. 

The core architectural principle of DealFlow360 is:
> **"The frontend asks; the backend decides."**

React is purely the presentation and experience layer. The ASP.NET Core Web API layer acts as the **sole authoritative boundary** for all authentication, role permissions, resource ownership, financial calculations, state transitions, and audit logging. Under no circumstances is a frontend state check or UI button visibility condition treated as a security barrier.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Untrusted Presentation Layer                │
│             React Single Page Application (Client)          │
│        (Role-based UI rendering for visual guidance only)    │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON Requests (Bearer / HMAC)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Authoritative Security Gateway              │
│                     ASP.NET Core Web API                    │
│  ├── 1. JWT Bearer / Portal HMAC Token Validation           │
│  ├── 2. Role & Policy Authorization Gate (RBAC)             │
│  ├── 3. Resource Ownership & Record-Scope Gate              │
│  ├── 4. Zero-Leak DTO Serialization Shield                  │
│  └── 5. Append-Only Transactional Audit Interceptor         │
└──────────────────────────────┬──────────────────────────────┘
                               │ Authenticated SQL Connection
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Durable Persistence Layer                 │
│              Microsoft SQL Server (MSSQLSERVER)             │
│  ├── Rowversion / Concurrency Tokens                        │
│  └── Encrypted At-Rest & Isolated Data Integrity            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Role-Based Access Control (RBAC) Model

The platform enforces five distinct enterprise roles across internal sales workspaces and external customer surfaces:

| Role | Domain Scope | Primary Responsibilities | Authorized API Surfaces |
| :--- | :--- | :--- | :--- |
| **Admin** | System-Wide | Platform setup, users, roles, product catalog, pricing, discount rules, approval chains, warehouses, subscription plans. | All configuration endpoints, user management, global reports, audit logs. |
| **SalesRep** | Team / Own Deals | Builds quotations, configures discounts, reviews upsells, tracks approvals/fulfillment, responds to customer inquiries. | Own quotations CRUD, products/price lists read, recommendations, submit, own pipeline. |
| **SalesManager** | Department / Assigned | Approves/rejects/returns risky quotes, monitors deal health, configures discount rules/approval bands, reviews rep performance. | Approval queue, approval action endpoints, team quotations, deal health alerts, management reports. |
| **FinanceOperations** | Enterprise Fulfillment & Billing | Second-level financial approvals, multi-warehouse allocations, backorder consolidation, hybrid billing generation, payment recording. | Finance approval step, warehouse allocation override, backorder consolidation, billing/invoices, payments, credit notes. |
| **Customer** | Portal Only (External) | Views commercial quotation terms, asks line-level questions, submits counter-discount proposals, confirms final orders. | Restricted `/api/portal/*` endpoints strictly scoped to their own quotation token. Zero internal access. |

---

## 3. Authentication Architecture

### 3.1 Internal User Authentication (JWT Bearer)
- **Credential Storage**: Passwords are never stored in plaintext. They are hashed using **Argon2id** or **PBKDF2** with a unique per-user cryptographic salt.
- **Login Flow**:
  1. Client sends `POST /api/auth/login` with `email` and `password`.
  2. Server normalizes email to lowercase, fetches user record, and verifies hash.
  3. If user `IsActive == false`, authentication is immediately rejected (`401 Unauthorized`).
  4. Server issues a signed JWT Bearer token with an 8-hour expiration.
- **Token Claims**:
  - `sub`: Unique `UserId` (Primary Key).
  - `role`: Role name (`Admin`, `SalesRep`, `SalesManager`, `FinanceOperations`).
  - `teamId`: Associated `SalesTeamId` for departmental data scoping.
  - `email`: Normalized user email address.
  - `jti`: Unique token identifier for audit tracking and revocation verification.
- **Signup Rule for Hackathon Demo**: Public signup (`POST /api/auth/signup`) is restricted to creating **SalesRep** accounts only. Admin, Manager, and Finance roles must be pre-seeded or provisioned by an Admin.

### 3.2 Customer Portal Authentication (Cryptographic Magic Links)
- **Isolation**: Customer portal users are completely decoupled from internal user credentials.
- **Token Generation**: When a sales rep clicks *"Send to Customer"*, the server generates a cryptographically random, 64-character SHA-256 HMAC token with an expiration timestamp (`PortalTokenExpiry`).
- **Access Flow**:
  1. The customer accesses `/portal/quote/{token}`.
  2. The portal API (`/api/portal/*`) validates the HMAC signature and expiration date against the database.
  3. The token resolves strictly to `CustomerId` and permitted `QuotationId(s)`.
  4. Any attempt to query a quotation ID not bound to the token returns `404 Not Found` (never `403`, to prevent resource enumeration).

---

## 4. Policy-Based Authorization & Resource Ownership

### 4.1 ASP.NET Core Policies
```csharp
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
    options.AddPolicy("RequireSalesManager", policy => policy.RequireRole("SalesManager", "Admin"));
    options.AddPolicy("RequireFinance", policy => policy.RequireRole("FinanceOperations", "Admin"));
    options.AddPolicy("RequireInternal", policy => policy.RequireRole("SalesRep", "SalesManager", "FinanceOperations", "Admin"));
});
```

### 4.2 Two-Tier Authorization Enforcement (Controller + Service)
Authorization is verified at two mandatory layers:
1. **Controller Gateway**: Validates token signature and checks role policy (e.g. `[Authorize(Policy = "RequireSalesManager")]`).
2. **Domain Service Scope**: Enforces record-level ownership and operational state invariants:
   - A `SalesRep` can edit lines only on quotations where `Quotation.SalesRepresentativeId == currentUserId`.
   - A `SalesManager` can approve only if the quote is in `PendingApproval` and `ApprovalRequest.CurrentStep == Manager`.
   - A `FinanceOperations` user cannot approve a quote that has not already passed Manager approval.
   - An approver cannot approve their own deal (self-approval prevention rule).

---

## 5. Strict Zero-Leak Customer Boundary

The problem statement explicitly forbids exposing internal commercial metrics to customers during portal negotiation. 

### 5.1 Shielded Data Invariant
The following data elements are classified as **Strictly Confidential** and are physically excluded from customer portal DTOs:
- `StandardCostPrice` / `UnitCostPrice`
- `TotalCostAmount`
- `LineMarginAmount` / `LineMarginPercent`
- `OrderGrossMarginAmount` / `OrderGrossMarginPercent`
- `BlendedDiscountRiskScore`
- Internal manager/finance remarks and rejection reasons
- Warehouse inventory stock quantities (`OnHand`, `Reserved`)
- Supplier identities and replenishment costs

### 5.2 Decoupled DTO Serializations
```csharp
// EXCLUSIVE INTERNAL DTO (Admin / Sales Rep / Manager / Finance)
public class QuotationDetailResponse
{
    public Guid Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public decimal TotalNetAmount { get; set; }
    public decimal TotalCostAmount { get; set; }           // INTERNAL ONLY
    public decimal OrderGrossMarginPercent { get; set; }  // INTERNAL ONLY
    public decimal BlendedDiscountRiskScore { get; set; } // INTERNAL ONLY
    public List<QuotationLineDetailResponse> Lines { get; set; } = new();
}

// RESTRICTED CUSTOMER PORTAL DTO (External Customer View)
public class PortalQuotationResponse
{
    public Guid Id { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public decimal TotalGrossAmount { get; set; }
    public decimal TotalDiscountAmount { get; set; }
    public decimal TotalNetAmount { get; set; }
    public List<PortalQuotationLineResponse> Lines { get; set; } = new();
    
    // SECURITY GUARANTEE: Cost, Margin, Risk Score, and Manager Remarks
    // do not exist on this class and cannot be serialized over HTTP.
}
```

---

## 6. Concurrency & Race Condition Defense

In an enterprise sales platform, concurrent updates introduce severe financial risks (e.g., a sales rep edits discounts while a manager approves, or two orders reserve the same remaining inventory stock).

### 6.1 Concurrency Token Implementation
All root transactional entities (`Quotations`, `InventoryStocks`, `Orders`, `Invoices`) include a concurrency token:
- EF Core Code-First configuration:
```csharp
modelBuilder.Entity<Quotation>()
    .Property(q => q.ConcurrencyVersion)
    .IsConcurrencyToken();
```
- When an update request arrives, EF Core issues:
```sql
UPDATE Quotations
SET Status = @NewStatus, ConcurrencyVersion = ConcurrencyVersion + 1, ...
WHERE Id = @Id AND ConcurrencyVersion = @ExpectedVersion;
```

### 6.2 Conflict Handling
If another user modified the quote in the interim, zero rows are affected and EF Core throws `DbUpdateConcurrencyException`. The ASP.NET Core exception middleware catches this and returns:
```json
{
  "success": false,
  "statusCode": 409,
  "code": "CONCURRENCY_CONFLICT",
  "message": "This deal was modified by another user or negotiation event. Please refresh and review latest terms.",
  "traceId": "00-8ab34f-01"
}
```

---

## 7. Append-Only Audit Logging & Non-Repudiation

Every high-risk operational command produces an immutable audit log record in `AuditLogs`.

### 7.1 Audited Actions
- `QUOTE_CREATED`, `LINE_ADDED`, `LINE_CHANGED`, `DISCOUNT_CHANGED`
- `RISK_RECALCULATED`, `APPROVAL_REQUESTED`, `APPROVED`, `REJECTED`, `RETURNED`
- `NEGOTIATION_REQUESTED`, `COUNTER_DISCOUNT_SUBMITTED`, `QUOTE_CONFIRMED`
- `STOCK_RESERVED`, `FULFILLMENT_OVERRIDDEN`, `BACKORDER_CONSOLIDATED`
- `BILLING_SCHEDULE_GENERATED`, `PAYMENT_RECORDED`, `CREDIT_NOTE_CREATED`

### 7.2 Database Immobility
The `AuditLogs` table has no `UPDATE` or `DELETE` endpoints. Database constraints and EF Core configurations prohibit modifications:
```csharp
public class AuditLog
{
    public long Id { get; init; }
    public int? UserId { get; init; }
    public string EntityName { get; init; } = string.Empty;
    public string EntityId { get; init; } = string.Empty;
    public string Action { get; init; } = string.Empty;
    public string? OldValueJson { get; init; }
    public string? NewValueJson { get; init; }
    public string Reason { get; init; } = string.Empty;
    public DateTime CreatedAtUtc { get; init; } = DateTime.UtcNow;
}
```

---

## 8. Security & Authorization Test Matrix

The test suite includes automated negative security assertions validating that unauthorized calls are blocked:

| Test Case | Actor / Token | Target Endpoint | Expected Result | Verification Scope |
| :--- | :--- | :--- | :--- | :--- |
| `SEC-01` | SalesRep | `POST /api/products` (Create Product) | `403 Forbidden` | Role authorization gate blocks non-admin. |
| `SEC-02` | SalesRep | `GET /api/quotations/{otherRepId}` | `403 Forbidden` or `404 Not Found` | Ownership gate blocks accessing rival rep's quote. |
| `SEC-03` | Customer | `GET /api/quotations/{id}` (Internal API) | `401 Unauthorized` / `403 Forbidden` | Customer token rejected on internal API routes. |
| `SEC-04` | Customer | `GET /api/portal/quotations/{otherQuoteId}` | `404 Not Found` | Portal token bound strictly to designated quote. |
| `SEC-05` | SalesManager | `POST /api/approvals/{id}/approve` (Finance Step) | `403 Forbidden` | Level 1 approver cannot complete Level 2 step. |
| `SEC-06` | FinanceOperations | `PUT /api/discount-rules/{id}` | `403 Forbidden` | Finance cannot alter discount governance rules. |
| `SEC-07` | Inactive User | `POST /api/auth/login` | `401 Unauthorized` | Deactivated user accounts are rejected at login. |
| `SEC-08` | Customer Portal | Inspect HTTP Response Payload | Cost/Margin Fields **Null / Absent** | Zero-Leak DTO contract validation. |
