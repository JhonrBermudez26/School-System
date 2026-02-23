<?php
// database/migrations/xxxx_add_confirmado_to_boletines_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('boletines', function (Blueprint $table) {
            $table->boolean('confirmado')->default(false)->after('estado');
            $table->timestamp('fecha_confirmacion')->nullable()->after('confirmado');
            $table->unsignedBigInteger('confirmado_por')->nullable()->after('fecha_confirmacion');
            $table->foreign('confirmado_por')->references('id')->on('users')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('boletines', function (Blueprint $table) {
            $table->dropForeign(['confirmado_por']);
            $table->dropColumn(['confirmado', 'fecha_confirmacion', 'confirmado_por']);
        });
    }
};