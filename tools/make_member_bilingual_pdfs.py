from __future__ import annotations

import html
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle

sys.path.insert(0, str(Path(__file__).parent))
import make_ravindu_bilingual_pdf as base  # noqa: E402


ROOT = Path(r"D:\ass_sd")
STUDY = ROOT / "sinhala-study-pack"
VIDEO = ROOT / "video"

COMMON_SI = """## Demo setup සහ record කරන පොදු ක්‍රමය

- Original website: `http://localhost:5174/login`.
- Secure website: `http://localhost:5173/login`.
- Username: `cashier.colombo`. Local demo password එක login field එකට type කරන්න; password එක video එකේ නොපෙන්වන්න.
- Browser tabs දෙකක් තියාගෙන `Ctrl + Tab` භාවිතා කර Original සහ Secure tabs අතර මාරු වෙන්න.
- හැම action එකකටම cursor එක field/button/result එක උඩට ගෙන තත්පර දෙකක් නවත්වලා screenshot ගන්න.
- මුලින් Original result එක පෙන්වන්න; පස්සේ ඒ bug එක කියන්න; ඊළඟට Secure result, code segment සහ test result පෙන්වන්න.
- Live database එකට අනවශ්‍ය destructive action කරන්න එපා. Test database, code සහ existing evidence භාවිතා කරන්න.

## Video introduction එකේ කියන්න

මෙම video එකේදී මම Pubudu Tire Management System එකේ මට assign කරලා තිබෙන security workstream එක පෙන්වනවා. හැම vulnerability එකකටම මුලින් Original version එකේ අවදානම පෙන්වනවා. ඊට පස්සේ Secure version එකේ කළ fix එක, අදාළ code segment එක සහ automated test evidence එක පෙන්වනවා. Password, token, secret හෝ personal account information screen එකේ පෙන්වන්නේ නැහැ.
"""

COMMON_EN = """## English introduction - say this

“Hello. In this section I will demonstrate my assigned security workstream in the Pubudu Tire Management System. For each vulnerability, I will first show the Original behavior, explain the security impact, and then show the Secure behavior, the relevant code change, and the automated test evidence. Passwords, tokens, secrets and personal account information are kept hidden.”
"""


MALITH_EN = {
    "V-04": """## V-04 - Mass assignment and customer debt

**[Show the Original customer update flow or the original controller code.]**

“In the Original API, the request was validated, but the controller then passed the complete request payload to the model with `request->all()`. Validation checks whether selected fields are valid; it does not automatically remove every other field. Therefore, an attacker could add a protected field such as `credit_balance` or `customer_code` and change business data without the correct workflow. A debt change could also happen without a corresponding ledger entry.”

**[Show the Secure controller and the negative test.]**

“In the Secure version, protected business fields are prohibited and only the validated data is sent to the model. Credit changes use a dedicated endpoint that creates a ledger transaction. This makes the update explicit, auditable and rejectable with HTTP 422 when a forbidden field is supplied.”
""",
    "V-10": """## V-10 - Client-controlled invoice prices and discount approval

**[Show the Original invoice request or the original invoice price-handling code.]**

“The Original backend calculated the invoice total on the server, but it trusted the item price and discount supplied by the browser. A cashier could change the price of an expensive tyre to one rupee, and the server would calculate that manipulated value correctly. The discount approval workflow was therefore decorative because the request could bypass it.”

**[Show the Secure invoice controller and the fixed request payload builder.]**

“The Secure backend resolves the authoritative price from stock or service data. The submitted price is treated as an expected quote and is rejected if it does not match. A discount must belong to the correct cashier, be approved, stay within its limit and be consumed only once. Server-derived totals, credit balances and invoice ownership are not trusted from the client.”
""",
    "V-11": """## V-11 - Missing and tamperable audit trail

**[Show the Original invoice cancellation behavior or the original cancellation code.]**

“In the Original implementation, cancelling an invoice could overwrite its financial values with zero, and there was no reliable record of who performed the action or what the previous values were. This makes a large cancelled sale look similar to a small one and makes financial investigation difficult.”

**[Show the Secure audit table, AuditLogger and the cancellation test.]**

“The Secure version records security- and money-relevant actions with the actor, subject, old values, new values, IP address and timestamp. The pre-cancellation financial state is captured before values are changed. The audit model is append-only, and the read API is administrator-only. This control mainly supports detection and forensic investigation; authorization and business rules still prevent the unauthorized action.”
""",
}


