<?php
// app/Http/Middleware/EnsureUserIsActive.php

namespace App\Http\Middleware;

use App\Support\AuditLogger;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * V-06: enforce `is_active` on every request, not only at login.
 *
 * THE PROBLEM
 *   AuthController::login:45 checked is_active before issuing a token, and
 *   nothing checked it ever again. Sanctum tokens had no expiry
 *   (config/sanctum.php:49, 'expiration' => null) and deactivating a user did
 *   not revoke the tokens they already held, so:
 *
 *     1. employee logs in            -> token issued
 *     2. admin sets is_active=false  -> fresh logins now refused (403)
 *     3. employee replays the OLD token -> still fully authorised, forever
 *
 *   That was confirmed against the original application: GET /me returned 200
 *   with a token issued before termination. A dismissed member of staff kept
 *   complete API access to customer records, cost prices and the ability to
 *   cancel invoices.
 *
 * THE FIX HAS TWO HALVES
 *   AuthController now deletes a user's tokens when they are deactivated, when
 *   their role changes and when their password changes. That handles the tokens
 *   the application knows about at that moment.
 *
 *   This middleware is the safety net for everything else: a token minted in a
 *   race with the deactivation, a row changed directly in the database, or any
 *   future code path that flips is_active without remembering to revoke. It
 *   costs nothing - the user row is already loaded by the auth guard.
 *
 *   OWASP A07:2021 Identification and Authentication Failures
 *   CWE-613 Insufficient Session Expiration
 *   CWE-672 Operation on a Resource after Expiration or Release
 */
class EnsureUserIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Unauthenticated requests are not this middleware's concern; the auth
        // guard has already dealt with them.
        if ($user && ! $user->is_active) {
            // Revoke on sight, so the same token cannot be presented again.
            $user->tokens()->delete();

            AuditLogger::record(
                action: 'auth.token.rejected_inactive',
                description: sprintf(
                    'A token belonging to deactivated user %s (%s) was presented and has been revoked.',
                    $user->username,
                    $user->user_code
                ),
                subject: ['user', $user->id],
                severity: AuditLogger::SEVERITY_WARNING,
            );

            return response()->json([
                'success' => false,
                'message' => 'Your account has been deactivated. Please contact your administrator.',
            ], 403);
        }

        return $next($request);
    }
}
