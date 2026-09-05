using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        // Ensure Database is created
        await context.Database.EnsureCreatedAsync();

        // 1. Seed Customer Tier if empty
        if (!await context.CustomerTiers.AnyAsync())
        {
            var goldTier = new CustomerTier { Name = "Gold", MaxDiscountPercent = 15.00m, CreatedAtUtc = DateTime.UtcNow };
            var silverTier = new CustomerTier { Name = "Silver", MaxDiscountPercent = 10.00m, CreatedAtUtc = DateTime.UtcNow };
            var bronzeTier = new CustomerTier { Name = "Bronze", MaxDiscountPercent = 5.00m, CreatedAtUtc = DateTime.UtcNow };

            context.CustomerTiers.AddRange(goldTier, silverTier, bronzeTier);
            await context.SaveChangesAsync();
        }

        // 2. Seed Customer if empty
        if (!await context.Customers.AnyAsync())
        {
            var goldTier = await context.CustomerTiers.FirstAsync(t => t.Name == "Gold");
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

        // 3. Seed Sales Team if empty
        if (!await context.SalesTeams.AnyAsync())
        {
            var team = new SalesTeam { Name = "Enterprise Sales USA", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
            context.SalesTeams.Add(team);
            await context.SaveChangesAsync();
        }

        // 4. Seed Users for all 5 roles if empty
        if (!await context.Users.AnyAsync())
        {
            var team = await context.SalesTeams.FirstAsync();
            var customer = await context.Customers.FirstAsync();

            var users = new List<User>
            {
                new User
                {
                    FullName = "System Administrator",
                    Email = "admin@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                    Role = Role.Admin,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new User
                {
                    FullName = "Sarah Jenkins (Sales Rep)",
                    Email = "rep@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Rep@123"),
                    Role = Role.SalesRep,
                    SalesTeamId = team.Id,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new User
                {
                    FullName = "Michael Vance (Sales Manager)",
                    Email = "manager@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Manager@123"),
                    Role = Role.SalesManager,
                    SalesTeamId = team.Id,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new User
                {
                    FullName = "David Kim (Finance Operations)",
                    Email = "finance@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Finance@123"),
                    Role = Role.FinanceOperations,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                },
                new User
                {
                    FullName = "Alice Smith (Customer User)",
                    Email = "customer@dealflow360.io",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Customer@123"),
                    Role = Role.Customer,
                    CustomerId = customer.Id,
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
                team.ManagerId = manager.Id;
            }
            if (rep != null)
            {
                customer.AssignedSalesRepId = rep.Id;
            }
            await context.SaveChangesAsync();
        }

        // 5. Seed Product Category, Products if empty
        if (!await context.Products.AnyAsync())
        {
            var category = new ProductCategory { Name = "Hardware", Description = "Enterprise Servers & Racks", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
            context.ProductCategories.Add(category);
            await context.SaveChangesAsync();

            var product1 = new Product
            {
                SKU = "SRV-X100",
                Name = "Dell PowerEdge R750 Rack Server",
                CategoryId = category.Id,
                ProductType = ProductType.OneTime,
                BasePrice = 3500.00m,
                CostPrice = 2000.00m,
                TaxRate = 18.00m,
                Unit = "Unit",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            var product2 = new Product
            {
                SKU = "SUB-CLOUD-SEC",
                Name = "Cloud Security Enterprise Subscription",
                CategoryId = category.Id,
                ProductType = ProductType.Subscription,
                BasePrice = 150.00m,
                CostPrice = 40.00m,
                TaxRate = 18.00m,
                Unit = "Seat/Month",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };

            context.Products.AddRange(product1, product2);
            await context.SaveChangesAsync();
        }

        // 6. Seed Warehouse & Stock if empty
        if (!await context.Warehouses.AnyAsync())
        {
            var warehouse = new Warehouse { Name = "Central Depot (Chicago)", ShippingCostWeight = 1.25m, IsActive = true, CreatedAtUtc = DateTime.UtcNow };
            context.Warehouses.Add(warehouse);
            await context.SaveChangesAsync();

            var products = await context.Products.ToListAsync();
            foreach (var p in products)
            {
                context.InventoryStocks.Add(new InventoryStock
                {
                    WarehouseId = warehouse.Id,
                    ProductId = p.Id,
                    OnHand = 100,
                    Reserved = 0,
                    UpdatedAtUtc = DateTime.UtcNow
                });
            }
            await context.SaveChangesAsync();
        }

        // 7. Seed Subscription Plan if empty
        if (!await context.SubscriptionPlans.AnyAsync())
        {
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Name = "Monthly Enterprise Plan",
                BillingFrequency = "Monthly",
                BillingIntervalMonths = 1,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
            await context.SaveChangesAsync();
        }
    }
}
