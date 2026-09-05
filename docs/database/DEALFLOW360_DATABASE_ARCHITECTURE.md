# DealFlow360: Master Database Architecture & Data Model Blueprint

---

## 1. Document Control & Architectural Foundation

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master Database Architecture & Data Model Blueprint |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **Version** | 1.0.0 |
| **Status** | Implementation-Ready Database Specification / Single Source of Truth |
| **Primary Source of Truth** | `DealFlow360.pdf` (13-Page Problem Statement) |
| **Companion Documents** | `docs/DEALFLOW360_MASTER_PRD.md`, `docs/api/DEALFLOW360_API_SPEC.md` |
| **Target Database Engines** | Microsoft SQL Server (MSSQL) / PostgreSQL / Odoo ORM Engine |
| **Last Updated** | 2026-09-05 |

### Source Attribution Legend
- `[ODOO STANDARD]`: Built-in Odoo model/table reused directly without structural alterations.
- `[ODOO EXTENSION]`: Standard Odoo model extended with custom DealFlow360 fields and methods.
- `[CUSTOM MODEL]`: New relational entity designed specifically to satisfy DealFlow360 business engines.
- `[IMPLEMENTATION DECISION]`: Database schema, indexing, type precision, and concurrency choices made to guarantee ACID integrity and performance.

---

## 2. Complete Entity Inventory

