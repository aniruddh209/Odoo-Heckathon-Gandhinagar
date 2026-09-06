namespace DealFlow360.API.Services.Pdf;

public interface IQuotationPdfService
{
    /// <summary>
    /// Generates a customer-facing PDF for internal staff (SalesRep, Manager, Finance, Admin)
    /// with strict role-based and ownership access control.
    /// </summary>
    Task<byte[]> GenerateQuotationPdfAsync(int quotationId, int requestingUserId, string requestingRole);

    /// <summary>
    /// Generates a customer-facing PDF for public/magic-link portal users via cryptographic token.
    /// </summary>
    Task<byte[]> GeneratePortalQuotationPdfAsync(string token);

    /// <summary>
    /// Generates a customer-facing PDF for an authenticated customer user, enforcing tenant isolation.
    /// </summary>
    Task<byte[]> GenerateCustomerQuotationPdfAsync(int quotationId, int customerId);
}
