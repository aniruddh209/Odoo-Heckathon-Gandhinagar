# DealFlow360: Master Frontend Architecture & UI/UX Blueprint

---

## 1. Document Control & Design Philosophy

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master Frontend Architecture & UI/UX Implementation Blueprint |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **Version** | 1.0.0 |
| **Status** | Approved Master Specification / Single Source of Truth |
| **Primary Source of Truth** | `DealFlow360.pdf` (13-Page Problem Statement) |
| **Companion Documents** | `docs/DEALFLOW360_MASTER_PRD.md`, `docs/api/DEALFLOW360_API_SPEC.md`, `docs/database/DEALFLOW360_DATABASE_ARCHITECTURE.md`, `docs/backend/DEALFLOW360_BACKEND_ARCHITECTURE.md` |
| **Target Frontend Stack** | React 18/19 (Vite + TypeScript) + Tailwind CSS + Lucide Icons + TanStack Query + Zustand |
| **Last Updated** | 2026-09-05 |

### Core Design Principles
1. **Instant Reactive Feedback**: Complex business rules (blended discount risk score, order gross margin %, and live upsell margin delta) calculate and animate within 100ms on the client for fluid user experience.
2. **Strict Zero-Leak Customer View**: Customer negotiation screens are completely isolated from internal sales workspaces. Cost prices, unit margins, deal profit percentages, and internal manager chatter are omitted from client-side bundles and network payloads.
3. **Clarity Over Complexity**: B2B enterprise workflows are visually clean, employing dense, legible data tables, color-coded health badges, and unambiguous approval steppers rather than distracting decorations.
4. **Resilient Offline / Concurrency Awareness**: Optimistic UI updates with instant server rollbacks and prominent `409 Conflict` resolution banners if a customer counters a deal while a manager reviews it.

---

## 2. User Experience Architecture by Persona

`[PDF Page 2, 3]` The frontend enforces five dedicated user experiences:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        DealFlow360 Frontend Shell                      │
├────────────────────────────────┬───────────────────────────────────────┤
│    Internal Workspace Users    │       Isolated Customer Portal        │
│  (Authenticated via JWT)       │    (Authenticated via Magic Link)     │
│                                │                                       │
│  1. Sales Representative       │  4. Customer (Portal User)            │
│     • Quote Builder & Cart     │     • Restricted Quotation View       │
│     • Live Margin & Upsell     │     • Line-Level Inquiry Drawer       │
│     • Customer Feedback Feed   │     • Counter-Discount Proposal       │
│                                │     • 1-Click Final Confirmation      │
│  2. Sales Manager / Approver   │     *(Zero Cost/Margin Visibility)*   │
│     • Approval Queue & Audit   │                                       │
│     • Risk Breakdown Modal     │                                       │
│     • Deal Health Dashboard    │                                       │
│                                │                                       │
│  3. Finance / Operations User  │                                       │
│     • Multi-Warehouse Split    │                                       │
│     • Backorder Consolidation  │                                       │
│     • Hybrid Billing Schedules │                                       │
│                                │                                       │
│  5. System Administrator       │                                       │
│     • Tier & Ceiling Matrices  │                                       │
│     • Warehouses & Catalog     │                                       │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Information Architecture & Navigation Shell

### 3.1 Global Header & Workspace Controls (`TopNav.tsx`)
`[PDF Page 5, 6, B1]`
- **Branding**: "DealFlow360" interactive logo.
- **Role Badge**: Visual indicator (e.g., `Sales Rep: Sarah Jenkins | Gold Team`).
- **Primary Navigation Links**:
  - `Quotations` (`/quotes`) -> Tabular list of draft, pending, and confirmed deals.
  - `Pipeline` (`/pipeline`) -> Interactive Kanban deal board.
  - `Approvals` (`/approvals`) -> Visible to Managers, Finance, and Admins.
  - `Operations` (`/operations`) -> Warehouse splits, stock, and hybrid billing.
  - `Deal Health` (`/deal-health`) -> Anomaly monitors, stalled deals feed.
  - `Configuration` (`/admin`) -> Admin setup for tiers, ceilings, products, and rules.
