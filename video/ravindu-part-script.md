# Ravindu’s Video Segment — Access Control and Session Security

**Suggested length:** 4–5 minutes  
**Demo:** Compare the original and secure versions using the same Colombo cashier account.  
**Browser tabs:** Original `http://localhost:5174` · Secure `http://localhost:5173`

## Before recording

- Keep the original app in the first tab and the secure app in the second tab.
- Both versions are already signed in as the same demo user: `cashier.colombo` (Colombo employee).
- The customer search is ready in both versions for **Dilani Wickramasinghe**, a customer in the Kandy branch.
- Use `Ctrl+Tab` to move from the original tab to the secure tab. Use `Ctrl+Shift+Tab` to return.
- Do not read the demo password aloud or expose any real account credentials.

## 1. Introduction — original version

**On screen:** Original tab, customer list. Keep the signed-in Colombo employee and branch label visible.

**Say:**

> Hello, I’m Ravindu. My part of the project focused on access control and session security. I’ll demonstrate one branch-isolation problem using the same employee account and the same customer search in the original and secured versions.

## 2. Reproduce the problem — original version

**On screen:** In the search field, enter `Dilani Wickramasinghe`. The row appears and identifies the customer as belonging to **Kandy Branch**.

**Cursor cue:** Move the pointer slowly over the customer’s name and the “Kandy Branch” label. Circle that row twice, then pause over the branch label. Do not click Edit or Delete.

**Say:**

> I am signed in as a Colombo cashier, but this search returns a customer from the Kandy branch. The original backend returned the full customer list without restricting it to the employee’s branch. This is a broken access-control issue: a user can see another branch’s customer information even though they are not assigned to that branch.

> Notice that this is not just a hidden menu or a front-end display issue. The other branch’s record and its customer details have already been sent to the browser.

## 3. Repeat the same action — secure version

**Action:** Press `Ctrl+Tab` to move to the secure app. Confirm the same employee and Colombo branch are signed in. In the same customer search field, enter the same name: `Dilani Wickramasinghe`.

**Cursor cue:** Point at the identical search field, then circle the “No customers found” result twice. Pause so the difference is easy to see.

**Say:**

> Now I am in the secured version, still using the same Colombo cashier account. I repeat exactly the same search. The Kandy customer is not returned, and the page says there are no customers found. The important fix is on the server: the API scopes customer queries to the signed-in user’s department. The browser cannot remove that restriction by changing a filter.

## 4. Show where the fix lives

**On screen:** Open these files in the secure API project, one at a time:

1. `demo/secure/pubudu-pos-api-secure/app/Http/Controllers/Api/CustomerController.php` — `index()` and `show()` use `visibleTo($request->user())`.
2. `demo/secure/pubudu-pos-api-secure/app/Models/Customer.php` — the model uses the department-scoping trait.
3. `demo/secure/pubudu-pos-api-secure/app/Models/Concerns/ScopedToDepartment.php` — show the rule that limits employees to their own department while allowing administrators the intended broader access.

**Cursor cue:** Point to `visibleTo(...)`, trace to the model trait, and circle the scoping condition twice. Keep the pointer away from unrelated code.

**Say:**

> The controller applies the department scope before returning customer records. The scope is based on the authenticated user on the server—not a department value that the browser can choose. Administrators can access records according to their role, while an employee is limited to their own branch. The individual-record lookup is scoped as well, so guessing another customer’s ID does not bypass the list restriction.

## 5. Briefly connect the rest of Ravindu’s work

**On screen:** Show the secure API routes and then the relevant middleware/controller files. Do not expose tokens or secrets.

- `demo/secure/pubudu-pos-api-secure/routes/api.php` — public login is rate-limited; registration is inside the authenticated, active-user, administrator-only group.
- `demo/secure/pubudu-pos-api-secure/app/Http/Middleware/AdminMiddleware.php` — rejects non-administrator access.
- `demo/secure/pubudu-pos-api-secure/app/Http/Middleware/EnsureUserIsActive.php` and `app/Http/Controllers/Api/AuthController.php` — inactive accounts and their existing sessions are handled/revoked.
- `demo/secure/pubudu-pos-api-secure/app/Services/GoogleOidcService.php` and `app/Http/Controllers/Api/GoogleAuthController.php` — Google sign-in uses Authorization Code with PKCE and validates state/nonce and the ID token.

**Say:**

> My other access-control work moved staff registration behind administrator authorization, applied role checks to privileged routes, added protections against cross-branch record access, and strengthened login and session handling. I also implemented Google OpenID Connect using Authorization Code with PKCE. The Google identity proves who signed in; the application still takes the user’s role and department from its own database.

## 6. Test evidence and close

**On screen:** `demo/secure/pubudu-pos-api-secure/tests/Feature/Security/AccessControlTest.php` — show the tests for unauthenticated registration, employee access to another branch’s customer, and the expected `404` for an out-of-scope record.

**Say:**

> These checks are covered by security regression tests. In particular, the tests verify that an employee cannot read a customer from another branch and that out-of-scope records are not disclosed. This completes my demonstration of the access-control and session-security work.

## Recording/editing note

Keep the original result on screen long enough to read the Kandy branch label. Then switch once to the secure tab and keep “No customers found” visible for the same amount of time. Add a short pause between the narration sections so the two results are clear in the final edit.
