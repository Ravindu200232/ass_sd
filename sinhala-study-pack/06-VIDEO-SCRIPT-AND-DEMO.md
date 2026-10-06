# 06 — මිනිත්තු 18ක Sinhala video script සහ demo tutorial

Assignment එකේ YouTube video එක **මිනිත්තු 20ට නොවැඩි** විය යුතුයි. මේක සම්පූර්ණ report එක කියවීමක් නොව, අපේ **before → fix → after** සාක්ෂි පෙන්වන කෙටි demo එකක්. Speaker කෙනෙක් තමන්ට තේරෙන සහ සත්‍යයෙන් කළ කොටස පමණක් “මම” ලෙස කියන්න; අවශ්‍ය නම් “අපේ කණ්ඩායම” කියන්න.

## Record කිරීමට පෙර සූදානම

1. Local **demo/testing database** එකක් වෙන් කරගන්න. Production database හෝ customer real data භාවිතා නොකරන්න. `migrate:fresh --force` වැනි command database tables මකන නිසා database නම තහවුරු නොකර run කරන්න එපා.
2. API සහ web දෙක startup කර login පරීක්ෂා කරන්න. Google OIDC සඳහා real OAuth client ID, secret, redirect URI සහ matching staff email config කර browser round trip **කලින්ම** test කරන්න.
3. Screen share/recording එකේ `.env`, Google client secret, bearer token, customer real personal data, callback authorization code **නොපෙන්වන්න**. Demo data පමණක්.
4. මේ tabs ready තබන්න: POS login; secured API/web GitHub repos (`main`, feature branch/merge); `evidence/before/poc-dynamic-testing.txt`; `evidence/after/poc-dynamic-testing.txt`; test output; selected code files.
5. Terminal text විශාල කරන්න; notifications off; browser zoom 125% පමණ. එක් speaker සිට ඊළඟ speakerට transition rehearse කරන්න.
6. `video/script.md` පැරණි draft එකේ “74 tests” කියා තිබේ. Current recorded suite **90 backend / 19 frontend**. මෙම guide එකේ එම නව අංක භාවිතා කරන්න.

## Local demo startup (Windows PowerShell)

Backend terminal එකේ `.env` dedicated local demo database එකකට point වෙන බව පරීක්ෂා කළ පසු:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-api-secure'
# ඔබට install කර ඇති PHP executable එක යොදාගන්න; මේ machine එකේ C:\xampp\php\php.exe ඇත.
& 'C:\xampp\php\php.exe' artisan serve --host=127.0.0.1 --port=8000
```

Frontend terminal:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-front-end-secure'
npm run dev
```

PoC terminal:

```powershell
Set-Location 'D:\ass_sd'
node evidence/poc/run-all.mjs
```

PoC script එක accounts/data වෙනස් කරන **real attack probes** run කරයි. එය local seeded demo database එකට පමණක් run කරන්න. Repeat run එකේ login rate limiter තව active නම් `SKIPPED` විය හැක; test data/cache reset කිරීමත් dedicated local environment එකේ පමණක් කරන්න. Server start/fixtures fail වුණොත් saved evidence පෙන්වා “මේක කලින් recorded run output” යැයි පැහැදිලිව කියන්න.

## Timeline — 18 minutes

| වෙලාව | කවුරුද | Screen එකේ | කියන මූලික අදහස |
|---|---|---|---|
| 00:00–00:45 | Ravindu | POS dashboard + project title | App, assignment goal, backend/frontend |
| 00:45–04:15 | Ravindu | routes, access tests, Google flow | V-01/V-02/V-03, OIDC identity control |
| 04:15–07:45 | Malith | price request + code/test + audit | V-04/V-10/V-11 |
| 07:45–11:15 | Nimthara | receipt XSS, response JSON, upload | V-13/V-16/V-17/V-20 |
| 11:15–14:45 | Hamna | CORS/headers/proxy, test/CI | V-07/V-08/V-09/V-12/V-15/V-18 |
| 14:45–17:30 | සියලුදෙනා | before/after evidence, tests, Git | `0/14` meaning, 90/19 pass, merges, residual risks |
| 17:30–18:00 | Ravindu | README/report/links | deliverables සහ closing |

Total 18 minutes. OIDC real login screen slow නම් අනෙක් code explanations කෙටි කරන්න; **20 minutes ඉක්මවන්න එපා**. මුළු video එකේ member speaking time සමාන අසන්න වීම individual contribution සඳහා උපකාරී.

## 00:00–00:45 — Ravindu introduction (කියන්න)

> “මේක Pubudu Tyres POS system එක. Laravel API සහ React web app එකක්; invoice, stock, branch, staff සහ financial records පාලනය කරනවා. Assignment එකේ අවශ්‍ය වූයේ existing app එකක vulnerabilities 7කට වඩා සොයා fix කිරීම සහ OAuth/OpenID Connect feature එකක් එක් කිරීම. අපේ report එකේ findings 19ක් සාකච්ඡා වෙනවා. දැන් original දෝෂ කිහිපයක්, fixes සහ tests පෙන්වන්නම්.”

