IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
CREATE TABLE [ApprovalRules] (
    [Id] int NOT NULL IDENTITY,
    [Level] nvarchar(20) NOT NULL,
    [MinRisk] decimal(5,2) NOT NULL,
    [MaxRisk] decimal(5,2) NOT NULL,
    [RequiredRole] nvarchar(50) NOT NULL,
    [Sequence] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_ApprovalRules] PRIMARY KEY ([Id])
);

CREATE TABLE [CustomerTiers] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(50) NOT NULL,
    [MaxDiscountPercent] decimal(5,2) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_CustomerTiers] PRIMARY KEY ([Id])
);

CREATE TABLE [ProductCategories] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [Description] nvarchar(500) NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_ProductCategories] PRIMARY KEY ([Id])
);

CREATE TABLE [SubscriptionPlans] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [BillingFrequency] nvarchar(50) NOT NULL,
    [BillingIntervalMonths] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_SubscriptionPlans] PRIMARY KEY ([Id])
);

CREATE TABLE [Warehouses] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [ShippingCostWeight] decimal(5,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_Warehouses] PRIMARY KEY ([Id])
);

CREATE TABLE [PriceLists] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [CurrencyCode] nvarchar(10) NOT NULL,
    [TierId] int NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_PriceLists] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PriceLists_CustomerTiers_TierId] FOREIGN KEY ([TierId]) REFERENCES [CustomerTiers] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [DiscountRules] (
    [Id] int NOT NULL IDENTITY,
    [TierId] int NOT NULL,
    [CategoryId] int NULL,
    [MaxDiscountPercent] decimal(5,2) NOT NULL,
    [ManagerThreshold] decimal(5,2) NOT NULL,
    [FinanceThreshold] decimal(5,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_DiscountRules] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_DiscountRules_CustomerTiers_TierId] FOREIGN KEY ([TierId]) REFERENCES [CustomerTiers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_DiscountRules_ProductCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [ProductCategories] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Products] (
    [Id] int NOT NULL IDENTITY,
    [SKU] nvarchar(50) NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [CategoryId] int NOT NULL,
    [ProductType] nvarchar(20) NOT NULL,
    [BasePrice] decimal(18,2) NOT NULL,
    [CostPrice] decimal(18,2) NOT NULL,
    [TaxRate] decimal(5,2) NOT NULL,
    [Unit] nvarchar(20) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_Products] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Products_ProductCategories_CategoryId] FOREIGN KEY ([CategoryId]) REFERENCES [ProductCategories] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [InventoryStocks] (
    [Id] int NOT NULL IDENTITY,
    [WarehouseId] int NOT NULL,
    [ProductId] int NOT NULL,
    [OnHand] int NOT NULL,
    [Reserved] int NOT NULL,
    [RowVersion] rowversion NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_InventoryStocks] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InventoryStocks_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_InventoryStocks_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [PriceListItems] (
    [Id] int NOT NULL IDENTITY,
    [PriceListId] int NOT NULL,
    [ProductId] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_PriceListItems] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_PriceListItems_PriceLists_PriceListId] FOREIGN KEY ([PriceListId]) REFERENCES [PriceLists] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_PriceListItems_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [ProductVariants] (
    [Id] int NOT NULL IDENTITY,
    [ProductId] int NOT NULL,
    [Name] nvarchar(200) NOT NULL,
    [AdditionalPrice] decimal(18,2) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_ProductVariants] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ProductVariants_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [ReplenishmentRules] (
    [Id] int NOT NULL IDENTITY,
    [WarehouseId] int NOT NULL,
    [ProductId] int NOT NULL,
    [ReorderLevel] int NOT NULL,
    [ReorderQuantity] int NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_ReplenishmentRules] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_ReplenishmentRules_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_ReplenishmentRules_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [UpsellCrossSellRules] (
    [Id] int NOT NULL IDENTITY,
    [TriggerProductId] int NOT NULL,
    [SuggestedProductId] int NOT NULL,
    [RuleType] nvarchar(50) NOT NULL,
    [Score] int NOT NULL,
    [IsPromoted] bit NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_UpsellCrossSellRules] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_UpsellCrossSellRules_Products_SuggestedProductId] FOREIGN KEY ([SuggestedProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_UpsellCrossSellRules_Products_TriggerProductId] FOREIGN KEY ([TriggerProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [ApprovalActions] (
    [Id] int NOT NULL IDENTITY,
    [ApprovalRequestId] int NOT NULL,
    [UserId] int NOT NULL,
    [Action] nvarchar(50) NOT NULL,
    [Reason] nvarchar(1000) NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_ApprovalActions] PRIMARY KEY ([Id])
);

CREATE TABLE [ApprovalRequests] (
    [Id] int NOT NULL IDENTITY,
    [QuotationId] int NOT NULL,
    [Level] nvarchar(20) NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [Sequence] int NOT NULL,
    [RequestedAtUtc] datetime2 NOT NULL,
    [ActedAtUtc] datetime2 NULL,
    [ActedByUserId] int NULL,
    [Reason] nvarchar(1000) NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_ApprovalRequests] PRIMARY KEY ([Id])
);

CREATE TABLE [AuditLogs] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NULL,
    [EntityName] nvarchar(100) NOT NULL,
    [EntityId] int NOT NULL,
    [Action] nvarchar(100) NOT NULL,
    [OldValueJson] nvarchar(max) NULL,
    [NewValueJson] nvarchar(max) NULL,
    [Reason] nvarchar(1000) NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_AuditLogs] PRIMARY KEY ([Id])
);

