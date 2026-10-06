# SE4030 Assignment එක සරල සිංහලෙන්

මේ ලේඛනය අපේ assignment එක ගැන **තේරුම් ගැනීමට සහ viva/video එකට සූදානම් වීමට** ලියූ guide එකකි. භාර දෙන නිල report එක [SE4030_Report.pdf](report/SE4030_Report.pdf) ය. මෙහි සඳහන් සංඛ්‍යා සහ තත්ත්වය දැනට workspace එකේ ඇති report, README, tests සහ Git history මත පදනම් වේ. Submission එකට පෙර අලුත් වෙනස්කම් තිබේ නම් නැවත පරීක්ෂා කරන්න.

## 1. Assignment එකෙන් ඇත්තටම ඉල්ලන්නේ මොනවාද?

මෙය හතර දෙනෙකුගේ **Secure Software Development** group assignment එකක්; මුළු ලකුණු **25**කි. අලුතින් සාමාන්‍ය web app එකක් ලිවීම පමණක් ප්‍රමාණවත් නැහැ. තිබෙන app එකක් අරගෙන එහි ආරක්ෂක දෝෂ සොයා, ඒවා නිවැරදි කර, ඒක වැඩ කරන බවට සාක්ෂි පෙන්විය යුතුයි.

Assignment sheet එකේ ප්‍රධාන ඉල්ලීම් මෙන්න:

1. ප්‍රමාණවත් වැඩ ප්‍රමාණයක් හා සංකීර්ණත්වයක් ඇති web/mobile app එකක් තෝරන්න. Original app එකේ අවසාන commit එක semester එක පටන් ගැනීමට කලින් තිබිය යුතුයි. ඉගෙනුම සඳහාම සැකසූ WebGoat/DVWA වැනි app එකක් තෝරන්න එපා.
2. **එකිනෙකට වෙනස් vulnerabilities අවම වශයෙන් 7ක්** සොයාගන්න. Original code සහ හැසිරීමෙන් ඒවා තිබුණු බව පෙන්වන්න.
3. ඒවා නිවැරදි කිරීමට උත්සාහ කරන්න. Fix කළ දේ සහ fix නොකළ දේ (ඒ ඇයිද යන්නත්) report එකේ පැහැදිලි කරන්න.
4. **OAuth හෝ OpenID Connect** භාවිතා කර අලුත් feature එකක් හෝ පරණ feature එකක update එකක් implement කරන්න.
5. Software engineering ක්‍රියාවලි හොඳට තිබුණා නම් මේ දෝෂ වැළැක්වීමට තිබුණේ කොහොමද කියා සාකච්ඡා කරන්න.
6. හතර දෙනාගේ **individual contribution** පෙන්වන්න; presentation/viva එකට සූදානම් වන්න.

භාර දිය යුත්තේ **එක ZIP එකක්**: member නම් සහ index numbers, original/modified GitHub links, උපරිම **මිනිත්තු 20ක YouTube video link**, PDF report. Modified project එකේ **විස්තරාත්මක Git commit history** assignment එක පිළිගැනීමට වැදගත් කොන්දේසියකි. Rubric එකේ project තේරීම, vulnerabilities සොයාගැනීම, fixes, OAuth/OIDC, discussion සහ individual contribution යන කොටස් බලනවා.

## 2. අපි තෝරාගත්ත project එක

**Pubudu Tyres POS / mini-ERP** කියන්නේ ටයර්/auto-parts ව්‍යාපාරයක sales සහ stock පාලනය කරන app එකක්. මෙහි invoice, credit sales, customer ledger, goods-received notes (GRN), stock batches, branches/departments, staff roles, discount approval සහ profit reports තිබෙනවා.

- **Backend / API:** PHP Laravel, MySQL සහ staff login සඳහා tokens.
- **Frontend / web:** React app එක; cashier/admin භාවිතා කරන screens.
- **Original repositories:** `Chathura876/pubudu-pos-api` සහ `Chathura876/pubudu-pos-front-end`.
- **Security changes ඇති repositories:** `Ravindu200232/pubudu-pos-api-secure` සහ `Ravindu200232/pubudu-pos-front-end-secure`.

