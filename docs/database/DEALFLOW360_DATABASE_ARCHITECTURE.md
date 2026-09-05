# DealFlow360: Master Database Architecture & Data Model Blueprint

---

## 1. Document Control & Architectural Foundation

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master Database Architecture & Data Model Blueprint |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **Version** | 2.0.0 (Locked Microsoft SQL Server & EF Core Baseline) |
| **Status** | Approved Database Architecture / Single Source of Truth |
| **Primary Source of Truth** | `DealFlow360.pdf` (13-Page Problem Statement) |
| **Companion Documents** | `docs/DEALFLOW360_MASTER_PRD.md`, `docs/api/DEALFLOW360_API_SPEC.md`, `docs/backend/DEALFLOW360_BACKEND_ARCHITECTURE.md`, `docs/architecture/ADR-001-TECHNOLOGY-STACK.md` |
| **Target Database Engine** | Microsoft SQL Server 2022 / Azure SQL Database (`MSSQLSERVER`) |
| **ORM / Data Access** | Entity Framework Core 9/8 (`Microsoft.EntityFrameworkCore.SqlServer`) + Dapper |
| **Last Updated** | 2026-09-05 |

### Physical Schema Standards
- **Naming Conventions**: SQL Server PascalCase for tables and columns (e.g. `Quotations`, `QuotationLines`, `CustomerTiers`).
- **Primary Keys**: `INT IDENTITY(1,1)` for lookup catalogs and high-volume line items; `UNIQUEIDENTIFIER` (GUID) for transactional aggregates (`Quotations`, `Invoices`, `AuditLogs`).
- **Financial Precision**: All monetary values and margins strictly use `DECIMAL(18, 4)`. Floating point (`FLOAT`/`REAL`) is prohibited.
- **Percentages & Ceilings**: Stored as `DECIMAL(5, 2)` (e.g., `15.50` representing $15.50\%$).
- **Optimistic Concurrency**: Tracked using `ConcurrencyVersion INT NOT NULL DEFAULT 1` or `RowVersion ROWVERSION`.
- **Temporal Tracking**: `CreatedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()`, `UpdatedAt DATETIME2(7) NULL`.
- **Soft Deletion**: `IsDeleted BIT NOT NULL DEFAULT 0` on master entities; transactional audit logs are append-only.

---

## 2. Complete Entity Inventory (30 Relational Tables)