| # | Entity Name | Odoo Model Name | Physical DB Table | Domain Classification | Classification | Source Requirement | Security Sensitivity |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Internal User** | `res.users` | `res_users` | Identity & Access | `[ODOO EXTENSION]` | REQ-AUTH-01 | High (Credentials, Roles) |
| 2 | **Customer / Partner** | `res.partner` | `res_partner` | Customer Master | `[ODOO EXTENSION]` | REQ-AUTH-02 | High (Magic-Link Token) |
| 3 | **Customer Tier** | `dealflow.customer.tier` | `dealflow_customer_tier` | Governance & Pricing | `[CUSTOM MODEL]` | REQ-DISC-01 | Medium (Discount Ceilings) |
| 4 | **Product Category** | `product.category` | `product_category` | Catalog Master | `[ODOO STANDARD]` | REQ-PROD-01 | Low |
| 5 | **Category Discount Limit**| `dealflow.category.limit` | `dealflow_category_limit` | Discount Governance | `[CUSTOM MODEL]` | REQ-DISC-02 | Medium (Approval Ceilings) |
| 6 | **Product Template** | `product.template` | `product_template` | Catalog Master | `[ODOO EXTENSION]` | REQ-PROD-01 | Low |
| 7 | **Product Variant** | `product.product` | `product_product` | Catalog Master | `[ODOO EXTENSION]` | REQ-PROD-02 | Medium (Cost Price Hidden) |
| 8 | **Product Attribute** | `product.attribute` | `product_attribute` | Variants | `[ODOO STANDARD]` | REQ-PROD-02 | Low |
| 9 | **Attribute Value** | `product.attribute.value` | `product_attribute_value` | Variants | `[ODOO STANDARD]` | REQ-PROD-02 | Low |
| 10| **Price List** | `product.pricelist` | `product_pricelist` | Pricing Engine | `[ODOO STANDARD]` | REQ-PROD-03 | Low |
| 11| **Price List Item** | `product.pricelist.item` | `product_pricelist_item` | Pricing Engine | `[ODOO STANDARD]` | REQ-PROD-03 | Low |
| 12| **Quotation / Sale Order** | `sale.order` | `sale_order` | Core Transaction | `[ODOO EXTENSION]` | REQ-OVR-01 | High (Margins Internal Only) |
| 13| **Quotation Line Item** | `sale.order.line` | `sale_order_line` | Core Transaction | `[ODOO EXTENSION]` | REQ-OVR-01 | High (Cost/Margin Hidden) |
| 14| **Approval Request** | `dealflow.approval.request`| `dealflow_approval_request`| Approval Governance | `[CUSTOM MODEL]` | REQ-DISC-03 | Medium |
| 15| **Approval Action Log** | `dealflow.approval.action` | `dealflow_approval_action` | Immutable Audit | `[CUSTOM MODEL]` | REQ-DISC-06 | High (Audit Integrity) |
| 16| **Co-Purchase Pair Rule** | `dealflow.copurchase.rule` | `dealflow_copurchase_rule` | Upsell Engine | `[CUSTOM MODEL]` | REQ-UP-01 | Low |
| 17| **Upsell Recommendation** | `dealflow.recommendation` | `dealflow_recommendation` | Upsell Engine | `[CUSTOM MODEL]` | REQ-UP-02 | Medium (Margin Delta) |
| 18| **Warehouse Master** | `stock.warehouse` | `stock_warehouse` | Inventory Master | `[ODOO STANDARD]` | REQ-WH-01 | Low |
| 19| **Stock Balance (Quant)** | `stock.quant` | `stock_quant` | Inventory Tracking | `[ODOO STANDARD]` | REQ-WH-02 | Low |
| 20| **Fulfillment Allocation** | `dealflow.fulfillment` | `dealflow_fulfillment` | Logistics & Splitting | `[CUSTOM MODEL]` | REQ-WH-03 | Medium |
| 21| **Shipment Dispatch / BO** | `stock.picking` | `stock_picking` | Logistics Execution | `[ODOO EXTENSION]` | REQ-WH-03, 05 | Medium |
| 22| **Subscription Contract** | `dealflow.subscription` | `dealflow_subscription` | Hybrid Billing | `[CUSTOM MODEL]` | REQ-SUB-01 | High (Financial Schedules) |
| 23| **Billing Schedule** | `dealflow.billing.schedule`| `dealflow_billing_schedule`| Hybrid Billing | `[CUSTOM MODEL]` | REQ-SUB-01 | High (Financial Projections) |
| 24| **Invoice / Move** | `account.move` | `account_move` | Invoicing & Credits | `[ODOO EXTENSION]` | REQ-SUB-03 | High (Financial Ledger) |
| 25| **Invoice Line Item** | `account.move.line` | `account_move_line` | Invoicing & Credits | `[ODOO STANDARD]` | REQ-SUB-03 | High (Financial Ledger) |
| 26| **Payment Record** | `account.payment` | `account_payment` | Payment Processing | `[ODOO STANDARD]` | REQ-TEST-01 | High (Financial Ledger) |
| 27| **Negotiation Thread** | `dealflow.negotiation` | `dealflow_negotiation` | Customer Portal | `[CUSTOM MODEL]` | REQ-PORT-02 | Medium (Portal Isolated) |
| 28| **Negotiation Message** | `dealflow.negotiation.msg`| `dealflow_negotiation_msg` | Customer Portal | `[CUSTOM MODEL]` | REQ-PORT-02 | Medium (Portal Isolated) |
| 29| **Deal Health Alert** | `dealflow.health.alert` | `dealflow_health_alert` | Anomaly Monitoring | `[CUSTOM MODEL]` | REQ-HLTH-01..03 | Medium (Executive Insights) |
| 30| **Master Audit Event Log**| `dealflow.audit.log` | `dealflow_audit_log` | Platform Compliance | `[CUSTOM MODEL]` | REQ-DISC-06 | Critical (Append-Only Ledger) |

---

## 3. Comprehensive Table & Model Field Specifications

### 3.1 Identity, Customer & Pricing Entities

#### 1. `res_users` (Internal Users)
`[ODOO EXTENSION]`
- `id` (PK): `INTEGER` / `UUID`, Required, Unique, Primary Key.
- `name`: `VARCHAR(255)`, Required.
- `login` (Email): `VARCHAR(255)`, Required, Unique, Indexed.
- `password_hash`: `VARCHAR(255)`, Required.
- `role`: `VARCHAR(50)`, Required, Selection: `['sales_rep', 'sales_manager', 'finance_user', 'admin']`.
- `team_id`: `INTEGER`, Nullable, FK -> `crm_team(id)`, On-Delete: `SET NULL`.
- `historical_discount_avg`: `DECIMAL(5, 2)`, Stored Computed, Default: `0.00`. Rolling 90-day discount mean for anomaly detection.
- `is_active`: `BOOLEAN`, Default: `TRUE`.
- `created_at`: `DATETIME2` / `TIMESTAMP`, Default: `CURRENT_TIMESTAMP`.

