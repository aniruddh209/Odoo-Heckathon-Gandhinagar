using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Quotations;
using DealFlow360.API.DTOs.SalesConnections;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface ISalesConnectionService
{
    // Customer Facing
    Task<List<CompanyDto>> GetAvailableCompaniesAsync(int? productId = null);
    Task<List<ProductCatalogItemDto>> GetAvailableProductsAsync(int? companyId = null, int? categoryId = null, string? search = null);
    Task<RepResolutionResult> ResolveRepresentativeAsync(int? customerId, int companyId, int productId);
    Task<SalesConnectionResponse> CreateConnectionRequestAsync(int customerId, CreateSalesConnectionRequestDto dto);
    Task<List<SalesConnectionResponse>> GetCustomerRequestsAsync(int customerId);

    // Sales Rep & Manager Facing
    Task<List<SalesConnectionResponse>> GetRepRequestsAsync(int userId, Role role, string? status = null, int? companyId = null);
    Task<SalesInquirySummaryDto> GetInquiriesSummaryAsync(int userId, Role role);
    Task<PagedSalesInquiriesResult> GetWorkspaceInquiriesPagedAsync(
        int userId, Role role, string? search = null, string? status = null, int? companyId = null, int? productId = null, string? sortBy = null, int page = 1, int pageSize = 20);
    Task<SalesConnectionResponse> GetRequestByIdAsync(int id, int userId, Role role, int? customerId);
    Task<SalesConnectionResponse> AcceptInquiryAsync(int id, AcceptInquiryRequest dto, int userId, Role role);
    Task<SalesConnectionResponse> ContactCustomerAsync(int id, ContactCustomerRequest dto, int userId, Role role);
    Task<SalesConnectionResponse> QualifyInquiryAsync(int id, QualifyInquiryRequest dto, int userId, Role role);
    Task<SalesConnectionResponse> RejectInquiryAsync(int id, RejectInquiryRequest dto, int userId, Role role);
    Task<SalesConnectionResponse> UpdateStatusAsync(int id, UpdateSalesConnectionStatusRequest dto, int userId, Role role);
    Task<CreateQuoteFromConnectionResponse> CreateQuoteFromConnectionAsync(int id, int userId, Role role);

    // Admin & Governance Facing
    Task<List<CompanyDto>> GetAllCompaniesAdminAsync();
    Task<CompanyDto> CreateCompanyAsync(CreateCompanyRequest dto);
    Task<CompanyDto> UpdateCompanyAsync(int id, UpdateCompanyRequest dto);
    Task<bool> DeleteCompanyAsync(int id);

    Task<List<SalesAssignmentDto>> GetSalesAssignmentsAsync(int? companyId = null);
    Task<SalesAssignmentDto> CreateSalesAssignmentAsync(CreateSalesAssignmentRequest dto);
    Task<SalesAssignmentDto> UpdateSalesAssignmentAsync(int id, UpdateSalesAssignmentRequest dto);
    Task<bool> DeleteSalesAssignmentAsync(int id);
}

public class SalesConnectionService : ISalesConnectionService
{
    private readonly AppDbContext _context;
    private readonly ISalesRepresentativeResolutionEngine _resolutionEngine;
    private readonly IQuotationService _quotationService;

    public SalesConnectionService(
        AppDbContext context,
        ISalesRepresentativeResolutionEngine resolutionEngine,
        IQuotationService quotationService)
    {
        _context = context;
        _resolutionEngine = resolutionEngine;
        _quotationService = quotationService;
    }

