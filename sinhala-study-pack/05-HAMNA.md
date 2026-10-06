# 05 — Hamnaගේ workstream: configuration, transport, dependencies, tests සහ CI

මෙය Hamnaට අදාළ ලෙස නම් කළ workstream එකේ **why → code → flow → test** guide එකකි. සත්‍යයෙන් කළ දේ පමණක් තමන්ගේ contribution ලෙස කියන්න. Hamna branch එකෙන් මුලින් backend security tests **74ක්** එක් කර ඇති අතර පසුව අනෙක් workstreams එකතු වී දැනට මුළු backend suite එක **90**කි.

## මූලික අදහස

Security bug එකක් application business code එකේ පමණක් නොව **deployment configuration, HTTP transport, package versions සහ missing automated gates** තුළත් තිබිය හැක. Fix එක වරක් කිරීම සහ අනාගත commit එකකින් නැවත එන්න නොදීම අතර වෙනස CI/testing එකයි.

## V-07 — errors, logs සහ source disclosure

Original API එකේ error responses raw SQL/framework/stack details හෙළි කළ හැකි වුණා. වැරදි input එකකට `500` දෙමින් internal model/class/path names පිටට යාම attackerට system එක තේරුම් ගැනීමට උදව්. Safe response එකේ userට අවශ්‍ය message/status පමණයි; developerට අවශ්‍ය detail server log එකේ පමණයි. `app/Exceptions/Handler.php` හා controllers හි error handling වෙනස් කර safe JSON contract එකක් කළා. `.env.example` production-safe defaults හා backend `.htaccess` hardening ද ඇත.

**ඉතිරි සීමාව:** Production web server document-root project directory එකට වැටී තිබේ නම් `public/` වෙත නිවැරදිව මාරු කිරීම hosting panel access අවශ්‍යයි. ඒ නිසා “source disclosure 100% infrastructure level එකෙන් විසඳා අවසන්” කියන්න එපා; `NF-5` බලන්න.

### Flow එක

```text
Bad request / missing record / internal exception
   → Laravel exception handler
   → safe HTTP status + generic JSON to browser
   → technical details server log තුළ
```

`tests/Feature/Security/ConfigurationTest.php` හි unhandled error හා missing record මඟින් internals නොපෙනෙන බව test කරයි.

## V-08 — CORS wildcard

**CORS** යනු browser එකක script එක වෙනත් origin එකක API response කියවීමට අවසර දෙන policy එක. Original `config/cors.php` හි `allowed_origins => ['*']` තිබුණා. ඕනෑම website origin එකකට API cross-origin response කියවීමට browser අවසර දිය හැකි වුණා. **CORS එක login/authorization වෙනුවට යොදාගත නොහැක**; `curl`/server-to-server requests CORS මඟින් නවත්වන්නේ නැහැ. එහෙත් trusted frontend origins පමණක් allow කිරීම defence-in-depth.

```php
'allowed_origins' => array_values(array_filter(
    array_map('trim', explode(',', (string) env('FRONTEND_URLS', '')))
)),
'supports_credentials' => false,
```

`FRONTEND_URLS` හි comma-separated approved origins. එය හිස් නම් wildcard එකකට fallback නැහැ — **fail closed**. Methods/headers ද API භාවිතා කරන දේට සීමා කළා. `ConfigurationTest.php`: unknown origin → `Access-Control-Allow-Origin` නොලැබේ; configured frontend origin → allow; cross-origin credentials false.

## V-09 — backend response headers

`app/Http/Middleware/SecurityHeaders.php` global middleware එකක් ලෙස `app/Http/Kernel.php` හි තිබේ. Global කියන්නේ normal route response පමණක් නොව 404/429/error response ද cover කිරීමටයි. යවන headers:

| Header | අදහස |
|---|---|
| `X-Content-Type-Options: nosniff` | JSON එක HTML ලෙස browser අනුමාන නොකරයි |
| `X-Frame-Options: DENY` | API/error page frame තුළ නොදමයි |
| `Content-Security-Policy` | API context එකට `default-src 'none'` ආකාරයේ දැඩි policy |
| `Referrer-Policy: no-referrer` | API URL/record IDs වෙන site එකට නොයවයි |
| `Cache-Control: no-store, private` | Sensitive response shared cache වලට නොයවයි |
| `Strict-Transport-Security` | **HTTPS request වල පමණක්** යවයි |

