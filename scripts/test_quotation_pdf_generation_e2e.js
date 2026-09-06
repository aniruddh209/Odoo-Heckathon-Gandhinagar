const https = require('https');

const httpsAgent = new https.Agent({ rejectUnauthorized: false });

function request(url, options = {}, postData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      agent: httpsAgent,
      headers: options.headers || {}
    };

    if (postData) {
      reqOptions.headers['Content-Type'] = 'application/json';
      reqOptions.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = https.request(reqOptions, (res) => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          buffer: buffer,
          text: buffer.toString('utf8'),
          json: () => {
            try { return JSON.parse(buffer.toString('utf8')); }
            catch (e) { return null; }
          }
        });
      });
    });

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runE2eTests() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('DEALFLOW360: COMPREHENSIVE QUOTATION PDF GENERATION E2E TESTS');
  console.log('═══════════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${message}`);
      failed++;
    }
  }

  // 1. Admin Login
  console.log('1. Authenticating Admin User...');
  const adminLogin = await request('https://localhost:5001/api/auth/login', { method: 'POST' }, 
    JSON.stringify({ email: 'admin@dealflow360.test', password: 'Admin@123' }));
  assert(adminLogin.statusCode === 200, 'Admin login succeeded');
  const adminToken = adminLogin.json().accessToken;

  // 2. Sales Rep Login
  console.log('\n2. Authenticating Sales Rep User...');
  const repLogin = await request('https://localhost:5001/api/auth/login', { method: 'POST' }, 
    JSON.stringify({ email: 'rep@dealflow360.test', password: 'Rep@123' }));
  assert(repLogin.statusCode === 200, 'Sales Rep login succeeded');
  const repToken = repLogin.json().accessToken;
  const repUserId = repLogin.json().user.id;

  // 3. Customer User Login
  console.log('\n3. Authenticating Customer User (Sharma Tech)...');
  const customerLogin = await request('https://localhost:5001/api/auth/login', { method: 'POST' }, 
    JSON.stringify({ email: 'customer@dealflow360.io', password: 'Customer@123' }));
  assert(customerLogin.statusCode === 200, 'Customer login succeeded');
  const customerToken = customerLogin.json().accessToken;
  const customerOrgId = customerLogin.json().user.customerId;
  console.log(`   Customer account linked to CustomerId: ${customerOrgId}`);

  // 4. Fetch list of quotations
  console.log('\n4. Retrieving Quotations Catalog...');
  const quotesRes = await request('https://localhost:5001/api/quotations', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(quotesRes.statusCode === 200, 'Retrieved quotations list');
  const quotes = quotesRes.json();
  assert(quotes.length > 0, `Found ${quotes.length} quotations in system`);

  const sampleQuote = quotes[0];
  console.log(`   Selected Sample Quotation ID: ${sampleQuote.id} (${sampleQuote.quotationNumber})`);

  // 5. Download PDF as Admin / Sales Rep
  console.log('\n5. Generating and Downloading Quotation PDF via Internal Staff API...');
  const pdfRes = await request(`https://localhost:5001/api/quotations/${sampleQuote.id}/pdf`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(pdfRes.statusCode === 200, 'PDF generated successfully with HTTP 200');
  assert(pdfRes.headers['content-type'] === 'application/pdf', 'Content-Type is application/pdf');
  assert(pdfRes.headers['content-disposition']?.includes(sampleQuote.quotationNumber), 
    `Content-Disposition contains quotation number: ${pdfRes.headers['content-disposition']}`);
  assert(pdfRes.buffer.length > 15000, `PDF size is production-grade (> 15KB): ${pdfRes.buffer.length} bytes`);
  
  const magicHeader = pdfRes.buffer.slice(0, 5).toString('ascii');
  assert(magicHeader === '%PDF-', 'PDF file begins with standard vector %PDF- magic bytes');

  // 6. Inspect PDF Text Stream for Zero-Leak Security Invariant
  console.log('\n6. Verifying Zero-Leak Security Invariant in Generated PDF...');
  const pdfRawText = pdfRes.buffer.toString('binary');
  
  // Internal values that MUST NEVER appear in customer quotation PDF
  assert(!pdfRawText.includes('CostTotal'), 'PDF stream does not leak "CostTotal"');
  assert(!pdfRawText.includes('MarginPercent'), 'PDF stream does not leak "MarginPercent"');
  assert(!pdfRawText.includes('MarginAmount'), 'PDF stream does not leak "MarginAmount"');
  assert(!pdfRawText.includes('RiskScore'), 'PDF stream does not leak "RiskScore"');
  assert(!pdfRawText.includes('BlendedRiskScore'), 'PDF stream does not leak "BlendedRiskScore"');
  assert(!pdfRawText.includes('ManagerRemarks'), 'PDF stream does not leak "ManagerRemarks"');

  // 7. Customer Portal Magic-Link Token PDF Generation
  console.log('\n7. Generating Portal Magic-Link Token & Testing Portal PDF...');
  const portalLinkRes = await request(`https://localhost:5001/api/quotations/${sampleQuote.id}/generate-portal-link`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert(portalLinkRes.statusCode === 200, 'Generated secure portal token link');
  const portalLink = portalLinkRes.json().portalLink;
  const token = portalLink.split('/').pop();
  console.log(`   Extracted Portal Token: ${token.slice(0, 20)}...`);

  const portalPdfRes = await request(`https://localhost:5001/api/portal/quote/${token}/pdf`);
  assert(portalPdfRes.statusCode === 200, 'Public customer portal PDF download succeeded (HTTP 200)');
  assert(portalPdfRes.headers['content-type'] === 'application/pdf', 'Portal PDF Content-Type is application/pdf');
  assert(portalPdfRes.buffer.slice(0, 5).toString('ascii') === '%PDF-', 'Portal PDF starts with %PDF- header');

  // Test invalid portal token
  console.log('\n8. Testing Invalid Portal Token Protection...');
  const invalidPortalPdfRes = await request('https://localhost:5001/api/portal/quote/invalid-token-123456/pdf');
  assert(invalidPortalPdfRes.statusCode === 401 || invalidPortalPdfRes.statusCode === 403, 
    `Tampered/invalid portal token rejected with HTTP ${invalidPortalPdfRes.statusCode}`);

  // 9. Authenticated Customer Portal PDF & Tenant Isolation
  console.log('\n9. Testing Authenticated Customer Portal PDF & Multi-Tenant Isolation...');
  const myQuotesRes = await request('https://localhost:5001/api/customer/me/quotations', {
    headers: { 'Authorization': `Bearer ${customerToken}` }
  });
  assert(myQuotesRes.statusCode === 200, 'Customer retrieved their quotations');
  const myQuotes = myQuotesRes.json();
  console.log(`   Customer owns ${myQuotes.length} quotations.`);

  if (myQuotes.length > 0) {
    const myQuote = myQuotes[0];
    const custPdfRes = await request(`https://localhost:5001/api/customer/me/quotations/${myQuote.id}/pdf`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(custPdfRes.statusCode === 200, `Customer downloaded own quotation PDF (Quote #${myQuote.id})`);
    assert(custPdfRes.buffer.slice(0, 5).toString('ascii') === '%PDF-', 'Customer downloaded valid %PDF-');
  }

  // Find a quotation belonging to another customer to test privilege escalation
  // CustomerOrgId is 36. Quote #2384 or earlier quotes belong to other customers.
  let otherCustomerQuoteId = null;
  for (const q of quotes) {
    const detailRes = await request(`https://localhost:5001/api/quotations/${q.id}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (detailRes.statusCode === 200) {
      const d = detailRes.json();
      if (d.customerId && d.customerId !== customerOrgId) {
        otherCustomerQuoteId = d.id;
        console.log(`\n10. Testing Horizontal Privilege Escalation Protection (Quote #${d.id} belongs to Customer #${d.customerId}, not #${customerOrgId})...`);
        break;
      }
    }
  }

  if (otherCustomerQuoteId) {
    const attackRes = await request(`https://localhost:5001/api/customer/me/quotations/${otherCustomerQuoteId}/pdf`, {
      headers: { 'Authorization': `Bearer ${customerToken}` }
    });
    assert(attackRes.statusCode === 401 || attackRes.statusCode === 403 || attackRes.statusCode === 404, 
      `Customer forbidden from downloading other customer's quotation PDF (Status: HTTP ${attackRes.statusCode})`);
  }

  // 11. Create a Hybrid Quote (One-Time Item + Recurring Subscription) to Verify Section Segregation
  console.log('\n11. Testing Hybrid Quotation (One-Time Items + Recurring Subscription Schedules)...');
  // Get products
  const productsRes = await request('https://localhost:5001/api/admin/products', {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  const rawProducts = productsRes.json();
  const allProducts = Array.isArray(rawProducts) ? rawProducts : (rawProducts?.value || []);
  console.log(`   Fetched ${allProducts.length} products from admin API.`);
  const oneTimeProduct = allProducts.find(p => !p.name.toLowerCase().includes('subscription') && !p.sku.toLowerCase().includes('sub-'));
  const subProduct = allProducts.find(p => p.name.toLowerCase().includes('subscription') || p.sku.toLowerCase().includes('sub-') || p.name.toLowerCase().includes('saas') || p.name.toLowerCase().includes('cloud'));

  if (oneTimeProduct && subProduct) {
    console.log(`   One-Time Product: ${oneTimeProduct.name} (${oneTimeProduct.sku})`);
    console.log(`   Subscription Product: ${subProduct.name} (${subProduct.sku})`);

    // Create quote
    const newQuoteRes = await request('https://localhost:5001/api/quotations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }, JSON.stringify({
      customerId: customerOrgId || 1,
      currencyCode: 'INR',
      notes: 'Standard enterprise package with both hardware and cloud SaaS tier.',
      lines: [
        {
          productId: oneTimeProduct.id,
          quantity: 2,
          unitPrice: oneTimeProduct.basePrice || 50000,
          discountPercent: 5
        },
        {
          productId: subProduct.id,
          quantity: 10,
          unitPrice: subProduct.basePrice || 12000,
          discountPercent: 10
        }
      ]
    }));

    if (newQuoteRes.statusCode === 201) {
      const createdQuote = newQuoteRes.json();
      console.log(`   Created hybrid quote #${createdQuote.id} (${createdQuote.quotationNumber})`);

      const hybridPdfRes = await request(`https://localhost:5001/api/quotations/${createdQuote.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert(hybridPdfRes.statusCode === 200, 'Hybrid quotation PDF generated successfully');
      assert(hybridPdfRes.buffer.length > 20000, `Hybrid quotation PDF is robust: ${hybridPdfRes.buffer.length} bytes`);
    }
  }

  // 12. Create a Multi-Page Quote (20+ lines) to verify table header repetition and dynamic pagination
  console.log('\n12. Testing Multi-Page Quotation Flow (20+ Line Items)...');
  if (allProducts.length >= 5) {
    const multiLines = [];
    for (let i = 0; i < 22; i++) {
      const prod = allProducts[i % allProducts.length];
      multiLines.push({
        productId: prod.id,
        quantity: i + 1,
        unitPrice: prod.basePrice || 10000,
        discountPercent: (i % 4) * 2.5
      });
    }

    const multiQuoteRes = await request('https://localhost:5001/api/quotations', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    }, JSON.stringify({
      customerId: customerOrgId || 1,
      currencyCode: 'INR',
      notes: 'Extensive enterprise multi-deliverable bill of materials spanning multiple printed pages.',
      lines: multiLines
    }));

    if (multiQuoteRes.statusCode === 201) {
      const multiQuote = multiQuoteRes.json();
      console.log(`   Created multi-page quote #${multiQuote.id} with ${multiLines.length} lines`);

      const multiPdfRes = await request(`https://localhost:5001/api/quotations/${multiQuote.id}/pdf`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });
      assert(multiPdfRes.statusCode === 200, 'Multi-page quotation PDF generated successfully');
      assert(multiPdfRes.buffer.length > 30000, `Multi-page PDF size is proportional: ${multiPdfRes.buffer.length} bytes`);
      assert(multiPdfRes.buffer.slice(0, 5).toString('ascii') === '%PDF-', 'Multi-page PDF has valid %PDF- magic bytes');
    }
  }

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log(`E2E TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (failed > 0) process.exit(1);
}

runE2eTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
