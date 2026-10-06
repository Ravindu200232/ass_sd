<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * V-11: a tamper-evident record of security- and money-relevant actions.
 *
 * The original application logged nothing of the kind. AuthController:73 wrote
 * a line only when login threw an exception - a WRONG PASSWORD produced no log
 * entry at all - and there was no record anywhere of privilege changes, credit
 * adjustments, invoice cancellations or price changes. After an incident there
 * was simply nothing to reconstruct.
 *
 * Design notes
 *  - Rows are append-only by convention: the model blocks updates and deletes,
 *    and nothing in the application exposes a write path other than
 *    AuditLogger.
 *  - actor_user_code is denormalised alongside actor_id so the trail survives
 *    the user record being deleted.
 *  - old_values/new_values are JSON so a diff can be shown without the table
 *    needing to know any particular subject's columns.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();

            // What happened. Dotted namespace, e.g. 'auth.login.failed',
            // 'customer.credit.adjusted', 'invoice.cancelled'.
            $table->string('action', 64)->index();

            // How serious it is, so alerting can filter without parsing action.
            $table->enum('severity', ['info', 'notice', 'warning', 'critical'])
                ->default('info')
                ->index();

            // Who did it. Nullable because failed logins have no authenticated
            // actor, and ON DELETE SET NULL keeps history after staff removal.
            $table->foreignId('actor_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor_user_code', 64)->nullable();
            $table->string('actor_username', 64)->nullable()->index();
            $table->string('actor_role', 32)->nullable();
            $table->unsignedBigInteger('actor_department_id')->nullable();

            // What it was done to, as a loose polymorphic reference. Not a real
            // morphTo relation, because the subject may since have been deleted
            // and the trail must outlive it.
            $table->string('subject_type', 64)->nullable();
            $table->string('subject_id', 64)->nullable();

            $table->text('description')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();

            // Request provenance.
            $table->string('ip_address', 45)->nullable();   // 45 = max INET6_ADDRSTRLEN
            $table->text('user_agent')->nullable();
            $table->string('method', 10)->nullable();
            $table->string('route', 255)->nullable();

            $table->timestamp('created_at')->useCurrent()->index();

            $table->index(['subject_type', 'subject_id'], 'audit_subject_idx');
            $table->index(['action', 'created_at'], 'audit_action_time_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
