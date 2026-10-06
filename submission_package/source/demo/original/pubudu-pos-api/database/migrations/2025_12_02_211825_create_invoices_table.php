<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('inv_no')->unique(); // Already has ->unique()
            $table->date('inv_date');
            $table->string('customer_code')->nullable(); // Check if this is unique in customers table
            $table->unsignedBigInteger('department_id');
            
            // Type and service included directly
            $table->enum('type', ['tire', 'other', 'tire and other'])->default('other');
            $table->string('service')->nullable();
            
            $table->string('payment_status');
            $table->double('total_amount');
            $table->double('total_discount')->nullable();
            $table->double('net_total');
            $table->double('pay_amount');
            $table->double('balance');
            
            // Credit fields included directly
            $table->decimal('credit_allocated', 15, 2)->default(0);
            $table->double('credit_paid')->default(0);
            $table->double('remaining_balance')->virtualAs('balance - credit_paid');
            $table->boolean('is_credit_paid')->default(false);
            
            $table->string('inv_by');
            $table->timestamps();

            $table->foreign('customer_code')->references('customer_code')->on('customers')->onDelete('cascade');
            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            
            // Add indexes
            $table->index('inv_no');
            $table->index('customer_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};