CREATE TABLE [Backorders] (
    [Id] int NOT NULL IDENTITY,
    [OrderId] int NOT NULL,
    [OrderLineId] int NOT NULL,
    [ProductId] int NOT NULL,
    [Quantity] int NOT NULL,
    [Status] nvarchar(50) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_Backorders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Backorders_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [BillingSchedules] (
    [Id] int NOT NULL IDENTITY,
    [OrderLineId] int NOT NULL,
    [SubscriptionPlanId] int NOT NULL,
    [StartDate] datetime2 NOT NULL,
    [EndDate] datetime2 NULL,
    [NextBillingDate] datetime2 NOT NULL,
    [Quantity] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_BillingSchedules] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_BillingSchedules_SubscriptionPlans_SubscriptionPlanId] FOREIGN KEY ([SubscriptionPlanId]) REFERENCES [SubscriptionPlans] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [CreditNotes] (
    [Id] int NOT NULL IDENTITY,
    [InvoiceId] int NOT NULL,
    [OrderLineId] int NULL,
    [Amount] decimal(18,2) NOT NULL,
    [Reason] nvarchar(500) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_CreditNotes] PRIMARY KEY ([Id])
);

CREATE TABLE [Customers] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(200) NOT NULL,
    [Email] nvarchar(150) NULL,
    [Phone] nvarchar(20) NULL,
    [TierId] int NOT NULL,
    [CurrencyCode] nvarchar(10) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    [AssignedSalesRepId] int NULL,
    CONSTRAINT [PK_Customers] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Customers_CustomerTiers_TierId] FOREIGN KEY ([TierId]) REFERENCES [CustomerTiers] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [DealHealthSnapshots] (
    [Id] int NOT NULL IDENTITY,
    [EntityType] nvarchar(50) NOT NULL,
    [EntityId] int NOT NULL,
    [HealthScore] int NOT NULL,
    [SignalsJson] nvarchar(max) NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_DealHealthSnapshots] PRIMARY KEY ([Id])
);

CREATE TABLE [InvoiceLines] (
    [Id] int NOT NULL IDENTITY,
    [InvoiceId] int NOT NULL,
    [ProductId] int NOT NULL,
    [Description] nvarchar(500) NULL,
    [Quantity] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [DiscountPercent] decimal(5,2) NOT NULL,
    [NetAmount] decimal(18,2) NOT NULL,
    [TaxAmount] decimal(18,2) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_InvoiceLines] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_InvoiceLines_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Invoices] (
    [Id] int NOT NULL IDENTITY,
    [InvoiceNumber] nvarchar(50) NOT NULL,
    [OrderId] int NOT NULL,
    [CustomerId] int NOT NULL,
    [Type] nvarchar(20) NOT NULL,
    [Status] nvarchar(20) NOT NULL,
    [SubTotal] decimal(18,2) NOT NULL,
    [TaxTotal] decimal(18,2) NOT NULL,
    [Total] decimal(18,2) NOT NULL,
    [PaidAmount] decimal(18,2) NOT NULL,
    [DueDate] datetime2 NOT NULL,
    [RowVersion] rowversion NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_Invoices] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Invoices_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Payments] (
    [Id] int NOT NULL IDENTITY,
    [InvoiceId] int NOT NULL,
    [Amount] decimal(18,2) NOT NULL,
    [PaidAtUtc] datetime2 NOT NULL,
    [PaymentMethod] nvarchar(50) NULL,
    [Reference] nvarchar(200) NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_Payments] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Payments_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE
);

