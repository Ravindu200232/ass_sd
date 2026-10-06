# 03 — Malithගේ workstream: money, invoice integrity සහ audit

මෙය Malithට අදාළ ලෙස නම් කර තිබෙන workstream එකේ **theory → original flaw → code flow → test → viva** පැහැදිලි කිරීමකි. තමන්ගේ සත්‍ය contribution හා knowledge අනුව පමණක් “මම කළා” කියන්න.

## ප්‍රධාන අදහස

POS එකේ මුදල් ගණනය කිරීම **browser එකට භාර දිය නොහැක**. Cashier UI එකෙන් යවන JSON එක DevTools, Postman හෝ වෙනත් HTTP client එකකින් වෙනස් කළ හැක. API එකෙන් නීත්‍යනුකූල fields පමණක් පිළිගැනීම, stock/catalogue මිල server එකෙන් සොයාගැනීම, discount approval එක තහවුරු කිරීම සහ පසුව audit trail එක තැබීම මේ workstream එකේ සාරයයි.

## V-04 — mass assignment හා customer debt

### කලින් මොකද වුණේ?

`CustomerController::update()` request එක validate කළත් පසුව **`$request->all()`** model update එකට යැව්වා. Laravel `validate()` method එක “මෙම data හරිද?” බලන එක; payload එකෙන් අනෙක් keys සියල්ල ඉවත් කරන filter එකක් නොවේ. `$fillable` list එකේ වැරදි field තිබුණොත් request එකේ ඒ field ද model එකට යනවා. Attackerට `credit_balance: 0` යවා customer debt මකා දැමිය හැකි වුණා; `customer_code` වැනි business key එකක් වෙනස් කිරීමටත් උත්සාහ කළ හැකි වුණා. Debt වෙනස් වුණත් ledger row එකක් නොතිබීම මූල්‍ය වාර්තාවටත් හානියක්.

### Fix එකේ flow

```text
PUT /api/customers/{id}
  → validation rules
  → credit_balance සහ customer_code update කිරීමට prohibited
  → $validated fields පමණක් Customer::update වෙත
  → debt වෙනස් කිරීමට විශේෂ credit endpoint + ledger entry
```

`app/Http/Controllers/Api/CustomerController.php` හි `update()` තුළ `credit_balance`/`customer_code` **`prohibited`**, `$customer->update($validated)` යොදා ඇත. `app/Models/Customer.php` හි `customer_code` mass-assignable `$fillable` තුළ නැත. ඒ කියන්නේ controller කෙනෙකු නැවත `$request->all()` භාවිතා කළත් business key එකට දෙවැනි ආරක්ෂක තට්ටුවක් ඇත. Customer සෑදීමේදී code එක generate කර direct assign කරයි; පසුව වෙනස් නොකළ යුතුයි. Ledger endpoint එක `CreditTransaction` row තබයි.

**Code segment එක තේරුම් ගන්න:**

```php
$validated = $request->validate([
    'credit_balance' => 'prohibited',
    'customer_code'  => 'prohibited',
    // වෙනස් කිරීමට අවසර ඇති customer fields ...
]);
$customer->update($validated);
```

මෙය අධ්‍යයනය සඳහා සරල කළ fragment එකකි; නිවැරදි සම්පූර්ණ rules `CustomerController.php` හි බලන්න. `prohibited` යනු silent ignore කිරීමකට වඩා හොඳයි: client එකට `422` සහ හේතුව ලැබෙයි. `BusinessIntegrityTest.php` හි debt/key update block වීමත් ledger entry ලියවීමත් පරීක්ෂා වේ.

## V-10 — cashier browser එකෙන් invoice මිල හදන ගැටලුව

### වැරදි assumption එක

Original backend එක **totals server එකේ ගණනය කළා**. එහෙත් per-item `selling_price` සහ `discount` request එකෙන් ගත්තා. ඒ නිසා catalogue මිල රු 32,000 වූ ටයරයක `selling_price: 1` යවා serverට “නිවැරදිව” රු 1 total එකක් ගණනය කර save කිරීමට හැකි වුණා. Discount approval screen එක තිබුණත් එය bypass කළ හැකි වුණා. මෙය **business logic / trust boundary** defect එකකි.

