<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_items', function (Blueprint $table) {
            $table->id();
            $table->string('inv_no');
            $table->string('product_code');
            $table->string('grn_code');
            $table->string('product_name');
            $table->date('date');
            $table->double('selling_price');
            $table->double('discount')->default(0);
            $table->double('last_selling_price');
            $table->double('qty');
            
            // Description and type included directly
            $table->text('description')->nullable();
            $table->enum('type', ['product', 'service'])->default('product');
            
            $table->timestamps();

            $table->foreign('inv_no')->references('inv_no')->on('invoices')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_items');
    }
};