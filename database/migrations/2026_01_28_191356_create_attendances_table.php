<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // Estudiante
            $table->foreignId('subject_id')->constrained()->onDelete('cascade'); // Materia
            $table->foreignId('group_id')->constrained()->onDelete('cascade'); // Grupo
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade'); // Profesor que registra
            $table->date('date'); // Fecha de la clase
            $table->enum('status', ['present', 'absent', 'late', 'excused'])->default('absent'); // Estado
            $table->text('notes')->nullable(); // Notas adicionales
            $table->timestamps();

            // Índices para optimizar consultas
            $table->index(['subject_id', 'group_id', 'date']);
            $table->index(['user_id', 'date']);
            
            // Evitar duplicados: un estudiante no puede tener dos registros el mismo día en la misma materia
            $table->unique(['user_id', 'subject_id', 'group_id', 'date'], 'unique_attendance');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};