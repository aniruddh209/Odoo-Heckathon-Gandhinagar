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
        
        line.NetAmount = Math.Round(unitRevenue * line.Quantity, 2);
        line.TaxAmount = Math.Round(line.NetAmount * (product.TaxRate / 100m), 2);
        
        var totalCost = line.CostPrice * line.Quantity;
        line.MarginAmount = Math.Round(line.NetAmount - totalCost, 2);
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

        quotation.SubTotal = Math.Round(subTotal, 2);
        quotation.DiscountTotal = Math.Round(discountTotal, 2);
        quotation.TaxTotal = Math.Round(taxTotal, 2);
        quotation.GrandTotal = Math.Round(quotation.SubTotal - quotation.DiscountTotal + quotation.TaxTotal, 2);
        quotation.CostTotal = Math.Round(costTotal, 2);
        quotation.MarginAmount = Math.Round(marginAmount, 2);

        var netRevenue = quotation.SubTotal - quotation.DiscountTotal;
        quotation.MarginPercent = netRevenue > 0 ? Math.Round((quotation.MarginAmount / netRevenue) * 100m, 2) : 0m;
    }
}