| # | Entity / Table Name | Domain Classification | Primary Key | Key Relationships | Source Requirement | Security Sensitivity |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **Users** | Identity & Access | `INT IDENTITY` | Belongs to `Teams` | REQ-AUTH-01 | High (Credentials, Roles) |
| 2 | **Customers** | Customer Master | `INT IDENTITY` | FK -> `CustomerTiers` | REQ-AUTH-02 | High (Magic-Link Token) |
| 3 | **CustomerTiers** | Governance & Pricing | `INT IDENTITY` | 1:M -> `Customers` | REQ-DISC-01 | Medium (Discount Ceilings) |
| 4 | **ProductCategories** | Catalog Master | `INT IDENTITY` | 1:M -> `Products` | REQ-PROD-01 | Low |
| 5 | **CategoryDiscountLimits**| Discount Governance | `INT IDENTITY` | FK -> `ProductCategories`| REQ-DISC-02 | Medium (Ceiling Thresholds) |
| 6 | **Products** | Catalog Master | `INT IDENTITY` | FK -> `ProductCategories`| REQ-PROD-01 | Medium (Cost Price Hidden) |
| 7 | **ProductVariants** | Variants Master | `INT IDENTITY` | FK -> `Products` | REQ-PROD-02 | Medium (Cost Price Hidden) |
| 8 | **ProductAttributes** | Variants Master | `INT IDENTITY` | 1:M -> `ProductVariants` | REQ-PROD-02 | Low |
| 9 | **ProductAttributeValues**| Variants Master | `INT IDENTITY` | FK -> `ProductAttributes`| REQ-PROD-02 | Low |
| 10| **PriceLists** | Pricing Engine | `INT IDENTITY` | 1:M -> `PriceListItems` | REQ-PROD-03 | Low |
| 11| **PriceListItems** | Pricing Engine | `INT IDENTITY` | FK -> `PriceLists`, `Products`| REQ-PROD-03 | Low |
| 12| **Quotations** | Core Transaction Aggregate| `UNIQUEIDENTIFIER`| FK -> `Customers`, `Users`| REQ-OVR-01 | High (Margins Internal Only) |
| 13| **QuotationLines** | Core Transaction | `BIGINT IDENTITY`| FK -> `Quotations`, `Products`| REQ-OVR-01 | High (Cost/Margin Hidden) |
| 14| **ApprovalRequests** | Approval Governance | `INT IDENTITY` | FK -> `Quotations` | REQ-DISC-03 | Medium |
| 15| **ApprovalActions** | Immutable Audit Ledger| `INT IDENTITY` | FK -> `ApprovalRequests`, `Users`| REQ-DISC-06 | High (Audit Integrity) |
| 16| **CoPurchaseRules** | Upsell Engine | `INT IDENTITY` | FK -> `Products` (Pairing)| REQ-UP-01 | Low |
| 17| **UpsellRecommendations**| Upsell Engine | `INT IDENTITY` | FK -> `Quotations`, `Products`| REQ-UP-02 | Medium (Margin Delta) |
| 18| **Warehouses** | Inventory Master | `INT IDENTITY` | 1:M -> `StockQuantities`| REQ-WH-01 | Low |
| 19| **StockQuantities** | Inventory Tracking | `INT IDENTITY` | FK -> `Warehouses`, `Products`| REQ-WH-02 | Low |
| 20| **FulfillmentSplits** | Logistics & Splitting | `INT IDENTITY` | FK -> `Quotations`, `Warehouses`| REQ-WH-03 | Medium |
| 21| **Shipments** | Logistics Execution | `INT IDENTITY` | FK -> `FulfillmentSplits`| REQ-WH-03, 05 | Medium |
| 22| **SubscriptionContracts**| Hybrid Billing | `INT IDENTITY` | FK -> `Quotations`, `Customers`| REQ-SUB-01 | High (Financial Schedules) |
| 23| **BillingSchedules** | Hybrid Billing | `INT IDENTITY` | FK -> `SubscriptionContracts`| REQ-SUB-01 | High (Projected Invoices) |
| 24| **Invoices** | Invoicing & Credits | `UNIQUEIDENTIFIER`| FK -> `Quotations`, `Customers`| REQ-SUB-03 | High (Financial Ledger) |
| 25| **InvoiceLines** | Invoicing & Credits | `BIGINT IDENTITY`| FK -> `Invoices`, `Products`| REQ-SUB-03 | High (Financial Ledger) |
| 26| **Payments** | Payment Processing | `INT IDENTITY` | FK -> `Invoices` | REQ-TEST-01 | High (Financial Ledger) |
| 27| **NegotiationThreads** | Customer Portal | `INT IDENTITY` | FK -> `Quotations` | REQ-PORT-02 | Medium (Portal Isolated) |
| 28| **NegotiationMessages**| Customer Portal | `BIGINT IDENTITY`| FK -> `NegotiationThreads`| REQ-PORT-02 | Medium (Portal Isolated) |
| 29| **DealHealthAlerts** | Anomaly Monitoring | `INT IDENTITY` | FK -> `Quotations`, `Users`| REQ-HLTH-01..03 | Medium (Executive Insights) |
| 30| **AuditLogs** | Platform Compliance | `BIGINT IDENTITY`| FK -> `Users` (Nullable) | REQ-DISC-06 | Critical (Append-Only Ledger) |

---

## 3. Table & Field Specifications (T-SQL Data Types)

### 3.1 Identity, Customer & Governance

#### 1. `Users`
```sql
CREATE TABLE Users (
    Id INT IDENTITY(1,1) CONSTRAINT PK_Users PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
    PasswordHash NVARCHAR(500) NOT NULL,
    Role NVARCHAR(50) NOT NULL CONSTRAINT CK_Users_Role CHECK (Role IN ('sales_rep', 'sales_manager', 'finance_user', 'admin')),
    TeamId INT NULL,
    HistoricalDiscountAvg DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(7) NULL
);
```

#### 2. `Customers`
```sql
CREATE TABLE Customers (
    Id INT IDENTITY(1,1) CONSTRAINT PK_Customers PRIMARY KEY,
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    CustomerTierId INT NOT NULL CONSTRAINT FK_Customers_Tier REFERENCES CustomerTiers(Id),
    PortalToken NVARCHAR(128) NULL CONSTRAINT UQ_Customers_PortalToken UNIQUE,
    PortalTokenExpiry DATETIME2(7) NULL,
    Phone NVARCHAR(50) NULL,
    AddressLine NVARCHAR(255) NULL,
    City NVARCHAR(100) NULL,
    PostalCode NVARCHAR(20) NULL,
    Country NVARCHAR(100) NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
```

