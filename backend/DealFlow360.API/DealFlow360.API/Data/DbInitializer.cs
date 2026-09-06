using System.Text.Json;
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

        // ═══════════════════════════════════════════════════════════════════════
        // 2. CUSTOMER TIERS (Governance Ceilings)
        // ═══════════════════════════════════════════════════════════════════════
        var tiers = new List<(string Name, decimal MaxDiscount)>
        {
            ("Gold", 15.00m),
            ("Silver", 5.00m),
            ("Bronze", 3.00m)
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
        // 3. SALES TEAMS
        // ═══════════════════════════════════════════════════════════════════════
        var westSouthTeam = await context.SalesTeams.FirstOrDefaultAsync(t => t.Name == "India Enterprise Sales (West & South)");
        if (westSouthTeam == null)
        {
            westSouthTeam = new SalesTeam { Name = "India Enterprise Sales (West & South)", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
            context.SalesTeams.Add(westSouthTeam);
            await context.SaveChangesAsync();
        }

        var northEastTeam = await context.SalesTeams.FirstOrDefaultAsync(t => t.Name == "India Commercial Sales (North & East)");
        if (northEastTeam == null)
        {
            northEastTeam = new SalesTeam { Name = "India Commercial Sales (North & East)", IsActive = true, CreatedAtUtc = DateTime.UtcNow };
            context.SalesTeams.Add(northEastTeam);
            await context.SaveChangesAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 4. USERS (Single-Company Hackathon Model: Exactly 4 Active Internal Users)
        // ═══════════════════════════════════════════════════════════════════════
        var userSeeds = new List<(string Name, string Email, string Password, Role Role, int? TeamId, bool IsActive)>
        {
            // Primary Indian Personas - The 4 Active Internal Roles
            ("Arjun Mehta (Admin)", "admin@dealflow360.io", "Admin@123", Role.Admin, null, true),
            ("Arjun Mehta", "arjun.mehta@demo.dealflow360.local", "Admin@123", Role.Admin, null, true),

            ("Rohan Sharma (Sales Manager)", "manager@dealflow360.io", "Manager@123", Role.SalesManager, westSouthTeam.Id, true),
            ("Rohan Sharma", "rohan.sharma@demo.dealflow360.local", "Manager@123", Role.SalesManager, westSouthTeam.Id, true),

            ("Priya Patel (Sales Rep)", "rep@dealflow360.io", "Rep@123", Role.SalesRep, westSouthTeam.Id, true),
            ("Priya Patel", "priya.patel@demo.dealflow360.local", "Rep@123", Role.SalesRep, westSouthTeam.Id, true),

            ("Sneha Iyer (Finance Operations)", "finance@dealflow360.io", "Finance@123", Role.FinanceOperations, null, true),
            ("Sneha Iyer", "sneha.iyer@demo.dealflow360.local", "Finance@123", Role.FinanceOperations, null, true),

            // Inactive Extra Internal Personas (Enforcing single Sales Rep & Finance model)
            ("Aditya Shah", "aditya.shah@demo.dealflow360.local", "Rep@123", Role.SalesRep, westSouthTeam.Id, false),
            ("Neha Desai", "neha.desai@demo.dealflow360.local", "Rep@123", Role.SalesRep, northEastTeam.Id, false),
            ("Karan Joshi", "karan.joshi@demo.dealflow360.local", "Rep@123", Role.SalesRep, northEastTeam.Id, false),
            ("Vikram Nair", "vikram.nair@demo.dealflow360.local", "Finance@123", Role.FinanceOperations, null, false),

            // Customer Portal Users (Active clients buying from DealFlow360 Technologies Pvt. Ltd.)
            ("Rahul Verma (Customer)", "customer@dealflow360.io", "Customer@123", Role.Customer, null, true),
            ("Rahul Verma", "rahul.verma@demo.dealflow360.local", "Customer@123", Role.Customer, null, true),
            ("Ananya Gupta", "ananya.gupta@demo.dealflow360.local", "Customer@123", Role.Customer, null, true),
            ("Amit Kulkarni", "amit.kulkarni@demo.dealflow360.local", "Customer@123", Role.Customer, null, true),
            ("Pooja Shah", "pooja.shah@demo.dealflow360.local", "Customer@123", Role.Customer, null, true),
            ("Nikhil Agarwal", "nikhil.agarwal@demo.dealflow360.local", "Customer@123", Role.Customer, null, true)
        };

        foreach (var u in userSeeds)
        {
            var existingUser = await context.Users.FirstOrDefaultAsync(usr => usr.Email == u.Email);
            if (existingUser == null)
            {
                context.Users.Add(new User
                {
                    FullName = u.Name,
                    Email = u.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.Password),
                    Role = u.Role,
                    SalesTeamId = u.TeamId,
                    IsActive = u.IsActive,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                existingUser.FullName = u.Name;
                existingUser.PasswordHash = BCrypt.Net.BCrypt.HashPassword(u.Password);
                existingUser.Role = u.Role;
                if (u.TeamId.HasValue) existingUser.SalesTeamId = u.TeamId;
                existingUser.IsActive = u.IsActive;
            }
        }
        await context.SaveChangesAsync();

        var repUser = await context.Users.FirstAsync(u => u.Email == "rep@dealflow360.io");
        var managerUser = await context.Users.FirstAsync(u => u.Email == "manager@dealflow360.io");
        var adityaUser = await context.Users.FirstAsync(u => u.Email == "aditya.shah@demo.dealflow360.local");
        var nehaUser = await context.Users.FirstAsync(u => u.Email == "neha.desai@demo.dealflow360.local");
        var karanUser = await context.Users.FirstAsync(u => u.Email == "karan.joshi@demo.dealflow360.local");

        westSouthTeam.ManagerId = managerUser.Id;
        northEastTeam.ManagerId = managerUser.Id;
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 5. INDIAN B2B CUSTOMERS
        // ═══════════════════════════════════════════════════════════════════════
        var customerSeeds = new List<(string Name, string Email, string Phone, int TierId, int RepId)>
        {
            // Gold Tier (15% max discount)
            ("Sharma Technologies Pvt. Ltd.", "procurement@sharmatech.in", "+91-22-68901234", goldTier.Id, repUser.Id),
            ("Mumbai Office Solutions Pvt. Ltd.", "ops@mumbaioffice.in", "+91-22-49123456", goldTier.Id, repUser.Id),
            ("Bengaluru CloudWorks Pvt. Ltd.", "it@bengalurucloud.in", "+91-80-41235678", goldTier.Id, repUser.Id),

            // Silver Tier (10% max discount)
            ("Patel Industrial Systems Pvt. Ltd.", "purchase@patelindustrial.in", "+91-261-2789012", silverTier.Id, repUser.Id),
            ("Ahmedabad Manufacturing Solutions Pvt. Ltd.", "commercial@ahmedabadmfg.in", "+91-79-26543210", silverTier.Id, repUser.Id),
            ("Pune Enterprise Networks Pvt. Ltd.", "enterprise@punenetworks.in", "+91-20-67123450", silverTier.Id, repUser.Id),
            ("Chennai Digital Infrastructure Pvt. Ltd.", "it@chennaidigital.in", "+91-44-48901234", silverTier.Id, repUser.Id),

            // Bronze Tier (5% max discount)
            ("Delhi Business Automation Pvt. Ltd.", "admin@delhibusiness.in", "+91-11-23456789", bronzeTier.Id, repUser.Id),
            ("Hyderabad Data Systems Pvt. Ltd.", "support@hyderabaddata.in", "+91-40-66789012", bronzeTier.Id, repUser.Id),
            ("Jaipur Smart Workplace Pvt. Ltd.", "hello@jaipursmart.in", "+91-141-2890123", bronzeTier.Id, repUser.Id)
        };

        foreach (var cs in customerSeeds)
        {
            var cust = await context.Customers.FirstOrDefaultAsync(c => c.Name == cs.Name);
            if (cust == null)
            {
                context.Customers.Add(new Customer
                {
                    Name = cs.Name,
                    Email = cs.Email,
                    Phone = cs.Phone,
                    TierId = cs.TierId,
                    CurrencyCode = "INR",
                    AssignedSalesRepId = cs.RepId,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                cust.Email = cs.Email;
                cust.Phone = cs.Phone;
                cust.TierId = cs.TierId;
                cust.CurrencyCode = "INR";
                cust.AssignedSalesRepId = cs.RepId;
                cust.IsActive = true;
            }
        }
        await context.SaveChangesAsync();

        var sharmaTech = await context.Customers.FirstAsync(c => c.Name == "Sharma Technologies Pvt. Ltd.");
        var mumbaiOffice = await context.Customers.FirstAsync(c => c.Name == "Mumbai Office Solutions Pvt. Ltd.");
        var bengaluruCloud = await context.Customers.FirstAsync(c => c.Name == "Bengaluru CloudWorks Pvt. Ltd.");
        var ahmedabadMfg = await context.Customers.FirstAsync(c => c.Name == "Ahmedabad Manufacturing Solutions Pvt. Ltd.");
        var puneNetworks = await context.Customers.FirstAsync(c => c.Name == "Pune Enterprise Networks Pvt. Ltd.");
        var chennaiDigital = await context.Customers.FirstAsync(c => c.Name == "Chennai Digital Infrastructure Pvt. Ltd.");
        var delhiBusiness = await context.Customers.FirstAsync(c => c.Name == "Delhi Business Automation Pvt. Ltd.");
        var jaipurSmart = await context.Customers.FirstAsync(c => c.Name == "Jaipur Smart Workplace Pvt. Ltd.");

        // Associate Customer Portal Users
        var customerUsers = new List<(string Email, int CustId)>
        {
            ("customer@dealflow360.io", sharmaTech.Id),
            ("rahul.verma@demo.dealflow360.local", sharmaTech.Id),
            ("ananya.gupta@demo.dealflow360.local", bengaluruCloud.Id),
            ("amit.kulkarni@demo.dealflow360.local", puneNetworks.Id),
            ("pooja.shah@demo.dealflow360.local", ahmedabadMfg.Id),
            ("nikhil.agarwal@demo.dealflow360.local", delhiBusiness.Id)
        };
        foreach (var cu in customerUsers)
        {
            var usr = await context.Users.FirstOrDefaultAsync(u => u.Email == cu.Email);
            if (usr != null)
            {
                usr.CustomerId = cu.CustId;
            }
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 6. SINGLE COMPANY HACKATHON MODEL (DealFlow360 Technologies Pvt. Ltd.)
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
        }
        else
        {
            df360.Name = "DealFlow360 Technologies Pvt. Ltd.";
            df360.Description = "DealFlow360 Technologies Pvt. Ltd. - Premier enterprise digital sales, IT hardware and cloud infrastructure solutions provider in India.";
            df360.Website = "https://www.dealflow360.in";
            df360.ContactEmail = "sales@dealflow360.in";
            df360.ContactPhone = "+91-79-4000-1234";
            df360.IsActive = true;
        }
        await context.SaveChangesAsync();

        // Deactivate all other internal/vendor companies so exactly 1 internal company is active
        var allOtherCompanies = await context.Companies
            .Where(c => c.Code != "DF360")
            .ToListAsync();
        foreach (var oc in allOtherCompanies)
        {
            oc.IsActive = false;
        }
        await context.SaveChangesAsync();

        // Compatibility references for existing seed definitions
        var tbs = df360;
        var ict = df360;
        var nsn = df360;
        var sdi = df360;

        // ═══════════════════════════════════════════════════════════════════════
        // 7. PRODUCT CATEGORIES
        // ═══════════════════════════════════════════════════════════════════════
        var categories = new List<(string Name, string Desc)>
        {
            ("Hardware", "Enterprise computing, commercial laptops, displays, docking stations, and networking gear."),
            ("Services", "Certified on-site deployment, structured cabling, architecture setup, and annual IT maintenance."),
            ("Subscriptions", "Recurring software licenses, cloud backup, endpoint cybersecurity, and 24/7 priority SLA support.")
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
        }
        await context.SaveChangesAsync();

        var hwCat = await context.ProductCategories.FirstAsync(c => c.Name == "Hardware");
        var srvCat = await context.ProductCategories.FirstAsync(c => c.Name == "Services");
        var subCat = await context.ProductCategories.FirstAsync(c => c.Name == "Subscriptions");

        // ═══════════════════════════════════════════════════════════════════════
        // 8. REALISTIC INDIAN B2B PRODUCTS (INR)
        // ═══════════════════════════════════════════════════════════════════════
        var productSeeds = new List<(string SKU, string Name, string Desc, int CatId, int CompId, ProductType Type, decimal Base, decimal Cost, decimal Tax, string Unit)>
        {
            // Hardware
            ("HW-LAP-14", "Business Laptop Pro 14\"", "Intel Core Ultra 7, 16GB RAM, 512GB SSD, Anti-glare FHD IPS Display with 3-Yr Onsite Warranty.", hwCat.Id, tbs.Id, ProductType.OneTime, 78500.00m, 52000.00m, 18.00m, "Unit"),
            ("HW-LAP-16", "Enterprise Laptop Pro 16\"", "Intel Core Ultra 9, 32GB RAM, 1TB SSD, 2.8K OLED Display, Mil-Spec Certified Carbon Chassis.", hwCat.Id, tbs.Id, ProductType.OneTime, 112000.00m, 75000.00m, 18.00m, "Unit"),
            ("HW-DOCK-C", "USB-C Business Dock", "Dual 4K HDMI/DisplayPort, 100W Power Delivery, Gigabit Ethernet, 5x USB 3.2 Ports.", hwCat.Id, tbs.Id, ProductType.OneTime, 12500.00m, 7000.00m, 18.00m, "Unit"),
            ("HW-MON-24", "24-inch Business Monitor", "FHD 1080p IPS, 99% sRGB, Ergonomic Height/Pivot Stand, Low Blue Light Certification.", hwCat.Id, ict.Id, ProductType.OneTime, 14500.00m, 9500.00m, 18.00m, "Unit"),
            ("HW-MON-27", "27-inch 4K Business Monitor", "UHD 3840x2160 IPS, HDR400, USB-C Hub 90W PD, Daisy-chain DisplayPort Support.", hwCat.Id, ict.Id, ProductType.OneTime, 29500.00m, 18000.00m, 18.00m, "Unit"),
            ("HW-KM-W", "Wireless Keyboard & Mouse Combo", "Quiet-touch scissor keys, rechargeable via USB-C, 2.4GHz & Multi-device Bluetooth 5.2.", hwCat.Id, tbs.Id, ProductType.OneTime, 2800.00m, 1400.00m, 18.00m, "Set"),
            ("HW-RTR-W6", "Enterprise Wi-Fi 6 Router", "AX6000 Multi-Gigabit Mesh Router, Hardware Firewall, VPN Gateway, 250+ Concurrent Clients.", hwCat.Id, nsn.Id, ProductType.OneTime, 18500.00m, 11000.00m, 18.00m, "Unit"),

            // Services
            ("SRV-INST-01", "Installation & Setup Service", "Certified engineering team on-site installation, device staging, and OS policy rollout.", srvCat.Id, tbs.Id, ProductType.OneTime, 12000.00m, 4000.00m, 18.00m, "Service"),
            ("SRV-DEPL-01", "On-site Deployment Service", "Multi-floor structured hardware deployment, workstation cable routing, and user testing.", srvCat.Id, tbs.Id, ProductType.OneTime, 18000.00m, 6000.00m, 18.00m, "Service"),
            ("SRV-SUPP-ANN", "Annual IT Support Contract", "Dedicated account engineer, 4-hour SLA response, quarterly preventive maintenance.", srvCat.Id, sdi.Id, ProductType.OneTime, 48000.00m, 15000.00m, 18.00m, "Year"),
            ("SRV-NET-CFG", "Network Configuration Service", "VLAN segmentation, firewall rule provisioning, Wi-Fi heatmapping, and QoS tuning.", srvCat.Id, nsn.Id, ProductType.OneTime, 15000.00m, 5000.00m, 18.00m, "Service"),
            ("SRV-MIGR-01", "Data Migration Service", "Secure enterprise cloud/on-prem file server and directory migration with zero downtime.", srvCat.Id, sdi.Id, ProductType.OneTime, 22000.00m, 7500.00m, 18.00m, "Service"),
            ("SRV-ONB-DEV", "Employee Device Onboarding Service", "Pre-provisioning MDM profiles, SSO credential enrollment, and asset tagging per device.", srvCat.Id, tbs.Id, ProductType.OneTime, 8500.00m, 2500.00m, 18.00m, "Batch"),

            // Subscriptions
            ("SUB-PREM-M", "Premium Support Subscription", "24/7 dedicated telephone, remote desktop and ticket support with 1-hour critical response.", subCat.Id, sdi.Id, ProductType.Subscription, 4500.00m, 1000.00m, 18.00m, "Seat/Month"),
            ("SUB-BCK-M", "Cloud Backup Pro", "Automated daily endpoint cloud snapshot, AES-256 encryption, ransomware restore guarantee.", subCat.Id, sdi.Id, ProductType.Subscription, 2500.00m, 600.00m, 18.00m, "Device/Month"),
            ("SUB-SEC-M", "Endpoint Security Advanced", "Next-gen antivirus, EDR threat hunting, USB access control, and zero-day exploit defense.", subCat.Id, sdi.Id, ProductType.Subscription, 1800.00m, 400.00m, 18.00m, "Seat/Month"),
            ("SUB-PROD-M", "Business Productivity Suite", "Enterprise collaboration, secure cloud storage, team messaging, and shared document editing.", subCat.Id, sdi.Id, ProductType.Subscription, 3200.00m, 900.00m, 18.00m, "User/Month"),
            ("SUB-MDM-M", "Device Management Pro", "Centralized remote lock/wipe, automated security patches, app catalog distribution.", subCat.Id, sdi.Id, ProductType.Subscription, 2000.00m, 500.00m, 18.00m, "Device/Month")
        };

        foreach (var p in productSeeds)
        {
            var prod = await context.Products.FirstOrDefaultAsync(item => item.SKU == p.SKU);
            if (prod == null)
            {
                context.Products.Add(new Product
                {
                    SKU = p.SKU,
                    Name = p.Name,
                    Description = p.Desc,
                    CategoryId = p.CatId,
                    CompanyId = p.CompId,
                    ProductType = p.Type,
                    BasePrice = p.Base,
                    CostPrice = p.Cost,
                    TaxRate = p.Tax,
                    Unit = p.Unit,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                prod.Name = p.Name;
                prod.Description = p.Desc;
                prod.CategoryId = p.CatId;
                prod.CompanyId = p.CompId;
                prod.ProductType = p.Type;
                prod.BasePrice = p.Base;
                prod.CostPrice = p.Cost;
                prod.TaxRate = p.Tax;
                prod.Unit = p.Unit;
                prod.IsActive = true;
            }
        }
        await context.SaveChangesAsync();

        // Assign all active catalog products to DealFlow360 Technologies Pvt. Ltd.
        var allActiveProducts = await context.Products
            .Where(p => p.IsActive && !p.SKU.StartsWith("SKU-AUD") && !p.SKU.StartsWith("PROD-TEST") && !p.Name.StartsWith("Audit"))
            .ToListAsync();
        foreach (var p in allActiveProducts)
        {
            p.CompanyId = df360.Id;
            p.IsActive = true;
        }

        // Deactivate any legacy audit/test products
        var legacyProducts = await context.Products
            .Where(p => p.SKU.StartsWith("SKU-AUD") || p.SKU.StartsWith("PROD-TEST") || p.Name.StartsWith("Audit"))
            .ToListAsync();
        foreach (var lp in legacyProducts)
        {
            lp.IsActive = false;
        }
        await context.SaveChangesAsync();

        var pLaptop14 = await context.Products.FirstAsync(p => p.SKU == "HW-LAP-14");
        var pLaptop16 = await context.Products.FirstAsync(p => p.SKU == "HW-LAP-16");
        var pDock = await context.Products.FirstAsync(p => p.SKU == "HW-DOCK-C");
        var pMon24 = await context.Products.FirstAsync(p => p.SKU == "HW-MON-24");
        var pMon27 = await context.Products.FirstAsync(p => p.SKU == "HW-MON-27");
        var pKmCombo = await context.Products.FirstAsync(p => p.SKU == "HW-KM-W");
        var pRouter = await context.Products.FirstAsync(p => p.SKU == "HW-RTR-W6");

        var pSrvInst = await context.Products.FirstAsync(p => p.SKU == "SRV-INST-01");
        var pSrvDepl = await context.Products.FirstAsync(p => p.SKU == "SRV-DEPL-01");
        var pSrvSupp = await context.Products.FirstAsync(p => p.SKU == "SRV-SUPP-ANN");
        var pSrvNet = await context.Products.FirstAsync(p => p.SKU == "SRV-NET-CFG");

        var pSubPrem = await context.Products.FirstAsync(p => p.SKU == "SUB-PREM-M");
        var pSubBck = await context.Products.FirstAsync(p => p.SKU == "SUB-BCK-M");

        // 8b. Product Variants
        var laptop14Variants = new List<(string Name, decimal AddPrice)>
        {
            ("32GB RAM / 1TB NVMe Performance Edition", 18000.00m),
            ("64GB RAM / 2TB NVMe Workstation Edition", 38000.00m)
        };
        foreach (var (vName, vAdd) in laptop14Variants)
        {
            var v = await context.ProductVariants.FirstOrDefaultAsync(pv => pv.ProductId == pLaptop14.Id && pv.Name == vName);
            if (v == null)
            {
                context.ProductVariants.Add(new ProductVariant
                {
                    ProductId = pLaptop14.Id,
                    Name = vName,
                    AdditionalPrice = vAdd,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 9. PRICE LISTS (INR)
        // ═══════════════════════════════════════════════════════════════════════
        var standardPl = await context.PriceLists.Include(pl => pl.Items).FirstOrDefaultAsync(pl => pl.Name == "Standard Commercial Price List 2026 (INR)");
        if (standardPl == null)
        {
            standardPl = new PriceList
            {
                Name = "Standard Commercial Price List 2026 (INR)",
                CurrencyCode = "INR",
                TierId = silverTier.Id,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow,
                Items = new List<PriceListItem>
                {
                    new() { ProductId = pLaptop14.Id, UnitPrice = 76000.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pLaptop16.Id, UnitPrice = 108000.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pDock.Id, UnitPrice = 12000.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pMon24.Id, UnitPrice = 13800.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pMon27.Id, UnitPrice = 28500.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pKmCombo.Id, UnitPrice = 2600.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pRouter.Id, UnitPrice = 17500.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pSrvInst.Id, UnitPrice = 11500.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pSrvSupp.Id, UnitPrice = 45000.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pSubPrem.Id, UnitPrice = 4200.00m, CreatedAtUtc = DateTime.UtcNow }
                }
            };
            context.PriceLists.Add(standardPl);
            await context.SaveChangesAsync();
        }

        var goldPl = await context.PriceLists.Include(pl => pl.Items).FirstOrDefaultAsync(pl => pl.Name == "Enterprise Gold Tier Price List 2026 (INR)");
        if (goldPl == null)
        {
            goldPl = new PriceList
            {
                Name = "Enterprise Gold Tier Price List 2026 (INR)",
                CurrencyCode = "INR",
                TierId = goldTier.Id,
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow,
                Items = new List<PriceListItem>
                {
                    new() { ProductId = pLaptop14.Id, UnitPrice = 73500.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pLaptop16.Id, UnitPrice = 104000.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pDock.Id, UnitPrice = 11200.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pMon27.Id, UnitPrice = 27000.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pSrvSupp.Id, UnitPrice = 42000.00m, CreatedAtUtc = DateTime.UtcNow },
                    new() { ProductId = pSubPrem.Id, UnitPrice = 3800.00m, CreatedAtUtc = DateTime.UtcNow }
                }
            };
            context.PriceLists.Add(goldPl);
            await context.SaveChangesAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 10. DISCOUNT GOVERNANCE RULES (Tier Ceilings & Category Ceilings)
        // ═══════════════════════════════════════════════════════════════════════
        var discountRules = new List<DiscountRule>
        {
            // Global Ceilings
            new() { TierId = goldTier.Id, CategoryId = null, MaxDiscountPercent = 15.00m, ManagerThreshold = 10.00m, FinanceThreshold = 15.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = null, MaxDiscountPercent = 5.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = bronzeTier.Id, CategoryId = null, MaxDiscountPercent = 3.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Gold Category Specific Ceilings (Services & Subscriptions capped at 10%)
            new() { TierId = goldTier.Id, CategoryId = hwCat.Id, MaxDiscountPercent = 15.00m, ManagerThreshold = 8.00m, FinanceThreshold = 12.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = srvCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = goldTier.Id, CategoryId = subCat.Id, MaxDiscountPercent = 10.00m, ManagerThreshold = 6.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Silver Category Specific Ceilings (Hardware capped at 5%, Services capped at 5%)
            new() { TierId = silverTier.Id, CategoryId = hwCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = srvCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = silverTier.Id, CategoryId = subCat.Id, MaxDiscountPercent = 5.00m, ManagerThreshold = 5.00m, FinanceThreshold = 10.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },

            // Bronze Category Specific Ceilings (Capped at 3%)
            new() { TierId = bronzeTier.Id, CategoryId = hwCat.Id, MaxDiscountPercent = 3.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = bronzeTier.Id, CategoryId = srvCat.Id, MaxDiscountPercent = 3.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { TierId = bronzeTier.Id, CategoryId = subCat.Id, MaxDiscountPercent = 3.00m, ManagerThreshold = 3.00m, FinanceThreshold = 5.00m, IsActive = true, CreatedAtUtc = DateTime.UtcNow }
        };

        foreach (var dr in discountRules)
        {
            var rule = await context.DiscountRules.FirstOrDefaultAsync(r => r.TierId == dr.TierId && r.CategoryId == dr.CategoryId);
            if (rule == null)
            {
                context.DiscountRules.Add(dr);
            }
            else
            {
                rule.MaxDiscountPercent = dr.MaxDiscountPercent;
                rule.ManagerThreshold = dr.ManagerThreshold;
                rule.FinanceThreshold = dr.FinanceThreshold;
                rule.IsActive = true;
            }
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 11. APPROVAL RULES
        // ═══════════════════════════════════════════════════════════════════════
        var approvalRules = new List<ApprovalRule>
        {
            new() { Level = ApprovalLevel.None, MinRisk = 0.00m, MaxRisk = 29.99m, RequiredRole = "None", Sequence = 1, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { Level = ApprovalLevel.Manager, MinRisk = 30.00m, MaxRisk = 69.99m, RequiredRole = "SalesManager", Sequence = 2, IsActive = true, CreatedAtUtc = DateTime.UtcNow },
            new() { Level = ApprovalLevel.Finance, MinRisk = 70.00m, MaxRisk = 100.00m, RequiredRole = "FinanceOperations", Sequence = 3, IsActive = true, CreatedAtUtc = DateTime.UtcNow }
        };

        foreach (var ar in approvalRules)
        {
            var exists = await context.ApprovalRules.AnyAsync(r => r.Level == ar.Level && r.RequiredRole == ar.RequiredRole);
            if (!exists)
            {
                context.ApprovalRules.Add(ar);
            }
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 12. INDIAN WAREHOUSES & INVENTORY STOCK
        // ═══════════════════════════════════════════════════════════════════════
        var warehouseSeeds = new List<(string Name, decimal Weight)>
        {
            ("Mumbai Main Warehouse (Mumbai, Maharashtra)", 1.00m),
            ("Pune Distribution Center (Pune, Maharashtra)", 1.20m),
            ("Ahmedabad Regional Warehouse (Ahmedabad, Gujarat)", 1.30m),
            ("Bengaluru Fulfillment Center (Bengaluru, Karnataka)", 1.50m)
        };

        foreach (var (wName, wWeight) in warehouseSeeds)
        {
            var wh = await context.Warehouses.FirstOrDefaultAsync(w => w.Name == wName);
            if (wh == null)
            {
                context.Warehouses.Add(new Warehouse
                {
                    Name = wName,
                    ShippingCostWeight = wWeight,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        await context.SaveChangesAsync();

        var whMumbai = await context.Warehouses.FirstAsync(w => w.Name.StartsWith("Mumbai Main"));
        var whPune = await context.Warehouses.FirstAsync(w => w.Name.StartsWith("Pune Distribution"));
        var whAhmedabad = await context.Warehouses.FirstAsync(w => w.Name.StartsWith("Ahmedabad Regional"));
        var whBengaluru = await context.Warehouses.FirstAsync(w => w.Name.StartsWith("Bengaluru Fulfillment"));

        // Stock Matrix
        var stockSeeds = new List<(int WhId, int ProdId, int OnHand)>
        {
            // Business Laptop Pro 14
            (whMumbai.Id, pLaptop14.Id, 25),
            (whPune.Id, pLaptop14.Id, 18),
            (whAhmedabad.Id, pLaptop14.Id, 12),
            (whBengaluru.Id, pLaptop14.Id, 20),

            // Enterprise Laptop Pro 16
            (whMumbai.Id, pLaptop16.Id, 15),
            (whPune.Id, pLaptop16.Id, 10),
            (whAhmedabad.Id, pLaptop16.Id, 8),
            (whBengaluru.Id, pLaptop16.Id, 14),

            // USB-C Dock
            (whMumbai.Id, pDock.Id, 50),
            (whPune.Id, pDock.Id, 35),
            (whAhmedabad.Id, pDock.Id, 20),
            (whBengaluru.Id, pDock.Id, 40),

            // 24" Monitor
            (whMumbai.Id, pMon24.Id, 30),
            (whPune.Id, pMon24.Id, 25),
            (whAhmedabad.Id, pMon24.Id, 15),
            (whBengaluru.Id, pMon24.Id, 25),

            // 27" 4K Monitor
            (whMumbai.Id, pMon27.Id, 20),
            (whPune.Id, pMon27.Id, 15),
            (whAhmedabad.Id, pMon27.Id, 10),
            (whBengaluru.Id, pMon27.Id, 18),

            // Wireless Keyboard Combo
            (whMumbai.Id, pKmCombo.Id, 100),
            (whPune.Id, pKmCombo.Id, 75),
            (whAhmedabad.Id, pKmCombo.Id, 50),
            (whBengaluru.Id, pKmCombo.Id, 80),

            // Enterprise Router
            (whMumbai.Id, pRouter.Id, 25),
            (whPune.Id, pRouter.Id, 20),
            (whAhmedabad.Id, pRouter.Id, 12),
            (whBengaluru.Id, pRouter.Id, 18)
        };

        foreach (var ss in stockSeeds)
        {
            var st = await context.InventoryStocks.FirstOrDefaultAsync(s => s.WarehouseId == ss.WhId && s.ProductId == ss.ProdId);
            if (st == null)
            {
                context.InventoryStocks.Add(new InventoryStock
                {
                    WarehouseId = ss.WhId,
                    ProductId = ss.ProdId,
                    OnHand = ss.OnHand,
                    Reserved = 0,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                st.OnHand = ss.OnHand;
            }
        }
        await context.SaveChangesAsync();

        // Replenishment Rules
        var replSeeds = new List<(int WhId, int ProdId, int ReorderLevel, int ReorderQty)>
        {
            (whMumbai.Id, pLaptop14.Id, 10, 25),
            (whPune.Id, pLaptop14.Id, 8, 20),
            (whMumbai.Id, pDock.Id, 20, 50),
            (whBengaluru.Id, pLaptop16.Id, 5, 15)
        };
        foreach (var r in replSeeds)
        {
            var exists = await context.ReplenishmentRules.AnyAsync(rr => rr.WarehouseId == r.WhId && rr.ProductId == r.ProdId);
            if (!exists)
            {
                context.ReplenishmentRules.Add(new ReplenishmentRule
                {
                    WarehouseId = r.WhId,
                    ProductId = r.ProdId,
                    ReorderLevel = r.ReorderLevel,
                    ReorderQuantity = r.ReorderQty,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 13. SUBSCRIPTION PLANS
        // ═══════════════════════════════════════════════════════════════════════
        var planSeeds = new List<(string Name, string Freq, int Months)>
        {
            ("Monthly Enterprise Support Plan", "Monthly", 1),
            ("Quarterly Enterprise Cloud Backup Plan", "Quarterly", 3),
            ("Annual Enterprise Infrastructure Plan", "Yearly", 12)
        };
        foreach (var (pName, pFreq, pMonths) in planSeeds)
        {
            var pln = await context.SubscriptionPlans.FirstOrDefaultAsync(sp => sp.Name == pName);
            if (pln == null)
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
        }
        await context.SaveChangesAsync();

        var subPlanMonthly = await context.SubscriptionPlans.FirstAsync(sp => sp.BillingFrequency == "Monthly");

        // ═══════════════════════════════════════════════════════════════════════
        // 14. UPSELL & CROSS-SELL RULES
        // ═══════════════════════════════════════════════════════════════════════
        var recRules = new List<(int TriggerId, int SuggId, string Type, int Score)>
        {
            (pLaptop14.Id, pDock.Id, "CrossSell", 90),
            (pLaptop14.Id, pMon27.Id, "CrossSell", 85),
            (pLaptop14.Id, pSubPrem.Id, "Upsell", 95),
            (pLaptop16.Id, pDock.Id, "CrossSell", 92),
            (pLaptop16.Id, pSubPrem.Id, "Upsell", 98),
            (pRouter.Id, pSrvNet.Id, "CrossSell", 95),
            (pRouter.Id, pSrvSupp.Id, "Upsell", 88)
        };

        foreach (var rr in recRules)
        {
            var exists = await context.UpsellCrossSellRules.AnyAsync(r => r.TriggerProductId == rr.TriggerId && r.SuggestedProductId == rr.SuggId);
            if (!exists)
            {
                context.UpsellCrossSellRules.Add(new UpsellCrossSellRule
                {
                    TriggerProductId = rr.TriggerId,
                    SuggestedProductId = rr.SuggId,
                    RuleType = rr.Type,
                    Score = rr.Score,
                    IsPromoted = true,
                    IsActive = true,
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 15. SALES REPRESENTATIVE ROUTING ASSIGNMENTS (Priya Patel as primary for DF360)
        // ═══════════════════════════════════════════════════════════════════════
        // Deactivate non-primary assignments
        var oldAssignments = await context.SalesAssignments.ToListAsync();
        foreach (var oa in oldAssignments)
        {
            if (oa.CompanyId != df360.Id || oa.SalesRepresentativeId != repUser.Id)
            {
                oa.IsActive = false;
            }
        }

        var primaryAssignment = await context.SalesAssignments.FirstOrDefaultAsync(a => a.CompanyId == df360.Id && a.SalesRepresentativeId == repUser.Id && a.CategoryId == null);
        if (primaryAssignment == null)
        {
            context.SalesAssignments.Add(new SalesAssignment
            {
                CompanyId = df360.Id,
                SalesRepresentativeId = repUser.Id,
                CategoryId = null,
                IsDefault = true,
                Priority = 100,
                Notes = "Priya Patel is the dedicated primary Enterprise Sales Representative for DealFlow360 Technologies Pvt. Ltd.",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            });
        }
        else
        {
            primaryAssignment.IsDefault = true;
            primaryAssignment.Priority = 100;
            primaryAssignment.IsActive = true;
            primaryAssignment.Notes = "Priya Patel is the dedicated primary Enterprise Sales Representative for DealFlow360 Technologies Pvt. Ltd.";
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 16. CONNECTED DEMO WORLD: QUOTATIONS ACROSS ALL LIFECYCLE STAGES
        // ═══════════════════════════════════════════════════════════════════════

        // QUOTE 1 (Draft - Safe quote within 5% Bronze tier)
        var q1 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0001");
        if (q1 == null)
        {
            q1 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0001",
                CustomerId = jaipurSmart.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.Draft,
                ApprovalStatus = ApprovalStatus.None,
                CurrencyCode = "INR",
                Notes = "Draft hardware proposal for Jaipur smart office expansion.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(14),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-2),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pLaptop14.Id,
                        Quantity = 2,
                        UnitPrice = pLaptop14.BasePrice,
                        DiscountPercent = 2.50m,
                        CostPrice = pLaptop14.CostPrice,
                        NetAmount = (pLaptop14.BasePrice * 0.975m) * 2,
                        TaxAmount = ((pLaptop14.BasePrice * 0.975m) * 2) * 0.18m,
                        MarginAmount = ((pLaptop14.BasePrice * 0.975m) - pLaptop14.CostPrice) * 2
                    },
                    new()
                    {
                        ProductId = pKmCombo.Id,
                        Quantity = 2,
                        UnitPrice = pKmCombo.BasePrice,
                        DiscountPercent = 2.00m,
                        CostPrice = pKmCombo.CostPrice,
                        NetAmount = (pKmCombo.BasePrice * 0.98m) * 2,
                        TaxAmount = ((pKmCombo.BasePrice * 0.98m) * 2) * 0.18m,
                        MarginAmount = ((pKmCombo.BasePrice * 0.98m) - pKmCombo.CostPrice) * 2
                    }
                }
            };
            q1.SubTotal = q1.Lines.Sum(l => l.UnitPrice * l.Quantity);
            q1.DiscountTotal = q1.SubTotal - q1.Lines.Sum(l => l.NetAmount);
            q1.TaxTotal = q1.Lines.Sum(l => l.TaxAmount);
            q1.GrandTotal = q1.Lines.Sum(l => l.NetAmount) + q1.TaxTotal;
            q1.CostTotal = q1.Lines.Sum(l => l.CostPrice * l.Quantity);
            q1.MarginAmount = q1.GrandTotal - q1.CostTotal - q1.TaxTotal;
            q1.MarginPercent = q1.GrandTotal > 0 ? (q1.MarginAmount / (q1.GrandTotal - q1.TaxTotal)) * 100 : 0;
            q1.RiskScore = 15.0m;
            context.Quotations.Add(q1);
            await context.SaveChangesAsync();
        }

        // QUOTE 2 (PendingApproval - Scenario B: Service discount 14% > 10% ceiling -> Manager Approval)
        var q2 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0002");
        if (q2 == null)
        {
            q2 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0002",
                CustomerId = sharmaTech.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.PendingApproval,
                ApprovalStatus = ApprovalStatus.Pending,
                CurrencyCode = "INR",
                Notes = "Executive workstation refresh proposal for Sharma Technologies BKC office.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(10),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-3),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pLaptop16.Id,
                        Quantity = 3,
                        UnitPrice = pLaptop16.BasePrice,
                        DiscountPercent = 8.00m,
                        CostPrice = pLaptop16.CostPrice,
                        NetAmount = (pLaptop16.BasePrice * 0.92m) * 3,
                        TaxAmount = ((pLaptop16.BasePrice * 0.92m) * 3) * 0.18m,
                        MarginAmount = ((pLaptop16.BasePrice * 0.92m) - pLaptop16.CostPrice) * 3
                    },
                    new()
                    {
                        ProductId = pSrvDepl.Id,
                        Quantity = 2,
                        UnitPrice = pSrvDepl.BasePrice,
                        DiscountPercent = 14.00m,
                        CostPrice = pSrvDepl.CostPrice,
                        NetAmount = (pSrvDepl.BasePrice * 0.86m) * 2,
                        TaxAmount = ((pSrvDepl.BasePrice * 0.86m) * 2) * 0.18m,
                        MarginAmount = ((pSrvDepl.BasePrice * 0.86m) - pSrvDepl.CostPrice) * 2
                    }
                }
            };
            q2.SubTotal = q2.Lines.Sum(l => l.UnitPrice * l.Quantity);
            q2.DiscountTotal = q2.SubTotal - q2.Lines.Sum(l => l.NetAmount);
            q2.TaxTotal = q2.Lines.Sum(l => l.TaxAmount);
            q2.GrandTotal = q2.Lines.Sum(l => l.NetAmount) + q2.TaxTotal;
            q2.CostTotal = q2.Lines.Sum(l => l.CostPrice * l.Quantity);
            q2.MarginAmount = q2.GrandTotal - q2.CostTotal - q2.TaxTotal;
            q2.MarginPercent = q2.GrandTotal > 0 ? (q2.MarginAmount / (q2.GrandTotal - q2.TaxTotal)) * 100 : 0;
            q2.RiskScore = 48.0m;
            context.Quotations.Add(q2);
            await context.SaveChangesAsync();

            context.ApprovalRequests.Add(new ApprovalRequest
            {
                QuotationId = q2.Id,
                Level = ApprovalLevel.Manager,
                Status = ApprovalStatus.Pending,
                Sequence = 1,
                Reason = "Service discount of 14.00% exceeds Services Category ceiling of 10.00%. Escalated to Sales Manager.",
                RequestedAtUtc = DateTime.UtcNow.AddDays(-1)
            });
            await context.SaveChangesAsync();
        }

        // QUOTE 3 (PendingApproval - Scenario C: Blended risk score >= 70 -> Finance Approval)
        var q3 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0003");
        if (q3 == null)
        {
            q3 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0003",
                CustomerId = mumbaiOffice.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.PendingApproval,
                ApprovalStatus = ApprovalStatus.Pending,
                CurrencyCode = "INR",
                Notes = "Multi-line competitive displacement deal. Aggressive pricing package requiring Finance sign-off.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(7),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-4),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pLaptop14.Id,
                        Quantity = 15,
                        UnitPrice = pLaptop14.BasePrice,
                        DiscountPercent = 14.80m,
                        CostPrice = pLaptop14.CostPrice,
                        NetAmount = (pLaptop14.BasePrice * 0.852m) * 15,
                        TaxAmount = ((pLaptop14.BasePrice * 0.852m) * 15) * 0.18m,
                        MarginAmount = ((pLaptop14.BasePrice * 0.852m) - pLaptop14.CostPrice) * 15
                    },
                    new()
                    {
                        ProductId = pDock.Id,
                        Quantity = 15,
                        UnitPrice = pDock.BasePrice,
                        DiscountPercent = 15.00m,
                        CostPrice = pDock.CostPrice,
                        NetAmount = (pDock.BasePrice * 0.85m) * 15,
                        TaxAmount = ((pDock.BasePrice * 0.85m) * 15) * 0.18m,
                        MarginAmount = ((pDock.BasePrice * 0.85m) - pDock.CostPrice) * 15
                    },
                    new()
                    {
                        ProductId = pSrvSupp.Id,
                        Quantity = 1,
                        UnitPrice = pSrvSupp.BasePrice,
                        DiscountPercent = 18.00m,
                        CostPrice = pSrvSupp.CostPrice,
                        NetAmount = (pSrvSupp.BasePrice * 0.82m) * 1,
                        TaxAmount = ((pSrvSupp.BasePrice * 0.82m) * 1) * 0.18m,
                        MarginAmount = ((pSrvSupp.BasePrice * 0.82m) - pSrvSupp.CostPrice) * 1
                    }
                }
            };
            q3.SubTotal = q3.Lines.Sum(l => l.UnitPrice * l.Quantity);
            q3.DiscountTotal = q3.SubTotal - q3.Lines.Sum(l => l.NetAmount);
            q3.TaxTotal = q3.Lines.Sum(l => l.TaxAmount);
            q3.GrandTotal = q3.Lines.Sum(l => l.NetAmount) + q3.TaxTotal;
            q3.CostTotal = q3.Lines.Sum(l => l.CostPrice * l.Quantity);
            q3.MarginAmount = q3.GrandTotal - q3.CostTotal - q3.TaxTotal;
            q3.MarginPercent = q3.GrandTotal > 0 ? (q3.MarginAmount / (q3.GrandTotal - q3.TaxTotal)) * 100 : 0;
            q3.RiskScore = 78.5m;
            context.Quotations.Add(q3);
            await context.SaveChangesAsync();

            context.ApprovalRequests.Add(new ApprovalRequest
            {
                QuotationId = q3.Id,
                Level = ApprovalLevel.Finance,
                Status = ApprovalStatus.Pending,
                Sequence = 1,
                Reason = "Blended discount risk score of 78.50 exceeds Finance threshold (70.00). Requires Finance Controller authorization.",
                RequestedAtUtc = DateTime.UtcNow.AddDays(-1)
            });
            await context.SaveChangesAsync();
        }

        // QUOTE 4 (Sent - Active proposal delivered to customer)
        var q4 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0004");
        if (q4 == null)
        {
            q4 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0004",
                CustomerId = delhiBusiness.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.Sent,
                ApprovalStatus = ApprovalStatus.None,
                CurrencyCode = "INR",
                Notes = "Digital workplace display upgrade proposal delivered to procurement.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(5),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-5),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-2),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pMon24.Id,
                        Quantity = 4,
                        UnitPrice = pMon24.BasePrice,
                        DiscountPercent = 4.00m,
                        CostPrice = pMon24.CostPrice,
                        NetAmount = (pMon24.BasePrice * 0.96m) * 4,
                        TaxAmount = ((pMon24.BasePrice * 0.96m) * 4) * 0.18m,
                        MarginAmount = ((pMon24.BasePrice * 0.96m) - pMon24.CostPrice) * 4
                    },
                    new()
                    {
                        ProductId = pDock.Id,
                        Quantity = 4,
                        UnitPrice = pDock.BasePrice,
                        DiscountPercent = 3.50m,
                        CostPrice = pDock.CostPrice,
                        NetAmount = (pDock.BasePrice * 0.965m) * 4,
                        TaxAmount = ((pDock.BasePrice * 0.965m) * 4) * 0.18m,
                        MarginAmount = ((pDock.BasePrice * 0.965m) - pDock.CostPrice) * 4
                    }
                }
            };
            q4.SubTotal = q4.Lines.Sum(l => l.UnitPrice * l.Quantity);
            q4.DiscountTotal = q4.SubTotal - q4.Lines.Sum(l => l.NetAmount);
            q4.TaxTotal = q4.Lines.Sum(l => l.TaxAmount);
            q4.GrandTotal = q4.Lines.Sum(l => l.NetAmount) + q4.TaxTotal;
            q4.CostTotal = q4.Lines.Sum(l => l.CostPrice * l.Quantity);
            q4.MarginAmount = q4.GrandTotal - q4.CostTotal - q4.TaxTotal;
            q4.MarginPercent = q4.GrandTotal > 0 ? (q4.MarginAmount / (q4.GrandTotal - q4.TaxTotal)) * 100 : 0;
            q4.RiskScore = 20.0m;
            context.Quotations.Add(q4);
            await context.SaveChangesAsync();
        }

        // QUOTE 5 (UnderNegotiation - Scenario G: Customer Counter-Offer applied)
        var q5 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0005");
        if (q5 == null)
        {
            q5 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0005",
                CustomerId = bengaluruCloud.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.UnderNegotiation,
                ApprovalStatus = ApprovalStatus.None,
                CurrencyCode = "INR",
                Notes = "Cloud developer hardware bundle. Active commercial negotiation underway with customer Ananya Gupta.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(8),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-6),
                UpdatedAtUtc = DateTime.UtcNow.AddHours(-4),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pLaptop14.Id,
                        Quantity = 5,
                        UnitPrice = pLaptop14.BasePrice,
                        DiscountPercent = 12.00m,
                        CostPrice = pLaptop14.CostPrice,
                        NetAmount = (pLaptop14.BasePrice * 0.88m) * 5,
                        TaxAmount = ((pLaptop14.BasePrice * 0.88m) * 5) * 0.18m,
                        MarginAmount = ((pLaptop14.BasePrice * 0.88m) - pLaptop14.CostPrice) * 5
                    },
                    new()
                    {
                        ProductId = pSubBck.Id,
                        Quantity = 5,
                        UnitPrice = pSubBck.BasePrice,
                        DiscountPercent = 10.00m,
                        CostPrice = pSubBck.CostPrice,
                        NetAmount = (pSubBck.BasePrice * 0.90m) * 5,
                        TaxAmount = ((pSubBck.BasePrice * 0.90m) * 5) * 0.18m,
                        MarginAmount = ((pSubBck.BasePrice * 0.90m) - pSubBck.CostPrice) * 5,
                        SubscriptionPlanId = subPlanMonthly.Id
                    }
                }
            };
            q5.SubTotal = q5.Lines.Sum(l => l.UnitPrice * l.Quantity);
            q5.DiscountTotal = q5.SubTotal - q5.Lines.Sum(l => l.NetAmount);
            q5.TaxTotal = q5.Lines.Sum(l => l.TaxAmount);
            q5.GrandTotal = q5.Lines.Sum(l => l.NetAmount) + q5.TaxTotal;
            q5.CostTotal = q5.Lines.Sum(l => l.CostPrice * l.Quantity);
            q5.MarginAmount = q5.GrandTotal - q5.CostTotal - q5.TaxTotal;
            q5.MarginPercent = q5.GrandTotal > 0 ? (q5.MarginAmount / (q5.GrandTotal - q5.TaxTotal)) * 100 : 0;
            q5.RiskScore = 28.0m;
            context.Quotations.Add(q5);
            await context.SaveChangesAsync();

            var line1 = q5.Lines.First(l => l.ProductId == pLaptop14.Id);
            context.QuotationLineComments.Add(new QuotationLineComment
            {
                QuotationLineId = line1.Id,
                UserId = (await context.Users.FirstAsync(u => u.Email == "ananya.gupta@demo.dealflow360.local")).Id,
                Comment = "Can you offer 12% discount for bulk commitment of 5 laptops?",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-12)
            });
            context.QuotationLineComments.Add(new QuotationLineComment
            {
                QuotationLineId = line1.Id,
                UserId = repUser.Id,
                Comment = "Accepted 12% discount under Gold Tier terms. Counter-offer updated.",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-4)
            });

            context.QuotationChanges.Add(new QuotationChange
            {
                QuotationId = q5.Id,
                ChangeType = "CustomerCounterOffer",
                Description = "Customer Ananya Gupta requested 12% discount on Business Laptop Pro 14.",
                RequestedByUserId = (await context.Users.FirstAsync(u => u.Email == "ananya.gupta@demo.dealflow360.local")).Id,
                OldValueJson = "{\"discount\":8.0}",
                NewValueJson = "{\"discount\":12.0}",
                CreatedAtUtc = DateTime.UtcNow.AddHours(-4)
            });
            await context.SaveChangesAsync();
        }

        // QUOTE 6 (Approved - Terms formally approved and locked!)
        var q6 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0006");
        if (q6 == null)
        {
            q6 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0006",
                CustomerId = chennaiDigital.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.Approved,
                ApprovalStatus = ApprovalStatus.Approved,
                CurrencyCode = "INR",
                Notes = "Annual workstation expansion for Chennai Digital IT center. Formally approved and terms locked.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(3),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-7),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-1),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pLaptop14.Id,
                        Quantity = 8,
                        UnitPrice = pLaptop14.BasePrice,
                        DiscountPercent = 8.00m,
                        CostPrice = pLaptop14.CostPrice,
                        NetAmount = (pLaptop14.BasePrice * 0.92m) * 8,
                        TaxAmount = ((pLaptop14.BasePrice * 0.92m) * 8) * 0.18m,
                        MarginAmount = ((pLaptop14.BasePrice * 0.92m) - pLaptop14.CostPrice) * 8
                    },
                    new()
                    {
                        ProductId = pDock.Id,
                        Quantity = 8,
                        UnitPrice = pDock.BasePrice,
                        DiscountPercent = 8.00m,
                        CostPrice = pDock.CostPrice,
                        NetAmount = (pDock.BasePrice * 0.92m) * 8,
                        TaxAmount = ((pDock.BasePrice * 0.92m) * 8) * 0.18m,
                        MarginAmount = ((pDock.BasePrice * 0.92m) - pDock.CostPrice) * 8
                    }
                }
            };
            q6.SubTotal = q6.Lines.Sum(l => l.UnitPrice * l.Quantity);
            q6.DiscountTotal = q6.SubTotal - q6.Lines.Sum(l => l.NetAmount);
            q6.TaxTotal = q6.Lines.Sum(l => l.TaxAmount);
            q6.GrandTotal = q6.Lines.Sum(l => l.NetAmount) + q6.TaxTotal;
            q6.CostTotal = q6.Lines.Sum(l => l.CostPrice * l.Quantity);
            q6.MarginAmount = q6.GrandTotal - q6.CostTotal - q6.TaxTotal;
            q6.MarginPercent = q6.GrandTotal > 0 ? (q6.MarginAmount / (q6.GrandTotal - q6.TaxTotal)) * 100 : 0;
            q6.RiskScore = 25.0m;
            context.Quotations.Add(q6);
            await context.SaveChangesAsync();

            var req = new ApprovalRequest
            {
                QuotationId = q6.Id,
                Level = ApprovalLevel.Manager,
                Status = ApprovalStatus.Approved,
                Sequence = 1,
                Reason = "Commercial terms reviewed and authorized by Sales Manager.",
                RequestedAtUtc = DateTime.UtcNow.AddDays(-2),
                ActedAtUtc = DateTime.UtcNow.AddDays(-1),
                ActedByUserId = managerUser.Id
            };
            context.ApprovalRequests.Add(req);
            await context.SaveChangesAsync();

            context.ApprovalActions.Add(new ApprovalAction
            {
                ApprovalRequestId = req.Id,
                UserId = managerUser.Id,
                Action = "Approved",
                Reason = "Approved after reviewing client margin contribution and multi-year commitment.",
                CreatedAtUtc = DateTime.UtcNow.AddDays(-1)
            });
            await context.SaveChangesAsync();
        }

        // QUOTE 7 (ConvertedToOrder - Scenario E & F: Hybrid Order with Multi-Warehouse Allocation & Invoicing)
        var q7 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0007");
        if (q7 == null)
        {
            q7 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0007",
                CustomerId = puneNetworks.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.ConvertedToOrder,
                ApprovalStatus = ApprovalStatus.Approved,
                CurrencyCode = "INR",
                Notes = "Enterprise IT and Network setup package for Pune Enterprise Networks.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(-2),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-10),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-2),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pLaptop14.Id,
                        Quantity = 10,
                        UnitPrice = pLaptop14.BasePrice,
                        DiscountPercent = 7.00m,
                        CostPrice = pLaptop14.CostPrice,
                        NetAmount = (pLaptop14.BasePrice * 0.93m) * 10,
                        TaxAmount = ((pLaptop14.BasePrice * 0.93m) * 10) * 0.18m,
                        MarginAmount = ((pLaptop14.BasePrice * 0.93m) - pLaptop14.CostPrice) * 10
                    },
                    new()
                    {
                        ProductId = pDock.Id,
                        Quantity = 10,
                        UnitPrice = pDock.BasePrice,
                        DiscountPercent = 5.00m,
                        CostPrice = pDock.CostPrice,
                        NetAmount = (pDock.BasePrice * 0.95m) * 10,
                        TaxAmount = ((pDock.BasePrice * 0.95m) * 10) * 0.18m,
                        MarginAmount = ((pDock.BasePrice * 0.95m) - pDock.CostPrice) * 10
                    },
                    new()
                    {
                        ProductId = pSubPrem.Id,
                        Quantity = 10,
                        UnitPrice = pSubPrem.BasePrice,
                        DiscountPercent = 5.00m,
                        CostPrice = pSubPrem.CostPrice,
                        NetAmount = (pSubPrem.BasePrice * 0.95m) * 10,
                        TaxAmount = ((pSubPrem.BasePrice * 0.95m) * 10) * 0.18m,
                        MarginAmount = ((pSubPrem.BasePrice * 0.95m) - pSubPrem.CostPrice) * 10,
                        SubscriptionPlanId = subPlanMonthly.Id
                    }
                }
            };
            q7.SubTotal = q7.Lines.Sum(l => l.UnitPrice * l.Quantity);
            q7.DiscountTotal = q7.SubTotal - q7.Lines.Sum(l => l.NetAmount);
            q7.TaxTotal = q7.Lines.Sum(l => l.TaxAmount);
            q7.GrandTotal = q7.Lines.Sum(l => l.NetAmount) + q7.TaxTotal;
            q7.CostTotal = q7.Lines.Sum(l => l.CostPrice * l.Quantity);
            q7.MarginAmount = q7.GrandTotal - q7.CostTotal - q7.TaxTotal;
            q7.MarginPercent = q7.GrandTotal > 0 ? (q7.MarginAmount / (q7.GrandTotal - q7.TaxTotal)) * 100 : 0;
            q7.RiskScore = 18.0m;
            context.Quotations.Add(q7);
            await context.SaveChangesAsync();

            // Order 1
            var ord1 = new Order
            {
                OrderNumber = "ORD-IND-2026-0001",
                QuotationId = q7.Id,
                CustomerId = puneNetworks.Id,
                Status = OrderStatus.Confirmed,
                Total = q7.GrandTotal,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2),
                Lines = new List<OrderLine>
                {
                    new()
                    {
                        ProductId = pLaptop14.Id,
                        Quantity = 10,
                        UnitPrice = pLaptop14.BasePrice,
                        DiscountPercent = 7.00m,
                        NetAmount = (pLaptop14.BasePrice * 0.93m) * 10,
                        TaxAmount = ((pLaptop14.BasePrice * 0.93m) * 10) * 0.18m,
                        ProductType = ProductType.OneTime,
                        CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
                    },
                    new()
                    {
                        ProductId = pDock.Id,
                        Quantity = 10,
                        UnitPrice = pDock.BasePrice,
                        DiscountPercent = 5.00m,
                        NetAmount = (pDock.BasePrice * 0.95m) * 10,
                        TaxAmount = ((pDock.BasePrice * 0.95m) * 10) * 0.18m,
                        ProductType = ProductType.OneTime,
                        CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
                    },
                    new()
                    {
                        ProductId = pSubPrem.Id,
                        Quantity = 10,
                        UnitPrice = pSubPrem.BasePrice,
                        DiscountPercent = 5.00m,
                        NetAmount = (pSubPrem.BasePrice * 0.95m) * 10,
                        TaxAmount = ((pSubPrem.BasePrice * 0.95m) * 10) * 0.18m,
                        ProductType = ProductType.Subscription,
                        SubscriptionPlanId = subPlanMonthly.Id,
                        CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
                    }
                }
            };
            context.Orders.Add(ord1);
            await context.SaveChangesAsync();

            var ordLineLaptop = ord1.Lines.First(l => l.ProductId == pLaptop14.Id);
            var ordLineDock = ord1.Lines.First(l => l.ProductId == pDock.Id);
            var ordLineSub = ord1.Lines.First(l => l.ProductId == pSubPrem.Id);

            // Split Laptops: 6 from Pune, 4 from Mumbai
            context.WarehouseAllocations.Add(new WarehouseAllocation
            {
                OrderLineId = ordLineLaptop.Id,
                WarehouseId = whPune.Id,
                Quantity = 6,
                ShipmentCost = 6 * 250.00m,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
            });
            context.WarehouseAllocations.Add(new WarehouseAllocation
            {
                OrderLineId = ordLineLaptop.Id,
                WarehouseId = whMumbai.Id,
                Quantity = 4,
                ShipmentCost = 4 * 350.00m,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
            });

            // Docks: 10 from Pune
            context.WarehouseAllocations.Add(new WarehouseAllocation
            {
                OrderLineId = ordLineDock.Id,
                WarehouseId = whPune.Id,
                Quantity = 10,
                ShipmentCost = 10 * 150.00m,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
            });

            // Monthly Recurring Subscription Schedule
            context.BillingSchedules.Add(new BillingSchedule
            {
                OrderLineId = ordLineSub.Id,
                SubscriptionPlanId = subPlanMonthly.Id,
                StartDate = DateTime.UtcNow.Date,
                NextBillingDate = DateTime.UtcNow.Date.AddMonths(1),
                Quantity = 10,
                UnitPrice = pSubPrem.BasePrice * 0.95m,
                Status = SubscriptionStatus.Active,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
            });
            await context.SaveChangesAsync();

            // INV-IND-2026-0001 (PartiallyPaid)
            var inv1 = new Invoice
            {
                InvoiceNumber = "INV-IND-2026-0001",
                OrderId = ord1.Id,
                CustomerId = puneNetworks.Id,
                Type = "OneTime",
                Status = InvoiceStatus.PartiallyPaid,
                SubTotal = q7.Lines.Sum(l => l.NetAmount),
                TaxTotal = q7.Lines.Sum(l => l.TaxAmount),
                Total = q7.GrandTotal,
                PaidAmount = 500000.00m,
                DueDate = DateTime.UtcNow.AddDays(30),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-2),
                Lines = ord1.Lines.Select(ol => new InvoiceLine
                {
                    ProductId = ol.ProductId,
                    Description = ol.ProductId == pLaptop14.Id ? "Business Laptop Pro 14\"" : ol.ProductId == pDock.Id ? "USB-C Business Dock" : "Premium Support Monthly",
                    Quantity = ol.Quantity,
                    UnitPrice = ol.UnitPrice,
                    DiscountPercent = ol.DiscountPercent,
                    NetAmount = ol.NetAmount,
                    TaxAmount = ol.TaxAmount,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-2)
                }).ToList()
            };
            context.Invoices.Add(inv1);
            await context.SaveChangesAsync();

            // Payment 1: ₹5,00,000 via NEFT
            context.Payments.Add(new Payment
            {
                InvoiceId = inv1.Id,
                Amount = 500000.00m,
                PaidAtUtc = DateTime.UtcNow.AddDays(-1),
                PaymentMethod = "NEFT / RTGS",
                Reference = "CMS-HDFC-991283049182",
                CreatedAtUtc = DateTime.UtcNow.AddDays(-1)
            });
            await context.SaveChangesAsync();
        }

        // ORDER 2 & INVOICE 2 (Fully Paid: Ahmedabad Manufacturing Solutions)
        var qOrder2 = await context.Quotations.Include(q => q.Lines).FirstOrDefaultAsync(q => q.QuotationNumber == "QT-IND-2026-0008");
        if (qOrder2 == null)
        {
            qOrder2 = new Quotation
            {
                QuotationNumber = "QT-IND-2026-0008",
                CustomerId = ahmedabadMfg.Id,
                SalesRepId = repUser.Id,
                Status = QuoteStatus.ConvertedToOrder,
                ApprovalStatus = ApprovalStatus.Approved,
                CurrencyCode = "INR",
                Notes = "Ahmedabad branch network expansion order.",
                ExpectedCloseDate = DateTime.UtcNow.AddDays(-5),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-12),
                UpdatedAtUtc = DateTime.UtcNow.AddDays(-5),
                Lines = new List<QuotationLine>
                {
                    new()
                    {
                        ProductId = pRouter.Id,
                        Quantity = 3,
                        UnitPrice = pRouter.BasePrice,
                        DiscountPercent = 5.00m,
                        CostPrice = pRouter.CostPrice,
                        NetAmount = (pRouter.BasePrice * 0.95m) * 3,
                        TaxAmount = ((pRouter.BasePrice * 0.95m) * 3) * 0.18m,
                        MarginAmount = ((pRouter.BasePrice * 0.95m) - pRouter.CostPrice) * 3
                    },
                    new()
                    {
                        ProductId = pSrvNet.Id,
                        Quantity = 1,
                        UnitPrice = pSrvNet.BasePrice,
                        DiscountPercent = 5.00m,
                        CostPrice = pSrvNet.CostPrice,
                        NetAmount = (pSrvNet.BasePrice * 0.95m) * 1,
                        TaxAmount = ((pSrvNet.BasePrice * 0.95m) * 1) * 0.18m,
                        MarginAmount = ((pSrvNet.BasePrice * 0.95m) - pSrvNet.CostPrice) * 1
                    }
                }
            };
            qOrder2.SubTotal = qOrder2.Lines.Sum(l => l.UnitPrice * l.Quantity);
            qOrder2.DiscountTotal = qOrder2.SubTotal - qOrder2.Lines.Sum(l => l.NetAmount);
            qOrder2.TaxTotal = qOrder2.Lines.Sum(l => l.TaxAmount);
            qOrder2.GrandTotal = qOrder2.Lines.Sum(l => l.NetAmount) + qOrder2.TaxTotal;
            qOrder2.CostTotal = qOrder2.Lines.Sum(l => l.CostPrice * l.Quantity);
            qOrder2.MarginAmount = qOrder2.GrandTotal - qOrder2.CostTotal - qOrder2.TaxTotal;
            qOrder2.MarginPercent = qOrder2.GrandTotal > 0 ? (qOrder2.MarginAmount / (qOrder2.GrandTotal - qOrder2.TaxTotal)) * 100 : 0;
            qOrder2.RiskScore = 12.0m;
            context.Quotations.Add(qOrder2);
            await context.SaveChangesAsync();

            var ord2 = new Order
            {
                OrderNumber = "ORD-IND-2026-0002",
                QuotationId = qOrder2.Id,
                CustomerId = ahmedabadMfg.Id,
                Status = OrderStatus.Confirmed,
                Total = qOrder2.GrandTotal,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-5),
                Lines = qOrder2.Lines.Select(ql => new OrderLine
                {
                    ProductId = ql.ProductId,
                    Quantity = ql.Quantity,
                    UnitPrice = ql.UnitPrice,
                    DiscountPercent = ql.DiscountPercent,
                    NetAmount = ql.NetAmount,
                    TaxAmount = ql.TaxAmount,
                    ProductType = ProductType.OneTime,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
                }).ToList()
            };
            context.Orders.Add(ord2);
            await context.SaveChangesAsync();

            // INV-IND-2026-0002 (Fully Paid)
            var inv2 = new Invoice
            {
                InvoiceNumber = "INV-IND-2026-0002",
                OrderId = ord2.Id,
                CustomerId = ahmedabadMfg.Id,
                Type = "OneTime",
                Status = InvoiceStatus.Paid,
                SubTotal = qOrder2.Lines.Sum(l => l.NetAmount),
                TaxTotal = qOrder2.Lines.Sum(l => l.TaxAmount),
                Total = qOrder2.GrandTotal,
                PaidAmount = qOrder2.GrandTotal,
                DueDate = DateTime.UtcNow.AddDays(15),
                CreatedAtUtc = DateTime.UtcNow.AddDays(-5),
                Lines = ord2.Lines.Select(ol => new InvoiceLine
                {
                    ProductId = ol.ProductId,
                    Description = ol.ProductId == pRouter.Id ? "Enterprise Wi-Fi 6 Router" : "Network Configuration Service",
                    Quantity = ol.Quantity,
                    UnitPrice = ol.UnitPrice,
                    DiscountPercent = ol.DiscountPercent,
                    NetAmount = ol.NetAmount,
                    TaxAmount = ol.TaxAmount,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
                }).ToList()
            };
            context.Invoices.Add(inv2);
            await context.SaveChangesAsync();

            context.Payments.Add(new Payment
            {
                InvoiceId = inv2.Id,
                Amount = inv2.Total,
                PaidAtUtc = DateTime.UtcNow.AddDays(-4),
                PaymentMethod = "UPI Commercial QR",
                Reference = "UPI-ICICI-882910401928",
                CreatedAtUtc = DateTime.UtcNow.AddDays(-4)
            });
            await context.SaveChangesAsync();
        }

        // ═══════════════════════════════════════════════════════════════════════
        // 17. DEAL HEALTH SNAPSHOTS
        // ═══════════════════════════════════════════════════════════════════════
        var healthSeeds = new List<(int QuoteId, int Score, string[] Signals)>
        {
            (q1.Id, 88, new[] { "TargetPriceMet", "NormalDiscountTier", "FastProgression" }),
            (q2.Id, 52, new[] { "ApprovalPending", "ServicesDiscountThresholdBreached" }),
            (q3.Id, 25, new[] { "FinanceApprovalRequired", "SevereBlendedMarginDepletion" }),
            (q4.Id, 38, new[] { "DealStalled", "NoNextActionScheduled", "CustomerProposalUnopened" }),
            (q5.Id, 72, new[] { "CustomerActiveEngagement", "CounterOfferUnderReview" }),
            (q6.Id, 95, new[] { "TermsApprovedAndLocked", "ReadyForDigitalSignature" })
        };

        foreach (var (qId, score, signals) in healthSeeds)
        {
            var existingSnapshot = await context.DealHealthSnapshots.FirstOrDefaultAsync(s => s.EntityType == "Quotation" && s.EntityId == qId);
            if (existingSnapshot == null)
            {
                context.DealHealthSnapshots.Add(new DealHealthSnapshot
                {
                    EntityType = "Quotation",
                    EntityId = qId,
                    HealthScore = score,
                    SignalsJson = JsonSerializer.Serialize(signals),
                    CreatedAtUtc = DateTime.UtcNow
                });
            }
            else
            {
                existingSnapshot.HealthScore = score;
                existingSnapshot.SignalsJson = JsonSerializer.Serialize(signals);
            }
        }
        await context.SaveChangesAsync();

        // ═══════════════════════════════════════════════════════════════════════
        // 18. CUSTOMER SALES CONNECTION REQUESTS (INQUIRIES)
        // ═══════════════════════════════════════════════════════════════════════
        var inquirySeeds = new List<(string ReqNum, int CustId, int CompId, int ProdId, int RepId, SalesConnectionStatus Status, int Qty, string Msg, string Contact, int? QuoteId)>
        {
            ("SCR-IND-2026-0001", sharmaTech.Id, tbs.Id, pLaptop14.Id, repUser.Id, SalesConnectionStatus.Accepted, 5, "Looking for quotation on 5 units of Business Laptop Pro 14 for our BKC team.", "Email", q2.Id),
            ("SCR-IND-2026-0002", bengaluruCloud.Id, nsn.Id, pRouter.Id, repUser.Id, SalesConnectionStatus.QuoteCreated, 2, "Require enterprise router with VPN setup for our Indiranagar engineering office.", "Phone", q5.Id),
            ("SCR-IND-2026-0003", delhiBusiness.Id, ict.Id, pMon27.Id, repUser.Id, SalesConnectionStatus.Pending, 4, "Inquiry for 4 units of 27-inch 4K Business Monitors with dual arm mounts.", "WhatsApp", null),
            ("SCR-IND-2026-0004", jaipurSmart.Id, tbs.Id, pKmCombo.Id, repUser.Id, SalesConnectionStatus.Contacted, 15, "Need commercial pricing on 15 wireless keyboard/mouse sets.", "Email", null)
        };

        foreach (var inq in inquirySeeds)
        {
            var existingInq = await context.SalesConnectionRequests.FirstOrDefaultAsync(r => r.RequestNumber == inq.ReqNum);
            if (existingInq == null)
            {
                context.SalesConnectionRequests.Add(new SalesConnectionRequest
                {
                    RequestNumber = inq.ReqNum,
                    CustomerId = inq.CustId,
                    CompanyId = inq.CompId,
                    ProductId = inq.ProdId,
                    SalesRepresentativeId = inq.RepId,
                    Status = inq.Status,
                    RequestedQuantity = inq.Qty,
                    CustomerMessage = inq.Msg,
                    PreferredContactMethod = inq.Contact,
                    QuotationId = inq.QuoteId,
                    AcceptedAtUtc = inq.Status != SalesConnectionStatus.Pending ? DateTime.UtcNow.AddDays(-1) : null,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-3)
                });
            }
            else
            {
                existingInq.Status = inq.Status;
                existingInq.CustomerMessage = inq.Msg;
                existingInq.PreferredContactMethod = inq.Contact;
                existingInq.QuotationId = inq.QuoteId;
            }
        }
        // Ensure all historical quotations are attributed to Priya Patel (repUser.Id)
        var allQuotes = await context.Quotations.ToListAsync();
        foreach (var q in allQuotes)
        {
            q.SalesRepId = repUser.Id;
        }
        await context.SaveChangesAsync();

        // Ensure all historical sales inquiries are linked to DealFlow360 Technologies Pvt. Ltd. and Priya Patel
        var allInquiries = await context.SalesConnectionRequests.ToListAsync();
        foreach (var inq in allInquiries)
        {
            inq.CompanyId = df360.Id;
            inq.SalesRepresentativeId = repUser.Id;
        }
        await context.SaveChangesAsync();
    }
}