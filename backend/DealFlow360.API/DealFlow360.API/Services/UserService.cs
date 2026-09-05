using DealFlow360.API.Common;
using DealFlow360.API.Data;
using DealFlow360.API.DTOs.Users;
using DealFlow360.API.Models;
using DealFlow360.API.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Services;

public interface IUserService
{
    Task<List<UserResponse>> GetUsersAsync(int currentUserId, Role currentUserRole, string? roleFilter = null);
    Task<UserResponse> GetUserByIdAsync(int id, int currentUserId, Role currentUserRole);
    Task<CreateUserResponse> CreateUserAsync(int currentUserId, Role currentUserRole, CreateUserRequest request);
    Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request, Role currentUserRole);
    Task<UserResponse> ToggleUserStatusAsync(int id, Role currentUserRole);
}

public class UserService : IUserService
{
    private readonly AppDbContext _context;

    public UserService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserResponse>> GetUsersAsync(int currentUserId, Role currentUserRole, string? roleFilter = null)
    {
        var query = _context.Users
            .Include(u => u.SalesTeam)
            .Include(u => u.Customer)
            .AsQueryable();

        if (currentUserRole == Role.SalesManager)
        {
            // Sales managers can only inspect sales representatives
            query = query.Where(u => u.Role == Role.SalesRep);
        }
        else if (currentUserRole != Role.Admin)
        {
            throw new UnauthorizedAccessException("You do not have permission to view internal users.");
        }

        if (!string.IsNullOrWhiteSpace(roleFilter) && Enum.TryParse<Role>(roleFilter, true, out var parsedRole))
        {
            query = query.Where(u => u.Role == parsedRole);
        }

        return await query
            .OrderBy(u => u.FullName)
            .Select(u => MapToUserResponse(u))
            .ToListAsync();
    }

    public async Task<UserResponse> GetUserByIdAsync(int id, int currentUserId, Role currentUserRole)
    {
        var user = await _context.Users
            .Include(u => u.SalesTeam)
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) throw new KeyNotFoundException($"User {id} not found.");

        if (currentUserRole == Role.SalesManager && user.Role != Role.SalesRep)
        {
            throw new ForbiddenAccessException("Sales managers can only inspect sales representatives.");
        }
        else if (currentUserRole != Role.Admin && currentUserRole != Role.SalesManager)
        {
            throw new ForbiddenAccessException("You do not have permission to view this user.");
        }

        return MapToUserResponse(user);
    }

    public async Task<CreateUserResponse> CreateUserAsync(int currentUserId, Role currentUserRole, CreateUserRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email))
        {
            throw new ArgumentException("Email is required.");
        }

        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            throw new ArgumentException("Full name is required.");
        }

        if (!Enum.TryParse<Role>(request.Role, true, out var targetRole))
        {
            throw new ArgumentException($"Invalid role '{request.Role}'.");
        }

        // ─── Enforce User Creation Hierarchy ───────────────────────
        if (currentUserRole == Role.SalesManager)
        {
            if (targetRole != Role.SalesRep)
            {
                throw new ForbiddenAccessException("Sales Managers are only authorized to create Sales Representatives.");
            }

            // Automatically assign to manager's sales team if not provided
            if (!request.SalesTeamId.HasValue)
            {
                var manager = await _context.Users.FindAsync(currentUserId);
                request.SalesTeamId = manager?.SalesTeamId;
            }
        }
        else if (currentUserRole != Role.Admin)
        {
            throw new ForbiddenAccessException("You are not authorized to create user accounts.");
        }

        // Email uniqueness check
        var emailNormalized = request.Email.Trim().ToLower();
        var exists = await _context.Users.AnyAsync(u => u.Email.ToLower() == emailNormalized);
        if (exists)
        {
            throw new InvalidOperationException($"A user with email '{request.Email}' already exists.");
        }

        // Password generation
        string? temporaryPassword = null;
        string passwordToHash;
        bool mustChangePassword;

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            temporaryPassword = PasswordGenerator.Generate(14);
            passwordToHash = temporaryPassword;
            mustChangePassword = true;
        }
        else
        {
            passwordToHash = request.Password;
            mustChangePassword = false;
        }

        var newUser = new User
        {
            FullName = request.FullName.Trim(),
            Email = emailNormalized,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(passwordToHash),
            Role = targetRole,
            SalesTeamId = request.SalesTeamId,
            CustomerId = request.CustomerId,
            IsActive = true,
            MustChangePassword = mustChangePassword,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        _context.Users.Add(newUser);
        await _context.SaveChangesAsync();

        // Reload with navigations
        await _context.Entry(newUser).Reference(u => u.SalesTeam).LoadAsync();
        await _context.Entry(newUser).Reference(u => u.Customer).LoadAsync();

        return new CreateUserResponse
        {
            User = MapToUserResponse(newUser),
            TemporaryPassword = temporaryPassword
        };
    }

    public async Task<UserResponse> UpdateUserAsync(int id, UpdateUserRequest request, Role currentUserRole)
    {
        if (currentUserRole != Role.Admin)
        {
            throw new ForbiddenAccessException("Only administrators can update user accounts.");
        }

        var user = await _context.Users
            .Include(u => u.SalesTeam)
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) throw new KeyNotFoundException($"User {id} not found.");

        if (!Enum.TryParse<Role>(request.Role, true, out var targetRole))
        {
            throw new ArgumentException($"Invalid role '{request.Role}'.");
        }

        user.FullName = request.FullName.Trim();
        user.Role = targetRole;
        user.SalesTeamId = request.SalesTeamId;
        user.CustomerId = request.CustomerId;
        user.IsActive = request.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return MapToUserResponse(user);
    }

    public async Task<UserResponse> ToggleUserStatusAsync(int id, Role currentUserRole)
    {
        if (currentUserRole != Role.Admin)
        {
            throw new ForbiddenAccessException("Only administrators can toggle user account status.");
        }

        var user = await _context.Users
            .Include(u => u.SalesTeam)
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null) throw new KeyNotFoundException($"User {id} not found.");

        user.IsActive = !user.IsActive;
        user.UpdatedAtUtc = DateTime.UtcNow;

        _context.Users.Update(user);
        await _context.SaveChangesAsync();

        return MapToUserResponse(user);
    }

    private static UserResponse MapToUserResponse(User u)
    {
        return new UserResponse
        {
            Id = u.Id,
            FullName = u.FullName,
            Email = u.Email,
            Role = u.Role.ToString(),
            SalesTeamId = u.SalesTeamId,
            TeamName = u.SalesTeam?.Name,
            CustomerId = u.CustomerId,
            CustomerName = u.Customer?.Name,
            IsActive = u.IsActive,
            MustChangePassword = u.MustChangePassword,
            LastLoginAtUtc = u.LastLoginAtUtc,
            CreatedAtUtc = u.CreatedAtUtc
        };
    }
}
