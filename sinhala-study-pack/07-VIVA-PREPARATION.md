# 07 — Viva preparation: පෙන්වන්න ඕන දේ සහ කෙටි පිළිතුරු

මෙහි අරමුණ answer පාඩම් කිරීම නොව **request එක code තුළ ගමන් කරන හැටි** තේරුම් ගැනීමයි. Examiner file එකක් open කරන්න කිව්වොත් path, function, old problem, current behaviour, test එක සහ limitation එක සම්බන්ධ කර කියන්න. නොදන්නා දේ “දැනට verify කර නැහැ” කියා සත්‍යව පිළිගන්න.

## Viva එකට laptop එකේ ready තබන්න

1. `Assignment.docx` සහ `report/SE4030_Report.pdf` හි rubric/finding list.
2. Secure API repo `D:\ass_sd\work\pubudu-pos-api-secure` සහ web repo `D:\ass_sd\work\pubudu-pos-front-end-secure`.
3. GitHub `v0-original-vulnerable...main` compare view, feature branches හා merge commits.
4. `evidence/before/` සහ `evidence/after/` output files.
5. Local seeded demo app/DB, නැත්නම් saved output ලෙස හඳුන්වන reproducible evidence. Production data හෝ secrets නැහැ.
6. Google login real config තිබේ නම් working browser tab; නැත්නම් code/test explanation සඳහා සූදානම් වෙන්න.

## Examiner අහන ඕනෑම vulnerability එකකට පිළිතුරු දෙන template එක

**(1) කලින්:** කවුරුන් කුමන request/data යැව්වාද?  
**(2) Impact:** දත්ත/මුදල්/privilege මොකක් අනතුරේද?  
**(3) Root cause:** කුමන file/function එකේ trust check වැරදියිද?  
**(4) Fix:** නව rule එක **server** හෝ safe output context තුළ කොහේද?  
**(5) Proof:** test name/status; before/after result.  
**(6) Limit:** තව ඉතිරි risk එකක් තිබේද?

උදාහරණය V-10: “Cashier request එකේ `selling_price=1` යවා රු 32,000 tyre එක රු 1ට invoice කළා. Server totals ගණනය කළත් unit price browser එකෙන් ගත්තා. `InvoiceController::store` තුළ stock batch price සහ approved discount resolve කර mismatched price `422` කරනවා. `BusinessIntegrityTest` හි tampered price reject, correct price accept, approval replay reject. Frontend `invoicePayload.js` server-owned totals යවන්නේ නැහැ.”

## Common technical questions — සරල පිළිතුරු

### Project සහ methods

**Q1. අලුත් app එකක් හැදුවාද?**  
නැහැ. කලින් තිබුණු POS backend/frontend clone කර original baseline tag එක තැබුවා; එයට security changes එක් කළා. Original හා secured repo links README එකේ.

**Q2. මේ project එකේ scope ප්‍රමාණවත් ඇයි?**  
Invoices, customer credit, stock, branches, roles, approvals සහ reporting එකට බැඳී ඇති නිසා authorization, business logic, browser input, configuration යන වෙනස් security risks තිබෙනවා.

**Q3. Vulnerabilities සොයාගත්තේ කොහොමද?**  
Manual source review (routes/controllers/React templates/config), HTTP attack probes, dependency audits, then regression tests. Scanner එකක් පමණක් role policy හෝ price rule එක තේරුම් නොගනී.

**Q4. White-box සහ black-box අතර වෙනස?**  
White-box = code කියවා root cause සොයාගැනීම. Black-box/dynamic = running APIට requests යවා real response/impact බලන එක. අපි දෙකම භාවිතා කළා.

**Q5. `0/14` negative result ද?**  
නැහැ. Attack suite එකේ 14 exploit attempts අතරින් fixed app එකේ successful exploitation **0**. PHPUnit **90 pass / 230 assertions**, Vitest **19 pass** වෙනම test results. Suite එකේ “Fixed 14” කියන්නේ targeted attack checks 14; report findings 19ක් සමඟ ගණන් එකිනෙක එකතු නොකරන්න.

**Q6. 19 findings සහ 5 residual risks ගැන count එක කියන්නේ කොහොමද?**  
Report එකේ V IDs 19ක් විස්තර කරනවා. NF-1–NF-5 යනු සම්පූර්ණ remediation නොකළ residual/architectural risks. NF-6 lint maintenance item. Dynamic suite 14 checks. මේවා වෙන වෙනම counts.

### Access control හා identity — Ravindu

**Q7. Authentication සහ authorization වෙනස?**  
Authentication: user කවුද. Authorization: ඒ userට route/record/property එකට access තිබේද. Cashierට valid token තිබුණත් admin route තහනම්.

