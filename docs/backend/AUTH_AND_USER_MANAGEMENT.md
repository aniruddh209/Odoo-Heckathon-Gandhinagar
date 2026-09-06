# DealFlow360 — Authentication & User Management Specification

## 1. Architectural Overview
DealFlow360 uses a real identity management system backed by **ASP.NET Core Web API**, **Entity Framework Core**, and **Microsoft SQL Server**. All user accounts, credentials, role scopes, and authentication tokens are persisted and validated server-side.

---

## 2. Authentication Flow
Authentication is based on industry-standard stateless **JSON Web Tokens (JWT)** with HMAC-SHA256 signature verification.

- **Endpoint**: `POST /api/auth/login`
- **Payload**:
  ```json
  {
    "email": "manager@dealflow360.io",
    "password": "Manager@123"
  }
  ```
- **Response**:
  ```json
  {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "...",
    "expiresAtUtc": "2026-09-06T14:00:00Z",
    "user": {
      "id": 2,
      "email": "manager@dealflow360.io",
      "fullName": "Sarah Jenkins",
      "role": "SalesManager",
      "salesTeamId": 1,
      "teamName": "Enterprise Sales USA",
      "customerId": null,
      "customerName": null,
      "isActive": true,
      "mustChangePassword": false,
      "lastLoginAtUtc": "2026-09-05T14:00:00Z"
    }
  }
  ```

### Account Lifecycle & Lockout
- If `IsActive == false`, authentication is immediately terminated with `HTTP 401 Unauthorized` (`"Account is disabled. Please contact your administrator."`).
- Upon each successful login, `LastLoginAtUtc` is updated in SQL Server.

---

## 3. Role Creation Hierarchy & Delegation Rules

| Creator Role | Allowed Target Roles | Team Assignment Rule | Unauthorized Attempt Result |
| :--- | :--- | :--- | :--- |
| **Admin** | `Admin`, `SalesManager`, `SalesRep`, `FinanceOperations`, `Customer` | Can assign to any team or customer | N/A |
| **SalesManager** | `SalesRep` ONLY | Automatically scoped to Manager's own `SalesTeamId` | `HTTP 403 Forbidden` (`ForbiddenAccessException`) |
| **SalesRep** | None | Barred from user creation | `HTTP 403 Forbidden` |
| **FinanceOperations** | None | Barred from user creation | `HTTP 403 Forbidden` |
| **Customer** | None | Barred from user creation | `HTTP 403 Forbidden` |

### Endpoint Security
- `GET /api/users`: Accessible to `Admin` and `SalesManager` (Sales Managers only see Sales Reps).
- `POST /api/users`: Accessible to `Admin` and `SalesManager` with strict hierarchy check in `UserService`.
- `PUT /api/users/{id}`: Accessible to `Admin`.
- `POST /api/users/{id}/toggle-status`: Accessible to `Admin`.

---

## 4. Cryptographic Password Generation
When a new user or customer portal account is created without an explicit password:
1. `PasswordGenerator.Generate(14)` generates a 14-character high-entropy string using `System.Security.Cryptography.RandomNumberGenerator`.
2. The password is hashed using `BCrypt.Net-Next` (work factor 11) and stored in MSSQL `Users.PasswordHash`.
3. The plain-text password is returned **once** in the creation response:
   ```json
   {
     "user": { ... },
     "temporaryPassword": "xK9#mQ2$vL8!pZ"
   }
   ```
4. The user record is created with `MustChangePassword = true`.

---

## 5. Forced First-Login Password Change
1. When a user with `MustChangePassword = true` logs in, their JWT token is issued, but the response specifies `mustChangePassword: true`.
2. The React frontend blocks navigation to internal CRM workspaces and displays the **Password Reset Required** view.
3. The user calls `POST /api/auth/change-password` with:
   ```json
   {
     "currentPassword": "xK9#mQ2$vL8!pZ",
     "newPassword": "MyNewSecurePassword2026!"
   }
   ```
4. `AuthService.ChangePasswordAsync` validates the current password against BCrypt, hashes the new password, sets `MustChangePassword = false`, and saves to MSSQL.
5. Old temporary passwords cannot be reused.

---

## 6. Atomic Transactional Customer Registration (Internal CRM Flow)
Creating a customer (`POST /api/customers`) executes inside an EF Core Execution Strategy (`CreateExecutionStrategy`) with an explicit database transaction:
1. Inserts the `Customer` record into `[Customers]`.
2. If an email is supplied, atomically provisions a linked `User` record with `Role = Role.Customer`, `CustomerId = customer.Id`, `MustChangePassword = true`, and a 14-character temporary password.
3. Transaction commits atomically or rolls back entirely upon any collision.

---

## 7. Public Customer Self-Registration (`POST /api/auth/register`)
Customers can self-register their organization and credentials through the public signup portal.

### Endpoint Contract
- **Method**: `POST /api/auth/register`
- **Authorization**: Public (Anonymous)
- **Request Body**:
  ```json
  {
    "fullName": "Apex Commercial Lead",
    "companyName": "Apex Aerospace Solutions",
    "email": "lead@apexcorp.com",
    "phone": "+1-555-0188",
    "password": "SecurePassword123!",
    "confirmPassword": "SecurePassword123!"
  }
  ```
- **Validation Rules**:
  - `FullName`, `CompanyName`, `Email`, `Password`, `ConfirmPassword` are mandatory.
  - `Password` must match `ConfirmPassword`.
  - Password complexity: >= 8 characters, at least 1 uppercase letter (`[A-Z]`), at least 1 lowercase letter (`[a-z]`), and at least 1 digit (`[0-9]`).
  - Email format validation; checks MSSQL for duplicate email and throws `BadRequestException("An account with this email already exists.")`.
- **Database Transaction (`CreateExecutionStrategy`)**:
  1. Resolves default commercial tier (`CustomerTier` with lowest `MaxDiscountPercent`, e.g., `Bronze` at 5%).
  2. Inserts `Customer` record into `[Customers]` with `TierId = bronzeTier.Id`, `IsActive = true`, and company details.
  3. Inserts linked `User` record into `[Users]` with `Role = Role.Customer` (enforced server-side, client cannot elevate roles), `CustomerId = customer.Id`, `MustChangePassword = false` (since user set their own password), `IsActive = true`, and BCrypt hashed password.
  4. Returns `AuthResponse` containing active JWT `accessToken` with embedded `CustomerId` claim and user profile.

