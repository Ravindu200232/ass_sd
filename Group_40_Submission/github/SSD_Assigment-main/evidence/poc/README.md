# Proof-of-concept attack suite

Each script here performs a real attack against a running instance. Against the
original applications linked from the repository README the attack succeeds and the
suite prints `VULNERABLE`; after the remediation commits the same attack is
refused and it prints `FIXED`.

The exit code is the number of vulnerabilities still exploitable, so the suite
doubles as a CI gate.

## Running it

```bash
# 1. From this repository's api/ directory, using an isolated test database
cd api
php artisan migrate:fresh --force
php artisan db:seed --class=SecurityDemoSeeder
php artisan cache:clear          # resets the login rate limiter
php artisan serve --host=127.0.0.1 --port=8000

# 2. From the repository root, in a separate terminal
node evidence/poc/run-all.mjs
```

Point it elsewhere with `POC_BASE=https://host/api node evidence/poc/run-all.mjs`.

## Seeded accounts

| Username | Password | Role | Branch |
|---|---|---|---|
| `admin` | `Admin@Pass123` | admin | Colombo |
| `cashier.colombo` | `Cashier@Pass123` | employee | Colombo |
| `cashier.kandy` | `Cashier@Pass123` | employee | Kandy |
| `terminated.staff` | `Cashier@Pass123` | employee | Colombo |

Local demo credentials only. `SecurityDemoSeeder` refuses to run unless
`APP_ENV` is `local` or `testing`.

## Re-running

V-05b deliberately exhausts the login rate limiter, so a second run inside the
same minute finds it still spent. Run `php artisan cache:clear` between runs or
wait 60 seconds. The suite detects this and reports `SKIPPED` rather than a
misleading result.

Two ordering constraints are deliberate and commented in the source:

- **V-05b runs last.** Once it is fixed it exhausts the limiter, which would
  otherwise block the logins later tests need.
- **V-09 uses a deliberately failed login.** The headers under test are set by
  global middleware and appear on every response; a successful sign-in would
  revoke the admin token acquired at the start of the run, because V-06's fix
  allows one active session per user.

## Files

| File | Purpose |
|---|---|
| `run-all.mjs` | the suite |
| `lib.mjs` | HTTP helpers and result formatting |
