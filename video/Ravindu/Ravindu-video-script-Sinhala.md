# Ravinduගේ Security Video Script – සිංහලෙන්

මෙය video එක record කරන වෙලාවේ screen එක බලමින් කියවන්න පුළුවන් සරල script එකකි. හැම vulnerability එකකටම මුලින් **Original website** එක පෙන්වන්න. ඊට පස්සේ **Secure website** එක පෙන්වන්න. Original එකේ තිබුණු අවදානම සහ Secure එකේ කළ fix එක පැහැදිලිව compare කරන්න.

## Demo websites සහ login

- Original website: `http://localhost:5174/login`
- Secure website: `http://localhost:5173/login`
- Username: `cashier.colombo`
- Password: local demo password එක login form එකට type කරන්න. Password එක video එකේ පෙන්වන්න එපා; field එක masked තියාගන්න.
- Tabs දෙකක් තියාගන්න. Original tab එකෙන් Secure tab එකට යන්න `Ctrl + Tab` භාවිතා කරන්න.
- Screenshot එක ගන්න කලින් cursor එක පෙන්විය යුතු field/button/result එක උඩට ගෙන ගොස් තත්පර 2ක් නවත්වන්න.
- V-01 registration exploit එක සහ V-06 account deactivation එක live submit කරන්න එපා. Code සහ test එක පෙන්වීම ප්‍රමාණවත්.

## මුලින් කියන introduction එක

“මෙම video එකේදී අපි Pubudu Tire Management System එකේ security vulnerabilities කිහිපයක් compare කරනවා. මුලින් vulnerable Original version එකේ අවදානම පෙන්වනවා. ඊළඟට ඒක fix කළ Secure version එකේ result එක සහ source-code/test evidence පෙන්වනවා. මම live database එකට administrator account එකක් create කරන්නේවත්, seeded employee කෙනෙක් deactivate කරන්නේවත් නැහැ. ඒ වෙනුවට regression tests සහ code evidence භාවිතා කරනවා.”

---

## V-01 – Public Registration / Administrator Token Creation

### 1. Original website එක පෙන්වීම

1. Original tab එක open කරලා `http://localhost:5174/login` යන්න.
2. Login form එක හිස්ව තිබෙන විට cursor එක Username field එක උඩට ගෙන screenshot එක ගන්න:
   `V01-01-original-login-empty.png`
3. Username එක `cashier.colombo` ලෙස type කරලා screenshot එක ගන්න:
   `V01-02-original-username-filled.png`
4. Local demo password එක type කරලා field එක masked බව පෙන්වමින් screenshot එක ගන්න:
   `V01-03-original-password-filled.png`
5. **Sign In** click කරලා dashboard එක load වුණාට පස්සේ employee-access badge එක පෙන්වමින් screenshot එක ගන්න:
   `V01-04-original-dashboard.png`

### Original ගැන කියන වචන

“Original backend එකේ `/api/register` route එක public route එකක් ලෙස තිබුණා. Authentication එකක් නැති කෙනෙකුට registration request එකක් යවා role එක `admin` ලෙස ඉල්ලන්නත් token එකක් ලබාගන්නත් හැකියාව තිබුණා. ඒකෙන් attacker කෙනෙකුට administrator access ලබාගැනීමට උත්සාහ කළ හැකි නිසා මේක broken access control vulnerability එකක්. මේ අවදානම පෙන්වන්න exploit request එක submit කරන්නේ නැහැ; source code එක පමණක් පෙන්වනවා.”

### 2. Secure website එක පෙන්වීම

1. Secure tab එකට `Ctrl + Tab` කරලා `http://localhost:5173/login` open කරන්න.
2. Login form එකේ Google button එකත් තිබෙන secure login screen එක screenshot කරන්න:
   `V01-05-secure-login.png`
