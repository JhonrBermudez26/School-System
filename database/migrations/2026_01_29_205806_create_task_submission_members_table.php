<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Esta migración complementa tu sistema existente de tareas
     * agregando la funcionalidad de trabajo en parejas/grupos
     */
    public function up(): void
    {
        // Nueva tabla para miembros adicionales en entregas (parejas/grupos)
        Schema::create('task_submission_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')
                ->constrained('task_submissions')
                ->onDelete('cascade');
            $table->foreignId('student_id')
                ->constrained('users')
                ->onDelete('cascade');
            $table->boolean('is_creator')->default(false);
            $table->enum('status', ['pending', 'accepted', 'rejected'])->default('accepted');
            $table->timestamps();

            // Un estudiante no puede estar dos veces en la misma entrega
            $table->unique(['submission_id', 'student_id']);
            
            // Índices para mejorar performance
            $table->index(['submission_id', 'status']);
            $table->index('student_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('task_submission_members');
    }
};