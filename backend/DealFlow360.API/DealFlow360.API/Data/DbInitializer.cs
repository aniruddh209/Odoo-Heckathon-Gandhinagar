using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // 1. Ensure Database is created & migrations applied
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // 2. Customer Tiers
        if (!await context.CustomerTiers.AnyAsync())
        {
            var tiers = new List<CustomerTier>
            {
                new() { Name = "Gold", MaxDiscountPercent = 15.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { Name = "Silver", MaxDiscountPercent = 10.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { Name = "Bronze", MaxDiscountPercent = 5.00m, CreatedAtUtc = DateTime.UtcNow }
            };
            context.CustomerTiers.AddRange(tiers);
            await context.SaveChangesAsync();
        }

        var goldTier = await context.CustomerTiers.FirstAsync(t => t.Name == "Gold");

        // 3. Customer
        if (!await context.Customers.AnyAsync())
        {
            var customer = new Customer
            {
                Name = "Acme Global Solutions",
                Email = "contact@acmeglobal.com",
                Phone = "+1-555-0199",
                TierId = goldTier.Id,
                CurrencyCode = "USD",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            context.Customers.Add(customer);
            await context.SaveChangesAsync();
        }

        var demoCustomer = await context.Customers.FirstAsync(c => c.Name == "Acme Global Solutions");

        // 4. Sales Team
        if (!await context.SalesTeams.AnyAsync())
        {
            var team = new SalesTeam { Name = "Enterprise Sales USA", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
            context.SalesTeams.Add(team);
            await context.SaveChangesAsync();
        }

        var salesTeam = await context.SalesTeams.FirstAsync(t => t.Name == "Enterprise Sales USA");

        // 5. Users (All 5 Roles with BCrypt hashed passwords)
        var existingUsers = await context.Users.ToListAsync();
        if (!existingUsers.Any())
        {
            var users = new List<User>
            {
                new()
                {
                    FullName = "System Administrator",
                    Email = "admin@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = Role.Admin,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    FullName = "Sarah Jenkins (Sales Rep)",
                    Email = "rep@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Rep@123"),
                    Role = Role.SalesRep,
                    SalesTeamId = salesTeam.Id,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    FullName = "Michael Vance (Sales Manager)",
                    Email = "manager@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
                    Role = Role.SalesManager,
                    SalesTeamId = salesTeam.Id,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    FullName = "David Kim (Finance Operations)",
                    Email = "finance@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Finance@123"),
                    Role = Role.FinanceOperations,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    FullName = "Alice Smith (Customer User)",
                    Email = "customer@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                    Role = Role.Customer,
                    CustomerId = demoCustomer.Id,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };

            context.Users.AddRange(users);
            await context.SaveChangesAsync();

            var manager = users.FirstOrDefault(u => u.Role == Role.SalesManager);
            var rep = users.FirstOrDefault(u => u.Role == Role.SalesRep);
            if (manager != null)
            {
                salesTeam.ManagerId = manager.Id;
            }
            if (rep != null)
            {
                demoCustomer.AssignedSalesRepId = rep.Id;
            }
            await context.SaveChangesAsync();
        }
        else
        {
            foreach (var u in existingUsers)
            {
                if (u.Email == "admin@dealflow360.io") u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123");
                if (u.Email == "rep@dealflow360.io") { u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Rep@123"); u.SalesTeamId = salesTeam.Id; demoCustomer.AssignedSalesRepId = u.Id; }
                if (u.Email == "manager@dealflow360.io") { u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"); u.SalesTeamId = salesTeam.Id; salesTeam.ManagerId = u.Id; }
                if (u.Email == "finance@dealflow360.io") u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Finance@123");
                if (u.Email == "customer@dealflow360.io") { u.PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"); u.CustomerId = demoCustomer.Id; }
            }
            await context.SaveChangesAsync();
        }

        // 6. Product Categories
        if (!await context.ProductCategories.AnyAsync(c => c.Name == "Hardware"))
        {
            context.ProductCategories.Add(new ProductCategory
            {
                Name = "Hardware",
                Description = "Enterprise servers, laptops, workstations and peripherals",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        if (!await context.ProductCategories.AnyAsync(c => c.Name == "Services"))
        {
            context.ProductCategories.Add(new ProductCategory
            {
                Name = "Services",
                Description = "Professional onboarding, architecture design and setup services",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        if (!await context.ProductCategories.AnyAsync(c => c.Name == "Subscriptions"))
        {
            context.ProductCategories.Add(new ProductCategory
            {
                Name = "Subscriptions",
                Description = "Recurring software licenses and premium SLAs",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        var hwCat = await context.ProductCategories.FirstAsync(c => c.Name == "Hardware");
        var srvCat = await context.ProductCategories.FirstAsync(c => c.Name == "Services");
        var subCat = await context.ProductCategories.FirstAsync(c => c.Name == "Subscriptions");

        // 7. Products
        var demoProducts = new List<Product>();

        if (!await context.Products.AnyAsync(p => p.SKU == "HW-LAPTOP-01"))
        {
            demoProducts.Add(new Product
            {
                SKU = "HW-LAPTOP-01",
                Name = "Enterprise Laptop Pro 16\"",
                CategoryId = hwCat.Id,
                ProductType = ProductType.OneTime,
                BasePrice = 1500.00m,
                CostPrice = 900.00m,
                TaxRate = 18.00m,
                Unit = "Each",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        if (!await context.Products.AnyAsync(p => p.SKU == "HW-DOCK-01"))
        {
            demoProducts.Add(new Product
            {
                SKU = "HW-DOCK-01",
                Name = "Thunderbolt 4 Universal Dock",
                CategoryId = hwCat.Id,
                ProductType = ProductType.OneTime,
                BasePrice = 250.00m,
                CostPrice = 120.00m,
                TaxRate = 18.00m,
                Unit = "Each",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        if (!await context.Products.AnyAsync(p => p.SKU == "SRV-SETUP-01"))
        {
            demoProducts.Add(new Product
            {
                SKU = "SRV-SETUP-01",
                Name = "Enterprise Onboarding & Setup Service",
                CategoryId = srvCat.Id,
                ProductType = ProductType.OneTime,
                BasePrice = 500.00m,
                CostPrice = 150.00m,
                TaxRate = 18.00m,
                Unit = "Service",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        if (!await context.Products.AnyAsync(p => p.SKU == "SUB-PREM-01"))
        {
            demoProducts.Add(new Product
            {
                SKU = "SUB-PREM-01",
                Name = "24/7 Mission-Critical Support Subscription",
                CategoryId = subCat.Id,
                ProductType = ProductType.Subscription,
                BasePrice = 100.00m,
                CostPrice = 25.00m,
                TaxRate = 18.00m,
                Unit = "Seat/Month",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        if (demoProducts.Any())
        {
            context.Products.AddRange(demoProducts);
            await context.SaveChangesAsync();
        }

        var laptop = await context.Products.FirstAsync(p => p.SKU == "HW-LAPTOP-01");
        var dock = await context.Products.FirstAsync(p => p.SKU == "HW-DOCK-01");
        var setupSrv = await context.Products.FirstAsync(p => p.SKU == "SRV-SETUP-01");
        var premSub = await context.Products.FirstAsync(p => p.SKU == "SUB-PREM-01");

        // 8. Price List
        if (!await context.PriceLists.AnyAsync(pl => pl.Name == "Standard Commercial Price List 2026"))
        {
            var priceList = new PriceList
            {
                Name = "Standard Commercial Price List 2026",
                CurrencyCode = "USD",
                TierId = goldTier.Id,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow,
                Items = new List<PriceListItem>
                {
                    new() { ProductId = laptop.Id, UnitPrice = 1450.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = dock.Id, UnitPrice = 240.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = setupSrv.Id, UnitPrice = 480.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = premSub.Id, UnitPrice = 95.00m, CreatedAtUtc = DateTime.UtcNow }
                }
            };
            context.PriceLists.Add(priceList);
            await context.SaveChangesAsync();
        }

        // 9. Discount Rules
        if (!await context.DiscountRules.AnyAsync())
        {
            var rules = new List<DiscountRule>
            {
                // Gold customer tier overall ceiling
                new()
                {
                    TierId = goldTier.Id,
                    CategoryId = null,
                    MaxDiscountPercent = 15.00m,
                    ManagerThreshold = 8.00m,
                    FinanceThreshold = 12.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                // Hardware category rule
                new()
                {
                    TierId = goldTier.Id,
                    CategoryId = hwCat.Id,
                    MaxDiscountPercent = 15.00m,
                    ManagerThreshold = 7.00m,
                    FinanceThreshold = 10.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                // Services category rule (allows up to 25% but flags risk above 10%)
                new()
                {
                    TierId = goldTier.Id,
                    CategoryId = srvCat.Id,
                    MaxDiscountPercent = 25.00m,
                    ManagerThreshold = 10.00m,
                    FinanceThreshold = 20.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };
            context.DiscountRules.AddRange(rules);
            await context.SaveChangesAsync();
        }

        // 10. Approval Rules
        if (!await context.ApprovalRules.AnyAsync())
        {
            var approvalRules = new List<ApprovalRule>
            {
                new()
                {
                    Level = ApprovalLevel.Manager,
                    MinRisk = 1.00m,
                    MaxRisk = 5.00m,
                    RequiredRole = "SalesManager",
                    Sequence = 1,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Level = ApprovalLevel.Finance,
                    MinRisk = 5.01m,
                    MaxRisk = 10.00m,
                    RequiredRole = "FinanceOperations",
                    Sequence = 2,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };
            context.ApprovalRules.AddRange(approvalRules);
            await context.SaveChangesAsync();
        }

        // 11. Warehouses & Stock
        if (!await context.Warehouses.AnyAsync(w => w.Name == "Central Warehouse (Chicago)"))
        {
            context.Warehouses.Add(new Warehouse
            {
                Name = "Central Warehouse (Chicago)",
                ShippingCostWeight = 1.00m,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        if (!await context.Warehouses.AnyAsync(w => w.Name == "East Coast Hub (New York)"))
        {
            context.Warehouses.Add(new Warehouse
            {
                Name = "East Coast Hub (New York)",
                ShippingCostWeight = 1.50m,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        var centralWh = await context.Warehouses.FirstAsync(w => w.Name == "Central Warehouse (Chicago)");
        var eastWh = await context.Warehouses.FirstAsync(w => w.Name == "East Coast Hub (New York)");

        // Seed stock for Central Warehouse
        if (!await context.InventoryStocks.AnyAsync(s => s.WarehouseId == centralWh.Id && s.ProductId == laptop.Id))
        {
            context.InventoryStocks.Add(new InventoryStock { WarehouseId = centralWh.Id, ProductId = laptop.Id, OnHand = 50, Reserved = 0, CreatedAtUtc = DateTime.UtcNow });
        }
        if (!await context.InventoryStocks.AnyAsync(s => s.WarehouseId == centralWh.Id && s.ProductId == dock.Id))
        {
            context.InventoryStocks.Add(new InventoryStock { WarehouseId = centralWh.Id, ProductId = dock.Id, OnHand = 100, Reserved = 0, CreatedAtUtc = DateTime.UtcNow });
        }

        // Seed stock for East Warehouse
        if (!await context.InventoryStocks.AnyAsync(s => s.WarehouseId == eastWh.Id && s.ProductId == laptop.Id))
        {
            context.InventoryStocks.Add(new InventoryStock { WarehouseId = eastWh.Id, ProductId = laptop.Id, OnHand = 20, Reserved = 0, CreatedAtUtc = DateTime.UtcNow });
        }
        if (!await context.InventoryStocks.AnyAsync(s => s.WarehouseId == eastWh.Id && s.ProductId == dock.Id))
        {
            context.InventoryStocks.Add(new InventoryStock { WarehouseId = eastWh.Id, ProductId = dock.Id, OnHand = 30, Reserved = 0, CreatedAtUtc = DateTime.UtcNow });
        }
        await context.SaveChangesAsync();

        // 12. Subscription Plans
        if (!await context.SubscriptionPlans.AnyAsync(sp => sp.Name == "Monthly Enterprise Plan"))
        {
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Name = "Monthly Enterprise Plan",
                BillingFrequency = "Monthly",
                BillingIntervalMonths = 1,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        if (!await context.SubscriptionPlans.AnyAsync(sp => sp.Name == "Quarterly Enterprise Plan"))
        {
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Name = "Quarterly Enterprise Plan",
                BillingFrequency = "Quarterly",
                BillingIntervalMonths = 3,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        if (!await context.SubscriptionPlans.AnyAsync(sp => sp.Name == "Annual Enterprise Plan"))
        {
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Name = "Annual Enterprise Plan",
                BillingFrequency = "Yearly",
                BillingIntervalMonths = 12,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // 13. Upsell & Cross-Sell Rules
        if (!await context.UpsellCrossSellRules.AnyAsync(r => r.TriggerProductId == laptop.Id && r.SuggestedProductId == dock.Id))
        {
            context.UpsellCrossSellRules.Add(new UpsellCrossSellRule
            {
                TriggerProductId = laptop.Id,
                SuggestedProductId = dock.Id,
                RuleType = "CrossSell",
                Score = 85,
                IsPromoted = true,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        if (!await context.UpsellCrossSellRules.AnyAsync(r => r.TriggerProductId == laptop.Id && r.SuggestedProductId == premSub.Id))
        {
            context.UpsellCrossSellRules.Add(new UpsellCrossSellRule
            {
                TriggerProductId = laptop.Id,
                SuggestedProductId = premSub.Id,
                RuleType = "Upsell",
                Score = 95,
                IsPromoted = true,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();
    }
}
