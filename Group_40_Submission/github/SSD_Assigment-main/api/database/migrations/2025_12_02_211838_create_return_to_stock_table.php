<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateReturnToStockTable extends Migration
{
    public function up()
    {
        Schema::create('return_to_stock', function (Blueprint $table) {
            $table->id();

            // IDs & codes (SHORT)
            $table->unsignedBigInteger('grn_item_id');
            $table->string('grn_code', 100);
            $table->string('product_code', 100);
            $table->string('product_name', 150);

            // Quantities & prices
            $table->integer('returned_qty');
            $table->decimal('stock_price', 15, 2);
            $table->decimal('actual_cost', 15, 2);
            $table->decimal('selling_price', 15, 2);

            // Workflow
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('reason')->nullable();

            // Audit
            $table->unsignedBigInteger('returned_by')->nullable();
            $table->timestamp('returned_at');

            $table->unsignedBigInteger('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_notes')->nullable();

            $table->timestamps();

            // Indexes (SAFE)
            $table->index(['grn_code', 'product_code']);
            $table->index('status');
            $table->index('returned_at');

            // Foreign keys (keep audit history)
            $table->foreign('returned_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();

            $table->foreign('approved_by')
                ->references('id')
                ->on('users')
                ->nullOnDelete();
        });
    }

    public function down()
    {
        Schema::dropIfExists('return_to_stock');
    }
}
