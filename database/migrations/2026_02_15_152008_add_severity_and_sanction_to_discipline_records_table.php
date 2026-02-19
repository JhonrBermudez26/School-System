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
        Schema::table('discipline_records', function (Blueprint $table) {
            $table->enum('severity', ['low', 'medium', 'high', 'critical'])->default('low')->after('description');
            $table->string('sanction')->nullable()->after('severity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('discipline_records', function (Blueprint $table) {
            $table->dropColumn(['severity', 'sanction']);
        });
    }
};
