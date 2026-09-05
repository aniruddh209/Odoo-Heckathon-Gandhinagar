using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using DealFlow360.API.Models.Enums;

namespace DealFlow360.API.Models;

public class Order
{
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string OrderNumber { get; set; } = string.Empty;

    public int QuotationId { get; set; }

    public int CustomerId { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.Confirmed;

    [Column(TypeName = "decimal(18,4)")]
    public decimal Total { get; set; }

    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? UpdatedAtUtc { get; set; }


    // Navigation Properties
    public Quotation Quotation { get; set; } = null!;

    public Customer Customer { get; set; } = null!;

    public ICollection<OrderLine> Lines { get; set; } = new List<OrderLine>();

    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public ICollection<Backorder> Backorders { get; set; } = new List<Backorder>();
}
