namespace DealFlow360.API.DTOs.Users;

public class CreateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? SalesTeamId { get; set; }
    public int? CustomerId { get; set; }
}

public class UpdateUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public int? SalesTeamId { get; set; }
    public int? CustomerId { get; set; }
    public bool IsActive { get; set; }
}

public class UserResponse
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? TeamName { get; set; }
    public int? SalesTeamId { get; set; }
    public int? CustomerId { get; set; }
    public string? CustomerName { get; set; }
    public bool IsActive { get; set; }
    public bool MustChangePassword { get; set; }
    public DateTime? LastLoginAtUtc { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}

public class CreateUserResponse
{
    public UserResponse User { get; set; } = null!;
    public string? TemporaryPassword { get; set; }
}
