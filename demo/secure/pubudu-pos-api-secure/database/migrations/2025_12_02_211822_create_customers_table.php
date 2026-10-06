<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code')->unique();
            $table->string('customer_name');
            $table->string('address')->nullable();
            $table->string('phone_no_01');
            $table->string('phone_no_02')->nullable();
            $table->string('nic_no');
            
            // Add department_id with foreign key constraint
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            
            // Credit fields included directly
            $table->decimal('credit_balance', 15, 2)->default(0);
            $table->decimal('credit_limit', 15, 2)->default(0);
            $table->boolean('credit_enabled')->default(false);
            
            $table->timestamps();
            
            // Add index for better performance
            $table->index('customer_code');
            $table->index('department_id'); // Add index for department
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};