මේ project එක තෝරන්න හේතුව සරලයි: customer තොරතුරු, මුදල්, stock සහ branch permissions එකට ගැටෙන නිසා security දෝෂවල **සැබෑ business impact** පැහැදිලිව පෙන්විය හැක. Original repositories වල අවසාන commit දිනය semester එක පටන් ගැනීමට කලින්ද යන්න submission එකට පෙර නිල semester date එක සමඟ තහවුරු කළ යුතුයි.

## 3. අපි කළ වැඩේ කෙටි කතාව

මුලින් original code සහ API responses බැලුවා. පසුව original app එකට attack/request යවා දෝෂ **ඇත්තටම ක්‍රියා කරන බව** සාක්ෂි එකතු කළා. ඉන්පසු API සහ web code වෙනස් කර tests ලිව්වා. අවසානයේ ඒ requests නැවත යවා දෝෂ exploit කළ නොහැකි බව පරීක්ෂා කළා.

Report එකේ vulnerability IDs **19ක්** (`V-01` සිට `V-18`, සහ `V-20`) සාකච්ඡා වේ. ඒ සෑම එකක්ම සම්පූර්ණයෙන් නැති කළා යැයි කියන්නේ නැහැ: සමහර fixes වලට තව deployment/architecture වැඩ අවශ්‍යයි. වෙනම සටහන් කළ **ඉතිරි security risks 5ක්** (`NF-1` සිට `NF-5`) තිබෙනවා; `NF-6` කියන්නේ security vulnerability එකක් නොව පරණ lint/maintenance වැඩකි. Runtime attack suite එකේ **targeted checks 14ක්** තිබෙන අතර fixed version එකට එරෙහිව ඒවායින් exploit කළ හැකි ගණන **0/14** වුණා. මේ සංඛ්‍යා තුන එකම දෙයක් නොවෙයි: findings, ඉතිරි risks, සහ automated checks වෙන වෙනම ගණන්.

## 4. ප්‍රධාන vulnerabilities සරල උදාහරණ සමඟ

| ID | කලින් තිබුණු ප්‍රශ්නය | අපි කළ වෙනස |
|---|---|---|
| V-01 | Login නැති කෙනෙකුට `/register` මඟින් admin account එකක් හදා token එකක් ගන්න පුළුවන් වුණා. | Staff account හදන්න authenticated admin කෙනෙකු අවශ්‍ය කළා; අලුත් staff token එක adminට ලබා නොදේ. |
| V-02 | Admin/employee role check එක ලියා තිබුණත් වැදගත් API routes වලට යොදා තිබුණේ නැහැ. | Admin routes වලට role middleware යෙදුවා; cashierට privileged actions සඳහා `403` ලැබෙයි. |
| V-03 | එක් branch එකක cashierට වෙනත් branch එකක customer/invoice ID එක දී තොරතුරු කියවීමට හැකි වුණා (IDOR). | Record query එක userගේ branch එකට සීමා කළා. |
| V-04 | Request එකේ අනවශ්‍ය fields යවා customer debt/ව්‍යාපාරික identifiers වෙනස් කිරීමට හැකි වුණා (mass assignment). | පිළිගන්නා fields පමණක් update කරන ලෙසත් critical values server එකෙන් පාලනය වන ලෙසත් වෙනස් කළා. |
| V-05 | Username හඳුනාගැනීමට වෙනස් errors, password guesses වලට සීමාවක් නැති වීම සහ දුර්වල passwords. | සමාන login error, rate limit, ශක්තිමත් password checks සහ password-change controls එක් කළා. |
| V-06 | Token වලට expiry නැති නිසා සේවකයා ඉවත් කළත් පැරණි token එක වැඩ කළා. | Token expiry සහ inactive staffගේ token ප්‍රතික්ෂේප කිරීම එක් කළා. |
| V-07 | Errors/logs හරහා ඇතුළත SQL/source තොරතුරු leak වුණා. | Safe error responses හා server/config ආරක්ෂණ වැඩ කළා. Hosting document-root සම්බන්ධ අවදානම තව ඉතිරි; `NF-5` බලන්න. |
| V-08 | API එක ඕනෑම website origin එකක් පිළිගත්තා (wildcard CORS). | අවසර ඇති frontend origins විතරක් allow කරන config එකක් දැම්මා. |
| V-09 / V-18 | API සහ frontend security headers/CSP ප්‍රමාණවත් නැහැ. | Response headers සහ frontend CSP එක් කළා. |
| V-10 | Cashier browser එකෙන් invoice item price වෙනස් කර අඩු මිලකට විකිණීමට හැකි වුණා. Server එක totals ගණනය කළත් **client දුන් item price** විශ්වාස කළා. | මිල හා discount server එකෙන් verify/calculate කළා; frontend request එකේ server සතු totals නොයවයි. |
| V-11 | වැදගත් financial/security ක්‍රියා ගැන සොයා බැලිය හැකි audit trail එකක් තිබුණේ නැහැ. | Audit records සහ security logs එක් කළා. |
| V-12 | පරණ framework/packages වල security advisories තිබුණා. | Dependencies update කර audit checks CI එකට එක් කළා. |
| V-13 | Receipt/print HTML එකට data escape නොකළ නිසා stored XSS මඟින් admin token එක සොරකම් කිරීමට හැකි වුණා. | HTML escaping සහ අමතර browser protections එක් කළා. |
| V-14 | Frontend `.env` file එක Git history එකට ගොස් තිබුණා. | Current tree එකෙන් ඉවත් කර නැවත commit නොවීමට ignore/CI checks දැම්මා. පරණ history සම්පූර්ණයෙන් ඉවත් කර නැහැ. |
| V-15 | Frontend proxy එක API වෙත bearer token සහ data plain HTTP මඟින් යැව්වා. | Proxy target HTTPS කළා. |
| V-16 | Browser `localStorage` token/role තොරතුරු තබා ඒවා විශ්වාස කළා. | Session තත්ත්වය සහ role server එකෙන් නැවත ලබාගන්නා ලෙස වෙනස් කළා; ඉතිරි bearer-token අවදානම `NF-2` බලන්න. |
| V-17 | Upload කළ spreadsheet එක නිසි validation නැතිව parser එකට ගියා. | File validation සහ ආරක්ෂිත parsing constraints එක් කළා. |
| V-20 | Cashierට අවශ්‍ය stock APIs මඟින් wholesale cost හා margin fields ද පෙනුණා. | Employee responses වල ඒ fields සඟවා adminට පමණක් ලබා දුන්නා. |

