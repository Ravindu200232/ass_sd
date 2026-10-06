<?php
// app/Support/AuditLogger.php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * V-11: the single entry point for writing security audit events.
 *
 * Every event is written twice, deliberately:
 *
 *   1. To the `audit_logs` table, which the application can query and report
 *      on (who adjusted this customer's balance, and when).
 *   2. To the `security` log channel, which is a separate file from the
 *      application log. That file is what gets shipped to a SIEM and what
 *      survives if the database is the thing that was compromised.
 *
 * Writing an audit entry must never break the operation it is recording, so
 * every failure here is swallowed after being reported to the default log. A
 * business action failing because its audit row could not be written would be
 * a denial-of-service vector.
 */
class AuditLogger
{
    public const SEVERITY_INFO = 'info';
    public const SEVERITY_NOTICE = 'notice';
    public const SEVERITY_WARNING = 'warning';
    public const SEVERITY_CRITICAL = 'critical';

    /**
     * Record one security-relevant event.
     *
     * @param  string       $action      Dotted event name, e.g. 'invoice.cancelled'
     * @param  string|null  $description Human-readable summary
     * @param  array{0?:string,1?:string|int}|null $subject [type, id]
     * @param  array<string,mixed>|null $old   State before
     * @param  array<string,mixed>|null $new   State after
     */
    public static function record(
        string $action,
        ?string $description = null,
        ?array $subject = null,
        ?array $old = null,
        ?array $new = null,
        string $severity = self::SEVERITY_INFO
    ): void {
        $request = request();
        $actor = $request?->user();

        $row = [
            'action'              => $action,
            'severity'            => $severity,
            'actor_id'            => $actor?->id,
            'actor_user_code'     => $actor?->user_code,
            'actor_username'      => $actor?->username,
            'actor_role'          => $actor?->role,
            'actor_department_id' => $actor?->department_id,
            'subject_type'        => $subject[0] ?? null,
            'subject_id'          => isset($subject[1]) ? (string) $subject[1] : null,
            'description'         => $description,
            'old_values'          => self::scrub($old),
            'new_values'          => self::scrub($new),
            'ip_address'          => $request?->ip(),
            'user_agent'          => substr((string) $request?->userAgent(), 0, 1000) ?: null,
            'method'              => $request?->method(),
            'route'               => substr((string) $request?->path(), 0, 255) ?: null,
        ];

        try {
            AuditLog::create($row);
        } catch (Throwable $e) {
            // Never let auditing break the audited operation.
            Log::error('Failed to write audit_logs row', [
                'action' => $action,
                'error'  => $e->getMessage(),
            ]);
        }

        try {
            Log::channel('security')->log(
                $severity === self::SEVERITY_CRITICAL ? 'critical' : $severity,
                $action,
                $row
            );
        } catch (Throwable $e) {
            Log::error('Failed to write security log', [
                'action' => $action,
                'error'  => $e->getMessage(),
            ]);
        }
    }

    /**
     * Record a failed authentication attempt.
     *
     * Kept separate because there is no authenticated actor, and because the
     * username has to be recorded explicitly - it is the only identifier there
     * is. The submitted password is NEVER recorded.
     */
    public static function loginFailed(string $username, string $reason): void
    {
        $request = request();

        $row = [
            'action'         => 'auth.login.failed',
            'severity'       => self::SEVERITY_WARNING,
            'actor_username' => substr($username, 0, 64),
            'description'    => 'Failed login attempt: ' . $reason,
            'ip_address'     => $request?->ip(),
            'user_agent'     => substr((string) $request?->userAgent(), 0, 1000) ?: null,
            'method'         => $request?->method(),
            'route'          => substr((string) $request?->path(), 0, 255) ?: null,
        ];

        try {
            AuditLog::create($row);
        } catch (Throwable $e) {
            Log::error('Failed to write audit_logs row', ['action' => 'auth.login.failed', 'error' => $e->getMessage()]);
        }

        try {
            Log::channel('security')->warning('auth.login.failed', $row);
        } catch (Throwable $e) {
            Log::error('Failed to write security log', ['action' => 'auth.login.failed', 'error' => $e->getMessage()]);
        }
    }

    /**
     * Remove anything that must never reach a log file, at any nesting depth.
     *
     * @param  array<string,mixed>|null  $values
     * @return array<string,mixed>|null
     */
    private static function scrub(?array $values): ?array
    {
        if ($values === null) {
            return null;
        }

        $secret = [
            'password', 'password_confirmation', 'current_password', 'new_password',
            'remember_token', 'token', 'access_token', 'refresh_token', 'plainTextToken',
            'client_secret', 'code_verifier', 'authorization', 'id_token',
        ];

        $walk = function ($value) use (&$walk, $secret) {
            if (! is_array($value)) {
                return $value;
            }

            $out = [];
            foreach ($value as $k => $v) {
                $out[$k] = in_array(strtolower((string) $k), $secret, true)
                    ? '[redacted]'
                    : $walk($v);
            }

            return $out;
        };

        return $walk($values);
    }
}
