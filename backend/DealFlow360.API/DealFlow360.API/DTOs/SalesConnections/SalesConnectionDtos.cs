using System.ComponentModel.DataAnnotations;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.DTOs.SalesConnections;

// ─── Company DTOs ──────────────────────────────────────────
public class CompanyDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Code { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? ContactEmail { get; set; }
    public string? ContactPhone { get; set; }
    public bool IsActive { get; set; }
    public int ProductCount { get; set; }
    public int ActiveAssignmentsCount { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateCompanyRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(150)]
    public string? ContactEmail { get; set; }

    [MaxLength(50)]
    public string? ContactPhone { get; set; }
}

public class UpdateCompanyRequest
{
    [Required, MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(255)]
    public string? Website { get; set; }

    [MaxLength(500)]
    public string? LogoUrl { get; set; }

    [MaxLength(150)]
    public string? ContactEmail { get; set; }

    [MaxLength(50)]
    public string? ContactPhone { get; set; }

    public bool IsActive { get; set; }
}

// ─── Sales Assignment DTOs ────────────────────────────────
public class SalesAssignmentDto
{
    public int Id { get; set; }
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public int SalesRepresentativeId { get; set; }
    public string SalesRepName { get; set; } = string.Empty;
    public string SalesRepEmail { get; set; } = string.Empty;
    public int? ProductId { get; set; }
    public string? ProductName { get; set; }
    public int? CategoryId { get; set; }
    public string? CategoryName { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public bool IsDefault { get; set; }
    public int Priority { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateSalesAssignmentRequest
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    public int SalesRepresentativeId { get; set; }

    public int? ProductId { get; set; }
    public int? CategoryId { get; set; }
    public int? CustomerId { get; set; }
    public bool IsDefault { get; set; } = false;
    public int Priority { get; set; } = 10;

    [MaxLength(500)]
    public string? Notes { get; set; }
}

public class UpdateSalesAssignmentRequest
{
    public int? ProductId { get; set; }
    public int? CategoryId { get; set; }
    public int? CustomerId { get; set; }
    public bool IsDefault { get; set; }
    public int Priority { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }
    public bool IsActive { get; set; }
}

// ─── Customer Catalog Selection DTOs ──────────────────────
public class ProductCatalogItemDto
{
    public int Id { get; set; }
    public string SKU { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = string.Empty;
    public int? CompanyId { get; set; }
    public string? CompanyName { get; set; }
    public decimal BasePrice { get; set; }
    public string Unit { get; set; } = "Each";
    public string ProductType { get; set; } = "OneTime";
    public bool IsActive { get; set; }
}

public class ResolveRepRequest
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    public int ProductId { get; set; }
}

// ─── Connection Request DTOs ──────────────────────────────
public class CreateSalesConnectionRequestDto
{
    [Required]
    public int CompanyId { get; set; }

    [Required]
    public int ProductId { get; set; }

    [Range(1, 10000)]
    public int RequestedQuantity { get; set; } = 1;

    [MaxLength(1500)]
    public string? CustomerMessage { get; set; }

    [MaxLength(50)]
    public string? PreferredContactMethod { get; set; } = "Email";
}

public class UpdateSalesConnectionStatusRequest
{
    [Required]
    public SalesConnectionStatus Status { get; set; }

    [MaxLength(1500)]
    public string? RepNotes { get; set; }

    [MaxLength(500)]
    public string? RejectionReason { get; set; }
}

public class SalesConnectionResponse
{
    public int Id { get; set; }
    public string RequestNumber { get; set; } = string.Empty;
    public int CustomerId { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerEmail { get; set; }
    public string? CustomerTierName { get; set; }
    public decimal TierDiscountPercent { get; set; } = 5.00m;
    public int CompanyId { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public int ProductId { get; set; }
    public string ProductName { get; set; } = string.Empty;
    public string ProductSku { get; set; } = string.Empty;
    public decimal BasePrice { get; set; }
    public int SalesRepresentativeId { get; set; }
    public string SalesRepName { get; set; } = string.Empty;
    public string SalesRepEmail { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public int RequestedQuantity { get; set; }
    public string? CustomerMessage { get; set; }
    public string? PreferredContactMethod { get; set; }
    public string? ResolutionReason { get; set; }
    public int? QuotationId { get; set; }
    public string? QuotationNumber { get; set; }
    public string? RepNotes { get; set; }
    public string? RejectionReason { get; set; }
    public int TotalAvailableStock { get; set; }
    public int TotalOnHandStock { get; set; }
    public bool IsStockSufficient { get; set; } = true;
    public List<InquiryWarehouseStockDto> WarehouseStocks { get; set; } = new();
    public DateTime? AcceptedAtUtc { get; set; }
    public DateTime? ContactedAtUtc { get; set; }
    public DateTime? QualifiedAtUtc { get; set; }
    public DateTime? QuoteCreatedAtUtc { get; set; }
    public DateTime? ClosedAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class InquiryWarehouseStockDto
{
    public int WarehouseId { get; set; }
    public string WarehouseName { get; set; } = string.Empty;
    public int OnHand { get; set; }
    public int Reserved { get; set; }
    public int Available => OnHand - Reserved;
}

public class CreateQuoteFromConnectionResponse
{
    public int SalesConnectionId { get; set; }
    public int QuotationId { get; set; }
    public string QuotationNumber { get; set; } = string.Empty;
    public decimal GrandTotal { get; set; }
    public string CurrencyCode { get; set; } = "INR";
}

public class AcceptInquiryRequest
{
    [MaxLength(1500)]
    public string? Notes { get; set; }
}

public class ContactCustomerRequest
{
    [Required, MaxLength(50)]
    public string ContactMethod { get; set; } = "Phone";

    [Required, MaxLength(1500)]
    public string Notes { get; set; } = string.Empty;

    [MaxLength(150)]
    public string? Outcome { get; set; }
}

public class QualifyInquiryRequest
{
    [Required, MaxLength(1500)]
    public string RepNotes { get; set; } = string.Empty;
}

public class RejectInquiryRequest
{
    [Required, MaxLength(500)]
    public string RejectionReason { get; set; } = string.Empty;
}

public class SalesInquirySummaryDto
{
    public int Total { get; set; }
    public int New { get; set; }
    public int Accepted { get; set; }
    public int InProgress { get; set; }
    public int Contacted { get; set; }
    public int Qualified { get; set; }
    public int QuoteCreated { get; set; }
    public int Converted { get; set; }
    public int Rejected { get; set; }
    public int Closed { get; set; }
}

public class PagedSalesInquiriesResult
{
    public List<SalesConnectionResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    public SalesInquirySummaryDto Summary { get; set; } = new();
}
