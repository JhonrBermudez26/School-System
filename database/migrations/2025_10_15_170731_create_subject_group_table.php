<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subject_group', function (Blueprint $table) {
            $table->id();
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // El profesor
            $table->timestamps();
            
            
            $table->unique(['user_id', 'subject_id', 'group_id'], 'unique_teacher_subject_group');
            
            // Índices para mejorar el rendimiento
            $table->index('user_id');
            $table->index('subject_id');
            $table->index('group_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_group');
    }
};