3. Secure API route file එක open කරලා registration route එක `auth:sanctum`, `active` සහ `admin` middleware ඇතුළේ තිබෙන කොටස පෙන්වන්න. Screenshot:
   `V01-06-secure-admin-route-group.png`
4. `tests/Feature/Security/AccessControlTest.php` එකේ `test_registration_is_not_reachable_without_authentication` test එක පෙන්වන්න. `assertStatus(401)` සහ database එකේ attacker user කෙනෙක් නැති බව පෙන්වමින් screenshot කරන්න:
   `V01-07-secure-registration-test.png`

### Secure ගැන කියන වචන

“Secure version එකේ `/register` public section එකෙන් ඉවත් කරලා administrator-only route group එක ඇතුළට දමා තිබෙනවා. ඒ නිසා unauthenticated request එකකට 401 response එකක් ලැබෙනවා. Authenticated employee කෙනෙකුටත් registration කරන්න බැහැ. Regression test එක 401 status එකත් attacker account එක database එකට නොඑන බවත් verify කරනවා.”

### පෙන්විය යුතු code point

```php
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::middleware('admin')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
    });
});
```

---

## V-02 – Missing Role Authorization / Profit Report

### 1. Original website එකේ bug එක

1. Original tab එකට මාරු වෙලා login කරලා තිබෙන cashier account එකෙන්:
   `http://localhost:5174/sales/profit` open කරන්න.
2. Report එක load වන තෙක් ඉන්න. **Revenue, Cost, Profit, Margin** values පෙන්වන තැන screenshot කරන්න:
   `V02-01-original-employee-profit-report.png`
3. ඒ values පෙන්වන තැන් cursor එකෙන් point කරලා මේ වචන කියන්න.

### Original ගැන කියන වචන

“මම මෙතන login වෙලා ඉන්නේ administrator කෙනෙක් ලෙස නොවෙයි, Colombo cashier කෙනෙක් ලෙසයි. ඒත් original website එකේ `/sales/profit` URL එක direct open කළාම Revenue, Cost, Profit සහ Margin report එක පෙන්වනවා. Login වී සිටීම authentication එකක් පමණයි; administrator permission එකක් තිබෙනවා කියන එක නොවෙයි. Original frontend route එකේ `ProtectedRoute` පමණක් තිබුණු නිසා role check එක අමතක වී තිබුණා.”

### 2. Secure website එකේ fix එක

1. Secure tab එකට මාරු වෙලා `http://localhost:5173/sales/profit` open කරන්න.
2. Employee account එකට report එක නොපෙන්වා dashboard එකට redirect වෙන බව පෙන්වන්න. Dashboard URL සහ employee-access badge එක point කරලා screenshot කරන්න:
   `V02-02-secure-profit-denied.png`
3. Secure frontend `src/App.jsx` එකේ `ProtectedRoute adminOnly={true}` පෙන්වන්න:
   `V02-04-secure-admin-route.png`
4. Secure API route file එකේ financial report routes admin middleware group එක ඇතුළේ තිබෙන බවත්, `AccessControlTest.php` එක employee request එකකට 403 expect කරන බවත් පෙන්වන්න:
   `V02-05-secure-access-control-test.png`

### Secure ගැන කියන වචන

“Secure version එකේ frontend route එකට `adminOnly={true}` දමා employee කෙනෙකුට report page එක open වීම නවත්වලා තිබෙනවා. ඒක පමණක් නොවෙයි, backend API එකේ financial report routes administrator middleware group එක ඇතුළේ දමා තිබෙනවා. ඒ නිසා address bar එකෙන් direct URL එකක් දුන්නත් UI එක bypass කරලා data ගන්න බැහැ. Test එක employee request එකකට 403 response එකක් සහ administrator request එකකට 200 response එකක් verify කරනවා.”

### පෙන්විය යුතු code point

```jsx
<Route
  path="/sales/profit"
  element={
    <ProtectedRoute adminOnly={true}>
      <Layout>
        <ProfitReport />
      </Layout>
    </ProtectedRoute>
  }
/>
```

