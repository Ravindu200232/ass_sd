# 02 — Ravinduගේ workstream: access control, login සහ Google OIDC

මෙම file එක Ravinduට **තේරුම් ගෙන විස්තර කිරීමට** සකසා ඇත. Branch එකක නමක් attribution proof එකක් නොවන නිසා viva එකේ සත්‍යයෙන් තමන් කළ/තේරෙන වැඩ පමණක් තමන්ගේ contribution ලෙස කියන්න.

## මුලින් කියන්න ඕන කතාව

“POS එකේ කෙනෙක් login වුණා කියලා එයාට හැම දේම කරන්න බැහැ. Original API එකේ login නොවූ කෙනෙකුට admin හදන්න පුළුවන් වුණා, login වූ cashierට admin routes යන්න පුළුවන් වුණා, තවත් branch එකක data බලන්නත් පුළුවන් වුණා. මම/අපේ workstream එක ඒ සීමා backend එකේ enforce කර Google OIDC sign-in එක් කළා.”

## V-01: public registration එකේ ප්‍රශ්නය

Original `/api/register` endpoint එක public. Request එකේ `role=admin` යවලා නව admin user සහ token එකක් ලබා ගත හැකි වුණා. මෙය **authentication නැතිව privilege ලැබීම**. Frontend එකේ register button එක නොපෙන්වා වැඩක් නැහැ; attackerට HTTP request එක කෙලින් යවන්න පුළුවන්.

Fix එක: `routes/api.php` හි registration route එක `auth:sanctum`, `active`, `admin` යන server middleware යටතට ගෙන ගියා. Admin staff record එකක් හදනවා; එම වෙලාවේ අලුත් staffගේ login token එක adminට දෙන්නේ නැහැ. Security test: anonymous request → `401`; cashier request → `403`; admin request → accepted, නමුත් අලුත් staff token එක response එකේ නැහැ.

```php
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::middleware('admin')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
    });
});
```

මෙය `routes/api.php` හි අදාළ nested structure එකේ සරල කළ කොටසකි. `auth:sanctum` token එක verify කරයි; `active` තව සේවයේ සිටීද බලයි; `admin` role එක බලයි. Order එකේ අරමුණ unauthenticated userගේ role එකක් බලන්න නොයෑමයි.

## V-02: role middleware තිබුණත් යොදා නැති ප්‍රශ්නය

Original project එකේ `admin` middleware class/register කළ code තිබුණා. නමුත් privileged routes වල එය apply කර තිබුණේ නැහැ. “Control එක ලියා තිබුණා” යන්න “control එක ක්‍රියාත්මකයි” යන්නට සමාන නැහැ. Cashierට user management, financial reporting, invoice cancel වැනි දේට පිවිසීමට අවස්ථාව තිබුණා.

Fix එක: routes admin/employee හැකියාව අනුව group කළා. `AccessControlTest.php` එකේ privileged endpoints සඳහා cashierට `403`, adminට සුදුසු access ලැබෙන බව පරීක්ෂා කරනවා. Viva එකේ routes දෙපසින් පෙන්වන්න: public login; authenticated staff; admin-only actions.

**Theory:** “Least privilege” කියන්නේ cashierට sale/stock lookup සඳහා අවශ්‍ය permissions පමණක් දීම. Client UI එක route hide කළත් API route එකට වෙනත් HTTP client එකකින් යා හැකි නිසා authorization check එක server route එකේම තිබිය යුතුයි.

## V-03: IDOR / branch separation

IDOR කියන්නේ object/record ID එකක් වෙනස් කර, තමන්ට අයිති නැති record එකක් ලබා ගැනීම. Colombo cashier කෙනෙක් Kandy customer ID එක request කළත් original API එකෙන් data ආවා. `Customer`, `Invoice` වැනි records වල query එක userගේ department/branch එකට scope කළා. Adminට සියලු branches අවශ්‍ය නම් ඒ හැකියාව ඉතිරි කළා; employeeට තම branch පමණයි. වෙනත් branch record එකක් සඳහා `404` දීමෙන් එය තිබෙන බවත් හෙළි නොවේ.

