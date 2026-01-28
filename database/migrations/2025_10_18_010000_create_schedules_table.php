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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('group_id')->constrained('groups')->onDelete('cascade');
            $table->foreignId('subject_id')->constrained('subjects')->onDelete('cascade');
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade'); // profesor asignado
            $table->tinyInteger('day_of_week'); // 1=Lunes ... 7=Domingo
            $table->time('start_time');
            $table->time('end_time');
            $table->string('classroom')->nullable();
            $table->timestamps();

            $table->index(['group_id', 'day_of_week']);
            $table->index(['user_id', 'day_of_week']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
