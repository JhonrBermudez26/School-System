<?php
// database/migrations/xxxx_create_performance_settings_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_settings', function (Blueprint $table) {
            $table->id();
            $table->decimal('min_passing_grade', 3, 2)->default(3.0); // Nota mínima aprobatoria
            $table->integer('max_failed_subjects')->default(3); // Máximo de materias perdidas para alerta
            $table->decimal('critical_absence_rate', 5, 2)->default(20.0); // % de inasistencia crítica
            $table->timestamps();
        });

        // Insertar configuración por defecto
        DB::table('performance_settings')->insert([
            'min_passing_grade' => 3.0,
            'max_failed_subjects' => 3,
            'critical_absence_rate' => 20.0,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_settings');
    }
};