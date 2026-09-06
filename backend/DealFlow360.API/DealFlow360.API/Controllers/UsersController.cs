using System.Security.Claims;
using DealFlow360.API.DTOs.Users;
using DealFlow360.API.Models.Enums;
using DealFlow360.API.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace DealFlow360.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;

    public UsersController(IUserService userService)
    {
        _userService = userService;
    }

    private (int UserId, Role UserRole) GetCurrentIdentity()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        int.TryParse(idClaim, out var userId);

        var roleClaim = User.FindFirstValue(ClaimTypes.Role);
        Enum.TryParse<Role>(roleClaim, true, out var role);

        return (userId, role);
    }

    [HttpGet]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetUsers([FromQuery] string? role)
    {
        var (userId, userRole) = GetCurrentIdentity();
        var result = await _userService.GetUsersAsync(userId, userRole, role);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> GetUserById(int id)
    {
        var (userId, userRole) = GetCurrentIdentity();
        var result = await _userService.GetUserByIdAsync(id, userId, userRole);
        return Ok(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,SalesManager")]
    public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
    {
        var (userId, userRole) = GetCurrentIdentity();
        var result = await _userService.CreateUserAsync(userId, userRole, request);
        return CreatedAtAction(nameof(GetUserById), new { id = result.User.Id }, result);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var (_, userRole) = GetCurrentIdentity();
        var result = await _userService.UpdateUserAsync(id, request, userRole);
        return Ok(result);
    }

    [HttpPost("{id}/toggle-status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ToggleUserStatus(int id)
    {
        var (_, userRole) = GetCurrentIdentity();
        var result = await _userService.ToggleUserStatusAsync(id, userRole);
        return Ok(result);
    }
}
