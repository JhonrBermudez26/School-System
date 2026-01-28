<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_periods', function (Blueprint $table) {
            // Campo para marcar si fue habilitado manualmente
            $table->boolean('grades_enabled_manually')->default(false)->after('grades_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('academic_periods', function (Blueprint $table) {
            $table->dropColumn('grades_enabled_manually');
        });
    }
};