**Theory:** HSTS local plain HTTP response එකට යවන්නේ නැහැ; TLS නැති development server එකේ එය අර්ථ විරහිතයි. Header එකක් යැවීම තනිව vulnerability fix එකක් නොවේ; V-13 XSS සඳහා output escaping, V-01 auth සඳහා route middleware තව අවශ්‍යයි.

```php
if ($request->secure()) {
    $response->headers->set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
    );
}
```

මෙය `SecurityHeaders.php` හි condition එක. `secure()` true නම් පමණයි HSTS යන්නේ. `ConfigurationTest.php` හි HTTP response එකට HSTS නොයන බවත් normal/error responses වල ඉතිරි headers යන බවත් බලයි.

## V-12 — outdated packages සහ advisories

Original backend Laravel 10 + dependencies වල **Composer advisories 41ක්**; frontend npm advisories **23ක්**. Package advisory කියන්නේ ඒ version එකට අදාළ known security issue එකක්. `composer.json`/`composer.lock` upgrade කර Laravel 12 line එකට ගෙන ගියා; frontend `package.json`/`package-lock.json` හි affected packages update කළා. Spreadsheet parser හා PDF library ද සැලකිලිමත් වුණා. Dependency update එකෙන් security benefit තිබුණත් breaking changes තිබිය හැකි නිසා tests/build එක අවශ්‍යයි.

Evidence: `evidence/before/composer-audit.txt`, `evidence/after/composer-audit.txt`, `evidence/before/npm-audit.txt`, `evidence/after/npm-audit.txt`. දැනට saved output අනුව **41 → 0** සහ **23 → 0**. මෙය “අනාගතයේ කිසි vulnerability එකක් නෑ” කියන පොරොන්දුවක් නොවේ; package advisories කාලය සමඟ වෙනස් වෙයි.

## V-15 — frontend proxy එකෙන් plain HTTP

`web/vercel.json` තුළ `/api/:path*` rewrite target එක original ලෙස `http://...` තිබුණා. Frontend එක browserට HTTPS තිබුණත් proxy සිට APIට යන **ඊළඟ hop** plain HTTP නම් bearer token හා customer/sales data ඒ hop එකේ encrypt නොවේ. Fix එක API target `https://...` කිරීම. මෙය **transport security**. HTTPS certificate/hosting setup deployment එකේ තව verify කළ යුතුයි.

## V-18 — frontend headers සහ CSP

`web/vercel.json` හි frontend pages සඳහා `Content-Security-Policy`, HSTS, `nosniff`, frame/referrer/permissions policies එක් කළා. Backend JSON API policy එක සහ frontend SPA policy එක වෙනස්; frontendට තම scripts, fonts, API connection අවශ්‍යයි. CSP එක V-13 XSSට අමතර ආරක්ෂාවක්; unsafe HTML interpolation තවම escape කළ යුතුයි. Browser DevTools Network response headers තුළ මෙය පෙන්විය හැක.

## Security test suite සහ CI gate

Hamnaගේ backend `feat/hamna-security-test-suite` branch එකේ tests 74ක initial regression suite සහ CI security gate. පසුව Nimtharaගේ V-20 16 tests එක් වීමෙන් මුළු backend suite එක **90 pass / 230 assertions**. Suite files:

- `tests/Feature/Security/AccessControlTest.php`: registration, employee/admin permissions, branch visibility.
- `tests/Feature/Security/AuthenticationTest.php`: login failure, guessing throttle, weak passwords, expiry/revocation.
- `tests/Feature/Security/BusinessIntegrityTest.php`: debt, price, discount approval, audit.
- `tests/Feature/Security/ConfigurationTest.php`: headers, CORS, errors, OIDC state/PKCE.
- `tests/Feature/Security/SecurityTestCase.php`: reproducible fixtures/helpers.
- `tests/Feature/Security/ResponseFilteringTest.php`: V-20 සඳහා පසුව එක් කළ 16 tests.