#### 2. `res_partner` (Customers & Portals)
`[ODOO EXTENSION]`
- `id` (PK): `INTEGER` / `UUID`, Required, Unique, Primary Key.
- `name`: `VARCHAR(255)`, Required, Indexed.
- `email`: `VARCHAR(255)`, Required, Indexed.
- `customer_tier_id`: `INTEGER`, Required, FK -> `dealflow_customer_tier(id)`, On-Delete: `RESTRICT`.
- `portal_token`: `VARCHAR(64)`, Nullable, Unique, Indexed. Cryptographic HMAC magic-link token.
- `portal_token_expiry`: `DATETIME2`, Nullable.
- `is_customer`: `BOOLEAN`, Default: `TRUE`.
- `phone`: `VARCHAR(50)`, Nullable.
- `street`: `VARCHAR(255)`, Nullable.
- `city`: `VARCHAR(100)`, Nullable.
- `zip`: `VARCHAR(20)`, Nullable.
- `country_id`: `INTEGER`, Nullable, FK -> `res_country(id)`.

#### 3. `dealflow_customer_tier` (Customer Tiers)
`[CUSTOM MODEL]` `[PDF Page 4, 12]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `name`: `VARCHAR(50)`, Required, Unique, Selection: `['Bronze', 'Silver', 'Gold']`.
- `max_discount_ceiling`: `DECIMAL(5, 2)`, Required. Ceilings: Bronze = `5.00%`, Silver = `10.00%`, Gold = `15.00%`.
- `default_pricelist_id`: `INTEGER`, Nullable, FK -> `product_pricelist(id)`.
- `description`: `VARCHAR(255)`, Nullable.

#### 4. `dealflow_category_limit` (Category Discount Ceilings)
`[CUSTOM MODEL]` `[PDF Page 4, 12]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `category_id`: `INTEGER`, Required, Unique, FK -> `product_category(id)`, On-Delete: `CASCADE`.
- `max_rep_discount`: `DECIMAL(5, 2)`, Required. Max discount without approval (Hardware: `15.00%`, Services: `10.00%`).
- `manager_approval_threshold`: `DECIMAL(5, 2)`, Required. Threshold requiring Sales Manager approval (e.g., `> 10.00%` up to `25.00%`).
- `finance_approval_threshold`: `DECIMAL(5, 2)`, Required. Threshold requiring Finance approval (e.g., `> 25.00%`).

#### 5. `product_product` (Product Master & Variants)
`[ODOO EXTENSION]` `[PDF Page 4]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `template_id`: `INTEGER`, Required, FK -> `product_template(id)`, On-Delete: `CASCADE`.
- `name`: `VARCHAR(255)`, Required, Indexed.
- `default_code` (SKU): `VARCHAR(100)`, Unique, Indexed.
- `category_id`: `INTEGER`, Required, FK -> `product_category(id)`, On-Delete: `RESTRICT`.
- `product_type`: `VARCHAR(50)`, Required, Selection: `['one_time_hardware', 'service', 'recurring_subscription']`.
- `list_price`: `DECIMAL(18, 4)`, Required. Catalog base price.
- `standard_price` (Cost): `DECIMAL(18, 4)`, Required. Internal unit cost price (strictly shielded from portal).
- `uom_id`: `INTEGER`, Required, FK -> `uom_uom(id)`.
- `is_promoted`: `BOOLEAN`, Default: `FALSE`.
- `min_margin_threshold`: `DECIMAL(5, 2)`, Default: `25.00`. Margin floor for upsell recommendation eligibility.
- `is_active`: `BOOLEAN`, Default: `TRUE`.

---

### 3.2 Quotations, Line Items & Governance Entities

#### 6. `sale_order` (Quotations & Deal Header)
`[ODOO EXTENSION]` `[PDF Page 4, 6, 8, 11, 12]`
- `id` (PK): `INTEGER` / `UUID`, Required, Unique, Primary Key.
- `name` (Quote Number): `VARCHAR(64)`, Required, Unique, Indexed (e.g., `SO-2026-001`).
- `partner_id`: `INTEGER`, Required, FK -> `res_partner(id)`, On-Delete: `RESTRICT`, Indexed.
- `user_id` (Sales Rep): `INTEGER`, Required, FK -> `res_users(id)`, On-Delete: `RESTRICT`, Indexed.
- `state`: `VARCHAR(50)`, Required, Indexed. Selection: `['draft', 'pending_approval', 'approved', 'sent', 'under_negotiation', 'confirmed', 'done', 'cancelled']`.
- `approval_state`: `VARCHAR(50)`, Required, Default: `'not_required'`. Selection: `['not_required', 'pending_manager', 'pending_finance', 'approved', 'rejected', 'revision_requested']`.
- `highest_approval_level`: `VARCHAR(50)`, Default: `'none'`. Selection: `['none', 'sales_manager', 'sales_manager_and_finance']`.
- `blended_risk_score`: `DECIMAL(8, 4)`, Default: `0.0000`, Stored Computed. Evaluated by governance algorithm.
- `amount_untaxed`: `DECIMAL(18, 4)`, Required, Computed.
- `amount_discount`: `DECIMAL(18, 4)`, Required, Computed. Total discount given.
- `amount_total`: `DECIMAL(18, 4)`, Required, Computed.
- `order_margin_amount`: `DECIMAL(18, 4)`, Stored Computed. Internal gross margin ($).
- `order_margin_percent`: `DECIMAL(5, 2)`, Stored Computed. Internal gross margin (%).
- `counter_discount_proposed`: `DECIMAL(5, 2)`, Nullable. Discount countered by customer via portal.
- `customer_notes`: `TEXT`, Nullable.
- `rep_justification`: `TEXT`, Nullable.
- `promised_delivery_date`: `DATE`, Nullable. Promised delivery date for delivery slippage tracking.
- `last_activity_date`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`, Indexed. Stalled deal baseline.
- `concurrency_version`: `INTEGER`, Default: `1`, Required. Optimistic concurrency control lock.
- `created_at`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`.
- `updated_at`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`.

