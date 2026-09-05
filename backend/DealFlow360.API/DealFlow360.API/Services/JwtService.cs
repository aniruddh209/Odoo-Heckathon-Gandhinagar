using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using DealFlow360.API.Models;
using Microsoft.IdentityModel.Tokens;

namespace DealFlow360.API.Services;

public interface IJwtService
{
    string GenerateToken(User user);
    string GeneratePortalToken(int quotationId, string customerEmail);
    (bool IsValid, int QuotationId, string CustomerEmail) ValidatePortalToken(string token);
}

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateToken(User user)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "DealFlow360SuperSecretMasterKeyThatIsAtLeast32BytesLongForHS256Encryption!";
        var issuer = _configuration["Jwt:Issuer"] ?? "DealFlow360API";
        var audience = _configuration["Jwt:Audience"] ?? "DealFlow360App";
        var expiryMinutes = int.Parse(_configuration["Jwt:ExpiryMinutes"] ?? "480");

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Name, user.FullName),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        if (user.SalesTeamId.HasValue)
        {
            claims.Add(new Claim("SalesTeamId", user.SalesTeamId.Value.ToString()));
        }

        if (user.CustomerId.HasValue)
        {
            claims.Add(new Claim("CustomerId", user.CustomerId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GeneratePortalToken(int quotationId, string customerEmail)
    {
        var secretKey = _configuration["Jwt:SecretKey"] ?? "DealFlow360SuperSecretMasterKeyThatIsAtLeast32BytesLongForHS256Encryption!";
        var payload = $"{quotationId}:{customerEmail.ToLowerInvariant()}:{DateTime.UtcNow.AddDays(14).Ticks}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
        var hash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

        var rawToken = $"{payload}:{hash}";
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(rawToken));
    }

    public (bool IsValid, int QuotationId, string CustomerEmail) ValidatePortalToken(string token)
    {
        try
        {
            var rawToken = Encoding.UTF8.GetString(Convert.FromBase64String(token));
            var parts = rawToken.Split(':');
            if (parts.Length != 4) return (false, 0, string.Empty);

            var quotationId = int.Parse(parts[0]);
            var email = parts[1];
            var expiryTicks = long.Parse(parts[2]);
            var providedHash = parts[3];

            if (new DateTime(expiryTicks, DateTimeKind.Utc) < DateTime.UtcNow)
                return (false, 0, string.Empty);

            var secretKey = _configuration["Jwt:SecretKey"] ?? "DealFlow360SuperSecretMasterKeyThatIsAtLeast32BytesLongForHS256Encryption!";
            var payload = $"{quotationId}:{email}:{expiryTicks}";

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secretKey));
            var expectedHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload)));

            if (providedHash != expectedHash)
                return (false, 0, string.Empty);

            return (true, quotationId, email);
        }
        catch
        {
            return (false, 0, string.Empty);
        }
    }
}
