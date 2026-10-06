<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * V-10: make an approved discount single-use.
 *
 * The invoice endpoint previously accepted whatever per-item `discount` the
 * client sent, so the approval workflow was decorative. Tying a discount to an
 * approval record only helps if that record cannot be replayed: without a
 * consumption marker, one approval for "Rs 2,000 off a Michelin tyre" could be
 * applied to every subsequent sale of that product, forever.
 *
 * `consumed_at` records when the approval was spent and `consumed_inv_no`
 * records which invoice spent it, which also gives auditors a direct link from
 * a discounted line back to the administrator who authorised it.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discount_requests', function (Blueprint $table) {
            $table->timestamp('consumed_at')->nullable()->after('cancelled_at');
            $table->string('consumed_inv_no', 100)->nullable()->after('consumed_at');

            // The lookup performed on every discounted invoice line.
            $table->index(['product_code', 'status', 'consumed_at'], 'dr_product_status_consumed_idx');
        });
    }

    public function down(): void
    {
        Schema::table('discount_requests', function (Blueprint $table) {
            $table->dropIndex('dr_product_status_consumed_idx');
            $table->dropColumn(['consumed_at', 'consumed_inv_no']);
        });
    }
};
