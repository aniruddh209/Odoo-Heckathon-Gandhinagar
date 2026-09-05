# DealFlow360: Master Backend Implementation Blueprint

---

## 1. Document Control & Architectural Foundation

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master Backend Architecture & Implementation Blueprint |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **Version** | 1.0.0 |
| **Status** | Approved Implementation Blueprint / Single Source of Truth |
| **Primary Source of Truth** | `DealFlow360.pdf` (13-Page Problem Statement) |
| **Companion Documents** | `docs/DEALFLOW360_MASTER_PRD.md`, `docs/api/DEALFLOW360_API_SPEC.md`, `docs/database/DEALFLOW360_DATABASE_ARCHITECTURE.md` |
| **Target Runtime** | Python 3.12 / Odoo 17/18 Ecosystem / Decoupled ASP.NET Core & FastAPI Compatibility |
| **Last Updated** | 2026-09-05 |

### Architectural Standard Classifications
- `[REUSE ODOO]`: Standard built-in Odoo model or method used directly without modifications.
- `[EXTEND ODOO]`: Standard Odoo model extended via inheritance (`_inherit`) with custom DealFlow360 fields and methods.
- `[CUSTOM MODEL]`: New relational database model (`_name = 'dealflow.*'`) instantiated specifically for DealFlow360.
- `[CUSTOM SERVICE]`: Standalone, testable Python business logic class encapsulating domain algorithms.
- `[CUSTOM CONTROLLER]`: High-performance HTTP endpoint handler (`@http.route`) exposing RESTful JSON interfaces.
- `[IMPLEMENTATION DECISION]`: Technical decision made to guarantee enterprise robustness, transactional safety, and performance.

---

## 2. Backend Architecture Overview & Layered Module Design

The DealFlow360 backend is structured according to **Clean Architecture** and **Domain-Driven Design (DDD)** principles within an enterprise Odoo module package. Business rules are encapsulated in pure Python domain service classes, decoupling business logic from ORM persistence and HTTP controller serialization.