CREATE TABLE [Notifications] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [Title] nvarchar(200) NOT NULL,
    [Message] nvarchar(1000) NOT NULL,
    [Type] nvarchar(50) NULL,
    [IsRead] bit NOT NULL,
    [RelatedEntityType] nvarchar(50) NULL,
    [RelatedEntityId] int NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_Notifications] PRIMARY KEY ([Id])
);

CREATE TABLE [OrderLines] (
    [Id] int NOT NULL IDENTITY,
    [OrderId] int NOT NULL,
    [ProductId] int NOT NULL,
    [VariantId] int NULL,
    [Quantity] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [DiscountPercent] decimal(5,2) NOT NULL,
    [NetAmount] decimal(18,2) NOT NULL,
    [TaxAmount] decimal(18,2) NOT NULL,
    [ProductType] nvarchar(20) NOT NULL,
    [SubscriptionPlanId] int NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_OrderLines] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_OrderLines_ProductVariants_VariantId] FOREIGN KEY ([VariantId]) REFERENCES [ProductVariants] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_OrderLines_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_OrderLines_SubscriptionPlans_SubscriptionPlanId] FOREIGN KEY ([SubscriptionPlanId]) REFERENCES [SubscriptionPlans] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [WarehouseAllocations] (
    [Id] int NOT NULL IDENTITY,
    [OrderLineId] int NOT NULL,
    [WarehouseId] int NOT NULL,
    [Quantity] int NOT NULL,
    [ShipmentCost] decimal(18,2) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_WarehouseAllocations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_WarehouseAllocations_OrderLines_OrderLineId] FOREIGN KEY ([OrderLineId]) REFERENCES [OrderLines] ([Id]) ON DELETE CASCADE,
    CONSTRAINT [FK_WarehouseAllocations_Warehouses_WarehouseId] FOREIGN KEY ([WarehouseId]) REFERENCES [Warehouses] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [Orders] (
    [Id] int NOT NULL IDENTITY,
    [OrderNumber] nvarchar(50) NOT NULL,
    [QuotationId] int NOT NULL,
    [CustomerId] int NOT NULL,
    [Status] nvarchar(30) NOT NULL,
    [Total] decimal(18,2) NOT NULL,
    [RowVersion] rowversion NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_Orders] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Orders_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE NO ACTION
);

CREATE TABLE [QuotationChanges] (
    [Id] int NOT NULL IDENTITY,
    [QuotationId] int NOT NULL,
    [ChangeType] nvarchar(50) NOT NULL,
    [Description] nvarchar(1000) NULL,
    [RequestedByUserId] int NOT NULL,
    [OldValueJson] nvarchar(max) NULL,
    [NewValueJson] nvarchar(max) NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_QuotationChanges] PRIMARY KEY ([Id])
);

CREATE TABLE [QuotationLineComments] (
    [Id] int NOT NULL IDENTITY,
    [QuotationLineId] int NOT NULL,
    [UserId] int NOT NULL,
    [Comment] nvarchar(1000) NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    CONSTRAINT [PK_QuotationLineComments] PRIMARY KEY ([Id])
);