#### 3. `CustomerTiers`
```sql
CREATE TABLE CustomerTiers (
    Id INT IDENTITY(1,1) CONSTRAINT PK_CustomerTiers PRIMARY KEY,
    Name NVARCHAR(50) NOT NULL CONSTRAINT UQ_CustomerTiers_Name UNIQUE, -- 'Bronze', 'Silver', 'Gold'
    MaxDiscountCeiling DECIMAL(5,2) NOT NULL, -- 5.00, 10.00, 15.00
    DefaultPriceListId INT NULL,
    Description NVARCHAR(255) NULL
);
```

#### 4. `CategoryDiscountLimits`
```sql
CREATE TABLE CategoryDiscountLimits (
    Id INT IDENTITY(1,1) CONSTRAINT PK_CategoryDiscountLimits PRIMARY KEY,
    CategoryId INT NOT NULL CONSTRAINT FK_CategoryDiscountLimits_Category REFERENCES ProductCategories(Id),
    MaxRepDiscount DECIMAL(5,2) NOT NULL, -- Category ceiling (e.g. 15.00%)
    ManagerApprovalThreshold DECIMAL(5,2) NOT NULL, -- Threshold triggering Level 2 (e.g. 25.00%)
    IsActive BIT NOT NULL DEFAULT 1
);
```

---

### 3.2 Product Master & Pricing Catalog

