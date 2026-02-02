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
        // Tabla para registros de notas manuales (exámenes, participación, etc.)
        Schema::create('manual_grades', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('group_id');
            $table->unsignedBigInteger('teacher_id');
            $table->string('title'); // Ej: "Examen Parcial 1", "Participación"
            $table->text('description')->nullable();
            $table->decimal('max_score', 8, 2); // Puntuación máxima
            $table->decimal('weight', 4, 2)->default(1); // Peso en la nota final
            $table->date('grade_date')->nullable();
            $table->timestamps();

            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            $table->foreign('teacher_id')->references('id')->on('users')->onDelete('cascade');
        });

        // Tabla para las calificaciones de cada estudiante en los registros manuales
        Schema::create('manual_grade_scores', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('manual_grade_id');
            $table->unsignedBigInteger('student_id');
            $table->decimal('score', 8, 2);
            $table->text('feedback')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();

            $table->foreign('manual_grade_id')->references('id')->on('manual_grades')->onDelete('cascade');
            $table->foreign('student_id')->references('id')->on('users')->onDelete('cascade');

            // Un estudiante solo puede tener una calificación por registro manual
            $table->unique(['manual_grade_id', 'student_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manual_grade_scores');
        Schema::dropIfExists('manual_grades');
    }
};