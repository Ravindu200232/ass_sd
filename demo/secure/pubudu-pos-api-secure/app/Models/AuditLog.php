<?php
// app/Models/AuditLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use RuntimeException;

/**
 * V-11: append-only security audit entry.
 *
 * An audit trail an attacker can edit is not an audit trail, so this model
 * refuses updates and deletes outright rather than relying on nobody calling
 * them. Rows are written only through App\Support\AuditLogger.
 *
 * @see \App\Support\AuditLogger
 */
class AuditLog extends Model
{
    /** Only created_at is meaningful; an audit row is never modified. */
    public const UPDATED_AT = null;

    protected $fillable = [
        'action',
        'severity',
        'actor_id',
        'actor_user_code',
        'actor_username',
        'actor_role',
        'actor_department_id',
        'subject_type',
        'subject_id',
        'description',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'method',
        'route',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
    ];

    /**
     * Block every write path except the initial insert.
     *
     * Eloquent routes updates and deletes on an existing model through
     * performUpdate()/delete(), so overriding these covers save(), update(),
     * fill()->save(), touch() and delete(). Mass updates issued straight
     * through the query builder are not covered - that is what database
     * permissions are for - but no application code does that.
     */
    protected function performUpdate(\Illuminate\Database\Eloquent\Builder $query)
    {
        throw new RuntimeException('Audit log entries are append-only and cannot be modified.');
    }

    public function delete()
    {
        throw new RuntimeException('Audit log entries are append-only and cannot be deleted.');
    }

    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_id');
    }
}
