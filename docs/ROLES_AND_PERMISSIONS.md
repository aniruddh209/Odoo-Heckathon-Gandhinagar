# DealFlow360 — Roles & Permissions Matrix

This document provides the authoritative security and authorization reference for **DealFlow360**, defining the capabilities, boundaries, and endpoint access for every user role across both the internal CRM and the external customer portal.

---

## 1. System Roles Overview

| Role Key | Role Name | Primary Description | Scope & Surface |
| :--- | :--- | :--- | :--- |
| `Admin` | System Administrator | Full platform superuser. Controls master data, product catalogs, user accounts, and system-wide configurations. | Global Internal CRM |
| `SalesManager` | Sales Operations Manager | Oversees the sales pipeline, reviews and adjudicates discount approval requests, monitors deal velocity and team performance. | Internal CRM Management |
| `SalesRep` | Commercial Sales Representative | Creates and manages quotations, negotiates with customers, tracks pipeline opportunities, and monitors deal health. | Internal CRM Operations |
| `FinanceOperations` | Finance Operations Director | Evaluates escalated high-discount/high-risk approval requests, oversees invoice generation, records payments, and issues credit memos. | Internal CRM Finance |
| `Customer` | Enterprise Client / Buyer | Reviews commercial proposals, downloads official PDFs, submits line comments and counter-offers, and formally authorizes quotations. | Isolated Customer Portal |

---

## 2. Granular Functional Permissions Matrix

| Functional Capability | Admin | Sales Manager | Sales Rep | Finance Ops | Customer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Authentication & Profile** |
| Log in via email/password | ✅ | ✅ | ✅ | ✅ | ✅ |
| Change own password & view profile | ✅ | ✅ | ✅ | ✅ | ✅ |
| **User & Staff Administration** |
| Create, update, or deactivate staff users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Assign sales teams and managers | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Product & Catalog Management** |
| Create / edit products & variants | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage product categories & base price lists | ✅ | ❌ | ❌ | ❌ | ❌ |
| View active product catalog | ✅ | ✅ | ✅ | ✅ | ✅ (Portal) |
| **Quotation & Commercial Proposals** |
| Create new commercial quotations | ✅ | ✅ | ✅ | ❌ | ❌ |
| Edit draft quotations & modify line items | ✅ | ✅ | ✅ (Assigned) | ❌ | ❌ |
| View internal margin % and cost price | ✅ | ✅ | ✅ | ✅ | ❌ (Zero-Leak) |
| View blended risk score ($0–100$) | ✅ | ✅ | ✅ | ✅ | ❌ (Zero-Leak) |
| Submit quote for internal governance review | ✅ | ✅ | ✅ | ❌ | ❌ |
| Generate customer portal magic link | ✅ | ✅ | ✅ | ❌ | ❌ |
| Download commercial proposal PDF | ✅ | ✅ | ✅ (Assigned) | ✅ | ✅ (Portal) |
| Convert approved quote to active order | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Discount Governance & Approvals** |
| View pending approval requests queue | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve Level 1 (Manager) discount requests | ✅ | ✅ | ❌ | ❌ | ❌ |
| Approve Level 2 (Finance) escalated requests | ✅ | ❌ | ❌ | ✅ | ❌ |
| Reject discount requests with remarks | ✅ | ✅ | ❌ | ✅ | ❌ |
| Approve own submitted quotation | ❌ (Forbidden) | ❌ (Forbidden) | ❌ (Forbidden) | ❌ (Forbidden) | ❌ |
| **Warehouse & Fulfillment** |
| View fulfillment orders & allocations | ✅ | ✅ | ✅ | ✅ | ❌ |
| Execute warehouse allocation algorithm | ✅ | ✅ | ✅ | ✅ | ❌ |
| Dispatch package & assign tracking number | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Billing, Invoicing & Payments** |
| View customer invoices & payment logs | ✅ | ✅ | ✅ | ✅ | ✅ (Own Only) |
| Record customer payments (Wire, UPI, Card) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Issue reconciliation credit notes | ✅ | ❌ | ❌ | ✅ | ❌ |
| Manage recurring subscription schedules | ✅ | ✅ | ❌ | ✅ | ❌ |
| **Analytics, Health & Reports** |
| View deal health summary & stalled alerts | ✅ | ✅ | ❌ | ❌ | ❌ |
| View sales revenue & discount reports | ✅ | ✅ | ❌ | ✅ | ❌ |
| View system audit log trail | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Customer Portal Surface** |
| Access internal CRM navigation routes | ✅ | ✅ | ✅ | ✅ | ❌ (Redirected) |
| Submit line-item comment via portal | ❌ | ❌ | ❌ | ❌ | ✅ |
| Submit counter-discount proposal | ❌ | ❌ | ❌ | ❌ | ✅ |
| Formally authorize & bind proposal | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 3. Backend Endpoint Security Mapping

| Endpoint Pattern | Allowed Roles | Enforced Policy |
| :--- | :--- | :--- |
| `POST /api/auth/login` | Anonymous | Public |
| `GET /api/auth/me` | Authenticated | All active roles |
| `GET /api/admin/products` | `Admin, SalesManager, SalesRep, FinanceOperations` | Read catalog |
| `POST /api/admin/products` | `Admin` | `RequireAdmin` |
| `GET /api/quotations` | `Admin, SalesManager, SalesRep, FinanceOperations` | Filtered by role |
| `POST /api/quotations` | `Admin, SalesManager, SalesRep` | `RequireSalesRep` |
| `GET /api/approvals` | `Admin, SalesManager, FinanceOperations` | `RequireSalesManager` / `RequireFinance` |
| `POST /api/approvals/{id}/approve` | `Admin, SalesManager, FinanceOperations` | Validates level & forbids self-approval |
| `POST /api/invoices/{id}/pay` | `Admin, FinanceOperations` | `RequireFinance` |
| `POST /api/invoices/{id}/credit-notes` | `Admin, FinanceOperations` | `RequireFinance` |
| `GET /api/dealhealth/summary` | `Admin, SalesManager` | `RequireSalesManager` |
| `GET /api/reports/*` | `Admin, SalesManager, FinanceOperations` | Executive reporting |
| `GET /api/customers/me/*` | `Customer, Admin` | `RequireCustomer` (Scoped to CustomerId claim) |
| `POST /api/portal/quote/{token}/*` | Anonymous (HMAC Token) | Cryptographic token validation |