---

## V-03 – Cross-Branch Customer IDOR / BOLA

### 1. Original website එකේ bug එක

1. Original tab එකේ `http://localhost:5174/customers` open කරන්න.
2. Employee badge එකේ `Kamal Silva (Colombo Cashier)` සහ `Colombo Main Branch` පෙන්වන්න. Customer list එක load වූ පසු screenshot කරන්න:
   `V03-01-original-customer-list.png`
3. Search field එක හිස්ව තිබෙන විට cursor එක field එක උඩට ගෙන screenshot කරන්න:
   `V03-02-original-search-empty.png`
4. Search field එකට `Dilani Wickramasinghe` type කරන්න. Result එකේ customer name සහ **Kandy Branch** පෙන්වෙන විට screenshot කරන්න:
   `V03-03-original-cross-branch-result.png`
5. Edit හෝ Delete click කරන්න එපා. Result name එක සහ Kandy Branch එක cursor එකෙන් පෙන්වන්න.

### Original ගැන කියන වචන

“මෙහි login වී සිටින user Colombo branch cashier කෙනෙක්. නමුත් search එකෙන් Kandy Branch customer කෙනෙකුගේ record එක සහ credit information පෙන්වනවා. මේක cross-branch object-level authorization failure එකක්, IDOR හෝ BOLA ලෙස හඳුන්වන්න පුළුවන්. User කෙනාට customer ID එකක් හෝ නමක් දැනගත්තොත් වෙනත් branch එකක record එකක් බලන්න හැකි වීම තමයි අවදානම.”

### 2. Secure website එකේ fix එක

1. Secure tab එකේ `http://localhost:5173/customers` open කරන්න.
2. Customer list එක load වූ පසු screenshot කරන්න:
   `V03-04-secure-customer-list.png`
3. එම search field එකටම `Dilani Wickramasinghe` type කරන්න.
4. **No customers found** සහ එකම search text එක පෙන්වන විට screenshot කරන්න:
   `V03-05-secure-no-result.png`
5. Code evidence ලෙස `CustomerController.php` හි `visibleTo($request->user())`, `Customer.php` හි `ScopedToDepartment` සහ concern එකේ department query එක පෙන්වන්න. Test එකේ cross-branch request එක 404 වෙන බව screenshot කරන්න:
   `V03-06-secure-controller-scope.png`
   `V03-07-secure-customer-model.png`
   `V03-08-secure-department-scope.png`
   `V03-09-secure-cross-branch-test.png`

### Secure ගැන කියන වචන

“Secure version එකේ customer list එක සහ individual customer lookup එක දෙකම employee department එක අනුව filter කරනවා. Colombo cashier කෙනෙක් Kandy customer කෙනෙක් search කළාම result එකක් නොලැබෙනවා. Backend එක `visibleTo()` scope එක භාවිතා කරනවා. Employee කෙනෙකුට වෙනත් branch record එකක් ID එකෙන් direct ඉල්ලුවත් record එක තිබෙන බව හෙළි නොකර 404 response එකක් ලැබෙනවා. Test එක name සහ credit balance response එකේ නැති බවත් verify කරනවා.”

### පෙන්විය යුතු code point

```php
$customer = Customer::with('department')
    ->visibleTo($request->user())
    ->find($id);
```

---

## V-05 – Authentication Weaknesses

මෙහි password attempts live demo එකේ ඉතා සීමිතව පමණක් කරන්න. Password එක screen එකේ පෙන්වන්න එපා. Toast message එක ඉක්මනින් disappear වුණොත් ඒක screenshot එකේ පෙනෙනවා කියලා කියන්න එපා; code සහ tests වලින් exact result එක පෙන්වන්න.

### 1. Original website එක

