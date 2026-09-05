# DealFlow360 — Role-Based Access Control (RBAC) Matrix

This document defines the server-enforced authorization rules across all controllers and system resources in the ASP.NET Core backend.

## 1. System Role Hierarchy

1. **Admin** (`Role.Admin`): Global system authority. Master configurations, user management, financial rules, product catalogs, approvals, reports.
2. **SalesManager** (`Role.SalesManager`): Team-level supervisory authority. Manages quotes, approvals, deal health, and creates/manages team Sales Representatives.
3. **SalesRep** (`Role.SalesRep`): Frontline commercial execution. Creates and edits quotes, manages pipeline opportunities, registers customers.
4. **FinanceOperations** (`Role.FinanceOperations`): Financial and warehouse governance. Warehouse inventory allocation, backorders, fulfillment, hybrid billing, invoices.
5. **Customer** (`Role.Customer`): External client access. Scoped strictly to their own quotations, order history, invoice visibility, and digital confirmation.

---

## 2. Controller & Endpoint Access Matrix

| Endpoint Area | Method | Path | Rep | Manager | Finance | Admin | Customer |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication** | POST | `/api/auth/login` | Public | Public | Public | Public | Public |
| | GET | `/api/auth/me` | Allowed | Allowed | Allowed | Allowed | Allowed |
| | POST | `/api/auth/change-password` | Allowed | Allowed | Allowed | Allowed | Allowed |
| **Users** | GET | `/api/users` | ❌ 403 | Reps Only | ❌ 403 | All Users | ❌ 403 |
| | POST | `/api/users` | ❌ 403 | Reps Only | ❌ 403 | Any Role | ❌ 403 |
| | PUT | `/api/users/{id}` | ❌ 403 | ❌ 403 | ❌ 403 | Allowed | ❌ 403 |
| | POST | `/api/users/{id}/toggle-status` | ❌ 403 | ❌ 403 | ❌ 403 | Allowed | ❌ 403 |
| **Customers** | GET | `/api/customers` | Allowed | Allowed | Allowed | Allowed | ❌ 403 |
| | POST | `/api/customers` | Allowed | Allowed | ❌ 403 | Allowed | ❌ 403 |
| | GET | `/api/customers/{id}/360` | Allowed | Allowed | Allowed | Allowed | ❌ 403 |
| | GET | `/api/customers/me/quotations` | ❌ 400* | ❌ 400* | ❌ 400* | Allowed | Scoped |
| | POST | `/api/customers/me/quotations/{id}/confirm` | ❌ 400* | ❌ 400* | ❌ 400* | Allowed | Scoped |
| | GET | `/api/customers/me/orders` | ❌ 400* | ❌ 400* | ❌ 400* | Allowed | Scoped |
| | GET | `/api/customers/me/invoices` | ❌ 400* | ❌ 400* | ❌ 400* | Allowed | Scoped |
| **Quotations** | GET | `/api/quotations` | Allowed | Allowed | Allowed | Allowed | ❌ 403 |
| | POST | `/api/quotations` | Allowed | Allowed | ❌ 403 | Allowed | ❌ 403 |
| | GET | `/api/quotations/{id}` | Allowed | Allowed | Allowed | Allowed | ❌ 403 |
| **Approvals** | GET | `/api/approvals/pending` | ❌ 403 | Allowed | Allowed | Allowed | ❌ 403 |
| | POST | `/api/approvals/{id}/action` | ❌ 403 | Allowed | Allowed | Allowed | ❌ 403 |
| **Fulfillment** | GET | `/api/fulfillment/allocations` | ❌ 403 | ❌ 403 | Allowed | Allowed | ❌ 403 |
| | POST | `/api/fulfillment/release` | ❌ 403 | ❌ 403 | Allowed | Allowed | ❌ 403 |
| **Billing** | GET | `/api/billing/invoices` | ❌ 403 | Allowed | Allowed | Allowed | ❌ 403 |
| | POST | `/api/billing/generate` | ❌ 403 | ❌ 403 | Allowed | Allowed | ❌ 403 |
| **Deal Health** | GET | `/api/dealhealth/radar` | ❌ 403 | Allowed | ❌ 403 | Allowed | ❌ 403 |
| **Admin Setup** | GET/POST | `/api/admin/*` | ❌ 403 | ❌ 403 | ❌ 403 | Allowed | ❌ 403 |

*\*Note: Non-customer users requesting `/api/customers/me/*` receive `400 Bad Request` ("User is not linked to a customer account") unless Admin.*

---

## 3. Security Boundary Guarantees
1. **Zero Data Leakage**: External customers authenticate using isolated customer portal tokens and cannot query internal pipelines, other customer accounts, or employee user directories.
2. **Horizontal Tenant Scoping**: Customer portal queries use claims-based `CustomerId` extracted from the cryptographically signed JWT, preventing enumeration of competitor quotes.
3. **Execution Strategy Concurrency**: High-frequency transactions (such as customer creation and quotation confirmation) execute through SQL Server retrying execution strategies to ensure ACID guarantees.