NIMTHARA_EN = {
    "V-13": """## V-13 - Stored cross-site scripting

**[Show the Original print or report flow and the original unescaped template code.]**

“The Original application inserted customer and product values into HTML strings and opened them with `document.write()`. React escaping was not applied in that print path. A malicious customer name or product name could therefore be stored in the database and execute later when an administrator printed an invoice. This is stored XSS.”

**[Show the Secure escape helper, call sites and test.]**

“The Secure version escapes HTML context characters before interpolation. The safe template helper escapes every value by default, while raw markup is limited to trusted application-generated markup. The regression tests verify image payloads, quote and attribute breakout, closing script tags and normal names. The payload is rendered as text and is not parsed as an element.”
""",
    "V-14": """## V-14 - Environment file committed to source control

**[Show the Original Git evidence for the `.env` file.]**

“The Original frontend had an environment file tracked in version control. Even when the current file contains configuration rather than a secret, committing environment files creates a direct path for future credentials and deployment details to be exposed.”

**[Show the Secure `.gitignore`, `.env.example` and CI secret check.]**

“The Secure version removes the real environment file from the working tree, adds an explicit environment-file ignore rule, and keeps only a safe example template. CI checks both that no environment file is tracked and that the ignore rule remains present. Historical repository exposure must still be handled by rotating affected values; the fix does not claim to rewrite history.”
""",
    "V-16": """## V-16 - Client-trusted role and browser token exposure

**[Show the Original browser storage and the client-side role check.]**

“The Original frontend stored the bearer token and the full user record in local storage. It also trusted the stored role to decide which administrator interface to display. JavaScript running in the same origin could read that token, and changing the stored role could make the administrator UI appear even though the server had not granted that role.”

**[Show the Secure `GET /me` flow, token accessors and cleanup.]**

“The Secure frontend asks the server for the current user and uses the server response as the source of truth for role and active status. Token persistence is reduced and centralized, failed authentication removes the session and business drafts, and dangerous direct local-storage access is blocked by the security lint rules. The API still enforces authorization, so changing browser storage cannot grant permission.”
""",
    "V-17": """## V-17 - Weak spreadsheet and CSV upload validation

**[Show the Original upload input and the old validation path.]**

“The Original upload relied mainly on the file-picker `accept` attribute and did not apply one consistent validation path to every import screen. File extensions and browser MIME values can be changed by an attacker, so they are not sufficient security controls.”

**[Show `validateUpload.js` and the upload tests.]**

“The Secure upload helper validates presence, file size, extension, plausible MIME type, magic bytes and the maximum number of parsed rows. XLSX files are checked for the ZIP signature, legacy XLS files for the expected container and CSV files for unsafe binary content. Parser updates and output escaping are still required as defence in depth.”
""",
    "V-20": """## V-20 - Wholesale cost and margin leaked to employees

**[Show the Original browser Network response for a stock or GRN endpoint.]**

“In the Original API response, a cashier could see supplier cost, stock price, discounts and profit-related fields even when the screen hid those columns. Hiding a column with CSS is not authorization because the complete JSON response is visible in the Network panel.”

**[Show the Secure model trait, controller filtering and response tests.]**

“The Secure backend hides cost and margin fields by default and reveals them only when the authenticated user is an administrator. Controller paths that build arrays manually apply the same role decision. An employee still receives permitted stock quantity and selling price, but not wholesale cost or margin. The response-filtering tests cover all protected endpoints and both employee and administrator behavior.”
""",
}


