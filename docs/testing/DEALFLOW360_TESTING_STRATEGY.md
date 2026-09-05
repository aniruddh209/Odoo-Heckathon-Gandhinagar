# DealFlow360: Master Testing Strategy & Quality Assurance Blueprint

---

## 1. Document Control & Testing Philosophy

| Attribute | Value |
| :--- | :--- |
| **Document Title** | Master Testing Strategy & Quality Assurance Blueprint |
| **System Name** | DealFlow360: Intelligent, Self-Governing Sales Operations Platform |
| **Version** | 3.0.0 (Locked Stack: React + ASP.NET Core + SQL Server) |
| **Primary References** | `DealFlow360_ASPNet_SQLServer_React_Complete_Implementation_Spec.pdf` (§28, §29, §34), `DealFlow360.pdf` (13-Page Problem Statement) |
| **Last Updated** | 2026-09-05 |

### Testing Principles
1. **Zero Fake Logic**: Calculations (margin %, blended risk, warehouse split, proration, health scores) must be executed by authoritative server-side C# domain services, never mocked with hardcoded UI labels.
2. **Deterministic Seed Data**: Every test execution and demo rehearsal initializes from an identical, reproducible baseline.
3. **Automated End-to-End Rigor**: All 8 steps of the problem statement's quick-test flow plus authorization boundaries and edge cases must pass reliably.

---

## 2. Test Suite Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    React Frontend Tests                     │
│    • Vitest + React Testing Library (Component Unit Tests)   │
│    • Playwright / Cypress (End-to-End User Journeys)        │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP JSON Requests
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             ASP.NET Core Integration Test Suite             │
│   • WebApplicationFactory<Program> In-Memory Test Server    │
│   • Microsoft SQL Server Testcontainers / LocalDB           │
│   • Transaction rollback per test execution                │
└──────────────────────────────┬──────────────────────────────┘
                               │ In-Memory DI
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               .NET Domain & Engine Unit Tests               │
│   • xUnit + FluentAssertions + Moq                          │
│   • 100% test coverage over 13 Core Business Engines        │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. The 15-Step Must-Pass End-to-End Test

This test suite reproduces the end-to-end sales lifecycle mandated by the problem statement:

| Step | Test Action | Executing Persona | Verification & Expected Assertion | Test ID |
| :--- | :--- | :--- | :--- | :--- |
| **1** | Create & authenticate user | SalesRep | JWT issued with `role = SalesRep`, `teamId = 1`. Inactive user blocked. | `E2E-01` |
| **2** | Seed master configuration | Admin | Seed Customer Tiers (Gold 15%), Warehouses (Main, East), Plans, Categories, Discount Ceilings (Hardware 15%, Service 10%). | `E2E-02` |
| **3** | Create Customer record | SalesRep / Admin | `Customers` created with `CustomerTier = Gold`. | `E2E-03` |
| **4** | Assemble multi-line quote | SalesRep | Add Laptop (Hardware) at 12% discount and Setup Service at 18% discount. | `E2E-04` |
| **5** | Verify discount governance | Backend Engine | Service discount (18%) exceeds category ceiling (10%). `BlendedRiskScore > 0` and Manager approval request auto-created. | `E2E-05` |
| **6** | Test live upsell suggestion | SalesRep | `GET /recommendations` returns Docking Station with live gross margin delta. Add upsell; cart re-prices immediately. | `E2E-06` |
| **7** | Execute Manager approval | SalesManager | Manager approves with mandatory remarks. If risk band requires Finance, verify Finance step appears and Manager alone cannot finish quote. | `E2E-07` |
| **8** | Verify fulfillment preview | FinanceOperations | Order requires 10 Laptops; Main warehouse has 5, East has 8. Verifies auto-split across warehouses based on shipping cost. | `E2E-08` |
| **9** | Verify hybrid billing | FinanceOperations | Quote contains hardware and SaaS support. One-time lines generate commercial invoice lines; recurring lines generate billing schedules. | `E2E-09` |
| **10**| Open Customer Portal | Customer | Customer accesses isolated portal via magic link. Verifies cost prices and margins are strictly invisible. Submit higher counter-discount. | `E2E-10` |
| **11**| Verify auto re-approval | Backend Engine | Counter-discount worsens terms beyond allowable limits; previous approval is invalidated and quote re-enters `PendingApproval`. | `E2E-11` |
| **12**| Approve & confirm terms | Manager + Customer | Manager re-approves counter-discount; customer clicks 1-Click Confirmation on portal. | `E2E-12` |
| **13**| Order conversion & payment | FinanceOperations | Confirm order, reserve stock in `InventoryStocks`, post commercial invoice, record payment. | `E2E-13` |
| **14**| Verify payment status | FinanceOperations | Partial payment marks invoice `PartiallyPaid`; full settlement marks `Paid`. Overpayment is rejected. | `E2E-14` |
| **15**| Verify deal health dashboard| SalesManager | Deal health dashboard displays stalled deal alerts, discount anomaly indicators, and delivery promise slippages with filter support. | `E2E-15` |

