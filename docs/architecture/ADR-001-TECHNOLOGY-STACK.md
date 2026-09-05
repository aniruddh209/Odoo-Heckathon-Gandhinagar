# ADR-001: Technology Stack Selection for DealFlow360

---

## Status
**ACCEPTED / LOCKED** (Non-Negotiable Baseline)

## Date
2026-09-05

## Context & Problem Statement
DealFlow360 is an intelligent, self-governing sales operations platform designed to eliminate margin leakage, enforce multi-tier discount governance, automate complex multi-warehouse fulfillment, manage hybrid one-time and recurring billing schedules, and provide a secure, zero-leak customer negotiation portal.

The platform requirements are specified across the 13-page `DealFlow360.pdf` specification. Key operational characteristics include:
1. High-frequency reactive calculations (Blended Discount Risk Score, Gross Margin %, Upsell Margin Delta) requiring sub-100ms evaluation.
2. Two-tier approval state machine requiring strict concurrency controls, optimistic locking, and immutable audit logging.
3. Cryptographically isolated customer portal requiring zero-leak data boundaries (preventing exposure of cost prices, margins, or internal notes).
4. Multi-warehouse greedy fulfillment split and backorder consolidation with ACID consistency.
5. Hybrid billing orchestration generating immediate invoices alongside recurring subscription schedules with calendar-exact proration.
6. Background monitoring for stalled deals, discount anomalies (STDDEV analysis), and delivery slippages.

Earlier prototype drafts explored an Odoo/Python backend. However, an architectural review evaluated the requirements against enterprise maintainability, type safety, deterministic financial math, decoupled frontend flexibility, and platform performance.

---

## Decision

The technology stack for DealFlow360 is permanently locked as follows:

```text
┌─────────────────────────────────────────────────────────────┐
│                 Frontend Presentation Layer                 │
│         React 18/19 + Vite + TypeScript + Tailwind CSS      │
│            TanStack Query + Zustand + Lucide Icons          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON REST APIs
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 API & Presentation Layer                    │
│      ASP.NET Core Web API (.NET 9/8) + Swagger / OpenAPI    │
│        JWT Bearer Authentication + Rate Limiting Middleware │
└──────────────────────────────┬──────────────────────────────┘
                               │ Clean Architecture Invocation
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Application & Business Layer                 │
│      C# Domain Services, Engines & MediatR Handlers         │
│     FluentValidation, Pipeline Behaviors & Domain Events    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                Infrastructure & Persistence                 │
│      Entity Framework Core (EF Core) + Dapper (Reporting)   │
│         .NET BackgroundService (Automated Workflows)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ T-SQL / Connection Pooling
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                        │
│             Microsoft SQL Server (MSSQLSERVER)              │
│       ACID Transactions, DECIMAL(18,4), Strict FKs          │
└──────────────────────────────┘
```

### Component Breakdown

