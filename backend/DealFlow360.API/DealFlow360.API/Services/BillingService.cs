using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Billing;
using DealFlow360.API.DTOs.Invoices;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IBillingService
{
    Task<BillingOverviewResponse> GenerateBillingForOrderAsync(int orderId);
    Task<List<InvoiceListResponse>> GetInvoicesAsync();
    Task<InvoiceDetailResponse> GetInvoiceByIdAsync(int id);
    Task<PaymentResponse> RecordPaymentAsync(int invoiceId, RecordPaymentRequest request);
    Task<CreditNoteResponse> CreateCreditNoteAsync(int invoiceId, CreateCreditNoteRequest request);
    Task<BillingScheduleResponse> ApplySubscriptionSeatChangeAsync(int scheduleId, SubscriptionChangeRequest request);
    Task<List<BillingScheduleResponse>> GetBillingSchedulesAsync();
    Task<InvoiceDetailResponse> GenerateNextRecurringInvoiceAsync(int scheduleId);
    Task<BillingScheduleResponse> CancelSubscriptionScheduleAsync(int scheduleId, string reason);
    Task<List<CreditNoteResponse>> GetCreditNotesAsync();
    Task<FinanceDashboardSummaryResponse> GetFinanceDashboardSummaryAsync();
}

public class BillingService : IBillingService
{
    private readonly AppDbContext _context;
    private readonly IHybridBillingEngine _hybridBillingEngine;
    private readonly ISubscriptionEngine _subscriptionEngine;

    public BillingService(
        AppDbContext context,
        IHybridBillingEngine hybridBillingEngine,
        ISubscriptionEngine subscriptionEngine)
    {
        _context = context;
        _hybridBillingEngine = hybridBillingEngine;
        _subscriptionEngine = subscriptionEngine;
    }

    public async Task<BillingOverviewResponse> GenerateBillingForOrderAsync(int orderId)
    {
        var order = await _context.Orders
            .Include(o => o.Lines).ThenInclude(ol => ol.Product)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.Id == orderId);

        if (order == null) throw new KeyNotFoundException($"Order {orderId} not found.");

        var billingResult = _hybridBillingEngine.ProcessOrderBilling(order, order.Customer);

        if (billingResult.CommercialInvoice != null)
        {
            _context.Invoices.Add(billingResult.CommercialInvoice);
        }

        if (billingResult.SubscriptionSchedules.Any())
        {
            _context.BillingSchedules.AddRange(billingResult.SubscriptionSchedules);
        }

        await _context.SaveChangesAsync();

