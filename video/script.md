# YouTube demo — timed run sheet

**Target: 18 minutes.** Hard limit is 20.

Four speakers, one per workstream, so the "individual contribution" criterion is
audible as well as visible in the commit history.

---

## Before you record

Run this once and leave both terminals open. Nothing below should be typed for
the first time on camera.

```bash
# Terminal 1 — backend
cd D:/ass_sd/work/pubudu-pos-api-secure
php artisan migrate:fresh --force
php artisan db:seed --class=SecurityDemoSeeder
php artisan cache:clear          # resets the login rate limiter
php artisan serve --host=127.0.0.1 --port=8000

# Terminal 2 — frontend
cd D:/ass_sd/work/pubudu-pos-front-end-secure
npm run dev

# Terminal 3 — the one you actually present from
cd D:/ass_sd
```

Checklist:

- [ ] Terminal font at 16pt or larger. Nothing on screen should need squinting.
- [ ] Browser zoom 125%.
- [ ] Google OAuth client created, `GOOGLE_*` set in the backend `.env`, and a
      staff account carrying your real work email. **Test the whole Google
      round trip once before recording** — it is the one step that cannot be
      faked if it fails.
- [ ] Two browser tabs ready: the `v0-original-vulnerable` compare view on
      GitHub, and the running app.
- [ ] Close Slack, mail, notifications.

> **If Google sign-in breaks on the day**, record everything else and say
> plainly that the OIDC section is shown against the verification tests
> (`php artisan test --filter=ConfigurationTest`), which prove the same
> controls. Do not fake it.

---

## 0:00–1:15 · Introduction — *Ravindu*

Say, roughly:

> This is the Pubudu Tyres point-of-sale system — a multi-branch tyre shop.
> Laravel API, React front end, in real use. We built it, and for this
> assignment we attacked it.
>
> We found 18 distinct vulnerabilities. We fixed 13 and documented 5 we
> deliberately did not fix. We also added Google OpenID Connect sign-in using
> the Authorization Code flow with PKCE.
>
> Everything you are about to see is a real attack against a running instance,
> not a code walkthrough.

Show the app for ten seconds: log in as `admin`, dashboard, sales history.
**Do not narrate the UI.** It is only there so the rest of the video has a
subject.

---

## 1:15–5:30 · The attacks, before and after — *Ravindu*

This is the core of the video. Everything else supports it.

**1:15** — Open `evidence/before/poc-dynamic-testing.txt`. Scroll slowly.

> Before we changed anything: twelve attack scripts, twelve successes.

**1:45 — V-01, the worst one.** Read it from the file, then run it live:

```bash
curl -s -X POST http://127.0.0.1:8000/api/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Mallory","nic_no":"991234567V","phone_no_01":"0770000000",
       "username":"attacker","password":"password","role":"admin","department_id":1}'
```

> That endpoint was public. It accepted `role: admin`. It returned a working
> administrator token. One request, from anywhere on the internet. Today it
> returns 401 — it now requires an administrator to call it.

**2:45 — V-02, the one worth understanding.** Open `AdminMiddleware.php`, then
`Kernel.php:67`, then `routes/api.php` at the original tag.

> The role check existed. It was written correctly and registered correctly.
> It was applied to zero routes. Being any logged-in cashier was enough to
> cancel invoices, rewrite stock and read every profit report.
>
> No scanner finds this. A scanner sees a 200 and calls it working. What finds
> it is a test that asserts an employee gets 403 — which is what we wrote,
> twenty-two of them.

**3:45 — V-13, the XSS.** Show the no-op sanitiser on screen:

```javascript
const cleanProductName = (productName) => {
  if (!productName) return "";
  // Remove everything inside parentheses including the parentheses
  return productName            // ← that is the whole function
};
```

> Its own comment describes a replace that is not there. Anyone reviewing the
> print template sees `cleanProductName(...)` and assumes the value is handled.

Then the chain, in one breath:

> A cashier saves a customer named `<img src=x onerror=...>`. Nothing happens.
> Then an **administrator** prints that invoice — and the payload runs in their
> browser and steals their token out of localStorage. A token which, because of
> a separate finding, never expired.

**4:45 — the after.** Run it live:

```bash
node evidence/poc/run-all.mjs
```

Let it run to the summary. Hold on:

```
Still exploitable : 0
Fixed             : 13
```

> Same script, same fixtures, same server. Zero.

---

## 5:30–8:00 · Access control and sessions — *Ravindu*

**V-03 — IDOR.** Live, with the Colombo cashier's token:

```bash
# Before: 200 and a Kandy customer's 78,500 LKR balance. Now:
curl -s -o /dev/null -w "GET /customers/2 -> %{http_code}\n" \
  http://127.0.0.1:8000/api/customers/2 -H "Authorization: Bearer $EMP"
```

> 404, not 403 — deliberately. A 403 confirms the record exists, which lets
> someone enumerate ids and map another branch's data without reading any of it.

**V-06 — the termination test.** Walk through the three steps on screen:

> Employee logs in. Admin deactivates them — new logins are refused. Then the
> employee replays the token they already had, and the original app said 200.
> Forever, because tokens had no expiry. A dismissed employee kept full access.

Show the PoC line: `EXISTING token replayed → 401`.

**V-05b — brute force.** Point at the before output: 20 wrong passwords, none
throttled, and — before our audit trail — no log entry either. Then the after:
first 429 within a few attempts.

---

## 8:00–10:15 · Pricing, mass assignment, audit — *Malith*

**V-10 — the one that makes the workflow decorative.**

> The server computed the invoice totals itself. That looks safe. But it
> computed correct totals from line prices the attacker supplied.

```bash
# 32,000 LKR tyre, sold for 1
curl -s -X POST http://127.0.0.1:8000/api/invoices -H "Authorization: Bearer $EMP" \
  -H "Content-Type: application/json" \
  -d '{"inv_date":"2026-09-20","customer_type":"cash","payment_status":"cash",
       "pay_amount":0,"department_id":1,"type":"tire",
       "items":[{"product_code":"PRD0001","product_name":"Michelin Primacy 4",
                 "qty":1,"selling_price":1,"type":"product"}]}'
```

> This app has a whole discount-approval workflow — request, admin review,
> approve, push notification. All of it was decorative. A cashier wanting
> 30,000 off just typed a lower price.

Show the 422 now, then the second half: a discount with no approved request is
also refused, and an approval is **single-use** so it cannot be replayed on
every later sale.

**V-04 — mass assignment.** Show the three lines:

```php
$request->validate([... 'credit_balance' => 'nullable|numeric|min:0' ]);
$data = $request->all();      // rules checked, payload NOT filtered
$customer->update($data);
```

> Validation checks the keys it lists. It does not filter the payload. That one
> misunderstanding erased 45,000 rupees of customer debt with no ledger entry.

**V-11 — the audit trail.** Cancel an invoice as admin, then:

```bash
curl -s "http://127.0.0.1:8000/api/audit-logs?action=invoice." \
  -H "Authorization: Bearer $ADMIN" | python -m json.tool | head -40
```

> Cancelling a sale used to overwrite the amounts with zero, in place. You could
> not tell a voided 500,000 rupee sale from a voided 500 rupee one, or who did
> it. That is how theft is hidden in a POS. Now the full before-state is kept,
> and the audit table refuses to be edited or deleted.

---

## 10:15–12:15 · The front end — *Nimthara*

**V-13 — demonstrate it, do not describe it.** This is the best 90 seconds in
the video. Do it live:

1. Create a customer named `<img src=x onerror="alert('XSS: '+localStorage.authToken)">`
2. Make an invoice for them
3. Print it → **the alert fires** *(record this against the original tag ahead
   of time if the live app is already fixed)*
4. Same steps on the fixed app → the name renders as literal text, nothing in
   the console

**V-14 — the committed `.env`:**

```bash
git -C work/pubudu-pos-front-end-secure log --diff-filter=A --oneline v0-original-vulnerable -- .env
```

> The root cause was not a careless commit. The `.gitignore` was the stock Vite
> template and had no `.env` rule at all. So our CI now asserts the *rule*
> exists, not just that the file is gone — otherwise it comes back the moment
> someone re-adds it.

**V-16 — client-trusted role.** In DevTools on the original:

```javascript
localStorage.setItem('user', JSON.stringify({role:'admin'}))
```

reload → administrator UI. Then explain the fix in one line: the app now asks
`GET /me` and the **server** says who you are.

---

## 12:15–13:30 · Dependencies, headers, transport — *Hamna*

```bash
cat evidence/before/composer-audit.txt | head -20
```

> 41 advisories. The cause: Laravel 10, whose security support ended in
> February 2025. And this is not theoretical —

Show the Composer refusal:

> Composer now refuses to install *any* 10.x release. There was no "pin the
> latest patch" option. Our plan had this as deferred; the evidence made it
> mandatory. We upgraded to Laravel 12.

```bash
cd work/pubudu-pos-api-secure && composer audit     # → 0
cd ../pubudu-pos-front-end-secure && npm audit      # → 0
```

