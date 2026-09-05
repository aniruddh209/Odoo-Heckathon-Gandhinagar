namespace DealFlow360.API.Models.Enums;

public enum QuoteStatus
{
    Draft = 1,
    PendingApproval = 2,
    Approved = 3,
    Sent = 4,
    UnderNegotiation = 5,
    Confirmed = 6,
    ConvertedToOrder = 7,
    Rejected = 8,
    Cancelled = 9
}
