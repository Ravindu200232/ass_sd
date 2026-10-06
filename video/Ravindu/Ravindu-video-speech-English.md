# Ravindu – English Video Speech Script

Use this file for the spoken English voice-over. Use `Ravindu-video-script-Sinhala.md` separately as the Sinhala step-by-step guide for clicking, typing and taking screenshots.

## Demo setup

- Original website: `http://localhost:5174/login`
- Secure website: `http://localhost:5173/login`
- Demo username: `cashier.colombo`
- Use the local demo password, but keep the password field masked in the recording.
- Keep the Original and Secure websites in two browser tabs. Use `Ctrl + Tab` when changing between them.
- Move the cursor to the field, button or result being discussed and pause briefly before taking each screenshot.

## Introduction

**[Show the title or the Original login page.]**

“Hello. My name is Ravindu, and in this video I will demonstrate selected security vulnerabilities in the Pubudu Tire Management System. For each vulnerability, I will first show the behavior in the Original version. Then I will show the corresponding behavior in the Secure version, explain the security fix, and present the relevant source code and automated test evidence.

The demonstration uses a local environment and a limited employee account. I will not create an administrator account through a live exploit, and I will not deactivate a seeded employee account. Those cases are demonstrated safely with source-code evidence and regression tests.”

---

## V-01 – Public Registration and Administrator Token Creation

### Original website

**[Open `http://localhost:5174/login`. Show the empty login form, then enter the demo username and password. Click Sign In and show the employee dashboard.]**

“I am now using the Original website. I am signing in with the employee account `cashier.colombo`. The password is kept masked for security.”

**[Show the Original dashboard and employee access information.]**

“The important problem is in the backend registration route, not in this login screen. In the Original backend, the registration endpoint was publicly reachable. An unauthenticated person could send a registration request, request the administrator role, and receive an authentication token.

This creates a broken access-control vulnerability. An attacker could try to create an administrator account without already being an authorized administrator. I am not submitting that exploit during the live demonstration. I will show the vulnerable route and the security test instead.”

### Secure website

**[Press `Ctrl + Tab` and open `http://localhost:5173/login`. Show the Secure login page.]**

“I am now switching to the Secure website. The same employee login is used here, and the password remains masked.”

**[Show the secured route group in the API source code.]**

“In the Secure version, the registration endpoint is no longer public. It is protected by Sanctum authentication, the active-user check, and administrator authorization.”

```php
Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::middleware('admin')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
    });
});
```

**[Show `AccessControlTest.php` and the 401 assertion.]**

“The regression test sends an unauthenticated request and expects HTTP 401. It also verifies that an attacker user is not created in the database. Therefore, the vulnerability is fixed at the backend authorization layer, rather than being hidden only in the frontend.”

---

## V-02 – Missing Role Authorization and Profit Report Exposure

### Original website

**[Switch to the Original tab and open `http://localhost:5174/sales/profit`. Show the Revenue, Cost, Profit and Margin values.]**

“I am still logged in as a Colombo cashier, not as an administrator. However, in the Original website I can open the profit-report URL directly.”

**[Point the cursor to the financial values.]**

“The page exposes revenue, cost, profit and margin information to an ordinary employee. Being authenticated only proves the identity of the user. It does not prove that the user has administrator permission.

The Original frontend protected the route from unauthenticated users, but it did not perform an administrator role check. This is a missing role-authorization vulnerability. Sensitive financial data must be protected by the backend as well as by the frontend.”

### Secure website

**[Press `Ctrl + Tab` and open `http://localhost:5173/sales/profit`. Show the redirect or denied employee view.]**

“Now I am trying the same URL in the Secure website with the same employee account. The employee is redirected away from the profit report, so the sensitive report is not displayed.”

**[Show the Secure frontend route.]**

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

“The frontend route now requires administrator access with `adminOnly`.”

**[Show the API route group and the access-control test.]**

“The backend financial routes are also inside an administrator middleware group. This is important because a user must not be able to bypass the frontend by calling the API directly. The automated test expects HTTP 403 for an employee and HTTP 200 for an authorized administrator.”

---

## V-03 – Cross-Branch Customer IDOR or BOLA

### Original website

**[Switch to the Original tab and open `http://localhost:5174/customers`. Show the Colombo cashier badge and customer list.]**

“Next, I am demonstrating cross-branch customer-data access. The current user is a Colombo branch cashier.”

**[Search for `Dilani Wickramasinghe`. Show the Kandy Branch result.]**

“When I search for this customer in the Original website, a Kandy Branch customer record is displayed to the Colombo cashier. The result can expose customer information and credit-related data from another branch.

This is an object-level authorization failure, commonly called IDOR or BOLA. The user is authenticated, but the application does not correctly check whether this particular customer object belongs to the user’s permitted branch.”

**[Do not click Edit or Delete.]**

“I will not edit or delete the record. I am only demonstrating that the cross-branch record is visible.”

### Secure website

**[Press `Ctrl + Tab` and open `http://localhost:5173/customers`. Search for the same customer.]**

“Now I am repeating the same search in the Secure website. The Colombo employee can still use the customer page, but the Kandy customer is not returned.”

