using DealFlow360.API.Data;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services.Engines;

public class RepResolutionResult
{
    public bool Found { get; set; }
    public int SalesRepresentativeId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? TeamName { get; set; }
    public string CompanyName { get; set; } = string.Empty;
    public string MatchReason { get; set; } = string.Empty;
    public string? Specialization { get; set; }
    public string? Phone { get; set; }
}

public interface ISalesRepresentativeResolutionEngine
{
    Task<RepResolutionResult> ResolveRepresentativeAsync(int? customerId, int companyId, int productId);
}

public class SalesRepresentativeResolutionEngine : ISalesRepresentativeResolutionEngine
{
    private readonly AppDbContext _context;

    public SalesRepresentativeResolutionEngine(AppDbContext context)
    {
        _context = context;
    }

    public async Task<RepResolutionResult> ResolveRepresentativeAsync(int? customerId, int companyId, int productId)
    {
        var company = await _context.Companies.FirstOrDefaultAsync(c => c.Id == companyId && c.IsActive);
        if (company == null)
        {
            return new RepResolutionResult
            {
                Found = false,
                MatchReason = "The specified company/brand is not recognized or active."
            };
        }

        var product = await _context.Products
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.Id == productId && p.IsActive);

        if (product == null)
        {
            return new RepResolutionResult
            {
                Found = false,
                MatchReason = "The specified product was not found in the active catalog."
            };
        }

        // Fetch active assignments for this company, eager loading SalesRep & Team
        var assignments = await _context.SalesAssignments
            .Where(sa => sa.CompanyId == companyId && sa.IsActive)
            .Include(sa => sa.SalesRepresentative)
                .ThenInclude(u => u.SalesTeam)
            .OrderByDescending(sa => sa.Priority)
            .ThenBy(sa => sa.Id)
            .ToListAsync();

        // Priority 1: Customer + Product match
        if (customerId.HasValue)
        {
            var matchP1 = assignments.FirstOrDefault(sa =>
                sa.CustomerId == customerId.Value &&
                sa.ProductId == productId &&
                sa.SalesRepresentative.IsActive);

            if (matchP1 != null)
            {
                return BuildResult(matchP1.SalesRepresentative, company.Name,
                    "Assigned account specialist for your organization and this specific product",
                    matchP1.Notes ?? "Dedicated Account & Product Specialist");
            }
        }

        // Priority 2: Customer + Company match
        if (customerId.HasValue)
        {
            var matchP2 = assignments.FirstOrDefault(sa =>
                sa.CustomerId == customerId.Value &&
                sa.ProductId == null &&
                sa.CategoryId == null &&
                sa.SalesRepresentative.IsActive);

            if (matchP2 != null)
            {
                return BuildResult(matchP2.SalesRepresentative, company.Name,
                    "Assigned account executive for your organization with this brand",
                    matchP2.Notes ?? "Dedicated Brand Account Executive");
            }
        }

        // Priority 3: Company + Product match
        var matchP3 = assignments.FirstOrDefault(sa =>
            sa.ProductId == productId &&
            sa.CustomerId == null &&
            sa.SalesRepresentative.IsActive);

        if (matchP3 != null)
        {
            return BuildResult(matchP3.SalesRepresentative, company.Name,
                $"Product line specialist for {product.Name}",
                matchP3.Notes ?? "Certified Product Line Specialist");
        }

        // Priority 4: Company + Category match
        var matchP4 = assignments.FirstOrDefault(sa =>
            sa.CategoryId == product.CategoryId &&
            sa.ProductId == null &&
            sa.CustomerId == null &&
            sa.SalesRepresentative.IsActive);

        if (matchP4 != null)
        {
            return BuildResult(matchP4.SalesRepresentative, company.Name,
                $"Category solution consultant for {product.Category.Name}",
                matchP4.Notes ?? $"{product.Category.Name} Solutions Consultant");
        }

        // Priority 5: Company Default representative
        var matchP5 = assignments.FirstOrDefault(sa =>
            sa.IsDefault &&
            sa.ProductId == null &&
            sa.CategoryId == null &&
            sa.CustomerId == null &&
            sa.SalesRepresentative.IsActive);

        if (matchP5 != null)
        {
            return BuildResult(matchP5.SalesRepresentative, company.Name,
                $"Default corporate representative for {company.Name}",
                matchP5.Notes ?? "Senior Commercial Sales Executive");
        }

        // Priority 6: Customer default assigned sales representative
        if (customerId.HasValue)
        {
            var customer = await _context.Customers
                .Include(c => c.AssignedSalesRep)
                    .ThenInclude(u => u!.SalesTeam)
                .FirstOrDefaultAsync(c => c.Id == customerId.Value);

            if (customer?.AssignedSalesRep != null && customer.AssignedSalesRep.IsActive)
            {
                return BuildResult(customer.AssignedSalesRep, company.Name,
                    "Your primary dedicated account manager",
                    "Primary Account Manager");
            }
        }

        // Priority 7: Active Sales Team / fallback representative
        var fallbackRep = await _context.Users
            .Include(u => u.SalesTeam)
            .Where(u => u.IsActive && (u.Role == Role.SalesRep || u.Role == Role.SalesManager))
            .OrderBy(u => u.Role == Role.SalesRep ? 0 : 1)
            .ThenBy(u => u.Id)
            .FirstOrDefaultAsync();

        if (fallbackRep != null)
        {
            return BuildResult(fallbackRep, company.Name,
                "Enterprise Commercial Sales Representative",
                "Commercial Sales Advisor");
        }

        return new RepResolutionResult
        {
            Found = false,
            CompanyName = company.Name,
            MatchReason = "No representative is currently assigned. Our operations desk will follow up promptly."
        };
    }

    private static RepResolutionResult BuildResult(User rep, string companyName, string reason, string specialization)
    {
        return new RepResolutionResult
        {
            Found = true,
            SalesRepresentativeId = rep.Id,
            FullName = rep.FullName,
            Email = rep.Email,
            Role = rep.Role.ToString(),
            TeamName = rep.SalesTeam?.Name ?? "Commercial Sales Team",
            CompanyName = companyName,
            MatchReason = reason,
            Specialization = specialization,
            Phone = "+91 (080) 4122-8900"
        };
    }
}
