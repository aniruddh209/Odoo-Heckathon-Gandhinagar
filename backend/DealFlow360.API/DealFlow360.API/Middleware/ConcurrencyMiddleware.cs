using Microsoft.EntityFrameworkCore;

namespace DealFlow360.API.Middleware;

public class ConcurrencyMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ConcurrencyMiddleware> _logger;

    public ConcurrencyMiddleware(RequestDelegate next, ILogger<ConcurrencyMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (DbUpdateConcurrencyException ex)
        {
            _logger.LogWarning(ex, "Concurrency conflict caught in middleware.");

            context.Response.StatusCode = StatusCodes.Status409Conflict;
            context.Response.ContentType = "application/json";

            await context.Response.WriteAsJsonAsync(new
            {
                type = "https://dealflow360.io/errors/concurrency-conflict",
                title = "Concurrent Modification Detected",
                status = 409,
                detail = "This record was modified by another user. Please refresh and review the latest changes before retrying."
            });
        }
    }
}