1. Original tab එකෙන් logout කරලා login page එක පෙන්වන්න. Screenshot:
   `V05-01-original-login-empty.png`
2. Username ලෙස `unknown.demo.user` සහ harmless wrong password එකක් type කරලා screenshot කරන්න:
   `V05-02-original-unknown-input.png`
3. **Sign In** click කරලා response state එක screenshot කරන්න:
   `V05-03-original-unknown-response.png`
4. නැවත username ලෙස `cashier.colombo` දාලා එම wrong password එක type කරන්න. Screenshot:
   `V05-04-original-known-input.png`
5. **Sign In** click කරලා response state එක screenshot කරන්න:
   `V05-05-original-known-response.png`
6. Original `AuthController.php` code එක පෙන්වන්න. Unknown username එකට 404 message එකක්, known username එකට wrong password 401 message එකක් යන කොටස් පෙන්වන්න:
   `V05-09-original-enumeration-code.png`

### Original ගැන කියන වචන

“Original backend එක unknown username එකකට ‘username does not exist’ කියලා වෙනම 404 response එකක් දෙනවා. Existing username එකකට wrong password දුන්නාම ‘password is incorrect’ කියලා වෙනම 401 response එකක් දෙනවා. ඒ නිසා attacker කෙනෙකුට password guess කිරීමට කලින් valid usernames හඳුනාගන්න පුළුවන්. මේක username enumeration vulnerability එකක්. Brute-force attempts සඳහා login-specific rate limit එකක් තිබුණේ නැහැ.”

### 2. Secure website එක

1. Secure tab එකේ secure login page එක පෙන්වන්න:
   `V05-06-secure-login-empty.png`
2. `unknown.demo.user` සහ එම wrong password එක type කර submit කරන්න. Screenshot:
   `V05-07-secure-unknown-response.png`
3. `cashier.colombo` සහ එම wrong password එක type කර submit කරන්න. Screenshot:
   `V05-08-secure-known-response.png`
4. Secure `AuthController.php` හි dummy hash check සහ generic message එක පෙන්වන්න:
   `V05-10-secure-generic-login-code.png`
5. `routes/api.php` හි `throttle:login` route එක සහ authentication tests පෙන්වන්න:
   `V05-11-login-throttle-route.png`
   `V05-12-enumeration-test.png`
   `V05-13-bruteforce-test.png`

### Secure ගැන කියන වචන

“Secure backend එක unknown username සහ wrong password දෙකටම එකම 401 status එක සහ එකම generic message එක භාවිතා කරනවා. User record එක නොතිබුණත් dummy hash එකක් check කරන නිසා timing difference එක අඩු කරනවා. Login route එක username සහ IP අනුව throttle කරලා repeated attempts 429 ලෙස refuse කරනවා. Regression tests දෙකම response equality සහ brute-force protection verify කරනවා. ඒ නිසා valid usernames leak වීමත් unlimited password spraying එකත් අවම කරනවා.”

### පෙන්විය යුතු code point

```php
$passwordValid = $user
    ? Hash::check($request->password, $user->password)
    : Hash::check($request->password, self::DUMMY_HASH);

if (! $user || ! $passwordValid) {
    return response()->json([
        'message' => 'The username or password is incorrect.',
    ], 401);
}
```

---

## V-06 – Token and Session Lifecycle

මෙය live account එක deactivate නොකර code/test evidence වලින් පෙන්වන්න.

1. කලින් ගත් successful dashboard/session screenshot එක පෙන්වන්න:
   `V06-00-login-session-context.png`
2. Original AuthController සහ `config/sanctum.php` පෙන්වන්න. Token create කරන code එක සහ `'expiration' => null` පෙන්වන්න:
   `V06-01-original-session-code.png`
3. Secure `EnsureUserIsActive.php` middleware එකේ inactive user check, token delete සහ 403 response පෙන්වන්න:
   `V06-02-secure-active-middleware.png`
