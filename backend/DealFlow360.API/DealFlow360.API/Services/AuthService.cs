using BCrypt.Net;
using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Auth;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IAuthService
{
    Task<AuthResponse> LoginAsync(LoginRequest request);
    Task<AuthResponse> SignupAsync(SignupRequest request);
    Task<AuthResponse> RefreshTokenAsync(string refreshToken);
    Task<MeResponse> GetMeAsync(int userId);
}

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;

    public AuthService(AppDbContext context, IJwtService jwtService)
    {
        _context = context;
        _jwtService = jwtService;
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower());

        if (user == null || !user.IsActive)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> SignupAsync(SignupRequest request)
    {
        var existing = await _context.Users.AnyAsync(u => u.Email.ToLower() == request.Email.ToLower());
        if (existing)
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = Role.SalesRep,
            IsActive = true,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> RefreshTokenAsync(string token)
    {
        var refreshToken = await _context.RefreshTokens
            .Include(r => r.User)
            .FirstOrDefaultAsync(r => r.Token == token);

        if (refreshToken == null || refreshToken.ExpiresAtUtc < DateTime.UtcNow || refreshToken.RevokedAtUtc.HasValue)
        {
            throw new UnauthorizedAccessException("Invalid or expired refresh token.");
        }

        // Revoke old refresh token
        refreshToken.RevokedAtUtc = DateTime.UtcNow;
        _context.RefreshTokens.Update(refreshToken);

        return await GenerateAuthResponseAsync(refreshToken.User);
    }

    public async Task<MeResponse> GetMeAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException("User not found.");

        return new MeResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            SalesTeamId = user.SalesTeamId,
            CustomerId = user.CustomerId,
            IsActive = user.IsActive
        };
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user)
    {
        var accessToken = _jwtService.GenerateToken(user);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = Guid.NewGuid().ToString("N") + Guid.NewGuid().ToString("N"),
            ExpiresAtUtc = DateTime.UtcNow.AddDays(7),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.RefreshTokens.Add(refreshToken);
        await _context.SaveChangesAsync();

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
            ExpiresAtUtc = DateTime.UtcNow.AddHours(8),
            User = new MeResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = user.Role.ToString(),
                SalesTeamId = user.SalesTeamId,
                CustomerId = user.CustomerId,
                IsActive = user.IsActive
            }
        };
    }
}
