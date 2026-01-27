<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->boolean('deleted')->default(false)->after('read_by');
            $table->boolean('edited')->default(false)->after('deleted');
            $table->json('hidden_by')->nullable()->after('edited');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['deleted', 'edited', 'hidden_by']);
        });
    }
};