### Fixed request-to-database flow

```text
Cashier invoice request
   → fields සහ quantity validate කිරීම
   → DB transaction එකක් ඇතුළේ invoice number/stock records lock කිරීම
   → FIFO stock batches අනුව server-side unit price සොයාගැනීම
   → client දුන් price එක expected quote ලෙස compare කිරීම
   → mismatch නම් 422; invoice/stock change නොවේ
   → discount තිබේ නම් එකම cashierට අදාළ approved + unused request බලනවා
   → approval amount ඉක්මවන්නේ නම් 422
   → approval single-use ලෙස consumed_at/consumed_inv_no set කරනවා
   → server-derived total, customer credit, stock movement සහ invoice save
```

`app/Http/Controllers/Api/InvoiceController.php` හි `store()`, `resolve...Price` helper, `resolveApprovedDiscount()` හා stock allocation code බලන්න. Stock batches කිහිපයකින් item quantity ලබා ගත් විට ඒ batch වල මිල quantity-weighted ලෙස ගණනය කරයි. Service line එකක මිල `services.price` වෙතින්. `lockForUpdate()` concurrent sales/approvals අතර එකම stock හෝ discount දෙවරක් භාවිතා වීමේ අවදානම අඩු කරයි. Database transaction එකක් නිසා එක පියවරක් fail වුණොත් sale එකේ අඩක් පමණක් save නොවේ.

**වැදගත් logic fragment (සංකල්පය):**

```php
$submitted = (float) $item['selling_price'];
$authoritative = $this->resolvePriceFromStockOrService(...);
if (round($submitted, 2) !== round($authoritative, 2)) {
    throw ValidationException::withMessages([
        "items.$index.selling_price" => 'Price differs from the catalogue.',
    ]);
}
```

මේක exact copy/paste implementation එක නොව flow එක මතක තබා ගැනීමට ඇති pseudocode එකකි. Source එකේ FIFO allocation හා floating point tolerance තව විස්තරාත්මකයි. **Client price එක authoritative නොවේ**; mismatch එක silent correct නොකර reject කරන්නේ cashier screen එකේ customerට පෙන්වූ මිල සහ books වල මිල වෙනස් නොවීමටයි.

### Frontend එකේ කුමක් වෙනස් කළාද?

`src/lib/invoicePayload.js` හි `buildInvoicePayload()` operator තේරූ දේ පමණක් request එකට ගනී. `total_amount`, `net_total`, `balance`, `credit_paid`, `inv_by` වැනි server-calculated fields යවන්නේ නැහැ. `selling_price` තව යවයි, නමුත් **expected quote** ලෙස පමණයි; backend එක compare කරයි. `src/pages/Invoice/CreateInvoice.jsx` හි invoice creation paths මෙය භාවිතා කරයි. `src/lib/invoicePayload.test.js` හි tests 4ක් normal input, server-owned fields නොයැවීම සහ customer/price cases බලනවා.

**Theory:** Frontend validation UX සඳහා හොඳයි. Security enforcement API එකේ යුතුයි, මන්ද userට browser request එක ඕනෑම ලෙස වෙනස් කළ හැක.

### V-10 tests වල කියවන ප්‍රතිඵල

`tests/Feature/Security/BusinessIntegrityTest.php`:

- Tampered unit price → `422`; stock නොකෙරේ.
- Catalogue price → successful invoice.
- Approval නැති discount → `422`.
- Approved discount → sale accepted, approval consumed.
- එක approval එක නැවත භාවිතය / වෙන cashierගේ approval / cap ඉක්මවීම → reject.
- Invoice creator (`inv_by`) token එකෙන්; request එකෙන් නොවේ.

## V-11 — audit trail නැති වීම

### ඇයි log එකක් අවශ්‍ය?

Cashier වැරදි මිලකට invoice එකක් කර හෝ admin invoice cancel කළොත් “කවුද, කවදාද, කොතැනින්ද, කලින් අගය කීයද?” කියා පසුව දැනගත යුතුයි. Original code එකේ failed logins සහ මුදල් සම්බන්ධ actions ප්‍රමාණවත් ලෙස record නොවුණා. Invoice cancel කළ විට පැරණි amounts zero වන නිසා pre-cancel value නැති වෙන්නත් පුළුවන්.