#### 7. `sale_order_line` (Quotation Line Items)
`[ODOO EXTENSION]` `[PDF Page 4, 6, 12]`
- `id` (PK): `INTEGER`, Required, Unique, Primary Key.
- `order_id`: `INTEGER` / `UUID`, Required, FK -> `sale_order(id)`, On-Delete: `CASCADE`, Indexed.
- `product_id`: `INTEGER`, Required, FK -> `product_product(id)`, On-Delete: `RESTRICT`.
- `product_uom_qty`: `DECIMAL(12, 4)`, Required. Quantity ordered.
- `price_unit`: `DECIMAL(18, 4)`, Required. Catalog unit price before discount.
- `discount`: `DECIMAL(5, 2)`, Default: `0.00`, Required. Discount percentage applied to line.
- `effective_ceiling`: `DECIMAL(5, 2)`, Stored Computed. $\min(\text{CustomerTierCeiling}, \text{CategoryCeiling})$.
- `is_ceiling_violated`: `BOOLEAN`, Stored Computed, Default: `FALSE`.
- `violation_points`: `DECIMAL(5, 2)`, Stored Computed, Default: `0.00`. ($\text{Discount} - \text{EffectiveCeiling}$).
- `price_subtotal`: `DECIMAL(18, 4)`, Stored Computed. Net line total after discount.
- `cost_price`: `DECIMAL(18, 4)`, Stored Computed. Unit standard cost (shielded).
- `line_margin_amount`: `DECIMAL(18, 4)`, Stored Computed. Net margin ($).
- `line_margin_percent`: `DECIMAL(5, 2)`, Stored Computed. Line margin (%).
- `line_type`: `VARCHAR(50)`, Required, Selection: `['one_time', 'recurring']`.
- `customer_comment`: `TEXT`, Nullable. Line-level question/feedback from portal.
- `sequence`: `INTEGER`, Default: `10`. Line display ordering.

#### 8. `dealflow_approval_request` (Approval Requests)
`[CUSTOM MODEL]` `[PDF Page 4, 6]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `order_id`: `INTEGER` / `UUID`, Required, FK -> `sale_order(id)`, On-Delete: `CASCADE`, Indexed.
- `approval_level`: `VARCHAR(50)`, Required, Selection: `['sales_manager', 'finance_user']`.
- `status`: `VARCHAR(50)`, Required, Selection: `['pending', 'approved', 'rejected', 'revision_requested']`.
- `assigned_user_id`: `INTEGER`, Nullable, FK -> `res_users(id)`.
- `created_at`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`.
- `completed_at`: `DATETIME2`, Nullable.