CREATE TABLE [QuotationLines] (
    [Id] int NOT NULL IDENTITY,
    [QuotationId] int NOT NULL,
    [ProductId] int NOT NULL,
    [VariantId] int NULL,
    [Quantity] int NOT NULL,
    [UnitPrice] decimal(18,2) NOT NULL,
    [DiscountPercent] decimal(5,2) NOT NULL,
    [NetAmount] decimal(18,2) NOT NULL,
    [TaxAmount] decimal(18,2) NOT NULL,
    [CostPrice] decimal(18,2) NOT NULL,
    [MarginAmount] decimal(18,2) NOT NULL,
    [SubscriptionPlanId] int NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_QuotationLines] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_QuotationLines_ProductVariants_VariantId] FOREIGN KEY ([VariantId]) REFERENCES [ProductVariants] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_QuotationLines_Products_ProductId] FOREIGN KEY ([ProductId]) REFERENCES [Products] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_QuotationLines_SubscriptionPlans_SubscriptionPlanId] FOREIGN KEY ([SubscriptionPlanId]) REFERENCES [SubscriptionPlans] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [Quotations] (
    [Id] int NOT NULL IDENTITY,
    [QuotationNumber] nvarchar(50) NOT NULL,
    [CustomerId] int NOT NULL,
    [SalesRepId] int NOT NULL,
    [PriceListId] int NULL,
    [Status] nvarchar(30) NOT NULL,
    [ApprovalStatus] nvarchar(30) NOT NULL,
    [SubTotal] decimal(18,2) NOT NULL,
    [DiscountTotal] decimal(18,2) NOT NULL,
    [TaxTotal] decimal(18,2) NOT NULL,
    [GrandTotal] decimal(18,2) NOT NULL,
    [CostTotal] decimal(18,2) NOT NULL,
    [MarginAmount] decimal(18,2) NOT NULL,
    [MarginPercent] decimal(5,2) NOT NULL,
    [RiskScore] decimal(5,2) NOT NULL,
    [CurrencyCode] nvarchar(10) NOT NULL,
    [ExpectedCloseDate] datetime2 NULL,
    [Notes] nvarchar(1000) NULL,
    [IsPortalVisible] bit NOT NULL,
    [RowVersion] rowversion NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_Quotations] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Quotations_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE NO ACTION,
    CONSTRAINT [FK_Quotations_PriceLists_PriceListId] FOREIGN KEY ([PriceListId]) REFERENCES [PriceLists] ([Id]) ON DELETE SET NULL
);

CREATE TABLE [RefreshTokens] (
    [Id] int NOT NULL IDENTITY,
    [UserId] int NOT NULL,
    [Token] nvarchar(500) NOT NULL,
    [ExpiresAtUtc] datetime2 NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [RevokedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id])
);

CREATE TABLE [SalesTeams] (
    [Id] int NOT NULL IDENTITY,
    [Name] nvarchar(100) NOT NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    [ManagerId] int NULL,
    CONSTRAINT [PK_SalesTeams] PRIMARY KEY ([Id])
);

CREATE TABLE [Users] (
    [Id] int NOT NULL IDENTITY,
    [FullName] nvarchar(100) NOT NULL,
    [Email] nvarchar(150) NOT NULL,
    [PasswordHash] nvarchar(max) NOT NULL,
    [Role] nvarchar(30) NOT NULL,
    [SalesTeamId] int NULL,
    [CustomerId] int NULL,
    [IsActive] bit NOT NULL,
    [CreatedAtUtc] datetime2 NOT NULL,
    [UpdatedAtUtc] datetime2 NULL,
    CONSTRAINT [PK_Users] PRIMARY KEY ([Id]),
    CONSTRAINT [FK_Users_Customers_CustomerId] FOREIGN KEY ([CustomerId]) REFERENCES [Customers] ([Id]) ON DELETE SET NULL,
    CONSTRAINT [FK_Users_SalesTeams_SalesTeamId] FOREIGN KEY ([SalesTeamId]) REFERENCES [SalesTeams] ([Id]) ON DELETE SET NULL
);

CREATE INDEX [IX_ApprovalActions_ApprovalRequestId] ON [ApprovalActions] ([ApprovalRequestId]);

CREATE INDEX [IX_ApprovalActions_UserId] ON [ApprovalActions] ([UserId]);

CREATE INDEX [IX_ApprovalRequests_ActedByUserId] ON [ApprovalRequests] ([ActedByUserId]);