HAMNA_EN = {
    "V-07": """## V-07 - Error, log and source disclosure

**[Show an Original error response with the internal details visible.]**

“The Original API could return raw SQL, framework and stack information when an error occurred. These details help an attacker learn table names, class names and application paths. The browser should receive a safe status and generic JSON message, while technical details belong in server-side logs.”

**[Show the Secure exception handler, safe defaults and configuration test.]**

“The Secure handler uses one safe JSON error contract and keeps technical details on the server. Production debug defaults are disabled, and source and secret files are protected by deployment hardening. The tests verify that unhandled errors and missing records do not disclose internal implementation details.”
""",
    "V-08": """## V-08 - Wildcard CORS policy

**[Show the Original CORS configuration and an unknown-origin request.]**

“The Original API allowed every origin with a wildcard CORS policy. CORS controls whether a browser script may read a cross-origin response. It is not authentication, but a wildcard policy increases the number of websites that can interact with the API from a browser.”

**[Show `config/cors.php` and the CORS tests.]**

“The Secure configuration reads an explicit comma-separated allow-list from the environment and fails closed when it is empty. Unknown origins do not receive the allow-origin header, while the configured frontend origin is accepted. Credentials are disabled for this bearer-token design.”
""",
    "V-09": """## V-09 - Missing security response headers

**[Show the Original response headers.]**

“The Original API responses did not consistently include browser security headers. Without these headers, browsers have fewer instructions to prevent framing, content-type confusion, referrer leakage and caching of sensitive responses.”

**[Show `SecurityHeaders.php` and the configuration tests.]**

“The Secure application applies headers globally, including error responses. It sends `nosniff`, frame protection, a strict API content-security policy, a no-referrer policy and no-store caching. HSTS is added only when the request is already HTTPS because HSTS must not be sent over plain HTTP.”
""",
    "V-12": """## V-12 - Outdated dependencies and known advisories

**[Show the before Composer and npm audit evidence.]**

“The Original dependency audit reported 41 Composer advisories and 23 frontend npm advisories. These are known issues in package versions, so the application inherits their risk even when our own source code is unchanged.”

**[Show the updated lock files, after audit output and CI workflow.]**

“The Secure project upgrades the supported framework and affected packages, then verifies the result with Composer audit, npm audit, tests and a production build. The recorded evidence changes from 41 to zero and from 23 to zero. This means no known advisory was reported by those scans at that time; it is not a promise that future advisories cannot appear.”
""",
    "V-15": """## V-15 - Plain HTTP API proxy hop

**[Show the Original frontend proxy target.]**

“The Original frontend was served over HTTPS, but its API proxy forwarded requests to an HTTP target. The browser-to-frontend connection could be encrypted while the next hop carried bearer tokens and business data in plain text.”

**[Show the Secure `vercel.json` rewrite target.]**

“The Secure proxy uses an HTTPS API target. This protects the transport between the deployed frontend proxy and the API, subject to the deployment certificate and hosting configuration being valid.”
""",
    "V-18": """## V-18 - Frontend security headers and CSP

**[Show the Original frontend response headers.]**

“The Original frontend did not provide a complete browser security-header policy. A frontend SPA needs a policy that permits its own scripts, fonts and API connection while blocking unsafe framing and unwanted capabilities.”

**[Show the Secure frontend headers in `vercel.json` and the browser Network panel.]**

“The Secure deployment adds Content Security Policy, HSTS, no-sniff, frame, referrer and permissions policies. This is defence in depth. CSP does not replace output escaping for XSS, and backend authorization is still required for protected data.”
""",
    "TESTING": """## Testing, CI and the meaning of 0/14

**[Show the security test suite and the CI workflows.]**

“The security suite turns the findings into repeatable gates. The backend security suite records 90 passing tests and 230 assertions after the team additions, while the frontend test suite records 19 passing tests. The CI workflows run PHPUnit, security lint, frontend tests, a production build, dependency audits and secret checks on pushes and pull requests.”

“The runtime summary showing `Still exploitable: 0` does not mean that fourteen tests failed. It means that zero of the fourteen attack attempts remained successful after the fixes. The unit and integration tests are reported separately, and a failing CI job blocks the merge.”

**[Show the five deliberately deferred items only if required by the assignment report.]**

“The report also clearly marks the items we did not fix in this iteration, including encrypted searchable customer data, a future httpOnly-cookie architecture, admin MFA, removal of the second UI framework and historical hostname removal. These are documented limitations, not hidden defects.”
""",
}