### Implement කළ පාලනය

`database/migrations/...create_audit_logs_table.php` මඟින් action, severity, actor, subject, old/new values, IP, timestamp වැනි fields ඇති table එකක්. `app/Support/AuditLogger.php` එකම entry point: event එක database `audit_logs` table එකටත් වෙනම `security` log channel එකටත් ලියයි. Sensitive fields recursively redact කරනවා. Logging failure එකක් වුණොත් business action එක නවත්වන්නේ නැහැ; error වෙනම log කරයි. එය **availability vs audit durability** tradeoff එකකි; viva එකේ කියන්න.

`app/Models/AuditLog.php` update/delete block කරන append-only model logic එකක්. `app/Http/Controllers/Api/AuditLogController.php` හි read API එක admin-only. `InvoiceController.php` cancel ක්‍රියාවට පෙර amount snapshot ගෙන critical event එකක් ලියයි. `CustomerController.php` credit adjustment එකට old/new balance සහ reason ලියයි.

**Theory:** Audit log එක “bug එක නවත්වන” control එකක් නොවේ; incident එක **detect/investigate** කිරීමට evidence. Database සහ file copy දෙකක් තැබීම recovery ට උපකාරී. එහෙත් absolute tamper-proof කියා නොකියන්න; database/server adminට logs වෙත access තිබිය හැක.

## Malithට පෙන්විය හැකි files

| File | Screen එකේ පෙන්වන තැන |
|---|---|
| API `app/Http/Controllers/Api/CustomerController.php` | `update()` validated fields සහ prohibited debt/key |
| API `app/Models/Customer.php` | `$fillable` තුළ business key නැති බව |
| API `app/Http/Controllers/Api/InvoiceController.php` | `store()` සහ price/approval helper flow |
| API `app/Support/AuditLogger.php` | `record()`, actor/IP/old-new values, dual write |
| API `app/Models/AuditLog.php` | update/delete block කිරීම |
| API `tests/Feature/Security/BusinessIntegrityTest.php` | tampered price, approval replay, mass assignment, audit tests |
| Web `src/lib/invoicePayload.js` | server-owned fields නොයවන builder |
| Web `src/lib/invoicePayload.test.js` | frontend boundary tests |

API root: `D:\ass_sd\work\pubudu-pos-api-secure`; web root: `D:\ass_sd\work\pubudu-pos-front-end-secure`.

## Tutorial: local test එක පෙන්වන හැටි

Production data නොව **dedicated local test database** එකකින් පමණක් run කරන්න. Backend terminal:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-api-secure'
php artisan test --filter=BusinessIntegrityTest
```

Web terminal:

```powershell
Set-Location 'D:\ass_sd\work\pubudu-pos-front-end-secure'
npm test
```

මුළු backend security suite evidence එක **90 pass / 230 assertions**; frontend **19 pass**. ඒවා **team totals** — Malithට පමණක් 90/19 කියා නොකියන්න. Video එකේ feature test 1–2ක් හෝ recorded evidence කෙටිව පෙන්වන්න; test නම සහ expected HTTP status පැහැදිලි කරන්න.

## Viva Q&A

**Q: `$request->validate()` කළා නම් `$request->all()` ඇයි අවදානම්?**  
A: Validate කරන rules වල නොමැති keys request එකෙන් ඉවත් වෙන්නේ නැහැ. `$validated` result එක පමණක් updateට යැවිය යුතුයි.

**Q: Server totals ගණනය කළත් invoice එක දුර්වල වූයේ ඇයි?**  
A: Formula එක හරි; input unit price එක attacker-controlled. Wrong input එකෙන් correct formula එකක් wrong total එකක් දෙයි.

**Q: Approved discount single-use ඇයි?**  
A: එක් approval එකක් නැවත නැවත භාවිතා කළොත් adminගේ සීමාව අර්ථ විරහිත වෙනවා. `consumed_at` හා invoice number ඒක නවතයි/trace කරයි.

**Q: Audit trail එක prevention ද detection ද?**  
A: මූලික වශයෙන් detection/forensics. Unauthorized action වැළැක්වීම route/validation/business rules වලින් කරනවා.