CREATE INDEX [IX_ApprovalRequests_QuotationId] ON [ApprovalRequests] ([QuotationId]);

CREATE INDEX [IX_AuditLogs_EntityName_EntityId] ON [AuditLogs] ([EntityName], [EntityId]);

CREATE INDEX [IX_AuditLogs_UserId] ON [AuditLogs] ([UserId]);

CREATE INDEX [IX_Backorders_OrderId] ON [Backorders] ([OrderId]);

CREATE INDEX [IX_Backorders_OrderLineId] ON [Backorders] ([OrderLineId]);

CREATE INDEX [IX_Backorders_ProductId] ON [Backorders] ([ProductId]);

CREATE INDEX [IX_BillingSchedules_OrderLineId] ON [BillingSchedules] ([OrderLineId]);

CREATE INDEX [IX_BillingSchedules_SubscriptionPlanId] ON [BillingSchedules] ([SubscriptionPlanId]);

CREATE INDEX [IX_CreditNotes_InvoiceId] ON [CreditNotes] ([InvoiceId]);

CREATE INDEX [IX_CreditNotes_OrderLineId] ON [CreditNotes] ([OrderLineId]);

CREATE INDEX [IX_Customers_AssignedSalesRepId] ON [Customers] ([AssignedSalesRepId]);

CREATE INDEX [IX_Customers_TierId] ON [Customers] ([TierId]);

CREATE INDEX [IX_DealHealthSnapshots_EntityId] ON [DealHealthSnapshots] ([EntityId]);

CREATE INDEX [IX_DiscountRules_CategoryId] ON [DiscountRules] ([CategoryId]);

CREATE INDEX [IX_DiscountRules_TierId] ON [DiscountRules] ([TierId]);

CREATE INDEX [IX_InventoryStocks_ProductId] ON [InventoryStocks] ([ProductId]);

CREATE UNIQUE INDEX [IX_InventoryStocks_WarehouseId_ProductId] ON [InventoryStocks] ([WarehouseId], [ProductId]);

CREATE INDEX [IX_InvoiceLines_InvoiceId] ON [InvoiceLines] ([InvoiceId]);

CREATE INDEX [IX_InvoiceLines_ProductId] ON [InvoiceLines] ([ProductId]);

CREATE INDEX [IX_Invoices_CustomerId] ON [Invoices] ([CustomerId]);

CREATE UNIQUE INDEX [IX_Invoices_InvoiceNumber] ON [Invoices] ([InvoiceNumber]);

CREATE INDEX [IX_Invoices_OrderId] ON [Invoices] ([OrderId]);

CREATE INDEX [IX_Notifications_UserId] ON [Notifications] ([UserId]);

CREATE INDEX [IX_OrderLines_OrderId] ON [OrderLines] ([OrderId]);

CREATE INDEX [IX_OrderLines_ProductId] ON [OrderLines] ([ProductId]);

CREATE INDEX [IX_OrderLines_SubscriptionPlanId] ON [OrderLines] ([SubscriptionPlanId]);

CREATE INDEX [IX_OrderLines_VariantId] ON [OrderLines] ([VariantId]);

CREATE INDEX [IX_Orders_CustomerId] ON [Orders] ([CustomerId]);

CREATE UNIQUE INDEX [IX_Orders_OrderNumber] ON [Orders] ([OrderNumber]);

CREATE INDEX [IX_Orders_QuotationId] ON [Orders] ([QuotationId]);

CREATE INDEX [IX_Payments_InvoiceId] ON [Payments] ([InvoiceId]);

CREATE UNIQUE INDEX [IX_PriceListItems_PriceListId_ProductId] ON [PriceListItems] ([PriceListId], [ProductId]);

CREATE INDEX [IX_PriceListItems_ProductId] ON [PriceListItems] ([ProductId]);

CREATE INDEX [IX_PriceLists_TierId] ON [PriceLists] ([TierId]);

CREATE INDEX [IX_Products_CategoryId] ON [Products] ([CategoryId]);

CREATE UNIQUE INDEX [IX_Products_SKU] ON [Products] ([SKU]);

CREATE INDEX [IX_ProductVariants_ProductId] ON [ProductVariants] ([ProductId]);

