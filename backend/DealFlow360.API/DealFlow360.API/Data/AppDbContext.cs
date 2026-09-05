using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }


    // ─── Identity & Teams ──────────────────────────────────────
    public DbSet<User> Users => Set<User>();
    public DbSet<SalesTeam> SalesTeams => Set<SalesTeam>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    // ─── Customers ─────────────────────────────────────────────
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<CustomerTier> CustomerTiers => Set<CustomerTier>();

    // ─── Products & Pricing ────────────────────────────────────
    public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<PriceList> PriceLists => Set<PriceList>();
    public DbSet<PriceListItem> PriceListItems => Set<PriceListItem>();
    public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();

    // ─── Discount & Approval Configuration ─────────────────────
    public DbSet<DiscountRule> DiscountRules => Set<DiscountRule>();
    public DbSet<ApprovalRule> ApprovalRules => Set<ApprovalRule>();
    public DbSet<UpsellCrossSellRule> UpsellCrossSellRules => Set<UpsellCrossSellRule>();

    // ─── Warehouse & Inventory ─────────────────────────────────
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<InventoryStock> InventoryStocks => Set<InventoryStock>();
    public DbSet<ReplenishmentRule> ReplenishmentRules => Set<ReplenishmentRule>();

    // ─── Quotations ────────────────────────────────────────────
    public DbSet<Quotation> Quotations => Set<Quotation>();
    public DbSet<QuotationLine> QuotationLines => Set<QuotationLine>();
    public DbSet<QuotationLineComment> QuotationLineComments => Set<QuotationLineComment>();
    public DbSet<QuotationChange> QuotationChanges => Set<QuotationChange>();

    // ─── Approvals ─────────────────────────────────────────────
    public DbSet<ApprovalRequest> ApprovalRequests => Set<ApprovalRequest>();
    public DbSet<ApprovalAction> ApprovalActions => Set<ApprovalAction>();

    // ─── Orders & Fulfillment ──────────────────────────────────
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderLine> OrderLines => Set<OrderLine>();
    public DbSet<WarehouseAllocation> WarehouseAllocations => Set<WarehouseAllocation>();
    public DbSet<Backorder> Backorders => Set<Backorder>();

    // ─── Billing & Payments ────────────────────────────────────
    public DbSet<BillingSchedule> BillingSchedules => Set<BillingSchedule>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceLine> InvoiceLines => Set<InvoiceLine>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<CreditNote> CreditNotes => Set<CreditNote>();

    // ─── Health, Audit, Notifications ──────────────────────────
    public DbSet<DealHealthSnapshot> DealHealthSnapshots => Set<DealHealthSnapshot>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Notification> Notifications => Set<Notification>();


    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ═══════════════════════════════════════════════════════
        // USER
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();

            entity.Property(u => u.Role)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.HasOne(u => u.SalesTeam)
                .WithMany(st => st.Members)
                .HasForeignKey(u => u.SalesTeamId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(u => u.Customer)
                .WithMany()
                .HasForeignKey(u => u.CustomerId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // SALES TEAM
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<SalesTeam>(entity =>
        {
            entity.HasOne(st => st.Manager)
                .WithMany()
                .HasForeignKey(st => st.ManagerId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // CUSTOMER
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasOne(c => c.Tier)
                .WithMany(ct => ct.Customers)
                .HasForeignKey(c => c.TierId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(c => c.AssignedSalesRep)
                .WithMany()
                .HasForeignKey(c => c.AssignedSalesRepId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // PRODUCT
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasIndex(p => p.SKU).IsUnique();

            entity.Property(p => p.ProductType)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(p => p.Category)
                .WithMany(c => c.Products)
                .HasForeignKey(p => p.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // PRODUCT VARIANT
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<ProductVariant>(entity =>
        {
            entity.HasOne(pv => pv.Product)
                .WithMany(p => p.Variants)
                .HasForeignKey(pv => pv.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // ═══════════════════════════════════════════════════════
        // PRICE LIST
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<PriceList>(entity =>
        {
            entity.HasOne(pl => pl.Tier)
                .WithMany(ct => ct.PriceLists)
                .HasForeignKey(pl => pl.TierId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // PRICE LIST ITEM — unique (PriceList, Product)
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<PriceListItem>(entity =>
        {
            entity.HasIndex(pli => new { pli.PriceListId, pli.ProductId })
                .IsUnique();

            entity.HasOne(pli => pli.PriceList)
                .WithMany(pl => pl.Items)
                .HasForeignKey(pli => pli.PriceListId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(pli => pli.Product)
                .WithMany(p => p.PriceListItems)
                .HasForeignKey(pli => pli.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // ═══════════════════════════════════════════════════════
        // DISCOUNT RULE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<DiscountRule>(entity =>
        {
            entity.HasOne(dr => dr.Tier)
                .WithMany(ct => ct.DiscountRules)
                .HasForeignKey(dr => dr.TierId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(dr => dr.Category)
                .WithMany(c => c.DiscountRules)
                .HasForeignKey(dr => dr.CategoryId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // APPROVAL RULE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<ApprovalRule>(entity =>
        {
            entity.Property(ar => ar.Level)
                .HasConversion<string>()
                .HasMaxLength(20);
        });


        // ═══════════════════════════════════════════════════════
        // UPSELL / CROSS-SELL RULE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<UpsellCrossSellRule>(entity =>
        {
            entity.HasOne(r => r.TriggerProduct)
                .WithMany(p => p.TriggerRules)
                .HasForeignKey(r => r.TriggerProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.SuggestedProduct)
                .WithMany(p => p.SuggestedRules)
                .HasForeignKey(r => r.SuggestedProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // INVENTORY STOCK — unique (Warehouse, Product)
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<InventoryStock>(entity =>
        {
            entity.HasIndex(s => new { s.WarehouseId, s.ProductId })
                .IsUnique();

            entity.HasOne(s => s.Warehouse)
                .WithMany(w => w.Stocks)
                .HasForeignKey(s => s.WarehouseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.Product)
                .WithMany(p => p.InventoryStocks)
                .HasForeignKey(s => s.ProductId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Ignore(s => s.Available);
        });


        // ═══════════════════════════════════════════════════════
        // REPLENISHMENT RULE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<ReplenishmentRule>(entity =>
        {
            entity.HasOne(rr => rr.Warehouse)
                .WithMany()
                .HasForeignKey(rr => rr.WarehouseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(rr => rr.Product)
                .WithMany()
                .HasForeignKey(rr => rr.ProductId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // ═══════════════════════════════════════════════════════
        // QUOTATION
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Quotation>(entity =>
        {
            entity.HasIndex(q => q.QuotationNumber).IsUnique();

            entity.Property(q => q.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.Property(q => q.ApprovalStatus)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.HasOne(q => q.Customer)
                .WithMany(c => c.Quotations)
                .HasForeignKey(q => q.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(q => q.SalesRep)
                .WithMany()
                .HasForeignKey(q => q.SalesRepId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(q => q.PriceList)
                .WithMany()
                .HasForeignKey(q => q.PriceListId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // QUOTATION LINE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<QuotationLine>(entity =>
        {
            entity.HasOne(ql => ql.Quotation)
                .WithMany(q => q.Lines)
                .HasForeignKey(ql => ql.QuotationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ql => ql.Product)
                .WithMany(p => p.QuotationLines)
                .HasForeignKey(ql => ql.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ql => ql.Variant)
                .WithMany()
                .HasForeignKey(ql => ql.VariantId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(ql => ql.SubscriptionPlan)
                .WithMany()
                .HasForeignKey(ql => ql.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // QUOTATION LINE COMMENT
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<QuotationLineComment>(entity =>
        {
            entity.HasOne(c => c.QuotationLine)
                .WithMany(ql => ql.Comments)
                .HasForeignKey(c => c.QuotationLineId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // QUOTATION CHANGE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<QuotationChange>(entity =>
        {
            entity.HasOne(qc => qc.Quotation)
                .WithMany(q => q.Changes)
                .HasForeignKey(qc => qc.QuotationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(qc => qc.RequestedBy)
                .WithMany()
                .HasForeignKey(qc => qc.RequestedByUserId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // APPROVAL REQUEST
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<ApprovalRequest>(entity =>
        {
            entity.Property(ar => ar.Level)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.Property(ar => ar.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.HasOne(ar => ar.Quotation)
                .WithMany(q => q.ApprovalRequests)
                .HasForeignKey(ar => ar.QuotationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ar => ar.ActedBy)
                .WithMany()
                .HasForeignKey(ar => ar.ActedByUserId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // APPROVAL ACTION
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<ApprovalAction>(entity =>
        {
            entity.HasOne(aa => aa.ApprovalRequest)
                .WithMany(ar => ar.Actions)
                .HasForeignKey(aa => aa.ApprovalRequestId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(aa => aa.User)
                .WithMany()
                .HasForeignKey(aa => aa.UserId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // ORDER
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasIndex(o => o.OrderNumber).IsUnique();

            entity.Property(o => o.Status)
                .HasConversion<string>()
                .HasMaxLength(30);

            entity.HasOne(o => o.Quotation)
                .WithMany()
                .HasForeignKey(o => o.QuotationId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.Customer)
                .WithMany(c => c.Orders)
                .HasForeignKey(o => o.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // ORDER LINE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<OrderLine>(entity =>
        {
            entity.Property(ol => ol.ProductType)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(ol => ol.Order)
                .WithMany(o => o.Lines)
                .HasForeignKey(ol => ol.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(ol => ol.Product)
                .WithMany()
                .HasForeignKey(ol => ol.ProductId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(ol => ol.Variant)
                .WithMany()
                .HasForeignKey(ol => ol.VariantId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(ol => ol.SubscriptionPlan)
                .WithMany()
                .HasForeignKey(ol => ol.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // WAREHOUSE ALLOCATION
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<WarehouseAllocation>(entity =>
        {
            entity.HasOne(wa => wa.OrderLine)
                .WithMany(ol => ol.Allocations)
                .HasForeignKey(wa => wa.OrderLineId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(wa => wa.Warehouse)
                .WithMany(w => w.Allocations)
                .HasForeignKey(wa => wa.WarehouseId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // BACKORDER
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Backorder>(entity =>
        {
            entity.HasOne(b => b.Order)
                .WithMany(o => o.Backorders)
                .HasForeignKey(b => b.OrderId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(b => b.OrderLine)
                .WithMany()
                .HasForeignKey(b => b.OrderLineId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(b => b.Product)
                .WithMany()
                .HasForeignKey(b => b.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // BILLING SCHEDULE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<BillingSchedule>(entity =>
        {
            entity.Property(bs => bs.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(bs => bs.OrderLine)
                .WithMany(ol => ol.BillingSchedules)
                .HasForeignKey(bs => bs.OrderLineId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(bs => bs.SubscriptionPlan)
                .WithMany(sp => sp.BillingSchedules)
                .HasForeignKey(bs => bs.SubscriptionPlanId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // INVOICE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasIndex(i => i.InvoiceNumber).IsUnique();

            entity.Property(i => i.Status)
                .HasConversion<string>()
                .HasMaxLength(20);

            entity.HasOne(i => i.Order)
                .WithMany(o => o.Invoices)
                .HasForeignKey(i => i.OrderId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(i => i.Customer)
                .WithMany(c => c.Invoices)
                .HasForeignKey(i => i.CustomerId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // INVOICE LINE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<InvoiceLine>(entity =>
        {
            entity.HasOne(il => il.Invoice)
                .WithMany(i => i.Lines)
                .HasForeignKey(il => il.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(il => il.Product)
                .WithMany()
                .HasForeignKey(il => il.ProductId)
                .OnDelete(DeleteBehavior.Restrict);
        });


        // ═══════════════════════════════════════════════════════
        // PAYMENT
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasOne(p => p.Invoice)
                .WithMany(i => i.Payments)
                .HasForeignKey(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // ═══════════════════════════════════════════════════════
        // CREDIT NOTE
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<CreditNote>(entity =>
        {
            entity.HasOne(cn => cn.Invoice)
                .WithMany(i => i.CreditNotes)
                .HasForeignKey(cn => cn.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(cn => cn.OrderLine)
                .WithMany()
                .HasForeignKey(cn => cn.OrderLineId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // DEAL HEALTH SNAPSHOT
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<DealHealthSnapshot>(entity =>
        {
            entity.HasOne(dh => dh.Quotation)
                .WithMany(q => q.HealthSnapshots)
                .HasForeignKey(dh => dh.EntityId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // ═══════════════════════════════════════════════════════
        // AUDIT LOG
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasIndex(a => new { a.EntityName, a.EntityId });

            entity.HasOne(a => a.User)
                .WithMany(u => u.AuditLogs)
                .HasForeignKey(a => a.UserId)
                .OnDelete(DeleteBehavior.SetNull);
        });


        // ═══════════════════════════════════════════════════════
        // NOTIFICATION
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });


        // ═══════════════════════════════════════════════════════
        // REFRESH TOKEN
        // ═══════════════════════════════════════════════════════

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasOne(rt => rt.User)
                .WithMany(u => u.RefreshTokens)
                .HasForeignKey(rt => rt.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Ignore(rt => rt.IsRevoked);
            entity.Ignore(rt => rt.IsExpired);
        });
    }
}