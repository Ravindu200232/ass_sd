# 04 — Nimtharaගේ workstream: XSS, browser security, upload සහ cost leak

මෙම guide එක Nimtharaට අදාළ ලෙස නම් කර ඇති workstream එක **input → browser/API → vulnerability → fix → tests** යන flow එකෙන් පැහැදිලි කරයි. ඇත්තටම කළ contribution අනුව පමණක් viva එකේ තමන්ගේ නමින් කියන්න.

## Workstream එකේ එකම මූලික අදහස

Browser screen එකේ දෙයක් සඟවා තිබීම, browser storage එකේ දත්ත තබා තිබීම, හෝ file picker එකේ `.xlsx` කියා තිබීම **server-side security control එකක් නොවේ**. Attackerට browser data, request සහ upload file එක වෙනස් කළ හැක. Frontend එකේ XSS/input/session අවදානම් අඩු කළා; backend එකේ supplier cost response එක role අනුව filter කළා.

## V-13 — Stored XSS කියන්නේ මොකක්ද?

**XSS** කියන්නේ user-controlled text browser එක HTML/JavaScript ලෙස interpret කරන අවස්ථාව. React JSX සාමාන්‍යයෙන් text escape කරනවා. නමුත් original app එක receipt සහ report HTML **template string** වලින් හදා `document.write()` කරනවා. ඒ තැන Reactගේ protection එක භාවිතා නොවේ. Customer name, product name, invoice note වැනි strings raw HTML තුළ interpolate වුණා. Attacker දත්තයක් save කළාම එය database එකේ තැන්පත් වෙලා පසුව admin invoice print කළ විට ක්‍රියාත්මක වුණා — එනිසා **stored** XSS.

### Attack chain එක

```text
Cashier/customer-controlled name හෝ note එකට HTML payload දායි
  → database තුළ තැන්පත් වේ
  → admin Sales History තුළ invoice print කරයි
  → print window HTML parser payload එක tag/script ලෙස ගනී
  → original localStorage token එක script එකට කියවිය හැකි වුණා
```

V-13, V-16 සහ V-06 එකට සම්බන්ධ වුණා: XSS + readable browser token + expiry නැති token. Demo එකේ malicious payload **live external address එකකට යැවීම අවශ්‍ය නැහැ**; test එකේ HTML parser `img` element නොහදන බව පෙන්වන්න.

### Fix එක සහ code segment

`src/lib/escapeHtml.js` හි `escapeHtml()` අකුරු පහ escape කරයි: `&`, `<`, `>`, `"`, `'`. `&` මුලින් replace කරන්නේ පසුව සෑදෙන HTML entities double-escape නොවීමට. `html` tagged template helper interpolation හැම එකක්ම escape කරයි; `raw()` භාවිතා කරන්නේ application හදන **trusted markup** පමණයි. `escapeJsString()` වෙනම context සඳහා; HTML escaping එක JavaScript string context එකට හැම විටම ප්‍රමාණවත් නැහැ.

```js
return String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&#39;");
```

මෙය `src/lib/escapeHtml.js` හි logic එක. `<img ...>` text එක `&lt;img ...&gt;` බවට හැරුණාම browser එක image element එකක් නොහදයි. Receipt/report call sites: `src/pages/Invoice/CreateInvoice.jsx`, `src/pages/Invoice/SalesHistory.jsx`, `src/components/sales-report/PdfGenerator.jsx`, `src/pages/Report/ProfitReport.jsx`. `src/lib/escapeHtml.test.js` හි XSS payload, quotes/attribute breakout, `</script>` සහ සාමාන්‍ය customer names පරීක්ෂා කරයි. CSP එක තවත් protection layer එකක්; escaping වෙනුවට CSP පමණක් ප්‍රමාණවත් නැහැ.

## V-14 — `.env` file එක Gitට යාම

