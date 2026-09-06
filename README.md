# DealFlow360: Intelligent, Self-Governing Sales Operations Platform

DealFlow360 is an enterprise-grade sales operations platform designed to eliminate margin leakage, enforce automated multi-tier discount governance, optimize multi-warehouse fulfillment, manage hybrid one-time and recurring billing schedules, and provide a secure, zero-leak customer negotiation portal.

---

## 🚀 Locked Technology Stack

The platform is built on a modern, high-performance, fully decoupled enterprise stack:

- **Frontend**: React 18/19 (Vite + TypeScript + Tailwind CSS + Lucide Icons + TanStack Query + Zustand)
- **Backend**: ASP.NET Core Web API (.NET 9/8, C# 12) structured via Clean Architecture & Domain-Driven Design (DDD)
- **Data Access & ORM**: Entity Framework Core 9/8 (`Microsoft.EntityFrameworkCore.SqlServer`) + Dapper for high-speed analytical queries
- **Database**: Microsoft SQL Server (`MSSQLSERVER`) with strict `DECIMAL(18, 4)` financial precision and optimistic concurrency (`ConcurrencyVersion`)
- **Background Processing**: .NET `BackgroundService` hosted workers (daily stalled deal monitoring, discount anomaly detection, subscription billing generation)
- **Authentication & Security**: ASP.NET Core Identity, JWT Bearer tokens with claims-based authorization policies, and cryptographic HMAC magic links for isolated customer portal sessions

---

## 🏛️ System Architecture

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
└─────────────────────────────────────────────────────────────┘
```

---

## ⚙️ The 13 Core .NET Business Engines

1. **Discount Governance Engine**: Enforces customer tier ceilings (Bronze 5%, Silver 10%, Gold 15%) and category limits.
2. **Blended Discount Risk Engine**: Evaluates 0–100 risk score based on peak violation ($40\%$), volume-weighted margin loss ($35\%$), and gross margin deficit ($25\%$).
3. **Approval Routing Engine**: Orchestrates two-tier state machine (Level 1 Sales Manager, Level 2 Finance Director).
4. **Margin Calculation Engine**: Computes line margins and order gross margin % with strict 4-decimal precision.
5. **Upsell / Cross-Sell Engine**: Generates ranked co-purchase recommendations with live gross margin delta calculation.
6. **Warehouse Allocation Engine**: Greedy cost-weighted split optimization across multiple warehouse locations.
7. **Fulfillment Engine**: Manages shipment dispatch records and tracking numbers.
8. **Backorder Consolidation Engine**: Consolidates split shipments automatically upon inventory restock.
9. **Hybrid Billing Engine**: Segregates single orders into immediate commercial invoices and recurring contracts.
10. **Subscription Engine**: Manages subscription schedules, cancellations, and calendar-accurate mid-cycle seat proration.
11. **Customer Negotiation Engine**: Manages isolated portal inquiries and counter-discount proposals with automatic re-approval triggers.
12. **Deal Health Engine**: Identifies stalled deals (>5 days inactivity), rep discount anomalies ($>2\sigma$), and delivery promise slippages.
13. **Alert / Nudge / Escalation Engine**: Dispatches in-app alerts, rep nudges, and management escalations.

---

## 📚 Master Architecture Documentation

All specifications are locked and tracked under `/docs`:

- **Master PRD**: [`docs/DEALFLOW360_MASTER_PRD.md`](docs/DEALFLOW360_MASTER_PRD.md)
- **Architecture Decision Record**: [`docs/architecture/ADR-001-TECHNOLOGY-STACK.md`](docs/architecture/ADR-001-TECHNOLOGY-STACK.md)
- **Consistency Report**: [`docs/architecture/ARCHITECTURE_CONSISTENCY_REPORT.md`](docs/architecture/ARCHITECTURE_CONSISTENCY_REPORT.md)
- **API Contract Specification**: [`docs/api/DEALFLOW360_API_SPEC.md`](docs/api/DEALFLOW360_API_SPEC.md)
- **API Traceability Matrix**: [`docs/api/DEALFLOW360_API_TRACEABILITY.md`](docs/api/DEALFLOW360_API_TRACEABILITY.md)
- **Database Architecture Blueprint**: [`docs/database/DEALFLOW360_DATABASE_ARCHITECTURE.md`](docs/database/DEALFLOW360_DATABASE_ARCHITECTURE.md)
- **Database ER Diagrams**: [`docs/database/DEALFLOW360_ERD.md`](docs/database/DEALFLOW360_ERD.md)
- **Backend Architecture Blueprint**: [`docs/backend/DEALFLOW360_BACKEND_ARCHITECTURE.md`](docs/backend/DEALFLOW360_BACKEND_ARCHITECTURE.md)
- **Frontend Architecture Blueprint**: [`docs/frontend/DEALFLOW360_FRONTEND_ARCHITECTURE.md`](docs/frontend/DEALFLOW360_FRONTEND_ARCHITECTURE.md)

---

## 🔒 Security & Customer Boundary

The customer portal (`/portal/quote/:token`) is cryptographically isolated via SHA-256 HMAC magic links. Cost prices, unit margins, deal profit percentages, internal risk scores, and manager remarks are physically excluded from client-facing DTOs, guaranteeing **zero data leakage** during negotiations.
