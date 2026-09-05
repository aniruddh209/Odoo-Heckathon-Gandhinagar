using DealFlow360.API.Data;
using DealFlow360.API.DTOs.DiscountRules;
using DealFlow360.API.Models;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IDiscountRuleService
{
    Task<List<DiscountRuleResponse>> GetDiscountRulesAsync();
    Task<DiscountRuleResponse> CreateDiscountRuleAsync(CreateDiscountRuleRequest request);
    Task<DiscountRuleResponse> UpdateDiscountRuleAsync(int id, UpdateDiscountRuleRequest request);
    Task DeleteDiscountRuleAsync(int id);
}

public class DiscountRuleService : IDiscountRuleService
{
    private readonly AppDbContext _context;

    public DiscountRuleService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<DiscountRuleResponse>> GetDiscountRulesAsync()
    {
        return await _context.DiscountRules
            .Include(r => r.Tier)
            .Include(r => r.Category)
            .OrderBy(r => r.Tier.Name)
            .Select(r => new DiscountRuleResponse
            {
                Id = r.Id,
                TierId = r.TierId,
                TierName = r.Tier.Name,
                CategoryId = r.CategoryId,
                CategoryName = r.Category != null ? r.Category.Name : null,
                MaxDiscountPercent = r.MaxDiscountPercent,
                ManagerThreshold = r.ManagerThreshold,
                FinanceThreshold = r.FinanceThreshold,
                IsActive = r.IsActive
            })
            .ToListAsync();
    }

    public async Task<DiscountRuleResponse> CreateDiscountRuleAsync(CreateDiscountRuleRequest request)
    {
        var rule = new DiscountRule
        {
            TierId = request.TierId,
            CategoryId = request.CategoryId,
            MaxDiscountPercent = request.MaxDiscountPercent,
            ManagerThreshold = request.ManagerThreshold,
            FinanceThreshold = request.FinanceThreshold,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.DiscountRules.Add(rule);
        await _context.SaveChangesAsync();

        return await GetRuleByIdAsync(rule.Id);
    }

    public async Task<DiscountRuleResponse> UpdateDiscountRuleAsync(int id, UpdateDiscountRuleRequest request)
    {
        var rule = await _context.DiscountRules.FindAsync(id);
        if (rule == null) throw new KeyNotFoundException($"Discount rule {id} not found.");

        rule.TierId = request.TierId;
        rule.CategoryId = request.CategoryId;
        rule.MaxDiscountPercent = request.MaxDiscountPercent;
        rule.ManagerThreshold = request.ManagerThreshold;
        rule.FinanceThreshold = request.FinanceThreshold;
        rule.IsActive = request.IsActive;
        rule.UpdatedAtUtc = DateTime.UtcNow;

        _context.DiscountRules.Update(rule);
        await _context.SaveChangesAsync();

        return await GetRuleByIdAsync(id);
    }

    public async Task DeleteDiscountRuleAsync(int id)
    {
        var rule = await _context.DiscountRules.FindAsync(id);
        if (rule != null)
        {
            _context.DiscountRules.Remove(rule);
            await _context.SaveChangesAsync();
        }
    }

    private async Task<DiscountRuleResponse> GetRuleByIdAsync(int id)
    {
        var r = await _context.DiscountRules
            .Include(x => x.Tier)
            .Include(x => x.Category)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (r == null) throw new KeyNotFoundException($"Discount rule {id} not found.");

        return new DiscountRuleResponse
        {
            Id = r.Id,
            TierId = r.TierId,
            TierName = r.Tier.Name,
            CategoryId = r.CategoryId,
            CategoryName = r.Category?.Name,
            MaxDiscountPercent = r.MaxDiscountPercent,
            ManagerThreshold = r.ManagerThreshold,
            FinanceThreshold = r.FinanceThreshold,
            IsActive = r.IsActive
        };
    }
}
