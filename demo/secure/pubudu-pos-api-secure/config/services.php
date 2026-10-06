<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'mailgun' => [
        'domain' => env('MAILGUN_DOMAIN'),
        'secret' => env('MAILGUN_SECRET'),
        'endpoint' => env('MAILGUN_ENDPOINT', 'api.mailgun.net'),
        'scheme' => 'https',
    ],

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],
    
    'onesignal' => [
        'app_id' => env('ONESIGNAL_APP_ID'),
        'rest_api_key' => env('ONESIGNAL_REST_API_KEY'),
],

    /*
    |--------------------------------------------------------------------------
    | Google OpenID Connect
    |--------------------------------------------------------------------------
    |
    | Credentials for the "Sign in with Google" flow (Authorization Code +
    | PKCE). Create a "Web application" OAuth 2.0 client at
    | https://console.cloud.google.com/apis/credentials and register `redirect`
    | there EXACTLY as it appears below - Google matches the redirect URI
    | string for string, which is itself a security control: it stops an
    | attacker redirecting the authorization code to a host they control.
    |
    | The client SECRET lives here, server-side, and is never sent to the
    | browser. The client ID is public by design in this flow: it identifies the
    | application, it does not authenticate it.
    |
    | hosted_domain, when set, restricts sign-in to one Google Workspace domain.
    | It is enforced on the `hd` CLAIM of the verified ID token, not on the
    | request parameter of the same name - that parameter is only a hint to
    | Google's account chooser and the user can simply remove it from the URL.
    |
    */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_REDIRECT_URI'),
        'hosted_domain' => env('GOOGLE_HOSTED_DOMAIN'),
    ],

];
