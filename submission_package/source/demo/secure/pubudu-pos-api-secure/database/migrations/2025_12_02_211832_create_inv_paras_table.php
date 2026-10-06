<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inv_paras', function (Blueprint $table) {
            $table->id();
            $table->string('company_name');
            $table->string('logo');
            $table->string('address');
            $table->string('email');
            $table->string('phone_no_01');
            $table->string('phone_no_02')->nullable();
            $table->integer('product_code')->default(1);
            $table->integer('brand_code')->default(1);
            $table->integer('category_code')->default(1);
            $table->integer('user_code')->default(1);
            $table->integer('customer_code')->default(1);
            $table->integer('labour_code')->default(1);
            $table->integer('grn_code')->default(1);
            $table->integer('inv_code')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inv_paras');
    }
};