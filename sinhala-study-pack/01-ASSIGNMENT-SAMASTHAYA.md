# 01 — Assignment එක සහ අපේ මුළු වැඩේ

මෙය SE4030 Secure Software Development assignment එක තේරුම් ගැනීමට ඇති **study guide** එකකි. නිල submission එකේ source of truth වන්නේ `Assignment.docx`, `README.txt`, `report/SE4030_Report.pdf` සහ Git repositories ය. මෙය viva සඳහා තේරුම් ගැනීමට ලියූ සරල විස්තරයකි.

## එක වාක්‍යයකින් අපේ project එක

“අපි Pubudu Tyres POS system එකේ පරණ code එකේ ආරක්ෂක දෝෂ සොයා, ඒවා API සහ web දෙපසින් නිවැරදි කර, tests වලින් ඔප්පු කළා; Google OpenID Connect login එකක් ද එක් කළා.”

## Assignment එකේ නියම ඉල්ලීම්

Group එකේ **හතර දෙනෙක්**. මුළු assignment එකට **ලකුණු 25**. තෝරා ගන්නේ කලින් තිබුණු web/mobile app එකක්. Original code එකේ අවසාන commit එක semester පටන් ගැනීමට කලින් විය යුතුයි. Vulnerability ඉගෙනුම් සඳහාම හදපු WebGoat/DVWA වැනි app එකක් භාවිතා කරන්න බෑ.

කළ යුතු දේ:

1. ප්‍රමාණවත් complexity ඇති app එකක් තෝරන්න.
2. වෙනස් vulnerabilities **අවම 7ක්** හඳුනාගන්න. Original code/request වල ඒවා තිබුණු බව පෙන්වන්න.
3. ඒවා fix කරන්න; fix නොකළ දේ සහ හේතුව කියන්න.
4. OAuth හෝ OpenID Connect grant/flow එකක් යොදා feature එකක් එක් කරන්න.
5. ආරක්ෂිත engineering practices ගැන සාකච්ඡා කරන්න.
6. Individual contribution පෙන්වන්න; presentation/viva එකට මුහුණ දෙන්න.

භාරදීම: member සම්පූර්ණ නම්/index numbers සහ original/modified GitHub links ඇති README, **මිනිත්තු 20ට නොවැඩි YouTube video**, PDF report — මේවා **එක ZIP** එකකට. Assignment එකේ modified repository එකේ විස්තරාත්මක commit history අවශ්‍ය බව විශේෂයෙන් කියා තිබේ. Rubric එක project තේරීම, vulnerabilities සොයාගැනීම, fixes, OAuth/OIDC, discussion, individual contribution බලනවා. Rubric එකේ “Good (10–8)” යනාදිය එක් එක් row එකට එලෙසම එකතු කර 25 කියා ගණන් කරන්න එපා; අවසාන තීරණය examiner සතුයි.

## ඇයි Pubudu Tyres POS?

මෙය Laravel REST API + React frontend ඇති සැබෑ POS/mini-ERP app එකක්. Invoices, credit balances, stock/GRN, branches, employee/admin roles, discount approvals, profit reports වගේ modules තියෙනවා. ඒ නිසා “security bug එකක් නිසා ව්‍යාපාරයට මොකද වෙන්නේ?” කියා පැහැදිලි කරන්න පුළුවන්: නොමිලේ admin access, වැරදි invoice මිල, customer debt වෙනස් වීම, supplier cost leak වීම.

Original backend: `https://github.com/Chathura876/pubudu-pos-api`  
Original frontend: `https://github.com/Chathura876/pubudu-pos-front-end`  
Secured backend: `https://github.com/Ravindu200232/pubudu-pos-api-secure`  
Secured frontend: `https://github.com/Ravindu200232/pubudu-pos-front-end-secure`

README අනුව original commits 2026 මැයි මාසයේ. ඒ දිනය **semester start dateට කලින්ද කියා** course timetable එකෙන් තහවුරු කළ යුතුයි. Secure repos markerට විවෘතව පෙනෙන බවත් submission දිනේ verify කරන්න.