**පෙන්වන්න:** POS එකේ සාමාන්‍ය sale/stock screen 5–10 seconds. Sensitive data නැති demo data පමණක්.

## 00:45–04:15 — Ravindu: access සහ Google

**00:45–01:45 / V-01, V-02** — Original `before` evidence එකේ public registration/admin token line පෙන්වන්න. Secured `routes/api.php` හි `/register` admin group යටතේ තිබීම හා `AccessControlTest.php` හි anonymous/cashier responses පෙන්වන්න.

> “Original `/register` login නැති request එකකින් admin account සහ token දුන්නා. තව admin middleware ලියා තිබුණත් routes වලට apply නොවී තිබුණා. Backend එකේ registration admin-only කළා; cashierට privileged endpoints `403`.”

**01:45–02:30 / V-03** — `ScopedToDepartment.php` සහ other-branch record test පෙන්වන්න.

> “Colombo cashier කෙනෙක් Kandy customer ID එක දුන්නොත් කලින් data ආවා. දැන් query එක userගේ branch එකට scope නිසා වෙනත් branch record `404`. UI එකේ hide කිරීමක් නොව API rule එකක්.”

**02:30–04:15 / OIDC** — Google login button සහ real end-to-end flow සාර්ථකව කලින් setup කර තිබේ නම් click කර login පෙන්වන්න. ඉන්පසු `GoogleOidcService.php` හි `aud`, `nonce` checks; `GoogleAuthController.php` හි existing active staff lookup පෙන්වන්න.

> “Google identity verify කරයි; අපේ database එකේ active staff record එකක් තිබුණොත් පමණක් POS access. Authorization Code + PKCE යොදා code exchange ආරක්ෂා කරනවා. `state` callback එකට, `nonce` token replay එකට, `aud` token එක අපේ app එකටම නිකුත් වුණාද කියලා බලන්න. අමුතු Google account එකකින් user auto-create නොවේ.”

**Google live login fail නම්:** “Real OAuth setup අද demo environment එකේ complete නැති නිසා live round trip එක නොපෙන්වමි. මේ code සහ state/PKCE automated tests පෙන්වන්නම්; live verification තව අවශ්‍යයි.” කියන්න. Live login කරනවා වගේ pretend කරන්න එපා.

## 04:15–07:45 — Malith: invoice/ledger/audit

**04:15–05:30 / V-10** — Original/fixed test output හෝ `BusinessIntegrityTest.php` හි tampered price test. `InvoiceController.php` හි server price lookup/approval block පෙන්වන්න.

> “Original server totals ගණනය කළත් item price එක cashierගේ request එකෙන් ගත්තා. රු 32,000 product එක රු 1ට invoice කරන්න පුළුවන්. දැන් FIFO stock batches/service record එකෙන් authoritative price ගෙන request එකේ price compare කරනවා. Mismatch එක `422`; stock change නොවේ.”

**05:30–06:25 / discount** — `resolveApprovedDiscount()`, `consumed_at`, `consumed_inv_no`; web `invoicePayload.js` පෙන්වන්න.

> “Discount එකකට approved, unused request එකක් අවශ්‍යයි. එක approval එක දෙවරක් භාවිතා කරන්න බැහැ. Web request එක totals, balance හෝ `inv_by` author කරන්නේ නැහැ.”

**06:25–07:05 / V-04** — `CustomerController.php` `$validated`, `prohibited` fields සහ debt test.

> “`validate()` පසුව `$request->all()` යවන එකෙන් customer debt වෙනස් කරන්න පුළුවන් වුණා. දැන් allowed fields පමණක් update වෙනවා; debt වෙනස් කිරීමට ledger endpoint අවශ්‍යයි.”

**07:05–07:45 / V-11** — `AuditLogger.php` සහ admin audit screen/recorded evidence.

> “Failed login, credit adjustment, invoice cancel වැනි actions actor, time, old/new amounts සමඟ audit table සහ security log එකේ තියෙනවා.”

## 07:45–11:15 — Nimthara: XSS සහ cost confidentiality

**07:45–08:50 / V-13** — `escapeHtml.js` හා `escapeHtml.test.js` හි harmless local XSS test. `SalesHistory.jsx` print interpolation path පෙන්වන්න.

> “React JSX default escaping තිබුණත් receipt එක template string සහ `document.write` මඟින් හැදූ නිසා customer name HTML ලෙස run වුණා. Admin print කළ විට token theft path එකක් තිබුණා. දැන් අකුරු පහ escape කරනවා; browser parser test එක injected `<img>` element එකක් නොහදන බව බලනවා.”

