<?php

namespace App\Observers;

use App\Models\AcademicPeriod;
use App\Services\BoletinService;
use Illuminate\Support\Facades\Log;

class AcademicPeriodObserver
{
    protected $boletinService;

    public function __construct(BoletinService $boletinService)
    {
        $this->boletinService = $boletinService;
    }

    /**
     * Handle the AcademicPeriod "updated" event.
     * Genera boletines automáticamente cuando un periodo se cierra
     */
    public function updated(AcademicPeriod $period)
    {
        // Verificar si el periodo acaba de cerrarse
        if ($period->isDirty('status') && $period->status === 'closed') {
            Log::info("Periodo cerrado, generando boletines automáticamente", [
                'period_id' => $period->id,
                'period_name' => $period->name,
            ]);

            try {
                // Generar boletines en segundo plano (idealmente usar Jobs/Queues)
                dispatch(function() use ($period) {
                    $this->boletinService->generarBoletinesPeriodo($period);
                    
                    Log::info("Boletines generados exitosamente", [
                        'period_id' => $period->id,
                    ]);
                })->afterResponse();
                
            } catch (\Exception $e) {
                Log::error("Error generando boletines automáticamente", [
                    'period_id' => $period->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString(),
                ]);
            }
        }
    }
}