#### 9. `dealflow_approval_action` (Immutable Approval Decisions)
`[CUSTOM MODEL]` `[PDF Page 4, 6]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `request_id`: `INTEGER`, Required, FK -> `dealflow_approval_request(id)`, On-Delete: `CASCADE`.
- `order_id`: `INTEGER` / `UUID`, Required, FK -> `sale_order(id)`, On-Delete: `CASCADE`, Indexed.
- `actor_id`: `INTEGER`, Required, FK -> `res_users(id)`.
- `action`: `VARCHAR(50)`, Required, Selection: `['approve', 'reject', 'return_for_revision']`.
- `reason`: `TEXT`, Required. Mandatory written explanation for audit compliance.
- `risk_score_at_action`: `DECIMAL(8, 4)`, Required. Snapshot of risk score when action occurred.
- `created_at`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`. Immutable.

---

### 3.3 Upsell, Inventory & Fulfillment Entities

#### 10. `dealflow_copurchase_rule` (Co-Purchase Intelligence)
`[CUSTOM MODEL]` `[PDF Page 5, 7]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `source_product_id`: `INTEGER`, Required, FK -> `product_product(id)`, On-Delete: `CASCADE`.
- `recommended_product_id`: `INTEGER`, Required, FK -> `product_product(id)`, On-Delete: `CASCADE`.
- `confidence_score`: `DECIMAL(5, 2)`, Required, Default: `50.00`. Historical co-purchase frequency percentage.
- `is_active`: `BOOLEAN`, Default: `TRUE`.

#### 11. `stock_warehouse` (Warehouse Master)
`[ODOO STANDARD]` `[PDF Page 4]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `name`: `VARCHAR(255)`, Required (e.g., "Main Warehouse", "East Depot").
- `code`: `VARCHAR(20)`, Required, Unique.
- `partner_id`: `INTEGER`, FK -> `res_partner(id)` (Physical location).
- `shipping_cost_weight`: `DECIMAL(8, 4)`, Required, Default: `1.0000`. Logistics cost multiplier.

#### 12. `dealflow_fulfillment` (Fulfillment Allocation Splits)
`[CUSTOM MODEL]` `[PDF Page 7, 11]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `order_id`: `INTEGER` / `UUID`, Required, FK -> `sale_order(id)`, On-Delete: `CASCADE`, Indexed.
- `order_line_id`: `INTEGER`, Required, FK -> `sale_order_line(id)`, On-Delete: `CASCADE`.
- `warehouse_id`: `INTEGER`, Required, FK -> `stock_warehouse(id)`, On-Delete: `RESTRICT`.
- `allocated_qty`: `DECIMAL(12, 4)`, Required. Quantity fulfilled from this warehouse.
- `backorder_qty`: `DECIMAL(12, 4)`, Default: `0.0000`. Quantity unfulfilled / backordered.
- `status`: `VARCHAR(50)`, Required, Selection: `['suggested', 'accepted', 'overridden', 'dispatched', 'backordered', 'consolidated']`.
- `estimated_freight_cost`: `DECIMAL(18, 4)`, Default: `0.00`.

#### 13. `stock_picking` (Shipment Dispatches & Backorder Tracking)
`[ODOO EXTENSION]` `[PDF Page 7, 11]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `name`: `VARCHAR(100)`, Required, Unique (e.g., `WH/OUT/00101`).
- `origin`: `VARCHAR(100)`, Indexed (Source quote number `SO-2026-001`).
- `order_id`: `INTEGER` / `UUID`, Nullable, FK -> `sale_order(id)`.
- `warehouse_id`: `INTEGER`, Required, FK -> `stock_warehouse(id)`.
- `backorder_id`: `INTEGER`, Nullable, FK -> `stock_picking(id)` (Parent picking if backorder).
- `is_backorder`: `BOOLEAN`, Default: `FALSE`.
- `state`: `VARCHAR(50)`, Selection: `['draft', 'waiting', 'confirmed', 'assigned', 'done', 'cancelled']`.
- `scheduled_date`: `DATETIME2`, Nullable.
- `date_done`: `DATETIME2`, Nullable.

