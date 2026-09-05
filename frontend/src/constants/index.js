/**
 * User roles in DealFlow360
 */
export const Role = {
  SalesRep: 'SalesRep',
  SalesManager: 'SalesManager',
  InventoryManager: 'InventoryManager',
  FinanceOperations: 'FinanceOperations',
  Customer: 'Customer',
  Admin: 'Admin',
};

/**
 * Quotation lifecycle statuses
 */
export const QuotationStatus = {
  Draft: 'Draft',
  PendingApproval: 'PendingApproval',
  InReview: 'InReview',
  Approved: 'Approved',
  Sent: 'Sent',
  SentToCustomer: 'SentToCustomer',
  UnderNegotiation: 'UnderNegotiation',
  Confirmed: 'Confirmed',
  Accepted: 'Accepted',
  Ordered: 'Ordered',
  Rejected: 'Rejected',
  RevisionRequested: 'RevisionRequested',
  Cancelled: 'Cancelled',
  Expired: 'Expired',
};