```text
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
│  • Odoo Web Client (Views, QWeb XML, Kanban, Form, Tree)    │
│  • RESTful JSON HTTP Controllers (@http.route /api/v1/*)    │
│  • Customer Portal Controllers (Cryptographic Token Auth)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Application Services                     │
│  • QuotationOrchestratorService   • PortalNegotiationService│
│  • ApprovalWorkflowDispatcher     • DealHealthMonitorService│
│  • WarehouseSplitDispatcher       • BillingOrchestrationSvc │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                    Domain Business Engines                  │
│  • DiscountGovernanceEngine (Blended Risk Score Math)       │
│  • UpsellRecommendationEngine (Co-Purchase & Margin Delta)  │
│  • WarehouseOptimizationEngine (Cost-Weighted Auto-Split)   │
│  • HybridBillingEngine (Proration, Schedules, Credit Notes) │
│  • DealAnomalyDetectionEngine (Statistical STDDEV, Stalls)  │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                Persistence & ORM Data Layer                 │
│  • Odoo Models (sale.order, stock.picking, account.move)    │
│  • Custom Models (dealflow.customer.tier, dealflow.audit)   │
│  • PostgreSQL / SQL Server Relational Database (ACID)       │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Odoo Standard vs. Custom Mapping Matrix

| Functional Requirement | Standard Odoo Capability | Architecture Decision | Technical Implementation Strategy |
| :--- | :--- | :--- | :--- |
| **Internal Auth & Users** | `res.users`, `res.groups` | `[EXTEND ODOO]` | Extend `res.users` with `role` selection and `historical_discount_avg`. Standard session auth. |
| **Customer Portal Auth** | `portal`, `res.partner` | `[EXTEND ODOO]` | Extend `res.partner` with cryptographic HMAC `portal_token` and expiry. Dedicated `@http.route`. |
| **Customer Tiers** | None (Basic pricelists) | `[CUSTOM MODEL]` | Create `dealflow.customer.tier` (Bronze 5%, Silver 10%, Gold 15%) linked to `res.partner`. |
| **Product Master** | `product.template`, `product.product` | `[EXTEND ODOO]` | Extend with `product_type` (`one_time_hardware`, `service`, `recurring_subscription`), `is_promoted`, `min_margin_threshold`. |
| **Category Ceilings** | Basic sales limits | `[CUSTOM MODEL]` | Create `dealflow.category.limit` defining ceiling and approval thresholds per category. |
| **Discount Governance** | Manual approval | `[CUSTOM SERVICE]` | `DiscountGovernanceEngine` calculating line ceilings, multi-tier violations, and Blended Risk Score. |
| **Two-Tier Approval Chain**| Approvals module | `[CUSTOM MODEL]` + `[EXTEND ODOO]` | Custom state machine on `sale.order` with `dealflow.approval.request` and immutable `dealflow.approval.action`. |
| **Live Upsell Panel** | Optional products (static) | `[CUSTOM SERVICE]` + `[CUSTOM MODEL]` | `UpsellRecommendationEngine` using co-purchase rules, promotion boosts, and live margin delta feedback. |
| **Multi-Warehouse Split** | Standard routes / manual | `[CUSTOM SERVICE]` + `[CUSTOM MODEL]` | `WarehouseFulfillmentEngine` executing greedy cost-weighted split algorithm; generates `dealflow.fulfillment`. |
| **Backorder Consolidation**| `stock.picking` backorders | `[EXTEND ODOO]` | Automated consolidation trigger on incoming purchase receipts matching active backorders. |
| **Hybrid Billing** | Separate sales/subscriptions | `[EXTEND ODOO]` + `[CUSTOM MODEL]` | Unified `sale.order` line typing; generates immediate `account.move` + `dealflow.subscription` schedule. |
| **Calendar Proration** | Basic subscription recurring | `[CUSTOM SERVICE]` | `HybridBillingEngine.calculate_proration()` computing exact day-rate adjustments and credit notes. |
| **Customer Portal View** | Standard portal quotes | `[CUSTOM CONTROLLER]` + `[CUSTOM VIEW]` | Isolated portal route; serializes clean DTO stripping costs, margins, and internal notes. |
| **Customer Counter-Offer** | Sign & pay only | `[EXTEND ODOO]` + `[CUSTOM MODEL]` | Portal counter-discount input triggering automated Blended Risk re-evaluation and approval re-entry. |
| **Deal Health & Alerts** | Basic chatter activities | `[CUSTOM SERVICE]` + `[CUSTOM MODEL]` | Automated `ir.cron` background job evaluating stalled deals (>5 days), discount anomalies, and slippage. |
| **Sales Reporting & Export**| `sale.report` pivot/graph | `[EXTEND ODOO]` | Extended reporting wizard and endpoints supporting parameterized PDF and XLSX binary export. |

---

## 4. Core Business Engines & Algorithmic Specifications

### 4.1 Discount Governance & Blended Risk Score Engine
`[CUSTOM SERVICE]` Class: `dealflow.discount.governance.engine`

```text
INPUT (Customer, Product Lines, Quantities, Discounts)
  │
  ▼
1. RESOLVE LINE CEILINGS:
   EffectiveLimit = min(CustomerTierCeiling, CategoryCeiling)
  │
  ▼
2. EVALUATE LINE VIOLATIONS:
   Delta_i = DiscountGiven_i - EffectiveLimit
   IsViolated = Delta_i > 0
  │
  ▼
3. COMPUTE BLENDED RISK SCORE:
   PeakViolation = max(0, max(Delta_i))
   VolumeWeightedLoss = sum((LineAmount_i / OrderTotal) * max(0, Delta_i))
   MarginPenalty = max(0, TargetMargin - OrderMargin)
   
   RiskScore = (1.0 * PeakViolation) + (1.5 * VolumeWeightedLoss) + (0.5 * MarginPenalty)
  │
  ▼