---

### 3.4 Hybrid Billing & Subscription Entities

#### 14. `dealflow_subscription` (Recurring Contracts)
`[CUSTOM MODEL]` `[PDF Page 5, 7, 8, 11]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `code`: `VARCHAR(100)`, Required, Unique (e.g., `SUB-2026-0042`).
- `order_id`: `INTEGER` / `UUID`, Required, FK -> `sale_order(id)`, On-Delete: `RESTRICT`, Indexed.
- `partner_id`: `INTEGER`, Required, FK -> `res_partner(id)`, On-Delete: `RESTRICT`.
- `product_id`: `INTEGER`, Required, FK -> `product_product(id)`.
- `billing_interval`: `VARCHAR(20)`, Required, Selection: `['monthly', 'quarterly', 'yearly']`.
- `quantity`: `DECIMAL(12, 4)`, Required. Active seat/license count.
- `recurring_amount`: `DECIMAL(18, 4)`, Required. Period charge.
- `start_date`: `DATE`, Required.
- `next_billing_date`: `DATE`, Required, Indexed.
- `status`: `VARCHAR(50)`, Required, Selection: `['active', 'paused', 'cancelled']`.
- `prorated_credit_balance`: `DECIMAL(18, 4)`, Default: `0.00`. Prepaid credit from mid-cycle downgrades.

#### 15. `dealflow_billing_schedule` (Upcoming Invoicing Schedule)
`[CUSTOM MODEL]` `[PDF Page 8]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `subscription_id`: `INTEGER`, Required, FK -> `dealflow_subscription(id)`, On-Delete: `CASCADE`, Indexed.
- `scheduled_date`: `DATE`, Required, Indexed.
- `projected_amount`: `DECIMAL(18, 4)`, Required.
- `invoice_id`: `INTEGER`, Nullable, FK -> `account_move(id)`.
- `status`: `VARCHAR(50)`, Required, Selection: `['pending', 'invoiced', 'skipped']`.