මතක තබාගන්න පහසුම උදාහරණ තුන: **V-01** (ඕනෑම කෙනෙකුට admin account), **V-10** (cashierට browser request එකෙන් මිල වෙනස් කිරීම), **V-13** (print කරන විට admin browser එකේ XSS). Viva එකේ “කලින් request එකෙන් මොකද වෙන්නේ, පසුව මොකද වෙන්නේ?” කියා පෙන්වන්න.

## 5. OAuth / OpenID Connect වැඩේ කුමක්ද?

අපි staff login එකට **Sign in with Google** එක් කළා. භාවිතා කළේ **OpenID Connect (OIDC)**, **Authorization Code flow + PKCE**. තේරුම මෙහෙමයි:

1. Admin කෙනෙක් staff account එක කලින්ම app එකේ හදනවා.
2. Staff member “Sign in with Google” ක්ලික් කරනවා. Google account එකේ identity තහවුරු කරනවා.
3. App එක Google දෙන තාවකාලික authorization code එක secure ලෙස හුවමාරු කරයි; `state`, `nonce` සහ PKCE checks මඟින් request එක ආරක්ෂා කරයි.
4. Backend එක Google ID token එකේ signature, issuer, audience, expiry සහ වෙනත් වැදගත් claims පරීක්ෂා කරයි.
5. Google account එකට ගැළපෙන **කලින් හදා තිබෙන active staff account එකක්** තිබුණොත් පමණක් app session එක ලබා දෙයි. අමුතු Google account එකකින් නව admin/staff user කෙනෙකු auto-create නොවේ.

මේ feature එක V-01 නිසා ඉවත් කළ public self-registration එකට ආරක්ෂිත login ක්‍රමයක් ලබා දෙනවා. **Code එක සහ tests තිබීම, සැබෑ Google login demo එකක් සාර්ථකව සිදුවූ බවට සාක්ෂියක් නොවේ.** Video කිරීමට පෙර real OAuth client configuration දාලා browser එකේ මුළු login round trip එක test කරන්න.

## 6. Four membersගේ වැඩ බෙදීම

