<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('suspended_at')->nullable()->after('is_active');
            $table->text('suspended_reason')->nullable()->after('suspended_at');
            $table->timestamp('last_login_at')->nullable()->after('suspended_reason');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['suspended_at', 'suspended_reason', 'last_login_at']);
        });
    }
};