**08:50–09:35 / V-16** — `auth.js`, `AuthContext.jsx` හි memory/session token සහ `/me` recheck.

> “කලින් role හා token `localStorage` තුළ තිබුණා. දැන් role server `/me` response එකෙන් refresh වෙනවා; token persistence per-tab. මෙය httpOnly cookie වගේ perfect XSS protection එකක් නොවන බවත් report එකේ කියලා තියෙනවා.”

**09:35–10:05 / V-17** — `validateUpload.js` හි 10 MB, signature, row cap.

> “File picker `accept` එක hint එකක්. Upload එකේ size, extension, MIME, magic bytes සහ parsed row count check කරනවා.”

**10:05–11:15 / V-20** — `HidesCostFromEmployees.php` සහ `ResponseFilteringTest.php`. Browser Network tab stock response එකේ cashier/admin වෙනස පෙන්විය හැක.

> “Cashierට selling price අවශ්‍යයි, supplier cost/margin අවශ්‍ය නැහැ. Original UI එක column සඟවා තිබුණත් JSON එක ඒ අගයන් දුන්නා. Model serialization default hidden; adminට explicit reveal. Cashierට endpoints තව `200`, `selling_price` ලැබෙනවා; cost keys නැහැ.”

## 11:15–14:45 — Hamna: config සහ CI

**11:15–12:15 / V-08, V-09** — `config/cors.php`, `SecurityHeaders.php`, `ConfigurationTest.php`.

> “Wildcard CORS වෙනුවට approved frontend origins. Global security middleware නිසා error responses වලත් headers තියෙනවා. CORS කියන්නේ authentication නොවේ; server roles වෙනම enforce කරනවා.”

**12:15–13:15 / V-12, V-15, V-18** — before/after audit summaries; web `vercel.json` හි `https://` proxy සහ CSP.

> “Browserට HTTPS තිබුණත් proxy සිට APIට HTTP යන hop එකේ token unencrypted වුණා. එය HTTPS කළා. Frontend CSP/headers එක් කළා. Composer advisories 41 සිට 0, npm 23 සිට 0 වුණා.”

**13:15–14:45 / tests හා CI** — API/web `.github/workflows/security.yml`; actual GitHub Actions status බලන්න. Local evidence output නම් එසේ label කරන්න.

> “Backend security suite පසුව 90 tests/230 assertions දක්වා වැඩි වුණා. Frontend tests 19 pass. CI එක push/PR මත tests, security lint, dependency audit හා secret checks run කරන්න සකස් කර තිබෙනවා. Full old lint cleanup තව `NF-6` ලෙස ඉතිරි.”

## 14:45–17:30 — සාක්ෂි, merge සහ limitations

**14:45–15:50 / before/after** — `evidence/before/poc-dynamic-testing.txt` හි successful exploits; `evidence/after/poc-dynamic-testing.txt` හි `Still exploitable: 0`, `Fixed: 14` කියන summary zoom කර පෙන්වන්න. Local isolated DB හරි නම් `node evidence/poc/run-all.mjs` run කරන්න. එය finish වීමට කාලය ගනී නම් saved evidence එකක් වශයෙන් පැහැදිලි කරන්න.

> “0/14 කියන්නේ tests 14 fail කියන එක නොවේ. Attack checks 14න් fixed app එකට සාර්ථක exploit ගණන 0. වෙනම PHPUnit 90 pass සහ Vitest 19 pass.”

**15:50–16:40 / Git** — secure backend/frontend GitHub repo `main` history, feature commits/merge commits, `v0-original-vulnerable...main` compare view. හැකි නම් URL browser එකේ පෙන්නන්න. `D:\ass clone` commit-order folder එක source-history වෙනුවට යොදා නොගන්න.

> “Original baseline tag එකෙන් fix කළ main දක්වා diff එක පෙන්වන්න පුළුවන්. Member workstream branches merge කර තිබෙනවා. Individual contribution සම්බන්ධයෙන් අපි ඇත්ත Git authors සහ කළ වැඩ සත්‍යව පෙන්වනවා.”

**16:40–17:30 / residual risks** — report §7; NF-1, NF-2, NF-3, NF-5 කෙටියෙන්.

> “Customer PII encryption-at-rest, httpOnly cookie architecture, app-wide MFA සහ hosting/history cleanup ඉතිරි. මේවා නොසඟවා හේතු සහ current mitigations report එකේ සඳහන් කළා.”

## 17:30–18:00 — closing

> “අපේ README එකේ original/secured GitHub links, member details සහ video link; PDF report එකේ vulnerabilities, before/after proof, fixes සහ ඉතිරි risks. Secure project එකේ code හා tests නැවත run කළ හැක. ස්තුතියි.”

Record කළ පසු exact duration, audio, visible text සහ secret exposure නැවත බලන්න. YouTube URL එක README එකට දාන්න; නැත්නම් submission incomplete.
