# DealFlow360 — Migrations Architecture & Management
**EF Core Code-First Migrations, Idempotency & SQL Server Management**

---

## 1. Migration Overview

DealFlow360 uses **Entity Framework Core 10 (Code-First)** with Microsoft SQL Server to manage the schema across all 36 domain entities.

- **Initial Baseline Migration**: `20260905093042_InitialCreate`
- **History Table**: `[dbo].[__EFMigrationsHistory]`
- **Target Provider**: `Microsoft.EntityFrameworkCore.SqlServer` 10.0.11
- **Design Tools**: `Microsoft.EntityFrameworkCore.Design` 10.0.11

---

## 2. Migration Artifacts

The repository maintains both C# migration code and raw idempotent SQL scripts:

1. **Migration Definition**:
   - `backend/DealFlow360.API/DealFlow360.API/Migrations/20260905093042_InitialCreate.cs`
   - Contains `Up()` and `Down()` routines configuring all tables, primary keys, foreign keys, and indexes.

2. **Model Snapshot**:
   - `backend/DealFlow360.API/DealFlow360.API/Migrations/AppDbContextModelSnapshot.cs`
   - Authoritative snapshot of the current metadata model.

3. **Idempotent Migration Script**:
   - `migration.sql` (and `backend/DealFlow360.API/DealFlow360.API/migration.sql`)
   - Pure SQL script with `IF NOT EXISTS` guards that can be safely re-executed against any SQL Server instance without error.

---

## 3. How to Generate & Apply Migrations

### Adding a New Migration
When entity definitions or `AppDbContext.cs` configurations change:

```powershell
cd backend/DealFlow360.API/DealFlow360.API
dotnet ef migrations add <MigrationName>
```

### Generating an Idempotent SQL Script
For production or DBA-reviewed deployments:

```powershell
dotnet ef migrations script -i -o migration.sql
```
The `-i` flag ensures all statements are idempotent, wrapping table and index creation in conditional checks against `__EFMigrationsHistory`.

### Applying Migrations Directly via EF Core CLI
To apply migrations directly to the local database configured in `appsettings.json`:

```powershell
dotnet ef database update
```

### Applying Migrations via PowerShell / SQLCmd
```powershell
Invoke-Sqlcmd -ServerInstance "localhost" -Database "DealFlow360" -InputFile "migration.sql"
```

---

## 4. Rollback Strategy

To rollback the database to a previous migration or clean state:

```powershell
# Roll back to a specific migration
dotnet ef database update <PreviousMigrationName>

# Revert all migrations (removes all tables)
dotnet ef database update 0
```

> **Warning**: Rolling back migrations in production will drop tables and destroy data. Always perform a full database backup before rolling back schema changes.
