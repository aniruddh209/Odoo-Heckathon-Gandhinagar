# DealFlow360 — Database Setup Guide
**Authoritative Operational Guide for Microsoft SQL Server & Entity Framework Core**

---

## 1. Architecture & Technology Stack

- **RDBMS Engine**: Microsoft SQL Server (Developer / Standard / Enterprise / Express)
- **Host**: `localhost` (Default Instance `MSSQLSERVER`)
- **Database Name**: `DealFlow360`
- **ORM**: Entity Framework Core 10.0.11 (`Microsoft.EntityFrameworkCore.SqlServer`)
- **Authentication**: Windows Integrated Security (or SQL Authentication with TrustServerCertificate=True)
- **Migrations Mechanism**: EF Core Code-First Migrations + Idempotent SQL Migration Script (`migration.sql`)
- **Seeding Engine**: In-code idempotent seeder (`DbInitializer.cs`) running on application startup

---

## 2. Connection Strings

### Localhost Windows Authentication (Integrated Security)
Located in `backend/DealFlow360.API/DealFlow360.API/appsettings.json`:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=DealFlow360;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  },
  "UseInMemoryDatabase": false
}
```

### SQL Authentication Fallback (Alternative for CI/CD / Docker)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost,1433;Database=DealFlow360;User Id=sa;Password=YourSecurePassword123!;TrustServerCertificate=True;MultipleActiveResultSets=True;"
  },
  "UseInMemoryDatabase": false
}
```

---

## 3. Database Initialization Steps

### Step 1: Create Database
Connect to SQL Server via PowerShell or `sqlcmd` / SSMS and create the database if not exists:
```sql
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'DealFlow360')
BEGIN
    CREATE DATABASE [DealFlow360];
END;
```

### Step 2: Apply Schema Migration
Run the idempotent SQL script against `DealFlow360`:
```powershell
Invoke-Sqlcmd -ServerInstance "localhost" -Database "DealFlow360" -InputFile "migration.sql"
```
This provisions all 36 relational tables, indexes, check constraints, foreign keys, and registers the initial migration in `__EFMigrationsHistory`:
- Migration ID: `20260905093042_InitialCreate`
- ProductVersion: `10.0.11`

### Step 3: Run Backend to Seed Data
Start the ASP.NET Core API server:
```powershell
dotnet run --project backend/DealFlow360.API/DealFlow360.API/DealFlow360.API.csproj --urls "http://localhost:5000"
```
On startup, `Program.cs` invokes `DbInitializer.InitializeAsync(context)`. The seeder checks `context.Users.Any()` and seeds:
1. Customer Tiers (Gold, Silver, Bronze)
2. Commercial Customers (Acme Global Solutions)
3. Sales Teams (Enterprise Sales USA)
4. System Users & Roles with BCrypt hashed passwords
5. Product Categories & Core Commercial Hardware/Services/Subscriptions
6. Price Lists & Tiered Price List Items
7. Discount Governance Rules
8. Hierarchical Approval Rules (Level 1 Manager, Level 2 Finance)
9. Warehouses & Multi-Facility Inventory Stocks
10. Subscription Plans (SaaS Billing)
11. Upsell & Cross-Sell AI Recommendation Rules

---

## 4. Verification Queries

To verify database health and seeded data in SQL Server:

```sql
USE [DealFlow360];

-- 1. Verify all 36 tables
SELECT COUNT(*) AS TableCount FROM sys.tables; -- Expected: 36

-- 2. Verify seeded accounts
SELECT Id, FullName, Email, Role, SalesTeamId, IsActive FROM Users;

-- 3. Verify products and stock levels
SELECT p.Sku, p.Name, p.BasePrice, ISNULL(SUM(s.QuantityOnHand), 0) AS TotalStock
FROM Products p
LEFT JOIN InventoryStocks s ON p.Id = s.ProductId
GROUP BY p.Sku, p.Name, p.BasePrice;

-- 4. Verify discount and approval rules
SELECT Id, Name, MaxDiscountPercent, MarginFloorPercent FROM DiscountRules;
SELECT Id, ApprovalLevel, MinBlendedDiscountPercent, RequiredRole FROM ApprovalRules;
```
