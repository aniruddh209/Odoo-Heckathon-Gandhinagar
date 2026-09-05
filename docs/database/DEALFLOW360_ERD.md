# DealFlow360: Master Entity-Relationship Diagrams (ERD)

---

## Overview
This document contains the complete visual Entity-Relationship Diagrams (ERD) for DealFlow360, rendered using standard GitHub-compatible Mermaid notation. It is partitioned into 9 domain-focused diagrams followed by the Complete System ERD connecting all domains.

---

## 1. Identity & Access ERD

```mermaid
erDiagram
    RES_USERS ||--o{ SALE_ORDER : "creates / owns"
    RES_USERS ||--o{ DEALFLOW_APPROVAL_ACTION : "reviews"
    RES_USERS ||--o{ DEALFLOW_AUDIT_LOG : "triggers"
    CRM_TEAM ||--o{ RES_USERS : "groups"

    RES_USERS {
        int id PK
        string name
        string login
        string role
        int team_id FK
        decimal historical_discount_avg
        boolean is_active
    }

    CRM_TEAM {
        int id PK
        string name
    }
```

---

## 2. Customer Master, Tiering & Product Pricing ERD

```mermaid
erDiagram
    DEALFLOW_CUSTOMER_TIER ||--o{ RES_PARTNER : "classifies"
    PRODUCT_PRICELIST ||--o{ DEALFLOW_CUSTOMER_TIER : "default pricelist"
    PRODUCT_PRICELIST ||--o{ PRODUCT_PRICELIST_ITEM : "contains"
    PRODUCT_CATEGORY ||--o{ PRODUCT_PRODUCT : "categorizes"
    PRODUCT_CATEGORY ||--|| DEALFLOW_CATEGORY_LIMIT : "defines limit"
    PRODUCT_PRODUCT ||--o{ PRODUCT_PRICELIST_ITEM : "priced in"
    RES_PARTNER ||--o{ SALE_ORDER : "customer"

    DEALFLOW_CUSTOMER_TIER {
        int id PK
        string name
        decimal max_discount_ceiling
        int default_pricelist_id FK
    }

    DEALFLOW_CATEGORY_LIMIT {
        int id PK
        int category_id FK
        decimal max_rep_discount
        decimal manager_approval_threshold
        decimal finance_approval_threshold
    }

    PRODUCT_PRODUCT {
        int id PK
        string name
        string default_code
        int category_id FK
        string product_type
        decimal list_price
        decimal standard_price
        boolean is_promoted
        decimal min_margin_threshold
    }

    RES_PARTNER {
        int id PK
        string name
        string email
        int customer_tier_id FK
        string portal_token
        datetime portal_token_expiry
    }
```

---

## 3. Quotation & Discount Governance ERD

```mermaid
erDiagram
    SALE_ORDER ||--o{ SALE_ORDER_LINE : "contains lines"
    RES_USERS ||--o{ SALE_ORDER : "sales rep"
    RES_PARTNER ||--o{ SALE_ORDER : "customer"
    PRODUCT_PRODUCT ||--o{ SALE_ORDER_LINE : "product"

    SALE_ORDER {
        int id PK
        string name
        int partner_id FK
        int user_id FK
        string state
        string approval_state
        string highest_approval_level
        decimal blended_risk_score
        decimal amount_untaxed
        decimal amount_discount
        decimal amount_total
        decimal order_margin_percent
        decimal counter_discount_proposed
        date promised_delivery_date
        datetime last_activity_date
        int concurrency_version
    }

    SALE_ORDER_LINE {
        int id PK
        int order_id FK
        int product_id FK
        decimal product_uom_qty
        decimal price_unit
        decimal discount
        decimal effective_ceiling
        boolean is_ceiling_violated
        decimal violation_points
        decimal price_subtotal
        decimal cost_price
        decimal line_margin_percent
        string line_type
        text customer_comment
    }
```

---

## 4. Multi-Level Approval Chain & Audit ERD

