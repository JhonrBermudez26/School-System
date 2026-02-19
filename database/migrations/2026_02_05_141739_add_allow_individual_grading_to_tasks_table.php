<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->boolean('allow_individual_grading')
                  ->default(false)
                  ->after('max_score')
                  ->comment('Permite al profesor asignar notas individuales en entregas grupales/parejas');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('allow_individual_grading');
        });
    }
};