4. ROUTE APPROVAL LEVEL:
   If RiskScore == 0 -> NONE (Direct Confirm)
   If 0 < RiskScore <= 15.0 -> SALES_MANAGER (Level 1)
   If RiskScore > 15.0 OR any Delta_i > 10.0 -> SALES_MANAGER + FINANCE (Level 2)
  │
  ▼
STATE UPDATE & IMMUTABLE AUDIT LOG GENERATION
```

#### Python Implementation Blueprint
```python
class DiscountGovernanceEngine:
    @staticmethod
    def evaluate_quotation(order):
        customer_tier = order.partner_id.customer_tier_id
        tier_ceiling = customer_tier.max_discount_ceiling if customer_tier else 0.0
        
        worst_violation = 0.0
        weighted_violation_sum = 0.0
        order_total = sum(line.price_subtotal for line in order.order_line) or 1.0
        
        line_evaluations = []
        for line in order.order_line:
            cat_limit = line.product_id.category_id.dealflow_limit_id
            cat_ceiling = cat_limit.max_rep_discount if cat_limit else tier_ceiling
            
            # Stricter ceiling governs [PDF Page 12]
            effective_limit = min(tier_ceiling, cat_ceiling)
            violation = max(0.0, line.discount - effective_limit)
            
            if violation > worst_violation:
                worst_violation = violation
                
            weight = line.price_subtotal / order_total
            weighted_violation_sum += (weight * violation)
            
            line_evaluations.append({
                'line_id': line.id,
                'effective_limit': effective_limit,
                'violation_points': violation,
                'is_violated': violation > 0.0
            })
            
        # Target gross margin baseline = 30% [IMPLEMENTATION DECISION]
        margin_deficit = max(0.0, 30.0 - order.order_margin_percent)
        blended_risk_score = (1.0 * worst_violation) + (1.5 * weighted_violation_sum) + (0.5 * margin_deficit)
        
        # Determine approval routing
        if blended_risk_score == 0.0:
            required_level = 'none'
            approval_state = 'not_required'
        elif blended_risk_score <= 15.0 and worst_violation <= 10.0:
            required_level = 'sales_manager'
            approval_state = 'pending_manager'
        else:
            required_level = 'sales_manager_and_finance'
            approval_state = 'pending_manager' # Starts at manager, escalates to finance
            
        return {
            'blended_risk_score': round(blended_risk_score, 4),
            'highest_approval_level': required_level,
            'approval_state': approval_state,
            'line_evaluations': line_evaluations
        }
```

---

### 4.2 Gross Margin Engine
`[CUSTOM SERVICE]` Class: `dealflow.margin.engine`

- **Line Gross Margin ($)**:
  $$\text{Line Margin Amount} = (\text{Price Unit} \times (1 - \text{Discount} / 100) - \text{Cost Price}) \times \text{Quantity}$$
- **Line Gross Margin (%)**:
  $$\text{Line Margin Percent} = \left( \frac{\text{Line Margin Amount}}{\text{Price Subtotal}} \right) \times 100$$
- **Order Gross Margin ($)**:
  $$\text{Order Margin Amount} = \sum \text{Line Margin Amount}_i$$
- **Order Gross Margin (%)**:
  $$\text{Order Margin Percent} = \left( \frac{\text{Order Margin Amount}}{\text{Order Amount Untaxed}} \right) \times 100$$
- **Recalculation Triggers**: Fired automatically on `product_id`, `product_uom_qty`, or `discount` mutation via `@api.onchange` and `@api.depends`.

---

### 4.3 Live Upsell & Cross-Sell Engine
`[CUSTOM SERVICE]` Class: `dealflow.upsell.engine`

```text
INPUT (Active Cart Lines, Customer Tier)
  │
  ▼
1. EXTRACT CART PRODUCTS:
   CartProductIDs = [line.product_id.id for line in cart]
  │
  ▼
2. QUERY CO-PURCHASE MATRIX:
   Select pairs where source_product_id IN CartProductIDs
   AND recommended_product_id NOT IN CartProductIDs
  │
  ▼