CREATE INDEX [IX_QuotationChanges_QuotationId] ON [QuotationChanges] ([QuotationId]);

CREATE INDEX [IX_QuotationChanges_RequestedByUserId] ON [QuotationChanges] ([RequestedByUserId]);

CREATE INDEX [IX_QuotationLineComments_QuotationLineId] ON [QuotationLineComments] ([QuotationLineId]);

CREATE INDEX [IX_QuotationLineComments_UserId] ON [QuotationLineComments] ([UserId]);

CREATE INDEX [IX_QuotationLines_ProductId] ON [QuotationLines] ([ProductId]);

CREATE INDEX [IX_QuotationLines_QuotationId] ON [QuotationLines] ([QuotationId]);

CREATE INDEX [IX_QuotationLines_SubscriptionPlanId] ON [QuotationLines] ([SubscriptionPlanId]);

CREATE INDEX [IX_QuotationLines_VariantId] ON [QuotationLines] ([VariantId]);

CREATE INDEX [IX_Quotations_CustomerId] ON [Quotations] ([CustomerId]);

CREATE INDEX [IX_Quotations_PriceListId] ON [Quotations] ([PriceListId]);

CREATE UNIQUE INDEX [IX_Quotations_QuotationNumber] ON [Quotations] ([QuotationNumber]);

CREATE INDEX [IX_Quotations_SalesRepId] ON [Quotations] ([SalesRepId]);

CREATE INDEX [IX_RefreshTokens_UserId] ON [RefreshTokens] ([UserId]);

CREATE INDEX [IX_ReplenishmentRules_ProductId] ON [ReplenishmentRules] ([ProductId]);

CREATE INDEX [IX_ReplenishmentRules_WarehouseId] ON [ReplenishmentRules] ([WarehouseId]);

CREATE INDEX [IX_SalesTeams_ManagerId] ON [SalesTeams] ([ManagerId]);

CREATE INDEX [IX_UpsellCrossSellRules_SuggestedProductId] ON [UpsellCrossSellRules] ([SuggestedProductId]);

CREATE INDEX [IX_UpsellCrossSellRules_TriggerProductId] ON [UpsellCrossSellRules] ([TriggerProductId]);

CREATE INDEX [IX_Users_CustomerId] ON [Users] ([CustomerId]);

CREATE UNIQUE INDEX [IX_Users_Email] ON [Users] ([Email]);

CREATE INDEX [IX_Users_SalesTeamId] ON [Users] ([SalesTeamId]);

CREATE INDEX [IX_WarehouseAllocations_OrderLineId] ON [WarehouseAllocations] ([OrderLineId]);

CREATE INDEX [IX_WarehouseAllocations_WarehouseId] ON [WarehouseAllocations] ([WarehouseId]);

ALTER TABLE [ApprovalActions] ADD CONSTRAINT [FK_ApprovalActions_ApprovalRequests_ApprovalRequestId] FOREIGN KEY ([ApprovalRequestId]) REFERENCES [ApprovalRequests] ([Id]) ON DELETE CASCADE;