| Member | ප්‍රධාන workstream | API + Web සම්බන්ධය |
|---|---|---|
| Ravindu (leader) | Registration/roles/branch access, login/tokens, Google OIDC | API security හා Google login UI |
| Malith | Customer/invoice data integrity, server-side pricing, audit | API business rules හා invoice request UI |
| Nimthara | XSS, browser session/secret/upload protections, cost disclosure | Frontend attack surface හා GRN API response filtering |
| Hamna | CORS/headers/dependencies/HTTPS, security tests සහ CI | API configuration/tests හා frontend transport/CI |

හැම කෙනාටම API සහ web සම්බන්ධ වැඩක් තියෙනවා. **Exact 25% code lines each කියා නොකියන්න.** Code size අනුව බෙදීම අසමාන විය හැක; rubric එකේ “individual contribution” සඳහා එක් එක් memberට තමන්ගේ design choice, code, test සහ demo පැහැදිලි කළ හැකි වීම වැදගත්. Branch/folder එකකට memberගේ නම තිබීම ඔහු/ඇයම commit කළ බවට සාක්ෂියක් නොවේ. වෙනත් කෙනෙකුගේ Git identity අනුකරණය නොකර සත්‍ය contribution පමණක් පෙන්වන්න.

## 7. GitHub, branches, merge, සහ `D:\ass clone` අතර වෙනස

Security fixes ඇති **backend** සහ **frontend** repositories දෙකේ feature branches `main` එකට merge වී තිබේ. Original baseline එකට `v0-original-vulnerable` tag එකක් ඇත; එයින් before/after diff පෙන්විය හැක. මේ දෙක තමයි modified project එකේ code/history සඳහා වැදගත්.

`D:\ass clone` folder එකේ API සහ web commits **order එකට export** කරලා තියෙනවා; `commit-order.txt` ඒවා පෙන්වනවා. එය backup/guide එකක්. Folder එකක් GitHub වෙත copy කිරීමෙන් පමණක් වෙනත් member කෙනෙකුගේ actual Git author identity තහවුරු වෙන්නේ නැහැ. අලුතින් හදපු GitHub repo එකක් ගැන කියනවා නම්, එහි URL එකෙන් actual branch commits, authors සහ merge history වෙනම verify කළ යුතුයි.

`D:\github\SSD_Assigment` ගැන කලින් ඉල්ලීම branch names පමණක් පෙන්වන්න යන්නයි. එහි තත්ත්වය පසුව වෙනස් වී ඇති බව කලින් audit එකක හමු වුණා; එය modified code සඳහා නිල source ලෙස මෙහි උපකල්පනය කර නැහැ. **Assignment submission README එකේ දී ඇති secure API සහ secure frontend repositories දෙක සම්බන්ධයෙන්ම judge කරන්න.**

## 8. Tests සහ සාක්ෂි කියවන්නේ කොහොමද?

| පරීක්ෂාව | කලින් | දැනට වාර්තා වී ඇති ප්‍රතිඵලය |
|---|---:|---:|
| Core attack scripts | 12/12 exploit වුණා; V-20 වෙනම reproduce කළා | targeted runtime checks 14න් exploit වන ගණන 0 |
| Backend security tests | එවැනි suite එකක් නැහැ | 90 pass, assertions 230 |
| Frontend tests | එවැනි suite එකක් නැහැ | 19 pass |
| Composer advisories | 41 | 0 |
| npm advisories | 23 | 0 |

සාක්ෂි [evidence/before](evidence/before), [evidence/after](evidence/after) සහ [evidence/poc](evidence/poc) folders වල තියෙනවා. `before` කියන්නේ original system එකේ දෝෂය; `after` කියන්නේ fix පසු නැවත කළ check එක. Test pass වීම වැදගත්, නමුත් **real deployment** එකේ configuration, hosting සහ Google credentials හරි වීමත් වෙනම තහවුරු කළ යුතුයි.

## 9. Fix නොකළ හෝ සම්පූර්ණ නොවූ දේ

