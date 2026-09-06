/**
 * DEALFLOW360 — CONTROLLED QA / TEST DATA RESET & SEEDING SCRIPT
 * 
 * Authenticates as Admin and triggers POST /api/admin/reset-qa-data.
 * Prints the full Post-Seed Database Summary matrix and credentials.
 */

const API_BASE = process.env.API_BASE || 'http://localhost:5042';

async function resetQaData() {
  console.log('===============================================================');
  console.log('  DEALFLOW360 — CONTROLLED QA / TEST DATA RESET & SEEDING      ');
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

  // Step 2: Trigger reset
  console.log('Executing deterministic database reset & seed...');
  const resetRes = await fetch(`${API_BASE}/api/admin/reset-qa-data`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });

  if (!resetRes.ok) {
    const errText = await resetRes.text();
    console.error(`❌ QA Reset failed (HTTP ${resetRes.status}):`, errText);
    process.exit(1);
  }

  const summary = await resetRes.json();

  console.log('\n===============================================================');
  console.log('  POST-SEED DATABASE SUMMARY MATRIX                            ');
  console.log('===============================================================');
  console.log(`COMPANY COUNT             : ${summary.CompanyCount} (Exactly 1: ${summary.CompanyName} [${summary.CompanyCode}])`);
  console.log(`CUSTOMER COUNT            : ${summary.CustomerCount} (Exactly 5 Predefined Customers)`);
  console.log(`STAFF USERS COUNT         : ${summary.StaffCount}`);
  console.log(`PRODUCT COUNT             : ${summary.ProductCount} (Across 5 Categories)`);
  console.log(`WAREHOUSE COUNT           : ${summary.WarehouseCount} (Main, East, West)`);
  console.log(`PRICE LIST COUNT          : ${summary.PriceListCount} (Standard, Bronze, Silver, Gold)`);
  console.log(`DISCOUNT RULES COUNT      : ${summary.DiscountRuleCount}`);
  console.log(`APPROVAL RULES COUNT      : ${summary.ApprovalRuleCount} (Manager, Finance)`);
  console.log(`SUBSCRIPTION PLANS COUNT  : ${summary.SubscriptionPlanCount}`);
  console.log(`INVENTORY STOCK RECORDS   : ${summary.InventoryStockRecordCount} (Total On-Hand: ${summary.TotalInventoryOnHand}, Reserved: ${summary.TotalInventoryReserved})`);
  console.log(`HISTORICAL ORDERS COUNT   : ${summary.HistoricalOrderCount}`);
  console.log(`TOTAL QUOTATIONS COUNT    : ${summary.QuotationCount}`);

  console.log('\n--- PRESERVED PREDEFINED CUSTOMERS ---');
  const customers = summary.Customers || summary.customers;
  if (Array.isArray(customers)) {
    customers.forEach((c, idx) => {
      const id = c.Id ?? c.id;
      const name = c.Name ?? c.name;
      const email = c.Email ?? c.email;
      const tier = c.Tier ?? c.tier;
      console.log(`  Customer ${idx + 1}: [ID ${id}] ${name} | ${email} | Tier: ${tier}`);
    });
  }

  console.log('\n--- CONTROLLED STAFF & QA ACCOUNTS ---');
  const users = summary.Users || summary.users;
  if (Array.isArray(users)) {
    users.forEach(u => {
      const role = String(u.Role ?? u.role ?? 'Unknown').padEnd(18);
      const email = String(u.Email ?? u.email ?? 'Unknown').padEnd(30);
      const fullName = u.FullName ?? u.fullName ?? 'Unknown';
      console.log(`  ${role} : ${email} | Name: ${fullName}`);
    });
  }

  console.log('\n===============================================================');
  console.log('  🎉 DATABASE SUCCESSFULLY RESET & SEEDED FOR QA TESTING!     ');
  console.log('===============================================================');
}

resetQaData().catch(err => {
  console.error('Fatal error during reset:', err);
  process.exit(1);
});