3. FILTER MINIMUM MARGIN THRESHOLD:
   Eliminate products where unit_margin < min_margin_threshold (e.g., < 25%)
  │
  ▼
4. RANK SUGGESTIONS:
   Rank = (Confidence * 0.5) + (PromotionBoost * 0.3) + (MarginContrib * 0.2)
  │
  ▼
5. COMPUTE REAL-TIME MARGIN DELTA:
   ProjectedOrderMargin - CurrentOrderMargin -> "+3.2% Margin Impact"
  │
  ▼
RETURN RANKED SUGGESTIONS PAYLOAD
```

---

### 4.4 Multi-Warehouse Fulfillment & Backorder Engine
`[CUSTOM SERVICE]` Class: `dealflow.warehouse.fulfillment.engine`

```python
class WarehouseFulfillmentEngine:
    @staticmethod
    def calculate_optimal_split(order):
        allocations = []
        backorders = []
        warehouses = order.env['stock.warehouse'].search([], order='shipping_cost_weight asc')
        
        for line in order.order_line.filtered(lambda l: l.line_type == 'one_time'):
            qty_needed = line.product_uom_qty
            product = line.product_id
            
            # Step 1: Check single-warehouse full availability (Lowest Cost)
            single_wh = None
            for wh in warehouses:
                stock_avail = wh._get_product_available_qty(product)
                if stock_avail >= qty_needed:
                    single_wh = wh
                    break
                    
            if single_wh:
                allocations.append({
                    'order_id': order.id,
                    'order_line_id': line.id,
                    'warehouse_id': single_wh.id,
                    'allocated_qty': qty_needed,
                    'backorder_qty': 0.0,
                    'status': 'suggested'
                })
                continue
                
            # Step 2: Greedy Multi-Warehouse Split
            remaining_qty = qty_needed
            for wh in warehouses:
                avail = wh._get_product_available_qty(product)
                if avail > 0:
                    allocated = min(remaining_qty, avail)
                    allocations.append({
                        'order_id': order.id,
                        'order_line_id': line.id,
                        'warehouse_id': wh.id,
                        'allocated_qty': allocated,
                        'backorder_qty': 0.0,
                        'status': 'suggested'
                    })
                    remaining_qty -= allocated
                    if remaining_qty == 0:
                        break
                        
            # Step 3: Handle Deficit as Backorder
            if remaining_qty > 0:
                backorders.append({
                    'order_id': order.id,
                    'order_line_id': line.id,
                    'warehouse_id': warehouses[0].id, # Assigned to primary depot
                    'allocated_qty': 0.0,
                    'backorder_qty': remaining_qty,
                    'status': 'backordered'
                })
                
        return {'allocations': allocations, 'backorders': backorders}