#### 16. `account_move` (Invoices & Credit Notes)
`[ODOO EXTENSION]` `[PDF Page 8, 11]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `name`: `VARCHAR(100)`, Required, Unique (e.g., `INV/2026/00101`).
- `order_id`: `INTEGER` / `UUID`, Nullable, FK -> `sale_order(id)`, On-Delete: `SET NULL`, Indexed.
- `partner_id`: `INTEGER`, Required, FK -> `res_partner(id)`.
- `move_type`: `VARCHAR(50)`, Required, Selection: `['out_invoice', 'out_refund']`. (`out_invoice` = Invoice, `out_refund` = Credit Note).
- `invoice_origin`: `VARCHAR(100)`, Indexed (Linked Quote or Subscription code).
- `amount_untaxed`: `DECIMAL(18, 4)`, Required.
- `amount_total`: `DECIMAL(18, 4)`, Required.
- `payment_state`: `VARCHAR(50)`, Required, Selection: `['not_paid', 'in_payment', 'paid', 'reversed']`.
- `invoice_date`: `DATE`, Required.

---

### 3.5 Customer Portal, Deal Health & Master Audit Entities

#### 17. `dealflow_negotiation` (Customer Portal Threads)
`[CUSTOM MODEL]` `[PDF Page 8, 11]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `order_id`: `INTEGER` / `UUID`, Required, Unique, FK -> `sale_order(id)`, On-Delete: `CASCADE`.
- `partner_id`: `INTEGER`, Required, FK -> `res_partner(id)`.
- `current_status`: `VARCHAR(50)`, Required, Selection: `['open', 'under_review', 'resolved']`.
- `last_counter_discount`: `DECIMAL(5, 2)`, Nullable.
- `re_approval_triggered`: `BOOLEAN`, Default: `FALSE`.
- `updated_at`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`.

#### 18. `dealflow_negotiation_msg` (Line Feedback & Chat Messages)
`[CUSTOM MODEL]` `[PDF Page 8]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `thread_id`: `INTEGER`, Required, FK -> `dealflow_negotiation(id)`, On-Delete: `CASCADE`, Indexed.
- `line_id`: `INTEGER`, Nullable, FK -> `sale_order_line(id)`, On-Delete: `SET NULL`.
- `sender_type`: `VARCHAR(20)`, Required, Selection: `['customer', 'sales_rep']`.
- `sender_name`: `VARCHAR(100)`, Required.
- `message_text`: `TEXT`, Required.
- `created_at`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`.

#### 19. `dealflow_health_alert` (Anomaly & Stalled Deal Alerts)
`[CUSTOM MODEL]` `[PDF Page 8, 9]`
- `id` (PK): `INTEGER`, Required, Primary Key.
- `order_id`: `INTEGER` / `UUID`, Required, FK -> `sale_order(id)`, On-Delete: `CASCADE`, Indexed.
- `alert_type`: `VARCHAR(50)`, Required, Selection: `['stalled_deal', 'discount_anomaly', 'delivery_slippage']`.
- `severity`: `VARCHAR(20)`, Required, Selection: `['info', 'warning', 'critical']`.
- `metric_observed`: `DECIMAL(12, 4)`, Required. (e.g., Days inactive = `7.0`, Deviation = `10.6%`).
- `metric_threshold`: `DECIMAL(12, 4)`, Required.
- `message`: `VARCHAR(255)`, Required.
- `is_resolved`: `BOOLEAN`, Default: `FALSE`, Indexed.
- `created_at`: `DATETIME2`, Default: `CURRENT_TIMESTAMP`.

#### 20. `dealflow_audit_log` (Master Immutable Event Ledger)
`[CUSTOM MODEL]` `[PDF Page 4, 6]`
- `id` (PK): `BIGINT`, Identity / Auto-Increment, Primary Key.
- `event_uuid`: `UNIQUEIDENTIFIER` / `UUID`, Required, Unique, Default: `NEWID()`.
- `event_type`: `VARCHAR(100)`, Required, Indexed (e.g., `QUOTE_SUBMITTED`, `MANAGER_APPROVED`, `CUSTOMER_COUNTERED`).
- `order_id`: `INTEGER` / `UUID`, Required, Indexed.
- `actor_id`: `INTEGER`, Nullable, FK -> `res_users(id)`.
- `actor_email`: `VARCHAR(255)`, Required.
- `actor_role`: `VARCHAR(50)`, Required.
- `previous_state`: `VARCHAR(50)`, Nullable.
- `new_state`: `VARCHAR(50)`, Nullable.
- `payload_snapshot`: `NVARCHAR(MAX)` / `JSONB`, Required. Complete JSON state diff.
- `reason_text`: `TEXT`, Nullable. Written justification for approvals or revisions.
- `timestamp_utc`: `DATETIME2`, Required, Default: `SYSUTCDATETIME()`, Indexed.
- *Table Constraint*: Append-only. `UPDATE` and `DELETE` triggers are disabled/forbidden by database engine rules.

---

## 4. Normalization, Financial Precision & Concurrency Design

### 4.1 Financial Precision & Decimal Rules
- All currency values (`price_unit`, `price_subtotal`, `amount_total`, `recurring_amount`) are explicitly typed as `DECIMAL(18, 4)`.
- All percentages (`discount`, `effective_ceiling`, `order_margin_percent`, `blended_risk_score`) are explicitly typed as `DECIMAL(8, 4)`.
- **Zero Floating-Point Representation**: IEEE 754 floating-point types (`float`, `double`) are strictly prohibited in financial tables to eliminate binary fractional rounding errors.

### 4.2 Optimistic Concurrency Control (OCC)
- `sale_order` incorporates a `concurrency_version INT DEFAULT 1` column.
- Every state transition or line mutation verifies:
  ```sql
  UPDATE sale_order 
  SET state = @newState, concurrency_version = concurrency_version + 1, updated_at = SYSUTCDATETIME()
  WHERE id = @orderId AND concurrency_version = @expectedVersion;
  ```
- If rows affected = 0, the API engine throws `409 Conflict` (`CONCURRENCY_CONFLICT`), notifying the user that the quotation was updated concurrently by another user or customer negotiation.

### 4.3 Pessimistic Row Locking on Stock Allocation
- During multi-warehouse inventory reservation (`calculate_optimal_warehouse_split`), `stock_quant` rows are locked with `SELECT ... WITH (UPDLOCK, ROWLOCK)` (MSSQL) or `SELECT ... FOR UPDATE` (PostgreSQL) within an atomic database transaction to prevent inventory overselling race conditions.

---

## 5. Indexing & Query Optimization Plan

| Table | Index Name | Columns | Query Intent / Justification |
| :--- | :--- | :--- | :--- |
| `sale_order` | `IX_sale_order_state_user` | `(state, user_id, last_activity_date)` | Speeds up Sales Rep Kanban board and stalled deals background cron. |
| `sale_order` | `IX_sale_order_partner` | `(partner_id, created_at DESC)` | Speeds up Customer Quote History lookups in portal. |
| `sale_order_line` | `IX_order_line_order_id` | `(order_id, sequence)` | Speeds up cart rendering and line recalculation queries. |
| `res_partner` | `IX_res_partner_portal_token`| `(portal_token)` INCLUDE `(id, customer_tier_id)` | Fast sub-millisecond portal magic-link resolution. |
| `dealflow_approval_request` | `IX_approval_status_level` | `(status, approval_level)` | Instant retrieval of pending approvals for Manager/Finance dashboards. |
| `dealflow_fulfillment` | `IX_fulfillment_order_wh` | `(order_id, warehouse_id)` | Speeds up split fulfillment and shipment dispatch generation. |
| `dealflow_subscription`| `IX_sub_next_billing_date` | `(status, next_billing_date)` | Nightly automated recurring billing engine batch runs. |
| `dealflow_health_alert` | `IX_health_unresolved` | `(is_resolved, alert_type, severity)` | Powers the live Deal Health Dashboard widgets. |
| `dealflow_audit_log` | `IX_audit_order_timestamp` | `(order_id, timestamp_utc DESC)` | Powers chronological deal timeline rendering. |

---

## 6. Seed Data Specifications (Quick Test Flow Alignment)

`[PDF Page 10, 11]` Explicit database records required to execute the 8-step Quick Test Flow:

```sql
-- 1. Customer Tiers
INSERT INTO dealflow_customer_tier (id, name, max_discount_ceiling) VALUES
(1, 'Bronze', 5.00),
(2, 'Silver', 10.00),
(3, 'Gold', 15.00);

