<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grns', function (Blueprint $table) {
            $table->id();
            $table->string('grn_code')->unique(); // Add ->unique() here
            $table->date('grn_date');
            $table->unsignedBigInteger('department_id');
            $table->double('total_cost');
            $table->double('total_selling_amount');
            $table->double('total_profit');
            $table->double('total_item');
            $table->unsignedBigInteger('grn_by');
            $table->timestamps();

            $table->foreign('department_id')->references('id')->on('departments')->onDelete('cascade');
            $table->foreign('grn_by')->references('id')->on('users')->onDelete('cascade');
            
            // Add index for better performance
            $table->index('grn_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grns');
    }
};