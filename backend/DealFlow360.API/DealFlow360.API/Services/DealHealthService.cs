using DealFlow360.API.Data;
using DealFlow360.API.DTOs.DealHealth;
using DealFlow360.API.Services.Engines;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IDealHealthService
{
    Task<DealHealthSummaryResponse> GetDealHealthSummaryAsync();
}

public class DealHealthService : IDealHealthService
{
    private readonly AppDbContext _context;
    private readonly IDealHealthEngine _dealHealthEngine;

    public DealHealthService(AppDbContext context, IDealHealthEngine dealHealthEngine)
    {
        _context = context;
        _dealHealthEngine = dealHealthEngine;
    }

    public async Task<DealHealthSummaryResponse> GetDealHealthSummaryAsync()
    {
        var activeQuotations = await _context.Quotations
            .Include(q => q.Customer).ThenInclude(c => c.Tier)
            .Include(q => q.SalesRep)
            .Include(q => q.ApprovalRequests)
            .ToListAsync();

        return _dealHealthEngine.EvaluateHealth(activeQuotations);
    }

}