    public async Task<List<CompanyDto>> GetAvailableCompaniesAsync(int? productId = null)
    {
        var excludedCodes = new[] { "CISCO", "DELL", "HPE", "SAMSUNG", "LENOVO_TEST" };
        var query = _context.Companies
            .Where(c => c.IsActive && !c.Name.StartsWith("Audit") && !c.Code.StartsWith("AUD_") && !excludedCodes.Contains(c.Code.ToUpper()))
            .Where(c => c.Products.Any(p => p.IsActive && !p.SKU.StartsWith("SKU-AUD") && !p.SKU.StartsWith("PROD-TEST") && !p.Name.StartsWith("Audit")))
            .AsNoTracking();

        if (productId.HasValue)
        {
            var product = await _context.Products.FindAsync(productId.Value);
            if (product?.CompanyId != null)
            {
                query = query.Where(c => c.Id == product.CompanyId.Value);
            }
        }

        return await query
            .Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Description = c.Description,
                Website = c.Website,
                LogoUrl = c.LogoUrl,
                ContactEmail = c.ContactEmail,
                ContactPhone = c.ContactPhone,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count(p => p.IsActive && !p.SKU.StartsWith("SKU-AUD") && !p.SKU.StartsWith("PROD-TEST") && !p.Name.StartsWith("Audit")),
                ActiveAssignmentsCount = c.SalesAssignments.Count(a => a.IsActive),
                CreatedAtUtc = c.CreatedAtUtc
            })
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<List<ProductCatalogItemDto>> GetAvailableProductsAsync(int? companyId = null, int? categoryId = null, string? search = null)
    {
        var defaultCompany = await _context.Companies.FirstOrDefaultAsync(c => c.IsActive && c.Code == "DF360") 
                             ?? await _context.Companies.FirstOrDefaultAsync(c => c.IsActive);
        var defaultCompanyId = defaultCompany?.Id;

        // Auto-heal any active products created without a CompanyId so they are immediately available
        if (defaultCompanyId.HasValue)
        {
            var orphanedProducts = await _context.Products.Where(p => p.IsActive && p.CompanyId == null).ToListAsync();
            if (orphanedProducts.Any())
            {
                foreach (var op in orphanedProducts)
                {
                    op.CompanyId = defaultCompanyId.Value;
                }
                await _context.SaveChangesAsync();
            }
        }

        var excludedCompanyCodes = new[] { "CISCO", "DELL", "HPE", "SAMSUNG", "LENOVO_TEST" };
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Company)
            .Where(p => p.IsActive)
            .Where(p => p.Company == null || (p.Company.IsActive && !excludedCompanyCodes.Contains(p.Company.Code.ToUpper())))
            .Where(p => !p.SKU.StartsWith("SKU-AUD") && !p.SKU.StartsWith("PROD-TEST") && !p.Name.StartsWith("Audit"))
            .AsNoTracking();

        if (companyId.HasValue)
        {
            if (defaultCompanyId.HasValue && companyId.Value == defaultCompanyId.Value)
            {
                query = query.Where(p => p.CompanyId == companyId.Value || p.CompanyId == null);
            }
            else
            {
                query = query.Where(p => p.CompanyId == companyId.Value);
            }
        }

        if (categoryId.HasValue)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) || p.SKU.ToLower().Contains(s) || (p.Description != null && p.Description.ToLower().Contains(s)));
        }

        return await query
            .Select(p => new ProductCatalogItemDto
            {
                Id = p.Id,
                SKU = p.SKU,
                Name = p.Name,
                Description = p.Description,
                CategoryId = p.CategoryId,
                CategoryName = p.Category.Name,
                CompanyId = p.CompanyId ?? defaultCompanyId,
                CompanyName = p.Company != null ? p.Company.Name : (defaultCompany != null ? defaultCompany.Name : "DealFlow360 Technologies Pvt. Ltd."),
                BasePrice = p.BasePrice,
                Unit = p.Unit,
                ProductType = p.ProductType.ToString(),
                IsActive = p.IsActive
            })
            .OrderBy(p => p.Name)
            .ToListAsync();
    }

    public async Task<RepResolutionResult> ResolveRepresentativeAsync(int? customerId, int companyId, int productId)
    {
        return await _resolutionEngine.ResolveRepresentativeAsync(customerId, companyId, productId);
    }

    public async Task<SalesConnectionResponse> CreateConnectionRequestAsync(int customerId, CreateSalesConnectionRequestDto dto)
    {
        var customer = await _context.Customers
            .Include(c => c.Tier)
            .FirstOrDefaultAsync(c => c.Id == customerId);
        if (customer == null || !customer.IsActive)
        {
            throw new KeyNotFoundException("Active customer organization not found.");
        }

        var company = await _context.Companies.FindAsync(dto.CompanyId);
        if (company == null || !company.IsActive)
        {
            throw new KeyNotFoundException("Selected company/brand is not recognized or active.");
        }

        var product = await _context.Products
            .Include(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .FirstOrDefaultAsync(p => p.Id == dto.ProductId);
        if (product == null || !product.IsActive)
        {
            throw new KeyNotFoundException("Selected product is not found in active catalog.");
        }

        // Duplicate Check: Cannot have multiple open requests for the same Customer, Company, and Product
        var hasActive = await _context.SalesConnectionRequests.AnyAsync(r =>
            r.CustomerId == customerId &&
            r.CompanyId == dto.CompanyId &&
            r.ProductId == dto.ProductId &&
            r.Status != SalesConnectionStatus.Converted &&
            r.Status != SalesConnectionStatus.Rejected &&
            r.Status != SalesConnectionStatus.Closed);

        if (hasActive)
        {
            throw new InvalidOperationException("You already have an active connection request for this product and company. Our sales representative will be in touch shortly.");
        }

        // Resolve Representative via Engine
        var resolution = await _resolutionEngine.ResolveRepresentativeAsync(customerId, dto.CompanyId, dto.ProductId);
        if (!resolution.Found)
        {
            throw new InvalidOperationException("No representative could be determined at this moment. Please contact support.");
        }

        var requestNumber = $"SCR-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..6].ToUpper()}";

        var connection = new SalesConnectionRequest
        {
            RequestNumber = requestNumber,
            CustomerId = customerId,
            CompanyId = dto.CompanyId,
            ProductId = dto.ProductId,
            SalesRepresentativeId = resolution.SalesRepresentativeId,
            Status = SalesConnectionStatus.Pending,
            RequestedQuantity = dto.RequestedQuantity < 1 ? 1 : dto.RequestedQuantity,
            CustomerMessage = dto.CustomerMessage,
            PreferredContactMethod = dto.PreferredContactMethod ?? "Email",
            ResolutionReason = resolution.MatchReason,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SalesConnectionRequests.Add(connection);

        // Internal Notification to the Sales Representative
        _context.Notifications.Add(new Notification
        {
            UserId = resolution.SalesRepresentativeId,
            Title = "New Customer Sales Connection",
            Message = $"Customer '{customer.Name}' requested a connection regarding '{product.Name}' ({company.Name}). Request #{requestNumber}.",
            Type = "SalesConnectionRequested",
            RelatedEntityType = nameof(SalesConnectionRequest),
            CreatedAtUtc = DateTime.UtcNow
        });

        // Audit Log
        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(SalesConnectionRequest),
            EntityId = 0, // Will be set after save
            Action = "CustomerConnectedWithSales",
            UserId = resolution.SalesRepresentativeId,
            OldValueJson = null,
            NewValueJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                requestNumber,
                customerId,
                customerName = customer.Name,
                companyId = dto.CompanyId,
                companyName = company.Name,
                productId = dto.ProductId,
                productName = product.Name,
                repId = resolution.SalesRepresentativeId,
                repName = resolution.FullName
            }),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToResponse(connection, customer, company, product, resolution.FullName, resolution.Email);
    }

    public async Task<List<SalesConnectionResponse>> GetCustomerRequestsAsync(int customerId)
    {
        return await _context.SalesConnectionRequests
            .Include(r => r.Customer).ThenInclude(c => c.Tier)
            .Include(r => r.Company)
            .Include(r => r.Product).ThenInclude(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .Where(r => r.CustomerId == customerId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(MapToResponseExpr)
            .ToListAsync();
    }

    public async Task<List<SalesConnectionResponse>> GetRepRequestsAsync(int userId, Role role, string? status = null, int? companyId = null)
    {
        var query = _context.SalesConnectionRequests
            .Include(r => r.Customer).ThenInclude(c => c.Tier)
            .Include(r => r.Company)
            .Include(r => r.Product)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .AsNoTracking();

        // Rep isolation: Sales reps can only view their own assigned requests
        if (role == Role.SalesRep)
        {
            query = query.Where(r => r.SalesRepresentativeId == userId);
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (status.Equals("InProgress", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.Status == SalesConnectionStatus.Accepted || r.Status == SalesConnectionStatus.Contacted);
            }
            else if (status.Equals("Quoted", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.Status == SalesConnectionStatus.QuoteCreated || r.Status == SalesConnectionStatus.Converted);
            }
            else if (Enum.TryParse<SalesConnectionStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == parsedStatus);
            }
        }

        if (companyId.HasValue)
        {
            query = query.Where(r => r.CompanyId == companyId.Value);
        }

        return await query
            .OrderByDescending(r => r.CreatedAtUtc)
            .Select(MapToResponseExpr)
            .ToListAsync();
    }

    public async Task<SalesInquirySummaryDto> GetInquiriesSummaryAsync(int userId, Role role)
    {
        var query = _context.SalesConnectionRequests.AsNoTracking();

        if (role == Role.SalesRep)
        {
            query = query.Where(r => r.SalesRepresentativeId == userId);
        }

        var counts = await query
            .GroupBy(r => r.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync();

        var summary = new SalesInquirySummaryDto();
        foreach (var c in counts)
        {
            summary.Total += c.Count;
            switch (c.Status)
            {
                case SalesConnectionStatus.Pending:
                    summary.New += c.Count;
                    break;
                case SalesConnectionStatus.Accepted:
                    summary.Accepted += c.Count;
                    summary.InProgress += c.Count;
                    break;
                case SalesConnectionStatus.Contacted:
                    summary.Contacted += c.Count;
                    summary.InProgress += c.Count;
                    break;
                case SalesConnectionStatus.Qualified:
                    summary.Qualified += c.Count;
                    break;
                case SalesConnectionStatus.QuoteCreated:
                    summary.QuoteCreated += c.Count;
                    break;
                case SalesConnectionStatus.Converted:
                    summary.Converted += c.Count;
                    break;
                case SalesConnectionStatus.Rejected:
                    summary.Rejected += c.Count;
                    break;
                case SalesConnectionStatus.Closed:
                    summary.Closed += c.Count;
                    break;
            }
        }

        return summary;
    }

    public async Task<PagedSalesInquiriesResult> GetWorkspaceInquiriesPagedAsync(
        int userId,
        Role role,
        string? search = null,
        string? status = null,
        int? companyId = null,
        int? productId = null,
        string? sortBy = null,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.SalesConnectionRequests
            .Include(r => r.Customer).ThenInclude(c => c.Tier)
            .Include(r => r.Company)
            .Include(r => r.Product)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .AsNoTracking();

        if (role == Role.SalesRep)
        {
            query = query.Where(r => r.SalesRepresentativeId == userId);
        }

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("ALL", StringComparison.OrdinalIgnoreCase))
        {
            if (status.Equals("InProgress", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.Status == SalesConnectionStatus.Accepted || r.Status == SalesConnectionStatus.Contacted);
            }
            else if (status.Equals("Quoted", StringComparison.OrdinalIgnoreCase))
            {
                query = query.Where(r => r.Status == SalesConnectionStatus.QuoteCreated || r.Status == SalesConnectionStatus.Converted);
            }
            else if (Enum.TryParse<SalesConnectionStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(r => r.Status == parsedStatus);
            }
        }

        if (companyId.HasValue && companyId.Value > 0)
        {
            query = query.Where(r => r.CompanyId == companyId.Value);
        }

        if (productId.HasValue && productId.Value > 0)
        {
            query = query.Where(r => r.ProductId == productId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(r =>
                r.RequestNumber.ToLower().Contains(s) ||
                r.Customer.Name.ToLower().Contains(s) ||
                (r.Customer.Email != null && r.Customer.Email.ToLower().Contains(s)) ||
                r.Company.Name.ToLower().Contains(s) ||
                r.Product.Name.ToLower().Contains(s) ||
                r.Product.SKU.ToLower().Contains(s));
        }

        var totalCount = await query.CountAsync();

        query = sortBy?.ToLower() switch
        {
            "oldest" => query.OrderBy(r => r.CreatedAtUtc),
            "customer" => query.OrderBy(r => r.Customer.Name),
            "status" => query.OrderBy(r => r.Status).ThenByDescending(r => r.CreatedAtUtc),
            _ => query.OrderByDescending(r => r.CreatedAtUtc)
        };

        if (page < 1) page = 1;
        if (pageSize < 1) pageSize = 20;
        if (pageSize > 100) pageSize = 100;

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(MapToResponseExpr)
            .ToListAsync();

        var summary = await GetInquiriesSummaryAsync(userId, role);

        return new PagedSalesInquiriesResult
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize,
            Summary = summary
        };
    }

    public async Task<SalesConnectionResponse> AcceptInquiryAsync(int id, AcceptInquiryRequest dto, int userId, Role role)
    {
        var connection = await _context.SalesConnectionRequests
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product).ThenInclude(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (connection == null)
        {
            throw new KeyNotFoundException($"Sales inquiry #{id} not found.");
        }

        if (role == Role.SalesRep && connection.SalesRepresentativeId != userId)
        {
            throw new UnauthorizedAccessException("You are only authorized to accept inquiries assigned to you.");
        }

        if (connection.Status != SalesConnectionStatus.Pending)
        {
            throw new InvalidOperationException($"Inquiry #{connection.RequestNumber} has already been updated to '{connection.Status}' and cannot be accepted again.");
        }

        // Warehouse Stock Sufficiency Governance: Customer requested quantity of physical goods must not exceed warehouse inventory
        bool isPhysical = IsPhysicalProduct(connection.Product);
        if (isPhysical)
        {
            var totalAvailableStock = await _context.InventoryStocks
                .Where(s => s.ProductId == connection.ProductId && s.Warehouse.IsActive)
                .SumAsync(s => (int?)(s.OnHand - s.Reserved)) ?? 0;

            var totalOnHand = await _context.InventoryStocks
                .Where(s => s.ProductId == connection.ProductId && s.Warehouse.IsActive)
                .SumAsync(s => (int?)s.OnHand) ?? 0;

            if (totalAvailableStock < connection.RequestedQuantity)
            {
                throw new InvalidOperationException(
                    $"Cannot accept inquiry #{connection.RequestNumber}. Insufficient inventory across warehouses: " +
                    $"Customer requested {connection.RequestedQuantity} units of '{connection.Product?.Name ?? "product"}', " +
                    $"but total available stock across all warehouses is only {totalAvailableStock} units (Total On Hand: {totalOnHand}). " +
                    $"Please replenish warehouse inventory before accepting this inquiry.");
            }
        }

        var oldStatus = connection.Status;
        connection.Status = SalesConnectionStatus.Accepted;
        connection.AcceptedAtUtc = DateTime.UtcNow;
        connection.UpdatedAtUtc = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.Notes))
        {
            var stamp = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm UTC}] Rep Note: {dto.Notes.Trim()}";
            connection.RepNotes = string.IsNullOrWhiteSpace(connection.RepNotes)
                ? stamp
                : $"{connection.RepNotes}\n{stamp}";
        }

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(SalesConnectionRequest),
            EntityId = connection.Id,
            Action = "InquiryAccepted",
            UserId = userId,
            OldValueJson = oldStatus.ToString(),
            NewValueJson = SalesConnectionStatus.Accepted.ToString(),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToResponse(connection, connection.Customer, connection.Company, connection.Product, connection.SalesRepresentative.FullName, connection.SalesRepresentative.Email);
    }

    public async Task<SalesConnectionResponse> ContactCustomerAsync(int id, ContactCustomerRequest dto, int userId, Role role)
    {
        var connection = await _context.SalesConnectionRequests
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product).ThenInclude(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (connection == null)
        {
            throw new KeyNotFoundException($"Sales inquiry #{id} not found.");
        }

        if (role == Role.SalesRep && connection.SalesRepresentativeId != userId)
        {
            throw new UnauthorizedAccessException("You are only authorized to update inquiries assigned to you.");
        }

        if (connection.Status == SalesConnectionStatus.Rejected || connection.Status == SalesConnectionStatus.Closed)
        {
            throw new InvalidOperationException($"Cannot record contact for inquiry #{connection.RequestNumber} in '{connection.Status}' status.");
        }

        var oldStatus = connection.Status;
        if (connection.Status == SalesConnectionStatus.Pending || connection.Status == SalesConnectionStatus.Accepted)
        {
            connection.Status = SalesConnectionStatus.Contacted;
        }

        connection.ContactedAtUtc ??= DateTime.UtcNow;
        connection.UpdatedAtUtc = DateTime.UtcNow;

        var outcomeText = !string.IsNullOrWhiteSpace(dto.Outcome) ? $" (Outcome: {dto.Outcome.Trim()})" : "";
        var stamp = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm UTC}] Contacted via {dto.ContactMethod}{outcomeText}. Note: {dto.Notes.Trim()}";
        connection.RepNotes = string.IsNullOrWhiteSpace(connection.RepNotes)
            ? stamp
            : $"{connection.RepNotes}\n{stamp}";

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(SalesConnectionRequest),
            EntityId = connection.Id,
            Action = "CustomerContacted",
            UserId = userId,
            OldValueJson = oldStatus.ToString(),
            NewValueJson = connection.Status.ToString(),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToResponse(connection, connection.Customer, connection.Company, connection.Product, connection.SalesRepresentative.FullName, connection.SalesRepresentative.Email);
    }

    public async Task<SalesConnectionResponse> QualifyInquiryAsync(int id, QualifyInquiryRequest dto, int userId, Role role)
    {
        var connection = await _context.SalesConnectionRequests
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product).ThenInclude(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (connection == null)
        {
            throw new KeyNotFoundException($"Sales inquiry #{id} not found.");
        }

        if (role == Role.SalesRep && connection.SalesRepresentativeId != userId)
        {
            throw new UnauthorizedAccessException("You are only authorized to qualify inquiries assigned to you.");
        }

        if (connection.Status == SalesConnectionStatus.Rejected || connection.Status == SalesConnectionStatus.Closed)
        {
            throw new InvalidOperationException($"Cannot qualify inquiry #{connection.RequestNumber} in '{connection.Status}' status.");
        }

        var oldStatus = connection.Status;
        connection.Status = SalesConnectionStatus.Qualified;
        connection.QualifiedAtUtc = DateTime.UtcNow;
        connection.UpdatedAtUtc = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.RepNotes))
        {
            var stamp = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm UTC}] Qualification Note: {dto.RepNotes.Trim()}";
            connection.RepNotes = string.IsNullOrWhiteSpace(connection.RepNotes)
                ? stamp
                : $"{connection.RepNotes}\n{stamp}";
        }

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(SalesConnectionRequest),
            EntityId = connection.Id,
            Action = "InquiryQualified",
            UserId = userId,
            OldValueJson = oldStatus.ToString(),
            NewValueJson = SalesConnectionStatus.Qualified.ToString(),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToResponse(connection, connection.Customer, connection.Company, connection.Product, connection.SalesRepresentative.FullName, connection.SalesRepresentative.Email);
    }

    public async Task<SalesConnectionResponse> RejectInquiryAsync(int id, RejectInquiryRequest dto, int userId, Role role)
    {
        var connection = await _context.SalesConnectionRequests
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product).ThenInclude(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (connection == null)
        {
            throw new KeyNotFoundException($"Sales inquiry #{id} not found.");
        }

        if (role == Role.SalesRep && connection.SalesRepresentativeId != userId)
        {
            throw new UnauthorizedAccessException("You are only authorized to reject inquiries assigned to you.");
        }

        if (connection.Status == SalesConnectionStatus.Converted || connection.Status == SalesConnectionStatus.QuoteCreated)
        {
            throw new InvalidOperationException($"Cannot reject inquiry #{connection.RequestNumber} that has already reached '{connection.Status}'.");
        }

        var oldStatus = connection.Status;
        connection.Status = SalesConnectionStatus.Rejected;
        connection.RejectionReason = dto.RejectionReason.Trim();
        connection.ClosedAtUtc = DateTime.UtcNow;
        connection.UpdatedAtUtc = DateTime.UtcNow;

        var stamp = $"[{DateTime.UtcNow:yyyy-MM-dd HH:mm UTC}] Disqualified/Rejected. Reason: {dto.RejectionReason.Trim()}";
        connection.RepNotes = string.IsNullOrWhiteSpace(connection.RepNotes)
            ? stamp
            : $"{connection.RepNotes}\n{stamp}";

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(SalesConnectionRequest),
            EntityId = connection.Id,
            Action = "InquiryRejected",
            UserId = userId,
            OldValueJson = oldStatus.ToString(),
            NewValueJson = SalesConnectionStatus.Rejected.ToString(),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToResponse(connection, connection.Customer, connection.Company, connection.Product, connection.SalesRepresentative.FullName, connection.SalesRepresentative.Email);
    }

    public async Task<SalesConnectionResponse> GetRequestByIdAsync(int id, int userId, Role role, int? customerId)
    {
        var r = await _context.SalesConnectionRequests
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product).ThenInclude(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (r == null)
        {
            throw new KeyNotFoundException($"Sales connection request #{id} not found.");
        }

        // Customer check
        if (customerId.HasValue && r.CustomerId != customerId.Value)
        {
            throw new UnauthorizedAccessException("You do not have permission to view this connection request.");
        }

        // Rep isolation check
        if (role == Role.SalesRep && r.SalesRepresentativeId != userId)
        {
            throw new UnauthorizedAccessException("You can only access connection requests assigned to you.");
        }

        return MapToResponse(r, r.Customer, r.Company, r.Product, r.SalesRepresentative.FullName, r.SalesRepresentative.Email);
    }

    public async Task<SalesConnectionResponse> UpdateStatusAsync(int id, UpdateSalesConnectionStatusRequest dto, int userId, Role role)
    {
        var connection = await _context.SalesConnectionRequests
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product).ThenInclude(p => p.InventoryStocks).ThenInclude(s => s.Warehouse)
            .Include(r => r.SalesRepresentative)
            .Include(r => r.Quotation)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (connection == null)
        {
            throw new KeyNotFoundException($"Sales connection request #{id} not found.");
        }

        if (role == Role.SalesRep && connection.SalesRepresentativeId != userId)
        {
            throw new UnauthorizedAccessException("You are only authorized to update connection requests assigned to you.");
        }

        var oldStatus = connection.Status;
        connection.Status = dto.Status;
        connection.UpdatedAtUtc = DateTime.UtcNow;

        if (!string.IsNullOrWhiteSpace(dto.RepNotes))
        {
            connection.RepNotes = dto.RepNotes;
        }

        if (!string.IsNullOrWhiteSpace(dto.RejectionReason))
        {
            connection.RejectionReason = dto.RejectionReason;
        }

        switch (dto.Status)
        {
            case SalesConnectionStatus.Contacted when !connection.ContactedAtUtc.HasValue:
                connection.ContactedAtUtc = DateTime.UtcNow;
                break;
            case SalesConnectionStatus.Qualified when !connection.QualifiedAtUtc.HasValue:
                connection.QualifiedAtUtc = DateTime.UtcNow;
                break;
            case SalesConnectionStatus.Rejected:
            case SalesConnectionStatus.Closed:
                connection.ClosedAtUtc ??= DateTime.UtcNow;
                break;
        }

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(SalesConnectionRequest),
            EntityId = connection.Id,
            Action = "SalesConnectionStatusUpdated",
            UserId = userId,
            OldValueJson = oldStatus.ToString(),
            NewValueJson = dto.Status.ToString(),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return MapToResponse(connection, connection.Customer, connection.Company, connection.Product, connection.SalesRepresentative.FullName, connection.SalesRepresentative.Email);
    }

    public async Task<CreateQuoteFromConnectionResponse> CreateQuoteFromConnectionAsync(int id, int userId, Role role)
    {
        var connection = await _context.SalesConnectionRequests
            .Include(r => r.Customer).ThenInclude(c => c.Tier)
            .Include(r => r.Product)
            .Include(r => r.Company)
            .Include(r => r.SalesRepresentative)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (connection == null)
        {
            throw new KeyNotFoundException($"Sales connection request #{id} not found.");
        }

        if (role == Role.SalesRep && connection.SalesRepresentativeId != userId)
        {
            throw new UnauthorizedAccessException("You can only generate quotations for your assigned connection inquiries.");
        }

        if (connection.QuotationId.HasValue)
        {
            var existingQuote = await _context.Quotations.FindAsync(connection.QuotationId.Value);
            if (existingQuote != null)
            {
                if (connection.Status != SalesConnectionStatus.QuoteCreated)
                {
                    connection.Status = SalesConnectionStatus.QuoteCreated;
                    await _context.SaveChangesAsync();
                }

                return new CreateQuoteFromConnectionResponse
                {
                    SalesConnectionId = connection.Id,
                    QuotationId = existingQuote.Id,
                    QuotationNumber = existingQuote.QuotationNumber,
                    GrandTotal = existingQuote.GrandTotal,
                    CurrencyCode = existingQuote.CurrencyCode
                };
            }
        }

        // Warehouse Stock Sufficiency Governance Check: Physical goods require warehouse inventory
        bool isPhysical = IsPhysicalProduct(connection.Product);
        if (isPhysical)
        {
            var totalAvailableStock = await _context.InventoryStocks
                .Where(s => s.ProductId == connection.ProductId && s.Warehouse.IsActive)
                .SumAsync(s => (int?)(s.OnHand - s.Reserved)) ?? 0;

            if (totalAvailableStock < connection.RequestedQuantity)
            {
                throw new InvalidOperationException(
                    $"Cannot generate quotation for inquiry #{connection.RequestNumber}. Insufficient inventory across warehouses: " +
                    $"Customer requested {connection.RequestedQuantity} units of '{connection.Product?.Name ?? "product"}', " +
                    $"but total available stock across all warehouses is only {totalAvailableStock} units.");
            }
        }

        decimal tierDiscount = connection.Customer?.Tier?.MaxDiscountPercent ?? 5.00m;
        string tierName = connection.Customer?.Tier?.Name ?? "Bronze";

        // Build CreateQuotationRequest
        var createQuoteReq = new CreateQuotationRequest
        {
            CustomerId = connection.CustomerId,
            CurrencyCode = connection.Customer?.CurrencyCode ?? "INR",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(30),
            InquiryRequestNumber = connection.RequestNumber,
            Notes = $"Generated from Inquiry #{connection.RequestNumber} ({connection.Company.Name} - {connection.Product.Name}). Customer {tierName} Tier Advantage ({tierDiscount}% discount pre-applied). Note: {connection.CustomerMessage}",
            Lines = new List<AddLineRequest>
            {
                new()
                {
                    ProductId = connection.ProductId,
                    Quantity = connection.RequestedQuantity > 0 ? connection.RequestedQuantity : 1,
                    UnitPrice = connection.Product.BasePrice,
                    DiscountPercent = tierDiscount
                }
            }
        };

        // Use the existing quotation engine workflow via IQuotationService
        var quoteDetail = await _quotationService.CreateQuotationAsync(createQuoteReq, connection.SalesRepresentativeId);

        // Update SalesConnectionRequest with generated Quotation
        connection.QuotationId = quoteDetail.Id;
        connection.Status = SalesConnectionStatus.QuoteCreated;
        connection.QuoteCreatedAtUtc = DateTime.UtcNow;
        connection.UpdatedAtUtc = DateTime.UtcNow;

        _context.AuditLogs.Add(new AuditLog
        {
            EntityName = nameof(SalesConnectionRequest),
            EntityId = connection.Id,
            Action = "QuoteGeneratedFromConnection",
            UserId = userId,
            OldValueJson = null,
            NewValueJson = System.Text.Json.JsonSerializer.Serialize(new
            {
                connectionId = connection.Id,
                quotationId = quoteDetail.Id,
                quotationNumber = quoteDetail.QuotationNumber
            }),
            CreatedAtUtc = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();

        return new CreateQuoteFromConnectionResponse
        {
            SalesConnectionId = connection.Id,
            QuotationId = quoteDetail.Id,
            QuotationNumber = quoteDetail.QuotationNumber,
            GrandTotal = quoteDetail.GrandTotal,
            CurrencyCode = quoteDetail.CurrencyCode
        };
    }

    // ─── Admin Company Operations ─────────────────────────────
    public async Task<List<CompanyDto>> GetAllCompaniesAdminAsync()
    {
        return await _context.Companies
            .Select(c => new CompanyDto
            {
                Id = c.Id,
                Name = c.Name,
                Code = c.Code,
                Description = c.Description,
                Website = c.Website,
                LogoUrl = c.LogoUrl,
                ContactEmail = c.ContactEmail,
                ContactPhone = c.ContactPhone,
                IsActive = c.IsActive,
                ProductCount = c.Products.Count,
                ActiveAssignmentsCount = c.SalesAssignments.Count(a => a.IsActive),
                CreatedAtUtc = c.CreatedAtUtc
            })
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<CompanyDto> CreateCompanyAsync(CreateCompanyRequest dto)
    {
        var existing = await _context.Companies.FirstOrDefaultAsync(c => c.Code.ToUpper() == dto.Code.Trim().ToUpper());
        if (existing != null)
        {
            throw new InvalidOperationException($"A company with code '{dto.Code}' already exists.");
        }

        var company = new Company
        {
            Name = dto.Name.Trim(),
            Code = dto.Code.Trim().ToUpper(),
            Description = dto.Description,
            Website = dto.Website,
            LogoUrl = dto.LogoUrl,
            ContactEmail = dto.ContactEmail,
            ContactPhone = dto.ContactPhone,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.Companies.Add(company);
        await _context.SaveChangesAsync();

        return new CompanyDto
        {
            Id = company.Id,
            Name = company.Name,
            Code = company.Code,
            Description = company.Description,
            Website = company.Website,
            LogoUrl = company.LogoUrl,
            ContactEmail = company.ContactEmail,
            ContactPhone = company.ContactPhone,
            IsActive = company.IsActive,
            ProductCount = 0,
            ActiveAssignmentsCount = 0,
            CreatedAtUtc = company.CreatedAtUtc
        };
    }

    public async Task<CompanyDto> UpdateCompanyAsync(int id, UpdateCompanyRequest dto)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company == null)
        {
            throw new KeyNotFoundException($"Company #{id} not found.");
        }

        company.Name = dto.Name.Trim();
        company.Description = dto.Description;
        company.Website = dto.Website;
        company.LogoUrl = dto.LogoUrl;
        company.ContactEmail = dto.ContactEmail;
        company.ContactPhone = dto.ContactPhone;
        company.IsActive = dto.IsActive;
        company.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new CompanyDto
        {
            Id = company.Id,
            Name = company.Name,
            Code = company.Code,
            Description = company.Description,
            Website = company.Website,
            LogoUrl = company.LogoUrl,
            ContactEmail = company.ContactEmail,
            ContactPhone = company.ContactPhone,
            IsActive = company.IsActive,
            ProductCount = await _context.Products.CountAsync(p => p.CompanyId == company.Id),
            ActiveAssignmentsCount = await _context.SalesAssignments.CountAsync(a => a.CompanyId == company.Id && a.IsActive),
            CreatedAtUtc = company.CreatedAtUtc
        };
    }

    public async Task<bool> DeleteCompanyAsync(int id)
    {
        var company = await _context.Companies.FindAsync(id);
        if (company == null) return false;

        // Soft delete if related products exist
        var hasProducts = await _context.Products.AnyAsync(p => p.CompanyId == id);
        if (hasProducts)
        {
            company.IsActive = false;
            company.UpdatedAtUtc = DateTime.UtcNow;
        }
        else
        {
            _context.Companies.Remove(company);
        }

        await _context.SaveChangesAsync();
        return true;
    }

    // ─── Admin Sales Assignment Operations ───────────────────
    public async Task<List<SalesAssignmentDto>> GetSalesAssignmentsAsync(int? companyId = null)
    {
        var query = _context.SalesAssignments
            .Include(a => a.Company)
            .Include(a => a.SalesRepresentative)
            .Include(a => a.Product)
            .Include(a => a.Category)
            .Include(a => a.Customer)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            query = query.Where(a => a.CompanyId == companyId.Value);
        }

        return await query
            .OrderByDescending(a => a.Priority)
            .ThenBy(a => a.Id)
            .Select(a => new SalesAssignmentDto
            {
                Id = a.Id,
                CompanyId = a.CompanyId,
                CompanyName = a.Company.Name,
                SalesRepresentativeId = a.SalesRepresentativeId,
                SalesRepName = a.SalesRepresentative.FullName,
                SalesRepEmail = a.SalesRepresentative.Email,
                ProductId = a.ProductId,
                ProductName = a.Product != null ? a.Product.Name : null,
                CategoryId = a.CategoryId,
                CategoryName = a.Category != null ? a.Category.Name : null,
                CustomerId = a.CustomerId,
                CustomerName = a.Customer != null ? a.Customer.Name : null,
                IsDefault = a.IsDefault,
                Priority = a.Priority,
                Notes = a.Notes,
                IsActive = a.IsActive,
                CreatedAtUtc = a.CreatedAtUtc
            })
            .ToListAsync();
    }

    public async Task<SalesAssignmentDto> CreateSalesAssignmentAsync(CreateSalesAssignmentRequest dto)
    {
        var company = await _context.Companies.FindAsync(dto.CompanyId);
        if (company == null) throw new KeyNotFoundException("Company not found.");

        var rep = await _context.Users.FindAsync(dto.SalesRepresentativeId);
        if (rep == null) throw new KeyNotFoundException("Sales representative not found.");

        var assignment = new SalesAssignment
        {
            CompanyId = dto.CompanyId,
            SalesRepresentativeId = dto.SalesRepresentativeId,
            ProductId = dto.ProductId,
            CategoryId = dto.CategoryId,
            CustomerId = dto.CustomerId,
            IsDefault = dto.IsDefault,
            Priority = dto.Priority,
            Notes = dto.Notes,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.SalesAssignments.Add(assignment);
        await _context.SaveChangesAsync();

        return new SalesAssignmentDto
        {
            Id = assignment.Id,
            CompanyId = assignment.CompanyId,
            CompanyName = company.Name,
            SalesRepresentativeId = assignment.SalesRepresentativeId,
            SalesRepName = rep.FullName,
            SalesRepEmail = rep.Email,
            ProductId = assignment.ProductId,
            CategoryId = assignment.CategoryId,
            CustomerId = assignment.CustomerId,
            IsDefault = assignment.IsDefault,
            Priority = assignment.Priority,
            Notes = assignment.Notes,
            IsActive = assignment.IsActive,
            CreatedAtUtc = assignment.CreatedAtUtc
        };
    }

    public async Task<SalesAssignmentDto> UpdateSalesAssignmentAsync(int id, UpdateSalesAssignmentRequest dto)
    {
        var assignment = await _context.SalesAssignments
            .Include(a => a.Company)
            .Include(a => a.SalesRepresentative)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (assignment == null) throw new KeyNotFoundException("Assignment not found.");

        assignment.ProductId = dto.ProductId;
        assignment.CategoryId = dto.CategoryId;
        assignment.CustomerId = dto.CustomerId;
        assignment.IsDefault = dto.IsDefault;
        assignment.Priority = dto.Priority;
        assignment.Notes = dto.Notes;
        assignment.IsActive = dto.IsActive;
        assignment.UpdatedAtUtc = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new SalesAssignmentDto
        {
            Id = assignment.Id,
            CompanyId = assignment.CompanyId,
            CompanyName = assignment.Company.Name,
            SalesRepresentativeId = assignment.SalesRepresentativeId,
            SalesRepName = assignment.SalesRepresentative.FullName,
            SalesRepEmail = assignment.SalesRepresentative.Email,
            ProductId = assignment.ProductId,
            CategoryId = assignment.CategoryId,
            CustomerId = assignment.CustomerId,
            IsDefault = assignment.IsDefault,
            Priority = assignment.Priority,
            Notes = assignment.Notes,
            IsActive = assignment.IsActive,
            CreatedAtUtc = assignment.CreatedAtUtc
        };
    }

    public async Task<bool> DeleteSalesAssignmentAsync(int id)
    {
        var assignment = await _context.SalesAssignments.FindAsync(id);
        if (assignment == null) return false;

        _context.SalesAssignments.Remove(assignment);
        await _context.SaveChangesAsync();
        return true;
    }

    // ─── Helpers ──────────────────────────────────────────────
    private static bool IsPhysicalProduct(Product? p)
    {
        if (p == null) return false;
        if (p.ProductType == ProductType.Subscription) return false;
        if (p.SKU.StartsWith("SRV-", StringComparison.OrdinalIgnoreCase)) return false;
        if (p.SKU.StartsWith("SVC-", StringComparison.OrdinalIgnoreCase)) return false;
        if (p.SKU.StartsWith("SUB-", StringComparison.OrdinalIgnoreCase)) return false;
        if (string.Equals(p.Unit, "Service", StringComparison.OrdinalIgnoreCase)) return false;
        if (string.Equals(p.Unit, "Year", StringComparison.OrdinalIgnoreCase)) return false;
        if (string.Equals(p.Unit, "Month", StringComparison.OrdinalIgnoreCase)) return false;
        if (string.Equals(p.Unit, "Batch", StringComparison.OrdinalIgnoreCase)) return false;
        return true;
    }

    private static SalesConnectionResponse MapToResponse(
        SalesConnectionRequest r,
        Customer customer,
        Company company,
        Product product,
        string repName,
        string repEmail)
    {
        var activeStocks = product?.InventoryStocks?
            .Where(s => s.Warehouse == null || s.Warehouse.IsActive)
            .ToList() ?? new List<InventoryStock>();

        bool isPhysical = IsPhysicalProduct(product);
        int totalAvailable = isPhysical ? activeStocks.Sum(s => s.OnHand - s.Reserved) : 9999;
        int totalOnHand = isPhysical ? activeStocks.Sum(s => s.OnHand) : 9999;
        bool isSufficient = !isPhysical || totalAvailable >= r.RequestedQuantity;

        return new SalesConnectionResponse
        {
            Id = r.Id,
            RequestNumber = r.RequestNumber,
            CustomerId = r.CustomerId,
            CustomerName = customer.Name,
            CustomerEmail = customer.Email,
            CustomerTierName = customer.Tier != null ? customer.Tier.Name : "Bronze",
            TierDiscountPercent = customer.Tier != null ? customer.Tier.MaxDiscountPercent : 5.00m,
            CompanyId = r.CompanyId,
            CompanyName = company.Name,
            ProductId = r.ProductId,
            ProductName = product.Name,
            ProductSku = product.SKU,
            BasePrice = product.BasePrice,
            SalesRepresentativeId = r.SalesRepresentativeId,
            SalesRepName = repName,
            SalesRepEmail = repEmail,
            Status = r.Status.ToString(),
            RequestedQuantity = r.RequestedQuantity,
            CustomerMessage = r.CustomerMessage,
            PreferredContactMethod = r.PreferredContactMethod,
            ResolutionReason = r.ResolutionReason,
            QuotationId = r.QuotationId,
            QuotationNumber = r.Quotation != null ? r.Quotation.QuotationNumber : null,
            RepNotes = r.RepNotes,
            RejectionReason = r.RejectionReason,
            TotalAvailableStock = totalAvailable,
            TotalOnHandStock = totalOnHand,
            IsStockSufficient = isSufficient,
            WarehouseStocks = activeStocks.Select(s => new InquiryWarehouseStockDto
            {
                WarehouseId = s.WarehouseId,
                WarehouseName = s.Warehouse != null ? s.Warehouse.Name : $"Warehouse #{s.WarehouseId}",
                OnHand = s.OnHand,
                Reserved = s.Reserved
            }).ToList(),
            AcceptedAtUtc = r.AcceptedAtUtc,
            ContactedAtUtc = r.ContactedAtUtc,
            QualifiedAtUtc = r.QualifiedAtUtc,
            QuoteCreatedAtUtc = r.QuoteCreatedAtUtc,
            ClosedAtUtc = r.ClosedAtUtc,
            CreatedAtUtc = r.CreatedAtUtc
        };
    }

    private static System.Linq.Expressions.Expression<Func<SalesConnectionRequest, SalesConnectionResponse>> MapToResponseExpr =>
        r => new SalesConnectionResponse
        {
            Id = r.Id,
            RequestNumber = r.RequestNumber,
            CustomerId = r.CustomerId,
            CustomerName = r.Customer.Name,
            CustomerEmail = r.Customer.Email,
            CustomerTierName = r.Customer.Tier != null ? r.Customer.Tier.Name : "Bronze",
            TierDiscountPercent = r.Customer.Tier != null ? r.Customer.Tier.MaxDiscountPercent : 5.00m,
            CompanyId = r.CompanyId,
            CompanyName = r.Company.Name,
            ProductId = r.ProductId,
            ProductName = r.Product.Name,
            ProductSku = r.Product.SKU,
            BasePrice = r.Product.BasePrice,
            SalesRepresentativeId = r.SalesRepresentativeId,
            SalesRepName = r.SalesRepresentative.FullName,
            SalesRepEmail = r.SalesRepresentative.Email,
            Status = r.Status.ToString(),
            RequestedQuantity = r.RequestedQuantity,
            CustomerMessage = r.CustomerMessage,
            PreferredContactMethod = r.PreferredContactMethod,
            ResolutionReason = r.ResolutionReason,
            QuotationId = r.QuotationId,
            QuotationNumber = r.Quotation != null ? r.Quotation.QuotationNumber : null,
            RepNotes = r.RepNotes,
            RejectionReason = r.RejectionReason,
            TotalAvailableStock = (r.Product.ProductType == ProductType.Subscription ||
                r.Product.SKU.StartsWith("SRV-") ||
                r.Product.SKU.StartsWith("SVC-") ||
                r.Product.SKU.StartsWith("SUB-") ||
                r.Product.Unit == "Service" ||
                r.Product.Unit == "Year" ||
                r.Product.Unit == "Batch")
                ? 9999
                : (r.Product.InventoryStocks.Where(s => s.Warehouse.IsActive).Sum(s => (int?)(s.OnHand - s.Reserved)) ?? 0),
            TotalOnHandStock = (r.Product.ProductType == ProductType.Subscription ||
                r.Product.SKU.StartsWith("SRV-") ||
                r.Product.SKU.StartsWith("SVC-") ||
                r.Product.SKU.StartsWith("SUB-") ||
                r.Product.Unit == "Service" ||
                r.Product.Unit == "Year" ||
                r.Product.Unit == "Batch")
                ? 9999
                : (r.Product.InventoryStocks.Where(s => s.Warehouse.IsActive).Sum(s => (int?)s.OnHand) ?? 0),
            IsStockSufficient = (r.Product.ProductType == ProductType.Subscription ||
                r.Product.SKU.StartsWith("SRV-") ||
                r.Product.SKU.StartsWith("SVC-") ||
                r.Product.SKU.StartsWith("SUB-") ||
                r.Product.Unit == "Service" ||
                r.Product.Unit == "Year" ||
                r.Product.Unit == "Batch") ||
                ((r.Product.InventoryStocks.Where(s => s.Warehouse.IsActive).Sum(s => (int?)(s.OnHand - s.Reserved)) ?? 0) >= r.RequestedQuantity),
            WarehouseStocks = r.Product.InventoryStocks.Where(s => s.Warehouse.IsActive).Select(s => new InquiryWarehouseStockDto
            {
                WarehouseId = s.WarehouseId,
                WarehouseName = s.Warehouse.Name,
                OnHand = s.OnHand,
                Reserved = s.Reserved
            }).ToList(),
            AcceptedAtUtc = r.AcceptedAtUtc,
            ContactedAtUtc = r.ContactedAtUtc,
            QualifiedAtUtc = r.QualifiedAtUtc,
            QuoteCreatedAtUtc = r.QuoteCreatedAtUtc,
            ClosedAtUtc = r.ClosedAtUtc,
            CreatedAtUtc = r.CreatedAtUtc
        };
}