Backend `.github/workflows/security.yml`: PHP setup, dedicated MySQL test DB, migrations, PHPUnit security/full suites, Composer audit සහ secret/config checks. Frontend `.github/workflows/security.yml`: `npm ci`, `npm run lint:security`, `npm test`, `npm run build`, `npm audit --audit-level=high`, `.env` trackedද බැලීම/gitleaks. Workflow push/PR මත ක්‍රියා කරන නිසා future regression එකක් merge කිරීමට පෙර අල්ලාගන්න උත්සාහ කරයි.

```yaml
- name: Security lint
  run: npm run lint:security
- name: Unit tests
  run: npm test
- name: Production build
  run: npm run build
```

මේ web workflow එකේ actual steps වල කෙටි excerpt එකකි. එකක් fail වුණොත් job එක green වෙන්නේ නැහැ. වෙනම dependency job එකේ npm audit, secrets job එකේ tracked `.env` check සහ gitleaks ඇත. Backend workflow එකේ PHPUnit හා Composer audit equivalents ඇත.

`eslint.security.config.js` හි `document.write`, `innerHTML`, dangerous HTML, token-from-localStorage වැනි dangerous patterns සඳහා rule ඇත. Full historical lint errors ~126ක් ඉතිරි (`NF-6`), ඒවා security gate එකෙන් වෙනම තබා ඇත. **Security lint pass** යන්න **full lint clean** යන්නට සමාන නැහැ.

## Tests කියවන්නේ කොහොමද?

```text
Before evidence: attack එක original code එකට සාර්ථකයි.
After runtime suite: attacks 14න් සාර්ථක වන ගණන 0.
PHPUnit: positive/negative security assertions 90 tests pass.
Vitest: frontend unit tests 19 pass.
```

“0/14” කියන්නේ **tests 14 fail** කියන එක නොවේ. එය **14 attack attempts අතරින් exploit හැකි ගණන 0** කියන එක. PHPUnit/Vitest pass counts වෙනම. මෙය viva එකේ පැහැදිලිව කියන්න.

## Local tutorial (test database පමණක්)

Backend `D:\ass_sd\work\pubudu-pos-api-secure` හි `.env.testing`/`phpunit.xml` dedicated database එකට point වෙන බව තහවුරු කර:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-api-secure'
php artisan test --testsuite=Security
composer audit
```

Frontend `D:\ass_sd\work\pubudu-pos-front-end-secure`:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-front-end-secure'
npm run lint:security
npm test
npm run build
npm audit
```

CI screen එකේ workflows greenද කියා GitHub Actions හි බලන්න. Local pass වුණා කියා CI pass වී ඇති බව නොකියන්න; repository Actions page එකේ සැබෑ status බලන්න. `migrate:fresh` වැනි destructive command production database එකකට run කරන්න එපා.

## Video එකේ පෙන්වන්න

1. `config/cors.php` wildcard ඉවත් වූ තැන සහ unknown-origin test.
2. `SecurityHeaders.php` global middleware; HTTPS condition සහ response headers.
3. `vercel.json` API target `https://` සහ frontend CSP.
4. Backend 90/230, frontend 19 pass සහ after runtime `Still exploitable: 0` summary.
5. GitHub Actions/security workflow files. Actions run status සාර්ථක නම් පමණක් green run එක පෙන්වන්න.

## Viva Q&A

**Q: CORS security authentication එකක්ද?**  
A: නැහැ. Browser cross-origin response sharing policy එකක්. Server-side auth/role rules වෙනම අනිවාර්යයි.

**Q: HSTS HTTP local test එකේ නොපෙනෙන්නේ ඇයි?**  
A: HSTS HTTPS connection සඳහා. Middleware එක secure request එකක් නම් පමණක් යවයි.

**Q: `npm audit 0` කියන්නේ secure app එකක් 100%ද?**  
A: නැහැ. Known dependency advisories එම scan එකට අනුව 0. Business logic/XSS/access bugs වෙනම test කළ යුතුයි.

**Q: `0/14` කියන්නේ සියලු tests fail වුණාද?**  
A: නැහැ. Attack attempts 14 අතරින් exploit successful ගණන 0; backend unit/integration tests 90 pass හා frontend tests 19 pass.

**Q: Full lint errors ඉතිරි නම් security gate pass කියන්නේ කොහොමද?**  
A: Security-specific lint rules clean. පරණ non-security lint maintenance item `NF-6` ලෙස පැහැදිලිව වාර්තා කළා.