**Q8. Middleware code තිබුණත් bug එක තිබුණේ ඇයි?**  
`admin` middleware register කර තිබුණත් privileged routes වලට apply වී තිබුණේ නැහැ. Route definitions පරීක්ෂා කරන tests නැති නිසා මග හැරුණා.

**Q9. IDOR කියන්නේ?**  
ID එක වෙනස් කර වෙනත් branch එකක record එක ගැනීම. `visibleTo($request->user())` වැනි query scoping නිසා API එක userගේ branch data පමණක් දෙයි.

**Q10. 403 සහ 404 භාවිතය?**  
Admin route එකට cashier යනවා නම් authorization refusal `403`. වෙනත් branch එකක record ID එක දුන්නා නම් `404` දීමෙන් එම record එක තිබෙන බවත් හෙළි නොකරයි.

**Q11. Token එක expire වුණා කියලා පමණක් inactive staff block වෙනවාද?**  
Expiry ඉවර වන තෙක් token වලංගු විය හැක. `EnsureUserIsActive` සෑම request එකකම status බලනවා; deactivation/revocation test එකත් තියෙනවා.

**Q12. OAuth සහ OIDC වෙනස?**  
OAuth delegated authorization; OIDC identity layer සහ ID token. මෙහි Google identity verify කර staff login ලබා දෙනවා.

**Q13. Authorization Code + PKCE ඇයි?**  
Browserට access token direct URL fragment එකෙන් නොදීමට හා authorization code intercept කළත් verifier නැති අය redeem නොකරන ලෙස. Server එකේ client secret සහ verifier ආරක්ෂිතව තබනවා.

**Q14. `state`, `nonce`, `aud`?**  
`state`: callback server ආරම්භ කළ flow එකට අයත්ද/CSRF. `nonce`: ID token replay නවතයි. `aud`: token එක අපේ client ID සඳහාද බලයි. Signature හරි වුණත් වෙන app එකකට නිකුත් වූ token එක ප්‍රතික්ෂේප කළ යුතුයි.

**Q15. Google account එකක් තිබුණාම POS access ලැබේද?**  
නැහැ. අපේ database එකේ කලින් admin විසින් හදා ඇති active staff record එකක් ගැළපිය යුතුයි. Role එක Google account එකෙන් නොව POS database එකෙන්.

### Invoice සහ audit — Malith

**Q16. Browser price එක විශ්වාස නොකළ යුත්තේ ඇයි?**  
Cashier UI request එක DevTools/HTTP client එකකින් වෙනස් කළ හැක. Server totals ගණනය කළත් unit price attacker-controlled නම් ව්‍යාජ total එකක් save වේ.

**Q17. FIFO price සහ database transaction එකේ කාර්යය?**  
Actual stock batches වලින් විකුණන quantity අනුව මිල resolve කරයි. Sale, stock movement, discount consumption එකම transaction එකේ; fail වුණොත් අඩක් පමණක් save නොවේ. Locks concurrent use අඩු කරයි.

**Q18. Approval replay නවත්වන්නේ කොහොමද?**  
Approved discount එක same cashier/product/limitට ගැළපිය යුතු අතර `consumed_at` හිස් විය යුතුයි. භාවිතයෙන් පසු `consumed_at`/invoice link තබයි.

**Q19. `$request->all()` අවදානම?**  
Extra fields update වෙන්න පුළුවන්. `validate()` කළ පසු `$validated` subset එක පමණක් assign කරනවා; customer code model `$fillable` එකෙන් ඉවත් කළා.

**Q20. Audit log එකෙන් action නවත්වනවාද?**  
නැහැ; audit එක detection/forensics. Prevention authorization/validation/price rules වලින්. Audit එක actor, old/new values, time/IP සහ critical action trace කරයි.

### Frontend හා data disclosure — Nimthara

**Q21. React තිබුණත් XSS ආවේ ඇයි?**  
React JSX escaped. නමුත් print/report template `document.write()` raw HTML. ඒ path එකට explicit escaping අවශ්‍යයි.

**Q22. `escapeHtml` කරන ප්‍රධාන replacements?**  
`&`, `<`, `>`, double/single quotes. Text හා quoted attribute contexts සඳහා. JS-string context වෙනම handle කළ යුතුයි.

**Q23. `localStorage` වෙනුවට `sessionStorage` දැම්මාම XSS impossibleද?**  
නැහැ. Same-origin injected JavaScriptට sessionStorage කියවිය හැක. Persistence අඩුයි; XSS source fix සහ server-side role recheck අනිවාර්යයි. httpOnly cookie future improvement.

**Q24. Frontend cost column hide කළත් leak ඇයි?**  
Network response එකේ JSON fields තව තියෙනවා. API model/hand-built response දෙකම employeeට cost fields omit කළ යුතුයි. `selling_price` තව ලබා දේ.

