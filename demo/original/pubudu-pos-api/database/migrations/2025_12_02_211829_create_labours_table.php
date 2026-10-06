<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('labours', function (Blueprint $table) {
            $table->id();
            $table->string('labour_code')->unique();
            $table->string('labour_name');
            $table->decimal('price', 10, 2);
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::create('labour_invoices', function (Blueprint $table) {
            $table->id();
            $table->string('inv_no')->unique();
            $table->date('inv_date');
            $table->string('customer_type');
            $table->string('customer_code')->nullable();
            $table->integer('department_id');
            $table->string('payment_status');
            $table->decimal('total_amount', 10, 2);
            $table->decimal('pay_amount', 10, 2);
            $table->string('inv_by');
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('labour_invoice_items', function (Blueprint $table) {
            $table->id();
            $table->string('inv_no');
            $table->string('labour_code');
            $table->string('labour_name');
            $table->decimal('price', 10, 2);
            $table->timestamps();

            $table->foreign('inv_no')->references('inv_no')->on('labour_invoices')->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('labour_invoice_items');
        Schema::dropIfExists('labour_invoices');
        Schema::dropIfExists('labours');
    }
};