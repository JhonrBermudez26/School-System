<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Esta migración asigna el periodo académico actual a todas las tareas
     * y notas manuales que no tienen periodo asignado.
     */
    public function up(): void
    {
        // Obtener el periodo actual (dentro de fechas)
        $currentPeriod = DB::table('academic_periods')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->where('grades_enabled', true)
            ->first();

        // Si no hay periodo actual, tomar el más reciente habilitado
        if (!$currentPeriod) {
            $currentPeriod = DB::table('academic_periods')
                ->where('grades_enabled', true)
                ->orderByDesc('year')
                ->orderByDesc('period_number')
                ->first();
        }

        // Solo proceder si hay un periodo disponible
        if ($currentPeriod) {
            // Actualizar tareas sin periodo
            DB::table('tasks')
                ->whereNull('academic_period_id')
                ->update(['academic_period_id' => $currentPeriod->id]);

            // Actualizar notas manuales sin periodo
            DB::table('manual_grades')
                ->whereNull('academic_period_id')
                ->update(['academic_period_id' => $currentPeriod->id]);

            // Log para información
            $tasksUpdated = DB::table('tasks')
                ->where('academic_period_id', $currentPeriod->id)
                ->count();
            
            $gradesUpdated = DB::table('manual_grades')
                ->where('academic_period_id', $currentPeriod->id)
                ->count();

            \Log::info("Periodo académico asignado automáticamente", [
                'period_id' => $currentPeriod->id,
                'period_name' => $currentPeriod->name,
                'tasks_updated' => $tasksUpdated,
                'manual_grades_updated' => $gradesUpdated,
            ]);
        } else {
            \Log::warning("No se encontró periodo académico para asignar a registros existentes");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revertir: dejar los periodos en null
        DB::table('tasks')
            ->update(['academic_period_id' => null]);

        DB::table('manual_grades')
            ->update(['academic_period_id' => null]);
    }
};