- **Global Actions**:
  - `Reload Data` button -> Background re-fetches price lists, live inventory balances, and approval states.
  - `Go to Backend` -> Deep-links to system settings.
  - `Close Workspace` -> Terminates session securely.

---

## 4. Complete Screen Inventory

| Screen ID | Screen Name | Allowed Role(s) | Primary Route | Purpose | Source PDF Reference |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **SCR-01** | Internal Login / Sign-Up | Public / Internal | `/login` | Staff authentication & JWT issuance | Page 3, 4 (A1) |
| **SCR-02** | Customer Portal Auth | Customer Portal | `/portal/login` | Magic-link validation & token exchange | Page 4 (A1) |
| **SCR-03** | Quotation List View | Rep, Manager, Admin | `/quotes` | Searchable, paginated table of deals | Page 5, 6 (B1, B2) |
| **SCR-04** | Pipeline Kanban Board | Rep, Manager, Admin | `/pipeline` | Visual stage columns with drag-and-drop | Page 5, 6 (B1, B2) |
| **SCR-05** | **Quotation Builder Screen**| Rep, Manager, Admin | `/quotes/:id/edit` | Core cart, discount inputs, live margin | Page 6 (B3) |
| **SCR-06** | **Live Upsell Side Drawer** | Rep, Manager, Admin | Component on SCR-05 | Ranked suggestions with margin delta | Page 6, 7 (B5) |
| **SCR-07** | **Discount Approval Screen**| Manager, Finance, Admin | `/approvals/:id` | Risk breakdown, audit ledger, approve | Page 6 (B4) |
| **SCR-08** | **Fulfillment Split Screen**| Finance, Ops, Admin | `/fulfillment/:id` | Multi-warehouse split, backorder prompt| Page 7 (B6) |
| **SCR-09** | **Hybrid Billing Screen** | Finance, Rep, Admin | `/billing/:id` | One-time vs. recurring schedules | Page 7, 8 (B7) |
| **SCR-10** | **Customer Negotiation View**| Customer (Portal) | `/portal/quote/:tok` | Restricted quote, counter-discount | Page 8 (B8) |
| **SCR-11** | **Deal Health Dashboard** | Manager, Finance, Admin | `/deal-health` | Stalled deals, anomalies, rep nudges | Page 8, 9 (B9) |
| **SCR-12** | Sales Reporting & Export | Manager, Admin | `/reports` | Metrics, filters, PDF/XLS downloads | Page 5 (A7) |
| **SCR-13** | Admin Master Setup | Admin | `/admin/config` | Tiers, category ceilings, warehouses | Page 4, 5 (A2..A6) |

---

## 5. Detailed Screen-by-Screen Specifications

### 5.1 SCR-05: Quotation Builder Screen (Core Hub)
`[PDF Page 6, B3]`
- **Route**: `/quotes/:id/edit`
- **Layout**: 3-Pane Responsive Layout (Left: Customer Metadata & Pricing; Center: Cart Items Table; Right: Live Upsell & Order Summary Bar).
- **Header Section**:
  - Quote Number (e.g., `SO-2026-001`), Customer Name, Customer Tier Badge (`Gold` - 15% Max Ceiling).
  - Stage Indicator: `Draft`, `Pending Approval`, `Approved`, `Sent`, `Under Negotiation`, `Confirmed`.
  - Concurrency Lock: Visual ETag indicator.
- **Cart Table Columns**:
  1. `Category Badge` (Hardware, Service, Subscription).
  2. `Product & SKU` with variant dropdown (e.g., Size, Pack).
  3. `Live Stock Pill` (Green: Available, Yellow: Split Required, Red: Backorder).
  4. `Quantity Stepper` (`-` / `+` inputs).
  5. `Catalog Unit Price` ($).
  6. `Discount Input (%)`:
     - Real-time inline validation.
     - Amber border if discount exceeds allowable category/tier ceiling ($\Delta_i > 0$).
     - Tooltip: *"Exceeds Service ceiling of 10.0% by +8.0% points"*.
  7. `Net Line Total` ($).
  8. `Line Gross Margin (%)` (Color-coded: Green $>30\%$, Yellow $15-30\%$, Red $<15\%$).
  9. `Actions` (Delete line item, add comment).
