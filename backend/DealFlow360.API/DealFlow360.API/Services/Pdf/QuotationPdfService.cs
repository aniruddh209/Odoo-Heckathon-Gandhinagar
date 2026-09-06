using DealFlow360.API.Data;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace DealFlow360.API.Services.Pdf;

public class QuotationPdfService : IQuotationPdfService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    // Corporate Color Palette (DealFlow360 Slate & Cobalt Theme)
    private static readonly Color PrimarySlate = Color.FromHex("#0F172A");    // Deep Navy Slate
    private static readonly Color BrandBlue = Color.FromHex("#1E40AF");       // Royal Blue
    private static readonly Color AccentBlue = Color.FromHex("#2563EB");      // Cobalt Accent
    private static readonly Color TextDark = Color.FromHex("#1E293B");        // Slate 800
    private static readonly Color TextMuted = Color.FromHex("#64748B");       // Slate 500
    private static readonly Color BgLight = Color.FromHex("#F8FAFC");         // Slate 50
    private static readonly Color BorderSubtle = Color.FromHex("#E2E8F0");    // Slate 200
    private static readonly Color GreenSuccess = Color.FromHex("#059669");    // Emerald 600
    private static readonly Color IndigoTag = Color.FromHex("#4338CA");       // Indigo 700

    public QuotationPdfService(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<byte[]> GenerateQuotationPdfAsync(int quotationId, int requestingUserId, string requestingRole)
    {
        var quotation = await LoadQuotationAggregateAsync(quotationId);
        if (quotation == null)
            throw new KeyNotFoundException($"Quotation with ID {quotationId} not found.");

        // Role & Ownership Authorization
        var isElevatedRole = requestingRole is "Admin" or "SalesManager" or "FinanceOperations";
        var isAssignedRep = quotation.SalesRepId == requestingUserId || 
                            quotation.Customer.AssignedSalesRepId == requestingUserId;

        if (!isElevatedRole && !isAssignedRep)
        {
            throw new UnauthorizedAccessException("Access denied. You do not have permission to view this quotation PDF.");
        }

        var company = await LoadCompanyDetailsAsync();
        return BuildPdf(quotation, company);
    }

    public async Task<byte[]> GeneratePortalQuotationPdfAsync(string token)
    {
        var (isValid, quotationId, _) = _jwtService.ValidatePortalToken(token);
        if (!isValid)
            throw new UnauthorizedAccessException("Invalid or expired customer proposal portal link.");

        var quotation = await LoadQuotationAggregateAsync(quotationId);
        if (quotation == null)
            throw new KeyNotFoundException("Quotation not found.");

        var company = await LoadCompanyDetailsAsync();
        return BuildPdf(quotation, company);
    }

    public async Task<byte[]> GenerateCustomerQuotationPdfAsync(int quotationId, int customerId)
    {
        var quotation = await LoadQuotationAggregateAsync(quotationId);
        if (quotation == null)
            throw new KeyNotFoundException($"Quotation with ID {quotationId} not found.");

        if (quotation.CustomerId != customerId)
        {
            throw new UnauthorizedAccessException("Access denied. You can only download quotations issued to your organization.");
        }

        var company = await LoadCompanyDetailsAsync();
        return BuildPdf(quotation, company);
    }

    private async Task<Quotation?> LoadQuotationAggregateAsync(int quotationId)
    {
        return await _context.Quotations
            .Include(q => q.Customer)
                .ThenInclude(c => c.Tier)
            .Include(q => q.SalesRep)
            .Include(q => q.Lines)
                .ThenInclude(l => l.Product)
                    .ThenInclude(p => p.Category)
            .Include(q => q.Lines)
                .ThenInclude(l => l.Variant)
            .Include(q => q.Lines)
                .ThenInclude(l => l.SubscriptionPlan)
            .FirstOrDefaultAsync(q => q.Id == quotationId);
    }

    private async Task<Company> LoadCompanyDetailsAsync()
    {
        var company = await _context.Companies
            .FirstOrDefaultAsync(c => c.Code == "DF360" && c.IsActive)
            ?? await _context.Companies.FirstOrDefaultAsync(c => c.IsActive);

        return company ?? new Company
        {
            Name = "DealFlow360 Technologies Pvt. Ltd.",
            Code = "DF360",
            Description = "Enterprise Digital Sales, CPQ & Cloud Infrastructure Solutions",
            Website = "https://www.dealflow360.in",
            ContactEmail = "sales@dealflow360.in",
            ContactPhone = "+91-79-4000-1234"
        };
    }

    private byte[] BuildPdf(Quotation quotation, Company company)
    {
        // Segregate line items into One-Time Items vs Recurring/Subscription Items
        var oneTimeLines = quotation.Lines
            .Where(l => !IsLineRecurring(l))
            .ToList();

        var recurringLines = quotation.Lines
            .Where(l => IsLineRecurring(l))
            .ToList();

        var document = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(32, Unit.Point);
                page.PageColor(Colors.White);
                page.DefaultTextStyle(x => x.FontFamily("Arial").FontSize(8.5f).FontColor(TextDark));

                // Page Header: Company branding, quote meta, customer bill-to
                page.Header().Element(headerContainer => ComposeHeader(headerContainer, quotation, company));

                // Page Body Content
                page.Content().Element(contentContainer => ComposeContent(contentContainer, quotation, company, oneTimeLines, recurringLines));

                // Page Footer: Dynamic Page Numbering and Legal Disclaimer
                page.Footer().Element(footerContainer => ComposeFooter(footerContainer, quotation, company));
            });
        });

        return document.GeneratePdf();
    }

    private static bool IsLineRecurring(QuotationLine line)
    {
        if (line.SubscriptionPlanId.HasValue || line.SubscriptionPlan != null)
            return true;

        var name = (line.Product?.Name ?? string.Empty).ToLowerInvariant();
        var sku = (line.Product?.SKU ?? string.Empty).ToLowerInvariant();

        return name.Contains("subscription") || name.Contains("saas") || name.Contains("annual") || name.Contains("monthly") ||
               sku.StartsWith("sub-") || sku.StartsWith("saas-");
    }

    private void ComposeHeader(IContainer container, Quotation q, Company c)
    {
        container.Column(col =>
        {
            // ─── Top Brand Row ──────────────────────────────────────
            col.Item().Row(row =>
            {
                // Brand Identity
                row.RelativeItem().Row(brandRow =>
                {
                    brandRow.ConstantItem(36).Height(36).Background(PrimarySlate).CornerRadius(8).AlignCenter().AlignMiddle().Text("DF").FontFamily("Arial").FontSize(14).Bold().FontColor(Colors.White);
                    brandRow.RelativeItem().PaddingLeft(10).Column(brandCol =>
                    {
                        brandCol.Item().Row(r =>
                        {
                            r.AutoItem().Text("DealFlow").FontSize(15).ExtraBold().FontColor(PrimarySlate);
                            r.AutoItem().Text("360").FontSize(15).ExtraBold().FontColor(AccentBlue);
                        });
                        brandCol.Item().Text(c.Name).FontSize(8).SemiBold().FontColor(TextMuted);
                        brandCol.Item().Text("GIFT City, Gandhinagar • GSTIN: 24AAACD3600F1Z5").FontSize(7.5f).FontColor(TextMuted);
                    });
                });

                // Quotation Meta Block
                row.ConstantItem(230).AlignRight().Column(metaCol =>
                {
                    metaCol.Item().AlignRight().Text("COMMERCIAL QUOTATION").FontSize(14).ExtraBold().FontColor(BrandBlue);
                    metaCol.Item().AlignRight().Row(r =>
                    {
                        r.AutoItem().Text("Quote No: ").SemiBold().FontColor(TextMuted);
                        r.AutoItem().Text(q.QuotationNumber).Bold().FontFamily("Courier").FontColor(PrimarySlate);
                        r.AutoItem().Text($"  (v{q.Version})").FontSize(7.5f).SemiBold().FontColor(TextMuted);
                    });

                    var statusText = FormatStatusPill(q.Status);
                    metaCol.Item().AlignRight().PaddingTop(3).Container()
                        .Background(statusText.BgColor)
                        .Border(1)
                        .BorderColor(statusText.BorderColor)
                        .CornerRadius(4)
                        .PaddingHorizontal(8)
                        .PaddingVertical(2)
                        .Text(statusText.Label)
                        .FontSize(7.5f)
                        .Bold()
                        .FontColor(statusText.TextColor);
                });
            });

            // Subtle divider line
            col.Item().PaddingTop(10).PaddingBottom(10).LineHorizontal(1).LineColor(BorderSubtle);

            // ─── Parties Row: Bill To & Commercial Details ──────────
            col.Item().Row(row =>
            {
                // Left Column: Bill To / Customer
                row.RelativeItem(5).Column(custCol =>
                {
                    custCol.Item().Text("PREPARED FOR / BILL TO:").FontSize(7.5f).Bold().FontColor(TextMuted);
                    custCol.Item().PaddingTop(2).Text(q.Customer?.Name ?? "Valued Client").FontSize(11).Bold().FontColor(PrimarySlate);
                    
                    var tierName = q.Customer?.Tier?.Name ?? "Standard";
                    custCol.Item().PaddingTop(1).Row(tr =>
                    {
                        tr.AutoItem().Text("Account Tier: ").FontSize(8).FontColor(TextMuted);
                        tr.AutoItem().Text($"{tierName} Enterprise Partner").FontSize(8).SemiBold().FontColor(BrandBlue);
                    });

                    if (!string.IsNullOrWhiteSpace(q.Customer?.Email))
                        custCol.Item().Text($"Email: {q.Customer.Email}").FontSize(8).FontColor(TextDark);
                    if (!string.IsNullOrWhiteSpace(q.Customer?.Phone))
                        custCol.Item().Text($"Phone: {q.Customer.Phone}").FontSize(8).FontColor(TextDark);
                });

                // Right Column: Commercial & Proposal Parameters
                row.RelativeItem(4).AlignRight().Column(detailsCol =>
                {
                    detailsCol.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Quotation Date:").FontSize(8).FontColor(TextMuted);
                        r.ConstantItem(100).AlignRight().Text(q.CreatedAtUtc.ToString("dd MMM yyyy")).FontSize(8).SemiBold().FontColor(PrimarySlate);
                    });

                    var validUntil = q.ExpectedCloseDate ?? q.CreatedAtUtc.AddDays(30);
                    detailsCol.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Valid Until:").FontSize(8).FontColor(TextMuted);
                        r.ConstantItem(100).AlignRight().Text(validUntil.ToString("dd MMM yyyy")).FontSize(8).SemiBold().FontColor(PrimarySlate);
                    });

                    detailsCol.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Commercial Currency:").FontSize(8).FontColor(TextMuted);
                        r.ConstantItem(100).AlignRight().Text($"{q.CurrencyCode} (INR)").FontSize(8).SemiBold().FontColor(PrimarySlate);
                    });

                    var repName = q.SalesRep?.FullName ?? "Enterprise Solutions Desk";
                    detailsCol.Item().Row(r =>
                    {
                        r.RelativeItem().Text("Account Executive:").FontSize(8).FontColor(TextMuted);
                        r.ConstantItem(100).AlignRight().Text(repName).FontSize(8).SemiBold().FontColor(BrandBlue);
                    });
                });
            });

            col.Item().PaddingTop(10).PaddingBottom(6).LineHorizontal(1).LineColor(BorderSubtle);
        });
    }

    private void ComposeContent(
        IContainer container, 
        Quotation q, 
        Company c, 
        List<QuotationLine> oneTimeLines, 
        List<QuotationLine> recurringLines)
    {
        container.Column(col =>
        {
            var currency = string.IsNullOrWhiteSpace(q.CurrencyCode) ? "INR" : q.CurrencyCode;
            var currencySym = currency == "INR" ? "₹" : currency + " ";

            // ═══════════════════════════════════════════════════════════
            // SECTION 1: ONE-TIME DELIVERABLES & HARDWARE
            // ═══════════════════════════════════════════════════════════
            if (oneTimeLines.Any())
            {
                col.Item().PaddingTop(4).PaddingBottom(4).Row(hdr =>
                {
                    hdr.AutoItem().Container().Background(BgLight).Border(1).BorderColor(BorderSubtle).CornerRadius(4).PaddingHorizontal(6).PaddingVertical(2)
                        .Text("ONE-TIME DELIVERABLES & PRODUCTS").FontSize(8).Bold().FontColor(PrimarySlate);
                });

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(24);              // #
                        columns.RelativeColumn(5.0f);            // Item & Details
                        columns.RelativeColumn(1.0f);            // Qty
                        columns.RelativeColumn(1.8f);            // Unit Price
                        columns.RelativeColumn(1.2f);            // Disc %
                        columns.RelativeColumn(1.2f);            // Tax %
                        columns.RelativeColumn(2.0f);            // Net Total
                    });

                    // Table Header — Repeats dynamically on page breaks
                    table.Header(header =>
                    {
                        header.Cell().Element(HeaderStyle).AlignCenter().Text("#");
                        header.Cell().Element(HeaderStyle).Text("Item / Description / SKU");
                        header.Cell().Element(HeaderStyle).AlignCenter().Text("Qty");
                        header.Cell().Element(HeaderStyle).AlignRight().Text("Unit Price");
                        header.Cell().Element(HeaderStyle).AlignRight().Text("Disc %");
                        header.Cell().Element(HeaderStyle).AlignRight().Text("Tax %");
                        header.Cell().Element(HeaderStyle).AlignRight().Text("Amount");

                        static IContainer HeaderStyle(IContainer cell) => cell
                            .Background(PrimarySlate)
                            .PaddingVertical(5)
                            .PaddingHorizontal(4)
                            .DefaultTextStyle(t => t.FontSize(7.5f).Bold().FontColor(Colors.White));
                    });

                    int idx = 1;
                    foreach (var line in oneTimeLines)
                    {
                        var isEven = idx % 2 == 0;
                        var rowBg = isEven ? BgLight : Colors.White;

                        table.Cell().Element(c => CellStyle(c, rowBg)).AlignCenter().Text(idx.ToString()).FontSize(8).FontColor(TextMuted);

                        table.Cell().Element(c => CellStyle(c, rowBg)).Column(pCol =>
                        {
                            pCol.Item().Text(line.Product?.Name ?? "Product Item").Bold().FontSize(8.5f).FontColor(PrimarySlate);

                            pCol.Item().Row(subRow =>
                            {
                                subRow.AutoItem().Text($"SKU: {line.Product?.SKU ?? "N/A"}").FontSize(7.5f).FontFamily("Courier").FontColor(TextMuted);
                                if (line.Variant != null)
                                {
                                    subRow.AutoItem().PaddingLeft(6).Text($"• Variant: {line.Variant.Name}").FontSize(7.5f).SemiBold().FontColor(BrandBlue);
                                }
                            });

                            if (!string.IsNullOrWhiteSpace(line.Product?.Description))
                            {
                                pCol.Item().PaddingTop(1).Text(line.Product.Description).FontSize(7.2f).FontColor(TextMuted);
                            }
                        });

                        table.Cell().Element(c => CellStyle(c, rowBg)).AlignCenter().Text(line.Quantity.ToString()).FontSize(8.5f).SemiBold();
                        table.Cell().Element(c => CellStyle(c, rowBg)).AlignRight().Text($"{currencySym}{line.UnitPrice:N2}").FontSize(8.5f);
                        
                        var discStr = line.DiscountPercent > 0 ? $"{line.DiscountPercent:G29}%" : "-";
                        table.Cell().Element(c => CellStyle(c, rowBg)).AlignRight().Text(discStr).FontSize(8.5f)
                            .FontColor(line.DiscountPercent > 0 ? GreenSuccess : TextMuted);

                        var taxPercent = line.Product?.TaxRate ?? 18;
                        table.Cell().Element(c => CellStyle(c, rowBg)).AlignRight().Text($"{taxPercent:G29}%").FontSize(8.5f).FontColor(TextMuted);

                        table.Cell().Element(c => CellStyle(c, rowBg)).AlignRight().Text($"{currencySym}{line.NetAmount:N2}").FontSize(8.5f).Bold().FontColor(PrimarySlate);

                        idx++;
                    }

                    static IContainer CellStyle(IContainer cell, Color bg) => cell
                        .Background(bg)
                        .BorderBottom(1)
                        .BorderColor(BorderSubtle)
                        .PaddingVertical(5)
                        .PaddingHorizontal(4);
                });
            }

            // ═══════════════════════════════════════════════════════════
            // SECTION 2: RECURRING SAAS & SUBSCRIPTION SERVICES
            // ═══════════════════════════════════════════════════════════
            if (recurringLines.Any())
            {
                col.Item().PaddingTop(12).PaddingBottom(4).Row(hdr =>
                {
                    hdr.AutoItem().Container().Background(Color.FromHex("#EEF2FF")).Border(1).BorderColor(Color.FromHex("#C7D2FE")).CornerRadius(4).PaddingHorizontal(6).PaddingVertical(2)
                        .Text("RECURRING SAAS & SUBSCRIPTION SCHEDULE").FontSize(8).Bold().FontColor(IndigoTag);
                });

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(24);              // #
                        columns.RelativeColumn(4.5f);            // Subscription Plan & Service
                        columns.RelativeColumn(1.5f);            // Billing Cadence
                        columns.RelativeColumn(1.0f);            // Seats/Qty
                        columns.RelativeColumn(1.8f);            // Cadence Rate
                        columns.RelativeColumn(1.2f);            // Disc %
                        columns.RelativeColumn(2.2f);            // Recurring Total
                    });

                    table.Header(header =>
                    {
                        header.Cell().Element(SubHeaderStyle).AlignCenter().Text("#");
                        header.Cell().Element(SubHeaderStyle).Text("Service / Subscription Plan");
                        header.Cell().Element(SubHeaderStyle).AlignCenter().Text("Cadence");
                        header.Cell().Element(SubHeaderStyle).AlignCenter().Text("Seats");
                        header.Cell().Element(SubHeaderStyle).AlignRight().Text("Rate");
                        header.Cell().Element(SubHeaderStyle).AlignRight().Text("Disc %");
                        header.Cell().Element(SubHeaderStyle).AlignRight().Text("Recurring Period");

                        static IContainer SubHeaderStyle(IContainer cell) => cell
                            .Background(Color.FromHex("#1E1B4B")) // Deep Indigo Slate
                            .PaddingVertical(5)
                            .PaddingHorizontal(4)
                            .DefaultTextStyle(t => t.FontSize(7.5f).Bold().FontColor(Colors.White));
                    });

                    int subIdx = 1;
                    foreach (var line in recurringLines)
                    {
                        var isEven = subIdx % 2 == 0;
                        var rowBg = isEven ? Color.FromHex("#F5F3FF") : Colors.White;

                        table.Cell().Element(c => SubCellStyle(c, rowBg)).AlignCenter().Text(subIdx.ToString()).FontSize(8).FontColor(TextMuted);

                        table.Cell().Element(c => SubCellStyle(c, rowBg)).Column(pCol =>
                        {
                            pCol.Item().Text(line.Product?.Name ?? "Cloud Subscription").Bold().FontSize(8.5f).FontColor(PrimarySlate);
                            var planName = line.SubscriptionPlan?.Name ?? "Standard Enterprise SaaS";
                            pCol.Item().Text($"Plan: {planName}").FontSize(7.5f).SemiBold().FontColor(IndigoTag);
                        });

                        var cadence = line.SubscriptionPlan?.BillingFrequency ?? "Monthly";
                        table.Cell().Element(c => SubCellStyle(c, rowBg)).AlignCenter().Container()
                            .Background(Color.FromHex("#E0E7FF"))
                            .CornerRadius(3)
                            .PaddingHorizontal(4)
                            .PaddingVertical(1)
                            .Text(cadence)
                            .FontSize(7.2f)
                            .Bold()
                            .FontColor(IndigoTag);

                        table.Cell().Element(c => SubCellStyle(c, rowBg)).AlignCenter().Text(line.Quantity.ToString()).FontSize(8.5f).SemiBold();
                        table.Cell().Element(c => SubCellStyle(c, rowBg)).AlignRight().Text($"{currencySym}{line.UnitPrice:N2}").FontSize(8.5f);

                        var discStr = line.DiscountPercent > 0 ? $"{line.DiscountPercent:G29}%" : "-";
                        table.Cell().Element(c => SubCellStyle(c, rowBg)).AlignRight().Text(discStr).FontSize(8.5f)
                            .FontColor(line.DiscountPercent > 0 ? GreenSuccess : TextMuted);

                        table.Cell().Element(c => SubCellStyle(c, rowBg)).AlignRight().Text($"{currencySym}{line.NetAmount:N2}").FontSize(8.5f).Bold().FontColor(IndigoTag);

                        subIdx++;
                    }

                    static IContainer SubCellStyle(IContainer cell, Color bg) => cell
                        .Background(bg)
                        .BorderBottom(1)
                        .BorderColor(BorderSubtle)
                        .PaddingVertical(5)
                        .PaddingHorizontal(4);
                });

                col.Item().PaddingTop(3).Text("* Recurring subscriptions activate upon client acceptance and renew automatically per designated billing cycle until terminated in accordance with service terms.")
                    .FontSize(7).Italic().FontColor(TextMuted);
            }

            // ═══════════════════════════════════════════════════════════
            // SECTION 3: COMMERCIAL TOTALS & TAX BREAKDOWN
            // ═══════════════════════════════════════════════════════════
            col.Item().PaddingTop(14).Row(summaryRow =>
            {
                // Left Column: Commercial Remarks & Delivery Terms
                summaryRow.RelativeItem(5).Column(termsCol =>
                {
                    termsCol.Item().Text("COMMERCIAL TERMS & SLA:").FontSize(8).Bold().FontColor(TextDark);
                    termsCol.Item().PaddingTop(2).Text("1. Payment Terms: Net 30 days upon invoice receipt via electronic bank transfer.").FontSize(7.5f).FontColor(TextMuted);
                    termsCol.Item().Text("2. Hardware Fulfillment: Dispatched within 5-7 business days upon confirmation.").FontSize(7.5f).FontColor(TextMuted);
                    termsCol.Item().Text("3. Cloud Services SLA: Guaranteed 99.9% uptime per DealFlow360 Enterprise Master Services Agreement.").FontSize(7.5f).FontColor(TextMuted);
                    termsCol.Item().Text("4. Governing Law: State of Gujarat, India. Subject to Gandhinagar jurisdiction.").FontSize(7.5f).FontColor(TextMuted);

                    if (!string.IsNullOrWhiteSpace(q.Notes))
                    {
                        termsCol.Item().PaddingTop(6).Container().Background(BgLight).Border(1).BorderColor(BorderSubtle).CornerRadius(4).Padding(6).Column(nCol =>
                        {
                            nCol.Item().Text("Special Commercial Stipulations:").FontSize(7.5f).Bold().FontColor(PrimarySlate);
                            nCol.Item().Text(q.Notes).FontSize(7.5f).FontColor(TextDark);
                        });
                    }
                });

                summaryRow.ConstantItem(20); // Spacing

                // Right Column: Precise Pricing Breakdown
                summaryRow.RelativeItem(4).Container()
                    .Background(BgLight)
                    .Border(1)
                    .BorderColor(BorderSubtle)
                    .CornerRadius(6)
                    .Padding(10)
                    .Column(calcCol =>
                    {
                        calcCol.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Subtotal (Gross):").FontSize(8.5f).FontColor(TextMuted);
                            r.ConstantItem(100).AlignRight().Text($"{currencySym}{q.SubTotal:N2}").FontSize(8.5f).SemiBold().FontColor(PrimarySlate);
                        });

                        if (q.DiscountTotal > 0)
                        {
                            calcCol.Item().PaddingTop(3).Row(r =>
                            {
                                r.RelativeItem().Text("Total Client Savings:").FontSize(8.5f).SemiBold().FontColor(GreenSuccess);
                                r.ConstantItem(100).AlignRight().Text($"- {currencySym}{q.DiscountTotal:N2}").FontSize(8.5f).Bold().FontColor(GreenSuccess);
                            });
                        }

                        var taxableValue = Math.Max(0, q.SubTotal - q.DiscountTotal);
                        calcCol.Item().PaddingTop(3).Row(r =>
                        {
                            r.RelativeItem().Text("Taxable Subtotal:").FontSize(8.5f).FontColor(TextMuted);
                            r.ConstantItem(100).AlignRight().Text($"{currencySym}{taxableValue:N2}").FontSize(8.5f).FontColor(PrimarySlate);
                        });

                        calcCol.Item().PaddingTop(3).Row(r =>
                        {
                            r.RelativeItem().Text("Applicable GST / Tax:").FontSize(8.5f).FontColor(TextMuted);
                            r.ConstantItem(100).AlignRight().Text($"{currencySym}{q.TaxTotal:N2}").FontSize(8.5f).SemiBold().FontColor(PrimarySlate);
                        });

                        calcCol.Item().PaddingTop(6).PaddingBottom(6).LineHorizontal(1).LineColor(BorderSubtle);

                        // Grand Total Box
                        calcCol.Item().Container()
                            .Background(PrimarySlate)
                            .CornerRadius(4)
                            .PaddingHorizontal(8)
                            .PaddingVertical(6)
                            .Row(r =>
                            {
                                r.RelativeItem().AlignMiddle().Text("GRAND TOTAL:").FontSize(10).ExtraBold().FontColor(Colors.White);
                                r.ConstantItem(110).AlignRight().AlignMiddle().Text($"{currencySym}{q.GrandTotal:N2}").FontSize(11.5f).ExtraBold().FontColor(Colors.White);
                            });
                    });
            });

            // ═══════════════════════════════════════════════════════════
            // SECTION 4: FORMAL CLIENT ACCEPTANCE & EXECUTION
            // ═══════════════════════════════════════════════════════════
            col.Item().PaddingTop(16).Container()
                .Border(1)
                .BorderColor(BorderSubtle)
                .CornerRadius(6)
                .Padding(10)
                .Column(sigCol =>
                {
                    sigCol.Item().Row(hdrRow =>
                    {
                        hdrRow.RelativeItem().Text("CLIENT ACCEPTANCE & COMMERCIAL AUTHORIZATION").FontSize(8.5f).Bold().FontColor(PrimarySlate);

                        if (q.Status is QuoteStatus.Confirmed or QuoteStatus.ConvertedToOrder)
                        {
                            hdrRow.ConstantItem(140).AlignRight().Container()
                                .Background(Color.FromHex("#ECFDF5"))
                                .Border(1)
                                .BorderColor(Color.FromHex("#A7F3D0"))
                                .CornerRadius(4)
                                .PaddingHorizontal(6)
                                .PaddingVertical(2)
                                .Text("✓ DIGITALLY CONFIRMED")
                                .FontSize(7.5f)
                                .Bold()
                                .FontColor(GreenSuccess);
                        }
                    });

                    sigCol.Item().PaddingTop(2).Text("By signing below, the undersigned acknowledges and formally approves the scope, deliverables, and commercial pricing detailed in this quotation.")
                        .FontSize(7.2f).FontColor(TextMuted);

                    sigCol.Item().PaddingTop(12).Row(lineRow =>
                    {
                        lineRow.RelativeItem().Column(c1 =>
                        {
                            c1.Item().LineHorizontal(1).LineColor(Color.FromHex("#94A3B8"));
                            c1.Item().PaddingTop(3).Text("Authorized Client Signatory").FontSize(7.5f).Bold().FontColor(PrimarySlate);
                            c1.Item().Text($"For {q.Customer?.Name ?? "Client Organization"}").FontSize(7).FontColor(TextMuted);
                        });

                        lineRow.ConstantItem(30);

                        lineRow.RelativeItem().Column(c2 =>
                        {
                            c2.Item().LineHorizontal(1).LineColor(Color.FromHex("#94A3B8"));
                            c2.Item().PaddingTop(3).Text("Signatory Full Name & Designation").FontSize(7.5f).Bold().FontColor(PrimarySlate);
                            c2.Item().Text("Date of Execution: ___________________").FontSize(7).FontColor(TextMuted);
                        });

                        lineRow.ConstantItem(30);

                        lineRow.ConstantItem(120).Height(40).Container()
                            .Border(1)
                            .BorderColor(BorderSubtle)
                            .Background(BgLight)
                            .AlignCenter()
                            .AlignMiddle()
                            .Text("Corporate Seal / Stamp")
                            .FontSize(7)
                            .FontColor(TextMuted);
                    });
                });
        });
    }

    private void ComposeFooter(IContainer container, Quotation q, Company c)
    {
        container.Column(col =>
        {
            col.Item().PaddingBottom(4).LineHorizontal(1).LineColor(BorderSubtle);

            col.Item().Row(row =>
            {
                row.RelativeItem().Text(t =>
                {
                    t.Span($"{c.Name} • Tech Boulevard, GIFT City, Gandhinagar • ").FontColor(TextMuted).FontSize(7);
                    t.Span("Confidential Commercial Document").SemiBold().FontColor(TextMuted).FontSize(7);
                });

                row.ConstantItem(140).AlignRight().Text(t =>
                {
                    t.Span("Page ").FontColor(TextMuted).FontSize(7.5f);
                    t.CurrentPageNumber().FontColor(PrimarySlate).FontSize(7.5f).SemiBold();
                    t.Span(" of ").FontColor(TextMuted).FontSize(7.5f);
                    t.TotalPages().FontColor(PrimarySlate).FontSize(7.5f).SemiBold();
                });
            });
        });
    }

    private static (string Label, Color TextColor, Color BgColor, Color BorderColor) FormatStatusPill(QuoteStatus status)
    {
        return status switch
        {
            QuoteStatus.Draft => ("DRAFT PROPOSAL", Color.FromHex("#475569"), Color.FromHex("#F1F5F9"), Color.FromHex("#CBD5E1")),
            QuoteStatus.PendingApproval => ("PENDING REVIEW", Color.FromHex("#D97706"), Color.FromHex("#FFFBEB"), Color.FromHex("#FDE68A")),
            QuoteStatus.Approved => ("EXECUTIVE APPROVED", Color.FromHex("#059669"), Color.FromHex("#ECFDF5"), Color.FromHex("#A7F3D0")),
            QuoteStatus.Sent => ("PROPOSAL ISSUED", Color.FromHex("#1D4ED8"), Color.FromHex("#EFF6FF"), Color.FromHex("#BFDBFE")),
            QuoteStatus.UnderNegotiation => ("UNDER NEGOTIATION", Color.FromHex("#7C3AED"), Color.FromHex("#F5F3FF"), Color.FromHex("#DDD6FE")),
            QuoteStatus.Confirmed => ("OFFICIALLY CONFIRMED", Color.FromHex("#059669"), Color.FromHex("#ECFDF5"), Color.FromHex("#A7F3D0")),
            QuoteStatus.ConvertedToOrder => ("CONVERTED TO ORDER", Color.FromHex("#059669"), Color.FromHex("#ECFDF5"), Color.FromHex("#A7F3D0")),
            QuoteStatus.Rejected => ("PROPOSAL DECLINED", Color.FromHex("#DC2626"), Color.FromHex("#FEF2F2"), Color.FromHex("#FECACA")),
            QuoteStatus.Cancelled => ("CANCELLED", Color.FromHex("#64748B"), Color.FromHex("#F8FAFC"), Color.FromHex("#E2E8F0")),
            _ => (status.ToString().ToUpperInvariant(), Color.FromHex("#475569"), Color.FromHex("#F1F5F9"), Color.FromHex("#CBD5E1"))
        };
    }
}
