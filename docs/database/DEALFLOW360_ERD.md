# DealFlow360: Master Entity-Relationship Diagrams (ERD)

---

## Overview
This document contains the complete visual Entity-Relationship Diagrams (ERD) for DealFlow360's Microsoft SQL Server database schema, rendered using standard GitHub-compatible Mermaid notation. It represents all **41 normalized entities** across 7 architectural domains.

---

## 1. Domain 1: Identity, Access & Governance ERD

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    SALES_TEAMS ||--o{ USERS : "groups"
    USERS ||--o{ REFRESH_TOKENS : "issues"
    USERS ||--o{ QUOTATIONS : "reps / creates"
    USERS ||--o{ APPROVAL_ACTIONS : "executes"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ AUDIT_LOGS : "acts"

    ROLES {
        int Id PK
        string Name UK
        string NormalizedName UK
        string Description
        datetime CreatedAt
    }

    SALES_TEAMS {
        int Id PK
        string Name UK
        string Code UK
        int TeamLeadId FK
        datetime CreatedAt
    }

    USERS {
        int Id PK
        string Email UK
        string PasswordHash
        string FullName
        int RoleId FK
        int SalesTeamId FK
        decimal HistoricalDiscountAvg
        boolean IsActive
        datetime CreatedAt
        datetime UpdatedAt
    }

    REFRESH_TOKENS {
        int Id PK
        int UserId FK
        string Token UK
        datetime ExpiresAt
        boolean IsRevoked
        datetime CreatedAt
        string ReplacedByToken
    }
```

---

## 2. Domain 2: Customer Master & Pricing Architecture ERD

```mermaid
erDiagram
    CUSTOMER_TIERS ||--o{ CUSTOMERS : "classifies"
    PRICE_LISTS ||--o{ CUSTOMER_TIERS : "default pricelist"
    PRICE_LISTS ||--o{ PRICE_LIST_ITEMS : "contains"
    PRODUCTS ||--o{ PRICE_LIST_ITEMS : "priced in"
    CUSTOMERS ||--o{ QUOTATIONS : "requests"
    CUSTOMERS ||--o{ ORDERS : "places"
    CUSTOMERS ||--o{ SUBSCRIPTIONS : "subscribes"

    CUSTOMER_TIERS {
        int Id PK
        string Name UK
        decimal MaxDiscountCeiling
        int DefaultPriceListId FK
        string Description
    }

    CUSTOMERS {
        int Id PK
        string Name
        string Email
        int CustomerTierId FK
        int AssignedRepId FK
        string Phone
        string AddressLine1
        string City
        string Country
        string PortalToken UK
        datetime PortalTokenExpiresAt
        boolean IsActive
        datetime CreatedAt
    }

    PRICE_LISTS {
        int Id PK
        string Name
        string CurrencyCode
        boolean IsActive
        datetime ValidFrom
        datetime ValidTo
    }

    PRICE_LIST_ITEMS {
        int Id PK
        int PriceListId FK
        int ProductId FK
        decimal MinQuantity
        decimal FixedPrice
    }
```

---

## 3. Domain 3: Catalog & Multi-Attribute Variants ERD

```mermaid
erDiagram
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCT_CATEGORIES ||--o{ PRODUCT_CATEGORIES : "parent of"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "has variants"
    PRODUCTS ||--o{ INVENTORY_STOCKS : "stocked"
    PRODUCTS ||--o{ QUOTATION_LINES : "ordered item"
    PRODUCT_ATTRIBUTES ||--o{ ATTRIBUTE_VALUES : "defines"
    PRODUCT_VARIANTS ||--o{ VARIANT_ATTRIBUTE_VALUES : "composed of"
    ATTRIBUTE_VALUES ||--o{ VARIANT_ATTRIBUTE_VALUES : "instantiates"

    PRODUCT_CATEGORIES {
        int Id PK
        string Name UK
        string Code UK
        int ParentCategoryId FK
        decimal MaxCategoryDiscount
    }

    PRODUCTS {
        int Id PK
        string Sku UK
        string Name
        int CategoryId FK
        string ProductType
        decimal ListPrice
        decimal StandardCostPrice
        string Uom
        decimal TaxRatePercent
        boolean IsPromoted
        decimal MinMarginThreshold
        boolean IsActive
        datetime CreatedAt
    }

    PRODUCT_ATTRIBUTES {
        int Id PK
        string Name UK
        string Description
    }

    ATTRIBUTE_VALUES {
        int Id PK
        int ProductAttributeId FK
        string Value
        int DisplayOrder
    }

    PRODUCT_VARIANTS {
        int Id PK
        int ProductId FK
        string Sku UK
        string VariantName
        decimal PriceExtra
        decimal CostExtra
        boolean IsActive
    }

    VARIANT_ATTRIBUTE_VALUES {
        int ProductVariantId PK_FK
        int AttributeValueId PK_FK
    }
```

---

## 4. Domain 4: Discount Governance & Multi-Tier Approvals ERD

```mermaid
erDiagram
    CUSTOMER_TIERS ||--o{ DISCOUNT_RULES : "governs tier"
    PRODUCT_CATEGORIES ||--o{ DISCOUNT_RULES : "governs category"
    APPROVAL_RULES ||--o{ APPROVAL_RULE_STEPS : "steps"
    ROLES ||--o{ APPROVAL_RULE_STEPS : "requires role"
    QUOTATIONS ||--o{ APPROVAL_REQUESTS : "triggers"
    APPROVAL_RULE_STEPS ||--o{ APPROVAL_REQUESTS : "current step"
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : "action ledger"
    USERS ||--o{ APPROVAL_ACTIONS : "reviewer"

    DISCOUNT_RULES {
        int Id PK
        int CustomerTierId FK
        int ProductCategoryId FK
        decimal MaxRepDiscountPercent
        decimal ManagerApprovalFloorPercent
        decimal FinanceApprovalFloorPercent
        datetime EffectiveDate
        boolean IsActive
    }

    APPROVAL_RULES {
        int Id PK
        string RuleName
        decimal MinRiskScore
        decimal MaxRiskScore
        decimal MinOrderValue
        boolean IsActive
    }

    APPROVAL_RULE_STEPS {
        int Id PK
        int ApprovalRuleId FK
        int RequiredRoleId FK
        int StepOrder
        string StepName
        boolean CanAutoApprove
    }

    APPROVAL_REQUESTS {
        int Id PK
        int QuotationId FK
        int CurrentRuleStepId FK
        string Status
        decimal BlendedRiskScore
        decimal PeakLineViolation
        decimal WeightedMarginLoss
        datetime SubmittedAt
        datetime CompletedAt
    }

    APPROVAL_ACTIONS {
        int Id PK
        int ApprovalRequestId FK
        int ReviewerId FK
        string ActionTaken
        int StepOrder
        string Remarks
        datetime ActionTimestamp
        string IpAddress
    }
```

---

## 5. Domain 5: Warehouses, Logistics & Order Fulfillment ERD

```mermaid
erDiagram
    WAREHOUSES ||--o{ INVENTORY_STOCKS : "stores"
    WAREHOUSES ||--o{ REPLENISHMENT_RULES : "governs"
    WAREHOUSES ||--o{ WAREHOUSE_ALLOCATIONS : "dispatches from"
    WAREHOUSES ||--o{ BACKORDERS : "target warehouse"
    QUOTATIONS ||--|| ORDERS : "converts upon confirm"
    ORDERS ||--o{ ORDER_LINES : "contains"
    ORDERS ||--o{ WAREHOUSE_ALLOCATIONS : "allocated into"
    ORDERS ||--o{ BACKORDERS : "unfulfilled items"
    ORDER_LINES ||--o{ WAREHOUSE_ALLOCATIONS : "allocates"
    ORDER_LINES ||--o{ BACKORDERS : "deficit for"

    WAREHOUSES {
        int Id PK
        string Name UK
        string Code UK
        string AddressLine1
        string City
        boolean IsCentralDepot
        decimal ShippingCostWeight
        boolean IsActive
    }

    INVENTORY_STOCKS {
        int Id PK
        int WarehouseId FK
        int ProductId FK
        int ProductVariantId FK
        decimal QuantityOnHand
        decimal QuantityReserved
        decimal QuantityAvailable
        datetime LastStockCheckAt
    }

    REPLENISHMENT_RULES {
        int Id PK
        int WarehouseId FK
        int ProductId FK
        decimal MinStockLevel
        decimal MaxStockLevel
        decimal ReorderQuantity
        boolean IsActive
    }

    ORDERS {
        int Id PK
        string OrderNumber UK
        int QuotationId FK
        int CustomerId FK
        int SalesRepresentativeId FK
        string Status
        datetime ConfirmedDate
        decimal TotalGrossAmount
        decimal TotalDiscountAmount
        decimal TotalNetAmount
        decimal TotalCostAmount
        datetime PromisedDeliveryDate
        boolean CustomerSplitDeliveryConsent
    }

    ORDER_LINES {
        bigint Id PK
        int OrderId FK
        int ProductId FK
        int ProductVariantId FK
        decimal QuantityOrdered
        decimal QuantityFulfilled
        decimal UnitPrice
        decimal DiscountPercentage
        decimal NetTotal
        decimal UnitCostPrice
        string LineItemType
    }

    WAREHOUSE_ALLOCATIONS {
        int Id PK
        int OrderId FK
        bigint OrderLineId FK
        int WarehouseId FK
        decimal AllocatedQuantity
        decimal EstimatedShippingCost
        int EstimatedDeliveryDays
        string Status
        boolean IsManualOverride
        datetime DispatchedAt
    }

    BACKORDERS {
        int Id PK
        string BackorderNumber UK
        int OrderId FK
        bigint OrderLineId FK
        int TargetWarehouseId FK
        decimal DeficitQuantity
        string Status
        decimal ArrivedStockQuantity
        datetime StockArrivedAt
        datetime ConsolidatedAt
    }
```

---

## 6. Domain 6: Hybrid Billing, Subscriptions & Financials ERD

```mermaid
erDiagram
    PRODUCTS ||--o{ SUBSCRIPTION_PLANS : "blueprint for"
    SUBSCRIPTION_PLANS ||--o{ SUBSCRIPTIONS : "instantiates"
    CUSTOMERS ||--o{ SUBSCRIPTIONS : "holds"
    ORDERS ||--o{ SUBSCRIPTIONS : "generates"
    SUBSCRIPTIONS ||--o{ BILLING_SCHEDULES : "projects"
    ORDERS ||--o{ INVOICES : "billed by"
    INVOICES ||--o{ INVOICE_LINES : "contains"
    INVOICES ||--o{ PAYMENTS : "reconciled by"
    ORDERS ||--o{ CREDIT_NOTES : "adjusted by"
    SUBSCRIPTIONS ||--o{ CREDIT_NOTES : "refunds on cancel"

    SUBSCRIPTION_PLANS {
        int Id PK
        int ProductId FK
        string Name
        string BillingInterval
        int IntervalCount
        int GracePeriodDays
        boolean IsActive
    }

    SUBSCRIPTIONS {
        int Id PK
        string SubscriptionNumber UK
        int CustomerId FK
        int OrderId FK
        int SubscriptionPlanId FK
        decimal CurrentQuantity
        decimal UnitPrice
        decimal DiscountPercent
        decimal RecurringAmount
        string Status
        datetime StartDate
        datetime CurrentPeriodStart
        datetime CurrentPeriodEnd
        datetime NextBillingDate
        datetime CancelledAt
    }

    BILLING_SCHEDULES {
        int Id PK
        int SubscriptionId FK
        int InvoiceId FK
        datetime ScheduledDate
        decimal ProjectedAmount
        decimal ProrationAdjustment
        string Status
    }

    INVOICES {
        int Id PK
        string InvoiceNumber UK
        int OrderId FK
        int CustomerId FK
        string InvoiceType
        string Status
        datetime IssueDate
        datetime DueDate
        decimal TotalAmount
        decimal PaidAmount
        decimal BalanceDue
    }

    INVOICE_LINES {
        bigint Id PK
        int InvoiceId FK
        int ProductId FK
        string Description
        decimal Quantity
        decimal UnitPrice
        decimal DiscountPercent
        decimal LineTotal
    }

    PAYMENTS {
        int Id PK
        string PaymentReference UK
        int InvoiceId FK
        decimal Amount
        string PaymentMethod
        datetime PaymentDate
        string Status
    }

    CREDIT_NOTES {
        int Id PK
        string CreditNoteNumber UK
        int OrderId FK
        int CustomerId FK
        int SubscriptionId FK
        decimal Amount
        string Reason
        datetime IssueDate
        string Status
    }
```

---

## 7. Domain 7: Deal Intelligence, Negotiation & Platform Auditing ERD

```mermaid
erDiagram
    PRODUCTS ||--o{ UPSELL_CROSS_SELL_RULES : "source product"
    PRODUCTS ||--o{ UPSELL_CROSS_SELL_RULES : "recommended product"
    CUSTOMERS ||--o{ QUOTATIONS : "customer"
    USERS ||--o{ QUOTATIONS : "sales rep"
    QUOTATIONS ||--o{ QUOTATION_LINES : "contains"
    QUOTATION_LINES ||--o{ QUOTATION_LINE_COMMENTS : "has comments"
    QUOTATIONS ||--o{ QUOTATION_CHANGES : "negotiation audit"
    QUOTATIONS ||--o{ DEAL_HEALTH_SNAPSHOTS : "monitored by"
    USERS ||--o{ DEAL_HEALTH_SNAPSHOTS : "assigned rep"
    USERS ||--o{ NOTIFICATIONS : "notified"
    QUOTATIONS ||--o{ NOTIFICATIONS : "deal reference"
    USERS ||--o{ AUDIT_LOGS : "acted by"

    UPSELL_CROSS_SELL_RULES {
        int Id PK
        int SourceProductId FK
        int RecommendedProductId FK
        string RuleType
        decimal ConfidenceScore
        boolean IsPromoted
        string PromotionalText
        decimal MinMarginThreshold
        boolean IsActive
    }

    QUOTATIONS {
        int Id PK
        string QuotationNumber UK
        int CustomerId FK
        int SalesRepresentativeId FK
        int SalesTeamId FK
        string Status
        decimal BlendedDiscountRiskScore
        decimal TotalGrossAmount
        decimal TotalDiscountAmount
        decimal TotalNetAmount
        decimal TotalCostAmount
        decimal OrderGrossMarginAmount
        decimal OrderGrossMarginPercent
        decimal CustomerCounterDiscount
        boolean CustomerSplitDeliveryConsent
        string CustomerNotes
        string InternalRemarks
        datetime LastCustomerActivityDate
        datetime PromisedDeliveryDate
        binary ConcurrencyVersion
        datetime CreatedAt
        datetime UpdatedAt
    }

    QUOTATION_LINES {
        bigint Id PK
        int QuotationId FK
        int ProductId FK
        int ProductVariantId FK
        decimal Quantity
        decimal UnitPrice
        decimal DiscountPercentage
        decimal EffectiveDiscountLimit
        boolean RequiresApproval
        string ApprovalReason
        decimal SubtotalAmount
        decimal UnitCostPrice
        decimal LineMarginAmount
        decimal LineMarginPercent
        string LineItemType
    }

    QUOTATION_LINE_COMMENTS {
        bigint Id PK
        bigint QuotationLineId FK
        int AuthorUserId FK
        string AuthorType
        string CommentText
        datetime CreatedAt
    }

    QUOTATION_CHANGES {
        int Id PK
        int QuotationId FK
        string ChangeType
        string PreviousValue
        string ProposedValue
        string Status
        datetime CreatedAt
    }

    DEAL_HEALTH_SNAPSHOTS {
        int Id PK
        int QuotationId FK
        int AssignedRepId FK
        int DaysInactive
        decimal RepDiscountDeviation
        string DeliveryRiskSeverity
        int OverallHealthScore
        string AlertFlags
        datetime EvaluatedAt
    }

    NOTIFICATIONS {
        int Id PK
        int UserId FK
        int QuotationId FK
        string Title
        string Message
        string NotificationType
        boolean IsRead
        datetime CreatedAt
    }

    AUDIT_LOGS {
        bigint Id PK
        string EntityName
        string EntityId
        string Action
        string OldValues
        string NewValues
        datetime Timestamp
        int UserId FK
        string IpAddress
    }
```

---

## 8. Complete System Global ERD (All 41 Entities)

```mermaid
erDiagram
    %% Identity & Access
    ROLES ||--o{ USERS : "assigned"
    SALES_TEAMS ||--o{ USERS : "groups"
    USERS ||--o{ REFRESH_TOKENS : "owns"
    
    %% Customers & Pricing
    CUSTOMER_TIERS ||--o{ CUSTOMERS : "classifies"
    CUSTOMER_TIERS ||--o{ DISCOUNT_RULES : "governs"
    PRICE_LISTS ||--o{ CUSTOMER_TIERS : "default"
    PRICE_LISTS ||--o{ PRICE_LIST_ITEMS : "contains"
    PRODUCTS ||--o{ PRICE_LIST_ITEMS : "priced"

    %% Catalog & Variants
    PRODUCT_CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCT_CATEGORIES ||--o{ DISCOUNT_RULES : "limits"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "variants"
    PRODUCT_ATTRIBUTES ||--o{ ATTRIBUTE_VALUES : "values"
    PRODUCT_VARIANTS ||--o{ VARIANT_ATTRIBUTE_VALUES : "combines"
    ATTRIBUTE_VALUES ||--o{ VARIANT_ATTRIBUTE_VALUES : "joined"
    PRODUCTS ||--o{ UPSELL_CROSS_SELL_RULES : "source/target"

    %% Quotations & Negotiation
    USERS ||--o{ QUOTATIONS : "reps"
    CUSTOMERS ||--o{ QUOTATIONS : "buys"
    QUOTATIONS ||--o{ QUOTATION_LINES : "lines"
    PRODUCTS ||--o{ QUOTATION_LINES : "selected"
    QUOTATION_LINES ||--o{ QUOTATION_LINE_COMMENTS : "comments"
    QUOTATIONS ||--o{ QUOTATION_CHANGES : "negotiation"

    %% Approvals
    APPROVAL_RULES ||--o{ APPROVAL_RULE_STEPS : "steps"
    ROLES ||--o{ APPROVAL_RULE_STEPS : "approver role"
    QUOTATIONS ||--o{ APPROVAL_REQUESTS : "approval"
    APPROVAL_REQUESTS ||--o{ APPROVAL_ACTIONS : "actions"
    USERS ||--o{ APPROVAL_ACTIONS : "reviewer"

    %% Fulfillment & Stock
    WAREHOUSES ||--o{ INVENTORY_STOCKS : "stores"
    PRODUCTS ||--o{ INVENTORY_STOCKS : "stocked"
    WAREHOUSES ||--o{ REPLENISHMENT_RULES : "rules"
    PRODUCTS ||--o{ REPLENISHMENT_RULES : "reorders"
    QUOTATIONS ||--|| ORDERS : "converts"
    ORDERS ||--o{ ORDER_LINES : "lines"
    ORDERS ||--o{ WAREHOUSE_ALLOCATIONS : "splits"
    ORDERS ||--o{ BACKORDERS : "deficits"
    WAREHOUSES ||--o{ WAREHOUSE_ALLOCATIONS : "sources"
    WAREHOUSES ||--o{ BACKORDERS : "replenishes"

    %% Hybrid Billing & Subscriptions
    PRODUCTS ||--o{ SUBSCRIPTION_PLANS : "blueprint"
    SUBSCRIPTION_PLANS ||--o{ SUBSCRIPTIONS : "plans"
    ORDERS ||--o{ SUBSCRIPTIONS : "initiates"
    SUBSCRIPTIONS ||--o{ BILLING_SCHEDULES : "prorations"
    ORDERS ||--o{ INVOICES : "invoices"
    INVOICES ||--o{ INVOICE_LINES : "lines"
    INVOICES ||--o{ PAYMENTS : "payments"
    ORDERS ||--o{ CREDIT_NOTES : "credits"

    %% Deal Health, Notifications & Audit
    QUOTATIONS ||--o{ DEAL_HEALTH_SNAPSHOTS : "health"
    USERS ||--o{ NOTIFICATIONS : "alerts"
    USERS ||--o{ AUDIT_LOGS : "audits"
```