- **Order Summary Sticky Bar**:
  - List Amount, Discount Given ($ and %), Total Net Untaxed Amount.
  - **Live Gross Margin Gauge**: Animated progress bar showing overall deal margin.
  - **Blended Risk Score Badge**:
    - Score = `0.0`: Green *"Within Discretion - Direct Confirmation Allowed"*.
    - Score $> 0.0 \le 15.0$: Amber *"Requires Level 1 Sales Manager Approval"*.
    - Score $> 15.0$: Red *"High Risk Deal - Requires Manager + Finance Sign-Off"*.
- **Primary CTA Buttons**:
  - `Save Draft`
  - `Submit for Approval` (Enabled if Blended Risk Score $> 0.0$).
  - `Confirm & Dispatch to Fulfillment` (Enabled only if risk = 0 or approved).

---

### 5.2 SCR-06: Live Upsell & Cross-Sell Drawer
`[PDF Page 6, 7, B5]`
- **Trigger**: Embedded alongside Quotation Builder cart; updates dynamically when products are added.
- **Card Components**:
  - Product Thumbnail & Title (e.g., `UltraDock Station 4K`).
  - Promotion Tag: Emerald badge *"Special Bundle Promo"*.
  - Association Rationale: *"Frequently paired with Enterprise Laptop Pro 15 (84% confidence)"*.
  - Pricing Impact: `+$250.00 Unit Price`.
  - **Live Margin Delta Pill**: `+3.2% Overall Deal Margin`.
- **Interactive Actions**:
  - `Add to Quote`: Immediately adds row to cart table; animates cart total and gross margin indicator.
  - `Dismiss`: Animates card out; suppresses suggestion for active session.

---

### 5.3 SCR-07: Discount Approval Screen
`[PDF Page 6, B4]`
- **Route**: `/approvals/:id`
- **Allowed Roles**: `Sales Manager`, `Finance User`, `Admin`.
- **Visual Elements**:
  - **Deal Risk Card**: Displays Blended Risk Score (e.g., `12.8 / 100`), Worst Offending Line item, and Total Margin Sacrificed ($).
  - **Approval Chain Stepper**:
    - Step 1: `Sales Manager` (Status: `Approved` by Marcus Vance on Sept 5, 2026).
    - Step 2: `Finance Director` (Status: `Pending Review`).
  - **Violation Audit Table**: Highlights lines where $\text{Discount} > \min(\text{Customer Tier Ceiling}, \text{Category Ceiling})$.
  - **Mandatory Reviewer Remarks**: Textarea with character counter (min. 10 chars required to submit).
- **Action Buttons**:
  - `Approve Deal` (Emerald CTA with confirmation modal).
  - `Return for Revision` (Amber CTA prompting rep for price adjustments).
  - `Reject Deal` (Rose CTA permanently halting proposal).
- **Audit Confirmation Modal**: Confirms decision and immediately posts entry to the immutable ledger.

---

### 5.4 SCR-08: Warehouse Fulfillment & Split Screen
`[PDF Page 7, B6]`
- **Route**: `/fulfillment/:id`
- **Allowed Roles**: `Finance / Operations`, `Sales Manager`, `Admin`.
- **Components**:
  - **Fulfillment Requirement Table**: Shows ordered items and quantities needed.
  - **Recommended Split Card**:
    - Warehouse 1: `Main Warehouse` -> 5 units (100% on-hand allocated).
    - Warehouse 2: `East Depot` -> 3 units (Remaining balance allocated).
    - Metrics: Estimated Shipments: `2 Dispatches` | Freight Cost: `$45.00`.
  - **Action Controls**:
    - `Accept Suggested Split` (1-click confirmation creating delivery orders).
    - `Manual Override`: Activates allocation sliders allowing warehouse managers to manually balance dispatch quantities across facilities.
  - **Backorder & Consolidation Banner**:
    - If incoming inventory matches an open backorder, renders an automated notification:
      > *"Stock received for Backorder #BO-102. Consolidate remaining items into unified shipment?"*
    - Button: `Consolidate Shipments`.