ACTION_SI = {
    "Malith": {
        "V-04": "Original tab එකේ customer update flow හෝ original `CustomerController.php` පෙන්වන්න. `credit_balance` වගේ protected field එකක් request එකට දාන තැන පෙන්වන්න. Secure tab/code එකේ `prohibited` rules, `$validated` update සහ 422 test එක පෙන්වන්න. Screenshot names: `V04-01-original-mass-assignment.png`, `V04-02-secure-validation.png`, `V04-03-business-integrity-test.png`.",
        "V-10": "Original invoice screen/request එක පෙන්වා item selling price එක browser request එකෙන් වෙනස් කළ හැකි බව කියන්න. Live production data වෙනස් නොකර evidence/code භාවිතා කරන්න. Secure `InvoiceController.php`, `invoicePayload.js` සහ price/discount tests පෙන්වන්න. Screenshot names: `V10-01-original-price-tamper.png`, `V10-02-secure-price-rejected.png`, `V10-03-server-price-code.png`, `V10-04-discount-single-use-test.png`.",
        "V-11": "Original invoice cancel flow සහ audit evidence නැති result එක පෙන්වන්න. Secure `AuditLogger.php`, append-only `AuditLog.php`, cancellation snapshot සහ audit test එක පෙන්වන්න. Existing demo invoice එකක් destructive ලෙස cancel නොකර dedicated test/evidence භාවිතා කරන්න. Screenshot names: `V11-01-original-cancel-gap.png`, `V11-02-secure-audit-log.png`, `V11-03-audit-test.png`.",
    },
    "Nimthara": {
        "V-13": "Original print/report flow එකේ stored HTML payload එක code/evidence වලින් පෙන්වන්න; live external token theft කරන්න එපා. Secure `escapeHtml.js`, print call sites සහ test result පෙන්වන්න. Screenshot names: `V13-01-original-unsafe-print.png`, `V13-02-secure-escaped-output.png`, `V13-03-escape-code-test.png`.",
        "V-14": "Original Git history එකේ `.env` tracked බව පෙන්වන්න. Secure `.gitignore`, `.env.example` සහ CI check පෙන්වන්න. Actual secret value එක screen එකේ පෙන්වන්න එපා. Screenshot names: `V14-01-original-env-history.png`, `V14-02-secure-ignore-rule.png`, `V14-03-secret-scan-test.png`.",
        "V-16": "Original browser DevTools එකේ localStorage token/user role පෙන්වන්න; personal token value එක blur/mask කරන්න. Secure `GET /me`, memory/session handling, logout cleanup සහ API authorization code පෙන්වන්න. Screenshot names: `V16-01-original-storage-role.png`, `V16-02-secure-server-role.png`, `V16-03-session-code-test.png`.",
        "V-17": "Original upload page එක සහ extension-only validation එක පෙන්වන්න. Secure `validateUpload.js` හි size, extension, MIME, magic bytes සහ row-limit flow එක පෙන්වන්න. Real malicious file upload නොකර test fixture/code භාවිතා කරන්න. Screenshot names: `V17-01-original-upload-check.png`, `V17-02-secure-upload-rejected.png`, `V17-03-upload-validation-test.png`.",
        "V-20": "Original cashier account එකෙන් stock/GRN page open කර browser Network response එකේ `actual_cost`, `stock_price`, margin වගේ fields පෙන්වන්න. Secure employee response එකේ ඒ fields නැති බවත් admin response එකේ permitted බවත් පෙන්වන්න. Screenshot names: `V20-01-original-cost-leak.png`, `V20-02-secure-filtered-response.png`, `V20-03-response-filtering-code-test.png`.",
    },
    "Hamna": {
        "V-07": "Original invalid request එකක raw error/stack detail පෙන්වන්න. Secure exception handler, safe JSON response, production debug setting සහ configuration test පෙන්වන්න. Screenshot names: `V07-01-original-error-leak.png`, `V07-02-secure-safe-error.png`, `V07-03-error-handler-test.png`.",
        "V-08": "Original CORS wildcard config සහ unknown-origin response එක පෙන්වන්න. Secure allow-list config එක සහ unknown/configured origin tests පෙන්වන්න. Screenshot names: `V08-01-original-cors-wildcard.png`, `V08-02-secure-cors-allowlist.png`, `V08-03-cors-test.png`.",
        "V-09": "Original response headers සහ Secure response headers compare කරන්න. HSTS plain HTTP response එකේ නොයන බව cursor එකෙන් පෙන්වන්න. Screenshot names: `V09-01-original-headers.png`, `V09-02-secure-headers.png`, `V09-03-header-test.png`.",
        "V-12": "Before composer/npm audit files, updated audit files සහ CI workflow එක පෙන්වන්න. Package install commands live දිගට type නොකර prepared output භාවිතා කරන්න. Screenshot names: `V12-01-before-audit.png`, `V12-02-after-audit-zero.png`, `V12-03-dependency-ci.png`.",
        "V-15": "Original `vercel.json` API proxy target එකේ `http://` පෙන්වන්න. Secure file එකේ `https://` target එක පෙන්වා transport risk explain කරන්න. Screenshot names: `V15-01-original-http-proxy.png`, `V15-02-secure-https-proxy.png`, `V15-03-transport-code.png`.",
        "V-18": "Original frontend response headers සහ Secure frontend CSP/security headers browser Network panel එකෙන් පෙන්වන්න. Screenshot names: `V18-01-original-frontend-headers.png`, `V18-02-secure-csp-headers.png`, `V18-03-frontend-header-config.png`.",
        "TESTING": "Backend security suite, frontend tests, security lint, build, audit සහ GitHub Actions workflow පෙන්වන්න. `0/14` කියන්නේ attacks 14කින් exploit successful 0 කියන එක බව පැහැදිලි කරන්න. Screenshot names: `TEST-01-backend-suite.png`, `TEST-02-frontend-suite.png`, `TEST-03-runtime-zero.png`, `TEST-04-ci-workflow.png`.",
    },
}


