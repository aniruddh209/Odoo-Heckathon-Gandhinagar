# Contributing to DealFlow360

Thank you for contributing to **DealFlow360**! This guide outlines the development standards, code conventions, pull request workflows, and non-negotiable architectural rules enforced across this project.

---

## 1. Core Engineering Principles (Non-Negotiable)

1. **No Synthetic / Faked Operations:**  
   Never mock approval success, hardcode quote totals, fake gross margins, fake warehouse allocations, or fake payment statuses. Every feature must operate end-to-end:
   $$\text{UI} \longleftrightarrow \text{API} \longleftrightarrow \text{Engine} \longleftrightarrow \text{Database} \longleftrightarrow \text{Audit Log}$$
2. **Zero Internal Data Leakage:**  
   Customer portal endpoints and DTOs (`/api/portal/*` and `/api/customers/me/*`) must never expose internal cost prices, margin percentages, internal risk scores, or staff approval notes.
3. **Financial Precision Standard:**  
   All monetary amounts, costs, discounts, and margins must strictly utilize **`DECIMAL(18, 4)`** precision in C# and SQL Server. Never use `float` or `double` for currency operations.

---

## 2. Git & Branching Strategy

- **Active Development Branch:** `frontend`
- **Feature Branches:** `feat/<feature-name>`
- **Bugfix Branches:** `fix/<bug-description>`
- **Documentation Branches:** `docs/<document-name>`

### Standard Contribution Workflow:
```powershell
# 1. Fetch latest changes
git checkout frontend
git pull origin frontend

# 2. Create your feature branch
git checkout -b feat/your-feature-name

# 3. Make changes and verify locally
# Run build and automated test suites

# 4. Commit using Conventional Commits
git commit -m "feat: add warehouse stock threshold notifications"

# 5. Push branch and open a Pull Request against 'frontend'
git push origin feat/your-feature-name
```

---

## 3. Commit Message Standards

Commit messages must follow the **Conventional Commits** specification:

- `feat: <description>` — New user-facing or domain feature
- `fix: <description>` — Bug fix or error resolution
- `docs: <description>` — Documentation additions or revisions
- `refactor: <description>` — Code refactoring with no functional change
- `test: <description>` — Adding or updating test suites
- `chore: <description>` — Build tooling, dependencies, or configuration

---

## 4. Local Development Standards

### 4.1 Backend (ASP.NET Core / C# 12 / .NET 10)
- Maintain Clean Architecture and Domain-Driven Design boundaries.
- Domain logic belongs in the 13 Core Engines under `Services/Engines/`, not inside Controllers.
- All database mutations must be executed through asynchronous Entity Framework Core methods (`SaveChangesAsync`).
- Use FluentValidation for all incoming request DTOs.
- Wrap external and notification calls in safe blocks so non-critical side effects do not crash primary transactional commits.

### 4.2 Frontend (React 19 / Vite / Tailwind v4)
- Build clean, functional components with semantic HTML.
- Use Tailwind CSS v4 utility classes and the unified design system components (`Button`, `Modal`, `DataTable`, `Drawer`, `Select`, `Input`, `StatusBadge`).
- Route all HTTP communications through `frontend/src/api/apiClient.js`.
- Always handle loading, error, and empty states gracefully.

---

## 5. Pre-Commit Verification Checklist

Before submitting a Pull Request, verify that:

- [ ] Backend compiles cleanly with zero errors:
  ```powershell
  cd "backend\DealFlow360.API\DealFlow360.API"
  dotnet build --configuration Release
  ```
- [ ] Frontend builds with zero errors:
  ```powershell
  cd "frontend"
  npm run build
  ```
- [ ] Automated end-to-end tests pass against the running backend:
  ```powershell
  node scripts/test_qa_dataset_e2e.js
  node scripts/test_sales_rep_negotiation_e2e.js
  node scripts/test_quotation_pdf_generation_e2e.js
  ```
- [ ] No real production secrets, credentials, or private connection strings are staged.
