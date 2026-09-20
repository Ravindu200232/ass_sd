===============================================================================
SE4030 - SECURE SOFTWARE DEVELOPMENT
Group Assignment (25 marks)
===============================================================================

APPLICATION
  Pubudu Tyres POS / mini-ERP - a multi-branch point-of-sale and inventory
  system for a tyre and auto-parts business. Laravel REST API + React SPA.

  Modules: invoicing with credit sales and thermal-receipt printing, customer
  credit ledger, product/brand/category/service catalogues with spreadsheet
  import, goods-received notes with FIFO batch stock allocation, a
  discount-request approval workflow, multi-branch (department) separation,
  staff management, and sales/profit reporting.


-------------------------------------------------------------------------------
1. GROUP MEMBERS
-------------------------------------------------------------------------------

  <INDEX_NO>    Ravindu Bandara Subasinha        (Group Leader)
  <INDEX_NO>    Malith <FULL NAME>
  <INDEX_NO>    Nimthara <FULL NAME>
  <INDEX_NO>    Hamna <FULL NAME>

  >> FILL IN the four index numbers and the three full names before submitting.


-------------------------------------------------------------------------------
2. GITHUB LINKS
-------------------------------------------------------------------------------

ORIGINAL PROJECT (unmodified, third-party account - our own earlier work)

  Backend    https://github.com/Chathura876/pubudu-pos-api
             last commit d997cbc, 18 May 2026

  Frontend   https://github.com/Chathura876/pubudu-pos-front-end
             last commit 52b7707, 27 May 2026

MODIFIED PROJECT (after fixing the vulnerabilities)

  Backend    https://github.com/Ravindu200232/pubudu-pos-api-secure
  Frontend   https://github.com/Ravindu200232/pubudu-pos-front-end-secure

  Both repositories were created by cloning the originals, so the FULL original
  commit history is preserved and every security change sits on top of it as a
  separate, documented commit.

  The unmodified starting point is tagged in both repositories as:

      v0-original-vulnerable

  so the complete before/after difference can be viewed directly:

      https://github.com/Ravindu200232/pubudu-pos-api-secure/compare/v0-original-vulnerable...main
      https://github.com/Ravindu200232/pubudu-pos-front-end-secure/compare/v0-original-vulnerable...main

  >> BEFORE SUBMITTING: both repositories are currently PRIVATE. Make them
     public so the marker can open them:

         gh repo edit Ravindu200232/pubudu-pos-api-secure --visibility public
         gh repo edit Ravindu200232/pubudu-pos-front-end-secure --visibility public


-------------------------------------------------------------------------------
3. YOUTUBE VIDEO
-------------------------------------------------------------------------------

  <YOUTUBE_URL>

  >> FILL IN after recording. Maximum 20 minutes.
     A timed run sheet with the exact commands is in video/script.md.


-------------------------------------------------------------------------------
4. SUMMARY OF WORK
-------------------------------------------------------------------------------

  18 distinct vulnerabilities identified.
  13 fixed and verified. 5 documented as deliberately not fixed, with reasons.
  Plus an OpenID Connect sign-in feature.

  VULNERABILITIES FIXED

    ID     Vulnerability                                     OWASP      Severity
    ----------------------------------------------------------------------------
    V-01   Unauthenticated /register minted ADMIN tokens      A01:2021   Critical
    V-02   Role middleware existed, applied to zero routes    A01:2021   Critical
    V-13   Stored XSS in print templates -> admin token theft A03:2021   Critical
    V-03   IDOR - no branch scoping on any {id} lookup        A01:2021   High
    V-04   Mass assignment erased debt, rewrote business keys A08:2021   High
    V-05   Enumeration, no brute-force limit, min:6 passwords A07:2021   High
    V-06   Tokens never expired, survived termination         A07:2021   High
    V-07   Error/source/log disclosure over HTTP              A05:2021   High
    V-10   Client dictated selling price and discount         A04:2021   High
    V-12   Laravel 10 EOL + 41 advisories; 23 npm advisories  A06:2021   High
    V-14   .env committed to the repository                   A05:2021   High
    V-15   Bearer tokens proxied over plaintext http://       A02:2021   High
    V-16   Token in localStorage; role trusted from client    A07:2021   High
    V-08   CORS accepted every origin                         A05:2021   Medium
    V-09   No security response headers (backend)             A05:2021   Medium
    V-11   No security audit trail                            A09:2021   Medium
    V-17   Uploads reached a vulnerable parser unvalidated    A05/A06    Medium
    V-18   No security headers or CSP (frontend)              A05:2021   Medium

    (V-05 and V-12 each cover several sub-findings; see the report.)

  NOT FIXED - reasons in section 7 of the report
    NF-1  Database-level encryption of customer PII at rest
    NF-2  httpOnly SameSite=Strict cookie instead of a bearer token
    NF-3  MFA/TOTP for administrators (partially mitigated by Google 2FA)
    NF-4  Removing the second UI kit and the non-standard build channel
    NF-5  Rotating leaked hostnames and rewriting git history
    NF-6  ~126 pre-existing lint errors unrelated to security

  OAUTH / OPENID CONNECT
    Google OIDC, Authorization Code flow with PKCE (S256), applied to the
    staff LOGIN feature. It replaces the removed public self-registration:
    an administrator provisions the account, Google proves the person controls
    the mailbox. The ID token is verified explicitly - signature against
    Google's JWKS, iss, aud, exp/iat, nonce, email_verified and an optional
    hosted-domain claim. No auto-provisioning: a Google account with no
    pre-provisioned staff record is refused.

  EVIDENCE
    Before:  12 of 12 attack scripts succeeded
    After:    0 of 13 succeed
    74 PHPUnit security regression tests + 15 frontend tests, all passing
    composer audit  41 advisories -> 0
    npm audit       23 advisories -> 0


