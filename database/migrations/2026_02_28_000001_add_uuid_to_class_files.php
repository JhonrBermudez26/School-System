<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Agregar columna uuid (nullable primero para poder llenar registros existentes)
        Schema::table('class_files', function (Blueprint $table) {
            $table->uuid('uuid')->nullable()->unique()->after('id');
        });

        // 2. Llenar UUID en registros existentes
        \DB::table('class_files')->orderBy('id')->whereNull('uuid')->each(function ($record) {
            \DB::table('class_files')
                ->where('id', $record->id)
                ->update(['uuid' => (string) Str::uuid()]);
        });

        // 3. Hacer la columna NOT NULL
        Schema::table('class_files', function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
        });
    }

    public function down(): void
    {
        Schema::table('class_files', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
};