---

## 4. Authorization Test Matrix (Negative Security Tests)

```csharp
[Fact]
public async Task SalesRep_Cannot_CreateProduct_Returns403()
{
    var client = _factory.CreateClientWithRole("SalesRep");
    var response = await client.PostAsJsonAsync("/api/products", new CreateProductRequest { ... });
    response.StatusCode.Should().Be(HttpStatusCode.Forbidden);
}

[Fact]
public async Task SalesRep_Cannot_AccessOtherRepsQuotation_Returns404Or403()
{
    var client = _factory.CreateClientWithRole("SalesRep", userId: 101);
    var response = await client.GetAsync("/api/quotations/quote-belonging-to-user-102");
    response.StatusCode.Should().Match(s => s == HttpStatusCode.NotFound || s == HttpStatusCode.Forbidden);
}

[Fact]
public async Task Customer_Cannot_AccessInternalQuotationApi_Returns401Or403()
{
    var client = _factory.CreatePortalClient(token: "customer-hmac-token");
    var response = await client.GetAsync("/api/quotations");
    response.StatusCode.Should().Match(s => s == HttpStatusCode.Unauthorized || s == HttpStatusCode.Forbidden);
}

[Fact]
public async Task Customer_Cannot_ViewCostOrMargin_ZeroLeakGuaranteed()
{
    var client = _factory.CreatePortalClient(token: "valid-customer-token");
    var response = await client.GetFromJsonAsync<JsonDocument>("/api/portal/quotations/1");
    
    // Assert cost and margin fields do not exist in JSON payload
    response.RootElement.TryGetProperty("standardCostPrice", out _).Should().BeFalse();
    response.RootElement.TryGetProperty("orderGrossMarginPercent", out _).Should().BeFalse();
    response.RootElement.TryGetProperty("blendedDiscountRiskScore", out _).Should().BeFalse();
}
```

---

## 5. Business Logic Edge Cases Matrix

| Domain Area | Edge Case Scenario | System Invariant & Expected Behavior |
| :--- | :--- | :--- |
| **Fulfillment** | No warehouse has stock for line item. | 100% of quantity allocated to `Backorders`; status marked `Backordered`. |
| **Fulfillment** | Warehouse has exact requested stock. | Allocated to single warehouse; zero backorder generated. |
| **Fulfillment** | Partial stock across multiple locations. | Greedy split allocates stock across 2+ warehouses; split delivery count shown. |
| **Discounting** | Requested discount exactly matches ceiling. | Overage points = 0.00; line marked `RequiresApproval = false`. |
| **Discounting** | 0% discount requested across all lines. | Blended risk score = 0.00; quote auto-approved on submission. |
| **Discounting** | Multiple small line overages across order. | Volume-weighted overage compounds; triggers approval if band breached. |
| **State Machine**| Quote approved, then line quantity changed. | Previous approval invalidated; status reset to `Draft` / `PendingApproval`. |
| **Negotiation** | Customer counters with discount $\le$ ceiling. | Auto-approved without human intervention if rules permit. |
| **Billing** | Payment equal to outstanding invoice amount. | Invoice status transitions to `Paid`. |
| **Billing** | Payment less than outstanding invoice amount. | Invoice status transitions to `PartiallyPaid`. |
| **Billing** | Payment greater than outstanding balance. | Server rejects request with `400 Bad Request` (Overpayment prevented). |
| **Billing** | Subscription cancelled mid-cycle. | Daily proration calculated; credit note generated for unused days. |

