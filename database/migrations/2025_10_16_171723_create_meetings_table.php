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
    Schema::create('meetings', function (Blueprint $table) {
        $table->id();
        $table->foreignId('teacher_id')->constrained('users')->onDelete('cascade');
        $table->foreignId('grade_id')->constrained('grades')->onDelete('cascade');
        $table->foreignId('subject_id')->nullable()->constrained('subjects')->onDelete('set null');
        $table->string('title');
        $table->text('description')->nullable();
        $table->string('meeting_link'); // Enlace de la reunión (ej: Zoom, Meet)
        $table->dateTime('scheduled_at'); // Fecha y hora de inicio
        $table->timestamps();
    });
}


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('meetings');
    }
};
