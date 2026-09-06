# DealFlow360 — Customer 360 Workspace Architecture

## 1. Overview
The Customer 360 workspace provides internal sales reps, sales managers, and revenue operators with a unified view of an enterprise account's commercial history, deal velocity, product adoption, and operational activity.

- **Route**: `/workspace/customers/:id`
- **Component**: `CustomerDetailPage.jsx`
- **Backend API**: `GET /api/customers/{id}/360`

---

## 2. Information Architecture & Modules

### Top Commercial KPI Radar
- **Total Lifetime Value**: Sum of all closed, invoiced revenue across the customer's operational lifetime.
- **Active Pipeline Value**: Aggregated value of pending, unconfirmed proposals currently in negotiation.
- **Confirmed Sales Orders**: Count and total closed value of orders created from confirmed quotations.
- **Outstanding Accounts Receivable**: Balance remaining across unpaid and partially paid commercial invoices.

### Tabbed Workspaces
1. **360 Overview Tab**:
   - Company profile details: Primary email, phone, billing currency, assigned account executive/sales rep.
   - Commercial tier and maximum discount authority.
   - Associated portal login users with account status and last login date.
   - Snapshot of recent operational and commercial events.
2. **Quotations Tab**:
   - Full history of proposals generated for the customer.
   - Includes Quotation #, Created Date, Status, Margin %, and Line Items count.
   - Direct link to inspect quotation detail workspace.
3. **Sales Orders Tab**:
   - Confirmed sales orders originating from quotations.
   - Associated quote cross-reference, fulfillment state, and order total.
4. **Invoices Tab**:
   - Billing documents generated across one-time and recurring contracts.
   - Amount invoiced, amount collected, payment status, and due dates.
5. **Product Purchase History Tab**:
   - Product SKU, name, total lifetime units purchased, and total revenue contribution.
   - Helps identify upsell/cross-sell replenishment opportunities.
6. **Activity Timeline Tab**:
   - Chronological audit log of customer-related events: quotation creation, management approvals, customer portal confirmations, fulfillment allocations, and invoice payments.
7. **Portal Users Tab**:
   - Directory of client representatives with portal access.
   - Displays email, password reset requirement, and status.

---

## 3. Atomic Provisioning Flow from Customer List
When creating a customer on `/workspace/customers`:
1. The user enters company name, contact email, phone, and tier.
2. The backend generates the customer entity and provisions a client user account (`Role.Customer`) atomically.
3. A 14-character cryptographic temporary password is generated on the server.
4. The frontend renders the **Customer Portal Access Provisioned** confirmation modal with a single-click copy button.
5. Clicking any customer row in the directory navigates directly into the Customer 360 workspace.