`app/Models/Concerns/ScopedToDepartment.php`, relevant controllers සහ `AccessControlTest.php` බලන්න. Tests: same-branch record පෙනේ; other-branch record නොපෙනේ; list/search endpoints ද scope වේ; department නැති employeeට කිසිවක් නොපෙනේ. “UI filter එක” නොව **database query/response authorization** යන්න මතක තබාගන්න.

```php
if (! $user || $user->department_id === null) {
    return $query->whereRaw('1 = 0');
}
if ($user->role === 'admin') {
    return $query;
}
return $query->where('customers.department_id', $user->department_id);
```

මෙය `ScopedToDepartment.php` හි policy එක මතක තබා ගැනීමට **සරල කළ** fragment එකකි. Actual implementation එක table name dynamic ලෙස ගන්නවා. User `null` නම් හෝ department නැත්නම් “all rows” නොව **zero rows** ලැබේ — safe default එක. Controller `->visibleTo($request->user())->find($id)` භාවිතා කර visible record නැත්නම් `404` දෙයි.

## V-05: login ආරක්ෂාව

Original login එකෙන් unknown username සහ wrong password වෙනස් messages ලෙස හෙළි වුණා (**enumeration**). Password guessing සීමා දුර්වලයි; `123456` වැනි password එකක් පිළිගත්තේය. Staffට current password දී තම password වෙනස් කිරීමේ safe path එකක් ද තිබුණේ නැහැ.

Fix: එකම generic login failure response, per-account/IP rate limiting (`429`), password-strength/breach checks, authenticated `change-password` route, password වෙනස් කළ පසු sessions revoke කිරීම. `AuthController.php`, `routes/api.php`, `AuthenticationTest.php` බලන්න. Rate-limit test එක deterministic විය යුතු නිසා breached-password check mock කර ඇති `fix/ravindu-hibp-test-isolation` test commit එකත් ඇත.

`AuthController::login()` හි user නැති විටත් dummy bcrypt hash එකක් සමඟ `Hash::check()` කරනවා; එවිට unknown username එකකට ඉතා ඉක්මනින් response දී username තිබේද කියා timing මඟින් හෙළි වීම අඩු කරයි. දුර්වල password සඳහා `Password::min(12)->mixedCase()->numbers()->symbols()->uncompromised()` යොදා ඇත. `uncompromised()` check එක external breached-password service එකට සම්බන්ධ නිසා test එකේ mock කර deterministic කර ඇත. Failed login audit record එකට password දමන්නේ නැහැ.

**Caution:** rate limit `429` ආවේ කීවැනි attempt එකේද යන්න fixture/config අනුව වෙනස් විය හැක. Evidence run එකේ 20 attempts වලින් පළමුවැනි 429 දෙවන attempt එකේ. Viva එකේ “threshold enforce වෙනවා” කියන්න; හැම deployment එකේම එකම attempt count කියා පොරොන්දු වෙන්න එපා.

## V-06: පරණ tokens

Original token එක expire නොවී, staff account deactivate කළත් පැරණි token එක භාවිතා කළ හැකි වුණා. `EnsureUserIsActive` middleware එක request එකක් එන සෑම අවස්ථාවකම user තව activeද බලයි; token expiry පැය 8ක් ලෙස config කළා. Login, logout-all, role/password change හා deactivation වලදී token revocation controls ද ඇත. Tests: deactivated user ඉදිරිපත් කරන still-recognized token එක middleware එකේදී `403`; කලින් revoke කළ token එක guard එකේදී `401` විය හැක. Old token reuse block වීමයි ප්‍රධාන දේ.

```php
if ($user && ! $user->is_active) {
    $user->tokens()->delete();
    return response()->json(['success' => false, 'message' => 'Account deactivated'], 403);
}
```