-------------------------------------------------------------------------------
5. INDIVIDUAL CONTRIBUTION
-------------------------------------------------------------------------------

  Work was split into four branches, one per member, each merged through a
  reviewed pull request. Every commit message states the vulnerability, the
  evidence, the OWASP/CWE classification and the fix.

  RAVINDU (leader)  Access control and session management + the OAuth feature
                    V-01, V-02, V-03, V-05, V-06, Google OIDC
                    API PR #3, Frontend PR #3

  MALITH            Input and business-logic integrity, auditability
                    V-04, V-10, V-11
                    API PR #2

  NIMTHARA          Frontend attack surface
                    V-13, V-14, V-16, V-17
                    Frontend PR #2

  HAMNA             Configuration, transport, dependencies, test suite and CI
                    V-07, V-08, V-09, V-12, V-15, V-18 + 74 security tests
                    API PR #1 and #4, Frontend PR #1 and #4


-------------------------------------------------------------------------------
6. CONTENTS OF THIS SUBMISSION
-------------------------------------------------------------------------------

  README.txt                     this file
  report/SE4030_Report.pdf       the full report
  report/SE4030_Report.md        report source
  video/script.md                timed run sheet for the video
  evidence/before/               tool output and attack results, original code
  evidence/after/                the same, after remediation
  evidence/poc/                  the attack scripts themselves (runnable)


-------------------------------------------------------------------------------
7. REPRODUCING THE RESULTS
-------------------------------------------------------------------------------

  Requirements: PHP 8.2+, Composer, MySQL/MariaDB, Node 20+

  BACKEND
    git clone https://github.com/Ravindu200232/pubudu-pos-api-secure
    cd pubudu-pos-api-secure
    composer install
    cp .env.example .env
    php artisan key:generate
    mysql -u root -e "CREATE DATABASE pubudu_pos_secure"
    # set DB_DATABASE=pubudu_pos_secure and FRONTEND_URLS=http://localhost:5173
    php artisan migrate
    php artisan db:seed --class=SecurityDemoSeeder
    php artisan serve --host=127.0.0.1 --port=8000

  FRONTEND
    git clone https://github.com/Ravindu200232/pubudu-pos-front-end-secure
    cd pubudu-pos-front-end-secure
    npm install
    cp .env.example .env.local     # set VITE_API_BASE_URL=http://127.0.0.1:8000/api
    npm run dev

  THE ATTACK SCRIPTS
    node evidence/poc/run-all.mjs

    Against the hardened code the suite exits 0 and reports 0 exploitable.
    To see the ORIGINAL failing, check out the baseline tag first:

        git checkout v0-original-vulnerable

  THE TEST SUITES
    mysql -u root -e "CREATE DATABASE pubudu_pos_testing"
    php artisan test --testsuite=Security     # 74 passing
    npm test                                  # 15 passing
    npm run lint:security                     # clean

  DEMO ACCOUNTS (seeded, local only - the seeder refuses to run outside
  local/testing)

    admin            / Admin@Pass123     administrator, Colombo branch
    cashier.colombo  / Cashier@Pass123   employee, Colombo branch
    cashier.kandy    / Cashier@Pass123   employee, Kandy branch

  GOOGLE SIGN-IN
    Create a "Web application" OAuth 2.0 client at
    https://console.cloud.google.com/apis/credentials with redirect URI
    http://localhost:5173/auth/callback, then set GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI in the backend .env.
    Give a staff account the matching work email and sign in.

===============================================================================
