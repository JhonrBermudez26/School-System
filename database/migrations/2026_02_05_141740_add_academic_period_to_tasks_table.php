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
        Schema::table('tasks', function (Blueprint $table) {
            // Agregar columna de periodo académico
            $table->foreignId('academic_period_id')
                  ->nullable()
                  ->after('group_id')
                  ->constrained('academic_periods')
                  ->onDelete('set null')
                  ->comment('Periodo académico al que pertenece la tarea');
            
            // Índice compuesto para mejorar búsquedas
            $table->index(['subject_id', 'group_id', 'academic_period_id'], 'idx_tasks_class_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Eliminar índice primero
            $table->dropIndex('idx_tasks_class_period');
            
            // Eliminar foreign key y columna
            $table->dropForeign(['academic_period_id']);
            $table->dropColumn('academic_period_id');
        });
    }
};