## System එකේ data ගමන් කරන හැටි

```text
Cashier/Admin browser (React)
     │ invoice, stock, customer, login requests
     ▼
Laravel API ── middleware (authentication/role/active user)
     │ business rules + database transactions
     ▼
MySQL (users, invoices, customers, stock, audit_logs)
```

**Authentication** = “ඔබ කවුද?” (`login`, token, Google identity).  
**Authorization** = “ඔබට මේ action/data බලන්න පුළුවන්ද?” (admin vs cashier, branch scope).  
**Validation** = request values නීත්‍යනුකූලද?  
**Server authority** = මුදල්/role/identity වැනි තීරණ browser එකෙන් නොව backend එකෙන් ගන්න එක.  
**Regression test** = එකවර fix කළ bug එක නැවත එන්න නොදෙන automated check එක.

## අපි වැඩ කළ පියවර

1. Original commit/tag (`v0-original-vulnerable`) එක baseline ලෙස තැබුවා.
2. Original source code අතින් කියවා routes, controllers, React print templates, dependencies සහ deployment config බැලුවා. මෙය **white-box review**.
3. API requests/browser behaviour සහ dependency tools යොදා දෝෂ reproduce කළා. මෙය **dynamic/black-box proof**.
4. එක් එක් security theme එකට feature branches/commits වල fixes කළා.
5. API PHPUnit tests, frontend Vitest tests, PoC attack scripts සහ audit/lint/build checks යොදා පරීක්ෂා කළා.
6. Feature branches secure backend/frontend repos වල `main` එකට merge කළා; PDF report සහ submission evidence සකස් කළා.

## Findings තේරුම් ගන්නා වගුව

| ප්‍රදේශය | IDs | අවදානම සහ fix එකේ අදහස |
|---|---|---|
| Access control | V-01, V-02, V-03, V-20 | ඕනෑම කෙනෙකුට admin account; cashierට admin routes/වෙනත් branch records/supplier costs. Server-side role, branch සහ property filtering. |
| Login/session | V-05, V-06, V-16 | Username හෙළි වීම, guessing, දුර්වල password, පරණ token, browser role trust. Rate limit, password rules, expiry, `/me` recheck. |
| Money/business logic | V-04, V-10, V-11 | Debt mass assignment, client දුන් price විශ්වාස කිරීම, audit log නැති වීම. Validated fields, server price/approval, audit trail. |
| Browser/input | V-13, V-14, V-17 | Print XSS, `.env` Gitට යාම, unvalidated upload. Escaping, secret rules, file checks. |
| Configuration/dependencies | V-07, V-08, V-09, V-12, V-15, V-18 | Error/source leak, wildcard CORS, headers නැති වීම, outdated packages, HTTP proxy. Safe errors, allow-list, headers/CSP, updates, HTTPS. |

Report එකේ vulnerability IDs 19ක් (`V-01`–`V-18` සහ `V-20`) ලැයිස්තුගතයි. **“19 = 14 fixed + 5 unfixed” කියා ID-by-ID එකතු කරන්න එපා**: report එකේ 14 කියන්නේ runtime attack checks ගණන; ඉතිරි risks `NF-1`–`NF-5` වෙනම ලැයිස්තුවකි. සමහර V findings වල mitigations තිබුණත් deployment/history වැනි කොටස් තව ඉතිරි. `NF-6` යනු security vulnerability එකක් නොව පරණ lint maintenance item එකකි. Viva එකේ මේ counts වෙන වෙනම කියන්න.

## තහවුරු කළ ප්‍රතිඵල