ALTER TABLE [ApprovalActions] ADD CONSTRAINT [FK_ApprovalActions_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [ApprovalRequests] ADD CONSTRAINT [FK_ApprovalRequests_Quotations_QuotationId] FOREIGN KEY ([QuotationId]) REFERENCES [Quotations] ([Id]) ON DELETE CASCADE;

ALTER TABLE [ApprovalRequests] ADD CONSTRAINT [FK_ApprovalRequests_Users_ActedByUserId] FOREIGN KEY ([ActedByUserId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL;

ALTER TABLE [AuditLogs] ADD CONSTRAINT [FK_AuditLogs_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL;

ALTER TABLE [Backorders] ADD CONSTRAINT [FK_Backorders_OrderLines_OrderLineId] FOREIGN KEY ([OrderLineId]) REFERENCES [OrderLines] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [Backorders] ADD CONSTRAINT [FK_Backorders_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE;

ALTER TABLE [BillingSchedules] ADD CONSTRAINT [FK_BillingSchedules_OrderLines_OrderLineId] FOREIGN KEY ([OrderLineId]) REFERENCES [OrderLines] ([Id]) ON DELETE CASCADE;

ALTER TABLE [CreditNotes] ADD CONSTRAINT [FK_CreditNotes_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE;

ALTER TABLE [CreditNotes] ADD CONSTRAINT [FK_CreditNotes_OrderLines_OrderLineId] FOREIGN KEY ([OrderLineId]) REFERENCES [OrderLines] ([Id]) ON DELETE SET NULL;

ALTER TABLE [Customers] ADD CONSTRAINT [FK_Customers_Users_AssignedSalesRepId] FOREIGN KEY ([AssignedSalesRepId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL;

ALTER TABLE [DealHealthSnapshots] ADD CONSTRAINT [FK_DealHealthSnapshots_Quotations_EntityId] FOREIGN KEY ([EntityId]) REFERENCES [Quotations] ([Id]) ON DELETE CASCADE;

ALTER TABLE [InvoiceLines] ADD CONSTRAINT [FK_InvoiceLines_Invoices_InvoiceId] FOREIGN KEY ([InvoiceId]) REFERENCES [Invoices] ([Id]) ON DELETE CASCADE;

ALTER TABLE [Invoices] ADD CONSTRAINT [FK_Invoices_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [Notifications] ADD CONSTRAINT [FK_Notifications_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;

ALTER TABLE [OrderLines] ADD CONSTRAINT [FK_OrderLines_Orders_OrderId] FOREIGN KEY ([OrderId]) REFERENCES [Orders] ([Id]) ON DELETE CASCADE;

ALTER TABLE [Orders] ADD CONSTRAINT [FK_Orders_Quotations_QuotationId] FOREIGN KEY ([QuotationId]) REFERENCES [Quotations] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [QuotationChanges] ADD CONSTRAINT [FK_QuotationChanges_Quotations_QuotationId] FOREIGN KEY ([QuotationId]) REFERENCES [Quotations] ([Id]) ON DELETE CASCADE;

ALTER TABLE [QuotationChanges] ADD CONSTRAINT [FK_QuotationChanges_Users_RequestedByUserId] FOREIGN KEY ([RequestedByUserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [QuotationLineComments] ADD CONSTRAINT [FK_QuotationLineComments_QuotationLines_QuotationLineId] FOREIGN KEY ([QuotationLineId]) REFERENCES [QuotationLines] ([Id]) ON DELETE CASCADE;

ALTER TABLE [QuotationLineComments] ADD CONSTRAINT [FK_QuotationLineComments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [QuotationLines] ADD CONSTRAINT [FK_QuotationLines_Quotations_QuotationId] FOREIGN KEY ([QuotationId]) REFERENCES [Quotations] ([Id]) ON DELETE CASCADE;

ALTER TABLE [Quotations] ADD CONSTRAINT [FK_Quotations_Users_SalesRepId] FOREIGN KEY ([SalesRepId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION;

ALTER TABLE [RefreshTokens] ADD CONSTRAINT [FK_RefreshTokens_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE CASCADE;

ALTER TABLE [SalesTeams] ADD CONSTRAINT [FK_SalesTeams_Users_ManagerId] FOREIGN KEY ([ManagerId]) REFERENCES [Users] ([Id]) ON DELETE SET NULL;

INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
VALUES (N'20260905093042_InitialCreate', N'10.0.11');

COMMIT;
GO

-- =========================================================
-- SEED INITIAL DATA (DEALFLOW360 STARTER SEED)
-- =========================================================

IF NOT EXISTS (SELECT * FROM [CustomerTiers])
BEGIN
    INSERT INTO [CustomerTiers] ([Name], [MaxDiscountPercent], [CreatedAtUtc]) VALUES (N'Gold', 15.00, GETUTCDATE());
    INSERT INTO [CustomerTiers] ([Name], [MaxDiscountPercent], [CreatedAtUtc]) VALUES (N'Silver', 10.00, GETUTCDATE());
    INSERT INTO [CustomerTiers] ([Name], [MaxDiscountPercent], [CreatedAtUtc]) VALUES (N'Bronze', 5.00, GETUTCDATE());
END;
GO

IF NOT EXISTS (SELECT * FROM [Customers])
BEGIN
    INSERT INTO [Customers] ([Name], [Email], [Phone], [TierId], [CurrencyCode], [IsActive], [CreatedAtUtc])
    VALUES (N'Acme Global Solutions', N'contact@acmeglobal.com', N'+1-555-0199', 1, N'USD', 1, GETUTCDATE());
END;
GO

IF NOT EXISTS (SELECT * FROM [SalesTeams])
BEGIN
    INSERT INTO [SalesTeams] ([Name], [IsActive], [CreatedAtUtc]) VALUES (N'Enterprise Sales USA', 1, GETUTCDATE());
END;
GO

IF NOT EXISTS (SELECT * FROM [Users])
BEGIN
    INSERT INTO [Users] ([FullName], [Email], [PasswordHash], [Role], [SalesTeamId], [CustomerId], [IsActive], [CreatedAtUtc])
    VALUES 
    (N'System Administrator', N'admin@dealflow360.io', N'$2a$11$q9hK/w3WfWpD/lXGvK5K.eZf5L3a8z7K0v1m2n3o4p5q6r7s8t9u', N'Admin', NULL, NULL, 1, GETUTCDATE()),
    (N'Sarah Jenkins (Sales Rep)', N'rep@dealflow360.io', N'$2a$11$q9hK/w3WfWpD/lXGvK5K.eZf5L3a8z7K0v1m2n3o4p5q6r7s8t9u', N'SalesRep', 1, NULL, 1, GETUTCDATE()),
    (N'Michael Vance (Sales Manager)', N'manager@dealflow360.io', N'$2a$11$q9hK/w3WfWpD/lXGvK5K.eZf5L3a8z7K0v1m2n3o4p5q6r7s8t9u', N'SalesManager', 1, NULL, 1, GETUTCDATE()),
    (N'David Kim (Finance Operations)', N'finance@dealflow360.io', N'$2a$11$q9hK/w3WfWpD/lXGvK5K.eZf5L3a8z7K0v1m2n3o4p5q6r7s8t9u', N'FinanceOperations', NULL, NULL, 1, GETUTCDATE()),
    (N'Alice Smith (Customer User)', N'customer@dealflow360.io', N'$2a$11$q9hK/w3WfWpD/lXGvK5K.eZf5L3a8z7K0v1m2n3o4p5q6r7s8t9u', N'Customer', NULL, 1, 1, GETUTCDATE());
END;
GO

IF NOT EXISTS (SELECT * FROM [ProductCategories])
BEGIN
    INSERT INTO [ProductCategories] ([Name], [Description], [IsActive], [CreatedAtUtc]) VALUES (N'Hardware', N'Enterprise Servers & Racks', 1, GETUTCDATE());
END;
GO

IF NOT EXISTS (SELECT * FROM [Products])
BEGIN
    INSERT INTO [Products] ([SKU], [Name], [CategoryId], [ProductType], [BasePrice], [CostPrice], [TaxRate], [Unit], [IsActive], [CreatedAtUtc])
    VALUES 
    (N'SRV-X100', N'Dell PowerEdge R750 Rack Server', 1, N'OneTime', 3500.00, 2000.00, 18.00, N'Unit', 1, GETUTCDATE()),
    (N'SUB-CLOUD-SEC', N'Cloud Security Enterprise Subscription', 1, N'Subscription', 150.00, 40.00, 18.00, N'Seat/Month', 1, GETUTCDATE());
END;
GO

IF NOT EXISTS (SELECT * FROM [Warehouses])
BEGIN
    INSERT INTO [Warehouses] ([Name], [ShippingCostWeight], [IsActive], [CreatedAtUtc]) VALUES (N'Central Depot (Chicago)', 1.25, 1, GETUTCDATE());
END;
GO

IF NOT EXISTS (SELECT * FROM [InventoryStocks])
BEGIN
    INSERT INTO [InventoryStocks] ([WarehouseId], [ProductId], [OnHand], [Reserved], [RowVersion], [UpdatedAtUtc])
    VALUES 
    (1, 1, 100, 0, 0x0000000000000001, GETUTCDATE()),
    (1, 2, 100, 0, 0x0000000000000001, GETUTCDATE());
END;
GO