CODE = {
    "Malith": {
        "V-04": [
            ("Validated and prohibited business fields", "demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/CustomerController.php", "$validated = $request->validate([\n    'credit_balance' => 'prohibited',\n    'customer_code' => 'prohibited',\n]);\n$customer->update($validated);", "189-216"),
            ("Business key is not mass assignable", "demo/secure/pubudu-pos-api-secure/app/Models/Customer.php", "protected $fillable = [\n    'full_name', 'phone_no', 'email',\n    // customer_code is deliberately absent\n];", "18-36"),
        ],
        "V-10": [
            ("Server-authoritative price check", "demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/InvoiceController.php", "$submitted = (float) $item['selling_price'];\n$authoritative = $this->resolveUnitSellingPrice($item);\nif (round($submitted, 2) !== round($authoritative, 2)) {\n    throw ValidationException::withMessages([\n        'selling_price' => 'Price differs from the catalogue.',\n    ]);\n}", "64-134 and 615-696"),
            ("Client sends only the minimum invoice payload", "demo/secure/pubudu-pos-front-end-secure/src/lib/invoicePayload.js", "return {\n    inv_date, customer_type, payment_status, items,\n    // totals, balance and credit allocations are server-owned\n};", "1-24 and 31-64"),
        ],
        "V-11": [
            ("Record the pre-cancellation financial state", "demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/InvoiceController.php", "$before = $invoice->only([\n    'total_amount', 'net_total', 'paid_amount'\n]);\nAuditLogger::record('invoice.cancelled', [\n    'old' => $before, 'subject' => ['invoice', $invoice->id],\n]);", "517-595"),
            ("Append-only audit model", "demo/secure/pubudu-pos-api-secure/app/Models/AuditLog.php", "protected static function booted(): void\n{\n    static::updating(fn () => throw new LogicException('Audit logs are append-only.'));\n    static::deleting(fn () => throw new LogicException('Audit logs are append-only.'));\n}", "48-65"),
        ],
    },
    "Nimthara": {
        "V-13": [
            ("Escape HTML context characters", "demo/secure/pubudu-pos-front-end-secure/src/lib/escapeHtml.js", "return String(value)\n  .replace(/&/g, '&amp;')\n  .replace(/</g, '&lt;')\n  .replace(/>/g, '&gt;')\n  .replace(/\"/g, '&quot;')\n  .replace(/'/g, '&#39;');", "54-63"),
            ("Security lint blocks unsafe sinks", "demo/secure/pubudu-pos-front-end-secure/eslint.security.config.js", "// document.write, innerHTML and dangerouslySetInnerHTML\n// are security-lint violations unless justified.", "55-76"),
        ],
        "V-14": [
            ("Ignore environment files", "demo/secure/pubudu-pos-front-end-secure/.gitignore", ".env\n.env.*\n!.env.example", "26-31"),
            ("CI rejects tracked environment files", "demo/secure/pubudu-pos-front-end-secure/.github/workflows/security.yml", "if git ls-files --error-unmatch .env; then\n  echo 'Environment files are tracked'; exit 1\nfi", "86-105"),
        ],
        "V-16": [
            ("Server is the source of truth for identity", "demo/secure/pubudu-pos-front-end-secure/src/contexts/AuthContext.jsx", "const response = await api.get('/me');\nsetUser(response.data.user);\n// Do not trust a cached client-side role.", "188-208"),
            ("Centralized token cleanup", "demo/secure/pubudu-pos-front-end-secure/src/lib/api.js", "if (response.status === 401) {\n    auth.clear();\n    sessionStorage.removeItem('user');\n}", "20-56"),
        ],
        "V-17": [
            ("Upload size, signature and extension checks", "demo/secure/pubudu-pos-front-end-secure/src/lib/validateUpload.js", "if (file.size > MAX_UPLOAD_BYTES) return invalid('File is too large.');\nif (!allowedExtensions.has(extension)) return invalid('Unsupported type.');\nif (!hasExpectedMagicBytes(file, extension)) return invalid('Invalid file signature.');", "35-39 and 75-185"),
        ],
        "V-20": [
            ("Hide cost fields by default", "demo/secure/pubudu-pos-api-secure/app/Models/Concerns/HidesCostFromEmployees.php", "public static function costFieldsVisibleTo(?User $user): bool\n{\n    return $user !== null && $user->role === 'admin';\n}", "94-128"),
            ("Response filtering is tested for both roles", "demo/secure/pubudu-pos-api-secure/tests/Feature/Security/ResponseFilteringTest.php", "$this->actingAs($employee)\n    ->getJson('/api/grns/stock')\n    ->assertJsonMissingPath('data.0.actual_cost');", "63-108"),
        ],
    },
    "Hamna": {
        "V-07": [
            ("Safe exception response", "demo/secure/pubudu-pos-api-secure/app/Exceptions/Handler.php", "return response()->json([\n    'success' => false,\n    'message' => 'An unexpected error occurred. Please try again later.',\n    'reference' => $reference,\n], 500);\n// Technical details stay in server logs.", "85-165"),
            ("Production-safe debug default", "demo/secure/pubudu-pos-api-secure/.env.example", "APP_ENV=production\nAPP_DEBUG=false", "11-23"),
        ],
        "V-08": [
            ("Allow-list CORS origins and fail closed", "demo/secure/pubudu-pos-api-secure/config/cors.php", "'allowed_origins' => array_values(array_filter(\n    array_map('trim', explode(',', (string) env('FRONTEND_URLS', '')))\n)),\n'supports_credentials' => false,", "37-69"),
        ],
        "V-09": [
            ("Conditional HSTS and security headers", "demo/secure/pubudu-pos-api-secure/app/Http/Middleware/SecurityHeaders.php", "$response->headers->set('X-Content-Type-Options', 'nosniff');\n$response->headers->set('X-Frame-Options', 'DENY');\n$response->headers->set('Cache-Control', 'no-store, private');\nif ($request->secure()) {\n    $response->headers->set('Strict-Transport-Security', 'max-age=31536000');\n}", "30-88"),
        ],
        "V-12": [
            ("Composer audit is a backend CI gate", "demo/secure/pubudu-pos-api-secure/.github/workflows/security.yml", "- name: composer audit\n  run: composer audit --no-interaction", "106-112"),
            ("npm audit is a frontend CI gate", "demo/secure/pubudu-pos-front-end-secure/.github/workflows/security.yml", "- name: npm audit\n  run: npm audit --audit-level=high", "70-75"),
            ("Before and after evidence", "evidence/before/composer-audit.txt and evidence/after/composer-audit.txt", "Before: 41 Composer advisories\nAfter: 0 Composer advisories\n\nBefore: 23 npm advisories\nAfter: 0 npm advisories", "lines 1-end in each evidence file"),
        ],
        "V-15": [
            ("Encrypted API proxy hop", "demo/secure/pubudu-pos-front-end-secure/vercel.json", "{\n  \"source\": \"/api/:path*\",\n  \"destination\": \"https://pubudutyres.codexpress.codes/api/:path*\"\n}", "18-22"),
        ],
        "V-18": [
            ("Frontend response security headers", "demo/secure/pubudu-pos-front-end-secure/vercel.json", "{\n  \"key\": \"Content-Security-Policy\",\n  \"value\": \"default-src 'self'; ...; frame-ancestors 'none'\"\n},\n{\n  \"key\": \"X-Content-Type-Options\",\n  \"value\": \"nosniff\"\n}", "28-45"),
        ],
        "TESTING": [
            ("Security-specific CI steps", "demo/secure/pubudu-pos-front-end-secure/.github/workflows/security.yml", "- name: Security lint\n  run: npm run lint:security\n- name: Unit tests\n  run: npm test\n- name: Production build\n  run: npm run build", "43-54"),
            ("Backend security suite", "demo/secure/pubudu-pos-api-secure/.github/workflows/security.yml", "- name: Security regression suite\n  run: php artisan test --testsuite=Security\n\n- name: Full test suite\n  run: php artisan test", "85-92"),
        ],
    },
}