| Tier | Chosen Technology | Role & Purpose |
| :--- | :--- | :--- |
| **Frontend** | **React (Vite + TypeScript)** | Single-Page Application (SPA) delivering instant UI reactivity, interactive quote builder, dynamic discount sliders, drawer navigations, and isolated customer portal view. |
| **Styling & UI** | **Tailwind CSS + Lucide** | Dense, highly legible enterprise B2B styling, dark/light theme tokens, and accessible interactive states. |
| **Client State** | **TanStack Query + Zustand** | Server-state caching, optimistic updates, background revalidation, and decoupled local modal/drawer UI state. |
| **Backend Framework** | **ASP.NET Core (.NET 9/8, C#)** | High-throughput, cross-platform enterprise framework providing DI, middleware pipelines, OpenAPI generation, and asynchronous performance. |
| **Application Layer** | **C# Clean Architecture** | Decoupled domain models, command/query handlers, validation pipelines, and business engines. |
| **Data Access / ORM** | **Entity Framework Core** | Code-First migrations, change tracking, optimistic concurrency (`ROWVERSION`), Linq query translation, and Unit of Work transactions. |
| **Reporting Acceleration**| **Dapper** | Lightweight micro-ORM for high-speed analytical aggregate queries and sales performance export pipelines. |
| **Database** | **Microsoft SQL Server** | Enterprise relational database guaranteeing ACID transaction safety, strict foreign key constraints, `DECIMAL(18, 4)` currency precision, and index optimization. |
| **Background Processing**| **.NET `BackgroundService`**| Long-running hosted background tasks executing daily stalled-deal detection, discount anomaly statistical evaluations, and recurring billing generation. |
| **Authentication** | **ASP.NET Core Identity & JWT** | Secure PBKDF2/Argon2 password hashing, stateless JWT issuance, claims-based authorization policies, and cryptographic HMAC magic links. |

---

## Detailed Rationale Connected to PDF Requirements

### 1. Interactive Quotation Builder & Live Financial Feedback
- **Requirement**: Reps require sub-100ms feedback on margin percentage, category ceiling violations, and blended discount risk scores as quantities and discounts are manipulated.
- **Why React + ASP.NET Core**: React's virtual DOM and optimistic local calculation functions provide instant UI feedback, while ASP.NET Core's high-performance Kestrel web server processes authoritative server-side recalculations in single-digit milliseconds.

### 2. Deterministic Financial Precision & ACID Transactions
- **Requirement**: Quotes involve multi-line discounts, tiered markups, warehouse shipping fees, and prorated subscription fees where rounding errors lead to margin leaks.
- **Why SQL Server & C# `decimal`**: C# provides an IEEE-compliant 128-bit `decimal` type with 28–29 significant digits. SQL Server guarantees `DECIMAL(18, 4)` financial storage without floating-point drift. ACID transaction scopes guarantee that quote confirmations, line updates, and stock allocations commit atomically.

### 3. Strict Zero-Leak Customer Negotiation Boundary
- **Requirement**: Customer portal users must negotiate via magic links without seeing unit cost prices, profit margins, deal profit percentages, or internal approval chatter.
- **Why Decoupled DTOs in ASP.NET Core**: ASP.NET Core uses strongly-typed DTOs (`CustomerQuoteDto`) that physically omit cost and margin fields. The React portal bundle never receives internal metrics over the network, ensuring zero data leakage.

### 4. Multi-Tier Approval Workflow & Optimistic Concurrency
- **Requirement**: Quotes exceeding discount thresholds require Level 1 (Manager) or Level 2 (Finance) approvals. If a customer counters while a manager reviews, conflicts must be detected.
- **Why EF Core Concurrency Tokens**: EF Core maps `ROWVERSION` / concurrency tokens to detect conflicting modifications and throw `DbUpdateConcurrencyException`, allowing the API to return `409 Conflict` with diff resolution.

### 5. Multi-Warehouse Greedy Fulfillment & Backorders
- **Requirement**: Orders must split across warehouses based on availability and shipping cost, with backorder consolidation triggers upon inventory replenishment.
- **Why .NET Domain Engines**: C# strongly-typed collections and LINQ algorithms model warehouse prioritization, allocation splits, and backorder reservations cleanly with full unit test coverage.

### 6. Hybrid Billing & Proration Engine
- **Requirement**: A single quote generates both immediate commercial invoices for one-time items and automated recurring subscription billing schedules with calendar-exact proration.
- **Why Background Services & SQL Server**: SQL Server relational tables cleanly partition `Invoices` and `SubscriptionContracts`. .NET `BackgroundService` instances poll active subscriptions and execute billing schedules reliably without external cron dependencies.

---

## Alternatives Evaluated & Why They Were Rejected

### Alternative 1: Odoo / Python Monolith
- **Rejection Reason**: Odoo's Active Record ORM tightly couples UI views, business logic, and database tables. Generating custom REST APIs requires overhead. Maintaining strict zero-leak client DTO boundaries is difficult in Odoo's open model inspection paradigm. Python's dynamic typing introduces runtime risks in complex multi-step financial algorithms.

### Alternative 2: Node.js / Express / MongoDB (MERN)
- **Rejection Reason**: MongoDB lacks native transactional rigor and relational constraint enforcement across 30 enterprise entities. JavaScript's IEEE 754 floating-point math can introduce rounding errors in currency and margin calculations.

---

## Consequences & Governance

### Positive Consequences
- Strict separation of concerns (React UI completely separated from backend domain logic).
- Strong compile-time type safety across the entire backend and API contract.
- Zero-leak customer portal security enforced at the API serialization boundary.
- High testability using xUnit, Moq, and `WebApplicationFactory`.
- Production-grade database reliability with Microsoft SQL Server.

### Negative / Mitigated Consequences
- **Contract Parity Overhead**: Frontend TypeScript types must stay synchronized with C# DTOs.
  - *Mitigation*: Automated OpenAPI/Swagger generation and TypeScript schema mapping.
- **Two Separate Runtimes**: Development requires Node.js (Vite) and .NET SDK.
  - *Mitigation*: Standardized multi-stage Dockerfiles and simple startup scripts.
