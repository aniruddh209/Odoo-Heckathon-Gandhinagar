# DealFlow360 — Customer Self-Registration & Onboarding Experience

## 1. Executive Summary
Customer Self-Registration enables B2B buyers and client organizations to onboard themselves into the DealFlow360 platform without manual administrative intervention. It couples an aesthetically refined split-screen registration interface with a robust, transactionally isolated backend provisioning pipeline.

---

## 2. Customer Journey Flow

```
[Public Visitor]
       │
       ▼
 [GET /signup] ──► Fills Company, Contact & Security Credentials
       │
       ▼
 [Client-Side Validation] ──► Real-time password criteria checklist
       │
       ▼
 [POST /api/auth/register] ──► ASP.NET Core EF Core Execution Strategy
       │
       ├─► Creates Customer Entity (Assigned default Bronze Tier)
       ├─► Creates User Entity (Role = Customer, BCrypt Password Hash)
       └─► Issues JWT carrying CustomerId claim
       │
       ▼
 [Registration Success Modal] ──► Displays account confirmation & scope
       │
       ▼
 [Redirect to /portal/my-account] ──► Immediate access to quotations & orders
```

---

## 3. UI/UX Design & Interactions (`SignupPage.jsx`)

### Left Hero Column (Desktop 50% split)
- **Ambient Visuals**: Dark gradient (`slate-950` to `blue-950`) with radial lighting glow.
- **Value Proposition**: "Seamless B2B Commercial Collaboration & Negotiation".
- **Feature Cards**:
  1. *Transparent Commercial Proposals*: Clear equipment, service, and volume tier pricing.
  2. *Interactive Line-Item Clarification*: Direct messaging on individual proposal line items.
  3. *Order Tracking & Unified Invoices*: Milestone delivery schedules and payment histories.
- **Tenant Isolation Badge**: "MSSQL Encrypted • Zero-Leak Tenant Isolation".

### Right Form Container
- **Company & Contact Information**:
  - `Contact Full Name` (required, auto-completes `name`).
  - `Company / Account Name` (required, auto-completes `organization`).
  - `Work Email` (required, auto-completes `email`, lowercase normalized).
  - `Phone Number` (optional, formatted).
- **Security Credentials**:
  - `Password` & `Confirm Password` with individual reveal toggles (`Eye` / `EyeOff`).
  - **Live Password Quality Checklist**:
    - [x] At least 8 characters
    - [x] One uppercase letter (`[A-Z]`)
    - [x] One lowercase letter (`[a-z]`)
    - [x] One numeric digit (`[0-9]`)
    - [x] Passwords match
  - Submit button is disabled until all criteria are satisfied.
- **Post-Registration Modal**:
  - Informs user that their account and organization have been created in MSSQL.
  - Summarizes the registered account details and role scope (`Customer Portal`).
  - One-click action button: `Proceed to Customer Portal`.

---

## 4. Backend Provisioning Guarantee
- **Atomic Transaction**: Executed inside `SqlServerRetryingExecutionStrategy`. If creating either the customer entity or user account fails, all changes roll back completely.
- **Strict Role Lockdown**: Regardless of any client-submitted payload fields, the backend strictly enforces `Role.Customer`.
- **Default Commercial Tier**: Self-registered accounts are assigned the `Bronze` tier (safest discount limit, 5% max discount).
- **Tenant Scoping**: All future queries through the customer portal are scoped by `CustomerId` read directly from the verified JWT claims, preventing any unauthorized visibility into internal CRM records or other customers' deals.