MEMBERS = [
    {
        "key": "Malith",
        "name": "R.M.M.P. Bandara (Malith)",
        "folder": "Malith",
        "source": STUDY / "03-MALITH.md",
        "sections": ["V-04", "V-10", "V-11"],
        "english": MALITH_EN,
        "scope": "V-04, V-10 and V-11 - business integrity, pricing authority and auditability",
    },
    {
        "key": "Nimthara",
        "name": "R.M.K.N. Gunasena (Nimthara)",
        "folder": "Nimthara",
        "source": STUDY / "04-NIMTHARA.md",
        "sections": ["V-13", "V-14", "V-16", "V-17", "V-20"],
        "english": NIMTHARA_EN,
        "scope": "V-13, V-14, V-16, V-17 and V-20 - browser safety, upload validation and response confidentiality",
    },
    {
        "key": "Hamna",
        "name": "R.H.F. Hamna (Hamna)",
        "folder": "Hamna",
        "source": STUDY / "05-HAMNA.md",
        "sections": ["V-07", "V-08", "V-09", "V-12", "V-15", "V-18", "TESTING"],
        "english": HAMNA_EN,
        "scope": "V-07, V-08, V-09, V-12, V-15 and V-18 - configuration, transport, dependencies and CI",
    },
]


def make_footer(member_name: str):
    def footer(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
        canvas.line(18 * mm, 14 * mm, A4[0] - 18 * mm, 14 * mm)
        canvas.setFont("Nirmala", 7.5)
        canvas.setFillColor(colors.HexColor("#64748B"))
        canvas.drawString(18 * mm, 9 * mm, f"Pubudu Tire Management System - {member_name} video guide")
        canvas.drawRightString(A4[0] - 18 * mm, 9 * mm, f"Page {document.page}")
        canvas.restoreState()

    return footer


def build_member(member: dict) -> Path:
    source_text = member["source"].read_text(encoding="utf-8")
    output_dir = VIDEO / member["folder"]
    output_dir.mkdir(parents=True, exist_ok=True)
    output = output_dir / f"{member['folder']}-bilingual-video-guide.pdf"

    frame = Frame(18 * mm, 19 * mm, A4[0] - 36 * mm, A4[1] - 33 * mm, id="normal")
    document = BaseDocTemplate(
        str(output),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=17 * mm,
        bottomMargin=19 * mm,
        title=f"{member['name']} Bilingual Video Guide",
        author="Pubudu Tire Management System team",
    )
    document.addPageTemplates([PageTemplate(id="main", frames=frame, onPage=make_footer(member["key"]))])

    story = [Spacer(1, 18 * mm)]
    story.append(Paragraph(f"{member['key']} - Bilingual Security Video Guide", base.styles["CoverTitle"]))
    story.append(Paragraph("Sinhala action guide + English speech + code segments + test evidence", base.styles["CoverSubTitle"]))
    story.append(Spacer(1, 4 * mm))

    cover_data = [
        [Paragraph("Member", base.styles["Small"]), Paragraph(member["name"], base.styles["Small"])],
        [Paragraph("Original website", base.styles["Small"]), Paragraph("http://localhost:5174/login", base.styles["Small"])],
        [Paragraph("Secure website", base.styles["Small"]), Paragraph("http://localhost:5173/login", base.styles["Small"])],
        [Paragraph("Assigned scope", base.styles["Small"]), Paragraph(member["scope"], base.styles["Small"])],
    ]
    table = Table(cover_data, colWidths=[42 * mm, 125 * mm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E6F3F7")),
        ("BOX", (0, 0), (-1, -1), 0.6, colors.HexColor("#9CC7D6")),
        ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#C9DDE4")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    story.append(Paragraph("Common Sinhala guide", base.styles["SectionTitle"]))
    story.append(Paragraph("මුලින් මේ පොදු setup එක බලලා browser එක සූදානම් කරන්න", base.styles["Label"]))
    story.extend(base.markdown_flowables(COMMON_SI.splitlines(), "si"))
    story.append(Paragraph("Common English introduction", base.styles["Label"]))
    story.extend(base.markdown_flowables(COMMON_EN.splitlines(), "en"))

    for key in member["sections"]:
        sin_section = COMMON_SI.splitlines() if key == "TESTING" else base.section(source_text, f"## {key}")
        if key == "TESTING":
            sin_section = base.section(source_text, "## Security test suite and CI gate")
            sin_section += base.section(source_text, "## Tests කියවන්නේ කොහොමද?")
            sin_section += base.section(source_text, "## Local tutorial")
            sin_section += base.section(source_text, "## Video එකේ පෙන්වන්න")
        english_section = member["english"].get(key, "")
        if not sin_section or not english_section:
            continue
        story.append(Paragraph(f"{key} - Sinhala guide first, English speech underneath", base.styles["SectionTitle"]))
        story.append(Paragraph("Sinhala guide - මේ කොටස කරන විදිහ", base.styles["Label"]))
        action = ACTION_SI[member["key"]][key]
        story.extend(base.markdown_flowables(["### Video steps", action], "si"))
        story.extend(base.markdown_flowables(sin_section, "si"))
        story.append(Paragraph("English speech - read this in the video", base.styles["Label"]))
        story.extend(base.markdown_flowables(english_section.splitlines(), "en"))
        story.append(Paragraph("Key code segments and file locations", base.styles["Label"]))
        for entry in CODE[member["key"]].get(key, []):
            title, path, code = entry[:3]
            line_ref = entry[3] if len(entry) > 3 else None
            base.add_code_evidence(story, title, path, code, line_ref)

    story.append(Paragraph("Conclusion", base.styles["SectionTitle"]))
    story.append(Paragraph("Sinhala conclusion", base.styles["Label"]))
    story.extend(base.markdown_flowables(["මේ memberගේ assigned work එකේදී Original bug එක, Secure fix එක, code evidence එක සහ test result එක පැහැදිලිව පෙන්වන්න. තමන් ඇත්තටම කළ contribution එකට පමණක් claim කරන්න. Team-level test counts තමන්ගේ individual count ලෙස කියන්න එපා."], "si"))
    story.append(Paragraph("English conclusion - say this", base.styles["Label"]))
    story.extend(base.markdown_flowables(["“To conclude, I compared the Original behavior with the Secure behavior, explained the impact of each finding, and connected each fix to source code and automated test evidence. The controls are enforced at the correct boundary, and the remaining limitations are documented rather than hidden. Thank you.”"], "en"))
    story.append(Paragraph("Recording safety", base.styles["Label"]))
    story.extend(base.markdown_flowables([
        "- Passwords, bearer tokens, client secrets and personal Google accounts must stay hidden.",
        "- Use code and test evidence for destructive or unsafe attack steps.",
        "- Keep the cursor on the exact result or code line being discussed.",
    ], "en"))

    document.build(story)
    return output


if __name__ == "__main__":
    for member in MEMBERS:
        print(build_member(member))
