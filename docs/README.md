# DealFlow360: Master Documentation Index & Authority Directory

---

## 1. Documentation Authority Model & Single Source of Truth

The DealFlow360 project is governed by a strict four-tier documentation hierarchy:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               1. BUSINESS REQUIREMENT SOURCE OF TRUTH                  │
│                     `DealFlow360.pdf` (13 Pages)                       │
│    Defines WHAT the system must achieve, rules, roles, and constraints │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Governs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│            2. PRIMARY ENGINEERING / ARCHITECTURE REFERENCE             │
│   `DealFlow360_ASPNet_SQLServer_React_Complete_Implementation_Spec.pdf` │
│    Defines HOW we build it: ASP.NET Core, EF Core, SQL Server, React   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Governs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    3. MASTER TRACEABILITY MATRIX                       │
│      `docs/requirements/DEALFLOW360_REQUIREMENT_TRACEABILITY.md`       │
│    Guarantees 100% bidirectional traceability from PDF to code & tests  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Governs
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   4. DOMAIN ARCHITECTURAL BLUEPRINTS                   │
│   API • Database • Backend • Frontend • Security • Testing • Workflows  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Master Documentation Directory

| Domain | Document Path | Scope & Authority |
| :--- | :--- | :--- |
| **Requirements & PRD** | [`docs/DEALFLOW360_MASTER_PRD.md`](DEALFLOW360_MASTER_PRD.md) | Comprehensive Master Product Requirements Document capturing all functional personas, rules, and acceptance criteria. |
| **Traceability Matrix** | [`docs/requirements/DEALFLOW360_REQUIREMENT_TRACEABILITY.md`](requirements/DEALFLOW360_REQUIREMENT_TRACEABILITY.md) | Complete 39-requirement traceability matrix mapping PDF requirements to services, endpoints, tables, screens, and tests. |
| **Architecture Decision** | [`docs/architecture/ADR-001-TECHNOLOGY-STACK.md`](architecture/ADR-001-TECHNOLOGY-STACK.md) | Official Architecture Decision Record locking React + ASP.NET Core + SQL Server and justifying the elimination of legacy monoliths. |
| **Consistency Audit** | [`docs/architecture/ARCHITECTURE_CONSISTENCY_REPORT.md`](architecture/ARCHITECTURE_CONSISTENCY_REPORT.md) | Repository-wide stack audit verifying zero lingering architectural contradictions. |
| **API Contract** | [`docs/api/DEALFLOW360_API_SPEC.md`](api/DEALFLOW360_API_SPEC.md) | 28 RESTful HTTP endpoints, route catalogue, request/response DTOs, status codes, and error envelopes. |
| **API Traceability** | [`docs/api/DEALFLOW360_API_TRACEABILITY.md`](api/DEALFLOW360_API_TRACEABILITY.md) | Maps API routes to business engines, SQL Server tables, and automated test cases. |
| **Database Blueprint** | [`docs/database/DEALFLOW360_DATABASE_ARCHITECTURE.md`](database/DEALFLOW360_DATABASE_ARCHITECTURE.md) | 30 Microsoft SQL Server relational tables, T-SQL data types (`DECIMAL(18, 4)`), nonclustered indexes, and EF Core configurations. |
| **Visual ER Diagrams** | [`docs/database/DEALFLOW360_ERD.md`](database/DEALFLOW360_ERD.md) | 10 GitHub-compatible visual Mermaid ER diagrams covering all system domains. |
| **Backend Architecture** | [`docs/backend/DEALFLOW360_BACKEND_ARCHITECTURE.md`](backend/DEALFLOW360_BACKEND_ARCHITECTURE.md) | C# 12 / .NET 9 Clean Architecture, 13 core business engines, concurrency middleware, and background hosted workers. |
| **Frontend Architecture**| [`docs/frontend/DEALFLOW360_FRONTEND_ARCHITECTURE.md`](frontend/DEALFLOW360_FRONTEND_ARCHITECTURE.md) | React 18/19 (Vite + TS + Tailwind), 13 role-based screens, TanStack Query server caching, Zustand UI stores, and zero-leak portal. |
| **Security Architecture**| [`docs/security/DEALFLOW360_SECURITY_ARCHITECTURE.md`](security/DEALFLOW360_SECURITY_ARCHITECTURE.md) | RBAC model, JWT Bearer claims, HMAC magic links, Zero-Leak DTO shielding, optimistic concurrency, and audit logging. |
| **Workflows & States** | [`docs/workflows/DEALFLOW360_END_TO_END_WORKFLOWS.md`](workflows/DEALFLOW360_END_TO_END_WORKFLOWS.md) | The 17 core end-to-end operational workflows and 7 state machines (Quote, Approval, Order, Invoice, Subscription, Negotiation, Health). |
| **Testing Strategy** | [`docs/testing/DEALFLOW360_TESTING_STRATEGY.md`](testing/DEALFLOW360_TESTING_STRATEGY.md) | xUnit test architecture, 15-step must-pass E2E test, authorization test matrix, business edge cases, and 5-minute judge demo script. |
| **Deployment & Docker** | [`docs/deployment/DEALFLOW360_DEPLOYMENT_ARCHITECTURE.md`](deployment/DEALFLOW360_DEPLOYMENT_ARCHITECTURE.md) | Docker Compose specification, multi-stage Dockerfiles for backend and frontend, local developer setup, and hardening checklist. |
| **Documentation Log** | [`docs/CHANGELOG_DOCUMENTATION.md`](CHANGELOG_DOCUMENTATION.md) | Complete audit log of all document modifications, additions, and contradiction resolutions. |

---

## 3. Quick Reference: Where Do I Find...?

- **How is the Blended Risk Score calculated?**
  $\rightarrow$ See [`docs/backend/DEALFLOW360_BACKEND_ARCHITECTURE.md` §4.2](backend/DEALFLOW360_BACKEND_ARCHITECTURE.md#42-blended-discount-risk-score-engine).
- **How is customer data shielded during negotiations?**
  $\rightarrow$ See [`docs/security/DEALFLOW360_SECURITY_ARCHITECTURE.md` §5](security/DEALFLOW360_SECURITY_ARCHITECTURE.md#5-strict-zero-leak-customer-boundary).
- **What are the exact SQL Server table definitions?**
  $\rightarrow$ See [`docs/database/DEALFLOW360_DATABASE_ARCHITECTURE.md` §3](database/DEALFLOW360_DATABASE_ARCHITECTURE.md#3-table--field-specifications-t-sql-data-types).
- **What endpoints exist for quotes and approvals?**
  $\rightarrow$ See [`docs/api/DEALFLOW360_API_SPEC.md` §10 & §12](api/DEALFLOW360_API_SPEC.md).
- **What are the valid state transitions for quotations?**
  $\rightarrow$ See [`docs/workflows/DEALFLOW360_END_TO_END_WORKFLOWS.md` §3.1](workflows/DEALFLOW360_END_TO_END_WORKFLOWS.md#31-quotation-lifecycle-state-machine).
- **How do I execute the 5-Minute Judge Demo?**
  $\rightarrow$ See [`docs/testing/DEALFLOW360_TESTING_STRATEGY.md` §7](testing/DEALFLOW360_TESTING_STRATEGY.md#7-five-minute-judge-demo-script).
- **How do I spin up the local development environment?**
  $\rightarrow$ See [`docs/deployment/DEALFLOW360_DEPLOYMENT_ARCHITECTURE.md` §5](deployment/DEALFLOW360_DEPLOYMENT_ARCHITECTURE.md#5-local-developer-setup-windows-host).