Frontend `.env` file එක version control එකේ තිබුණා. `.env` හි hostnames/config පමණක් තිබුණත් environment files commit කිරීම වැරදි default එකක්; අනාගත secret එකක් අහම්බෙන් පළ විය හැක. Current tree එකෙන් `.env` ඉවත් කර `.gitignore` rule හා `.env.example` දුන්නා. CI එක tracked `.env` තිබේද සහ ignore rule තිබේද බලයි. **පරණ Git history එක තව තියෙනවා**; history rewrite/host rotation `NF-5` ලෙස ඉතිරි. “අපි historical leak සම්පූර්ණයෙන් මකා දැම්මා” කියන්න එපා.

## V-16 — browser token සහ role trust

Original `src/lib/auth.js` token සහ full user record `localStorage` තුළ තැබුවා. `localStorage` tab/browser close කළත් ඉතිරි වේ; එම origin එකේ ඕනෑම JavaScript එකකට කියවිය හැක. Role එකත් client storage එකෙන් බලන නිසා admin UI එක ව්‍යාජව පෙන්විය හැකි වුණා. UI එක admin වුණත් API admin middleware block කළ යුතුයි; ඒ backend control Ravindu workstream එකෙන් එක් වුණා.

දැනට token එක module memory variable එකේ, refresh සඳහා per-tab `sessionStorage` mirror එකේ ඇත. User cache display සඳහා පමණයි. `src/contexts/AuthContext.jsx` app boot එකේ `GET /me` ගෙන serverගේ role/status භාවිතා කරයි; fail වුණොත් cached userට fall back නොවේ. `src/lib/api.js` bearer token requestට එකතු කර `401` පසු cleanup කරයි. Logout එක old token/user keys විතරක් නොව invoice/GRN drafts වැනි business data keys ද clear කරයි.

**වැදගත් limitation:** `sessionStorage` ද same-origin JavaScript එකට කියවිය හැක. එය httpOnly cookie එකක් වගේ XSS-proof නොවේ. මෙහි වාසිය persistence කෙටි වීම හා old `localStorage` exposure අඩු වීම; ප්‍රධාන XSS fix එක HTML escaping. `NF-2` සඳහා future httpOnly cookie architecture අවශ්‍යයි.

### Flow එක මතක තබාගන්න

```text
Page load → session token තිබේද?
   නැහැ → login screen
   තිබේ → GET /api/me
       200 + active user → fresh server role අනුව UI
       401 / fail → token, user cache, drafts ඉවත් කර login
```

## V-17 — spreadsheet/CSV upload validation

Original screens කිහිපයක් file එක SheetJS parser වෙත යවන විට එක සමාන validation කර නැහැ. `<input accept=".xlsx">` කියන්නේ file picker hint එකක්; file එක rename/drag-drop කළොත් bypass කළ හැක. Parser එකේ පැරණි advisories ද තිබුණා. `src/lib/validateUpload.js` එක් කර `Products.jsx`, `Services.jsx`, `Stock/GrnAdjust.jsx`, `GRNForm/CSVImportModal.jsx` වලින් යොදා ඇත.

Validation order එක: file තිබේද → emptyද → **10 MB** ඉක්මවයිද → extension `.xlsx/.xls/.csv`ද → browser MIME type plausibleද → මුල් bytes/magic signature හරිද → parse පසු **5000 rows** ඉක්මවයිද. `.xlsx` සඳහා ZIP `PK` bytes; `.xls` සඳහා OLE2 හෝ ZIP; `.csv` සඳහා binary NUL check. `MAX_UPLOAD_BYTES` හා `MAX_IMPORT_ROWS` constants source එකේ බලන්න.

```js
const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
if (extension === "xlsx" && !startsWith(head, ZIP_MAGIC)) {
  return { ok: false, error: "That file is not a valid .xlsx workbook." };
}
```

මෙය logic එකේ සරල කොටසකි. **Magic bytes valid වුණා කියා file එක මුළුමනින් safe නොවේ**; parser upgrade, row limit සහ output escaping ද අවශ්‍යයි. Uploaded product names receipt XSS path එකට යන්න පුළුවන් නිසා V-17 සහ V-13 එකට සම්බන්ධයි.