```

---

### 4.5 Hybrid Billing & Subscription Proration Engine
`[CUSTOM SERVICE]` Class: `dealflow.hybrid.billing.engine`

- **Execution on Order Confirmation**:
  - `one_time` lines -> Generates standard customer invoice (`account.move`, `move_type='out_invoice'`).
  - `recurring` lines -> Generates `dealflow.subscription` record with automated billing schedules (`dealflow.billing.schedule`).
- **Calendar-Day Proration Math**:
  $$\text{Daily Rate} = \frac{\text{Period Price}}{\text{Total Days In Billing Period}}$$
  $$\text{Prorated Delta} = (\text{New Quantity} - \text{Old Quantity}) \times \text{Daily Rate} \times \text{Remaining Days}$$
- **Cancellation & Credit Note Engine**:
  - Calculates unused prepaid service days.
  - Automatically posts credit note (`account.move`, `move_type='out_refund'`) linked to the customer account.

---

### 4.6 Deal Health & Anomaly Background Engine
`[CUSTOM SERVICE]` Class: `dealflow.deal.health.engine`

Executed via scheduled cron (`ir.cron`):
1. **Stalled Deals Detector**:
   - Query: Quotes in `draft`, `sent`, or `under_negotiation` where `last_activity_date < NOW() - INTERVAL '5 DAYS'`.
   - Action: Inserts `dealflow.health.alert` with `alert_type='stalled_deal'`, `severity='warning'`.
2. **Rep Discount Anomaly Detector**:
   - Compares active quote discount against rep's 90-day rolling average (`res_users.historical_discount_avg`).
   - Condition: `Quote Discount > Historical Average + 10.0%`.
   - Action: Inserts `dealflow.health.alert` with `alert_type='discount_anomaly'`, `severity='critical'`.
3. **Delivery Promise Slippage Detector**:
   - Compares `promised_delivery_date` against inventory availability and warehouse transit lead times.
   - Action: Inserts `dealflow.health.alert` with `alert_type='delivery_slippage'`.

---

## 5. Security & Access Control Specifications

### 5.1 Odoo Security Groups (`security/dealflow_security.xml`)
- `group_dealflow_sales_rep`: Basic workspace access, can create quotes, view own team deals, cannot approve.
- `group_dealflow_sales_manager`: Can approve Level 1 discounts, view team health dashboard, configure discount tiers.
- `group_dealflow_finance`: Can approve Level 2 discounts, override warehouse splits, manage subscriptions & credit notes.
- `group_dealflow_portal`: Restricted customer role, access limited strictly to assigned quote token.
- `group_dealflow_admin`: Full system administration and configuration privileges.

### 5.2 Record Access Rules (`ir.rule`)
- **Customer Portal Isolation**:
  ```xml
  <record id="rule_dealflow_customer_portal_quote" model="ir.rule">
      <field name="name">Customer Portal Quote Isolation</field>
      <field name="model_id" ref="sale.model_sale_order"/>
      <field name="domain_force">[('partner_id.portal_token', '=', user.partner_id.portal_token)]</field>
      <field name="groups" eval="[(4, ref('group_dealflow_portal'))]"/>
      <field name="perm_read" eval="True"/>
      <field name="perm_write" eval="False"/>
      <field name="perm_create" eval="False"/>
      <field name="perm_unlink" eval="False"/>
  </record>
  ```
- **Sales Rep Isolation**: Reps can only write to quotes in `draft` or `revision_requested` state. Once submitted for approval, records become read-only to the rep until reviewed.

---

## 6. Complete Backend Directory Structure & Module Layout

```text
dealflow360/
├── __init__.py
├── __manifest__.py
├── controllers/
│   ├── __init__.py
│   ├── auth_controller.py             # Internal & Customer portal authentication
│   ├── quotation_controller.py        # Quotations, line mutations, cart operations
│   ├── approval_controller.py         # Approval stepper, action submission, audit
│   ├── upsell_controller.py           # Live upsell recommendation retrieval & acceptance
│   ├── fulfillment_controller.py      # Multi-warehouse split calculation & overrides
│   ├── billing_controller.py          # Hybrid billing schedule & proration
│   ├── portal_controller.py           # Isolated customer negotiation & confirmation
│   ├── deal_health_controller.py      # Stalled deals, anomalies, rep nudges
│   └── report_controller.py           # PDF and XLS binary export endpoints
├── models/
│   ├── __init__.py
│   ├── res_users.py                   # Extended user with roles & historical metrics
│   ├── res_partner.py                 # Extended customer with tier & portal token
│   ├── customer_tier.py               # DealFlow customer tiers (Bronze/Silver/Gold)
│   ├── category_limit.py              # Category discount ceilings & approval gates
│   ├── product_template.py            # Extended product with types & promo flags
│   ├── sale_order.py                  # Core deal header, blended score, state machine
│   ├── sale_order_line.py             # Cart lines, ceiling checking, recurring flag
│   ├── approval_request.py            # Multi-level approval requests
│   ├── approval_action.py             # Reviewer decisions and written remarks
│   ├── copurchase_rule.py             # Statistical product association pairs
│   ├── fulfillment_allocation.py      # Warehouse inventory split allocations
│   ├── stock_warehouse.py             # Extended warehouse with freight weighting
│   ├── stock_picking.py               # Extended delivery dispatches & backorders
│   ├── subscription_contract.py       # Recurring billing contracts
│   ├── billing_schedule.py            # Future recurring invoice projections
│   ├── account_move.py                # Extended invoice & credit note linkage
│   ├── negotiation_thread.py          # Portal customer negotiation threads
│   ├── negotiation_message.py         # Portal line feedback messages
│   ├── health_alert.py                # Deal health anomaly alerts
│   └── audit_log.py                   # Master append-only immutable event ledger
├── services/
│   ├── __init__.py
│   ├── discount_governance_engine.py  # Blended risk formula & routing logic
│   ├── margin_engine.py               # Exact gross margin calculations
│   ├── upsell_engine.py               # Live recommendation ranking & margin delta
│   ├── warehouse_fulfillment_engine.py# Greedy cost-weighted split algorithm
│   ├── hybrid_billing_engine.py       # Invoicing, subscription schedule, proration
│   └── deal_health_engine.py          # Stalled deal & anomaly background detectors
├── data/
│   ├── dealflow_tiers_data.xml        # Default Bronze, Silver, Gold tiers
│   ├── dealflow_categories_data.xml   # Hardware (15%) & Service (10%) ceilings
│   ├── dealflow_cron_jobs.xml         # Scheduled tasks for health alerts & billing
│   └── dealflow_demo_data.xml         # 8-Step Quick Test Flow seed records
├── security/
│   ├── dealflow_security.xml          # Role definitions & record rules
│   └── ir.model.access.csv            # Table-level ACL matrix for all 5 roles
├── views/
│   ├── sales_workspace_views.xml      # Sales Rep workspace & Quotation Builder
│   ├── approval_views.xml             # Manager & Finance discount review forms
│   ├── fulfillment_views.xml          # Warehouse split & backorder consolidation UI
│   ├── subscription_views.xml         # Hybrid billing schedule view
│   └── deal_health_dashboard_views.xml# Executive anomaly & stalled deal monitor
└── tests/
    ├── __init__.py
    ├── test_discount_governance.py    # Unit tests: Line ceilings & blended risk score
    ├── test_upsell_margin.py          # Unit tests: Recommendation ranking & margin delta
    ├── test_warehouse_split.py        # Unit tests: Multi-warehouse auto-split & backorders
    ├── test_hybrid_billing.py         # Unit tests: Subscription creation & proration
    ├── test_customer_portal.py        # Security tests: Customer isolation & re-approval
    └── test_quick_test_flow.py        # Complete 8-Step end-to-end automated integration suite