---

## 6. Deterministic Demo Seed Scenario

To guarantee a reliable, reproducible evaluation, the database is pre-seeded with:

- **Users**: `admin@demo` (Admin), `rep@demo` (SalesRep), `manager@demo` (SalesManager), `finance@demo` (FinanceOperations).
- **Customer**: Acme Corp, classified as **Gold Tier** (Max discount ceiling: 15%).
- **Product Catalog**:
  - `Laptop Pro 15`: Hardware, List: \$1,200.00, Cost: \$800.00 (Min Margin: 25%).
  - `USB-C Dock`: Hardware, List: \$200.00, Cost: \$100.00 (Co-purchase paired with Laptop).
  - `Setup & Onboarding`: Professional Service, List: \$500.00, Cost: \$300.00 (Category ceiling: 10%).
  - `Premium 24/7 Support`: Recurring Subscription, List: \$150.00/month, Cost: \$50.00/month.
- **Warehouses**:
  - `Main Warehouse`: Laptops OnHand = 5, Docks OnHand = 10. Shipping cost weight = 1.0.
  - `East Coast Depot`: Laptops OnHand = 8, Docks OnHand = 5. Shipping cost weight = 1.5.
- **Demo Quotation Trigger**:
  - 2 Laptops @ 12% discount (Valid under Hardware 15% ceiling).
  - 1 Setup Service @ 18% discount (Violates Service 10% ceiling by 8 points).
  - 1 Premium Support monthly subscription plan.
  - **Result**: Server detects violation, computes blended risk score $> 0$, triggers Level 1 Manager approval, recommends Dock upsell, splits warehouse fulfillment, generates hybrid invoice and subscription schedule.

---

## 7. Five-Minute Judge Demo Script

| Elapsed Time | Evaluator Action | Screen / Visual State | Business Narrative & Talking Point |
| :--- | :--- | :--- | :--- |
| **0:00 – 0:30** | Login as `rep@demo` | Role-aware Workspace | *"DealFlow360 is an intelligent, self-governing sales operations platform. Internal users access a secure workspace scoped to their role."* |
| **0:30 – 1:15** | Create Quote & add products | Quote Builder Cart | *"The rep adds Laptops and Setup Services. Authoritative prices, margins, and taxes calculate in real-time on the ASP.NET Core backend."* |
| **1:15 – 1:45** | Apply high service discount (18%) | Cart Summary & Risk Badge | *"The rep requests 18% on Services, exceeding its 10% category limit. The backend evaluates blended risk across lines and flags the deal for Manager approval."* |
| **1:45 – 2:15** | Switch to `manager@demo` & approve | Approval Queue & Detail | *"The Manager inspects the peak violation and margin loss, adds mandatory approval remarks, and approves. The audit trail records the decision immutably."* |
| **2:15 – 2:45** | Operations Fulfillment Split | Multi-Warehouse View | *"The order requires 10 Laptops, but the Main Warehouse only holds 5. The greedy allocation engine automatically splits fulfillment across Main and East Depot."* |
| **2:45 – 3:15** | Show Hybrid Billing pane | Billing & Subscription Tab | *"A single transaction generates an immediate commercial invoice for the hardware and establishes an automated recurring billing schedule for the SaaS support."* |
| **3:15 – 4:00** | Customer Portal Counter-Offer | Restricted `/portal/quote/:token` | *"The customer views the quote via a secure magic link. All internal costs and margins are completely shielded. The customer proposes a higher discount, which automatically invalidates prior approval and routes the quote back to management."* |
| **4:00 – 4:30** | Final Confirm & Payment | Payment Modal | *"The customer confirms final terms. Finance records payment, and the invoice status updates from Unpaid to Paid with strict overpayment guards."* |
| **4:30 – 5:00** | Deal Health Dashboard | Health & Slippage Dashboard | *"The Deal Health engine continuously monitors active deals, surfacing stalled quotes, discount anomalies, and promised delivery slippages with 1-click rep nudges."* |
