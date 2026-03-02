<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('discipline_records', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        \DB::table('discipline_records')->orderBy('id')->whereNull('uuid')->each(function ($record) {
            \DB::table('discipline_records')
                ->where('id', $record->id)
                ->update(['uuid' => (string) Str::uuid()]);
        });

        Schema::table('discipline_records', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('discipline_records', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};