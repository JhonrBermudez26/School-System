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
        Schema::create('grades', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Ej: "Primero A", "Segundo B"
            $table->integer('level'); // 1-11 (primaria y bachillerato)
            $table->string('section')->nullable(); // A, B, C
            $table->foreignId('teacher_id')->nullable()->constrained('users')->onDelete('set null'); // Profesor director
            $table->integer('max_students')->default(30);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('grades');
    }
};
