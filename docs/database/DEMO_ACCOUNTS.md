# DealFlow360 — Seeded Demo Accounts & Credentials
**Authoritative Reference for System Roles, Personas & Workflows**

All accounts are automatically seeded into Microsoft SQL Server on database initialization with secure BCrypt password hashes.

---

## 1. Demo User Accounts Directory

| Persona / Role | Email | Password | Role Key | Primary Operational Areas |
| :--- | :--- | :--- | :--- | :--- |
| **Sales Representative** | `rep@dealflow360.io` | `Rep@123` | `SalesRep` | Quotations, Catalog, Upsell Rules, Portal Links |
| **Sales Manager** | `manager@dealflow360.io` | `Manager@123` | `SalesManager` | Pipeline Desk, Level 1 Approvals (Risk ≤ 5.0%), Reports |
| **Finance & Operations** | `finance@dealflow360.io` | `Finance@123` | `FinanceOperations` | Level 2 Approvals (Risk > 5.0%), Warehouse Allocation, Invoicing |
| **System Administrator** | `admin@dealflow360.io` | `Admin@123` | `Admin` | Full System Control, Pricing, Warehouses, Rules |
| **Customer Client** | `customer@dealflow360.io` | `Customer@123` | `Customer` | Customer Portal, Negotiation, Counter-Offers |

---

## 2. Persona Workflows & Permissions Matrix

### 1. Sales Representative (`rep@dealflow360.io`)
- **Dashboard**: Personal sales pipeline, active quotes, win rate.
- **Quotation Builder**:
  - Select customer (`Acme Global Solutions`).
  - Add product lines (Hardware, Support, Services).
  - Engine automatically applies Tier discount (Gold: 15%) and checks margin floors.
  - Submit quote for approval if requested discount exceeds ceiling.
  - Generate secure zero-leak customer portal link.

### 2. Sales Manager (`manager@dealflow360.io`)
- **Pipeline Overview**: Total team deal volume, pipeline stages, conversion velocity.
- **Approvals Desk (Level 1)**:
  - Reviews quotes with Blended Discount Risk score between `1.0%` and `5.0%`.
  - Actions: **Approve**, **Reject**, or **Request Revision** (with audit reason).
  - Approving moves quote to `Approved` or escalates to Finance if Level 2 required.

### 3. Finance & Operations (`finance@dealflow360.io`)
- **Approvals Desk (Level 2)**:
  - Reviews high-exposure quotes with Risk score exceeding `5.0%` or margin violations.
- **Fulfillment & Logistics Desk**:
  - Multi-warehouse fulfillment simulation and allocation.
  - Intelligent allocation across Central Warehouse (Chicago) and East Coast Hub (NY).
  - Automatic backorder generation for items exceeding available inventory.
- **Hybrid Billing & Invoicing**:
  - Generate binding commercial invoices from completed orders.
  - Manage milestone schedules and recurring SaaS subscriptions.

### 4. System Administrator (`admin@dealflow360.io`)
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

---

## 3. Seeded Master Data Reference

### Customer
- **Name**: Acme Global Solutions
- **Tier**: Gold Tier (15% Default Discount, Payment Terms: Net 30)
- **Credit Limit**: $250,000.00
- **Assigned Sales Rep**: `rep@dealflow360.io`

### Warehouses & Inventory
- **Central Warehouse (Chicago)** (Weight: 1.0)
  - `HW-LAPTOP-01`: 50 units
  - `HW-DOCK-01`: 100 units
- **East Coast Logistics Hub (NY)** (Weight: 1.5)
  - `HW-LAPTOP-01`: 25 units
  - `HW-DOCK-01`: 40 units

### Core Products Catalog
- `HW-LAPTOP-01` — Enterprise Precision Laptop 15" ($1,299.99 Base / $850.00 Cost)
- `HW-DOCK-01` — Thunderbolt 4 Enterprise Docking Station ($249.99 Base / $120.00 Cost)
- `SRV-SETUP-01` — White-Glove Onsite Enterprise Deployment ($500.00 Base / $150.00 Cost)
- `SUB-PREM-01` — 24/7 Enterprise SaaS Infrastructure Support ($99.00/mo Base / $20.00 Cost)
