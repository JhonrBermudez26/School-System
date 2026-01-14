<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic_periods', function (Blueprint $table) {
            $table->text('guidelines')->nullable()->after('is_active');
            $table->unsignedTinyInteger('grade_weight')->nullable()->after('guidelines'); // 0-100
        });
    }

    public function down(): void
    {
        Schema::table('academic_periods', function (Blueprint $table) {
            $table->dropColumn(['guidelines', 'grade_weight']);
        });
    }
};
