# DealFlow360 — Master Documentation Directory & Engineering Index

Welcome to the central documentation directory for **DealFlow360**, an enterprise sales operations, automated governance, fulfillment, and revenue management platform.

---

## 1. Primary Documentation Catalogue

The table below provides direct access to all authoritative system documentation:

| Document | File Path | Target Audience | Primary Scope |
| :--- | :--- | :--- | :--- |
| **Quick Start & Overview** | [`README.md`](../README.md) | All Personas | System introduction, quick start in < 1 min, locked tech stack, and core workflows. |
| **Installation & Setup** | [`INSTALLATION.md`](INSTALLATION.md) | Developers, DevOps | Prerequisites, database configuration, backend & frontend startup, and verification. |
| **Technical Architecture** | [`ARCHITECTURE.md`](ARCHITECTURE.md) | Architects, Leads | Decoupled React 19 + .NET 10 architecture, 13 domain engines, and security boundaries. |
| **End-to-End Workflows** | [`WORKFLOWS.md`](WORKFLOWS.md) | Operations, QA | Quotation lifecycle, discount tiers, multi-tier approvals, fulfillment, billing, and negotiation. |
| **Roles & Permissions** | [`ROLES_AND_PERMISSIONS.md`](ROLES_AND_PERMISSIONS.md) | Security, QA | Functional permission matrix across Admin, Sales Manager, Sales Rep, Finance, and Customer. |
| **REST API Specification** | [`API.md`](API.md) | Developers, Integrators | Complete RESTful route catalogue, request/response models, and Scalar / OpenAPI reference. |
| **Database Architecture** | [`DATABASE.md`](DATABASE.md) | DBAs, Developers | 38 SQL Server tables, `DECIMAL(18, 4)` precision standard, ERDs, and seeding lifecycle. |
| **Testing & Quality Assurance**| [`TESTING.md`](TESTING.md) | QA Engineers, Leads | Automated test suites (`scripts/`), 13-phase master E2E audit, and reproduction commands. |
| **QA Reference Master Dataset** | [`QA_DATA.md`](QA_DATA.md) | QA, Demo Presenters | 5 customer accounts, 12 demo users, 24 catalog products, warehouses, and discount limits. |
| **Production Deployment** | [`DEPLOYMENT.md`](DEPLOYMENT.md) | DevOps, SREs | Packaging, Dockerfiles, Nginx reverse proxy config, environment variables, and pre-flight checks. |
| **Security & Data Governance** | [`SECURITY.md`](SECURITY.md) | Security Engineers | BCrypt hashing, JWT Bearer claims, HMAC magic links, Zero-Leak DTO shielding, and audit logs. |
| **Troubleshooting Runbook** | [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md) | Support, Developers | Solutions for LocalDB connection issues, port conflicts, seeding behavior, and domain edge cases. |
| **Script Reference** | [`SCRIPTS.md`](SCRIPTS.md) | Developers, DevOps | Guide to all npm lifecycle hooks, database reset scripts, and node automation test runners. |
| **Contributing Guidelines** | [`CONTRIBUTING.md`](../CONTRIBUTING.md) | Contributors | Branching strategy, Conventional Commits, coding standards, and PR requirements. |

---

## 2. Interactive API Documentation

When the backend server is running (`http://localhost:5042`), interactive documentation and schema definitions are accessible at:

- **Scalar Interactive API Console:** `http://localhost:5042/scalar/v1`
- **OpenAPI 3.0 Raw Specification:** `http://localhost:5042/openapi/v1.json`

---

## 3. Specialized Deep-Dive Blueprints

For granular reference from earlier planning and domain modeling phases, consult the domain subdirectories:
- `docs/architecture/ADR-001-TECHNOLOGY-STACK.md` — Architectural Decision Record locking React + .NET.
- `docs/backend/DEALFLOW360_BACKEND_ARCHITECTURE.md` — Granular backend implementation blueprints.
- `docs/database/DEALFLOW360_ERD.md` — Visual Mermaid entity-relationship diagrams.
- `docs/frontend/DEALFLOW360_FRONTEND_ARCHITECTURE.md` — Detailed frontend view and screen specifications.
- `docs/requirements/DEALFLOW360_REQUIREMENT_TRACEABILITY.md` — Bidirectional requirement traceability.
