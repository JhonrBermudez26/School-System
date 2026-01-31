<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. TABLA PRINCIPAL: tasks
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('subject_id');
            $table->unsignedBigInteger('group_id');
            $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->enum('work_type', ['individual', 'pairs', 'group'])->default('individual');
            $table->integer('max_group_members')->nullable();
            $table->dateTime('due_date');
            $table->dateTime('close_date')->nullable();
            $table->boolean('allow_late_submission')->default(true);
            $table->integer('max_score')->default(100);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            // Foreign keys
            $table->foreign('subject_id')->references('id')->on('subjects')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
            
            // Índice compuesto
            $table->index(['subject_id', 'group_id', 'teacher_id']);
        });

        // 2. Archivos adjuntos de la tarea
        Schema::create('task_attachments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type');
            $table->integer('file_size');
            $table->timestamps();
        });

        // 3. IMPORTANTE: Crear task_group_submissions ANTES de task_submissions
        Schema::create('task_group_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->string('group_name');
            $table->timestamps();
        });

        // 4. AHORA SÍ: Entregas de estudiantes (depende de task_group_submissions)
        Schema::create('task_submissions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('task_id')->constrained('tasks')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('group_submission_id')->nullable()->constrained('task_group_submissions')->onDelete('cascade');
            $table->text('comment')->nullable();
            $table->enum('status', ['pending', 'submitted', 'graded', 'returned'])->default('pending');
            $table->boolean('is_late')->default(false);
            $table->decimal('score', 5, 2)->nullable();
            $table->text('teacher_feedback')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->timestamps();

            // Índice
            $table->index(['task_id', 'student_id']);
        });

        // 5. Archivos de entregas
        Schema::create('submission_files', function (Blueprint $table) {
            $table->id();
            $table->foreignId('submission_id')->constrained('task_submissions')->onDelete('cascade');
            $table->string('file_name');
            $table->string('file_path');
            $table->string('file_type');
            $table->integer('file_size');
            $table->timestamps();
        });

        // 6. Tabla pivote para miembros de grupo
        Schema::create('group_submission_members', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_submission_id')->constrained('task_group_submissions')->onDelete('cascade');
            $table->foreignId('student_id')->constrained('users')->onDelete('cascade');
            $table->timestamps();

            $table->unique(['group_submission_id', 'student_id']);
        });
    }

    public function down(): void
    {
        // Eliminar en orden inverso
        Schema::dropIfExists('group_submission_members');
        Schema::dropIfExists('submission_files');
        Schema::dropIfExists('task_submissions');
        Schema::dropIfExists('task_group_submissions');
        Schema::dropIfExists('task_attachments');
        Schema::dropIfExists('tasks');
    }
};