```

---

## 7. Automated Test Suite & Quick Test Flow Architecture

The backend test suite is constructed using Odoo’s native `TransactionCase` testing framework. All test executions run inside rollback transactions, ensuring database isolation.

### The 8-Step Quick Test Flow Automated Suite (`test_quick_test_flow.py`)
```python
from odoo.tests.common import TransactionCase
from odoo.exceptions import UserError, AccessError

class TestQuickTestFlow(TransactionCase):
    def setUp(self):
        super().setUp()
        self.CustomerTier = self.env['dealflow.customer.tier']
        self.Warehouse = self.env['stock.warehouse']
        self.Order = self.env['sale.order']
        self.Product = self.env['product.product']
        
    def test_complete_8_step_quick_flow(self):
        # Step 1: Verify Master Configuration
        gold_tier = self.CustomerTier.search([('name', '=', 'Gold')], limit=1)
        self.assertEqual(gold_tier.max_discount_ceiling, 15.0)
        
        # Step 2: Create Quote with Excessive Discount (22% vs 15% allowed)
        quote = self.Order.create({
            'partner_id': self.env.ref('dealflow360.customer_acme').id,
            'order_line': [(0, 0, {
                'product_id': self.env.ref('dealflow360.product_laptop').id,
                'product_uom_qty': 8,
                'discount': 22.0
            })]
        })
        
        # Step 3: Verify Automated Routing to Manager (Zero manual intervention)
        eval_result = quote.action_evaluate_discount_governance()
        self.assertEqual(quote.state, 'pending_approval')
        self.assertEqual(quote.approval_state, 'pending_manager')
        self.assertGreater(quote.blended_risk_score, 0.0)
        
        # Step 4: Accept Upsell Suggestion & Verify Immediate Margin Recalculation
        initial_margin = quote.order_margin_percent
        quote.action_accept_upsell_recommendation(self.env.ref('dealflow360.product_dock').id, qty=8)
        self.assertGreater(quote.order_margin_percent, initial_margin)
        
        # Step 5: Manager Approval & Verify Multi-Warehouse Auto-Split
        quote.with_user(self.env.ref('dealflow360.user_manager')).action_approve_discount(reason="Strategic deal")
        self.assertEqual(quote.state, 'approved')
        split_result = quote.action_generate_fulfillment_split()
        self.assertEqual(len(split_result['allocations']), 2) # Main (5) + East (3)
        
        # Step 6: Verify Hybrid Order Invoicing & Subscription Segregation
        quote.action_confirm_order()
        invoices = quote.invoice_ids
        subscriptions = self.env['dealflow.subscription'].search([('order_id', '=', quote.id)])
        self.assertTrue(len(invoices) > 0)
        self.assertTrue(len(subscriptions) > 0)
        
        # Step 7: Customer Portal Counter-Discount & Automated Re-Approval
        portal_token = quote.partner_id.portal_token
        quote.portal_submit_counter_discount(portal_token, counter_discount=25.0, remarks="Need 25%")
        self.assertEqual(quote.state, 'pending_approval') # Auto re-enters approval
        
        # Step 8: Final Confirmation & Payment Registration
        quote.with_user(self.env.ref('dealflow360.user_finance')).action_approve_discount(reason="Executive approved")
        quote.action_confirm_order()
        invoice = quote.invoice_ids[0]
        invoice.action_post()
        self.assertEqual(invoice.state, 'posted')
