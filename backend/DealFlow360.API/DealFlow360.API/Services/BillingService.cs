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
        return await _context.Invoices
            .Include(i => i.Customer)
            .OrderByDescending(i => i.CreatedAtUtc)
            .Select(i => new InvoiceListResponse
            {
                Id = i.Id,
                InvoiceNumber = i.InvoiceNumber,
                CustomerName = i.Customer.Name,
                Type = i.Type,
                Status = i.Status.ToString(),
                Total = i.Total,
                PaidAmount = i.PaidAmount,
                DueDate = i.DueDate,
                CreatedAtUtc = i.CreatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<InvoiceDetailResponse> GetInvoiceByIdAsync(int id)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Customer)
            .Include(i => i.Lines).ThenInclude(l => l.Product)
            .Include(i => i.Payments)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null) throw new KeyNotFoundException($"Invoice {id} not found.");

        return new InvoiceDetailResponse
        {
            Id = invoice.Id,
            InvoiceNumber = invoice.InvoiceNumber,
            OrderId = invoice.OrderId,
            CustomerId = invoice.CustomerId,
            CustomerName = invoice.Customer?.Name ?? string.Empty,
            Type = invoice.Type,
            Status = invoice.Status.ToString(),
            SubTotal = invoice.SubTotal,
            TaxTotal = invoice.TaxTotal,
            Total = invoice.Total,
            PaidAmount = invoice.PaidAmount,
            DueDate = invoice.DueDate,
            CreatedAtUtc = invoice.CreatedAtUtc,
            Lines = invoice.Lines.Select(l => new InvoiceLineResponse
            {
                Id = l.Id,
                ProductId = l.ProductId,
                ProductName = l.Product?.Name ?? l.Description ?? string.Empty,
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
            }).ToList()
        };
    }

    public async Task<PaymentResponse> RecordPaymentAsync(int invoiceId, RecordPaymentRequest request)
    {
        var invoice = await _context.Invoices.FindAsync(invoiceId);
        if (invoice == null) throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

        var payment = new Payment
        {
            InvoiceId = invoiceId,
            Amount = request.Amount,
            PaymentMethod = request.PaymentMethod,
            Reference = request.Reference,
            PaidAtUtc = DateTime.UtcNow
        };

        invoice.PaidAmount += request.Amount;
        if (invoice.PaidAmount >= invoice.Total)
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
        var invoice = await _context.Invoices.FindAsync(invoiceId);
        if (invoice == null) throw new KeyNotFoundException($"Invoice {invoiceId} not found.");

        var creditNote = new CreditNote
        {
            InvoiceId = invoiceId,
            Amount = request.Amount,
            Reason = request.Reason,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.CreditNotes.Add(creditNote);
        await _context.SaveChangesAsync();

        return new CreditNoteResponse
        {
            Id = creditNote.Id,
            InvoiceId = creditNote.InvoiceId,
            Amount = creditNote.Amount,
            Reason = creditNote.Reason,
            CreatedAtUtc = creditNote.CreatedAtUtc
        };
    }

    public async Task<BillingScheduleResponse> ApplySubscriptionSeatChangeAsync(int scheduleId, SubscriptionChangeRequest request)
    {
        var schedule = await _context.BillingSchedules
            .Include(s => s.SubscriptionPlan)
            .FirstOrDefaultAsync(s => s.Id == scheduleId);

        if (schedule == null) throw new KeyNotFoundException($"Subscription billing schedule {scheduleId} not found.");

        var addedSeats = request.NewQuantity - schedule.Quantity;
        var proratedAmount = _subscriptionEngine.CalculateProratedCharge(schedule, addedSeats, DateTime.UtcNow);

        _subscriptionEngine.ApplySeatChange(schedule, request.NewQuantity, DateTime.UtcNow);

        _context.BillingSchedules.Update(schedule);
        await _context.SaveChangesAsync();

        return new BillingScheduleResponse
        {
            Id = schedule.Id,
            OrderLineId = schedule.OrderLineId,
            SubscriptionPlanName = schedule.SubscriptionPlan?.Name ?? string.Empty,
            StartDate = schedule.StartDate,
            NextBillingDate = schedule.NextBillingDate,
            Quantity = schedule.Quantity,
            UnitPrice = schedule.UnitPrice,
            Status = schedule.Status.ToString(),
            ProratedAdjustmentAmount = proratedAmount
        };
    }
}