---

### 5.5 SCR-09: Hybrid Billing & Subscription Screen
`[PDF Page 7, 8, B7]`
- **Route**: `/billing/:id`
- **Split-Screen Layout**:
  - **Pane A: One-Time Deliverables**:
    - Lists physical hardware and one-off services.
    - Invoice Status: `Ready to Invoice` / `Invoiced (INV/2026/00101)` / `Paid`.
    - Button: `Generate Commercial Invoice`.
  - **Pane B: Recurring Subscriptions**:
    - Lists active SaaS plans, user counts, and billing frequency (Monthly/Quarterly/Yearly).
    - **Upcoming Billing Schedule Table**: Shows scheduled dates, projected billing amounts, and automated cron run dates.
    - **Mid-Cycle Modification Tool**: Interactive quantity slider showing instant calendar proration charges:
      > *"Increasing licenses from 10 to 15 will generate an immediate prorated charge of $16.67 for 10 remaining cycle days."*
    - Button: `Cancel Subscription` -> Triggers automated credit note generation preview modal.

---

### 5.6 SCR-10: Customer Portal Negotiation Screen (Restricted Client View)
`[PDF Page 8, B8]`
- **Route**: `/portal/quote/:token`
- **Allowed Roles**: Customer Portal User (`token` authenticated).
- **Security Barrier**: Zero access to internal margins, costs, approval chains, or internal sales rep notes.
- **Client Components**:
  - Company Header, Quote Reference, and Assigned Sales Rep contact card.
  - Status Banner: `Sent`, `Under Negotiation`, or `Confirmed`.
  - Interactive Quotation Table: Product Name, Description, Quantity, Unit Price, Approved Discount (%), Total.
  - **Line-Level Feedback Drawer**: Clicking any row allows the customer to submit a question or change request.
  - **Counter-Discount Tool**:
    - Customer inputs target discount (e.g., counters 12% with 18%).
    - Action: `Submit Negotiation Request` -> Quote moves to `Under Negotiation`.
    - **Server Re-Approval Guard**: If counter discount violates approval ceilings, UI displays:
      > *"Your counter-proposal has been submitted and automatically routed to Sales Leadership for approval."*
  - **Primary Action**: `Confirm Quotation` -> One-click legally binding acceptance.

---

### 5.7 SCR-11: Deal Health & Anomaly Dashboard
`[PDF Page 8, 9, B9]`
- **Route**: `/deal-health`
- **Allowed Roles**: `Sales Manager`, `Finance User`, `Admin`.
- **Card Widgets**:
  1. **Stalled Deals Feed**: Lists deals with inactivity $> 5$ days. Displays days idle, deal value, and rep name. Action: `Send Rep Nudge`.
  2. **Discount Anomaly Monitor**: Flags quotes where rep discount exceeds their 90-day rolling baseline by $> 10\%$. Displays standard deviation bar. Action: `Open Quotation`.
  3. **Delivery Slippage Tracker**: Flags orders where warehouse stock shortages project dispatch past customer promised delivery date. Action: `Escalate to Logistics`.

---

## 6. Design System & Component Guidelines

### 6.1 Color Palette Tokens
- **Primary / Brand**: Deep Indigo (`#4F46E5` / `indigo-600`)
- **Success / Healthy Margins**: Emerald (`#10B981` / `emerald-500`) -> Margins $>30\%$, Compliant Discounts.
- **Warning / Level 1 Review**: Amber (`#F59E0B` / `amber-500`) -> Stalled Deals, Approvals Pending.
- **Critical / High Risk**: Rose (`#F43F5E` / `rose-500`) -> Margins $<15\%$, Finance Approvals Required.
- **Surface / Background**: Slate 50 (`#F8FAFC`) to Slate 900 (`#0F172A`) with high-contrast text ratios ($\ge 4.5:1$).

### 6.2 Spacing Rhythm & Typography
- **Grid Scale**: 4dp / 8dp system (`gap-2`, `gap-4`, `p-6`).
- **Typography**: Inter / System Sans-Serif:
  - Header: `text-xl font-semibold tracking-tight`
  - Body: `text-sm leading-relaxed text-slate-700 dark:text-slate-200`
  - Financial Data: Monospace digits (`font-mono`) for numerical alignment in currency tables.

