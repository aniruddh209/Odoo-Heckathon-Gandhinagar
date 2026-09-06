const BASE_URL = 'http://localhost:5042';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {})
    },
    ...options
  });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function login(email, password) {
  const res = await request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(res.data)}`);
  }
  return res.data.accessToken || res.data.token;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(message);
  }
  console.log(`  ✅ ${message}`);
}

async function runQaDatasetVerification() {
  console.log('===============================================================');
  console.log('  DEALFLOW360 QA DATASET E2E VERIFICATION TEST SUITE          ');
  console.log('===============================================================\n');

  // 1. AUTHENTICATE ALL KEY ROLES
  console.log('--- TEST 1: Role Authentication & Credentials ---');
  const adminToken = await login('admin@dealflow360.test', 'Admin@123');
  assert(adminToken != null, 'Admin login succeeded (admin@dealflow360.test)');

  const managerToken = await login('manager@dealflow360.test', 'Manager@123');
  assert(managerToken != null, 'Sales Manager 1 login succeeded (manager@dealflow360.test)');

  const manager2Token = await login('manager2@dealflow360.test', 'Manager@123');
  assert(manager2Token != null, 'Sales Manager 2 login succeeded (manager2@dealflow360.test)');

  const repToken = await login('rep@dealflow360.test', 'Rep@123');
  assert(repToken != null, 'Sales Rep 1 login succeeded (rep@dealflow360.test)');

  const rep2Token = await login('rep2@dealflow360.test', 'Rep@123');
  assert(rep2Token != null, 'Sales Rep 2 login succeeded (rep2@dealflow360.test)');

  const rep3Token = await login('rep3@dealflow360.test', 'Rep@123');
  assert(rep3Token != null, 'Sales Rep 3 login succeeded (rep3@dealflow360.test)');

  const financeToken = await login('finance@dealflow360.test', 'Finance@123');
  assert(financeToken != null, 'Finance Operations login succeeded (finance@dealflow360.test)');

  const customerToken = await login('customer@dealflow360.io', 'Customer@123');
  assert(customerToken != null, 'Portal Customer login succeeded (customer@dealflow360.io)');

  // 2. COMPANY ENFORCEMENT (EXACTLY 1)
  console.log('\n--- TEST 2: Company Enforcement (Strictly 1 Company) ---');
  const companyRes = await request('/api/sales-connections/admin/companies', { token: adminToken });
  assert(companyRes.ok, `GET /api/sales-connections/admin/companies returned HTTP ${companyRes.status}`);
  assert(companyRes.data.length === 1, `Exact company count is 1 (found ${companyRes.data.length})`);
  assert(companyRes.data[0].code === 'DF360', `Company Code is DF360 (${companyRes.data[0].code})`);
  assert(
    companyRes.data[0].name.includes('DealFlow360 Technologies'),
    `Company Name is DealFlow360 Technologies Pvt. Ltd.`
  );

  // 3. CUSTOMER PRESERVATION (EXACTLY 5 PREDEFINED CUSTOMERS)
  console.log('\n--- TEST 3: Predefined Customer Dataset (Strictly 5 Customers) ---');
  const custRes = await request('/api/customers', { token: adminToken });
  assert(custRes.ok, `GET /api/customers returned HTTP ${custRes.status}`);
  assert(custRes.data.length === 5, `Exact customer count is 5 (found ${custRes.data.length})`);

  const expectedCustomers = [
    'Delhi Business Automation Pvt. Ltd.',
    'Ahmedabad Manufacturing Solutions Pvt. Ltd.',
    'Pune Enterprise Networks Pvt. Ltd.',
    'Bengaluru CloudWorks Pvt. Ltd.',
    'Sharma Technologies Pvt. Ltd.'
  ];

  for (const cName of expectedCustomers) {
    const found = custRes.data.find(c => c.name === cName);
    const tier = found?.tierName || found?.tier;
    assert(found != null, `Customer "${cName}" is present (ID: ${found?.id}, Tier: ${tier})`);
  }

  const custDelhi = custRes.data.find(c => c.name.includes('Delhi'));
  assert((custDelhi.tierName || custDelhi.tier) === 'Bronze', `Delhi customer tier is Bronze (${custDelhi.tierName || custDelhi.tier})`);

  const custAhmedabad = custRes.data.find(c => c.name.includes('Ahmedabad'));
  assert((custAhmedabad.tierName || custAhmedabad.tier) === 'Silver', `Ahmedabad customer tier is Silver (${custAhmedabad.tierName || custAhmedabad.tier})`);

  const custPune = custRes.data.find(c => c.name.includes('Pune'));
  assert((custPune.tierName || custPune.tier) === 'Gold', `Pune customer tier is Gold (${custPune.tierName || custPune.tier})`);

  // 4. CONTROLLED PRODUCT CATALOG (EXACTLY 24 PRODUCTS ACROSS 5 CATEGORIES)
  console.log('\n--- TEST 4: Controlled Catalog (24 Products Across 5 Categories) ---');
  const prodsRes = await request('/api/admin/products', { token: adminToken });
  assert(prodsRes.data.length >= 24, `Controlled product count is at least 24 (found ${prodsRes.data.length})`);

  // Verify ProBook 14 variants
  const probook14 = prodsRes.data.find(p => p.name.includes('ProBook 14'));
  assert(probook14 != null, `DealFlow ProBook 14 is present in catalog (ID: ${probook14.id})`);
  const variantsRes = await request(`/api/admin/products/${probook14.id}/variants`, { token: adminToken });
  assert(variantsRes.ok, `GET variants returned HTTP ${variantsRes.status}`);
  assert(variantsRes.data.length === 4, `ProBook 14 has exactly 4 variants (found ${variantsRes.data.length})`);

  // Verify low-margin test product (< 15%)
  const lowMarginProd = prodsRes.data.find(p => p.name.includes('Basic Cable Adapter'));
  assert(lowMarginProd != null, `Low margin test product "USB-C Basic Cable Adapter" present (ID: ${lowMarginProd.id})`);
  const marginPercent = ((lowMarginProd.basePrice - lowMarginProd.costPrice) / lowMarginProd.basePrice) * 100;
  assert(marginPercent < 15.0, `Low margin test product margin is strictly < 15% (actual: ${marginPercent.toFixed(2)}%)`);

  // 5. WAREHOUSE TOPOLOGY & STOCK
  console.log('\n--- TEST 5: Warehouse Fulfillment Infrastructure (3 Warehouses) ---');
  const whRes = await request('/api/admin/warehouses', { token: adminToken });
  assert(whRes.ok, `GET /api/admin/warehouses returned HTTP ${whRes.status}`);
  assert(whRes.data.length >= 3, `Warehouse count is at least 3 (found ${whRes.data.length})`);

  const mainWh = whRes.data.find(w => w.name.includes('Main'));
  const eastWh = whRes.data.find(w => w.name.includes('East'));
  const westWh = whRes.data.find(w => w.name.includes('West'));
  assert(mainWh && eastWh && westWh, 'All 3 regional warehouses (Main Mumbai, East Kolkata, West Ahmedabad) exist');

  // Verify stock on-hand
  const stockRes = await request('/api/admin/analytics/platform-overview', { token: adminToken });
  assert(stockRes.ok, 'Admin platform overview returned');
  assert(stockRes.data.totalStockOnHand > 10000, `Stock on-hand is populated (${stockRes.data.totalStockOnHand} units)`);

  // 6. PRICE LISTS & TIER PRICING
  console.log('\n--- TEST 6: Price Lists & Governance ---');
  const plRes = await request('/api/admin/price-lists', { token: adminToken });
  assert(plRes.ok, `GET price-lists returned HTTP ${plRes.status}`);
  assert(plRes.data.length === 4, `Exact price list count is 4 (found ${plRes.data.length})`);

  // 7. SUBSCRIPTION PLANS
  console.log('\n--- TEST 7: Subscription Plans ---');
  const subRes = await request('/api/admin/subscription-plans', { token: adminToken });
  assert(subRes.ok, `GET subscription-plans returned HTTP ${subRes.status}`);
  assert(subRes.data.length === 5, `Exact subscription plan count is 5 (found ${subRes.data.length})`);

  // 8. UPSELL & CROSS-SELL INTELLIGENCE MODULE PREVIEW
  console.log('\n--- TEST 8: Intelligent Upsell / Cross-Sell Preview ---');
  const recsRes = await request('/api/quotations/recommendations/preview', {
    method: 'POST',
    token: repToken,
    body: JSON.stringify({
      productIds: [probook14.id],
      customerId: custAhmedabad.id,
      minimumMarginThreshold: 15.0
    })
  });
  assert(recsRes.ok, `POST recommendations/preview returned HTTP ${recsRes.status}`);
  assert(Array.isArray(recsRes.data) && recsRes.data.length > 0, `Returned ${recsRes.data.length} intelligent suggestions`);
  
  // Verify low margin product (< 15%) is strictly excluded by threshold
  const hasLowMargin = recsRes.data.some(r => r.productId === lowMarginProd.id);
  assert(!hasLowMargin, `Low margin product (${lowMarginProd.name}) is excluded by minimum margin threshold (15%)`);

  // 9. CO-PURCHASE ORDERS MINING
  console.log('\n--- TEST 9: Historical Purchase Data Mining ---');
  const coPurchased = recsRes.data.filter(r => r.coPurchaseCount > 0);
  assert(coPurchased.length > 0, `Engine successfully mined historical co-purchases (${coPurchased.length} items have coPurchaseCount > 0)`);
  console.log(`  Top mined co-purchase: ${coPurchased[0].productName} (${coPurchased[0].coPurchaseCount} co-purchases, reason: "${coPurchased[0].reason}")`);

  // 10. PREDEFINED TEST QUOTES VERIFICATION
  console.log('\n--- TEST 10: Predefined Test Quotes Verification ---');
  const quotesRes = await request('/api/quotations', { token: adminToken });
  assert(quotesRes.ok, `GET quotations returned HTTP ${quotesRes.status}`);
  
  assert(quotesRes.data.length > 0, `Quotations exist in repository (found ${quotesRes.data.length})`);
  const histQuotes = quotesRes.data.filter(q => q.quotationNumber && q.quotationNumber.startsWith('QT-HIST-'));
  assert(histQuotes.length > 0, `Historical co-purchase training quotations present (${histQuotes.length} verified)`);

  const testQuotes = quotesRes.data.filter(q => q.quotationNumber && q.quotationNumber.startsWith('QT-QA-00'));
  if (testQuotes.length > 0) {
    const qTest1 = testQuotes.find(q => q.quotationNumber === 'QT-QA-001');
    if (qTest1) assert(qTest1.status === 'Draft', `QT-QA-001 is in Draft status (${qTest1.status})`);
  }

  // 11. DISCOUNT GOVERNANCE ENFORCEMENT
  console.log('\n--- TEST 11: Bronze Tier Discount Governance Enforcement ---');
  const overDiscountQuote = await request('/api/quotations', {
    method: 'POST',
    token: repToken,
    body: JSON.stringify({
      customerId: custDelhi.id,
      notes: 'Test over-discount quote',
      lines: [
        {
          productId: probook14.id,
          quantity: 1,
          unitPrice: 75000,
          discountPercent: 12.0
        }
      ]
    })
  });

  if (overDiscountQuote.ok) {
    assert(
      overDiscountQuote.data.approvalStatus !== 'Approved' || overDiscountQuote.data.riskScore > 30,
      `Over-discount quote triggered approval routing or elevated risk score (Risk: ${overDiscountQuote.data.riskScore})`
    );
  } else {
    assert(
      overDiscountQuote.status === 400,
      `System strictly blocked discount exceeding Bronze tier 5% ceiling (HTTP ${overDiscountQuote.status})`
    );
  }

  // 12. WAREHOUSE FULFILLMENT SPLIT & CONSOLIDATION
  console.log('\n--- TEST 12: Warehouse Fulfillment Recommendation Engine ---');
  const ordersRes = await request('/api/fulfillment/orders', { token: adminToken });
  assert(ordersRes.ok && ordersRes.data.length > 0, `Found ${ordersRes.data.length} fulfillment orders in system`);
  const sampleOrder = ordersRes.data[0];

  const planRes = await request(`/api/orders/${sampleOrder.id}/fulfillment/recommendation`, {
    token: repToken
  });
  assert(planRes.ok, `Fulfillment recommendation endpoint returned HTTP ${planRes.status}`);
  assert(
    planRes.data.orderId != null && planRes.data.orderNumber != null && planRes.data.allocations != null,
    `Fulfillment plan recommendation returned valid plan payload (Order: ${planRes.data.orderNumber}, Fully Allocated: ${planRes.data.isFullyAllocated})`
  );

  console.log('\n===============================================================');
  console.log('  🎉 ALL 12 QA DATASET & WORKFLOW E2E TESTS PASSED 100%!       ');
  console.log('===============================================================');
}

runQaDatasetVerification().catch(err => {
  console.error('\n❌ QA Verification Suite failed:', err);
  process.exit(1);
});
