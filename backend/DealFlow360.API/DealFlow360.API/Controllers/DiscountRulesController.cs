using DealFlow360.API.DTOs.DiscountRules;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "SalesManager,Admin")]
public class DiscountRulesController : ControllerBase
{
    private readonly IDiscountRuleService _discountRuleService;

    public DiscountRulesController(IDiscountRuleService discountRuleService)
    {
        _discountRuleService = discountRuleService;
    }

    [HttpGet]
    public async Task<IActionResult> GetDiscountRules()
    {
        var result = await _discountRuleService.GetDiscountRulesAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> CreateDiscountRule([FromBody] CreateDiscountRuleRequest request)
    {
        var result = await _discountRuleService.CreateDiscountRuleAsync(request);
        return Ok(result);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDiscountRule(int id, [FromBody] UpdateDiscountRuleRequest request)
    {
        var result = await _discountRuleService.UpdateDiscountRuleAsync(id, request);
        return Ok(result);
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteDiscountRule(int id)
    {
        await _discountRuleService.DeleteDiscountRuleAsync(id);
        return NoContent();
    }
}
