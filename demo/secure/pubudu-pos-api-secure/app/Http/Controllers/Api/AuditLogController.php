<?php
// app/Http/Controllers/Api/AuditLogController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

/**
 * V-11: read-only access to the security audit trail.
 *
 * An audit trail nobody can read is only half a control - it satisfies
 * "record the event" but not "detect the incident". This gives the owner a
 * queryable view without introducing any write path: there is no store(),
 * update() or destroy() here, and AuditLog itself throws on update and delete.
 *
 * Administrator-only, by route middleware.
 */
class AuditLogController extends Controller
{
    public function index(Request $request)
    {
        $validated = $request->validate([
            'action'     => 'sometimes|string|max:64',
            'severity'   => 'sometimes|in:info,notice,warning,critical',
            'username'   => 'sometimes|string|max:64',
            'subject_id' => 'sometimes|string|max:64',
            'from'       => 'sometimes|date',
            'to'         => 'sometimes|date|after_or_equal:from',
            'per_page'   => 'sometimes|integer|min:1|max:200',
        ]);

        $query = AuditLog::query()->with('actor:id,user_code,full_name');

        if (isset($validated['action'])) {
            // Prefix match so 'auth.' returns every authentication event.
            $query->where('action', 'like', $validated['action'] . '%');
        }
        if (isset($validated['severity'])) {
            $query->where('severity', $validated['severity']);
        }
        if (isset($validated['username'])) {
            $query->where('actor_username', $validated['username']);
        }
        if (isset($validated['subject_id'])) {
            $query->where('subject_id', $validated['subject_id']);
        }
        if (isset($validated['from'])) {
            $query->where('created_at', '>=', $validated['from']);
        }
        if (isset($validated['to'])) {
            $query->where('created_at', '<=', $validated['to'] . ' 23:59:59');
        }

        $logs = $query->orderByDesc('id')
            ->paginate($validated['per_page'] ?? 50);

        return response()->json([
            'success' => true,
            'message' => 'Audit log retrieved.',
            'data'    => $logs,
        ]);
    }

    /**
     * Counts per action and severity, for a dashboard tile or a quick triage.
     */
    public function summary(Request $request)
    {
        $since = now()->subDays((int) $request->integer('days', 7));

        return response()->json([
            'success' => true,
            'data' => [
                'since'       => $since->toDateTimeString(),
                'by_severity' => AuditLog::where('created_at', '>=', $since)
                    ->selectRaw('severity, COUNT(*) as total')
                    ->groupBy('severity')
                    ->pluck('total', 'severity'),
                'by_action' => AuditLog::where('created_at', '>=', $since)
                    ->selectRaw('action, COUNT(*) as total')
                    ->groupBy('action')
                    ->orderByDesc('total')
                    ->limit(20)
                    ->pluck('total', 'action'),
                'failed_logins' => AuditLog::where('created_at', '>=', $since)
                    ->where('action', 'auth.login.failed')
                    ->count(),
            ],
        ]);
    }
}
