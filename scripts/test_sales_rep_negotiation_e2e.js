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

async function runSalesRepNegotiationE2E() {
  console.log('===============================================================');
  console.log('  SALES REPRESENTATIVE NEGOTIATION WORKFLOW E2E VERIFICATION   ');
  console.log('===============================================================\n');

  // 1. AUTHENTICATE
  console.log('--- Step 1: Authenticate Sales Representative ---');
  const repToken = await login('rep@dealflow360.test', 'Rep@123');
  assert(repToken != null, 'Sales Rep logged in successfully');

  const adminToken = await login('admin@dealflow360.test', 'Admin@123');
  const custRes = await request('/api/customers', { token: adminToken });
  const custPune = custRes.data.find(c => c.name.includes('Pune')); // Gold tier, 15% max
  assert(custPune != null, `Customer Pune (Gold Tier, 15% limit) retrieved: ID ${custPune.id}`);

  const prodsRes = await request('/api/admin/products', { token: adminToken });
  const probook = prodsRes.data.find(p => p.name.includes('ProBook 14'));
  assert(probook != null, `Product ProBook 14 retrieved: ID ${probook.id}`);

  // FLOW 1: SEND QUOTATION -> CUSTOMER COUNTERS -> SALES REP REJECTS & SENDS COUNTER-OFFER
  console.log('\n--- Step 2: Flow 1 - Send Quotation & Counter-Offer Negotiation ---');
  // Create quote with initial 10% discount
  const createRes = await request('/api/quotations', {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({
      customerId: custPune.id,
      notes: 'Initial proposal with 10% promotional discount',
      lines: [
        {
          productId: probook.id,
          quantity: 2,
          unitPrice: probook.basePrice,
          discountPercent: 10
        }
      ]
    })
  });
  assert(createRes.ok, `Quotation created: ID ${createRes.data.id}, Status: ${createRes.data.status}`);
  const quote1Id = createRes.data.id;

  // Rep sends quote to customer
  const sendRes = await request(`/api/quotations/${quote1Id}/send`, {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({ message: 'Sending official proposal for your review.' })
  });
  assert(sendRes.ok, `POST /api/quotations/${quote1Id}/send succeeded: Status is ${sendRes.data.status}`);
  assert(sendRes.data.status === 'Sent', `Quote status transitioned to "Sent"`);

  // Customer submits counter-offer (11% discount)
  const lineId1 = sendRes.data.lines[0].id;
  const custCounterRes = await request(`/api/quotations/${quote1Id}/lines/${lineId1}/negotiate`, {
    token: repToken, // or portal endpoint
    method: 'POST',
    body: JSON.stringify({
      proposedDiscountPercent: 11,
      proposedUnitPrice: probook.basePrice * 0.89,
      reason: 'Need 11% to fit our quarterly allocated budget.'
    })
  });
  assert(custCounterRes.ok, `Customer counter-offer 11% registered: Status is ${custCounterRes.data.status}`);
  assert(custCounterRes.data.status === 'UnderNegotiation', `Quote status transitioned to "UnderNegotiation"`);

  // Rep inspects quote details
  const getQuote1Res = await request(`/api/quotations/${quote1Id}`, { token: repToken });
  assert(getQuote1Res.ok, `Retrieved quote details`);
  assert(getQuote1Res.data.hasPendingCounterOffer === true, `Quote hasPendingCounterOffer is true`);
  assert(getQuote1Res.data.latestCounterDiscount === 11, `Latest counter discount is 11%`);
  assert(
    getQuote1Res.data.latestCounterReason.includes('quarterly allocated budget'),
    `Latest counter reason captured`
  );

  // Rep chooses Option 2: Reject customer counter and sends counter-offer of 10.5%
  const repCounterRes = await request(`/api/quotations/${quote1Id}/negotiate/reject`, {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({
      lineId: lineId1,
      counterDiscountPercent: 10.5,
      counterUnitPrice: probook.basePrice * 0.895,
      reason: 'We can offer 10.5% with complimentary on-site setup assistance.',
      disqualifyDeal: false
    })
  });
  assert(repCounterRes.ok, `Sales Rep rejected customer counter & dispatched 10.5% counter-offer`);
  assert(repCounterRes.data.latestCounterDiscount === 10.5, `Updated latest counter discount is 10.5%`);

  // FLOW 2: CRITICAL RULE - 20% DISCOUNT (PENDING APPROVAL) -> NEGOTIATED TO 14% (WITHIN TIER 15%)
  // -> ACCEPTED -> AUTO-APPROVED, SUBMIT FOR APPROVAL GONE, AND DISCOUNT LOCKED!
  console.log('\n--- Step 3: Flow 2 - Auto-Approval & Pending Approval Cleared When Within Tier ---');
  // Create quote with 20% discount (exceeds Gold 15% tier ceiling)
  const create20Res = await request('/api/quotations', {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({
      customerId: custPune.id,
      notes: 'Aggressive 20% discount deal',
      lines: [
        {
          productId: probook.id,
          quantity: 3,
          unitPrice: probook.basePrice,
          discountPercent: 20
        }
      ]
    })
  });
  assert(create20Res.ok, `Quote with 20% discount created: ID ${create20Res.data.id}`);
  const quote2Id = create20Res.data.id;
  const lineId2 = create20Res.data.lines[0].id;

  // Submit for approval -> status becomes PendingApproval
  const submitRes = await request(`/api/quotations/${quote2Id}/submit-approval`, {
    token: repToken,
    method: 'POST'
  });
  assert(submitRes.ok, `Submitted quote for approval. Status: ${submitRes.data.status}`);
  assert(submitRes.data.status === 'PendingApproval', `Quote is in PendingApproval status`);

  // Customer counter-offers at 14% (which is within Gold 15% tier ceiling!)
  const counter14Res = await request(`/api/quotations/${quote2Id}/lines/${lineId2}/negotiate`, {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({
      proposedDiscountPercent: 14,
      proposedUnitPrice: probook.basePrice * 0.86,
      reason: 'We agree on 14% final discount.'
    })
  });
  assert(counter14Res.ok, `Customer proposed 14% discount (within 15% Gold limit)`);

  // Sales Rep accepts the counter-offer
  const acceptRes = await request(`/api/quotations/${quote2Id}/negotiate/accept`, {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({
      note: 'Agreed to 14% finalized terms with procurement.'
    })
  });
  assert(acceptRes.ok, `Sales Rep accepted counter offer: HTTP ${acceptRes.status}`);
  assert(acceptRes.data.isAutoApproved === true, `isAutoApproved flag is true`);
  assert(acceptRes.data.status === 'Approved', `Quotation status is now "Approved"`);

  // Verify full detail response:
  const finalQuote2Res = await request(`/api/quotations/${quote2Id}`, { token: repToken });
  const finalQuote = finalQuote2Res.data;
  assert(finalQuote.status === 'Approved', `Status is strictly Approved (${finalQuote.status})`);
  assert(finalQuote.approvalStatus === 'Approved', `ApprovalStatus is strictly Approved (${finalQuote.approvalStatus})`);
  assert(finalQuote.isDiscountLocked === true, `isDiscountLocked is true to prevent sales rep edits`);
  assert(finalQuote.lines[0].isNegotiatedLocked === true, `Line isNegotiatedLocked is true`);
  assert(finalQuote.lines[0].discountPercent === 14, `Line discount was automatically set to 14%`);
  
  // Verify pending approval requests were resolved/cleared
  const pendingApprovals = (finalQuote.approvalSteps || []).filter(s => s.status === 'Pending');
  assert(pendingApprovals.length === 0, `No pending approval requests remaining (found ${pendingApprovals.length})`);
  console.log('  🎯 RULE VERIFIED: "Submit for Approval" requirement is completely removed and quote is auto-approved!');

  // FLOW 3: OPTION 3 - DISQUALIFY DEAL
  console.log('\n--- Step 4: Flow 3 - Option 3: Disqualify Quotation ---');
  const create3Res = await request('/api/quotations', {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({
      customerId: custPune.id,
      notes: 'Deal that will be disqualified',
      lines: [
        {
          productId: probook.id,
          quantity: 1,
          unitPrice: probook.basePrice,
          discountPercent: 10
        }
      ]
    })
  });
  const quote3Id = create3Res.data.id;

  const disqualifyRes = await request(`/api/quotations/${quote3Id}/disqualify`, {
    token: repToken,
    method: 'POST',
    body: JSON.stringify({
      reason: 'Price Mismatch / Unrealistic Customer Expectation',
      note: 'Customer demanded 35% discount which is below factory gross cost.'
    })
  });
  assert(disqualifyRes.ok, `POST /api/quotations/${quote3Id}/disqualify succeeded`);
  assert(disqualifyRes.data.status === 'Cancelled', `Quote status transitioned to Cancelled`);

  const finalQuote3Res = await request(`/api/quotations/${quote3Id}`, { token: repToken });
  assert(finalQuote3Res.data.status === 'Cancelled', `Quote 3 verified Cancelled`);

  console.log('\n===============================================================');
  console.log('  ALL SALES REPRESENTATIVE NEGOTIATION E2E TESTS PASSED!       ');
  console.log('===============================================================');
}

runSalesRepNegotiationE2E().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