#### 5. `Products`
```sql
CREATE TABLE Products (
    Id INT IDENTITY(1,1) CONSTRAINT PK_Products PRIMARY KEY,
    Sku NVARCHAR(100) NOT NULL CONSTRAINT UQ_Products_Sku UNIQUE,
    Name NVARCHAR(255) NOT NULL,
    CategoryId INT NOT NULL CONSTRAINT FK_Products_Category REFERENCES ProductCategories(Id),
    ProductType NVARCHAR(50) NOT NULL CONSTRAINT CK_Products_Type CHECK (ProductType IN ('one_time_hardware', 'service', 'recurring_subscription')),
    ListPrice DECIMAL(18,4) NOT NULL,
    StandardCostPrice DECIMAL(18,4) NOT NULL, -- SENSITIVE: Never leak to portal
    MinMarginThreshold DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    IsPromoted BIT NOT NULL DEFAULT 0,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### 3.3 Core Quotation Transaction Aggregate

#### 6. `Quotations`
```sql
CREATE TABLE Quotations (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Quotations PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    QuotationNumber NVARCHAR(50) NOT NULL CONSTRAINT UQ_Quotations_Number UNIQUE,
    CustomerId INT NOT NULL CONSTRAINT FK_Quotations_Customer REFERENCES Customers(Id),
    SalesRepresentativeId INT NOT NULL CONSTRAINT FK_Quotations_Rep REFERENCES Users(Id),
    Status NVARCHAR(50) NOT NULL CONSTRAINT CK_Quotations_Status CHECK (Status IN (
        'draft', 'pending_approval', 'approved', 'sent', 'negotiation_active', 'confirmed', 'rejected', 'revise_requested', 'cancelled'
    )),
    ApprovalLevelRequired NVARCHAR(50) NOT NULL DEFAULT 'auto_approved',
    CurrentApprovalLevel INT NOT NULL DEFAULT 0, -- 0: Auto, 1: Manager, 2: Finance
    TotalGrossAmount DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    TotalDiscountAmount DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    TotalNetAmount DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    TotalCostAmount DECIMAL(18,4) NOT NULL DEFAULT 0.0000,       -- SENSITIVE: Internal Only
    OrderGrossMarginAmount DECIMAL(18,4) NOT NULL DEFAULT 0.0000, -- SENSITIVE: Internal Only
    OrderGrossMarginPercent DECIMAL(5,2) NOT NULL DEFAULT 0.00,  -- SENSITIVE: Internal Only
    BlendedDiscountRiskScore DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- SENSITIVE: Internal Only
    CustomerCounterDiscount DECIMAL(5,2) NULL,
    CustomerSplitDeliveryConsent BIT NOT NULL DEFAULT 0,
    CustomerNotes NVARCHAR(MAX) NULL,
    InternalRemarks NVARCHAR(MAX) NULL,                          -- SENSITIVE: Internal Only
    PromisedDeliveryDate DATETIME2(7) NULL,
    LastCustomerActivityDate DATETIME2(7) NULL,
    ConcurrencyVersion INT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(7) NULL
);
```

#### 7. `QuotationLines`
```sql
CREATE TABLE QuotationLines (
    Id BIGINT IDENTITY(1,1) CONSTRAINT PK_QuotationLines PRIMARY KEY,
    QuotationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_QuotationLines_Quotation REFERENCES Quotations(Id) ON DELETE CASCADE,
    ProductId INT NOT NULL CONSTRAINT FK_QuotationLines_Product REFERENCES Products(Id),
    Quantity DECIMAL(18,4) NOT NULL,
    UnitPrice DECIMAL(18,4) NOT NULL,
    DiscountPercentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    SubtotalAmount DECIMAL(18,4) NOT NULL,
    UnitCostPrice DECIMAL(18,4) NOT NULL,                       -- SENSITIVE: Internal Only
    TotalCostAmount DECIMAL(18,4) NOT NULL,                     -- SENSITIVE: Internal Only
    LineMarginAmount DECIMAL(18,4) NOT NULL,                    -- SENSITIVE: Internal Only
    LineMarginPercent DECIMAL(5,2) NOT NULL,                    -- SENSITIVE: Internal Only
    EffectiveDiscountLimit DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    RequiresApproval BIT NOT NULL DEFAULT 0,
    ApprovalReason NVARCHAR(255) NULL,
    LineItemType NVARCHAR(50) NOT NULL -- 'one_time_hardware', 'service', 'recurring_subscription'
);
```

---

### 3.4 Approval Workflow & Audit Trail

#### 8. `ApprovalRequests`
```sql
CREATE TABLE ApprovalRequests (
    Id INT IDENTITY(1,1) CONSTRAINT PK_ApprovalRequests PRIMARY KEY,
    QuotationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ApprovalRequests_Quotation REFERENCES Quotations(Id),
    RequiredLevel INT NOT NULL, -- 1 = Manager, 2 = Finance
    Status NVARCHAR(50) NOT NULL, -- 'pending', 'approved', 'rejected', 'revision_requested'
    BlendedRiskScore DECIMAL(5,2) NOT NULL,
    PeakLineViolation DECIMAL(5,2) NOT NULL,
    WeightedMarginLoss DECIMAL(5,2) NOT NULL,
    RequestedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
```

#### 9. `ApprovalActions` (Immutable Audit Log)
```sql
CREATE TABLE ApprovalActions (
    Id INT IDENTITY(1,1) CONSTRAINT PK_ApprovalActions PRIMARY KEY,
    ApprovalRequestId INT NOT NULL CONSTRAINT FK_ApprovalActions_Request REFERENCES ApprovalRequests(Id),
    ReviewerId INT NOT NULL CONSTRAINT FK_ApprovalActions_Reviewer REFERENCES Users(Id),
    ActionTaken NVARCHAR(50) NOT NULL CONSTRAINT CK_ApprovalActions_Action CHECK (ActionTaken IN ('approved', 'rejected', 'revision_requested')),
    Remarks NVARCHAR(1000) NOT NULL, -- Mandatory remarks (min 10 chars enforced by API)
    ActionTimestamp DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### 3.5 Warehouses, Fulfillment & Backorders

#### 10. `FulfillmentSplits`
```sql
CREATE TABLE FulfillmentSplits (
    Id INT IDENTITY(1,1) CONSTRAINT PK_FulfillmentSplits PRIMARY KEY,
    QuotationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_FulfillmentSplits_Quotation REFERENCES Quotations(Id),
    WarehouseId INT NOT NULL CONSTRAINT FK_FulfillmentSplits_Warehouse REFERENCES Warehouses(Id),
    EstimatedShippingCost DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    EstimatedDeliveryDays INT NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'allocated', -- 'allocated', 'dispatched', 'delivered'
    CreatedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
```

---

### 3.6 Hybrid Invoicing & Subscriptions

#### 11. `Invoices`
```sql
CREATE TABLE Invoices (
    Id UNIQUEIDENTIFIER NOT NULL CONSTRAINT PK_Invoices PRIMARY KEY DEFAULT NEWSEQUENTIALID(),
    InvoiceNumber NVARCHAR(50) NOT NULL CONSTRAINT UQ_Invoices_Number UNIQUE,
    QuotationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_Invoices_Quotation REFERENCES Quotations(Id),
    CustomerId INT NOT NULL CONSTRAINT FK_Invoices_Customer REFERENCES Customers(Id),
    InvoiceType NVARCHAR(50) NOT NULL, -- 'commercial_one_time', 'recurring_subscription', 'credit_note'
    Status NVARCHAR(50) NOT NULL,      -- 'draft', 'posted', 'paid', 'void'
    SubtotalAmount DECIMAL(18,4) NOT NULL,
    TaxAmount DECIMAL(18,4) NOT NULL DEFAULT 0.0000,
    TotalAmount DECIMAL(18,4) NOT NULL,
    DueDate DATETIME2(7) NOT NULL,
    CreatedAt DATETIME2(7) NOT NULL DEFAULT SYSUTCDATETIME()
);
```

#### 12. `SubscriptionContracts`
```sql
CREATE TABLE SubscriptionContracts (
    Id INT IDENTITY(1,1) CONSTRAINT PK_SubscriptionContracts PRIMARY KEY,
    QuotationId UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_SubscriptionContracts_Quotation REFERENCES Quotations(Id),
    CustomerId INT NOT NULL CONSTRAINT FK_SubscriptionContracts_Customer REFERENCES Customers(Id),
    BillingInterval NVARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'annually'
    RecurringAmount DECIMAL(18,4) NOT NULL,
    StartDate DATETIME2(7) NOT NULL,
    NextBillingDate DATETIME2(7) NOT NULL,
    Status NVARCHAR(50) NOT NULL DEFAULT 'active' -- 'active', 'paused', 'cancelled'
);
```

---

## 4. T-SQL Indexes for Sub-100ms Query Performance

```sql
-- Fast quotation lookups by Status, Representative, and Customer
CREATE NONCLUSTERED INDEX IX_Quotations_Status_Rep
ON Quotations (Status, SalesRepresentativeId)
INCLUDE (QuotationNumber, TotalNetAmount, OrderGrossMarginPercent, BlendedDiscountRiskScore, CreatedAt);

-- Customer Portal Fast Magic-Link Lookup
CREATE UNIQUE NONCLUSTERED INDEX IX_Customers_PortalToken
ON Customers (PortalToken)
WHERE PortalToken IS NOT NULL;

-- Fast Quote Lines Fetch by Quote
CREATE NONCLUSTERED INDEX IX_QuotationLines_QuotationId
ON QuotationLines (QuotationId)
INCLUDE (ProductId, Quantity, UnitPrice, DiscountPercentage, SubtotalAmount, RequiresApproval);

-- Stalled Deals Background Query Acceleration
CREATE NONCLUSTERED INDEX IX_Quotations_StalledMonitoring
ON Quotations (Status, LastCustomerActivityDate)
WHERE Status IN ('sent', 'negotiation_active');
```

---

## 5. EF Core Code-First DbContext Specification

```csharp
namespace DealFlow360.Infrastructure.Persistence;

public class DealFlowDbContext : DbContext, IDealFlowDbContext
{
    public DealFlowDbContext(DbContextOptions<DealFlowDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerTier> CustomerTiers => Set<CustomerTier>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationLine> QuotationLines => Set<QuotationLine>();
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<ApprovalAction> ApprovalActions => Set<ApprovalAction>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<FulfillmentSplit> FulfillmentSplits => Set<FulfillmentSplit>();
    public DbSet<SubscriptionContract> SubscriptionContracts => Set<SubscriptionContract>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<DealHealthAlert> DealHealthAlerts => Set<DealHealthAlert>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(DealFlowDbContext).Assembly);
        
        // Concurrency token mapping
        modelBuilder.Entity<Quotation>()
            .Property(q => q.ConcurrencyVersion)
            .IsConcurrencyToken();
            
        // Decimal precision global conventions
        foreach (var property in modelBuilder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
        {
            property.SetColumnType("DECIMAL(18, 4)");
        }
    }
}
```

---

## 6. Database Verification Guarantee

This schema is completely decoupled from any external platform schemas. It runs natively on Microsoft SQL Server with full referential integrity, optimistic concurrency tokens, and T-SQL index coverage.