**[Show the empty result or `No customers found` message.]**

“This confirms that the search result is filtered by the employee’s permitted department or branch.”

**[Show `CustomerController.php`, `Customer.php`, the department-scope concern, and the cross-branch test.]**

“The backend applies the `visibleTo` scope before returning a customer. The model and department scope ensure that the query is restricted to the employee’s branch.”

```php
$customer = Customer::with('department')
    ->visibleTo($request->user())
    ->find($id);
```

“Even if an employee guesses another customer ID and requests it directly, the backend does not reveal the record. The test expects a not-found response and verifies that the other branch’s customer name and credit balance are not present in the response.”

---

## V-05 – Authentication Weaknesses

### Original website

**[Switch to the Original login page. Enter `unknown.demo.user` with a harmless incorrect password and submit.]**

“I am now testing the login error behavior. First, I am using a username that does not exist.”

**[Show the response. Do not show the password.]**

“The Original application returns a response that indicates that the username does not exist.”

**[Repeat with `cashier.colombo` and the same incorrect password.]**

“Now I am using a real username with an incorrect password. The response is different and indicates that the password is incorrect.”

“These two different responses allow an attacker to distinguish valid usernames from invalid usernames. This is called username enumeration. The Original login route also did not have sufficient login-specific throttling, so repeated password attempts were not adequately limited.”

**[Show the Original authentication code.]**

“The source code confirms that the unknown-user and wrong-password cases return different status codes or messages. This is the cause of the information leak.”

### Secure website

**[Press `Ctrl + Tab` and open the Secure login page. Repeat the unknown-user attempt and the known-user wrong-password attempt.]**

“I am now repeating the same two attempts against the Secure website. The password is never shown on screen.”

“The Secure backend returns the same generic authentication response for both cases. An attacker can no longer learn whether a username exists from the login response.”

**[Show the secure authentication code.]**

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

“When the user does not exist, the backend still performs a dummy password-hash check. This helps reduce timing differences. Both invalid cases use the same generic message and HTTP 401 status.”

**[Show the login throttle route and the authentication tests.]**

“The login route is also protected by a username-and-IP rate limit. Repeated attempts are refused with HTTP 429. The automated tests verify both generic error equality and brute-force protection.”

---

## V-06 – Token and Session Lifecycle

**[Show the successful dashboard/session context, then the Original authentication code.]**

“The final vulnerability in my assigned scope concerns token and session lifecycle management. In the Original version, a successful login creates a bearer token. The token expiration setting was unlimited, and an already-issued token was not automatically revoked when the user’s account status or security-sensitive details changed.”

**[Show the Original token creation and the unlimited expiration setting.]**

“This means that a token could remain usable for too long, even after the account should no longer be trusted.”

**[Switch to the Secure source code and show `EnsureUserIsActive.php`.]**

“The Secure version checks that the user is active before allowing protected requests. If the account is inactive, the middleware removes the user’s tokens and returns a forbidden response.”

**[Show the token-revocation block in the Secure authentication controller.]**

“Tokens are also revoked when the account is deactivated or when security-sensitive values such as the role, password or username are changed.”

**[Show the authentication test and the finite Sanctum expiration setting.]**

“The automated test confirms that the token count becomes zero after deactivation. The Secure configuration also uses a finite eight-hour token expiration instead of unlimited tokens. I am showing the code and test evidence rather than deactivating a seeded employee during the live demo.”

---

## Google OpenID Connect – Secure login evidence

**[Show the Secure login page and the `Sign in with Google` button.]**

“The Secure login page also includes Google OpenID Connect support. I will not use a personal Google account during this recording.”

**[Show the OIDC service and controller code. Keep secrets, tokens and personal account data hidden.]**

“The authorization-code flow uses state for CSRF protection, nonce for replay protection, and a code verifier with a SHA-256 code challenge for PKCE. The verifier and nonce are stored on the server side. During the callback, the state is consumed only once, the authorization code is exchanged by the server, and the ID token is validated for its signature, issuer, audience, expiry and nonce before a staff account is authenticated.”

“This prevents the application from trusting an unvalidated identity or a callback that was not created by the application.”

---

## Conclusion

“This demonstration shows that authentication alone is not enough to secure an application. The system also needs role authorization, branch-level object authorization, safe authentication errors, rate limiting, token revocation and finite session lifetimes.

For each selected vulnerability, I showed the Original browser behavior, explained the security impact, demonstrated the Secure behavior, and connected the fix to source code and automated tests. The Original version exposes the weakness, while the Secure version enforces the control at the backend and verifies it with regression tests.

V-04 is part of Malith’s assigned scope, so I have not claimed that vulnerability in this section. Thank you.”

## Recording reminders

- Keep all passwords masked and do not show bearer tokens, client secrets or personal Google-account information.
- Use the Original result first, then the vulnerability explanation, then the Secure result, then the code and test evidence.
- Leave the cursor on the exact field, button, result or code line being discussed.
- Pause for one or two seconds after each important result so the screen recording is easy to follow.
- Do not submit the V-01 registration exploit and do not deactivate the seeded employee for V-06.
