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

        // 7b. Product Variants
        if (!await context.ProductVariants.AnyAsync(v => v.ProductId == laptop.Id))
        {
            context.ProductVariants.AddRange(new List<ProductVariant>
            {
                new() { ProductId = laptop.Id, Name = "32GB RAM / 1TB NVMe Edition", AdditionalPrice = 250.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = laptop.Id, Name = "64GB RAM / 2TB NVMe Workstation", AdditionalPrice = 550.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow }
            });
            await context.SaveChangesAsync();
        }

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

        // 11b. Replenishment Rules
        if (!await context.ReplenishmentRules.AnyAsync())
        {
            context.ReplenishmentRules.AddRange(new List<ReplenishmentRule>
            {
                new() { WarehouseId = centralWh.Id, ProductId = laptop.Id, ReorderLevel = 15, ReorderQuantity = 30, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
                new() { WarehouseId = centralWh.Id, ProductId = dock.Id, ReorderLevel = 25, ReorderQuantity = 50, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
                new() { WarehouseId = eastWh.Id, ProductId = laptop.Id, ReorderLevel = 10, ReorderQuantity = 20, IsActive = true, CreatedAtUtc = DateTime.UtcNow }
            });
            await context.SaveChangesAsync();
        }

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

        // 14. Data-Driven Approval Rules
        if (!await context.ApprovalRules.AnyAsync())
        {
            var approvalRules = new List<ApprovalRule>
            {
                new()
                {
                    Level = ApprovalLevel.None,
                    MinRisk = 0.00m,
                    MaxRisk = 29.99m,
                    RequiredRole = "None",
                    Sequence = 1,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Level = ApprovalLevel.Manager,
                    MinRisk = 30.00m,
                    MaxRisk = 69.99m,
                    RequiredRole = "SalesManager",
                    Sequence = 2,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Level = ApprovalLevel.Finance,
                    MinRisk = 70.00m,
                    MaxRisk = 100.00m,
                    RequiredRole = "FinanceOperations",
                    Sequence = 3,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };
            context.ApprovalRules.AddRange(approvalRules);
            await context.SaveChangesAsync();
        }

        // 15. Data-Driven Discount Rules (Tier Ceilings & Category Overrides)
        if (!await context.DiscountRules.AnyAsync())
        {
            var silverTier = await context.CustomerTiers.FirstOrDefaultAsync(t => t.Name == "Silver");
            var bronzeTier = await context.CustomerTiers.FirstOrDefaultAsync(t => t.Name == "Bronze");

            var discountRules = new List<DiscountRule>
            {
                new()
                {
                    TierId = goldTier.Id,
                    CategoryId = null, // Global Order Ceiling for Gold
                    MaxDiscountPercent = 15.00m,
                    ManagerThreshold = 10.00m,
                    FinanceThreshold = 15.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    TierId = goldTier.Id,
                    CategoryId = hwCat.Id, // Hardware specific rule for Gold
                    MaxDiscountPercent = 12.00m,
                    ManagerThreshold = 8.00m,
                    FinanceThreshold = 12.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };

            if (silverTier != null)
            {
                discountRules.Add(new DiscountRule
                {
                    TierId = silverTier.Id,
                    CategoryId = null,
                    MaxDiscountPercent = 10.00m,
                    ManagerThreshold = 7.00m,
                    FinanceThreshold = 10.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            if (bronzeTier != null)
            {
                discountRules.Add(new DiscountRule
                {
                    TierId = bronzeTier.Id,
                    CategoryId = null,
                    MaxDiscountPercent = 5.00m,
                    ManagerThreshold = 3.00m,
                    FinanceThreshold = 5.00m,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }

            context.DiscountRules.AddRange(discountRules);
            await context.SaveChangesAsync();
        }

        // 16. Companies & Brand Entities
        if (!await context.Companies.AnyAsync())
        {
            var companies = new List<Company>
            {
                new()
                {
                    Name = "Dell Technologies",
                    Code = "DELL",
                    Description = "Enterprise computing solutions, servers, storage, and professional workstations.",
                    Website = "https://www.dell.com",
                    ContactEmail = "enterprise-sales@dell.com",
                    ContactPhone = "+1-800-456-3355",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Samsung Electronics",
                    Code = "SAMSUNG",
                    Description = "Global leader in professional displays, digital signage, memory, and mobile devices.",
                    Website = "https://www.samsung.com",
                    ContactEmail = "b2b-support@samsung.com",
                    ContactPhone = "+1-800-726-7864",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "Cisco Systems",
                    Code = "CISCO",
                    Description = "Worldwide leader in enterprise networking, cybersecurity, and cloud collaboration infrastructure.",
                    Website = "https://www.cisco.com",
                    ContactEmail = "enterprise@cisco.com",
                    ContactPhone = "+1-800-553-6387",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new()
                {
                    Name = "HP Enterprise",
                    Code = "HPE",
                    Description = "Edge-to-cloud platform company helping enterprises connect, protect, analyze and act on data.",
                    Website = "https://www.hpe.com",
                    ContactEmail = "sales@hpe.com",
                    ContactPhone = "+1-800-707-6327",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                }
            };

            context.Companies.AddRange(companies);
            await context.SaveChangesAsync();
        }

        var dell = await context.Companies.FirstOrDefaultAsync(c => c.Code == "DELL");
        var samsung = await context.Companies.FirstOrDefaultAsync(c => c.Code == "SAMSUNG");
        var cisco = await context.Companies.FirstOrDefaultAsync(c => c.Code == "CISCO");
        var hpe = await context.Companies.FirstOrDefaultAsync(c => c.Code == "HPE");

        // Associate existing products with Companies if not associated
        var prodLaptop = await context.Products.FirstOrDefaultAsync(p => p.SKU == "HW-LAPTOP-01");
        if (prodLaptop != null && prodLaptop.CompanyId == null && dell != null)
        {
            prodLaptop.CompanyId = dell.Id;
        }

        var prodDock = await context.Products.FirstOrDefaultAsync(p => p.SKU == "HW-DOCK-01");
        if (prodDock != null && prodDock.CompanyId == null && dell != null)
        {
            prodDock.CompanyId = dell.Id;
        }

        var prodSrvSetup = await context.Products.FirstOrDefaultAsync(p => p.SKU == "SRV-SETUP-01");
        if (prodSrvSetup != null && prodSrvSetup.CompanyId == null && cisco != null)
        {
            prodSrvSetup.CompanyId = cisco.Id;
        }

        var prodSubPrem = await context.Products.FirstOrDefaultAsync(p => p.SKU == "SUB-PREM-01");
        if (prodSubPrem != null && prodSubPrem.CompanyId == null && cisco != null)
        {
            prodSubPrem.CompanyId = cisco.Id;
        }

        // Seed additional flagship products for Samsung & HPE
        var hwCategory = await context.ProductCategories.FirstOrDefaultAsync(c => c.Name == "Hardware");
        if (hwCategory != null && samsung != null && !await context.Products.AnyAsync(p => p.SKU == "HW-SAMS-4K-01"))
        {
            context.Products.Add(new Product
            {
                SKU = "HW-SAMS-4K-01",
                Name = "Samsung 85\" UHD Commercial Display Wall",
                Description = "High-brightness commercial grade UHD 4K digital signage display with 24/7 run cycle.",
                CategoryId = hwCategory.Id,
                CompanyId = samsung.Id,
                ProductType = ProductType.OneTime,
                BasePrice = 3200.00m,
                CostPrice = 1800.00m,
                TaxRate = 18.00m,
                Unit = "Each",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        if (hwCategory != null && hpe != null && !await context.Products.AnyAsync(p => p.SKU == "HW-HPE-SRV-01"))
        {
            context.Products.Add(new Product
            {
                SKU = "HW-HPE-SRV-01",
                Name = "HPE ProLiant DL380 Gen10 Rack Server",
                Description = "Dual Intel Xeon Silver, 64GB RAM, 8-Bay SFF server tailored for enterprise workloads.",
                CategoryId = hwCategory.Id,
                CompanyId = hpe.Id,
                ProductType = ProductType.OneTime,
                BasePrice = 4500.00m,
                CostPrice = 2800.00m,
                TaxRate = 18.00m,
                Unit = "Each",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();

        // 17. Seed Sales Rep Routing Assignments
        if (!await context.SalesAssignments.AnyAsync())
        {
            var repUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "rep@dealflow360.io");
            var managerUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "manager@dealflow360.io");

            if (repUser != null && dell != null && samsung != null && cisco != null && hpe != null)
            {
                var assignments = new List<SalesAssignment>
                {
                    // Dell Default Rep -> Sarah Jenkins (Rep)
                    new()
                    {
                        CompanyId = dell.Id,
                        SalesRepresentativeId = repUser.Id,
                        IsDefault = true,
                        Priority = 10,
                        Notes = "Primary representative for Dell enterprise hardware solutions",
                        IsActive = true,
                        CreatedAtUtc = DateTime.UtcNow
                    },
                    // Samsung Default Rep -> Sarah Jenkins (Rep)
                    new()
                    {
                        CompanyId = samsung.Id,
                        SalesRepresentativeId = repUser.Id,
                        IsDefault = true,
                        Priority = 10,
                        Notes = "Dedicated account manager for Samsung commercial display lines",
                        IsActive = true,
                        CreatedAtUtc = DateTime.UtcNow
                    },
                    // Cisco Default Rep -> Michael Vance (Manager)
                    new()
                    {
                        CompanyId = cisco.Id,
                        SalesRepresentativeId = managerUser?.Id ?? repUser.Id,
                        IsDefault = true,
                        Priority = 10,
                        Notes = "Enterprise lead for Cisco infrastructure and networking",
                        IsActive = true,
                        CreatedAtUtc = DateTime.UtcNow
                    },
                    // HPE Default Rep -> Michael Vance (Manager)
                    new()
                    {
                        CompanyId = hpe.Id,
                        SalesRepresentativeId = managerUser?.Id ?? repUser.Id,
                        IsDefault = true,
                        Priority = 10,
                        Notes = "Executive lead for HPE data center server deployments",
                        IsActive = true,
                        CreatedAtUtc = DateTime.UtcNow
                    }
                };

                // Specific Category override: If Cisco Services, route to Sarah Jenkins
                var servicesCat = await context.ProductCategories.FirstOrDefaultAsync(c => c.Name == "Services");
                if (servicesCat != null)
                {
                    assignments.Add(new SalesAssignment
                    {
                        CompanyId = cisco.Id,
                        CategoryId = servicesCat.Id,
                        SalesRepresentativeId = repUser.Id,
                        IsDefault = false,
                        Priority = 50,
                        Notes = "Specialized service onboarding rep for Cisco professional services",
                        IsActive = true,
                        CreatedAtUtc = DateTime.UtcNow
                    });
                }

                context.SalesAssignments.AddRange(assignments);
                await context.SaveChangesAsync();
            }
        }
    }
}

