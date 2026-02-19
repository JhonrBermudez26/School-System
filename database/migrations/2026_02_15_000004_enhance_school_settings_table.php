<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->decimal('minimum_passing_grade', 5, 2)->default(3.00)->after('sitio_web');
            $table->integer('minimum_attendance_percentage')->default(80)->after('minimum_passing_grade');
            $table->json('grading_scale')->nullable()->after('minimum_attendance_percentage');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('school_settings', function (Blueprint $table) {
            $table->dropColumn(['minimum_passing_grade', 'minimum_attendance_percentage', 'grading_scale']);
        });
    }
};