```

---

## 8. End-to-End Requirement Traceability Matrix

| PDF Requirement ID | Backend Model | Domain Service | API Controller Endpoint | Automated Test Method |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-OVR-01** | `sale.order` | `DiscountGovernanceEngine` | `POST /api/v1/quotations/{id}/lines` | `test_01_discount_governance` |
| **REQ-OVR-02** | `dealflow.recommendation` | `UpsellRecommendationEngine` | `GET /api/v1/quotations/{id}/upsell` | `test_04_upsell_margin_impact` |
| **REQ-OVR-03** | `dealflow.fulfillment` | `WarehouseFulfillmentEngine` | `GET /api/v1/quotations/{id}/split` | `test_05_warehouse_split` |
| **REQ-OVR-04** | `dealflow.subscription` | `HybridBillingEngine` | `GET /api/v1/quotations/{id}/billing` | `test_06_hybrid_billing` |
| **REQ-OVR-05** | `dealflow.health.alert` | `DealHealthEngine` | `GET /api/v1/deal-health/summary` | `test_deal_health_cron` |
| **REQ-OVR-06** | `dealflow.negotiation` | `PortalNegotiationService` | `POST /api/v1/portal/quote/{tok}/negotiate` | `test_07_portal_reapproval` |
| **REQ-OVR-07** | `sale.report` | `ReportExportService` | `GET /api/v1/reports/export` | `test_report_export` |
| **REQ-TEST-01** | Complete Models | All Domain Engines | End-to-End Suite | `test_complete_8_step_quick_flow` |

---

## 9. Backend Completeness Guarantee

This blueprint provides full implementation-ready architectural specifications for all 20 required backend sections. A senior Odoo or backend engineer can implement the complete DealFlow360 platform directly from this specification without inventing missing business rules, mathematical formulas, or database relationships.
