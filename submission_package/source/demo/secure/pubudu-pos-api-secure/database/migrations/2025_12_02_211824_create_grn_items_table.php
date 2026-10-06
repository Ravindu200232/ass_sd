<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grn_items', function (Blueprint $table) {
            $table->id();
            $table->string('grn_code');
            $table->string('product_code');
            $table->string('product_name');
            $table->date('date');
            $table->double('stock_price');
            $table->double('selling_price');
            
            // Discount fields included directly
            $table->double('main_branch_price')->default(0);
            $table->double('discount1')->default(0);
            $table->double('discount2')->default(0);
            $table->double('discount3')->default(0);
            $table->double('discount4')->default(0);
            $table->double('actual_cost')->default(0);
            
            $table->double('discount_price')->default(0);
            $table->double('qty');
            $table->double('hisqty');
            $table->double('subtotal');
            $table->string('status')->default('on');
            $table->timestamps();

            // Foreign key constraint - IMPORTANT: referenced column must be unique
            $table->foreign('grn_code')->references('grn_code')->on('grns')->onDelete('cascade');
            
            // Add indexes for better performance
            $table->index('grn_code');
            $table->index('product_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grn_items');
    }
};