## V-20 — cashierට wholesale cost/margin leak වීම (backend part)

Frontend screen එක cost column එක සඟවා තිබුණත් `/api/grns`, `/api/grns/stock`, `/api/grns/product/{code}/batches`, `/api/grns/{id}`, `/api/grns/code/{grnCode}` responses තුළ `stock_price`, `actual_cost`, discounts, `total_cost`, `total_profit` වැනි supplier/financial values තිබුණා. Cashierට stock හා **selling price** අවශ්‍යයි; supplier cost/margin අවශ්‍ය නැහැ. DevTools Network response එකෙන් data කියවිය හැකි නිසා frontend hide කිරීම හොඳ නැහැ. මෙය **object property-level authorization** ගැටලුවකි.

`app/Models/Concerns/HidesCostFromEmployees.php` trait එක `Grn` සහ `GrnItem` model serialization එකේ cost fields **default hidden** කරයි. Admin viewer කෙනෙකුට `revealCostTo($request->user())` මඟින් විශේෂයෙන් පෙන්වයි. User නැත්නම් fail closed. Controller අතින් array එකක් හදන paths වල model `$hidden` ක්‍රියා නොකරන නිසා `costFieldsVisibleTo()` check එකෙන් keys omit කරයි.

```php
public static function costFieldsVisibleTo(?User $user): bool
{
    return $user !== null && $user->role === 'admin';
}
```

`app/Http/Controllers/Api/GrnController.php`, `app/Models/Grn.php`, `app/Models/GrnItem.php` සහ trait එක එකට බලන්න. Employeeට stock lookup `200` හා `selling_price` තව ලැබේ; cost fields නොලැබේ. Adminට cost fields ලැබේ. `tests/Feature/Security/ResponseFilteringTest.php` හි endpoint five, model default, null user, admin behaviour ඇතුළු **16 tests**. `evidence/before/v20-cost-leak.txt` original reproduction; `evidence/after/poc-dynamic-testing.txt` fix proof.

## Demo/test tutorial

Web root `D:\ass_sd\work\pubudu-pos-front-end-secure`:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-front-end-secure'
npm test
npm run lint:security
```

API root `D:\ass_sd\work\pubudu-pos-api-secure`, dedicated local test database එකක් සමඟ:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-api-secure'
php artisan test --filter=ResponseFilteringTest
```

Source screen: cashier login → stock screen → browser DevTools **Network** → stock request response; cost key නැති බව සහ selling price තිබෙන බව පෙන්වන්න. Admin session එකක cost තව තිබෙන බව පෙන්වන්න. Test evidence අනුව **team web tests 19 pass**, **backend security suite 90 pass / 230 assertions**, V-20 response filtering tests 16ක්. ඒ සියල්ල Nimtharaගේ තනි tests ගණනක් ලෙස කියන්න එපා.

## Viva Q&A

**Q: React automatically escapes නම් XSS ආවේ කොහොමද?**  
A: Receipt/report HTML React JSX නොව template string + `document.write()` නිසා React escaping භාවිතා වුණේ නැහැ.

**Q: CSP එක පමණක් තිබුණා නම්?**  
A: CSP defence-in-depth. User content HTML ලෙස නොගැනීම සඳහා output-context escaping මූලික fix එකයි.

**Q: `sessionStorage` token එක XSS වලින් safeද?**  
A: නැහැ; JavaScriptට තව කියවිය හැක. Persistence අඩුයි. XSS source එකත් fix කළා; httpOnly cookie future improvement එකක්.

**Q: Cost column UI එකෙන් සඟවලා තිබුණත් leak ඇයි?**  
A: HTTP JSON response එක DevTools හරහා පෙනේ. API එකට role අනුව property omit කරන්න ඕන.

**Q: `.xlsx` signature check එක ප්‍රමාණවත්ද?**  
A: නැහැ. එය එක් layer එකක්; size/row limits, parser updates සහ output escaping ද අවශ්‍යයි.