| Evidence | Original/before | Fixed/after |
|---|---:|---:|
| Core dynamic attacks | 12/12 succeed; V-20 වෙනම reproduce | Targeted checks 14න් exploit කළ හැකි 0 |
| Backend security test suite | ඒ suite එක තිබුණේ නැහැ | 90 passed, 230 assertions |
| Frontend tests | ඒ suite එක තිබුණේ නැහැ | 19 passed |
| Composer advisories | 41 | 0 |
| npm advisories | 23 | 0 |

Source files: `evidence/before/`, `evidence/after/`, `evidence/poc/`. `run-all.mjs` **14 targeted checks** පරීක්ෂා කරනවා; සියලු 19 findings සඳහා end-to-end test එකක් යැයි නොකියන්න. Local evidence එක production deployment එකේ තත්ත්වය ඔප්පු කරන්නේත් නැහැ.

## OAuth/OIDC කියන්නේ මොකක්ද?

Google වෙතින් **identity proof** ගෙන staff login එකක් ලබා දෙන feature එක. අපි Authorization Code flow + PKCE යොදා තිබෙනවා. Admin කලින් staff account එක හදයි; Google විසින් email/account identity තහවුරු කරයි; backend ID token signature සහ claims පරීක්ෂා කරයි; ගැළපෙන active staff record එකක් තිබුණොත් පමණක් POS session token දෙයි. නොදන්නා Google account එකකින් user කෙනෙක් auto-create නොවේ. විස්තර `02-RAVINDU.md` හි ඇත.

## ඉතිරි risk සහ honest limitations

- `NF-1`: customer PII database encryption-at-rest තව නැහැ; searchable encryption/index migration අවශ්‍යයි.
- `NF-2`: bearer token වෙනුවට httpOnly cookie architecture එකක් තව නැහැ.
- `NF-3`: app-wide admin MFA/TOTP නැහැ; Google login තිබීම එයට සමාන නොවේ.
- `NF-4`: frontend UI/build dependencies අඩු කිරීම ඉතිරි.
- `NF-5`: පරණ Git history හා hosting document-root/hostnames සම්පූර්ණ remediation ඉතිරි.
- `NF-6`: පරණ non-security lint errors ඉතිරි.

## GitHub සහ contribution ගැන පැහැදිලි කිරීම

Secure API සහ web repositories වල code සහ merge history තියෙනවා. `D:\ass clone` යනු ඒ commits **order එකට export කළ local folder set එකක්**; `commit-order.txt` බලන්න. Export folders වෙනත් GitHub repo එකකට copy කිරීමෙන් actual Git commit author වෙනස් නොවේ. අලුතින් GitHub repo එකක් හදා තිබුණොත් URL එකෙන් actual commits/authors/merges වෙනම පරීක්ෂා කරන්න. සත්‍යයෙන් කවුරුන් වැඩ කළාද යන්න branch නමකින් තනිවම ඔප්පු නොවේ; වීඩියෝවේදී තමන්ට තේරෙන කොටස තමන්ම පැහැදිලි කරන්න.

හතර දෙනාට API සහ web සම්බන්ධ scope ඇත; **exact 25% code lines** යැයි කියන්න බැහැ. 25 කියන්නේ assignment එකේ **මුළු ලකුණු**. Individual contribution තක්සේරුව memberගේ සත්‍ය වැඩ සහ viva explanation මත රඳා පවතී.

## දැන් මේ pack එක කියවන්නේ කොහොමද?

- Ravindu: `02-RAVINDU.md`
- Malith: `03-MALITH.md`
- Nimthara: `04-NIMTHARA.md`
- Hamna: `05-HAMNA.md`
- එකට rehearse කිරීමට: `06-VIDEO-SCRIPT-AND-DEMO.md`
- Viva ප්‍රශ්න/පිළිතුරු: `07-VIVA-PREPARATION.md`

**Submissionට ඉතිරි:** full names/index numbers, YouTube URL, real Google login demo, repo visibility, original date check, final ZIP check. 25/25 ලැබෙන බව කිසිවකුට guarantee කළ නොහැක; මේ ඉතිරි දේවල් rubric එකට සැලකිය යුතුය.