```mermaid
erDiagram
    SALE_ORDER ||--o{ DEALFLOW_APPROVAL_REQUEST : "requires"
    DEALFLOW_APPROVAL_REQUEST ||--o{ DEALFLOW_APPROVAL_ACTION : "decision history"
    RES_USERS ||--o{ DEALFLOW_APPROVAL_ACTION : "acted by"
    SALE_ORDER ||--o{ DEALFLOW_AUDIT_LOG : "audited by"

    DEALFLOW_APPROVAL_REQUEST {
        int id PK
        int order_id FK
        string approval_level
        string status
        int assigned_user_id FK
        datetime created_at
        datetime completed_at
    }

    DEALFLOW_APPROVAL_ACTION {
        int id PK
        int request_id FK
        int order_id FK
        int actor_id FK
        string action
        text reason
        decimal risk_score_at_action
        datetime created_at
    }

    DEALFLOW_AUDIT_LOG {
        bigint id PK
        uuid event_uuid
        string event_type
        int order_id FK
        string actor_email
        string actor_role
        string previous_state
        string new_state
        string payload_snapshot
        text reason_text
        datetime timestamp_utc
    }
```

---

## 5. Live Upsell & Cross-Sell ERD

```mermaid
erDiagram
    PRODUCT_PRODUCT ||--o{ DEALFLOW_COPURCHASE_RULE : "source product"
    PRODUCT_PRODUCT ||--o{ DEALFLOW_COPURCHASE_RULE : "recommended product"
    SALE_ORDER ||--o{ DEALFLOW_UPSELL_RECOMMENDATION : "evaluates"
    PRODUCT_PRODUCT ||--o{ DEALFLOW_UPSELL_RECOMMENDATION : "suggests"

    DEALFLOW_COPURCHASE_RULE {
        int id PK
        int source_product_id FK
        int recommended_product_id FK
        decimal confidence_score
        boolean is_active
    }

    DEALFLOW_UPSELL_RECOMMENDATION {
        int id PK
        int order_id FK
        int product_id FK
        decimal margin_delta_percent
        string promotion_tag
        string status
    }
```

---

## 6. Multi-Warehouse Fulfillment & Backorders ERD

```mermaid
erDiagram
    STOCK_WAREHOUSE ||--o{ STOCK_QUANT : "stores"
    PRODUCT_PRODUCT ||--o{ STOCK_QUANT : "inventory of"
    SALE_ORDER ||--o{ DEALFLOW_FULFILLMENT : "splits across"
    SALE_ORDER_LINE ||--o{ DEALFLOW_FULFILLMENT : "allocates"
    STOCK_WAREHOUSE ||--o{ DEALFLOW_FULFILLMENT : "source location"
    SALE_ORDER ||--o{ STOCK_PICKING : "dispatches"
    STOCK_WAREHOUSE ||--o{ STOCK_PICKING : "ships from"
    STOCK_PICKING ||--o{ STOCK_PICKING : "backorder parent"

    STOCK_WAREHOUSE {
        int id PK
        string name
        string code
        decimal shipping_cost_weight
    }

    STOCK_QUANT {
        int id PK
        int product_id FK
        int warehouse_id FK
        decimal quantity
    }

    DEALFLOW_FULFILLMENT {
        int id PK
        int order_id FK
        int order_line_id FK
        int warehouse_id FK
        decimal allocated_qty
        decimal backorder_qty
        string status
        decimal estimated_freight_cost
    }

    STOCK_PICKING {
        int id PK
        string name
        int order_id FK
        int warehouse_id FK
        int backorder_id FK
        boolean is_backorder
        string state
    }
```

---

## 7. Hybrid Billing, Subscriptions & Proration ERD

```mermaid
erDiagram
    SALE_ORDER ||--o{ DEALFLOW_SUBSCRIPTION : "creates contract"
    RES_PARTNER ||--o{ DEALFLOW_SUBSCRIPTION : "subscriber"
    PRODUCT_PRODUCT ||--o{ DEALFLOW_SUBSCRIPTION : "service product"
    DEALFLOW_SUBSCRIPTION ||--o{ DEALFLOW_BILLING_SCHEDULE : "schedules"
    SALE_ORDER ||--o{ ACCOUNT_MOVE : "one-time invoice"
    DEALFLOW_SUBSCRIPTION ||--o{ ACCOUNT_MOVE : "subscription invoice"
    ACCOUNT_MOVE ||--o{ ACCOUNT_PAYMENT : "reconciles"

    DEALFLOW_SUBSCRIPTION {
        int id PK
        string code
        int order_id FK
        int partner_id FK
        int product_id FK
        string billing_interval
        decimal quantity
        decimal recurring_amount
        date start_date
        date next_billing_date
        string status
        decimal prorated_credit_balance
    }

    DEALFLOW_BILLING_SCHEDULE {
        int id PK
        int subscription_id FK
        date scheduled_date
        decimal projected_amount
        int invoice_id FK
        string status
    }

    ACCOUNT_MOVE {
        int id PK
        string name
        int order_id FK
        int partner_id FK
        string move_type
        decimal amount_total
        string payment_state
        date invoice_date
    }

    ACCOUNT_PAYMENT {
        int id PK
        int move_id FK
        decimal amount
        date payment_date
        string state
    }
```

