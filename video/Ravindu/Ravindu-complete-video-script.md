# Ravindu — complete vulnerability comparison video script

**Target length:** 8–10 minutes  
**Language:** English voice-over  
**Tabs:** original `5174` and secure `5173`  
**Cursor:** point to the item named in each step and circle it twice slowly.

## Opening — 20 seconds

**Screen:** Original login page, then secure login page. Keep the two tabs visible in the browser tab bar.

**Say:**

> Hello, I am Ravindu. My assigned security work covers V-01, V-02, V-03, V-05 and V-06, together with the Google OpenID Connect login flow. I will compare the original implementation with the secured implementation. For every issue, I will first show the original behaviour, then the protection and test evidence in the secured version. I will not create an administrator or deactivate a real demo employee during this recording.

## V-01 — public registration could create an administrator

### Original browser preparation

1. On the original tab, navigate to `http://localhost:5174/login`.
2. Screenshot: `V01-01-original-login-empty.png`. Point to the public login form.
3. Fill the demo cashier username. Screenshot: `V01-02-original-username-filled.png`.
4. Fill the password. Keep it masked. Screenshot: `V01-03-original-password-filled.png`.
5. Click **Sign In**. Screenshot: `V01-04-original-dashboard.png`. Point to the employee dashboard.

**Say:**

> The normal web login is available to an employee, but V-01 is an API-level registration problem. The original browser does not need to expose a registration link for the API route to be reachable by a direct request.

### Original code evidence

Open `demo/original/pubudu-pos-api/routes/api.php` around line 28.

**Point to:** the public `POST /register` route and the registration controller call. Then open the original `app/Http/Controllers/Api/AuthController.php` and point to the code that accepted the role and returned a token.

**Say:**

> In the original backend, registration was outside the authenticated administrator boundary. A caller could submit registration data, including an administrator role, and receive a session token. I am showing the route and controller as evidence, but I am not submitting the exploit because it would create an unwanted administrator in the local database.

### Secured comparison

1. Press `Ctrl+Tab` to the secure tab.
2. Navigate to the secure login page if necessary. Screenshot: `V01-05-secure-login.png`.
3. Show the secure route file `demo/secure/pubudu-pos-api-secure/routes/api.php` around lines 189–205.
4. Screenshot: `V01-06-secure-admin-route-group.png`. Circle the authenticated, active-user and admin middleware.
5. Show `tests/Feature/Security/AccessControlTest.php` around `test_registration_is_not_reachable_without_authentication`.
6. Screenshot: `V01-07-secure-registration-test.png`. Circle the expected `401` response.

**Say:**

> In the secured version, registration is inside the authenticated and administrator-only route group. An unauthenticated request is rejected, and an administrator creates a staff account without receiving that new account's session. The regression test proves the public path is closed.

## V-02 — privileged routes did not consistently enforce role checks

### Original live screen

1. On the original tab, keep the employee session active and navigate to `http://localhost:5174/sales/profit`.
2. Screenshot: `V02-01-original-employee-profit-report.png`. Point to Revenue, Cost, Profit and Margin.

**Say:**

> I am logged in as an ordinary Colombo cashier. In the original version, the employee can open the profit report and see company financial figures. Authentication confirms that the user is logged in, but it does not prove that the user is an administrator.

### Secured live screen

1. Press `Ctrl+Tab` to the secure tab.
2. Navigate to `http://localhost:5173/sales/profit`.
3. Wait for the redirect and screenshot: `V02-02-secure-profit-denied.png`. Point to the dashboard URL and employee role.

**Say:**

> With the same employee account, the secured frontend does not allow this administrator-only page. The request is redirected away from the privileged page.

### Code and test evidence

Show these in order:

- Original `pubudu-pos-front-end/src/App.jsx`, `/sales/profit` route without `adminOnly`.
- Secure `pubudu-pos-front-end-secure/src/App.jsx`, `/sales/profit` route with `ProtectedRoute adminOnly={true}`.
- Secure `pubudu-pos-api-secure/routes/api.php`, the `admin` middleware group.
- `tests/Feature/Security/AccessControlTest.php`, the privileged endpoint assertions.

**Say:**

> The important fix is server-side as well as in the interface. The secured API attaches the administrator middleware to privileged route groups, and the tests assert that an employee receives 403 while an administrator remains allowed. A hidden button alone would not be sufficient.

## V-03 — a cashier could read another branch's customer

### Original live comparison

1. On the original tab, open `http://localhost:5174/customers`.
2. Screenshot: `V03-01-original-customer-list.png` after the list loads.
3. Move to the search field and screenshot: `V03-02-original-search-empty.png`.
4. Fill `Dilani Wickramasinghe`. Screenshot: `V03-03-original-cross-branch-result.png`.
5. Circle the name and **Kandy Branch**. Do not click Edit or Delete.

**Say:**

> The signed-in user is Kamal Silva, a Colombo cashier. The original application returns Dilani Wickramasinghe from Kandy Branch. This is an IDOR or broken object-level authorization problem because the server did not scope the record to the employee's department.

### Secured live comparison

1. Press `Ctrl+Tab` to the secure tab and open `http://localhost:5173/customers`.
2. Screenshot: `V03-04-secure-customer-list.png`.
3. Fill the same search text, `Dilani Wickramasinghe`. Screenshot: `V03-05-secure-no-result.png`.
4. Circle **No customers found** and the identical search text.

**Say:**

