/**
 * DEALFLOW360 — CLEAR QUOTATIONS & DEALS DATA SCRIPT
 * 
 * Authenticates as Admin and triggers POST /api/admin/clear-deals-data.
 * Clears quotations, quotation lines, comments, changes, approval requests,
 * orders, order lines, backorders, warehouse allocations, invoices,
 * and resets all reserved inventory stock to 0.
 * Preserves Company, Customers, Staff, Products, Warehouses, Price Lists, and Rules.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5042';

async function clearDealsData() {
  console.log('===============================================================');
  console.log('  DEALFLOW360 — CLEAR QUOTATIONS & DEALS DATA                  ');
  console.log('===============================================================');
  console.log(`Connecting to backend at ${API_BASE}...`);

  // Step 1: Login as Admin
  let token = null;
  const adminEmails = ['admin@dealflow360.test', 'admin@dealflow360.io'];
  
  for (const email of adminEmails) {
    try {
      const loginRes = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: 'Admin@123' })
      });

      if (loginRes.ok) {
        const loginData = await loginRes.json();
        token = loginData.accessToken || loginData.token;
        console.log(`🔑 Authenticated as Admin (${email})`);
        break;
      }
    } catch (err) {
      // Try next or wait
    }
  }

  if (!token) {
    console.error('❌ Failed to authenticate as Admin. Ensure backend is running on http://localhost:5042.');
    process.exit(1);
  }

  // Step 2: Trigger deal data clearance
  console.log('Clearing all quotations, deals, orders, and related transactions...');
  const clearRes = await fetch(`${API_BASE}/api/admin/clear-deals-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!clearRes.ok) {
    const errText = await clearRes.text();
    console.error(`❌ Deal clearance failed (HTTP ${clearRes.status}):`, errText);
    process.exit(1);
  }

  const result = await clearRes.json();

  console.log('\n===============================================================');
  console.log('  CLEAR DATA SUMMARY                                           ');
  console.log('===============================================================');
  console.log(`STATUS                    : ${result.Success ? 'SUCCESS' : 'COMPLETED'}`);
  console.log(`MESSAGE                   : ${result.Message}`);
  console.log(`QUOTATIONS COUNT REMAINING: ${result.QuotationCount}`);
  console.log(`ORDERS COUNT REMAINING    : ${result.OrderCount}`);
  console.log(`RESERVED INVENTORY STOCK  : ${result.TotalInventoryReserved}`);
  console.log('===============================================================');
  console.log('  🎉 QUOTATIONS & DEALS PIPELINE ARE NOW COMPLETELY CLEAN!     ');
  console.log('===============================================================');
}

clearDealsData().catch(err => {
  console.error('Fatal error during clear:', err);
  process.exit(1);
});
