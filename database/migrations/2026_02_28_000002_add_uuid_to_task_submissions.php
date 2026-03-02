<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_submissions', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        \DB::table('task_submissions')->orderBy('id')->whereNull('uuid')->each(function ($record) {
            \DB::table('task_submissions')
                ->where('id', $record->id)
                ->update(['uuid' => (string) Str::uuid()]);
        });

        Schema::table('task_submissions', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('task_submissions', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};