---

## 8. Customer Portal Negotiation ERD

```mermaid
erDiagram
    SALE_ORDER ||--|| DEALFLOW_NEGOTIATION : "negotiates"
    RES_PARTNER ||--o{ DEALFLOW_NEGOTIATION : "customer"
    DEALFLOW_NEGOTIATION ||--o{ DEALFLOW_NEGOTIATION_MSG : "messages"
    SALE_ORDER_LINE ||--o{ DEALFLOW_NEGOTIATION_MSG : "line comment"

    DEALFLOW_NEGOTIATION {
        int id PK
        int order_id FK
        int partner_id FK
        string current_status
        decimal last_counter_discount
        boolean re_approval_triggered
        datetime updated_at
    }

    DEALFLOW_NEGOTIATION_MSG {
        int id PK
        int thread_id FK
        int line_id FK
        string sender_type
        string sender_name
        text message_text
        datetime created_at
    }
```

---

## 9. Deal Health & Anomaly Alerts ERD

```mermaid
erDiagram
    SALE_ORDER ||--o{ DEALFLOW_HEALTH_ALERT : "monitored for"

    DEALFLOW_HEALTH_ALERT {
        int id PK
        int order_id FK
        string alert_type
        string severity
        decimal metric_observed
        decimal metric_threshold
        string message
        boolean is_resolved
        datetime created_at
    }
```

---

## 10. Complete DealFlow360 System ERD

```mermaid
erDiagram
    RES_USERS ||--o{ SALE_ORDER : "creates / reps"
    RES_PARTNER ||--o{ SALE_ORDER : "orders for"
    DEALFLOW_CUSTOMER_TIER ||--o{ RES_PARTNER : "tiers"
    PRODUCT_CATEGORY ||--o{ PRODUCT_PRODUCT : "categorizes"
    PRODUCT_CATEGORY ||--|| DEALFLOW_CATEGORY_LIMIT : "limits"
    PRODUCT_PRODUCT ||--o{ SALE_ORDER_LINE : "quoted in"
    SALE_ORDER ||--o{ SALE_ORDER_LINE : "lines"
    
    SALE_ORDER ||--o{ DEALFLOW_APPROVAL_REQUEST : "routes approval"
    DEALFLOW_APPROVAL_REQUEST ||--o{ DEALFLOW_APPROVAL_ACTION : "actions"
    RES_USERS ||--o{ DEALFLOW_APPROVAL_ACTION : "reviews"
    
    PRODUCT_PRODUCT ||--o{ DEALFLOW_COPURCHASE_RULE : "pairs"
    SALE_ORDER ||--o{ DEALFLOW_UPSELL_RECOMMENDATION : "upsells"
    
    STOCK_WAREHOUSE ||--o{ STOCK_QUANT : "stores"
    PRODUCT_PRODUCT ||--o{ STOCK_QUANT : "quant"
    SALE_ORDER ||--o{ DEALFLOW_FULFILLMENT : "splits"
    STOCK_WAREHOUSE ||--o{ DEALFLOW_FULFILLMENT : "supplies"
    SALE_ORDER ||--o{ STOCK_PICKING : "dispatches"
    
    SALE_ORDER ||--o{ DEALFLOW_SUBSCRIPTION : "starts recurring"
    DEALFLOW_SUBSCRIPTION ||--o{ DEALFLOW_BILLING_SCHEDULE : "schedules"
    SALE_ORDER ||--o{ ACCOUNT_MOVE : "bills one-time"
    DEALFLOW_SUBSCRIPTION ||--o{ ACCOUNT_MOVE : "bills subscription"
    ACCOUNT_MOVE ||--o{ ACCOUNT_PAYMENT : "pays"
    
    SALE_ORDER ||--|| DEALFLOW_NEGOTIATION : "portal negotiation"
    DEALFLOW_NEGOTIATION ||--o{ DEALFLOW_NEGOTIATION_MSG : "messages"
    SALE_ORDER_LINE ||--o{ DEALFLOW_NEGOTIATION_MSG : "line feedback"
    
    SALE_ORDER ||--o{ DEALFLOW_HEALTH_ALERT : "signals risk"
    SALE_ORDER ||--o{ DEALFLOW_AUDIT_LOG : "audits"
    RES_USERS ||--o{ DEALFLOW_AUDIT_LOG : "audited actor"
```