මෙය `EnsureUserIsActive.php` හි logic එකේ සරල fragment එකකි. Password login successful වූ විට `AuthController.php` පෙර tokens delete කර role අනුව `role:admin`/`role:employee` abilities සහිත නව token දෙයි. `config/sanctum.php` expiry control කරයි.

## Google OpenID Connect: feature එකේ සම්පූර්ණ flow

වැදගත් වෙනස: **OAuth** යනු authorization/delegation protocol; **OpenID Connect** OAuth මත identity (`ID token`) එක් කරන layer එක. මෙහි Google identity proof භාවිතා කරන්නේ POS staff login සඳහා. Google account එකක් තිබීම POS account එකක් ලැබීමට හේතුවක් නොවේ.

```text
React Login → GET /api/auth/google/redirect
Laravel → state + nonce + PKCE verifier සෑදීම; server cache තුළ විනාඩි 5 තැබීම
React → Google authorize page වෙත යාම
Google → /auth/callback?code=...&state=...
React → POST /api/auth/google/callback {code,state}
Laravel → state එක single-use ලෙස consume කිරීම
Laravel → Google token endpoint වෙත code + secret + verifier යැවීම
Laravel → ID token validate කිරීම → active pre-provisioned staff lookup
Laravel → role-scoped POS token; React → /dashboard
```

**state** callback එක server ආරම්භ කළ flow එකකට අයත්ද බලන CSRF protection. **nonce** ID token එක ඒ flow එකටම අයත්ද බලයි. **PKCE code verifier/challenge** authorization code එක සොරකම් කළත් වෙනත් කෙනෙකුට redeem කරන්න බැරි කරයි. `S256` challenge භාවිතා කරයි. Verifier සහ nonce server cache එකේ; browser එකේ client secret නැහැ. Callback state එක භාවිතා වූ පසු cache එකෙන් ඉවත් කර replay නවතයි.

`GoogleOidcService.php` ID token එකේ Google JWKS signature, `iss`, `aud` (අපේ client ID), `exp`/`iat`, `nonce`, `email_verified`, සහ configured නම් hosted domain claim පරීක්ෂා කරයි. `google_id`/OIDC `sub` යනු stable account identifier; email පමණක් සදාකාලික identity key එකක් නොවේ. `GoogleAuthController.php` අදාළ active staff record එක සොයයි. Unknown Google account එකට `403`; Google role claim එකෙන් admin role නොදේ.

```php
if (($claims['aud'] ?? null) !== config('services.google.client_id')) {
    throw new RuntimeException('ID token was issued for a different application.');
}
if (! isset($claims['nonce']) || ! hash_equals($expectedNonce, (string) $claims['nonce'])) {
    throw new RuntimeException('ID token nonce does not match this sign-in attempt.');
}
```

මේ දෙක `GoogleOidcService::verifyIdToken()` හි actual checks. `aud` නැත්නම් Google වෙන app එකකට දුන් signed token එකත් භාවිතා කළ හැක; `nonce` නැත්නම් කලින් flow එකක token replay කිරීමේ අවදානම වැඩි. Service එක `state` එක server cache තුළ විනාඩි 5 තබා `consumeFlow()` හි read කළ වහාම delete කරයි.

Frontend: `src/pages/Auth/Login.jsx` button එක; `src/lib/googleAuth.js` redirect/callback helper; `src/pages/Auth/GoogleCallback.jsx` callback page. React StrictMode effect දෙවරක් run විය හැකි බැවින් code එක second exchange එක වැළැක්වීමට ref භාවිතා කරයි. Callback URL එකේ spent code එක browser Back වලින් නැවත නොපෙන්වීමට dashboard navigation `replace` කරයි.

### Ravindu file map — flow එකේ අනුපිළිවෙළට කියවන්න

