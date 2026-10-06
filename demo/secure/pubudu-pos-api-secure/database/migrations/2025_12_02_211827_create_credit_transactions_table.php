<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('credit_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('customer_code');
            
            // String type with credit_payment included directly
            $table->string('type', 50); // Allows any value, not restricted to enum
            
            $table->decimal('amount', 10, 2);
            $table->decimal('previous_balance', 10, 2)->default(0);
            $table->decimal('new_balance', 10, 2)->default(0);
            $table->string('reference')->nullable();
            $table->string('invoice_no')->nullable();
            $table->text('notes')->nullable();
            $table->date('transaction_date');
            $table->json('allocation')->nullable();
            $table->timestamps();

            $table->foreign('customer_code')->references('customer_code')->on('customers')->onDelete('cascade');
            $table->index(['customer_code', 'transaction_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('credit_transactions');
    }
};