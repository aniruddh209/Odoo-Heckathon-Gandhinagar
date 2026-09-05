# DealFlow360: Master Entity-Relationship Diagrams (ERD)

---

## Overview
This document contains the complete visual Entity-Relationship Diagrams (ERD) for DealFlow360's Microsoft SQL Server database schema, rendered using standard GitHub-compatible Mermaid notation. It is partitioned into 9 domain-focused diagrams followed by the Complete System ERD.

---

## 1. Identity & Access ERD

```mermaid
erDiagram
    USERS ||--o{ QUOTATIONS : "creates / owns"
    USERS ||--o{ APPROVAL_ACTIONS : "reviews"
    USERS ||--o{ AUDIT_LOGS : "triggers"
    TEAMS ||--o{ USERS : "groups"

    USERS {
        int Id PK
        string Name
        string Email UK
        string Role
        int TeamId FK
        decimal HistoricalDiscountAvg
        boolean IsActive
        datetime CreatedAt
    }

    TEAMS {
        int Id PK
        string Name
    }
```

---

## 2. Customer Master, Tiering & Product Pricing ERD

```mermaid
erDiagram
    CUSTOMER_TIERS ||--o{ CUSTOMERS : "classifies"
    PRICE_LISTS ||--o{ CUSTOMER_TIERS : "default pricelist"
    PRICE_LISTS ||--o{ PRICE_LIST_ITEMS : "contains"
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCT_CATEGORIES ||--|| CATEGORY_DISCOUNT_LIMITS : "defines limit"
    PRODUCTS ||--o{ PRICE_LIST_ITEMS : "priced in"
    CUSTOMERS ||--o{ QUOTATIONS : "customer"

    CUSTOMER_TIERS {
        int Id PK
        string Name UK
        decimal MaxDiscountCeiling
        int DefaultPriceListId FK
    }

    CATEGORY_DISCOUNT_LIMITS {
        int Id PK
        int CategoryId FK
        decimal MaxRepDiscount
        decimal ManagerApprovalThreshold
    }

    CUSTOMERS {
        int Id PK
        string Name
        string Email
        int CustomerTierId FK
        string PortalToken UK
        datetime PortalTokenExpiry
    }

    PRODUCTS {
        int Id PK
        string Sku UK
        string Name
        int CategoryId FK
        string ProductType
        decimal ListPrice
        decimal StandardCostPrice
        decimal MinMarginThreshold
        boolean IsPromoted
    }
```

---

## 3. Core Quotation & Line Items ERD

```mermaid
erDiagram
    CUSTOMERS ||--o{ QUOTATIONS : "requests"
    USERS ||--o{ QUOTATIONS : "sales rep"
    QUOTATIONS ||--o{ QUOTATION_LINES : "contains"
    PRODUCTS ||--o{ QUOTATION_LINES : "ordered item"

    QUOTATIONS {
        guid Id PK
        string QuotationNumber UK
        int CustomerId FK
        int SalesRepresentativeId FK
        string Status
        string ApprovalLevelRequired
        int CurrentApprovalLevel
        decimal TotalGrossAmount
        decimal TotalDiscountAmount
        decimal TotalNetAmount
        decimal TotalCostAmount
        decimal OrderGrossMarginPercent
        decimal BlendedDiscountRiskScore
        int ConcurrencyVersion
        datetime CreatedAt
    }

    QUOTATION_LINES {
        bigint Id PK
        guid QuotationId FK
        int ProductId FK
        decimal Quantity
        decimal UnitPrice
        decimal DiscountPercentage
        decimal SubtotalAmount
        decimal UnitCostPrice
        decimal LineMarginPercent
        decimal EffectiveDiscountLimit
        boolean RequiresApproval
        string LineItemType
    }
```

---

## 4. Multi-Tier Approval Governance ERD

```mermaid
erDiagram
    QUOTATIONS ||--o{ APPROVAL_REQUESTS : "initiates"
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : "action trail"
    USERS ||--o{ APPROVAL_ACTIONS : "acted by"

    APPROVAL_REQUESTS {
        int Id PK
        guid QuotationId FK
        int RequiredLevel
        string Status
        decimal BlendedRiskScore
        decimal PeakLineViolation
        decimal WeightedMarginLoss
        datetime RequestedAt
    }

    APPROVAL_ACTIONS {
        int Id PK
        int ApprovalRequestId FK
        int ReviewerId FK
        string ActionTaken
        string Remarks
        datetime ActionTimestamp
    }
```

---

## 5. Live Upsell & Co-Purchase Engine ERD

```mermaid
erDiagram
    PRODUCTS ||--o{ CO_PURCHASE_RULES : "primary trigger"
    PRODUCTS ||--o{ CO_PURCHASE_RULES : "recommended item"
    QUOTATIONS ||--o{ UPSELL_RECOMMENDATIONS : "receives"
    PRODUCTS ||--o{ UPSELL_RECOMMENDATIONS : "suggested product"

    CO_PURCHASE_RULES {
        int Id PK
        int TriggerProductId FK
        int RecommendedProductId FK
        decimal AffinityScore
        decimal DefaultDiscountPercent
    }

    UPSELL_RECOMMENDATIONS {
        int Id PK
        guid QuotationId FK
        int RecommendedProductId FK
        decimal MarginDeltaPercent
        decimal ProjectedRevenue
        boolean IsAccepted
    }
```

---

## 6. Multi-Warehouse Fulfillment & Backorders ERD