> I repeat exactly the same search with the same employee account. The Kandy customer is not returned. The server applies department scoping before the data reaches the browser, so changing a frontend filter cannot bypass the control.

### Code and test evidence

Show:

- `demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/CustomerController.php`, `index()` and `show()`.
- `demo/secure/pubudu-pos-api-secure/app/Models/Customer.php`.
- `demo/secure/pubudu-pos-api-secure/app/Models/Concerns/ScopedToDepartment.php`.
- `tests/Feature/Security/AccessControlTest.php`, `test_an_employee_cannot_read_another_branchs_customer`.

**Say:**

> The controller uses `visibleTo($request->user())`, and the test expects a cross-branch lookup to return 404. This is enforcement in the backend query, not only a visual filter.

## V-05 — authentication weaknesses

### Original login steps

1. Sign out of the original tab and return to its login page.
2. Screenshot: `V05-01-original-login-empty.png`.
3. Fill an unknown username such as `unknown.demo.user`; fill a harmless wrong password and keep it masked. Screenshot: `V05-02-original-unknown-input.png`.
4. Move to **Sign In**, pause and click. Screenshot: `V05-03-original-unknown-response.png`.
5. Fill the valid demo username with the same wrong password. Screenshot: `V05-04-original-known-input.png`.
6. Click **Sign In**. Screenshot: `V05-05-original-known-response.png`.

**Say:**

> The original login path handled an unknown username differently from a known username with a wrong password. Even if the toast is brief, the backend source and test evidence show the two different responses. That lets an attacker enumerate real staff usernames before attempting passwords.

### Secured login steps

1. Sign out of the secure tab and return to its login page.
2. Screenshot: `V05-06-secure-login-empty.png`.
3. Repeat the unknown-user input and submit. Screenshot: `V05-07-secure-unknown-response.png`.
4. Repeat with the valid username and wrong password. Screenshot: `V05-08-secure-known-response.png`.
5. Keep both post-submit screens visible for equal time.

**Say:**

> The secured implementation gives the same generic failure message for both cases and performs a dummy password-hash check when the user does not exist. This reduces username enumeration and timing differences.

### Code and test evidence

Show:

- Original `app/Http/Controllers/Api/AuthController.php`, the different 404 and 401 branches.
- Secure `app/Http/Controllers/Api/AuthController.php`, the generic response and dummy hash check.
- `app/Providers/RouteServiceProvider.php`, the login limiter.
- `tests/Feature/Security/AuthenticationTest.php`, username enumeration and failed-login throttling tests.

**Say:**

> V-05 also included missing brute-force protection, a weak minimum password length and no safe self-service password-change path. The secured tests cover these cases. I show the tests instead of repeatedly guessing passwords in the live demo.

## V-06 — tokens survived account termination

### Safe demonstration setup

1. Show the ordinary login page and successful dashboard login already captured for V-01/V-05.
2. Do not deactivate Kamal Silva or delete tokens from the live demo database.
3. Open the original session/token code and capture `V06-01-original-session-code.png`.

**Say:**

> In the original implementation, an access token could remain usable after an employee was deactivated. This is a session lifecycle failure. I will not deactivate the seeded employee in the live recording because that would change the shared demo state.

### Secured code and test evidence

Show:

- `demo/secure/pubudu-pos-api-secure/app/Http/Middleware/EnsureUserIsActive.php`.
- Secure `app/Http/Controllers/Api/AuthController.php` around the account update and token-revocation code.
- `tests/Feature/Security/AuthenticationTest.php`, `test_deactivating_a_user_revokes_their_existing_token`.
- `config/sanctum.php`, the non-null token expiration configuration.

Screenshot: `V06-02-secure-active-middleware.png`, `V06-03-secure-token-revocation.png`, and `V06-04-secure-token-test.png`.

**Say:**

> The secured version checks `is_active` on every protected request, revokes existing tokens when access is withdrawn, and gives tokens a finite lifetime. The regression test proves that a token issued before deactivation cannot continue using the API.

## Google OpenID Connect — 30 seconds

1. On the secure login page, screenshot the **Sign in with Google** button as `OIDC-01-secure-google-button.png`.
2. Do not start an external Google login unless the local OAuth client is configured and no personal account will be exposed.
3. Show `app/Services/GoogleOidcService.php` and `app/Http/Controllers/Api/GoogleAuthController.php`.
4. Screenshot the PKCE, state, nonce and ID-token validation lines.

**Say:**

> I also implemented Google OpenID Connect using the Authorization Code flow with PKCE. The service validates state, nonce and the ID token. A Google account is not automatically converted into a staff account; the application must find an existing approved staff record. This avoids recreating the public-registration problem through Google.

## Closing — 20 seconds

**Say:**

> To conclude, my fixes cover public registration, role enforcement, branch isolation, secure authentication and token lifecycle. The original and secured behaviours were compared using the same local employee account, and the API-level controls are backed by regression tests. V-04 belongs to Malith, so I have kept that ownership separate.

## Final recording checklist

- [ ] Original and secure tabs are visible and clearly distinguishable.
- [ ] Cursor pauses on every field, button and result.
- [ ] Every screenshot name in the five child scripts is covered.
- [ ] No password, bearer token, client secret or personal Google account is shown.
- [ ] No administrator account is created through V-01.
- [ ] No seeded employee is deactivated for V-06.
- [ ] Code path and test path are shown after each live comparison.
