# DealFlow360 — Installation & Setup Guide

This document provides complete, step-by-step instructions for setting up, compiling, running, and verifying the **DealFlow360** enterprise sales operations platform on a local workstation or staging server.

---

## 1. System Prerequisites

Ensure the following runtimes and database engines are installed on your host system:

| Component | Minimum Version | Verified Version | Verification Command | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **.NET SDK** | `10.0.100` / `9.0` | `10.0.100-preview` / `10.0.11` | `dotnet --version` | Required to build & run `DealFlow360.API` |
| **Node.js** | `18.18.0` | `20.x` / `22.x` | `node --version` | Required for React frontend & test runner scripts |
| **npm** | `9.0.0` | `10.x` | `npm --version` | Node package manager |
| **Microsoft SQL Server** | SQL Server 2019+ | SQL Server LocalDB / Express | `SqlLocalDB info` | `(localdb)\mssqllocaldb` or default instance `localhost` |
| **Git** | `2.40.0+` | `2.45+` | `git --version` | Version control |

---

## 2. Repository Setup

Clone the repository and switch to the active development branch:

```powershell
# 1. Clone repository
git clone https://github.com/aniruddh209/Odoo-Heckathon-Gandhinagar.git "DealFlow360"
cd "DealFlow360"

# 2. Switch to active development branch
git checkout frontend
```

---

## 3. Database Configuration

DealFlow360 uses **Entity Framework Core** configured for Microsoft SQL Server with strict `DECIMAL(18, 4)` financial precision.

### Option A: Microsoft SQL Server LocalDB (Recommended for Windows Development)
SQL Server LocalDB is lightweight and requires zero service management.

1. Ensure the LocalDB instance is created and running:
   ```powershell
   SqlLocalDB start mssqllocaldb
   ```
2. Set the connection string in `backend/DealFlow360.API/DealFlow360.API/appsettings.json`:
   ```json
   "ConnectionStrings": {
     "DefaultConnection": "Server=(localdb)\\mssqllocaldb;Database=DealFlow;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
   }
   ```

### Option B: Local SQL Server / SQL Server Express
If using standard SQL Server (`localhost` or `SQLEXPRESS`):
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=DealFlow;Integrated Security=True;TrustServerCertificate=True;MultipleActiveResultSets=True;"
}
```

### Option C: In-Memory Fallback (For Quick Testing Without SQL Server)
In `appsettings.json`, set:
```json
"UseInMemoryDatabase": true
```

---

## 4. Backend Setup & Startup

The backend is built with **ASP.NET Core Web API** running on `.NET 10`.

```powershell
# 1. Navigate to backend project directory
cd "backend\DealFlow360.API\DealFlow360.API"

# 2. Restore NuGet packages
dotnet restore

# 3. Build project
dotnet build --configuration Release

# 4. Run backend service
dotnet run --no-build --configuration Release
```

The backend starts on:
- **HTTP**: `http://localhost:5042`
- **Scalar Interactive API Docs**: `http://localhost:5042/scalar/v1`
- **OpenAPI 3.0 Document**: `http://localhost:5042/openapi/v1.json`

> **Note on Automatic Database Seeding:**  
> On every startup in development mode, `DbInitializer.SeedAsync()` automatically executes. It initializes all 38 tables, verifies schema integrity, seeds controlled master data (5 Customers across Bronze/Silver/Gold tiers, 12 staff accounts across all 5 roles, 24 products, warehouses, discount limits, and subscription plans), and guarantees a pristine, repeatable state for testing.

---

## 5. Frontend Setup & Startup

The frontend is a single-page application built with **React 19**, **Vite**, and **Tailwind CSS v4**.

```powershell
# 1. Open a new terminal and navigate to frontend directory
cd "frontend"

# 2. Install dependencies
npm install

# 3. Start Vite development server
npm run dev -- --port 3000
```

The application will be accessible at:
- **Web App**: `http://localhost:3000`
- **API Proxy**: Requests to `/api/*` are automatically forwarded by Vite to `http://localhost:5042`.

---

## 6. Verification Checklist

Execute these quick checks to verify the complete installation:

1. **Backend Health & Scalar Docs:**
   Open a browser or run:
   ```powershell
   curl http://localhost:5042/scalar/v1
   ```
   Verify that the Scalar API interactive dashboard loads.

2. **Frontend UI:**
   Open `http://localhost:3000/login`. You should see the DealFlow360 authentication screen with role selector quick-fill cards.

3. **Login Verification:**
   Log in with the primary QA administrator account:
   - **Email:** `admin@dealflow360.io`
   - **Password:** `Admin@123`
   You should enter the internal CRM dashboard displaying revenue metrics, pipeline widgets, and active navigation links.

4. **Customer Portal Magic Link:**
   Log in with:
   - **Email:** `customer@dealflow360.io`
   - **Password:** `Customer@123`
   You should land on the isolated Customer Account Portal (`/portal/my-account`).

---

## 7. Automated Test Suite Execution

Run the end-to-end integration test suites located in `scripts/`:

```powershell
# From project root:

# Test 1: Full QA Dataset & Seeding E2E Verification
node scripts/test_qa_dataset_e2e.js

# Test 2: Sales Representative Counter-Offer & Negotiation
node scripts/test_sales_rep_negotiation_e2e.js

# Test 3: QuestPDF Commercial Proposal PDF Generation
node scripts/test_quotation_pdf_generation_e2e.js

# Reset QA Transaction Data at any time:
npm run db:reset:qa
```

---

## 8. Common Troubleshooting

| Issue | Root Cause | Resolution |
| :--- | :--- | :--- |
| `Cannot connect to SQL Server` | SQL Server service or LocalDB instance is stopped | Run `SqlLocalDB start mssqllocaldb` or check SQL Server Windows Service. |
| `Port 5042 already in use` | A background `dotnet` process is holding the port | Run `Get-Process -Name DealFlow360* \| Stop-Process -Force` in PowerShell. |
| `Port 3000 already in use` | A background Vite instance is running | Vite will automatically offer port 3001, or terminate the existing Node process. |
| `Failed to fetch / Network Error` | Backend is not running on port 5042 | Verify backend terminal output shows `Now listening on: http://localhost:5042`. |
| `Untrusted certificate error` | HTTPS redirect enabled in dev | Backend in Development is configured on HTTP (`http://localhost:5042`). Disable HTTPS redirect for local development. |
