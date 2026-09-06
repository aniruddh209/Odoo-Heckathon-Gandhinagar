using System.Text.Json;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await ResetAndSeedQaDataAsync(context);
    }

    public static async Task<Dictionary<string, object>> ResetAndSeedQaDataAsync(AppDbContext context)
    {
        // 0. Ensure Database is created & migrations applied
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 1: PURGE TRANSACTIONS & NON-REQUIRED DATA (SAFE DEPENDENCY ORDER)
        // ═══════════════════════════════════════════════════════════════════════
        // Break any foreign keys on users/customers before bulk removal
        var allExistingUsers = await context.Users.ToListAsync();
        foreach (var u in allExistingUsers)
        {
            u.CustomerId = null;
            u.SalesTeamId = null;
        }
        await context.SaveChangesAsync();

        context.AuditLogs.RemoveRange(context.AuditLogs);
        context.Notifications.RemoveRange(context.Notifications);
        context.DealHealthSnapshots.RemoveRange(context.DealHealthSnapshots);
        context.CreditNotes.RemoveRange(context.CreditNotes);
        context.Payments.RemoveRange(context.Payments);
        context.InvoiceLines.RemoveRange(context.InvoiceLines);
        context.Invoices.RemoveRange(context.Invoices);
        context.BillingSchedules.RemoveRange(context.BillingSchedules);
        context.Backorders.RemoveRange(context.Backorders);
        context.WarehouseAllocations.RemoveRange(context.WarehouseAllocations);
        context.OrderLines.RemoveRange(context.OrderLines);
        context.Orders.RemoveRange(context.Orders);
        context.ApprovalActions.RemoveRange(context.ApprovalActions);
        context.ApprovalRequests.RemoveRange(context.ApprovalRequests);
        context.QuotationLineComments.RemoveRange(context.QuotationLineComments);
        context.QuotationChanges.RemoveRange(context.QuotationChanges);
        context.QuotationLines.RemoveRange(context.QuotationLines);
        context.Quotations.RemoveRange(context.Quotations);
        context.SalesConnectionRequests.RemoveRange(context.SalesConnectionRequests);
        context.SalesAssignments.RemoveRange(context.SalesAssignments);
        context.InventoryStocks.RemoveRange(context.InventoryStocks);
        context.ReplenishmentRules.RemoveRange(context.ReplenishmentRules);
        context.UpsellCrossSellRules.RemoveRange(context.UpsellCrossSellRules);
        context.PriceListItems.RemoveRange(context.PriceListItems);
        context.PriceLists.RemoveRange(context.PriceLists);
        context.ProductVariants.RemoveRange(context.ProductVariants);
        context.Products.RemoveRange(context.Products);
        context.DiscountRules.RemoveRange(context.DiscountRules);
        context.ApprovalRules.RemoveRange(context.ApprovalRules);
        context.SubscriptionPlans.RemoveRange(context.SubscriptionPlans);
        context.Warehouses.RemoveRange(context.Warehouses);
        context.RefreshTokens.RemoveRange(context.RefreshTokens);
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 2: COMPANY ENFORCEMENT — EXACTLY ONE COMPANY
        // ═══════════════════════════════════════════════════════════════════════
        var df360 = await context.Companies.FirstOrDefaultAsync(c => c.Code == "DF360");
        if (df360 == null)
        {
            df360 = new Company
            {
                Name = "DealFlow360 Technologies Pvt. Ltd.",
                Code = "DF360",
                Description = "DealFlow360 Technologies Pvt. Ltd. - Premier enterprise digital sales, IT hardware and cloud infrastructure solutions provider in India.",
                Website = "https://www.dealflow360.in",
                ContactEmail = "sales@dealflow360.in",
                ContactPhone = "+91-79-4000-1234",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            context.Companies.Add(df360);
            await context.SaveChangesAsync();
        }
        else
        {
            df360.Name = "DealFlow360 Technologies Pvt. Ltd.";
            df360.Description = "DealFlow360 Technologies Pvt. Ltd. - Premier enterprise digital sales, IT hardware and cloud infrastructure solutions provider in India.";
            df360.Website = "https://www.dealflow360.in";
            df360.ContactEmail = "sales@dealflow360.in";
            df360.ContactPhone = "+91-79-4000-1234";
            df360.IsActive = true;
            await context.SaveChangesAsync();
        }

        var extraCompanies = await context.Companies.Where(c => c.Id != df360.Id).ToListAsync();
        if (extraCompanies.Any())
        {
            context.Companies.RemoveRange(extraCompanies);
            await context.SaveChangesAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 3: CUSTOMER TIERS (Governance Ceilings)
        // ═══════════════════════════════════════════════════════════════════════
        var tiers = new List<(string Name, decimal MaxDiscount)>
        {
            ("Gold", 15.00m),
            ("Silver", 10.00m),
            ("Bronze", 5.00m)
        };

        foreach (var (tName, tMax) in tiers)
        {
            var tier = await context.CustomerTiers.FirstOrDefaultAsync(t => t.Name == tName);
            if (tier == null)
            {
                context.CustomerTiers.Add(new CustomerTier
                {
                    Name = tName,
                    MaxDiscountPercent = tMax,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                tier.MaxDiscountPercent = tMax;
            }
        }
        await context.SaveChangesAsync();

        var goldTier = await context.CustomerTiers.FirstAsync(t => t.Name == "Gold");
        var silverTier = await context.CustomerTiers.FirstAsync(t => t.Name == "Silver");
        var bronzeTier = await context.CustomerTiers.FirstAsync(t => t.Name == "Bronze");

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 4: SALES TEAMS
        // ═══════════════════════════════════════════════════════════════════════
        var enterpriseTeam = await context.SalesTeams.FirstOrDefaultAsync(t => t.Name == "Enterprise Sales India");
        if (enterpriseTeam == null)
        {
            enterpriseTeam = new SalesTeam { Name = "Enterprise Sales India", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
            context.SalesTeams.Add(enterpriseTeam);
            await context.SaveChangesAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 5: PRESERVE EXACTLY THE 5 PREDEFINED CUSTOMERS
        // ═══════════════════════════════════════════════════════════════════════
        // 1. Delhi Business Automation Pvt. Ltd. (Customer 1 - Bronze tier)
        // 2. Ahmedabad Manufacturing Solutions Pvt. Ltd. (Customer 2 - Silver tier)
        // 3. Pune Enterprise Networks Pvt. Ltd. (Customer 3 - Gold tier)
        // 4. Bengaluru CloudWorks Pvt. Ltd. (Customer 4 - Gold tier / High-value)
        // 5. Sharma Technologies Pvt. Ltd. (Customer 5 - Negotiation customer)

        var predefinedCustomerSeeds = new List<(string Name, string Email, string Phone, int TierId)>
        {
            ("Delhi Business Automation Pvt. Ltd.", "admin@delhibusiness.in", "+91-11-23456789", bronzeTier.Id),
            ("Ahmedabad Manufacturing Solutions Pvt. Ltd.", "commercial@ahmedabadmfg.in", "+91-79-26543210", silverTier.Id),
            ("Pune Enterprise Networks Pvt. Ltd.", "enterprise@punenetworks.in", "+91-20-67123450", goldTier.Id),
            ("Bengaluru CloudWorks Pvt. Ltd.", "it@bengalurucloud.in", "+91-80-41235678", goldTier.Id),
            ("Sharma Technologies Pvt. Ltd.", "procurement@sharmatech.in", "+91-22-68901234", silverTier.Id)
        };

        var keptCustomerIds = new HashSet<int>();
        foreach (var cs in predefinedCustomerSeeds)
        {
            var cust = await context.Customers.FirstOrDefaultAsync(c => c.Email == cs.Email || c.Name == cs.Name);
            if (cust == null)
            {
                cust = new Customer
                {
                    Name = cs.Name,
                    Email = cs.Email,
                    Phone = cs.Phone,
                    TierId = cs.TierId,
                    CurrencyCode = "INR",
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                };
                context.Customers.Add(cust);
                await context.SaveChangesAsync();
            }
            else
            {
                cust.Name = cs.Name;
                cust.Email = cs.Email;
                cust.Phone = cs.Phone;
                cust.TierId = cs.TierId;
                cust.CurrencyCode = "INR";
                cust.IsActive = true;
            }
            keptCustomerIds.Add(cust.Id);
        }
        await context.SaveChangesAsync();

        // Purge any extra customer records outside the exact 5
        var nonKeptCustomers = await context.Customers.Where(c => !keptCustomerIds.Contains(c.Id)).ToListAsync();
        if (nonKeptCustomers.Any())
        {
            context.Customers.RemoveRange(nonKeptCustomers);
            await context.SaveChangesAsync();
        }

        var cust1Delhi = await context.Customers.FirstAsync(c => c.Name == "Delhi Business Automation Pvt. Ltd.");
        var cust2Ahmedabad = await context.Customers.FirstAsync(c => c.Name == "Ahmedabad Manufacturing Solutions Pvt. Ltd.");
        var cust3Pune = await context.Customers.FirstAsync(c => c.Name == "Pune Enterprise Networks Pvt. Ltd.");
        var cust4Bengaluru = await context.Customers.FirstAsync(c => c.Name == "Bengaluru CloudWorks Pvt. Ltd.");
        var cust5Sharma = await context.Customers.FirstAsync(c => c.Name == "Sharma Technologies Pvt. Ltd.");

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 6: CONTROLLED STAFF DATASET & CUSTOMER PORTAL USER
        // ═══════════════════════════════════════════════════════════════════════
        // Required staff: 1 Admin, 2 Sales Managers, 3 Sales Reps, 1 Finance, 1 Customer user
        var staffSeeds = new List<(string Name, string Email, string Password, Role Role, int? TeamId, int? CustId)>
        {
            ("Arjun Mehta (Admin)", "admin@dealflow360.test", "Admin@123", Role.Admin, null, null),
            ("Arjun Mehta (Admin)", "admin@dealflow360.io", "Admin@123", Role.Admin, null, null),

            ("Rohan Sharma (Sales Manager)", "manager@dealflow360.test", "Manager@123", Role.SalesManager, enterpriseTeam.Id, null),
            ("Rohan Sharma (Sales Manager)", "manager@dealflow360.io", "Manager@123", Role.SalesManager, enterpriseTeam.Id, null),
            ("Kavita Rao (Sales Manager 2)", "manager2@dealflow360.test", "Manager@123", Role.SalesManager, enterpriseTeam.Id, null),

            ("Priya Patel (Sales Rep)", "rep@dealflow360.test", "Rep@123", Role.SalesRep, enterpriseTeam.Id, null),
            ("Priya Patel (Sales Rep)", "rep@dealflow360.io", "Rep@123", Role.SalesRep, enterpriseTeam.Id, null),
            ("Aditya Verma (Sales Rep 2)", "rep2@dealflow360.test", "Rep@123", Role.SalesRep, enterpriseTeam.Id, null),
            ("Neha Joshi (Sales Rep 3)", "rep3@dealflow360.test", "Rep@123", Role.SalesRep, enterpriseTeam.Id, null),

            ("Sneha Iyer (Finance Operations)", "finance@dealflow360.test", "Finance@123", Role.FinanceOperations, null, null),
            ("Sneha Iyer (Finance Operations)", "finance@dealflow360.io", "Finance@123", Role.FinanceOperations, null, null),

            ("Rahul Verma (Sharma Tech)", "customer@dealflow360.io", "Customer@123", Role.Customer, null, cust5Sharma.Id)
        };

        var keptUserEmails = new HashSet<string>(staffSeeds.Select(s => s.Email), StringComparer.OrdinalIgnoreCase);

        // Remove any non-controlled users (e.g. test artifacts)
        var usersToRemove = await context.Users.Where(u => !keptUserEmails.Contains(u.Email)).ToListAsync();
        if (usersToRemove.Any())
        {
            context.Users.RemoveRange(usersToRemove);
            await context.SaveChangesAsync();
        }

        foreach (var s in staffSeeds)
        {
            var u = await context.Users.FirstOrDefaultAsync(usr => usr.Email == s.Email);
            var pwdHash = BCrypt.Net.BCrypt.HashPassword(s.Password);
            if (u == null)
            {
                context.Users.Add(new User
                {
                    FullName = s.Name,
                    Email = s.Email,
                    PasswordHash = pwdHash,
                    Role = s.Role,
                    SalesTeamId = s.TeamId,
                    CustomerId = s.CustId,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                u.FullName = s.Name;
                u.PasswordHash = pwdHash;
                u.Role = s.Role;
                u.SalesTeamId = s.TeamId;
                u.CustomerId = s.CustId;
                u.IsActive = true;
            }
        }
        await context.SaveChangesAsync();

        var repUser = await context.Users.FirstAsync(u => u.Email == "rep@dealflow360.test" || u.Email == "rep@dealflow360.io");
        var rep2User = await context.Users.FirstAsync(u => u.Email == "rep2@dealflow360.test");
        var managerUser = await context.Users.FirstAsync(u => u.Email == "manager@dealflow360.test" || u.Email == "manager@dealflow360.io");
        var financeUser = await context.Users.FirstAsync(u => u.Email == "finance@dealflow360.test" || u.Email == "finance@dealflow360.io");

        enterpriseTeam.ManagerId = managerUser.Id;
        cust1Delhi.AssignedSalesRepId = repUser.Id;
        cust2Ahmedabad.AssignedSalesRepId = repUser.Id;
        cust3Pune.AssignedSalesRepId = rep2User.Id;
        cust4Bengaluru.AssignedSalesRepId = repUser.Id;
        cust5Sharma.AssignedSalesRepId = repUser.Id;
        await context.SaveChangesAsync();

        // Dedicated primary sales assignment for DealFlow360 Technologies Pvt. Ltd.
        context.SalesAssignments.Add(new SalesAssignment
        {
            CompanyId = df360.Id,
            SalesRepresentativeId = repUser.Id,
            CategoryId = null,
            IsDefault = true,
            Priority = 100,
            Notes = "Priya Patel is the primary enterprise sales representative for DealFlow360 Technologies Pvt. Ltd.",
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 7: 5 PRODUCT CATEGORIES
        // ═══════════════════════════════════════════════════════════════════════
        var categories = new List<(string Name, string Desc)>
        {
            ("Hardware", "Enterprise computing, commercial laptops, displays, docking stations, and networking gear."),
            ("Accessories", "Business peripherals, docks, ergonomic input devices, monitors, and power backup."),
            ("Services", "Certified on-site deployment, structured cabling, data migration, and IT setup."),
            ("Support", "Dedicated annual technical support, SLAs, and preventive maintenance."),
            ("Subscriptions", "Recurring software licenses, cloud platforms, endpoint security, and monitoring.")
        };

        foreach (var (cName, cDesc) in categories)
        {
            var cat = await context.ProductCategories.FirstOrDefaultAsync(c => c.Name == cName);
            if (cat == null)
            {
                context.ProductCategories.Add(new ProductCategory
                {
                    Name = cName,
                    Description = cDesc,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                cat.Description = cDesc;
                cat.IsActive = true;
            }
        }
        await context.SaveChangesAsync();

        var hwCat = await context.ProductCategories.FirstAsync(c => c.Name == "Hardware");
        var accCat = await context.ProductCategories.FirstAsync(c => c.Name == "Accessories");
        var srvCat = await context.ProductCategories.FirstAsync(c => c.Name == "Services");
        var suppCat = await context.ProductCategories.FirstAsync(c => c.Name == "Support");
        var subCat = await context.ProductCategories.FirstAsync(c => c.Name == "Subscriptions");

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 8: CONTROLLED PRODUCT CATALOG (EXACTLY 24 PURPOSE-BUILT PRODUCTS)
        // ═══════════════════════════════════════════════════════════════════════
        var productSeeds = new List<(string SKU, string Name, string Desc, int CatId, ProductType Type, decimal Base, decimal Cost, decimal Tax, string Unit)>
        {
            // Hardware (4)
            ("P001", "DealFlow ProBook 14", "Intel Core Ultra 7, 16GB RAM, 512GB SSD, Anti-glare FHD IPS Display with 3-Yr Onsite Warranty.", hwCat.Id, ProductType.OneTime, 75000.00m, 55000.00m, 18.00m, "Unit"),
            ("P002", "DealFlow ProBook 16", "Intel Core Ultra 9, 32GB RAM, 1TB SSD, 2.8K OLED Display, Carbon Chassis.", hwCat.Id, ProductType.OneTime, 95000.00m, 68000.00m, 18.00m, "Unit"),
            ("P003", "DealFlow WorkStation X1", "AMD Ryzen Threadripper PRO, 64GB ECC RAM, 2TB NVMe, NVIDIA RTX A4000 GPU.", hwCat.Id, ProductType.OneTime, 150000.00m, 110000.00m, 18.00m, "Unit"),
            ("P004", "DealFlow Server S1", "Dual Intel Xeon Silver, 128GB ECC RAM, 8-Bay Hot-swap SAS/SATA, Redundant 800W PSU.", hwCat.Id, ProductType.OneTime, 250000.00m, 185000.00m, 18.00m, "Unit"),

            // Accessories (9, including P109 low-margin test product)
            ("P101", "USB-C Dock Pro", "Dual 4K HDMI/DisplayPort, 100W Power Delivery, Gigabit Ethernet, 5x USB 3.2 Ports.", accCat.Id, ProductType.OneTime, 12000.00m, 7000.00m, 18.00m, "Unit"),
            ("P102", "Wireless Business Mouse", "Quiet-click ergonomic optical mouse, rechargeable via USB-C, 2.4GHz & Bluetooth 5.2.", accCat.Id, ProductType.OneTime, 2500.00m, 1200.00m, 18.00m, "Unit"),
            ("P103", "Mechanical Business Keyboard", "Low-profile tactile switches, white LED backlight, multi-device fast pairing.", accCat.Id, ProductType.OneTime, 4500.00m, 2300.00m, 18.00m, "Unit"),
            ("P104", "27-inch 4K Monitor", "UHD 3840x2160 IPS, HDR400, USB-C Hub 90W PD, Daisy-chain DisplayPort Support.", accCat.Id, ProductType.OneTime, 32000.00m, 21000.00m, 18.00m, "Unit"),
            ("P105", "Laptop Carry Bag", "Water-resistant ballistic nylon executive briefcase with padded 16\" laptop compartment.", accCat.Id, ProductType.OneTime, 3000.00m, 1200.00m, 18.00m, "Unit"),
            ("P106", "UPS Backup 1500VA", "Line-interactive 1500VA / 900W UPS, LCD display, automatic voltage regulation (AVR).", accCat.Id, ProductType.OneTime, 18000.00m, 11000.00m, 18.00m, "Unit"),
            ("P107", "Server RAM Upgrade 32GB", "32GB DDR5-4800MHz ECC Registered DIMM for enterprise servers and workstations.", accCat.Id, ProductType.OneTime, 22000.00m, 14000.00m, 18.00m, "Unit"),
            ("P108", "Enterprise SSD 2TB", "2TB NVMe PCIe 4.0 x4 enterprise read-intensive SSD, power loss protection, 1 DWPD.", accCat.Id, ProductType.OneTime, 35000.00m, 23000.00m, 18.00m, "Unit"),
            ("P109", "USB-C Basic Cable Adapter", "Braided USB-C male to USB-A female 15cm adapter. (Low margin 10% test item).", accCat.Id, ProductType.OneTime, 1000.00m, 900.00m, 18.00m, "Unit"),

            // Services (4)
            ("P201", "Installation Service", "Certified engineering team on-site device staging, unpacking, and workspace setup.", srvCat.Id, ProductType.OneTime, 5000.00m, 2000.00m, 18.00m, "Service"),
            ("P202", "On-Site Setup Service", "Multi-floor structured hardware deployment, workstation cable routing, and connectivity.", srvCat.Id, ProductType.OneTime, 8000.00m, 3500.00m, 18.00m, "Service"),
            ("P203", "Data Migration Service", "Secure enterprise cloud/on-prem file server and directory migration with zero downtime.", srvCat.Id, ProductType.OneTime, 15000.00m, 7000.00m, 18.00m, "Service"),
            ("P204", "Annual Maintenance Service", "Quarterly preventive maintenance visits, hardware diagnostics, and priority firmware updates.", srvCat.Id, ProductType.OneTime, 25000.00m, 12000.00m, 18.00m, "Year"),

            // Support (3)
            ("P301", "Standard Support", "8x5 business hours ticket and phone technical support with next-business-day response.", suppCat.Id, ProductType.Subscription, 12000.00m, 5000.00m, 18.00m, "Year"),
            ("P302", "Premium Support", "24/7 dedicated phone, remote desktop and ticket support with 2-hour critical response.", suppCat.Id, ProductType.Subscription, 3000.00m, 1000.00m, 18.00m, "Seat/Month"),
            ("P303", "Enterprise Support", "24/7 mission-critical coverage, dedicated technical account manager, 1-hour critical response.", suppCat.Id, ProductType.Subscription, 60000.00m, 22000.00m, 18.00m, "Year"),

            // Subscriptions (4)
            ("P401", "Cloud Basic", "Cloud productivity suite, 50GB cloud storage per seat, team messaging, and shared calendars.", subCat.Id, ProductType.Subscription, 2000.00m, 700.00m, 18.00m, "Seat/Month"),
            ("P402", "Cloud Business", "Cloud productivity suite, 1TB cloud storage, advanced security policies, and team video meetings.", subCat.Id, ProductType.Subscription, 5000.00m, 1500.00m, 18.00m, "Seat/Month"),
            ("P403", "Cloud Enterprise", "Full enterprise cloud suite, unlimited storage, DLP compliance, SSO/SAML, and audit vault.", subCat.Id, ProductType.Subscription, 12000.00m, 3500.00m, 18.00m, "Seat/Month"),
            ("P404", "Mission Critical Monitoring", "Real-time automated infrastructure telemetry, synthetic transaction alerts, 24/7 NOC monitoring.", subCat.Id, ProductType.Subscription, 8000.00m, 2500.00m, 18.00m, "Device/Month")
        };

        foreach (var p in productSeeds)
        {
            context.Products.Add(new Product
            {
                SKU = p.SKU,
                Name = p.Name,
                Description = p.Desc,
                CategoryId = p.CatId,
                CompanyId = df360.Id,
                ProductType = p.Type,
                BasePrice = p.Base,
                CostPrice = p.Cost,
                TaxRate = p.Tax,
                Unit = p.Unit,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        var pP001 = await context.Products.FirstAsync(p => p.SKU == "P001");
        var pP002 = await context.Products.FirstAsync(p => p.SKU == "P002");
        var pP003 = await context.Products.FirstAsync(p => p.SKU == "P003");
        var pP004 = await context.Products.FirstAsync(p => p.SKU == "P004");

        var pP101 = await context.Products.FirstAsync(p => p.SKU == "P101");
        var pP102 = await context.Products.FirstAsync(p => p.SKU == "P102");
        var pP103 = await context.Products.FirstAsync(p => p.SKU == "P103");
        var pP104 = await context.Products.FirstAsync(p => p.SKU == "P104");
        var pP105 = await context.Products.FirstAsync(p => p.SKU == "P105");
        var pP106 = await context.Products.FirstAsync(p => p.SKU == "P106");
        var pP107 = await context.Products.FirstAsync(p => p.SKU == "P107");
        var pP108 = await context.Products.FirstAsync(p => p.SKU == "P108");
        var pP109 = await context.Products.FirstAsync(p => p.SKU == "P109");

        var pP201 = await context.Products.FirstAsync(p => p.SKU == "P201");
        var pP202 = await context.Products.FirstAsync(p => p.SKU == "P202");
        var pP203 = await context.Products.FirstAsync(p => p.SKU == "P203");
        var pP204 = await context.Products.FirstAsync(p => p.SKU == "P204");

        var pP301 = await context.Products.FirstAsync(p => p.SKU == "P301");
        var pP302 = await context.Products.FirstAsync(p => p.SKU == "P302");
        var pP303 = await context.Products.FirstAsync(p => p.SKU == "P303");

        var pP401 = await context.Products.FirstAsync(p => p.SKU == "P401");
        var pP402 = await context.Products.FirstAsync(p => p.SKU == "P402");
        var pP403 = await context.Products.FirstAsync(p => p.SKU == "P403");
        var pP404 = await context.Products.FirstAsync(p => p.SKU == "P404");

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 9: PRODUCT VARIANTS (P001 ProBook 14)
        // ═══════════════════════════════════════════════════════════════════════
        var probook14Variants = new List<(string Name, decimal AddPrice)>
        {
            ("16GB RAM / 512GB SSD", 5000.00m),
            ("32GB RAM / 1TB NVMe", 20000.00m),
            ("16GB RAM / 1TB NVMe", 13000.00m),
            ("32GB RAM / 512GB SSD", 12000.00m)
        };
        foreach (var (vName, vAdd) in probook14Variants)
        {
            context.ProductVariants.Add(new ProductVariant
            {
                ProductId = pP001.Id,
                Name = vName,
                AdditionalPrice = vAdd,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 10: PRICE LISTS (Standard, Bronze, Silver, Gold)
        // ═══════════════════════════════════════════════════════════════════════
        var standardPl = new PriceList
        {
            Name = "Standard Commercial Price List 2026 (INR)",
            CurrencyCode = "INR",
            TierId = null,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            Items = new List<PriceListItem>
            {
                new() { ProductId = pP001.Id, UnitPrice = 75000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP002.Id, UnitPrice = 95000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP003.Id, UnitPrice = 150000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP004.Id, UnitPrice = 250000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP101.Id, UnitPrice = 12000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP102.Id, UnitPrice = 2500.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP104.Id, UnitPrice = 32000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP105.Id, UnitPrice = 3000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP201.Id, UnitPrice = 5000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP302.Id, UnitPrice = 30000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP402.Id, UnitPrice = 5000.00m, CreatedAtUtc = DateTime.UtcNow }
            }
        };
        context.PriceLists.Add(standardPl);

        var bronzePl = new PriceList
        {
            Name = "Bronze Tier Price List 2026 (INR)",
            CurrencyCode = "INR",
            TierId = bronzeTier.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            Items = new List<PriceListItem>
            {
                new() { ProductId = pP001.Id, UnitPrice = 75000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP002.Id, UnitPrice = 95000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP101.Id, UnitPrice = 12000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP104.Id, UnitPrice = 32000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP402.Id, UnitPrice = 5000.00m, CreatedAtUtc = DateTime.UtcNow }
            }
        };
        context.PriceLists.Add(bronzePl);

        var silverPl = new PriceList
        {
            Name = "Silver Tier Price List 2026 (INR)",
            CurrencyCode = "INR",
            TierId = silverTier.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            Items = new List<PriceListItem>
            {
                new() { ProductId = pP001.Id, UnitPrice = 73000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP002.Id, UnitPrice = 92000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP101.Id, UnitPrice = 11500.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP104.Id, UnitPrice = 30500.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP402.Id, UnitPrice = 4800.00m, CreatedAtUtc = DateTime.UtcNow }
            }
        };
        context.PriceLists.Add(silverPl);

        var goldPl = new PriceList
        {
            Name = "Gold Enterprise Price List 2026 (INR)",
            CurrencyCode = "INR",
            TierId = goldTier.Id,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            Items = new List<PriceListItem>
            {
                new() { ProductId = pP001.Id, UnitPrice = 70000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP002.Id, UnitPrice = 88000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP003.Id, UnitPrice = 140000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP004.Id, UnitPrice = 230000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP101.Id, UnitPrice = 11000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP104.Id, UnitPrice = 29000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP302.Id, UnitPrice = 27000.00m, CreatedAtUtc = DateTime.UtcNow },
                new() { ProductId = pP402.Id, UnitPrice = 4500.00m, CreatedAtUtc = DateTime.UtcNow }
            }
        };
        context.PriceLists.Add(goldPl);
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 11: DISCOUNT GOVERNANCE RULES
        // ═══════════════════════════════════════════════════════════════════════
        var discountRules = new List<DiscountRule>
        {
            // Tier Global Ceilings
            new() { TierId = bronzeTier.Id, CategoryId = null, MaxDiscountPercent = 5.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = null, MaxDiscountPercent = 10.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = null, MaxDiscountPercent = 15.00m, ManagerThreshold = 10.00m, FinanceThreshold = 15.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Category Specific Ceilings
            // Hardware: 10%
            new() { TierId = bronzeTier.Id, CategoryId = hwCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = hwCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = hwCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 8.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Accessories: 15%
            new() { TierId = bronzeTier.Id, CategoryId = accCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = accCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = accCat.Id, MaxDiscountPercent = 15.00m, ManagerThreshold = 10.00m, FinanceThreshold = 15.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Services: 20%
            new() { TierId = bronzeTier.Id, CategoryId = srvCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = srvCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = srvCat.Id, MaxDiscountPercent = 20.00m, ManagerThreshold = 10.00m, FinanceThreshold = 15.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Subscriptions: 15%
            new() { TierId = bronzeTier.Id, CategoryId = subCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = subCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = subCat.Id, MaxDiscountPercent = 15.00m, ManagerThreshold = 8.00m, FinanceThreshold = 12.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Support: 20%
            new() { TierId = bronzeTier.Id, CategoryId = suppCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = suppCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = suppCat.Id, MaxDiscountPercent = 20.00m, ManagerThreshold = 10.00m, FinanceThreshold = 15.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow }
        };
        context.DiscountRules.AddRange(discountRules);
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 12: APPROVAL RULES
        // ═══════════════════════════════════════════════════════════════════════
        var approvalRules = new List<ApprovalRule>
        {
            new() { Level = ApprovalLevel.None, MinRisk = 0.00m, MaxRisk = 29.99m, RequiredRole = "None", Sequence = 1, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { Level = ApprovalLevel.Manager, MinRisk = 30.00m, MaxRisk = 69.99m, RequiredRole = "SalesManager", Sequence = 2, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { Level = ApprovalLevel.Finance, MinRisk = 70.00m, MaxRisk = 100.00m, RequiredRole = "FinanceOperations", Sequence = 3, IsActive = true, CreatedAtUtc = DateTime.UtcNow }
        };
        context.ApprovalRules.AddRange(approvalRules);
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 13: EXACTLY THREE WAREHOUSES
        // ═══════════════════════════════════════════════════════════════════════
        var whMain = new Warehouse { Name = "Main Warehouse (Mumbai)", ShippingCostWeight = 1.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var whEast = new Warehouse { Name = "East Depot (Kolkata)", ShippingCostWeight = 1.20m, IsActive = true, CreatedAtUtc = DateTime.UtcNow };
        var whWest = new Warehouse { Name = "West Depot (Ahmedabad)", ShippingCostWeight = 0.80m, IsActive = true, CreatedAtUtc = DateTime.UtcNow };

        context.Warehouses.AddRange(whMain, whEast, whWest);
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 14: INVENTORY STOCKS (EXACT QUANTITIES FROM SECTION 26)
        // ═══════════════════════════════════════════════════════════════════════
        var stockSeeds = new List<(int WhId, int ProdId, int Qty)>
        {
            // MAIN WAREHOUSE
            (whMain.Id, pP001.Id, 50),
            (whMain.Id, pP002.Id, 20),
            (whMain.Id, pP003.Id, 10),
            (whMain.Id, pP004.Id, 5),
            (whMain.Id, pP101.Id, 40),
            (whMain.Id, pP102.Id, 100),
            (whMain.Id, pP103.Id, 60),
            (whMain.Id, pP104.Id, 30),
            (whMain.Id, pP105.Id, 80),
            (whMain.Id, pP106.Id, 15),
            (whMain.Id, pP107.Id, 20),
            (whMain.Id, pP108.Id, 25),
            (whMain.Id, pP109.Id, 50),
            (whMain.Id, pP201.Id, 999),
            (whMain.Id, pP202.Id, 999),
            (whMain.Id, pP203.Id, 999),
            (whMain.Id, pP204.Id, 999),
            (whMain.Id, pP301.Id, 999),
            (whMain.Id, pP302.Id, 999),
            (whMain.Id, pP303.Id, 999),
            (whMain.Id, pP401.Id, 999),
            (whMain.Id, pP402.Id, 999),
            (whMain.Id, pP403.Id, 999),
            (whMain.Id, pP404.Id, 999),

            // EAST DEPOT
            (whEast.Id, pP001.Id, 35),
            (whEast.Id, pP002.Id, 10),
            (whEast.Id, pP101.Id, 10),
            (whEast.Id, pP104.Id, 20),
            (whEast.Id, pP106.Id, 20),
            (whEast.Id, pP107.Id, 10),
            (whEast.Id, pP108.Id, 15),

            // WEST DEPOT
            (whWest.Id, pP001.Id, 15),
            (whWest.Id, pP003.Id, 5),
            (whWest.Id, pP004.Id, 3),
            (whWest.Id, pP101.Id, 5),
            (whWest.Id, pP102.Id, 30),
            (whWest.Id, pP104.Id, 10),
            (whWest.Id, pP106.Id, 10),
            (whWest.Id, pP108.Id, 10)
        };

        foreach (var (wId, prId, q) in stockSeeds)
        {
            context.InventoryStocks.Add(new InventoryStock
            {
                WarehouseId = wId,
                ProductId = prId,
                OnHand = q,
                Reserved = 0,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 15: SUBSCRIPTION PLANS
        // ═══════════════════════════════════════════════════════════════════════
        var planSeeds = new List<(string Name, string Freq, int Months)>
        {
            ("Cloud Basic - Monthly", "Monthly", 1),
            ("Cloud Business - Monthly", "Monthly", 1),
            ("Cloud Enterprise - Monthly", "Monthly", 1),
            ("Enterprise Support - Yearly", "Yearly", 12),
            ("Quarterly Enterprise Cloud Backup", "Quarterly", 3)
        };
        foreach (var (pName, pFreq, pMonths) in planSeeds)
        {
            context.SubscriptionPlans.Add(new SubscriptionPlan
            {
                Name = pName,
                BillingFrequency = pFreq,
                BillingIntervalMonths = pMonths,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        var subPlanMonthly = await context.SubscriptionPlans.FirstAsync(sp => sp.Name == "Cloud Business - Monthly");
        var subPlanYearly = await context.SubscriptionPlans.FirstAsync(sp => sp.Name == "Enterprise Support - Yearly");

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 16: PRODUCT RELATIONSHIPS (UPSELL / CROSS-SELL / PROMOTIONS)
        // ═══════════════════════════════════════════════════════════════════════
        var relSeeds = new List<(int TrigId, int SuggId, string Type, int Score, bool Promoted)>
        {
            // P001 ProBook 14
            (pP001.Id, pP101.Id, "CrossSell", 95, true),  // USB-C Dock (Promoted)
            (pP001.Id, pP102.Id, "CrossSell", 90, false), // Mouse
            (pP001.Id, pP105.Id, "CrossSell", 85, false), // Bag
            (pP001.Id, pP103.Id, "CrossSell", 70, false), // Keyboard
            (pP001.Id, pP104.Id, "CrossSell", 65, false), // Monitor
            (pP001.Id, pP109.Id, "CrossSell", 80, false), // Low-margin adapter (test threshold filter)
            (pP001.Id, pP002.Id, "Upsell", 90, false),    // ProBook 16 (Upsell)
            (pP001.Id, pP107.Id, "Incompatible", 0, false), // Incompatible rule

            // P002 ProBook 16
            (pP002.Id, pP101.Id, "CrossSell", 92, true),  // USB-C Dock (Promoted)
            (pP002.Id, pP104.Id, "CrossSell", 85, false), // Monitor
            (pP002.Id, pP105.Id, "CrossSell", 80, false), // Bag
            (pP002.Id, pP302.Id, "CrossSell", 90, true),  // Premium Support (Promoted)
            (pP002.Id, pP003.Id, "Upsell", 88, false),    // WorkStation X1

            // P004 Server S1
            (pP004.Id, pP107.Id, "CrossSell", 95, false), // Server RAM
            (pP004.Id, pP108.Id, "CrossSell", 92, false), // Enterprise SSD
            (pP004.Id, pP106.Id, "CrossSell", 85, false), // UPS Backup
            (pP004.Id, pP303.Id, "CrossSell", 90, false), // Enterprise Support
            (pP004.Id, pP404.Id, "CrossSell", 88, false), // Monitoring

            // P401 Cloud Basic
            (pP401.Id, pP402.Id, "Upsell", 90, false),    // Cloud Business
            (pP401.Id, pP403.Id, "Upsell", 85, true),     // Cloud Enterprise (Promoted)
            (pP401.Id, pP404.Id, "CrossSell", 80, false), // Monitoring

            // P402 Cloud Business
            (pP402.Id, pP403.Id, "Upsell", 92, true),     // Cloud Enterprise (Promoted)
            (pP402.Id, pP404.Id, "CrossSell", 88, false), // Monitoring
            (pP402.Id, pP302.Id, "CrossSell", 82, true)   // Premium Support (Promoted)
        };

        foreach (var (trig, sugg, rType, score, prom) in relSeeds)
        {
            context.UpsellCrossSellRules.Add(new UpsellCrossSellRule
            {
                TriggerProductId = trig,
                SuggestedProductId = sugg,
                RuleType = rType,
                Score = score,
                IsPromoted = prom,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 17: HISTORICAL CO-PURCHASE ORDERS & ORDER LINES
        // ═══════════════════════════════════════════════════════════════════════
        // Real confirmed orders for live co-purchase aggregation:
        // ProBook 14 + Dock: 20 orders
        // ProBook 14 + Mouse: 18 orders
        // ProBook 14 + Carry Bag: 15 orders
        // ProBook 14 + Keyboard: 10 orders
        // Server S1 + RAM: 15 orders
        // Server S1 + SSD: 13 orders
        // Server S1 + UPS: 11 orders
        // Server S1 + Enterprise Support: 12 orders
        // Cloud Business + Monitoring: 14 orders
        // Cloud Business + Support: 8 orders

        var coPurchaseConfigs = new List<(Product P1, Product P2, int Count)>
        {
            (pP001, pP101, 20),
            (pP001, pP102, 18),
            (pP001, pP105, 15),
            (pP001, pP103, 10),
            (pP004, pP107, 15),
            (pP004, pP108, 13),
            (pP004, pP106, 11),
            (pP004, pP303, 12),
            (pP402, pP404, 14),
            (pP402, pP302, 8)
        };

        var customerPool = new[] { cust1Delhi, cust2Ahmedabad, cust3Pune, cust4Bengaluru, cust5Sharma };
        int orderCounter = 1;

        foreach (var (prod1, prod2, count) in coPurchaseConfigs)
        {
            for (int i = 0; i < count; i++)
            {
                var cust = customerPool[(orderCounter + i) % customerPool.Length];
                var daysAgo = (orderCounter % 45) + 2;
                var date = DateTime.UtcNow.AddDays(-daysAgo);

                var q = new Quotation
                {
                    QuotationNumber = $"QT-HIST-{orderCounter:D4}",
                    CustomerId = cust.Id,
                    SalesRepId = repUser.Id,
                    Status = QuoteStatus.ConvertedToOrder,
                    ApprovalStatus = ApprovalStatus.Approved,
                    CurrencyCode = "INR",
                    CreatedAtUtc = date,
                    UpdatedAtUtc = date,
                    Lines = new List<QuotationLine>
                    {
                        new()
                        {
                            ProductId = prod1.Id,
                            Quantity = 1,
                            UnitPrice = prod1.BasePrice,
                            DiscountPercent = 2.0m,
                            CostPrice = prod1.CostPrice,
                            NetAmount = prod1.BasePrice * 0.98m,
                            TaxAmount = (prod1.BasePrice * 0.98m) * 0.18m,
                            MarginAmount = (prod1.BasePrice * 0.98m) - prod1.CostPrice
                        },
                        new()
                        {
                            ProductId = prod2.Id,
                            Quantity = 1,
                            UnitPrice = prod2.BasePrice,
                            DiscountPercent = 2.0m,
                            CostPrice = prod2.CostPrice,
                            NetAmount = prod2.BasePrice * 0.98m,
                            TaxAmount = (prod2.BasePrice * 0.98m) * 0.18m,
                            MarginAmount = (prod2.BasePrice * 0.98m) - prod2.CostPrice
                        }
                    }
                };
                q.SubTotal = q.Lines.Sum(l => l.UnitPrice * l.Quantity);
                q.DiscountTotal = q.SubTotal - q.Lines.Sum(l => l.NetAmount);
                q.TaxTotal = q.Lines.Sum(l => l.TaxAmount);
                q.GrandTotal = q.Lines.Sum(l => l.NetAmount) + q.TaxTotal;
                q.CostTotal = q.Lines.Sum(l => l.CostPrice * l.Quantity);
                q.MarginAmount = q.GrandTotal - q.CostTotal - q.TaxTotal;
                q.MarginPercent = q.GrandTotal > 0 ? (q.MarginAmount / (q.GrandTotal - q.TaxTotal)) * 100 : 0;
                q.RiskScore = 10.0m;
                context.Quotations.Add(q);
                await context.SaveChangesAsync();

                var ord = new Order
                {
                    OrderNumber = $"ORD-HIST-{orderCounter:D4}",
                    QuotationId = q.Id,
                    CustomerId = cust.Id,
                    Status = OrderStatus.Confirmed,
                    Total = q.GrandTotal,
                    CreatedAtUtc = date,
                    Lines = new List<OrderLine>
                    {
                        new()
                        {
                            ProductId = prod1.Id,
                            Quantity = 1,
                            UnitPrice = prod1.BasePrice,
                            DiscountPercent = 2.0m,
                            NetAmount = prod1.BasePrice * 0.98m,
                            TaxAmount = (prod1.BasePrice * 0.98m) * 0.18m,
                            ProductType = prod1.ProductType,
                            CreatedAtUtc = date
                        },
                        new()
                        {
                            ProductId = prod2.Id,
                            Quantity = 1,
                            UnitPrice = prod2.BasePrice,
                            DiscountPercent = 2.0m,
                            NetAmount = prod2.BasePrice * 0.98m,
                            TaxAmount = (prod2.BasePrice * 0.98m) * 0.18m,
                            ProductType = prod2.ProductType,
                            CreatedAtUtc = date
                        }
                    }
                };
                context.Orders.Add(ord);
                await context.SaveChangesAsync();

                orderCounter++;
            }
        }

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 18: PREDEFINED TEST QUOTATIONS (Q-TEST-001 TO Q-TEST-005)
        // ═══════════════════════════════════════════════════════════════════════

        // Q-TEST-001: Normal quote / no approval (Bronze customer, ProBook 14 x 2, Mouse x 2, Bag x 2, 3% discount)
        var qTest001 = new Quotation
        {
            QuotationNumber = "QT-QA-001",
            CustomerId = cust1Delhi.Id,
            SalesRepId = repUser.Id,
            Status = QuoteStatus.Draft,
            ApprovalStatus = ApprovalStatus.None,
            CurrencyCode = "INR",
            Notes = "Q-TEST-001: Standard quote within 5% Bronze ceiling. No approval required.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(14),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP001.Id, Quantity = 2, UnitPrice = pP001.BasePrice, DiscountPercent = 3.00m, CostPrice = pP001.CostPrice, NetAmount = (pP001.BasePrice * 0.97m) * 2, TaxAmount = ((pP001.BasePrice * 0.97m) * 2) * 0.18m, MarginAmount = ((pP001.BasePrice * 0.97m) - pP001.CostPrice) * 2 },
                new() { ProductId = pP102.Id, Quantity = 2, UnitPrice = pP102.BasePrice, DiscountPercent = 3.00m, CostPrice = pP102.CostPrice, NetAmount = (pP102.BasePrice * 0.97m) * 2, TaxAmount = ((pP102.BasePrice * 0.97m) * 2) * 0.18m, MarginAmount = ((pP102.BasePrice * 0.97m) - pP102.CostPrice) * 2 },
                new() { ProductId = pP105.Id, Quantity = 2, UnitPrice = pP105.BasePrice, DiscountPercent = 3.00m, CostPrice = pP105.CostPrice, NetAmount = (pP105.BasePrice * 0.97m) * 2, TaxAmount = ((pP105.BasePrice * 0.97m) * 2) * 0.18m, MarginAmount = ((pP105.BasePrice * 0.97m) - pP105.CostPrice) * 2 }
            }
        };
        ComputeQuoteTotals(qTest001, 15.0m);
        context.Quotations.Add(qTest001);
        await context.SaveChangesAsync();

        // Q-TEST-002: Sales Manager approval (Bronze customer, ProBook 14 x 5, 8% discount)
        var qTest002 = new Quotation
        {
            QuotationNumber = "QT-QA-002",
            CustomerId = cust1Delhi.Id,
            SalesRepId = repUser.Id,
            Status = QuoteStatus.PendingApproval,
            ApprovalStatus = ApprovalStatus.Pending,
            CurrencyCode = "INR",
            Notes = "Q-TEST-002: 8% discount exceeds Bronze ceiling (5%). Awaiting Sales Manager authorization.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(10),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-2),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP001.Id, Quantity = 5, UnitPrice = pP001.BasePrice, DiscountPercent = 8.00m, CostPrice = pP001.CostPrice, NetAmount = (pP001.BasePrice * 0.92m) * 5, TaxAmount = ((pP001.BasePrice * 0.92m) * 5) * 0.18m, MarginAmount = ((pP001.BasePrice * 0.92m) - pP001.CostPrice) * 5 }
            }
        };
        ComputeQuoteTotals(qTest002, 45.0m);
        context.Quotations.Add(qTest002);
        await context.SaveChangesAsync();

        context.ApprovalRequests.Add(new ApprovalRequest
        {
            QuotationId = qTest002.Id,
            Level = ApprovalLevel.Manager,
            Status = ApprovalStatus.Pending,
            Sequence = 1,
            Reason = "Hardware discount of 8.00% exceeds Bronze Tier limit of 5.00%. Escalated to Sales Manager.",
            RequestedAtUtc = DateTime.UtcNow.AddDays(-2)
        });
        await context.SaveChangesAsync();

        // Q-TEST-003: Finance approval (Gold customer, WorkStation x 5, Support x 5, Cloud x 5, high discount 18%)
        var qTest003 = new Quotation
        {
            QuotationNumber = "QT-QA-003",
            CustomerId = cust4Bengaluru.Id,
            SalesRepId = repUser.Id,
            Status = QuoteStatus.PendingApproval,
            ApprovalStatus = ApprovalStatus.Pending,
            CurrencyCode = "INR",
            Notes = "Q-TEST-003: High-value package with 18% discount exceeding Gold 15% limit. Escalated through Manager to Finance.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(7),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-3),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP003.Id, Quantity = 5, UnitPrice = pP003.BasePrice, DiscountPercent = 18.00m, CostPrice = pP003.CostPrice, NetAmount = (pP003.BasePrice * 0.82m) * 5, TaxAmount = ((pP003.BasePrice * 0.82m) * 5) * 0.18m, MarginAmount = ((pP003.BasePrice * 0.82m) - pP003.CostPrice) * 5 },
                new() { ProductId = pP302.Id, Quantity = 5, UnitPrice = pP302.BasePrice, DiscountPercent = 18.00m, CostPrice = pP302.CostPrice, NetAmount = (pP302.BasePrice * 0.82m) * 5, TaxAmount = ((pP302.BasePrice * 0.82m) * 5) * 0.18m, MarginAmount = ((pP302.BasePrice * 0.82m) - pP302.CostPrice) * 5, SubscriptionPlanId = subPlanMonthly.Id },
                new() { ProductId = pP402.Id, Quantity = 5, UnitPrice = pP402.BasePrice, DiscountPercent = 18.00m, CostPrice = pP402.CostPrice, NetAmount = (pP402.BasePrice * 0.82m) * 5, TaxAmount = ((pP402.BasePrice * 0.82m) * 5) * 0.18m, MarginAmount = ((pP402.BasePrice * 0.82m) - pP402.CostPrice) * 5, SubscriptionPlanId = subPlanMonthly.Id }
            }
        };
        ComputeQuoteTotals(qTest003, 85.0m);
        context.Quotations.Add(qTest003);
        await context.SaveChangesAsync();

        context.ApprovalRequests.Add(new ApprovalRequest
        {
            QuotationId = qTest003.Id,
            Level = ApprovalLevel.Manager,
            Status = ApprovalStatus.Pending,
            Sequence = 1,
            Reason = "18% discount exceeds Gold ceiling (15%). Requires Sales Manager review before Finance Controller sign-off.",
            RequestedAtUtc = DateTime.UtcNow.AddDays(-3)
        });
        context.ApprovalRequests.Add(new ApprovalRequest
        {
            QuotationId = qTest003.Id,
            Level = ApprovalLevel.Finance,
            Status = ApprovalStatus.Pending,
            Sequence = 2,
            Reason = "Blended risk score of 85.00 exceeds Finance threshold (70.00). Requires Finance Controller authorization.",
            RequestedAtUtc = DateTime.UtcNow.AddDays(-3)
        });
        await context.SaveChangesAsync();

        // Q-TEST-004: Mixed category risk (Silver customer, Hardware 7%, Services 12%, Subscriptions 12%)
        var qTest004 = new Quotation
        {
            QuotationNumber = "QT-QA-004",
            CustomerId = cust2Ahmedabad.Id,
            SalesRepId = repUser.Id,
            Status = QuoteStatus.PendingApproval,
            ApprovalStatus = ApprovalStatus.Pending,
            CurrencyCode = "INR",
            Notes = "Q-TEST-004: Mixed category proposal. Hardware 7% (<= 10%), Services 12% (> 10%), Subscriptions 12% (> 10%). Blended risk evaluated.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(8),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-2),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP002.Id, Quantity = 3, UnitPrice = pP002.BasePrice, DiscountPercent = 7.00m, CostPrice = pP002.CostPrice, NetAmount = (pP002.BasePrice * 0.93m) * 3, TaxAmount = ((pP002.BasePrice * 0.93m) * 3) * 0.18m, MarginAmount = ((pP002.BasePrice * 0.93m) - pP002.CostPrice) * 3 },
                new() { ProductId = pP202.Id, Quantity = 3, UnitPrice = pP202.BasePrice, DiscountPercent = 12.00m, CostPrice = pP202.CostPrice, NetAmount = (pP202.BasePrice * 0.88m) * 3, TaxAmount = ((pP202.BasePrice * 0.88m) * 3) * 0.18m, MarginAmount = ((pP202.BasePrice * 0.88m) - pP202.CostPrice) * 3 },
                new() { ProductId = pP403.Id, Quantity = 3, UnitPrice = pP403.BasePrice, DiscountPercent = 12.00m, CostPrice = pP403.CostPrice, NetAmount = (pP403.BasePrice * 0.88m) * 3, TaxAmount = ((pP403.BasePrice * 0.88m) * 3) * 0.18m, MarginAmount = ((pP403.BasePrice * 0.88m) - pP403.CostPrice) * 3, SubscriptionPlanId = subPlanMonthly.Id }
            }
        };
        ComputeQuoteTotals(qTest004, 52.0m);
        context.Quotations.Add(qTest004);
        await context.SaveChangesAsync();

        context.ApprovalRequests.Add(new ApprovalRequest
        {
            QuotationId = qTest004.Id,
            Level = ApprovalLevel.Manager,
            Status = ApprovalStatus.Pending,
            Sequence = 1,
            Reason = "Services and Subscriptions discounts (12.00%) breach Silver limits (10.00%). Blended risk score 52.00 routed to Sales Manager.",
            RequestedAtUtc = DateTime.UtcNow.AddDays(-2)
        });
        await context.SaveChangesAsync();

        // Q-TEST-005: Negotiation quote (Sharma Tech, ProBook 14 x 3, 5% discount, Version 1)
        var qTest005 = new Quotation
        {
            QuotationNumber = "QT-QA-005",
            CustomerId = cust5Sharma.Id,
            SalesRepId = repUser.Id,
            Status = QuoteStatus.Draft,
            ApprovalStatus = ApprovalStatus.Approved,
            CurrencyCode = "INR",
            Version = 1,
            Notes = "Q-TEST-005: Initial 5% discount within Silver limit. Ready for customer portal negotiation and counter-offer testing.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(12),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP001.Id, Quantity = 3, UnitPrice = pP001.BasePrice, DiscountPercent = 5.00m, CostPrice = pP001.CostPrice, NetAmount = (pP001.BasePrice * 0.95m) * 3, TaxAmount = ((pP001.BasePrice * 0.95m) * 3) * 0.18m, MarginAmount = ((pP001.BasePrice * 0.95m) - pP001.CostPrice) * 3 }
            }
        };
        ComputeQuoteTotals(qTest005, 18.0m);
        context.Quotations.Add(qTest005);
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 19: DEAL HEALTH TEST SCENARIOS
        // ═══════════════════════════════════════════════════════════════════════
        // Stalled Deal (Inactive > 5 days)
        var qStalled = new Quotation
        {
            QuotationNumber = "QT-QA-STALLED",
            CustomerId = cust3Pune.Id,
            SalesRepId = rep2User.Id,
            Status = QuoteStatus.Sent,
            ApprovalStatus = ApprovalStatus.None,
            CurrencyCode = "INR",
            Notes = "DealHealth Test: Inactive sent proposal without touch for 15 days.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(20),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-15),
            UpdatedAtUtc = DateTime.UtcNow.AddDays(-15),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP002.Id, Quantity = 2, UnitPrice = pP002.BasePrice, DiscountPercent = 4.00m, CostPrice = pP002.CostPrice, NetAmount = (pP002.BasePrice * 0.96m) * 2, TaxAmount = ((pP002.BasePrice * 0.96m) * 2) * 0.18m, MarginAmount = ((pP002.BasePrice * 0.96m) - pP002.CostPrice) * 2 }
            }
        };
        ComputeQuoteTotals(qStalled, 22.0m);
        context.Quotations.Add(qStalled);

        // Discount Anomaly (25% on Bronze customer)
        var qAnomaly = new Quotation
        {
            QuotationNumber = "QT-QA-ANOMALY",
            CustomerId = cust1Delhi.Id,
            SalesRepId = repUser.Id,
            Status = QuoteStatus.Draft,
            ApprovalStatus = ApprovalStatus.None,
            CurrencyCode = "INR",
            Notes = "DealHealth Test: Statistical discount anomaly of 25% on Bronze customer.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(15),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-1),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP001.Id, Quantity = 2, UnitPrice = pP001.BasePrice, DiscountPercent = 25.00m, CostPrice = pP001.CostPrice, NetAmount = (pP001.BasePrice * 0.75m) * 2, TaxAmount = ((pP001.BasePrice * 0.75m) * 2) * 0.18m, MarginAmount = ((pP001.BasePrice * 0.75m) - pP001.CostPrice) * 2 }
            }
        };
        ComputeQuoteTotals(qAnomaly, 88.0m);
        context.Quotations.Add(qAnomaly);

        // Delivery Slippage (ExpectedCloseDate passed 5 days ago without conversion)
        var qSlippage = new Quotation
        {
            QuotationNumber = "QT-QA-SLIPPAGE",
            CustomerId = cust2Ahmedabad.Id,
            SalesRepId = repUser.Id,
            Status = QuoteStatus.Sent,
            ApprovalStatus = ApprovalStatus.None,
            CurrencyCode = "INR",
            Notes = "DealHealth Test: Close date passed 5 days ago without customer conversion.",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(-5),
            CreatedAtUtc = DateTime.UtcNow.AddDays(-14),
            UpdatedAtUtc = DateTime.UtcNow.AddDays(-6),
            Lines = new List<QuotationLine>
            {
                new() { ProductId = pP104.Id, Quantity = 4, UnitPrice = pP104.BasePrice, DiscountPercent = 5.00m, CostPrice = pP104.CostPrice, NetAmount = (pP104.BasePrice * 0.95m) * 4, TaxAmount = ((pP104.BasePrice * 0.95m) * 4) * 0.18m, MarginAmount = ((pP104.BasePrice * 0.95m) - pP104.CostPrice) * 4 }
            }
        };
        ComputeQuoteTotals(qSlippage, 30.0m);
        context.Quotations.Add(qSlippage);
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // STEP 20: AUDIT LOG & POST-SEED SUMMARY
        // ═══════════════════════════════════════════════════════════════════════
        context.AuditLogs.Add(new AuditLog
        {
            UserId = null,
            EntityName = "Database",
            EntityId = 1,
            Action = "QaDataResetAndSeed",
            Reason = "Deterministic QA test dataset initialized with 1 company, 5 customers, 24 products, 3 warehouses, historical co-purchases, and test quotes.",
            CreatedAtUtc = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var summary = new Dictionary<string, object>
        {
            ["CompanyCount"] = await context.Companies.CountAsync(),
            ["CompanyName"] = df360.Name,
            ["CompanyCode"] = df360.Code,
            ["CustomerCount"] = await context.Customers.CountAsync(),
            ["Customers"] = await context.Customers.Select(c => new { c.Id, c.Name, c.Email, Tier = c.Tier.Name }).ToListAsync(),
            ["StaffCount"] = await context.Users.CountAsync(u => u.Role != Role.Customer),
            ["Users"] = await context.Users.Select(u => new { u.Id, u.FullName, u.Email, Role = u.Role.ToString() }).ToListAsync(),
            ["ProductCount"] = await context.Products.CountAsync(),
            ["WarehouseCount"] = await context.Warehouses.CountAsync(),
            ["PriceListCount"] = await context.PriceLists.CountAsync(),
            ["DiscountRuleCount"] = await context.DiscountRules.CountAsync(),
            ["ApprovalRuleCount"] = await context.ApprovalRules.CountAsync(),
            ["SubscriptionPlanCount"] = await context.SubscriptionPlans.CountAsync(),
            ["InventoryStockRecordCount"] = await context.InventoryStocks.CountAsync(),
            ["TotalInventoryOnHand"] = await context.InventoryStocks.SumAsync(s => s.OnHand),
            ["TotalInventoryReserved"] = await context.InventoryStocks.SumAsync(s => s.Reserved),
            ["HistoricalOrderCount"] = await context.Orders.CountAsync(),
            ["QuotationCount"] = await context.Quotations.CountAsync(),
            ["DealHealthAlertsCount"] = await context.Quotations.CountAsync(q => q.Status == QuoteStatus.Draft || q.Status == QuoteStatus.PendingApproval)
        };

        return summary;
    }

    private static void ComputeQuoteTotals(Quotation q, decimal riskScore)
    {
        q.SubTotal = q.Lines.Sum(l => l.UnitPrice * l.Quantity);
        q.DiscountTotal = q.SubTotal - q.Lines.Sum(l => l.NetAmount);
        q.TaxTotal = q.Lines.Sum(l => l.TaxAmount);
        q.GrandTotal = q.Lines.Sum(l => l.NetAmount) + q.TaxTotal;
        q.CostTotal = q.Lines.Sum(l => l.CostPrice * l.Quantity);
        q.MarginAmount = q.GrandTotal - q.CostTotal - q.TaxTotal;
        q.MarginPercent = q.GrandTotal > 0 ? (q.MarginAmount / (q.GrandTotal - q.TaxTotal)) * 100 : 0;
        q.RiskScore = riskScore;
    }
}