# DealFlow360 — Seeded Demo Accounts & Credentials
**Authoritative Reference for System Roles, Personas & Workflows**

All accounts are automatically seeded into Microsoft SQL Server on database initialization with secure BCrypt password hashes.

---

## 1. Demo User Accounts Directory

| Persona / Role | Email | Password | Role Key | Primary Operational Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Representative** | `rep@dealflow360.io` | `Rep@123` | `SalesRep` | Quotations, Catalog, Upsell Rules, Customer Registration |
| **Sales Manager** | `manager@dealflow360.io` | `Manager@123` | `SalesManager` | Pipeline Desk, Level 1 Approvals, Deal Health Radar, Rep User Provisioning |
| **Finance & Operations** | `finance@dealflow360.io` | `Finance@123` | `FinanceOperations` | Level 2 Approvals, Warehouse Allocation, Invoicing & Billing |
| **System Administrator** | `admin@dealflow360.io` | `Admin@123` | `Admin` | Full System Control, Enterprise User Provisioning, Pricing, Rules |
| **Customer Client** | `customer@dealflow360.io` | `Customer@123` | `Customer` | Customer Portal, Account Orders, Invoices, Proposal Confirmation |

---

## 2. Controlled Role Creation Hierarchy

| Logged-in User Role | Permitted Creation Targets | Automatic Scope / Team Assignment |
| :--- | :--- | :--- |
| **Admin** | Any (`Admin`, `SalesManager`, `SalesRep`, `FinanceOperations`, `Customer`) | Global assignment |
| **SalesManager** | `SalesRep` ONLY | Automatically assigned to Manager's sales organization (`SalesTeamId`) |
| **SalesRep** | None (`403 Forbidden`) | Cannot provision user accounts |
| **FinanceOperations** | None (`403 Forbidden`) | Cannot provision user accounts |
| **Customer** | None (`403 Forbidden`) | Cannot provision user accounts |

---

## 3. Account Provisioning & Security Policies

1. **Cryptographic Temporary Passwords**:
   - Random 14-character high-entropy passwords generated using `RandomNumberGenerator`.
   - Hashed with BCrypt in MSSQL `Users` table.
   - Returned once upon creation for display in the secure credentials reveal modal.
2. **Forced Password Reset on First Login**:
   - Account created with `MustChangePassword = true`.
   - On first login, application redirects to forced reset view requiring user to supply temporary password and create a permanent password (min 8 chars).
   - Once reset via `POST /api/auth/change-password`, `MustChangePassword` transitions to `false`.
3. **Atomic Customer & Portal Account Provisioning**:
   - When registering a customer in `/workspace/customers`, an associated portal user account (`Role.Customer`) is created in the same database transaction.
   - Provides instant client login with temporary password.
4. **Customer 360 Workspace**:
   - Internal sales and management teams inspect complete commercial intelligence at `/workspace/customers/:id`.
   - Displays lifetime revenue, active quotations, sales orders, invoices, and product purchase history.

---

## 4. Persona Workflows & Permissions Matrix

### 1. Sales Representative (`rep@dealflow360.io`)
- **Dashboard**: Personal sales pipeline, active quotes, win rate.
- **Customer Registration**: Creates customer accounts and generates client portal logins atomically.
- **Customer 360 Workspace**: Inspects account order history, prior quotes, and product purchase trends.
- **Quotation Builder**:
  - Select customer (`Acme Global Solutions`).
  - Add product lines (Hardware, Support, Services).
  - Engine automatically applies Tier discount (Gold: 15%) and checks margin floors.
  - Submit quote for approval if requested discount exceeds ceiling.
  - Generate secure zero-leak customer portal link.

### 2. Sales Manager (`manager@dealflow360.io`)
- **Pipeline Overview**: Total team deal volume, pipeline stages, conversion velocity.
- **User Management (`/workspace/users`)**: Authorized to provision and manage Sales Representatives on their team.
- **Approvals Desk (Level 1)**:
  - Reviews quotes with Blended Discount Risk score between `1.0%` and `5.0%`.
  - Actions: **Approve**, **Reject**, or **Request Revision** (with audit reason).
- **Deal Health Radar**: Real-time multi-dimensional scoring and warning matrix.

### 3. Finance & Operations (`finance@dealflow360.io`)
- **Approvals Desk (Level 2)**:
  - Reviews high-exposure quotes with Risk score exceeding `5.0%` or margin violations.
- **Fulfillment & Logistics Desk**:
  - Multi-warehouse fulfillment simulation and allocation.
  - Automatic backorder generation for items exceeding available inventory.
- **Hybrid Billing & Invoicing**:
  - Generate binding commercial invoices from completed orders.
  - Manage milestone schedules and recurring SaaS subscriptions.

### 4. System Administrator (`admin@dealflow360.io`)
- **User & Identity Directory (`/workspace/users`)**: Full authority to create any role, update profiles, and toggle account active/disabled states.
- **Product Catalog Management**: Create/edit products, SKUs, base prices, costs, and types.
- **Pricing & Tier Administration**: Manage customer tiers (Gold, Silver, Bronze) and custom price lists.
- **Discount Governance Rules**: Configure category-level maximum discounts and margin floor thresholds.
- **Approval Routing Rules**: Configure risk score thresholds and assigned roles for escalation tiers.
- **Warehouse Management**: Add distribution facilities, prioritize weights, and review global stock.

### 5. Customer Client (`customer@dealflow360.io` / Portal Token)
- **Zero-Leak Customer Negotiation Portal**:
  - View published commercial proposals (with internal margins, cost prices, and approval notes strictly stripped).
  - Line-by-line comment thread for collaborative negotiation.
  - Submit counter-discount requests with customer justifications.
  - One-click legal order confirmation and binding purchase execution.
- **Customer Account Portal (`/portal/my-account`)**:
  - Review orders, check invoice payment status, and manage password.
