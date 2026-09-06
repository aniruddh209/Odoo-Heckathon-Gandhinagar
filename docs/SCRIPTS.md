# DealFlow360 — Script & Tooling Reference Runbook

This document details all developer scripts, npm lifecycle hooks, database reset utilities, and automated end-to-end test runners available in the **DealFlow360** repository.

---

## 1. Root & Package Scripts Reference

### Root `package.json`
| Command | Execution Target | Purpose |
| :--- | :--- | :--- |
| `npm run db:reset:qa` | `node scripts/db_reset_qa.js` | Resets all transaction tables (quotes, orders, invoices) while preserving master reference catalogs. |
| `npm run db:clear:deals` | `node scripts/clear_deals.js` | Clears test deals and quotation changes. |

### Frontend `frontend/package.json`
| Command | Execution Target | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `vite --port 3000` | Starts the React 19 / Vite development server on `http://localhost:3000` with hot module replacement (HMR). |
| `npm run build` | `vite build` | Compiles and bundles production static assets into `frontend/dist`. |
| `npm run lint` | `oxlint` | Fast linter checking for syntax, accessibility, and React best practices. |
| `npm run preview` | `vite preview` | Serves the production build locally for pre-flight testing. |
| `npm run db:reset:qa` | `node ../scripts/db_reset_qa.js` | Convenient alias to trigger database reset from within the frontend directory. |

---

## 2. Automated Test & QA Scripts (`scripts/`)

All scripts in `scripts/` are written in Node.js, utilizing standard `fetch` to interact directly with the running ASP.NET Core backend at `http://localhost:5042`.

### 2.1 `scripts/test_qa_dataset_e2e.js`
- **Purpose:** Verifies that the database has been seeded with the complete, required master dataset.
- **Assertions Executed:**
  - Authenticates all 5 primary user personas.
  - Verifies presence of the 5 controlled customer organizations and their discount tier limits.
  - Verifies all 24 catalog products across Hardware, Accessories, Services, Support, and Subscriptions.
  - Verifies active warehouse facilities and initial inventory stock.
- **Run Command:**
  ```powershell
  node scripts/test_qa_dataset_e2e.js
  ```

---

### 2.2 `scripts/test_sales_rep_negotiation_e2e.js`
- **Purpose:** Executes the complete multi-turn negotiation and re-approval lifecycle.
- **Flow Verified:**
  1. Sales Rep logs in and creates a quotation exceeding customer tier limits.
  2. Status routes to `PendingApproval`.
  3. Sales Manager logs in and approves the request. Status becomes `Approved`.
  4. Customer logs into portal and submits a counter-offer.
  5. Version increments to $v2$, and status shifts to `PendingApproval` (re-triggering approval).
  6. Rep submits an agreed compromise (within tier limits).
  7. Customer accepts terms; status updates to `Approved` and approval request is resolved.
- **Run Command:**
  ```powershell
  node scripts/test_sales_rep_negotiation_e2e.js
  ```

---

### 2.3 `scripts/test_quotation_pdf_generation_e2e.js`
- **Purpose:** Verifies the QuestPDF commercial proposal generation engine.
- **Flow Verified:**
  1. Generates commercial proposal PDF via staff endpoint (`GET /api/quotations/{id}/pdf`).
  2. Generates proposal PDF via token-authenticated portal endpoint (`GET /api/portal/quote/{token}/pdf`).
  3. Validates binary payload (`application/pdf`), header magic bytes (`%PDF-`), and file integrity.
- **Run Command:**
  ```powershell
  node scripts/test_quotation_pdf_generation_e2e.js
  ```

---

### 2.4 `scripts/db_reset_qa.js`
- **Purpose:** Cleanses transactional test artifacts while keeping master catalogs untouched.
- **Tables Cleared:**
  - `ApprovalActions`, `ApprovalRequests`
  - `QuotationLines`, `QuotationChanges`, `QuotationLineComments`, `Quotations`
  - `OrderLines`, `WarehouseAllocations`, `Backorders`, `Orders`
  - `InvoiceLines`, `Payments`, `CreditNotes`, `BillingSchedules`, `Invoices`
- **Run Command:**
  ```powershell
  npm run db:reset:qa
  ```

---

## 3. Backend .NET CLI Commands

Run these commands from `backend/DealFlow360.API/DealFlow360.API`:

| Command | Purpose |
| :--- | :--- |
| `dotnet restore` | Restores all NuGet packages defined in `DealFlow360.API.csproj`. |
| `dotnet build --configuration Release` | Compiles the backend project into binary assemblies. |
| `dotnet run --no-build --configuration Release` | Launches the backend Web API listening on `http://localhost:5042`. |
| `dotnet clean` | Cleans compilation artifacts from `bin/` and `obj/`. |
| `dotnet publish -c Release -o ./publish` | Generates a standalone production release package. |
