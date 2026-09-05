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
    Task<SalesConnectionResponse> GetRequestByIdAsync(int id, int userId, Role role, int? customerId);
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
        var query = _context.Companies
            .Where(c => c.IsActive)
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
                ProductCount = c.Products.Count(p => p.IsActive),
                ActiveAssignmentsCount = c.SalesAssignments.Count(a => a.IsActive),
                CreatedAtUtc = c.CreatedAtUtc
            })
            .OrderBy(c => c.Name)
            .ToListAsync();
    }

    public async Task<List<ProductCatalogItemDto>> GetAvailableProductsAsync(int? companyId = null, int? categoryId = null, string? search = null)
    {
        var query = _context.Products
            .Include(p => p.Category)
            .Include(p => p.Company)
            .Where(p => p.IsActive)
            .AsNoTracking();

        if (companyId.HasValue)
        {
            query = query.Where(p => p.CompanyId == companyId.Value);
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
                CompanyId = p.CompanyId,
                CompanyName = p.Company != null ? p.Company.Name : "Universal",
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
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null || !customer.IsActive)
        {
            throw new KeyNotFoundException("Active customer organization not found.");
        }

        var company = await _context.Companies.FindAsync(dto.CompanyId);
        if (company == null || !company.IsActive)
        {
            throw new KeyNotFoundException("Selected company/brand is not recognized or active.");
        }

        var product = await _context.Products.FindAsync(dto.ProductId);
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
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product)
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
            .Include(r => r.Customer)
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

        if (!string.IsNullOrWhiteSpace(status) && Enum.TryParse<SalesConnectionStatus>(status, true, out var parsedStatus))
        {
            query = query.Where(r => r.Status == parsedStatus);
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

    public async Task<SalesConnectionResponse> GetRequestByIdAsync(int id, int userId, Role role, int? customerId)
    {
        var r = await _context.SalesConnectionRequests
            .Include(r => r.Customer)
            .Include(r => r.Company)
            .Include(r => r.Product)
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
            .Include(r => r.Product)
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
            .Include(r => r.Customer)
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

        // Build CreateQuotationRequest
        var createQuoteReq = new CreateQuotationRequest
        {
            CustomerId = connection.CustomerId,
            CurrencyCode = connection.Customer.CurrencyCode ?? "INR",
            ExpectedCloseDate = DateTime.UtcNow.AddDays(30),
            Notes = $"Generated from Inquiry #{connection.RequestNumber} ({connection.Company.Name} - {connection.Product.Name}). Customer note: {connection.CustomerMessage}",
            Lines = new List<AddLineRequest>
            {
                new()
                {
                    ProductId = connection.ProductId,
                    Quantity = connection.RequestedQuantity > 0 ? connection.RequestedQuantity : 1,
                    UnitPrice = connection.Product.BasePrice,
                    DiscountPercent = 0.00m
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
    private static SalesConnectionResponse MapToResponse(
        SalesConnectionRequest r,
        Customer customer,
        Company company,
        Product product,
        string repName,
        string repEmail)
    {
        return new SalesConnectionResponse
        {
            Id = r.Id,
            RequestNumber = r.RequestNumber,
            CustomerId = r.CustomerId,
            CustomerName = customer.Name,
            CustomerEmail = customer.Email,
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
            ContactedAtUtc = r.ContactedAtUtc,
            QualifiedAtUtc = r.QualifiedAtUtc,
            QuoteCreatedAtUtc = r.QuoteCreatedAtUtc,
            ClosedAtUtc = r.ClosedAtUtc,
            CreatedAtUtc = r.CreatedAtUtc
        };
}
