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
        Schema::table('manual_grades', function (Blueprint $table) {
            // Agregar columna de periodo académico
            $table->foreignId('academic_period_id')
                  ->nullable()
                  ->after('group_id')
                  ->constrained('academic_periods')
                  ->onDelete('set null')
                  ->comment('Periodo académico al que pertenece la evaluación manual');
            
            // Índice compuesto para mejorar búsquedas
            $table->index(['subject_id', 'group_id', 'academic_period_id'], 'idx_manual_grades_class_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manual_grades', function (Blueprint $table) {
            // Eliminar índice primero
            $table->dropIndex('idx_manual_grades_class_period');
            
            // Eliminar foreign key y columna
            $table->dropForeign(['academic_period_id']);
            $table->dropColumn('academic_period_id');
        });
    }
};