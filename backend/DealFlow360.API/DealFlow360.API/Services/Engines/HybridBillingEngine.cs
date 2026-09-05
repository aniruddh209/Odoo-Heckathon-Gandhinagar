using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Services.Engines;

public class BillingGenerationResult
{
    public Invoice? CommercialInvoice { get; set; }
    public List<BillingSchedule> SubscriptionSchedules { get; set; } = new();
}

public interface IHybridBillingEngine
{
    BillingGenerationResult ProcessOrderBilling(Order order, Customer customer);
}

public class HybridBillingEngine : IHybridBillingEngine
{
    public BillingGenerationResult ProcessOrderBilling(Order order, Customer customer)
    {
        var result = new BillingGenerationResult();

        var oneTimeLines = order.Lines.Where(l => l.ProductType == ProductType.OneTime).ToList();
        var subscriptionLines = order.Lines.Where(l => l.ProductType == ProductType.Subscription).ToList();

        if (oneTimeLines.Any())
        {
            var invoice = new Invoice
            {
                InvoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}",
                OrderId = order.Id,
                CustomerId = customer.Id,
                Type = "CommercialOneTime",
                Status = InvoiceStatus.Issued,
                DueDate = DateTime.UtcNow.AddDays(30),
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };

            decimal subTotal = 0;
            decimal taxTotal = 0;

            foreach (var line in oneTimeLines)
            {
                var invoiceLine = new InvoiceLine
                {
                    ProductId = line.ProductId,
                    Description = line.Product?.Name ?? "One-Time Product",
                    Quantity = line.Quantity,
                    UnitPrice = line.UnitPrice,
                    DiscountPercent = line.DiscountPercent,
                    NetAmount = line.NetAmount,
                    TaxAmount = line.TaxAmount
                };

                invoice.Lines.Add(invoiceLine);
                subTotal += line.NetAmount;
                taxTotal += line.TaxAmount;
            }

            invoice.SubTotal = subTotal;
            invoice.TaxTotal = taxTotal;
            invoice.Total = subTotal + taxTotal;
            invoice.PaidAmount = 0m;

            result.CommercialInvoice = invoice;
        }

        foreach (var subLine in subscriptionLines)
        {
            var schedule = new BillingSchedule
            {
                OrderLineId = subLine.Id,
                SubscriptionPlanId = subLine.SubscriptionPlanId ?? 1,
                StartDate = DateTime.UtcNow,
                NextBillingDate = DateTime.UtcNow.AddMonths(1),
                Quantity = subLine.Quantity,
                UnitPrice = subLine.UnitPrice,
                Status = SubscriptionStatus.Active,
                CreatedAtUtc = DateTime.UtcNow
            };

            result.SubscriptionSchedules.Add(schedule);
        }

        return result;
    }
}
