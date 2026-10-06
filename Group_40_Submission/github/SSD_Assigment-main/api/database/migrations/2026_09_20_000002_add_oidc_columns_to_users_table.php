<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Columns needed to link a staff account to a Google identity.
 *
 * The users table had no email column at all - accounts were identified only by
 * a username - so there was nothing for an OpenID Connect subject to match
 * against. All three columns are nullable so that every existing
 * password-only account keeps working untouched; Google sign-in is an
 * additional way in, not a replacement.
 *
 * Why `email` is unique but nullable: a Google account maps to exactly one
 * staff member, and MySQL permits repeated NULLs in a unique index, so
 * accounts that have not been given an address do not collide with each other.
 *
 * Why `google_id` is stored separately from `email`: the OIDC `sub` claim is
 * the stable identifier for a Google account. An email address can be changed
 * or, in a Workspace domain, reassigned to a different person entirely -
 * matching on it alone would hand the old holder's POS account to whoever
 * inherits the address. So `sub` is matched first and email is only the initial
 * link.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->unique()->after('username');
            $table->timestamp('email_verified_at')->nullable()->after('email');

            // The OIDC `sub` claim. Google documents it as at most 255 ASCII
            // characters.
            $table->string('google_id')->nullable()->unique()->after('email_verified_at');
            $table->string('avatar_url', 512)->nullable()->after('google_id');
            $table->timestamp('google_linked_at')->nullable()->after('avatar_url');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['email']);
            $table->dropUnique(['google_id']);
            $table->dropColumn([
                'email',
                'email_verified_at',
                'google_id',
                'avatar_url',
                'google_linked_at',
            ]);
        });
    }
};
