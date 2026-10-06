<?php
// app/Http/Middleware/SecurityHeaders.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Attaches the defence-in-depth response headers that the application was
 * serving none of (V-09).
 *
 * This is a JSON API: it never returns HTML that a browser will render, and it
 * is never a legitimate frame target. The policy below is therefore as close to
 * "deny everything" as the specifications allow, which is both the safest
 * setting and the easiest to justify - there is no application feature that any
 * of these directives can break.
 *
 * The one exception is Laravel's own error pages and the Ignition debug screen,
 * which are HTML. Those only exist when APP_DEBUG is on, and they are exactly
 * what should not be framed or sniffed, so the strict policy is correct there
 * too.
 *
 * @see App\Http\Kernel::$middleware - registered globally so that no route,
 *      including error responses produced before routing, can escape it.
 */
class SecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Never let a browser second-guess a declared Content-Type. Without
        // this, a JSON response containing attacker-controlled text can be
        // sniffed as HTML and executed.
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // The API has no UI, so it should never appear in a frame. Blocks
        // clickjacking and drag-and-drop attacks against any HTML this app
        // does emit (error pages).
        $response->headers->set('X-Frame-Options', 'DENY');

        // Do not leak API paths - which contain record identifiers - to any
        // third-party site the browser navigates to next.
        $response->headers->set('Referrer-Policy', 'no-referrer');

        // Deny access to every powerful browser feature. An API has no use for
        // any of them, and denying them here also covers the error pages.
        $response->headers->set(
            'Permissions-Policy',
            'accelerometer=(), autoplay=(), camera=(), display-capture=(), encrypted-media=(), '
            .'fullscreen=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), '
            .'midi=(), payment=(), picture-in-picture=(), usb=(), xr-spatial-tracking=()'
        );

        // frame-ancestors is the modern, spec-compliant counterpart to
        // X-Frame-Options; both are sent because older browsers honour only the
        // latter. 'default-src none' means an accidentally-HTML response can
        // load no scripts, styles, images or fonts of any kind.
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'; sandbox"
        );

        // Responses carry customer records and pricing. Keep them out of shared
        // caches and out of the browser's back/forward cache after logout.
        if (! $response->headers->has('Cache-Control')) {
            $response->headers->set('Cache-Control', 'no-store, private');
        }

        // HSTS is only meaningful over TLS, and sending it over plain HTTP is
        // explicitly forbidden by RFC 6797 s7.2. Emitting it on a local http://
        // dev server would also pin the developer's browser to HTTPS for
        // localhost, which breaks the development environment.
        if ($request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains; preload'
            );
        }

        // Advertising the exact framework and PHP build only helps an attacker
        // match the host to a CVE.
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');

        return $response;
    }
}
