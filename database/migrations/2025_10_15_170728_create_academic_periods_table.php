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
        Schema::create('academic_periods', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // Ej: "Primer Periodo 2025", "Segundo Periodo 2025"
            $table->integer('year');
            $table->integer('period_number'); // 1, 2, 3, 4
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('grades_enabled')->default(false); // Habilitar carga de notas
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic_periods');
    }
};
