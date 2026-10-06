<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('user_code');
            $table->string('full_name');
            $table->string('nic_no')->unique();
            $table->string('phone_no_01');
            $table->string('phone_no_02');
            $table->string('username')->unique();
            $table->string('password');
            
            // Role included directly
            $table->enum('role', ['admin', 'employee'])->default('employee');
            
            $table->boolean('is_active')->default(true);
            $table->foreignId('department_id')->nullable()->constrained('departments')->onDelete('set null');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};