4. Secure `AuthController.php` හි deactivation, role, password සහ username change වෙද්දී `$user->tokens()->delete()` කරන block එක පෙන්වන්න:
   `V06-03-secure-token-revocation.png`
5. `AuthenticationTest.php` හි deactivation කල පසු token count 0 වෙන test එක පෙන්වන්න:
   `V06-04-secure-token-test.png`
6. `config/sanctum.php` හි finite expiration value එක `480` minutes බව පෙන්වන්න:
   `V06-05-token-expiration.png`

### V-06 කියන වචන

“Original version එකේ user login වුණාම bearer token එකක් ලැබුණා. User account එක පසුව deactivate කළත් කලින් නිකුත් කළ token එක revoke නොවූ අතර Sanctum expiration එකත් null වුණා. ඒ නිසා token එක දිගටම භාවිතා කළ හැකි අවදානම තිබුණා. Secure version එක protected request එකකට පෙර user active ද කියලා check කරනවා. Deactivate, role change, password change හෝ username change කළාම existing tokens delete කරනවා. තවද token එකට පැය අටක finite expiration එකක් දාලා තිබෙනවා. Test එක deactivation කල පසු කලින් තිබූ token count එක zero බව verify කරනවා.”

---

## Google OpenID Connect – Secure login evidence

1. Secure login page එකේ **Sign in with Google** button එක පෙන්වන්න. Screenshot:
   `OIDC-01-secure-google-button.png`
2. Local Google client configuration නැත්නම් button එක click කරලා personal Google account එකකට යන්න එපා.
3. `GoogleOidcService.php` හි `state`, `nonce`, `code_verifier`, SHA-256 `code_challenge` සහ server-side cache storage පෙන්වන්න.
4. `GoogleAuthController.php` හි state consume කිරීම, code exchange කිරීම සහ ID token verify කිරීම පෙන්වන්න. Code screenshot එකේ personal client secret, token හෝ Google account එක පෙන්වන්න එපා.

### OIDC කියන වචන

“Secure Google sign-in එක Authorization Code flow සහ PKCE භාවිතා කරනවා. `state` value එක CSRF protection සඳහාත්, `nonce` replay protection සඳහාත්, `code_verifier` PKCE proof එක සඳහාත් භාවිතා කරනවා. Verifier සහ nonce browser එකට නොදී server-side cache එකේ තබනවා. Callback එකේ state එක single-use ලෙස consume කරලා authorization code එක server-side exchange කරනවා. අවසානයේ ID token එකේ signature, issuer, audience, expiry සහ nonce validate කරලා පමණක් staff account එකට sign in කරනවා.”

---

## අවසාන conclusion එක

“මෙම comparison එකෙන් පෙනෙන්නේ authentication එක පමණක් ප්‍රමාණවත් නොවන බවයි. Role authorization, department isolation, safe error messages, rate limiting සහ token lifecycle controls ද backend එකේ enforce කළ යුතුයි. Original version එකේ live browser result එකෙන් bug එක පෙන්වා, Secure version එකේ browser result, source code සහ automated regression test තුනෙන් fix එක verify කළා. V-04 Malithගේ assigned scope එකක් නිසා මේ video එකේ මම V-04 claim කරන්නේ නැහැ.”

## Final checklist

- [ ] Original tab සහ Secure tab දෙකම video එකේ පැහැදිලිව වෙන වෙනම පෙන්වා ඇත.
- [ ] Username පමණක් visible; password fields හැමවිටම masked.
- [ ] V-01 registration request එක submit කරලා attacker account එකක් create කරලා නැහැ.
- [ ] V-06 seeded employee කෙනෙක් deactivate කරලා නැහැ.
- [ ] Original browser result → vulnerability explanation → secure browser result → code/test fix කියන order එක හැම section එකකම තියෙනවා.
- [ ] Screenshot file names script එකේ දී ඇති names වලට match වෙනවා.
