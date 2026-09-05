using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DealFlow360.API.Migrations
{
    /// <inheritdoc />
    public partial class AddSalesInquiryAcceptedStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "AcceptedAtUtc",
                table: "SalesConnectionRequests",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcceptedAtUtc",
                table: "SalesConnectionRequests");
        }
    }
}
