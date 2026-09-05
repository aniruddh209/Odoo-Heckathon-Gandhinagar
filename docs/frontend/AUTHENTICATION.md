# DealFlow360 — Frontend Authentication System Architecture

## 1. Overview
The DealFlow360 frontend authentication system provides an enterprise-grade, role-based login and session lifecycle management experience built on:
- **React 19**
- **Tailwind CSS v4**
- **Lucide React**
- **ASP.NET Core Web API + MSSQL JWT Authentication**

---

## 2. Key Architecture Components

### `AuthContext.jsx` (`frontend/src/context/AuthContext.jsx`)
- **State Management**: Holds `user`, `token` (`accessToken`), and `isLoading`.
- **Initialization**: Reads token and cached user from `localStorage` (`dealflow_token`, `dealflow_user`), validates session via `GET /api/auth/me`.
- **Session Auto-Termination**: Listens for the `dealflow:unauthorized` custom window event (dispatched on 401s by `apiClient.js`) and clears local state immediately.
- **Methods**:
  - `login({ email, password })`: Calls `authApi.login(...)`, stores JWT token, updates user context.
  - `signup(userData)`: Calls `authApi.signup(...)`, sets authenticated customer session.
  - `logout()`: Clears credentials, invalidates session, and redirects to `/login`.

### `LoginPage.jsx` (`frontend/src/pages/LoginPage.jsx`)
- **Split-Screen Layout**:
  - **Left Showcase**: DealFlow360 platform brand story, real-time intelligence telemetry badges ("13 Self-Governing Engines", "Real-Time Gross Margin Protection", "Zero-Leak Commercial Portal"), and trust footer.
  - **Right Form Container**: High-contrast, accessibility-compliant input fields with show/hide password toggle.
- **Quick Demo Role Switcher**:
  - One-click credential population for all 5 verified seed profiles (`Admin`, `SalesManager`, `SalesRep`, `FinanceOperations`, `Customer`).
- **Forced Password Reset Modal**:
  - Automatically triggered when the server returns `user.mustChangePassword: true`.
  - Enforces minimum 8 characters, confirmation matching, and disallows password reuse.
  - Submits `POST /api/auth/change-password` and transitions user straight to their workspace upon success.

### Role-Based Routing (`App.jsx` & `ProtectedRoute.jsx`)
- **Internal CRM Workspace** (`/dashboard`, `/quotations`, `/pipeline`, `/finance`, `/customers`, `/users`, etc.):
  - Protected by `<ProtectedRoute />`.
  - If a Customer attempts to navigate into internal CRM routes, access is blocked and redirected to `/portal/my-account`.
- **Customer Account Portal** (`/portal/my-account`):
  - Accessible to users with `Role = Customer` (or `Admin`).
  - Scoped strictly to the customer's own quotations, orders, and invoices.
- **Customer Proposal Magic Link** (`/portal/quote/:token`):
  - HMAC-SHA256 token authenticated view for external review and digital acceptance without requiring internal CRM credentials.

---

## 3. Seed Credentials Reference

| Role | Email | Password | Primary Scope |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@dealflow360.io` | `Admin@123` | Full administrative control, user & catalog management, governance |
| **Sales Manager** | `manager@dealflow360.io` | `Manager@123` | Deal approvals, team user provisioning, pipeline analytics |
| **Sales Representative** | `rep@dealflow360.io` | `Rep@123` | CPQ quotation builder, catalog browsing, customer management |
| **Finance Operations** | `finance@dealflow360.io` | `Finance@123` | Commercial invoices, margin verification, payment reconciliation |
| **Customer** | `customer@dealflow360.io` | `Customer@123` | Dedicated customer portal (`/portal/my-account`), quotation inquiries |

---

## 4. Error Handling & Form Security
- **API Status Mapping**:
  - `401 Unauthorized`: "Invalid email or password." or "Account is disabled."
  - `403 Forbidden`: Displays human-friendly permission rejection banner.
  - `400 Bad Request`: Extracts validation error detail string from ASP.NET Core ProblemDetails response.
