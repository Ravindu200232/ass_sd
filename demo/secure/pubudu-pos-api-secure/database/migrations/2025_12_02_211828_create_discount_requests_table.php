<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discount_requests', function (Blueprint $table) {
            $table->id();

            // Indexed & Foreign key columns (SHORT!)
            $table->string('inv_no', 100);
            $table->string('product_code', 100);
            $table->string('status', 20)->default('pending');

            // Other data
            $table->string('requested_by', 100);
            $table->decimal('original_price', 10, 2);
            $table->decimal('requested_discount', 10, 2);
            $table->decimal('final_price', 10, 2);

            $table->string('reason', 255)->nullable();
            $table->string('approved_by', 100)->nullable();

            $table->timestamp('approved_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->text('admin_note')->nullable();
            $table->timestamps();

            // Foreign key (make sure invoices.inv_no is VARCHAR(100))
            $table->foreign('inv_no')
                ->references('inv_no')
                ->on('invoices')
                ->onDelete('cascade');

            // Composite index
            $table->index(['inv_no', 'product_code', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discount_requests');
    }
};