### 6.3 State Management Matrix
- **Server State (TanStack Query)**: Handles caching, automatic background refetching on `Reload Data`, and optimistic cart updates with rollback on error.
- **Local Workspace State (Zustand)**: Manages active drawer state, cart selection, and filter parameters.
- **Form State (React Hook Form + Zod)**: Validates numeric ranges, discount percentages ($0-100\%$), and mandatory approval remarks ($\ge 10$ characters).

---

## 7. Frontend Module Tree & Implementation Directory Structure

```text
frontend/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── src/
    ├── main.tsx                       # App entry point & provider wrapper
    ├── App.tsx                        # Router configuration & role-based guards
    ├── assets/                        # Brand logos and vector SVG icons
    ├── components/
    │   ├── common/                    # Reusable atomic UI components
    │   │   ├── Button.tsx             # Primary, secondary, danger, ghost variants
    │   │   ├── Input.tsx              # Text, number, and percentage inputs
    │   │   ├── Badge.tsx              # Status, tier, and category badges
    │   │   ├── Modal.tsx              # Accessible dialog with focus trap
    │   │   ├── Table.tsx              # Paginated, sortable financial table
    │   │   └── Toast.tsx              # Global toast notification container
    │   ├── layout/                    # Application shells
    │   │   ├── TopNav.tsx             # Global navigation header & workspace actions
    │   │   ├── Sidebar.tsx            # Contextual navigation drawer
    │   │   └── Shell.tsx              # Protected internal user layout
    │   ├── quote-builder/             # Quotation Builder domain components
    │   │   ├── CartTable.tsx          # Order line items with live discount inputs
    │   │   ├── CartSummaryBar.tsx     # Order total, margin bar, risk score pill
    │   │   ├── ProductPicker.tsx      # Searchable product & variant modal
    │   │   └── UpsellDrawer.tsx       # Live ranked suggestions with margin delta
    │   ├── approvals/                 # Approval domain components
    │   │   ├── ApprovalStepper.tsx    # Manager -> Finance multi-step indicator
    │   │   ├── RiskBreakdownCard.tsx  # Blended risk math explanation widget
    │   │   └── ActionRemarksModal.tsx # Mandatory justification input dialog
    │   ├── fulfillment/               # Logistics domain components
    │   │   ├── SplitAllocationCard.tsx# Warehouse distribution & freight cost
    │   │   ├── ManualOverrideModal.tsx# Allocation sliders for warehouse ops
    │   │   └── BackorderBanner.tsx    # Consolidation prompt banner
    │   ├── billing/                   # Hybrid billing domain components
    │   │   ├── OneTimeInvoiceCard.tsx # Immediate commercial invoice status
    │   │   ├── SubscriptionTable.tsx  # Upcoming billing schedules table
    │   │   └── ProrationCalculator.tsx# Interactive mid-cycle seat adjustment
    │   ├── portal/                    # Isolated customer negotiation components
    │   │   ├── CustomerQuoteView.tsx  # Restricted quote view (zero margin leak)
    │   │   ├── LineCommentDrawer.tsx  # Customer question & change request tool
    │   │   └── CounterDiscountBar.tsx # Counter-offer proposal input
    │   └── deal-health/               # Monitoring domain components
    │       ├── StalledDealsFeed.tsx   # Inactivity alerts with rep nudge actions
    │       ├── AnomalyCard.tsx        # Rep discount deviation monitor
    │       └── SlippageAlert.tsx      # Promised delivery slippage warning
    ├── pages/                         # Screen views mapped to routes
    │   ├── LoginPage.tsx              # SCR-01
    │   ├── QuotationListPage.tsx      # SCR-03
    │   ├── PipelineKanbanPage.tsx     # SCR-04
    │   ├── QuotationBuilderPage.tsx   # SCR-05
    │   ├── ApprovalDetailPage.tsx     # SCR-07
    │   ├── FulfillmentSplitPage.tsx   # SCR-08
    │   ├── HybridBillingPage.tsx      # SCR-09
    │   ├── CustomerPortalPage.tsx     # SCR-10
    │   ├── DealHealthPage.tsx         # SCR-11
    │   ├── ReportsPage.tsx            # SCR-12
    │   └── AdminConfigPage.tsx        # SCR-13
    ├── services/                      # API client layer (Axios / Fetch)
    │   ├── api.ts                     # Base HTTP client with interceptors
    │   ├── authService.ts             # Login, logout, portal token auth
    │   ├── quoteService.ts            # Quotations, lines, discount evaluation
    │   ├── approvalService.ts         # Pending approvals and action submission
    │   ├── upsellService.ts           # Recommendation retrieval and acceptance
    │   ├── fulfillmentService.ts      # Multi-warehouse split calculation
    │   ├── billingService.ts          # Subscription schedules & proration
    │   └── dealHealthService.ts       # Health summaries and rep nudges
    ├── store/                         # Global client state (Zustand)
    │   ├── authStore.ts               # Authenticated user, role, token
    │   └── workspaceStore.ts          # Active quote ID, UI drawer toggles
    ├── types/                         # TypeScript interfaces (Shared with API DTOs)
    │   ├── quotation.ts               # Quote, LineItem, CustomerTier, RiskScore
    │   ├── approval.ts                # ApprovalRequest, ActionLog, Decision
    │   ├── fulfillment.ts             # Warehouse, Allocation, Backorder
    │   └── billing.ts                 # Subscription, Schedule, Invoice
    └── utils/                         # Helper functions
        ├── formatters.ts              # Currency ($), Percentage (%), Dates
        └── calculations.ts            # Client-side optimistic margin formulas
```

