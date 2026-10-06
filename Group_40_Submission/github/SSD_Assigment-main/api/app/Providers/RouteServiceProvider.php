<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Route;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to your application's "home" route.
     *
     * Typically, users are redirected here after authentication.
     *
     * @var string
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, and other route configuration.
     */
    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(60)->by($request->user()?->id ?: $request->ip());
        });

        /*
         * V-05b: brute-force protection for the login endpoint.
         *
         * THE PROBLEM
         *   /api/login had no limiter of its own, so the only restriction was
         *   the global 'api' limiter above: 60 requests per minute, keyed by IP
         *   for an unauthenticated caller. Confirmed against the original
         *   application: 20 consecutive wrong passwords for the user "admin"
         *   from one IP were all processed, none throttled, no lockout and - as
         *   of V-11 - no log entry either.
         *
         *   60 guesses a minute is 86,400 a day from a single address, and
         *   nothing at all stopped a distributed attempt because the limiter was
         *   keyed only by IP.
         *
         * THE FIX
         *   Two limits applied together, which is the important part:
         *
         *   - 5 attempts per minute per USERNAME+IP. Stops someone hammering
         *     one account from one place.
         *   - 20 attempts per minute per IP regardless of username. Stops
         *     credential stuffing, where each attempt uses a DIFFERENT
         *     username and so would never trip a per-username limit.
         *
         *   The username is lower-cased so "Admin" and "admin" share a bucket,
         *   and hashed into the key rather than embedded raw, because rate
         *   limiter keys end up in the cache store.
         *
         *   Limiting is per minute rather than a hard lockout deliberately: a
         *   lockout on a shop till is itself a denial of service - an attacker
         *   who knows a cashier's username could lock them out mid-shift.
         *
         *   CWE-307 Improper Restriction of Excessive Authentication Attempts
         */
        RateLimiter::for('login', function (Request $request) {
            $username = strtolower((string) $request->input('username'));

            return [
                Limit::perMinute(5)->by('login:' . sha1($username . '|' . $request->ip())),
                Limit::perMinute(20)->by('login-ip:' . $request->ip()),
            ];
        });

        /*
         * The Google OIDC handshake endpoints are unauthenticated by necessity -
         * the user has no token yet - so they get their own limit. Slightly
         * looser than login because a legitimate sign-in makes two calls
         * (redirect then callback) and a user may reasonably retry.
         */
        RateLimiter::for('oauth', function (Request $request) {
            return Limit::perMinute(10)->by('oauth:' . $request->ip());
        });

        $this->routes(function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));

            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
