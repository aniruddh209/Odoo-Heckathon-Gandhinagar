# DealFlow360 — Operational Troubleshooting & Diagnostic Runbook

This runbook documents real-world operational issues, startup errors, database synchronization behaviors, and edge cases discovered during engineering and quality assurance of **DealFlow360**, providing verified diagnostic steps and resolutions.

---

## 1. Database & Persistence Diagnostics

### 1.1 `Cannot connect to SQL Server / A network-related or instance-specific error occurred`
- **Symptom:** Backend fails to start with `SqlException: Cannot open database "DealFlow" requested by the login.` or `Server was not found or was not accessible.`
- **Root Cause:** The Microsoft SQL Server service or SQL Server LocalDB instance is not started.
- **Diagnostic Command:**
  ```powershell
  SqlLocalDB info mssqllocaldb
  ```
- **Resolution:**
  1. Start the LocalDB instance:
     ```powershell
     SqlLocalDB start mssqllocaldb
     ```
  2. If the database does not exist, Entity Framework Core will automatically create it on startup via `EnsureCreated()` / migrations.
  3. Alternatively, fall back to the in-memory database for immediate testing by editing `appsettings.json`:
     ```json
     "UseInMemoryDatabase": true
     ```

---

### 1.2 `Transactions reset after restarting backend server`
- **Symptom:** Newly created quotations, orders, or test invoices disappear after stopping and restarting the backend.
- **Root Cause:** By design, `DbInitializer.SeedAsync()` executes on startup in the `Development` environment. It cleanses transient test transaction records while preserving the 24 controlled catalog products, 5 customer organizations, and 12 demo user accounts to guarantee a pristine, deterministic test state.
- **Resolution:**
  - This is expected behavior for repeatable E2E test runs.
  - To test persistent transactions across restarts in production or staging, set `ASPNETCORE_ENVIRONMENT=Production`.

---

## 2. Port & Process Concurrency Conflicts

### 2.1 `Port 5042 is already in use / Address already in use`
- **Symptom:** Starting `dotnet run` fails with `System.IO.IOException: Failed to bind to address http://localhost:5042: address already in use.`
- **Root Cause:** A prior `dotnet run` process is running in the background holding port 5042.
- **Diagnostic Command:**
  ```powershell
  Get-NetTCPConnection -LocalPort 5042 -ErrorAction SilentlyContinue | Select-Object OwningProcess
  ```
- **Resolution:**
  Terminate the orphaned process in PowerShell:
  ```powershell
  Get-Process -Name DealFlow360* -ErrorAction SilentlyContinue | Stop-Process -Force
  ```

---

### 2.2 `Port 3000 is already in use`
- **Symptom:** Vite starts on port 3001 instead of 3000, causing browser bookmarks to fail.
- **Root Cause:** A background Node.js process is holding port 3000.
- **Resolution:**
  ```powershell
  Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }
  ```

---

### 2.3 `Compilation error CS2012: Cannot open file for writing / Process cannot access the file because it is being used by another process`
- **Symptom:** Running `dotnet build` fails with file-lock errors targeting `DealFlow360.API.exe` or `DealFlow360.API.dll`.
- **Root Cause:** The backend executable is currently running and locked by the operating system.
- **Resolution:**
  Always terminate the active backend process before rebuilding:
  ```powershell
  Get-Process -Name DealFlow360* -ErrorAction SilentlyContinue | Stop-Process -Force
  dotnet build DealFlow360.API.csproj --configuration Release --force
  dotnet run --no-build --configuration Release
  ```

---

## 3. Application Domain & Functional Edge Cases

### 3.1 `Confirmation Failed: An unexpected server error occurred on Authorize & Confirm`
- **Symptom:** In the Customer Account Portal (`/portal/my-account`), clicking **"Authorize & Confirm Proposal"** triggers a red toast saying *"Confirmation Failed — An unexpected server error occurred"*. However, clicking again shows *"Quotation already confirmed"*.
- **Root Cause:**
  1. `SaveChangesAsync()` succeeded in persisting the quotation confirmation and creating the order.
  2. Subsequent non-critical post-confirmation tasks (e.g. background notification or allocation) threw an uncaught exception, or `ChangeTracker.Clear()` detached active EF entities before mapper serialization.
- **Resolution (Implemented in `bbcaf31`):**
  - Wrapped `SendNotificationAsync` in safe `try/catch` blocks in both `CustomerService` and `PortalService`.
  - Removed disruptive `_context.ChangeTracker.Clear()` invocations from non-critical fulfillment/billing catch blocks.
  - Re-fetched fresh order instances before DTO projection.

---

### 3.2 `Newly created product as Admin does not appear in Customer Portal "Select Catalog Product"`
- **Symptom:** After creating a product in the Admin UI (`/admin/products`), the product does not appear in the customer portal under **Step 2: Select Catalog Product**.
- **Root Cause:**
  1. In `AdminService.CreateProductAsync`, `product.CompanyId` was not assigned, leaving it `null`.
  2. In `SalesConnectionService.GetAvailableProductsAsync`, the query strictly required `p.Company != null && p.Company.IsActive`, filtering out any product with `CompanyId == null`.
  3. Furthermore, the portal filters by the primary operating company (DealFlow360 / `DF360`), dropping unmapped items.
- **Resolution (Implemented in `844a6d2`):**
  - Updated `AdminService.CreateProductAsync` to automatically assign new products to the primary operating company (`DF360`).
  - Updated `SalesConnectionService.GetAvailableProductsAsync` with auto-healing logic to associate any orphaned products with the primary company and include universal products in queries.
  - Added a live **Refresh** (🔄) button next to the catalog search bar in `ConnectSalesSection.jsx` to allow immediate on-demand re-syncing without reloading the entire page.

---

### 3.3 `Sales Representative receives HTTP 403 when attempting to approve a quotation`
- **Symptom:** A sales rep clicks "Approve" and receives *"Sales Representatives cannot approve their own discount requests."*
- **Root Cause:** This is an intentional governance rule enforcing separation of duties. Sales Representatives cannot approve their own discount submissions.
- **Resolution:**
  Log in as a **Sales Manager** (`manager@dealflow360.io` / `Manager@123`) or **Administrator** to review and approve the request.