**Q25. Magic bytes file safe බව ඔප්පු කරනවාද?**  
නැහැ. Renamed binary file එකක් අල්ලන layer එකක්. Parser update, size/row caps හා output escaping ද අවශ්‍යයි.

### Configuration සහ CI — Hamna

**Q26. CORS wildcard එක login bypass එකක්ද?**  
CORS browser origin-sharing policy එකක්; authentication substitute නොවේ. Wildcard එක cross-origin response exposure අවදානම වැඩි කළා. Backend auth/role checks වෙනම.

**Q27. API headers සහ frontend CSP වෙන වෙනම ඇයි?**  
API JSON responses වල අවසර දැඩියි (`default-src 'none'`), SPAට scripts/fonts/API calls අවශ්‍යයි. ඒ නිසා context අනුව policies වෙනස්.

**Q28. HSTS HTTP local response එකේ නැත්තේ?**  
HSTS HTTPS connections සඳහා පමණක්. Middleware request secure නම් පමණක් emit කරයි.

**Q29. Composer/npm audit 0 කියන්නේ app perfectද?**  
නැහැ. එම scan එකේ known package advisories 0. Authorization/business logic/XSS වෙනම code/test reviews අවශ්‍යයි; අලුත් advisories අනාගතයේ එන්නත් පුළුවන්.

**Q30. CI එකෙන් security හොඳ වෙන්නේ කොහොමද?**  
Pull request/push මත tests, security lint, dependency audits සහ secret checks නැවත run වේ. Regression එක අල්ලාගත හැක. Green CI තිබුණා කියා live OAuth/hosting deployment ද පරිපූර්ණයි කියා නොවේ.

## Examiner screen එකේ පෙන්වන්න කිව්වොත් file map

| ප්‍රශ්නය | API file | Web file | Test/evidence |
|---|---|---|---|
| Admin registration | `routes/api.php`, `AuthController.php` | `Login.jsx` | `AccessControlTest.php` |
| Branch IDOR | `ScopedToDepartment.php`, `CustomerController.php` | — | `AccessControlTest.php` |
| Google OIDC | `GoogleOidcService.php`, `GoogleAuthController.php` | `googleAuth.js`, `GoogleCallback.jsx` | `ConfigurationTest.php` |
| Price/discount | `InvoiceController.php` | `invoicePayload.js`, `CreateInvoice.jsx` | `BusinessIntegrityTest.php`, `invoicePayload.test.js` |
| Debt update | `CustomerController.php`, `Customer.php` | — | `BusinessIntegrityTest.php` |
| Audit | `AuditLogger.php`, `AuditLog.php` | — | `BusinessIntegrityTest.php` |
| XSS | — | `escapeHtml.js`, `SalesHistory.jsx` | `escapeHtml.test.js` |
| Session role | `routes/api.php` | `auth.js`, `AuthContext.jsx` | `AuthenticationTest.php` |
| Cost leak | `HidesCostFromEmployees.php`, `GrnController.php` | stock screen Network | `ResponseFilteringTest.php`, `v20-cost-leak.txt` |
| CORS/headers | `config/cors.php`, `SecurityHeaders.php` | `vercel.json` | `ConfigurationTest.php` |
| Supply chain/CI | `composer.json`, `.github/workflows/security.yml` | `package.json`, `.github/workflows/security.yml` | before/after audit output |

API paths ඉහත සියල්ලට base `D:\ass_sd\work\pubudu-pos-api-secure\app\...` හෝ tests/config/routes path; web paths සඳහා base `D:\ass_sd\work\pubudu-pos-front-end-secure\src\...` යොදාගන්න. හරියටම තැන නොදන්නා නම් editor search (`rg`/Ctrl+P) යොදා function එක සොයන්න.

## අවසානයේ මතක තබාගන්න

- “100% marks ලැබේ” කියා නොකියන්න. හොඳ evidence තිබුණත් marking examiner සතුයි.
- Git branch names/folders හතර තිබීම actual authorship prove නොකරයි. Git history සහ සාමාජිකයන්ගේ සත්‍ය explanation සමඟ contribution පෙන්වන්න.
- Original vs fixed evidence පැහැදිලිව label කරන්න. Saved output එක live run එකක් ලෙස ඉදිරිපත් කරන්න එපා.
- OIDC code/tests තිබීම real Google login success කියා කියන්න එපා; real credentials සමඟ demo කළ හැකි නම් ඒක ඉහළ evidence.
- නොකළ fixes `NF-1`–`NF-5` හේතුව සමඟ කියන්න. `NF-6` maintenance issue එක security count එකට එක් නොකරන්න.
