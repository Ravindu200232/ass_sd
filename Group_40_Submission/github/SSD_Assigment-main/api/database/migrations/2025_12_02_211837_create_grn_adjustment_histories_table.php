<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateGrnAdjustmentHistoriesTable extends Migration
{
    public function up()
    {
        Schema::create('grn_adjustment_histories', function (Blueprint $table) {
            $table->id();

            // IDs & Codes (SHORT for indexing)
            $table->unsignedBigInteger('grn_item_id');
            $table->string('grn_code', 100);
            $table->string('product_code', 100);

            // Quantities
            $table->integer('original_qty');
            $table->integer('new_qty');
            $table->integer('adjustment_qty');

            // Adjustment info
            $table->enum('adjustment_type', ['add', 'subtract', 'set']);

            // Prices
            $table->decimal('original_subtotal', 15, 2);
            $table->decimal('new_subtotal', 15, 2);

            $table->text('reason')->nullable();

            // Flags
            $table->boolean('is_return')->default(false);
            $table->boolean('return_to_stock')->default(false);

            // Audit
            $table->unsignedBigInteger('adjusted_by')->nullable();
            $table->timestamp('adjusted_at');

            $table->timestamps();

            // Indexes (SAFE)
            $table->index(['grn_code', 'product_code']);
            $table->index('adjusted_at');

            // Foreign key (keep history even if user deleted)
            $table->foreign('adjusted_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('grn_adjustment_histories');
    }
}
