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
        Schema::table('academic_periods', function (Blueprint $table) {
            $table->enum('status', ['draft', 'active', 'closed', 'archived'])
                ->default('draft')
                ->after('is_active');
            $table->timestamp('closed_at')->nullable()->after('status');
            $table->timestamp('reopened_at')->nullable()->after('closed_at');
            $table->foreignId('closed_by')->nullable()->constrained('users')->onDelete('set null')->after('reopened_at');
            $table->foreignId('reopened_by')->nullable()->constrained('users')->onDelete('set null')->after('closed_by');

            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic_periods', function (Blueprint $table) {
            $table->dropForeign(['closed_by']);
            $table->dropForeign(['reopened_by']);
            $table->dropColumn(['status', 'closed_at', 'reopened_at', 'closed_by', 'reopened_by']);
        });
    }
};