**V-15, in one sentence with the file on screen:**

> The production proxy sent every API call over plain HTTP while `.env` used
> HTTPS for the same host. Every request carried a bearer token.

**Headers:**

```bash
curl -sI http://127.0.0.1:8000/api/me | grep -iE "x-frame|x-content|referrer|content-security"
```

> Note HSTS is deliberately absent here — RFC 6797 forbids sending it over
> plain HTTP, and it would pin a developer's browser to HTTPS for localhost.

---

## 13:30–16:15 · Google OpenID Connect — *Ravindu*

**13:30 — why this feature.**

> We removed public self-registration because it was handing out admin accounts.
> This replaces it. An administrator creates the staff account and records the
> work email; Google proves the person controls that mailbox. Two different
> parties — that is the point.

**14:00 — the live round trip.** Click **Sign in with Google**, consent, land
back signed in. Do not talk over it; let it work.

**14:45 — why Authorization Code with PKCE.**

> Not Implicit. Implicit puts the token in the URL fragment, which means browser
> history, Referer headers, any logging proxy. OAuth 2.1 removes it. The code
> flow returns a single-use code instead, and PKCE binds that code to the
> browser that started the flow.

Show the authorize URL:

```bash
curl -s http://127.0.0.1:8000/api/auth/google/redirect | python -m json.tool
```

> `response_type=code`. `code_challenge_method=S256` — never `plain`, because a
> plain challenge *is* the verifier. And notice what is **not** there: no
> `code_verifier`, no client secret. Those stay on the server, because this
> application had a stored XSS and anything the page holds, script can read.

**15:15 — the eight checks.** Open `GoogleOidcService::verifyIdToken` and
scroll through the numbered comments. Linger on one:

> Number three is the audience check. Without it, a token legitimately issued to
> *any other* Google application replays here with a perfectly valid signature.
> It is the check people most often leave out, which is why Socialite was not
> enough — it does not verify the ID token at all.

**15:45 — the negatives.** Run them:

```bash
# unknown state
curl -s -o /dev/null -w "unknown state -> %{http_code}\n" \
  -X POST http://127.0.0.1:8000/api/auth/google/callback \
  -H "Content-Type: application/json" -d '{"code":"fake","state":"never-issued"}'
```

Then the replay demo: issue a state, use it twice — accepted, then 400.

> A callback works at most once.

---

## 16:15–17:30 · Tests, CI, and what we did not fix — *Hamna*

```bash
php artisan test --testsuite=Security
```

Let it run. **74 passed.**

> Each of these fails against the original tag and passes against the fixed one.
> They run in CI on every push, so a regression blocks the merge instead of
> being found by a marker.

One test to show, because it found something:

> This one failed the first time we ran it — with a 500. The users table marks
> the second phone number NOT NULL while every validation rule calls it
> optional. Creating a staff account without one crashed. That is a real defect
> our own suite found, and it is fixed.

**Not fixed — say these plainly, they are marked:**

> Five things we deliberately did not fix.
>
> Encryption of customer PII at rest — encrypted columns cannot be searched, and
> customer search is the most-used feature on the till. Needs blind indexing.
>
> httpOnly cookies instead of bearer tokens — needs Sanctum stateful mode and a
> shared domain; we are deployed cross-origin.
>
> MFA for admins — but Google sign-in means an admin's Google 2FA now protects
> the strongest login path.
>
> Removing the second UI framework — a visual regression pass across 24 pages we
> cannot test without the shop's data.
>
> Rewriting git history to purge the leaked hostnames — it would destroy the
> before-and-after history this assignment is graded on, and the real fix is
> rotating them, which needs hosting access we do not have.

---

## 17:30–18:00 · Close — *all four, one line each*

Each member says which vulnerabilities they owned. Then Ravindu:

> Commit history, pull requests and the full report are in the repositories
> linked in the README. Every finding has a runnable proof.

**End.**

---

## Things to avoid

- Reading the report aloud. Show the terminal; talk over it.
- Explaining what OWASP is. The marker knows.
- Apologising for the five unfixed items. They are a deliverable, not a gap —
  state the reason and move on.
- Typing long commands live. Have them in a scratch file and paste.
- Filler while something loads. Prepare the sentence you will say during it.

## If you run long

Cut in this order — each is fully covered in the report:

1. §12:15 dependencies (keep only the 41 → 0 and 23 → 0 numbers)
2. V-04 in §8:00
3. The V-16 DevTools demo in §10:15

**Never cut:** the before/after PoC run, the live XSS, the Google round trip.
Those three are the assignment.
