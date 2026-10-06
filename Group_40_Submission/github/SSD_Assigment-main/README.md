# SE4030 — Pubudu POS security hardening

This is the modified version of Pubudu POS for the four-member Secure Software Development assignment. The `main` branch contains a runnable Laravel API in [`api/`](api/) and React/Vite frontend in [`web/`](web/). The member branches and their original commits are retained in this repository's Git history; the merge commits place their changed files in the corresponding application directory.

## Team and contribution

| Member | Index number | API work | Web work |
| --- | --- | --- | --- |
| P.A.R.B. Subasingha (Ravindu, leader) | IT22098450 | Access control, branch scoping, authentication, Google OIDC | Google OIDC sign-in and callback |
| R.M.M.P. Bandara (Malith) | IT22249166 | Mass-assignment, server-side invoice pricing and audit trail | Server-authoritative invoice request |
| R.M.K.N. Gunasena (Nimthara) | IT22078582 | Hide wholesale cost and margins from employees | XSS, secrets, client-trust and upload protections |
| R.H.F. Hamna | IT22516916 | Configuration, headers, dependency fixes and regression tests | Transport, dependencies, headers and CI |

Ravindu also integrated the branches, reconciled the complete application, and verified the result. Each member's published branch commits remain attributed to that member. No existing commit authorship was rewritten.

## Source and submission links

- Original API: [Chathura876/pubudu-pos-api](https://github.com/Chathura876/pubudu-pos-api), baseline `d997cbc` (18 May 2026).
- Original frontend: [Chathura876/pubudu-pos-front-end](https://github.com/Chathura876/pubudu-pos-front-end), baseline `52b7707` (27 May 2026).
- Modified project: [Ravindu200232/SSD_Assigment](https://github.com/Ravindu200232/SSD_Assigment), `main` branch.
- Demonstration video (20 minutes maximum): add the YouTube link here after recording.

The original application's committed environment material and runtime logs were deliberately excluded from this new repository. See the original repository links for the untouched starting points.

## Security changes

The report describes the original exploit, root cause, fix and verification for each finding. Key changes include:

| Area | Remediation |
| --- | --- |
| Authorization | Registration now requires administrator authorization; privileged routes enforce roles; customer, invoice and stock reads are scoped to the user's department. |
| Authentication | Login throttling, stronger password rules, expiring/revocable tokens and inactive-user checks. |
| Business integrity | Customer keys and balances are protected from mass assignment; the API resolves invoice prices and approved discounts instead of trusting the browser; financial and security actions are audited. |
| Disclosure and browser safety | API cost/margin response filtering, output escaping, spreadsheet validation, environment-secret removal and client-trust reduction. |
| Configuration and dependencies | Restricted CORS, response headers, safe error handling, HTTPS-oriented frontend configuration and updated Laravel/npm dependencies. |
| New feature | Google OpenID Connect sign-in using Authorization Code + PKCE, with server-side ID-token verification and pre-provisioned staff accounts. |

Deferred improvements and their reasons are documented in the assignment report. The project is not a deliberately vulnerable teaching application.

## Reproduce locally

Prerequisites: PHP 8.2+, Composer, Node.js 22+, npm and MySQL 8. Use a **separate test database**; the Laravel security tests use `RefreshDatabase` and must never point at live data.

```sh
cd api
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* and FRONTEND_URLS in the ignored .env file.
php artisan migrate --force
php artisan serve
```

In another terminal:

```sh
cd web
npm ci
# Configure VITE_* values in an ignored .env.local file as needed.
npm run dev
```

For Google sign-in, configure the Google client ID, client secret and callback URL in the API's ignored `.env`, register that callback with the identity provider, and have an administrator create the staff account first. An arbitrary Google account cannot self-register.

## Verification

The root [API workflow](.github/workflows/api-security.yml) and [web workflow](.github/workflows/web-security.yml) run on `main` and on pull requests. They install dependencies, run the security and full test suites, check advisories, and scan for secrets. The API workflow uses a separate MySQL service database.

The [runtime proof-of-concept suite](evidence/poc/README.md) exercises the original attack paths against a seeded, **isolated** local API. Do not point it at a production database.

Local verification on 23 September 2026: API security suite 90 passing tests; full API suite 92 passing tests; frontend 19 passing tests; security lint and production build passed; Composer audit reported no advisories; npm audit reported zero vulnerabilities; the runtime PoC found **0 of 14 attacks still exploitable**. The runtime check used a fresh, separate local database, not production data. These results do not replace a live OAuth round-trip and deployment-specific testing.

```sh
cd api
php artisan test --testsuite=Security
php artisan test
composer audit --no-interaction

cd ../web
npm run lint:security
npm test
npm run build
npm audit --audit-level=high
```

The `api/.env` and `web/.env.local` files are local configuration only and must never be committed. Branches containing a member's changed-file snapshot are review/history branches; use `main` to run the complete application.
