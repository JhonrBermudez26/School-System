<?php

namespace App\Console\Commands;

use App\Models\AcademicPeriod;
use Illuminate\Console\Command;

class SyncAcademicPeriods extends Command
{
    protected $signature = 'periods:sync';
    protected $description = 'Sincroniza el estado de habilitación de periodos académicos según las fechas';

    public function handle()
    {
        $hoy = now();
        $actualizados = 0;

        // Obtener todos los periodos
        $periodos = AcademicPeriod::all();

        foreach ($periodos as $periodo) {
            $dentroFecha = $periodo->start_date <= $hoy && $periodo->end_date >= $hoy;
            
            // Solo actualizar si el estado calculado es diferente al actual
            // Y si no fue habilitado manualmente (grades_enabled_manually)
            if ($dentroFecha && !$periodo->grades_enabled) {
                // Habilitar automáticamente
                $periodo->grades_enabled = true;
                $periodo->is_active = true;
                $periodo->grades_enabled_manually = false;
                $periodo->save();
                $actualizados++;
                $this->info("✓ Periodo {$periodo->name} habilitado automáticamente");
            } elseif (!$dentroFecha && $periodo->grades_enabled && !$periodo->grades_enabled_manually) {
                // Deshabilitar automáticamente solo si no fue habilitado manualmente
                $periodo->grades_enabled = false;
                $periodo->is_active = false;
                $periodo->save();
                $actualizados++;
                $this->info("✓ Periodo {$periodo->name} deshabilitado automáticamente");
            }
        }

        if ($actualizados === 0) {
            $this->info('No hay periodos que requieran actualización');
        } else {
            $this->info("Se actualizaron {$actualizados} periodo(s)");
        }

        return 0;
    }
}