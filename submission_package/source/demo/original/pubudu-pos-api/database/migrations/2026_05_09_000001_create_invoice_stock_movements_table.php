<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_stock_movements', function (Blueprint $table) {
            $table->id();
            $table->string('inv_no');
            $table->foreignId('invoice_item_id')->nullable()->constrained('invoice_items')->nullOnDelete();
            $table->foreignId('grn_item_id')->nullable()->constrained('grn_items')->nullOnDelete();
            $table->string('grn_code',100);
            $table->string('product_code',100);
            $table->string('product_name')->nullable();
            $table->foreignId('department_id')->nullable()->constrained('departments')->nullOnDelete();
            $table->string('movement_type', 30);
            $table->decimal('qty', 15, 3);
            $table->decimal('unit_cost', 15, 2)->default(0);
            $table->decimal('unit_selling_price', 15, 2)->default(0);
            $table->decimal('unit_discount', 15, 2)->default(0);
            $table->date('movement_date');
            $table->string('created_by')->nullable();
            $table->timestamps();

            $table->foreign('inv_no')->references('inv_no')->on('invoices')->cascadeOnDelete();
            $table->index(['inv_no', 'movement_type']);
            $table->index(['product_code', 'movement_date']);
            $table->index(['grn_code', 'product_code']);
            $table->index(['department_id', 'movement_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_stock_movements');
    }
};