```mermaid
erDiagram
    QUOTATIONS ||--o{ FULFILLMENT_SPLITS : "split allocation"
    WAREHOUSES ||--o{ FULFILLMENT_SPLITS : "sourced from"
    WAREHOUSES ||--o{ STOCK_QUANTITIES : "holds stock"
    PRODUCTS ||--o{ STOCK_QUANTITIES : "inventory item"
    FULFILLMENT_SPLITS ||--o{ SHIPMENTS : "generates"

    WAREHOUSES {
        int Id PK
        string Code UK
        string Name
        string City
        boolean IsCentralDepot
    }

    STOCK_QUANTITIES {
        int Id PK
        int WarehouseId FK
        int ProductId FK
        decimal QuantityOnHand
        decimal QuantityReserved
        decimal QuantityAvailable
    }

    FULFILLMENT_SPLITS {
        int Id PK
        guid QuotationId FK
        int WarehouseId FK
        decimal EstimatedShippingCost
        int EstimatedDeliveryDays
        string Status
    }

    SHIPMENTS {
        int Id PK
        int FulfillmentSplitId FK
        string TrackingNumber
        string Carrier
        datetime ShippedDate
        string Status
    }
```

---

## 7. Hybrid Billing & Subscriptions ERD

```mermaid
erDiagram
    QUOTATIONS ||--o{ INVOICES : "immediate invoice"
    QUOTATIONS ||--o{ SUBSCRIPTION_CONTRACTS : "subscription contract"
    SUBSCRIPTION_CONTRACTS ||--o{ BILLING_SCHEDULES : "schedule"
    INVOICES ||--o{ INVOICE_LINES : "contains"
    INVOICES ||--o{ PAYMENTS : "reconciled with"
    CUSTOMERS ||--o{ INVOICES : "billed to"

    INVOICES {
        guid Id PK
        string InvoiceNumber UK
        guid QuotationId FK
        int CustomerId FK
        string InvoiceType
        string Status
        decimal TotalAmount
        datetime DueDate
    }

    INVOICE_LINES {
        bigint Id PK
        guid InvoiceId FK
        int ProductId FK
        decimal Quantity
        decimal UnitPrice
        decimal LineTotal
    }

    SUBSCRIPTION_CONTRACTS {
        int Id PK
        guid QuotationId FK
        int CustomerId FK
        string BillingInterval
        decimal RecurringAmount
        datetime StartDate
        datetime NextBillingDate
        string Status
    }

    BILLING_SCHEDULES {
        int Id PK
        int SubscriptionContractId FK
        datetime ScheduledDate
        decimal ProjectedAmount
        string Status
    }
```

---

## 8. Customer Portal Negotiation & Health Monitoring ERD

```mermaid
erDiagram
    QUOTATIONS ||--o{ NEGOTIATION_THREADS : "portal discussion"
    NEGOTIATION_THREADS ||--o{ NEGOTIATION_MESSAGES : "messages"
    QUOTATIONS ||--o{ DEAL_HEALTH_ALERTS : "health monitoring"
    USERS ||--o{ DEAL_HEALTH_ALERTS : "assigned rep"

    NEGOTIATION_THREADS {
        int Id PK
        guid QuotationId FK
        string ThreadType
        datetime CreatedAt
    }

    NEGOTIATION_MESSAGES {
        bigint Id PK
        int ThreadId FK
        string AuthorType
        string MessageContent
        decimal ProposedDiscountPercent
        datetime SentAt
    }

    DEAL_HEALTH_ALERTS {
        int Id PK
        guid QuotationId FK
        int AssignedRepId FK
        string AlertType
        string Severity
        string Description
        boolean IsResolved
        datetime CreatedAt
    }
```

---

## 9. Complete DealFlow360 System ERD

```mermaid
erDiagram
    USERS ||--o{ QUOTATIONS : "creates / reps"
    CUSTOMERS ||--o{ QUOTATIONS : "customer"
    CUSTOMER_TIERS ||--o{ CUSTOMERS : "tier"
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : "category"
    PRODUCTS ||--o{ QUOTATION_LINES : "line product"
    QUOTATIONS ||--o{ QUOTATION_LINES : "contains"
    QUOTATIONS ||--o{ APPROVAL_REQUESTS : "approval"
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : "actions"
    USERS ||--o{ APPROVAL_ACTIONS : "reviews"
    QUOTATIONS ||--o{ FULFILLMENT_SPLITS : "splits"
    WAREHOUSES ||--o{ FULFILLMENT_SPLITS : "source"
    QUOTATIONS ||--o{ INVOICES : "one-time billing"
    QUOTATIONS ||--o{ SUBSCRIPTION_CONTRACTS : "recurring billing"
    QUOTATIONS ||--o{ DEAL_HEALTH_ALERTS : "monitored"
    USERS ||--o{ AUDIT_LOGS : "audited actor"

    QUOTATIONS {
        guid Id PK
        string QuotationNumber UK
        string Status
        decimal TotalNetAmount
        decimal OrderGrossMarginPercent
        decimal BlendedDiscountRiskScore
    }

    APPROVAL_REQUESTS {
        int Id PK
        int RequiredLevel
        string Status
    }

    INVOICES {
        guid Id PK
        string InvoiceType
        decimal TotalAmount
    }

    SUBSCRIPTION_CONTRACTS {
        int Id PK
        string BillingInterval
        decimal RecurringAmount
    }

    AUDIT_LOGS {
        bigint Id PK
        string EntityName
        string ActionType
        int ActorUserId FK
        datetime Timestamp
    }
```
