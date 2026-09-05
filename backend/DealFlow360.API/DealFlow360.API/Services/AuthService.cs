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
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request);
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

        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is disabled. Please contact your administrator.");
        }

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return await GenerateAuthResponseAsync(user);
    }

    public async Task<AuthResponse> SignupAsync(SignupRequest request)
    {
        // 1. Validation
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Full name is required.");
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Email is required.");
        }

        var emailNormalized = request.Email.Trim().ToLower();
        if (!System.Text.RegularExpressions.Regex.IsMatch(emailNormalized, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
        {
            throw new ArgumentException("Please provide a valid email address.");
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
        {
            throw new ArgumentException("Password must be at least 8 characters long.");
        }

        var hasUpper = request.Password.Any(char.IsUpper);
        var hasLower = request.Password.Any(char.IsLower);
        var hasDigit = request.Password.Any(char.IsDigit);
        if (!hasUpper || !hasLower || !hasDigit)
        {
            throw new ArgumentException("Password must contain at least one uppercase letter, one lowercase letter, and one number.");
        }

        if (!string.Equals(request.Password, request.ConfirmPassword))
        {
            throw new ArgumentException("Passwords do not match.");
        }

        // 2. Email Uniqueness Check
        var existing = await _context.Users.AnyAsync(u => u.Email.ToLower() == emailNormalized);
        if (existing)
        {
            throw new InvalidOperationException("An account with this email already exists.");
        }

        // 3. Execution Strategy + Transaction
        var strategy = _context.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            using var transaction = await _context.Database.BeginTransactionAsync();

            // Find default customer tier (Bronze or lowest discount tier)
            var defaultTier = await _context.CustomerTiers
                .OrderBy(t => t.MaxDiscountPercent)
                .FirstOrDefaultAsync();

            if (defaultTier == null)
            {
                defaultTier = new CustomerTier
                {
                    Name = "Standard",
                    MaxDiscountPercent = 5.0m,
                    CreatedAtUtc = DateTime.UtcNow
                };
                _context.CustomerTiers.Add(defaultTier);
                await _context.SaveChangesAsync();
            }

            var companyName = !string.IsNullOrWhiteSpace(request.CompanyName)
                ? request.CompanyName.Trim()
                : request.FullName.Trim();

            // Create Customer record
            var customer = new Customer
            {
                Name = companyName,
                Email = emailNormalized,
                Phone = request.Phone?.Trim(),
                TierId = defaultTier.Id,
                CurrencyCode = "USD",
                IsActive = true,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();

            // Create User record - STRICTLY ALWAYS Role.Customer
            var user = new User
            {
                FullName = request.FullName.Trim(),
                Email = emailNormalized,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                Role = Role.Customer, // STRICT: Customer self-signup can ONLY create Role.Customer
                CustomerId = customer.Id,
                IsActive = true,
                MustChangePassword = false, // Customer entered their own password
                CreatedAtUtc = DateTime.UtcNow,
                UpdatedAtUtc = DateTime.UtcNow
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            user.Customer = customer;
            return await GenerateAuthResponseAsync(user);
        });
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
        var user = await _context.Users
            .Include(u => u.Customer)
            .Include(u => u.SalesTeam)
            .FirstOrDefaultAsync(u => u.Id == userId);
        if (user == null) throw new KeyNotFoundException("User not found.");

        return new MeResponse
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role.ToString(),
            SalesTeamId = user.SalesTeamId,
            TeamName = user.SalesTeam?.Name,
            CustomerId = user.CustomerId,
            CustomerName = user.Customer?.Name,
            IsActive = user.IsActive,
            MustChangePassword = user.MustChangePassword,
            LastLoginAtUtc = user.LastLoginAtUtc
        };
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await _context.Users.FindAsync(userId);
        if (user == null) throw new KeyNotFoundException("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Current password is incorrect.");
        }

        if (string.IsNullOrWhiteSpace(request.NewPassword) || request.NewPassword.Length < 8)
        {
            throw new ArgumentException("New password must be at least 8 characters long.");
        }

        var hasUpper = request.NewPassword.Any(char.IsUpper);
        var hasLower = request.NewPassword.Any(char.IsLower);
        var hasDigit = request.NewPassword.Any(char.IsDigit);
        if (!hasUpper || !hasLower || !hasDigit)
        {
            throw new ArgumentException("New password must contain uppercase, lowercase, and numeric characters.");
        }

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.MustChangePassword = false;
        user.UpdatedAtUtc = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();
    }

    private async Task<AuthResponse> GenerateAuthResponseAsync(User user)
    {
        if (user.Customer == null && user.CustomerId.HasValue)
        {
            user.Customer = await _context.Customers.FindAsync(user.CustomerId.Value);
        }

        if (user.SalesTeam == null && user.SalesTeamId.HasValue)
        {
            user.SalesTeam = await _context.SalesTeams.FindAsync(user.SalesTeamId.Value);
        }

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
                TeamName = user.SalesTeam?.Name,
                CustomerId = user.CustomerId,
                CustomerName = user.Customer?.Name,
                IsActive = user.IsActive,
                MustChangePassword = user.MustChangePassword,
                LastLoginAtUtc = user.LastLoginAtUtc
            }
        };
    }
}
