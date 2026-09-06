/**
 * DealFlow360 Standard Formatting Utilities
 * Standardized across all pages, quotations, products, price lists, orders, invoices,
 * subscriptions, reports, and customer portals.
 * Default Currency: Indian Rupee (INR / ₹) with Indian numbering grouping (en-IN).
 */

/**
 * Formats monetary amounts with standard currency symbol and Indian grouping.
 * Examples:
 *   formatCurrency(125000) => "₹1,25,000"
 *   formatCurrency(12500)  => "₹12,500"
 *   formatCurrency(999)    => "₹999"
 *   formatCurrency(1250.5) => "₹1,250.50"
 * 
 * @param {number|string} val - Monetary value
 * @param {string} [currency='INR'] - Currency code ('INR' or 'USD')
 * @returns {string} Formatted currency string
 */
export function formatCurrency(val, currency = 'INR') {
  if (val === null || val === undefined || val === '') {
    return '₹0.00';
  }
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '₹0.00';

  const curr = currency === 'USD' ? 'USD' : 'INR';

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: curr,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

/**
 * Formats plain numbers using the Indian numbering grouping.
 * @param {number|string} val 
 * @returns {string}
 */
export function formatNumber(val) {
  if (val === null || val === undefined || val === '') return '0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '0';
  return new Intl.NumberFormat('en-IN').format(num);
}

/**
 * Formats a decimal or percentage number into a readable percentage string.
 * @param {number|string} pct 
 * @param {number} [decimals=1]
 * @returns {string}
 */
export function formatPercent(pct, decimals = 1) {
  if (pct === null || pct === undefined || pct === '') return '0.0%';
  const num = typeof pct === 'number' ? pct : parseFloat(pct);
  if (isNaN(num)) return '0.0%';
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats dates consistently across the app.
 * @param {string|Date} dateVal 
 * @param {boolean} [includeTime=false]
 * @returns {string}
 */
export function formatDate(dateVal, includeTime = false) {
  if (!dateVal) return '—';
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);

  const options = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(includeTime ? { hour: '2-digit', minute: '2-digit' } : {})
  };
  return new Intl.DateTimeFormat('en-IN', options).format(d);
}

/**
 * Formats a monetary amount into a compact representation using Indian numbering notation.
 * e.g., 8804626 -> ₹88.05L, 15000000 -> ₹1.50Cr, 75000 -> ₹75.0k, 500 -> ₹500
 * @param {number|string} val 
 * @param {string} [currency='INR']
 * @returns {string}
 */
export function formatCompactCurrency(val, currency = 'INR') {
  if (val === null || val === undefined || val === '') return '₹0';
  const num = typeof val === 'number' ? val : parseFloat(val);
  if (isNaN(num)) return '₹0';
  const prefix = currency === 'USD' ? '$' : '₹';
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs >= 10000000) {
    return `${sign}${prefix}${(abs / 10000000).toFixed(2)}Cr`;
  }
  if (abs >= 100000) {
    return `${sign}${prefix}${(abs / 100000).toFixed(2)}L`;
  }
  if (abs >= 1000) {
    return `${sign}${prefix}${(abs / 1000).toFixed(1)}k`;
  }
  return `${sign}${prefix}${Math.round(abs)}`;
}