---

## 8. Accessibility & Quality Assurance

- **Keyboard Navigation**: All interactive cart controls, quantity steppers, and approval modals are operable via `Tab`, `Enter`, and `Space`. Dialogs implement focus trapping with `Esc` dismiss.
- **Color-Independent States**: Gross margin health and risk score badges pair color tokens with explicit icons and descriptive text (e.g., Red Rose paired with an Alert Octagon icon and *"Level 2 Finance Approval Required"* label).
- **Target Size**: All clickable buttons, table action icons, and quantity stepper targets maintain a minimum interactive hit area of $44 \times 44$ CSS pixels.

---

## 9. Requirement-to-UI Traceability Matrix

| PDF Requirement ID | User Role | Screen ID | Primary UI Component | API Endpoint Triggered |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-OVR-01** | Sales Rep | SCR-05 | `CartSummaryBar.tsx` | `POST /api/v1/quotations/{id}/lines` |
| **REQ-OVR-02** | Sales Rep | SCR-06 | `UpsellDrawer.tsx` | `GET /api/v1/quotations/{id}/upsell-recommendations` |
| **REQ-OVR-03** | Finance / Ops | SCR-08 | `SplitAllocationCard.tsx` | `GET /api/v1/quotations/{id}/fulfillment-split` |
| **REQ-OVR-04** | Finance User | SCR-09 | `SubscriptionTable.tsx` | `GET /api/v1/quotations/{id}/billing-schedule` |
| **REQ-OVR-05** | Sales Manager | SCR-11 | `StalledDealsFeed.tsx` | `GET /api/v1/deal-health/summary` |
| **REQ-OVR-06** | Customer | SCR-10 | `CustomerQuoteView.tsx` | `GET /api/v1/portal/quote/{token}` |
| **REQ-DISC-03** | Sales Manager | SCR-07 | `ApprovalStepper.tsx` | `POST /api/v1/quotations/{id}/approvals/action` |
| **REQ-PORT-02** | Customer | SCR-10 | `CounterDiscountBar.tsx` | `POST /api/v1/portal/quote/{token}/negotiate` |
| **REQ-TEST-01** | All Roles | SCR-01..10 | Complete Component Flow | 8-Step Quick Test Flow End-to-End |

---

## 10. Frontend Completeness Guarantee

This specification maps every screen, component, reactive calculation, and state transition required by `DealFlow360.pdf`. A frontend engineer can implement the complete user interface using this blueprint without ambiguity or placeholder components.