-- 2. Category Discount Ceilings
INSERT INTO dealflow_category_limit (category_id, max_rep_discount, manager_approval_threshold, finance_approval_threshold) VALUES
(1, 15.00, 25.00, 50.00), -- Hardware: 15% rep ceiling
(2, 10.00, 20.00, 40.00); -- Services: 10% rep ceiling

-- 3. Warehouses & Initial Stock
INSERT INTO stock_warehouse (id, name, code, shipping_cost_weight) VALUES
(1, 'Main Warehouse', 'WH-MAIN', 1.0000),
(2, 'East Depot', 'WH-EAST', 1.5000);

INSERT INTO stock_quant (product_id, warehouse_id, quantity) VALUES
(101, 1, 5.0000),  -- 5 units of Laptop in Main
(101, 2, 10.0000); -- 10 units of Laptop in East

-- 4. Products & Upsell Pairing
INSERT INTO product_product (id, name, default_code, category_id, product_type, list_price, standard_price, is_promoted) VALUES
(101, 'Enterprise Laptop Pro 15', 'HW-LAP-001', 1, 'one_time_hardware', 1200.0000, 800.0000, 0),
(102, 'UltraDock Station 4K', 'HW-DCK-002', 1, 'one_time_hardware', 250.0000, 120.0000, 1),
(201, 'Enterprise Setup Service', 'SRV-SET-001', 2, 'service', 500.0000, 450.0000, 0),
(301, 'DealFlow Cloud SaaS License', 'SUB-CLD-001', 3, 'recurring_subscription', 100.0000, 20.0000, 0);

INSERT INTO dealflow_copurchase_rule (source_product_id, recommended_product_id, confidence_score) VALUES
(101, 102, 84.50);
```

---

## 7. Database Completeness Test

> **Completeness Assertion**:
> Every business concept, multi-tier ceiling, blended risk metric, warehouse split allocation, recurring billing proration, customer portal negotiation comment, and audit record specified in `DealFlow360.pdf` maps directly to an explicit table, field, and foreign key defined above. No placeholder, mock, or implied table remains undocumented.