- **NF-1:** Customer පුද්ගලික දත්ත database එකේ encryption-at-rest තව නැහැ; search සහ migration වෙනස් කිරීමට වැඩි වැඩක් අවශ්‍යයි.
- **NF-2:** Script එකට නොපෙනෙන `httpOnly` cookie session එකක් වෙනුවට bearer token තව භාවිතා කරනවා; current deployment domains/architecture වෙනස් විය යුතුයි.
- **NF-3:** App එකේම administrator MFA/TOTP නැහැ; Google login භාවිතා කරන adminට ඔහුගේ/ඇයගේ Google 2FA උදව් විය හැකි නමුත් එය app-wide MFA නොවේ.
- **NF-4:** Frontend dependency surface එක අඩු කිරීමට UI kits/build setup වැඩිදුර ප්‍රතිසංවිධානය කළ යුතුයි.
- **NF-5:** පරණ Git history තුළ leak වූ hostnames සහ hosting document-root ගැටලුව සම්පූර්ණයෙන් විසඳීමට hosting/DNS access හා careful migration අවශ්‍යයි.
- **NF-6:** පරණ lint warnings/errors ඉතිරි. මෙය report එකේ maintenance item එකක්; තවත් security vulnerability එකක් ලෙස ගණන් නොකරන්න.

Viva එකේ මේවා සැඟවිය යුතු නැහැ. “මොන risk එක ඉතිරිද, fix එකට මොන access/වැඩ අවශ්‍යද, දැනට තිබෙන mitigation එක මොකක්ද?” යන තුන කියන්න.

## 10. Video/viva එකේ කතා කරන්න පහසු පිළිවෙළ

YouTube video එක **මිනිත්තු 20ට අඩු** විය යුතුයි. [video/script.md](video/script.md) හි ~18-minute run sheet එකක් ඇත; එහි සමහර test counts පරණ විය හැකි නිසා recordingට පෙර current results අනුව වචන update කරන්න.

1. **මුල් විනාඩිය:** App එක මොකක්ද, backend/frontend මොනවාද, මේක තෝරාගත්තේ ඇයි.
2. **ඊළඟ කොටස:** Original vulnerability 2–3ක් සැබෑ request/result එකෙන් පෙන්වන්න.
3. **Member කොටස්:** හතර දෙනා තමන්ගේ API/web work එක සහ ඒකට අදාළ test එක කෙටියෙන් කියන්න.
4. **After proof:** attack suite එකේ `0/14`, backend/frontend tests සහ Git merge history පෙන්වන්න.
5. **OIDC:** Google login flow එක live පෙන්වන්න; code/PKCE/ID token checks කෙටියෙන් විස්තර කරන්න.
6. **අවසානය:** ඉතිරි risks සහ next steps සත්‍යව කියන්න.

Simple viva පිළිතුරක්: “අපි කලින් තිබුණු POS එකේ authorization, pricing, XSS වගේ දෝෂ සොයා original app එකේ reproduce කළා. API සහ frontend දෙකේ fixes දාලා regression tests ලිව්වා. Google OIDC login එකත් එක් කළා. දැන් අපේ targeted attack checks 14ක් exploit වෙන්නේ නැහැ; hosting සහ architecture සම්බන්ධ ඉතිරි අවදානම් report එකේ සටහන් කළා.”

## 11. භාර දීමට පෙර අනිවාර්ය checklist

- [ ] හතර දෙනාගේ **සම්පූර්ණ නම් සහ index numbers** README/report එකේ පුරවන්න.
- [ ] Original project commits semester start dateට කලින් බව course timetable අනුව තහවුරු කරන්න.
- [ ] Secure backend/frontend GitHub repos markerට විවෘතව බලන්න පුළුවන්ද, original tag සහ `main` diff පෙනෙනවාද බලන්න.
- [ ] අලුත් GitHub repo එකක් භාවිතා කරන්නේ නම් එහි **සැබෑ code commits, authors සහ merges** පරීක්ෂා කරන්න; `D:\ass clone` export එක පමණක් submission history ලෙස නොසලකන්න.
- [ ] Google OAuth configuration සමඟ real login end-to-end test කරන්න.
- [ ] එක් එක් member තමන්ගේ code සහ finding එක පැහැදිලි කරන video එක record කර YouTube URL එක README එකට දාන්න; video එක විනාඩි 20ට අඩු තබන්න.
- [ ] PDF report, README, video URL, evidence සහ GitHub links ඇති final ZIP එක විවෘත කර අවසන් වරට බලන්න.

**ලකුණු ගැන සත්‍ය තක්සේරුව:** මෙහි scope සහ evidence ශක්තිමත්. නමුත් 25/25 සහතික කළ නොහැක. විශේෂයෙන් real OIDC demo, membersගේ සත්‍ය contribution, නිවැරදි public Git history, video සහ submission placeholders rubric එකේ ලකුණු තීරණය කරයි.