        return new BillingOverviewResponse
        {
            OrderId = order.Id,
            OrderNumber = order.OrderNumber,
            HasCommercialInvoice = billingResult.CommercialInvoice != null,
            InvoiceNumber = billingResult.CommercialInvoice?.InvoiceNumber,
            InvoiceTotal = billingResult.CommercialInvoice?.Total ?? 0m,
            ActiveSubscriptionsCount = billingResult.SubscriptionSchedules.Count
        };
    }

    public async Task<List<InvoiceListResponse>> GetInvoicesAsync()
    {
        var invoices = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Order)
            .Include(i => i.CreditNotes)
            .OrderByDescending(i => i.CreatedAtUtc)
            .ToListAsync();

        return invoices.Select(i =>
        {
            var credits = i.CreditNotes.Sum(c => c.Amount);
            var outstanding = Math.Max(0, i.Total - i.PaidAmount - credits);
            return new InvoiceListResponse
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                OrderId = i.OrderId,
                OrderNumber = i.Order?.OrderNumber,
                CustomerName = i.Customer?.Name ?? string.Empty,
                Type = i.Type,
                Status = i.Status.ToString(),
                Total = i.Total,
                PaidAmount = i.PaidAmount,
                Outstanding = outstanding,
                DueDate = i.DueDate,
                CreatedAtUtc = i.CreatedAtUtc
            };
        }).ToList();
    }

    public async Task<InvoiceDetailResponse> GetInvoiceByIdAsync(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Order)
            .Include(i => i.Lines).ThenInclude(l => l.Product)
            .Include(i => i.Payments)
            .Include(i => i.CreditNotes)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) throw new KeyNotFoundException($"Invoice {id} not found.");

        var totalCredits = invoice.CreditNotes.Sum(c => c.Amount);
        var outstanding = Math.Max(0, invoice.Total - invoice.PaidAmount - totalCredits);

        return new InvoiceDetailResponse
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            OrderId = invoice.OrderId,
            OrderNumber = invoice.Order?.OrderNumber ?? string.Empty,
            CustomerId = invoice.CustomerId,
            CustomerName = invoice.Customer?.Name ?? string.Empty,
            Type = invoice.Type,
            Status = invoice.Status.ToString(),
            SubTotal = invoice.SubTotal,
            TaxTotal = invoice.TaxTotal,
            Total = invoice.Total,
            PaidAmount = invoice.PaidAmount,
            Outstanding = outstanding,
            DueDate = invoice.DueDate,
            CreatedAtUtc = invoice.CreatedAtUtc,
            Lines = invoice.Lines.Select(l => new InvoiceLineResponse
            {
                Id = l.Id,
                ProductId = l.ProductId,
                ProductName = l.Product?.Name ?? l.Description ?? string.Empty,
                Description = l.Description,
                Quantity = l.Quantity,
                UnitPrice = l.UnitPrice,
                DiscountPercent = l.DiscountPercent,
                NetAmount = l.NetAmount,
                TaxAmount = l.TaxAmount
            }).ToList(),
            Payments = invoice.Payments.Select(p => new PaymentResponse
            {
                Id = p.Id,
                InvoiceId = p.InvoiceId,
                Amount = p.Amount,
                PaidAtUtc = p.PaidAtUtc,
                PaymentMethod = p.PaymentMethod,
                Reference = p.Reference
            }).ToList(),
            CreditNotes = invoice.CreditNotes.Select(c => new CreditNoteResponse
            {
                Id = c.Id,
                InvoiceId = c.InvoiceId,
                InvoiceNumber = invoice.InvoiceNumber,
                CustomerName = invoice.Customer?.Name ?? string.Empty,
                Amount = c.Amount,
                Reason = c.Reason,
                CreatedAtUtc = c.CreatedAtUtc
            }).ToList()
        };
    }

    public async Task<PaymentResponse> RecordPaymentAsync(int invoiceId, RecordPaymentRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("Payment amount must be strictly greater than zero.");
        }

        var invoice = await _context.Invoices
            .Include(i => i.CreditNotes)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);
        if (invoice == null) throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

        if (invoice.Status == InvoiceStatus.Paid || invoice.Status == InvoiceStatus.Voided)
        {
            throw new InvalidOperationException($"Cannot record payment on an invoice that is already {invoice.Status}.");
        }

        var totalCredits = invoice.CreditNotes.Sum(c => c.Amount);
        var netOutstanding = Math.Max(0, invoice.Total - invoice.PaidAmount - totalCredits);

        if (request.Amount > netOutstanding)
        {
            throw new InvalidOperationException($"Payment amount ({request.Amount:F2}) exceeds remaining net outstanding balance ({netOutstanding:F2}).");
        }

        var payment = new Payment
        {
            InvoiceId = invoiceId,
            Amount = request.Amount,
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "BankTransfer" : request.PaymentMethod,
            Reference = request.Reference,
            PaidAtUtc = DateTime.UtcNow
        };

        invoice.PaidAmount += request.Amount;
        if (invoice.PaidAmount + totalCredits >= invoice.Total)
        {
            invoice.Status = InvoiceStatus.Paid;
        }
        else
        {
            invoice.Status = InvoiceStatus.PartiallyPaid;
        }

        invoice.UpdatedAtUtc = DateTime.UtcNow;
        _context.Payments.Add(payment);
        _context.Invoices.Update(invoice);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Invoice",
            EntityId = invoice.Id,
            Action = "PaymentRecorded",
            Reason = $"Payment of {request.Amount:F2} received via {payment.PaymentMethod}. Ref: {request.Reference ?? "N/A"}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new PaymentResponse
        {
            Id = payment.Id,
            InvoiceId = payment.InvoiceId,
            Amount = payment.Amount,
            PaidAtUtc = payment.PaidAtUtc,
            PaymentMethod = payment.PaymentMethod,
            Reference = payment.Reference
        };
    }

    public async Task<CreditNoteResponse> CreateCreditNoteAsync(int invoiceId, CreateCreditNoteRequest request)
    {
        if (request.Amount <= 0)
        {
            throw new ArgumentException("Credit note amount must be strictly greater than zero.");
        }

        if (string.IsNullOrWhiteSpace(request.Reason))
        {
            throw new ArgumentException("A reason is mandatory for issuing a credit note.");
        }

        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.CreditNotes)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null) throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

        if (invoice.Status == InvoiceStatus.Voided)
        {
            throw new InvalidOperationException("Cannot issue credit note against a voided invoice.");
        }

        var existingCredits = invoice.CreditNotes.Sum(c => c.Amount);
        var maxAllowedCredit = Math.Max(0, invoice.Total - existingCredits);

        if (request.Amount > maxAllowedCredit)
        {
            throw new InvalidOperationException($"Credit note amount ({request.Amount:F2}) exceeds maximum allowable credit ({maxAllowedCredit:F2}) for invoice {invoice.InvoiceNumber}.");
        }

        var creditNote = new CreditNote
        {
            InvoiceId = invoiceId,
            OrderLineId = request.OrderLineId,
            Amount = request.Amount,
            Reason = request.Reason,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.CreditNotes.Add(creditNote);

        var newTotalCredits = existingCredits + request.Amount;
        if (invoice.PaidAmount + newTotalCredits >= invoice.Total)
        {
            if (invoice.PaidAmount == 0)
            {
                invoice.Status = InvoiceStatus.Voided;
            }
            else
            {
                invoice.Status = InvoiceStatus.Paid;
            }
        }
        invoice.UpdatedAtUtc = DateTime.UtcNow;
        _context.Invoices.Update(invoice);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "Invoice",
            EntityId = invoice.Id,
            Action = "CreditNoteIssued",
            Reason = $"Credit note of {request.Amount:F2} issued. Reason: {request.Reason}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new CreditNoteResponse
        {
            Id = creditNote.Id,
            InvoiceId = creditNote.InvoiceId,
            InvoiceNumber = invoice.InvoiceNumber,
            CustomerName = invoice.Customer?.Name ?? string.Empty,
            Amount = creditNote.Amount,
            Reason = creditNote.Reason,
            CreatedAtUtc = creditNote.CreatedAtUtc
        };
    }

    public async Task<BillingScheduleResponse> ApplySubscriptionSeatChangeAsync(int scheduleId, SubscriptionChangeRequest request)
    {
        var schedule = await _context.BillingSchedules
            .Include(s => s.SubscriptionPlan)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Product)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Order).ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(s => s.Id == scheduleId);

        if (schedule == null) throw new KeyNotFoundException($"Subscription billing schedule {scheduleId} not found.");

        var addedSeats = request.NewQuantity - schedule.Quantity;
        var proratedAmount = _subscriptionEngine.CalculateProratedCharge(schedule, addedSeats, DateTime.UtcNow);

        _subscriptionEngine.ApplySeatChange(schedule, request.NewQuantity, DateTime.UtcNow);

        _context.BillingSchedules.Update(schedule);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "BillingSchedule",
            EntityId = schedule.Id,
            Action = "SubscriptionSeatChange",
            Reason = $"Changed seat count to {request.NewQuantity}. Prorated adjustment: {proratedAmount:F2}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new BillingScheduleResponse
        {
            Id = schedule.Id,
            OrderLineId = schedule.OrderLineId,
            OrderNumber = schedule.OrderLine?.Order?.OrderNumber ?? string.Empty,
            CustomerName = schedule.OrderLine?.Order?.Customer?.Name ?? string.Empty,
            ProductName = schedule.OrderLine?.Product?.Name ?? string.Empty,
            PlanName = schedule.SubscriptionPlan?.Name ?? string.Empty,
            SubscriptionPlanName = schedule.SubscriptionPlan?.Name ?? string.Empty,
            BillingFrequency = schedule.SubscriptionPlan?.BillingFrequency ?? "Monthly",
            StartDate = schedule.StartDate,
            EndDate = schedule.EndDate,
            NextBillingDate = schedule.NextBillingDate,
            Quantity = schedule.Quantity,
            UnitPrice = schedule.UnitPrice,
            Status = schedule.Status.ToString(),
            ProratedAdjustmentAmount = proratedAmount
        };
    }

    public async Task<List<BillingScheduleResponse>> GetBillingSchedulesAsync()
    {
        var schedules = await _context.BillingSchedules
            .Include(s => s.SubscriptionPlan)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Product)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Order).ThenInclude(o => o.Customer)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync();

        return schedules.Select(s => new BillingScheduleResponse
        {
            Id = s.Id,
            OrderLineId = s.OrderLineId,
            OrderNumber = s.OrderLine?.Order?.OrderNumber ?? string.Empty,
            CustomerName = s.OrderLine?.Order?.Customer?.Name ?? string.Empty,
            ProductName = s.OrderLine?.Product?.Name ?? string.Empty,
            PlanName = s.SubscriptionPlan?.Name ?? string.Empty,
            SubscriptionPlanName = s.SubscriptionPlan?.Name ?? string.Empty,
            BillingFrequency = s.SubscriptionPlan?.BillingFrequency ?? "Monthly",
            StartDate = s.StartDate,
            EndDate = s.EndDate,
            NextBillingDate = s.NextBillingDate,
            Quantity = s.Quantity,
            UnitPrice = s.UnitPrice,
            Status = s.Status.ToString()
        }).ToList();
    }

    public async Task<InvoiceDetailResponse> GenerateNextRecurringInvoiceAsync(int scheduleId)
    {
        var schedule = await _context.BillingSchedules
            .Include(s => s.SubscriptionPlan)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Product)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Order).ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(s => s.Id == scheduleId);

        if (schedule == null) throw new KeyNotFoundException($"Billing schedule {scheduleId} not found.");

        if (schedule.Status != SubscriptionStatus.Active)
        {
            throw new InvalidOperationException($"Cannot generate invoice for non-active subscription schedule (Status: {schedule.Status}).");
        }

        var order = schedule.OrderLine.Order;
        var subTotal = Math.Round(schedule.Quantity * schedule.UnitPrice, 2);
        var taxTotal = Math.Round(subTotal * 0.18m, 2);
        var grandTotal = subTotal + taxTotal;

        var recInvoice = new Invoice
        {
            InvoiceNumber = $"REC-{DateTime.UtcNow:yyyyMMdd}-{schedule.Id}-{DateTime.UtcNow.Ticks % 10000:D4}",
            OrderId = order.Id,
            CustomerId = order.CustomerId,
            Type = "Recurring",
            Status = InvoiceStatus.Issued,
            SubTotal = subTotal,
            TaxTotal = taxTotal,
            Total = grandTotal,
            PaidAmount = 0m,
            DueDate = DateTime.UtcNow.AddDays(30),
            CreatedAtUtc = DateTime.UtcNow
        };

        recInvoice.Lines.Add(new InvoiceLine
        {
            ProductId = schedule.OrderLine.ProductId,
            Description = $"{schedule.SubscriptionPlan.Name} Subscription ({schedule.Quantity} seats)",
            Quantity = schedule.Quantity,
            UnitPrice = schedule.UnitPrice,
            DiscountPercent = 0m,
            NetAmount = subTotal,
            TaxAmount = taxTotal,
            CreatedAtUtc = DateTime.UtcNow
        });

        _context.Invoices.Add(recInvoice);

        var interval = schedule.SubscriptionPlan.BillingIntervalMonths > 0 ? schedule.SubscriptionPlan.BillingIntervalMonths : 1;
        schedule.NextBillingDate = schedule.NextBillingDate.AddMonths(interval);
        schedule.UpdatedAtUtc = DateTime.UtcNow;
        _context.BillingSchedules.Update(schedule);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "BillingSchedule",
            EntityId = schedule.Id,
            Action = "RecurringInvoiceGenerated",
            Reason = $"Generated recurring invoice {recInvoice.InvoiceNumber} for {grandTotal:F2}, advanced billing date to {schedule.NextBillingDate:yyyy-MM-dd}",
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return await GetInvoiceByIdAsync(recInvoice.Id);
    }

    public async Task<BillingScheduleResponse> CancelSubscriptionScheduleAsync(int scheduleId, string reason)
    {
        var schedule = await _context.BillingSchedules
            .Include(s => s.SubscriptionPlan)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Product)
            .Include(s => s.OrderLine).ThenInclude(ol => ol.Order).ThenInclude(o => o.Customer)
            .FirstOrDefaultAsync(s => s.Id == scheduleId);

        if (schedule == null) throw new KeyNotFoundException($"Billing schedule {scheduleId} not found.");

        if (schedule.Status == SubscriptionStatus.Cancelled)
        {
            throw new InvalidOperationException($"Schedule {scheduleId} is already cancelled.");
        }

        schedule.Status = SubscriptionStatus.Cancelled;
        schedule.EndDate = DateTime.UtcNow;
        schedule.UpdatedAtUtc = DateTime.UtcNow;
        _context.BillingSchedules.Update(schedule);

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = "BillingSchedule",
            EntityId = schedule.Id,
            Action = "SubscriptionCancelled",
            Reason = reason,
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new BillingScheduleResponse
        {
            Id = schedule.Id,
            OrderLineId = schedule.OrderLineId,
            OrderNumber = schedule.OrderLine?.Order?.OrderNumber ?? string.Empty,
            CustomerName = schedule.OrderLine?.Order?.Customer?.Name ?? string.Empty,
            ProductName = schedule.OrderLine?.Product?.Name ?? string.Empty,
            PlanName = schedule.SubscriptionPlan?.Name ?? string.Empty,
            SubscriptionPlanName = schedule.SubscriptionPlan?.Name ?? string.Empty,
            BillingFrequency = schedule.SubscriptionPlan?.BillingFrequency ?? "Monthly",
            StartDate = schedule.StartDate,
            EndDate = schedule.EndDate,
            NextBillingDate = schedule.NextBillingDate,
            Quantity = schedule.Quantity,
            UnitPrice = schedule.UnitPrice,
            Status = schedule.Status.ToString()
        };
    }

    public async Task<List<CreditNoteResponse>> GetCreditNotesAsync()
    {
        var notes = await _context.CreditNotes
            .Include(c => c.Invoice).ThenInclude(i => i.Customer)
            .OrderByDescending(c => c.CreatedAtUtc)
            .ToListAsync();

        return notes.Select(c => new CreditNoteResponse
        {
            Id = c.Id,
            InvoiceId = c.InvoiceId,
            InvoiceNumber = c.Invoice?.InvoiceNumber ?? string.Empty,
            CustomerName = c.Invoice?.Customer?.Name ?? string.Empty,
            Amount = c.Amount,
            Reason = c.Reason,
            CreatedAtUtc = c.CreatedAtUtc
        }).ToList();
    }

    public async Task<FinanceDashboardSummaryResponse> GetFinanceDashboardSummaryAsync()
    {
        var pendingApprovals = await _context.ApprovalRequests
            .Include(ar => ar.Quotation)
            .Where(ar => ar.Status == ApprovalStatus.Pending && ar.Level == ApprovalLevel.Finance)
            .ToListAsync();

        var unallocatedOrdersCount = await _context.Orders
            .CountAsync(o => o.Status == OrderStatus.Confirmed || o.Status == OrderStatus.PartiallyAllocated);

        var openBackordersCount = await _context.Backorders
            .CountAsync(b => b.Status == "Pending");

        var activeSchedulesCount = await _context.BillingSchedules
            .CountAsync(s => s.Status == SubscriptionStatus.Active);

        var invoices = await _context.Invoices
            .Include(i => i.CreditNotes)
            .Where(i => i.Status != InvoiceStatus.Voided)
            .ToListAsync();

        var totalOutstanding = invoices.Sum(i => Math.Max(0, i.Total - i.PaidAmount - i.CreditNotes.Sum(c => c.Amount)));
        var totalCollected = await _context.Payments.SumAsync(p => p.Amount);
        var totalCredits = await _context.CreditNotes.SumAsync(c => c.Amount);

        return new FinanceDashboardSummaryResponse
        {
            PendingFinanceApprovalsCount = pendingApprovals.Count,
            PendingFinanceApprovalsValue = pendingApprovals.Sum(a => a.Quotation?.GrandTotal ?? 0m),
            UnallocatedOrdersCount = unallocatedOrdersCount,
            OpenBackordersCount = openBackordersCount,
            ActiveSchedulesCount = activeSchedulesCount,
            TotalOutstandingInvoicesAmount = totalOutstanding,
            TotalCollectedPaymentsAmount = totalCollected,
            TotalIssuedCreditsAmount = totalCredits
        };
    }
}
