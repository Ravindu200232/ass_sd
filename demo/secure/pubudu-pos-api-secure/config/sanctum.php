<?php

use Laravel\Sanctum\Sanctum;

return [

    /*
    |--------------------------------------------------------------------------
    | Stateful Domains
    |--------------------------------------------------------------------------
    |
    | Requests from the following domains / hosts will receive stateful API
    | authentication cookies. Typically, these should include your local
    | and production domains which access your API via a frontend SPA.
    |
    */

    'stateful' => explode(',', env('SANCTUM_STATEFUL_DOMAINS', sprintf(
        '%s%s',
        'localhost,localhost:3000,127.0.0.1,127.0.0.1:8000,::1',
        Sanctum::currentApplicationUrlWithPort()
    ))),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Guards
    |--------------------------------------------------------------------------
    |
    | This array contains the authentication guards that will be checked when
    | Sanctum is trying to authenticate a request. If none of these guards
    | are able to authenticate the request, Sanctum will use the bearer
    | token that's present on an incoming request for authentication.
    |
    */

    'guard' => ['web'],

    /*
    |--------------------------------------------------------------------------
    | Expiration Minutes
    |--------------------------------------------------------------------------
    |
    | This value controls the number of minutes until an issued token will be
    | considered expired. This will override any values set in the token's
    | "expires_at" attribute, but first-party sessions are not affected.
    |
    */

    /*
     * V-06 fix. This was `null`, meaning issued tokens NEVER expired.
     *
     * Combined with the other defects that made a live token permanently
     * valuable to an attacker:
     *   - the token sat in localStorage where any script could read it (V-16)
     *   - the print templates had a stored XSS that read exactly that (V-13)
     *   - deactivating a user did not revoke their existing tokens
     *
     * so one poisoned customer name yielded an administrator credential good
     * forever. The personal_access_tokens table always had an expires_at
     * column; nothing ever set it.
     *
     * 480 minutes = 8 hours, which is one shop shift. A cashier signs in at the
     * start of the day and is not interrupted mid-sale; a token stolen at 09:00
     * is useless by 17:00. Configurable so a deployment can shorten it.
     */
    'expiration' => (int) env('SANCTUM_TOKEN_EXPIRATION', 480),

    /*
    |--------------------------------------------------------------------------
    | Token Prefix
    |--------------------------------------------------------------------------
    |
    | Sanctum can prefix new tokens in order to take advantage of numerous
    | security scanning initiatives maintained by open source platforms
    | that notify developers if they commit tokens into repositories.
    |
    | See: https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning
    |
    */

    // V-06: a recognisable prefix lets GitHub's and GitLab's secret scanners
    // detect a Sanctum token committed by mistake - which, given this project
    // had already committed a .env (V-14), is a realistic failure mode.
    'token_prefix' => env('SANCTUM_TOKEN_PREFIX', 'pubudupos_'),

    /*
    |--------------------------------------------------------------------------
    | Sanctum Middleware
    |--------------------------------------------------------------------------
    |
    | When authenticating your first-party SPA with Sanctum you may need to
    | customize some of the middleware Sanctum uses while processing the
    | request. You may change the middleware listed below as required.
    |
    */

    'middleware' => [
        'authenticate_session' => Laravel\Sanctum\Http\Middleware\AuthenticateSession::class,
        'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
        'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    ],

];
