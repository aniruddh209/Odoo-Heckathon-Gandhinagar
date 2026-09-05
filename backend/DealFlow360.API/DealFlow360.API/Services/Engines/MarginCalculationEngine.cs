using DealFlow360.API.Models;

namespace DealFlow360.API.Services.Engines;

public interface IMarginCalculationEngine
{
    void CalculateLine(QuotationLine line, Product product);
    void CalculateQuotationTotals(Quotation quotation);
}

public class MarginCalculationEngine : IMarginCalculationEngine
{
    public void CalculateLine(QuotationLine line, Product product)
    {
        line.CostPrice = product.CostPrice;
        var unitRevenue = line.UnitPrice * (1m - (line.DiscountPercent / 100m));
        
        line.NetAmount = unitRevenue * line.Quantity;
        line.TaxAmount = line.NetAmount * (product.TaxRate / 100m);
        
        var totalCost = line.CostPrice * line.Quantity;
        line.MarginAmount = line.NetAmount - totalCost;
    }

    public void CalculateQuotationTotals(Quotation quotation)
    {
        decimal subTotal = 0;
        decimal discountTotal = 0;
        decimal taxTotal = 0;
        decimal costTotal = 0;
        decimal marginAmount = 0;

        foreach (var line in quotation.Lines)
        {
            var grossLine = line.UnitPrice * line.Quantity;
            subTotal += grossLine;
            discountTotal += grossLine * (line.DiscountPercent / 100m);
            taxTotal += line.TaxAmount;
            costTotal += line.CostPrice * line.Quantity;
            marginAmount += line.MarginAmount;
        }

        quotation.SubTotal = subTotal;
        quotation.DiscountTotal = discountTotal;
        quotation.TaxTotal = taxTotal;
        quotation.GrandTotal = quotation.SubTotal - quotation.DiscountTotal + quotation.TaxTotal;
        quotation.CostTotal = costTotal;
        quotation.MarginAmount = marginAmount;

        var netRevenue = quotation.SubTotal - quotation.DiscountTotal;
        if (netRevenue > 0)
        {
            quotation.MarginPercent = (quotation.MarginAmount / netRevenue) * 100m;
        }
        else if (quotation.CostTotal > 0)
        {
            quotation.MarginPercent = -100.00m;
        }
        else
        {
            quotation.MarginPercent = 0m;
        }
    }
}