| Step | Exact repository-relative file | බලන්න ඕන තැන |
|---|---|---|
| HTTP routes | API `routes/api.php` | public `/login`, OIDC redirect/callback, authenticated/admin groups |
| Login/registration | API `app/Http/Controllers/Api/AuthController.php` | `login()`, `register()`, password rules, token issue/revoke |
| Staff active check | API `app/Http/Middleware/EnsureUserIsActive.php` | `handle()` හි inactive response |
| Branch visibility | API `app/Models/Concerns/ScopedToDepartment.php` | `scopeVisibleTo()` සහ `findVisible()` |
| Google handshake | API `app/Services/GoogleOidcService.php` | `beginFlow()`, `consumeFlow()`, `exchangeCode()`, `verifyIdToken()` |
| Google staff mapping | API `app/Http/Controllers/Api/GoogleAuthController.php` | callback හි `google_id`/email lookup, active user, POS token issue |
| Google UI | Web `src/pages/Auth/Login.jsx`, `src/lib/googleAuth.js`, `src/pages/Auth/GoogleCallback.jsx` | button → redirect → callback → session |
| Proof | API `tests/Feature/Security/AccessControlTest.php`, `AuthenticationTest.php`, `ConfigurationTest.php` | forbidden routes, branch, token, PKCE/state tests |

API root `D:\ass_sd\work\pubudu-pos-api-secure`; web root `D:\ass_sd\work\pubudu-pos-front-end-secure`.

## Live demo එකේ පෙන්වන්න

1. `routes/api.php` හි public, authenticated සහ admin route groups. “Cashier login වූ පමණින් admin නොවේ” කියන්න.
2. `AccessControlTest.php` හි employeeට admin endpoint `403`; වෙනත් branch customer `404`.
3. `AuthenticationTest.php` හි failed login throttled/inactive token tests.
4. Google login button → Google → callback → dashboard **සැබෑ configuration සමඟ කලින් test කර ඇති විට පමණක්**. Client ID, secret, POS bearer token, callback `code` screen share එකේ පෙන්වන්න එපා.
5. `GoogleOidcService.php` හි `aud` සහ `nonce` checks දෙක පෙන්වන්න. “Google විසින් sign කළා කියන එක පමණක් ප්‍රමාණවත් නැහැ; token එක අපේ app එකටම නිකුත් කළාද බලනවා” කියන්න.

## Commands සහ evidence

Backend repository `D:\ass_sd\work\pubudu-pos-api-secure` හි, **dedicated local testing database** setup කරලා:

```powershell
php artisan test --testsuite=Security
php artisan test --filter=AccessControlTest
php artisan test --filter=AuthenticationTest
php artisan test --filter=ConfigurationTest
```

Workspace එකේ ඉතිරි වූ `evidence/after/phpunit-security.txt` අනුව සම්පූර්ණ security suite එක **90 passed, 230 assertions**. මේ ගණන Ravinduට පමණක් අයත් tests ගණන නොව **මුළු backend security suite** එකේ ප්‍රතිඵලයයි. Google real round trip එක tests මඟින් පමණක් ඔප්පු නොවේ.

## Viva Q&A

**Q: Login වී සිටින cashierට admin route එක ඇයි තහනම්?**  
A: Authentication identity පමණයි. Authorization හි role බලන්න ඕන. ඒක server route middleware එකේ enforce කරනවා.

**Q: IDOR එක UI hide කිරීමෙන් විසඳෙන්නේ නැත්තේ ඇයි?**  
A: API request එක DevTools/curl මඟින් වෙනම යවන්න පුළුවන්. Backend query එක branch එකට scope විය යුතුයි.

**Q: `state`, `nonce`, PKCE අතර වෙනස?**  
A: `state` callback flow/CSRF, `nonce` ID token replay, PKCE code exchange possession check.

**Q: Google sign-in කරන ඕනෑම කෙනෙකුට access තියෙනවාද?**  
A: නැහැ. Admin කලින් provision කළ active staff record එකක් තිබිය යුතුයි; role එක අපේ database එකෙන් ගන්නවා.

**Q: JWT signature හරි නම් `aud` බලන්නේ ඇයි?**  
A: Google වෙන app එකකට නිකුත් කළ token එකත් නිවැරදිව sign කර තිබෙනවා. `aud` අපේ client ID නොවේ නම් එය මෙහි භාවිතා කරන්න බෑ.
