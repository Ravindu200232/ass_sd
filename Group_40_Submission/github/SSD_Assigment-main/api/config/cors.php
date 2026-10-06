<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | V-08 fix. This file previously read:
    |
    |     'allowed_origins' => ['*'],
    |     'allowed_methods' => ['*'],
    |     'allowed_headers' => ['*'],
    |
    | A wildcard origin lets any website on the internet script this API from a
    | visitor's browser. That was already enough to reach the unauthenticated
    | /register endpoint (V-01), and once the bearer token is readable from
    | JavaScript (V-16) it lets a malicious page replay it against every
    | endpoint here.
    |
    | Origins are now an explicit allow-list supplied by the environment, so the
    | production hostname is deployment configuration rather than source code.
    | Set FRONTEND_URLS to a comma-separated list, e.g.
    |
    |     FRONTEND_URLS=https://pos.pubudutyres.lk,https://staging.pubudutyres.lk
    |
    | Note the deliberate lack of a fallback wildcard: if FRONTEND_URLS is unset
    | the list is empty and cross-origin requests are refused. Failing closed is
    | the point - a missing environment variable must not silently restore the
    | vulnerability.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    // Only the verbs the API actually routes. OPTIONS is handled by the CORS
    // middleware itself and does not need to be listed.
    'allowed_methods' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],

    'allowed_origins' => array_values(array_filter(
        array_map('trim', explode(',', (string) env('FRONTEND_URLS', '')))
    )),

    'allowed_origins_patterns' => [],

    // Only the headers the SPA actually sends. Authorization is required for
    // the bearer token; X-Requested-With lets Laravel detect XHR.
    'allowed_headers' => [
        'Accept',
        'Authorization',
        'Content-Type',
        'X-Requested-With',
    ],

    'exposed_headers' => [],

    // Cache the preflight result for 30 minutes to avoid an OPTIONS round trip
    // before every request. Was 0, which disabled preflight caching entirely.
    'max_age' => 1800,

    // The API authenticates with a bearer token in the Authorization header,
    // not with cookies, so credentialed cross-origin requests are never needed.
    // Leaving this false also means a future change to allowed_origins can
    // never accidentally create the wildcard-plus-credentials combination that
    // browsers specifically forbid.
    'supports_credentials' => false,

];
