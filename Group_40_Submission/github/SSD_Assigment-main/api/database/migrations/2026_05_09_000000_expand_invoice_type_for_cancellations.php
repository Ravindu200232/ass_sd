<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('invoices') || !Schema::hasColumn('invoices', 'type')) {
            return;
        }

        $driver = DB::getDriverName();

        if ($driver === 'mysql') {
            DB::statement("ALTER TABLE invoices MODIFY type VARCHAR(50) NOT NULL DEFAULT 'other'");
            return;
        }

        if ($driver === 'pgsql') {
            DB::statement("ALTER TABLE invoices ALTER COLUMN type TYPE VARCHAR(50)");
            DB::statement("ALTER TABLE invoices ALTER COLUMN type SET DEFAULT 'other'");
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('invoices') || !Schema::hasColumn('invoices', 'type')) {
            return;
        }

        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE invoices MODIFY type ENUM('tire', 'other', 'tire and other') NOT NULL DEFAULT 'other'");
        }
    }
};
