<?php

namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class PeriodController extends Controller
{
    protected $activityLog;

    public function __construct(\App\Services\ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    public function index()
    {
        $hoy = now();
        
        $periodos = AcademicPeriod::orderByDesc('year')
            ->orderByDesc('period_number')
            ->get()
            ->map(function ($p) use ($hoy) {
                // ⭐ Determinar si es el periodo actual por FECHA
                $esPeriodoActual = $p->start_date <= $hoy && $p->end_date >= $hoy;
                
                return [
                    'id' => $p->id,
                    'nombre' => $p->name,
                    'fecha_inicio' => $p->start_date->format('Y-m-d'),
                    'fecha_fin' => $p->end_date->format('Y-m-d'),
                    'habilitado' => (bool) $p->grades_enabled,
                    'status' => $p->status,
                    'es_periodo_actual' => $esPeriodoActual, // ⭐ Automático por fecha
                    'directrices' => $p->guidelines,
                    'porcentaje' => $p->grade_weight,
                ];
            });

        $periodoActual = AcademicPeriod::getPeriodoActual();
        
        $porcentajeTotal = AcademicPeriod::sum('grade_weight') ?? 0;
        $porcentajeDisponible = 100 - $porcentajeTotal;

        return Inertia::render('Coordinadora/Periodos', [
            'periodos' => $periodos,
            'stats' => [
                'periodoActual' => $periodoActual?->name ?? 'No definido',
                'total' => $periodos->count(),
                'habilitados' => $periodos->where('habilitado', true)->count(),
                'porcentajeTotal' => $porcentajeTotal,
                'porcentajeDisponible' => $porcentajeDisponible,
            ],
        ]);
    }

    public function store(\App\Http\Requests\PeriodRequest $request)
    {
        $validated = $request->validated();

        // Validar porcentaje
        $porcentajeTotal = AcademicPeriod::sum('grade_weight') ?? 0;
        
        if (($porcentajeTotal + $validated['porcentaje']) > 100) {
            return back()->withErrors([
                'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%'
            ]);
        }

        // Derivar año y número
        $year = $validated['year'] ?? null;
        $periodNumber = null;
        
        if (preg_match('/[-_\s]?(\d)$/', $validated['name'], $m)) {
            $periodNumber = (int) $m[1];
        }

        $periodo = AcademicPeriod::create([
            'name' => $validated['name'],
            'year' => $year ?? (int) date('Y', strtotime($validated['start_date'])),
            'period_number' => $periodNumber ?? 1,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'grades_enabled' => $validated['habilitado'] ?? true, // Por defecto habilitado
            'grades_enabled_manually' => false, // Se marca después si aplica
            'status' => 'draft',
            'is_active' => false, // Se actualizará automáticamente
            'guidelines' => $validated['directrices'] ?? null,
            'grade_weight' => $validated['porcentaje'],
        ]);

        $this->activityLog->log($periodo, 'created', null, $periodo->toArray());

        return redirect()->route('coordinadora.periodos')
            ->with('success', 'Periodo creado correctamente');
    }

    public function update(\App\Http\Requests\PeriodRequest $request, string $id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $oldValues = $periodo->toArray();
        
        $validated = $request->validated();

        // Validar porcentaje
        $porcentajeTotal = AcademicPeriod::where('id', '!=', $id)->sum('grade_weight') ?? 0;
        
        if (($porcentajeTotal + $validated['porcentaje']) > 100) {
            return back()->withErrors([
                'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%'
            ]);
        }

        $year = $validated['year'] ?? $periodo->year;
        $periodNumber = $periodo->period_number;
        
        if (preg_match('/[-_\s]?(\d)$/', $validated['name'], $m)) {
            $periodNumber = (int) $m[1];
        }

        $periodo->update([
            'name' => $validated['name'],
            'year' => $year,
            'period_number' => $periodNumber,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'guidelines' => $validated['directrices'] ?? null,
            'grade_weight' => $validated['porcentaje'],
        ]);

        $this->activityLog->log($periodo, 'updated', $oldValues, $periodo->getChanges());

        return redirect()->route('coordinadora.periodos')
            ->with('success', 'Periodo actualizado correctamente');
    }

    public function destroy(string $id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $this->authorize('delete', $periodo);
        
        $oldValues = $periodo->toArray();
        $periodo->delete();
        
        $this->activityLog->log($periodo, 'deleted', $oldValues, null);

        return redirect()->route('coordinadora.periodos')
            ->with('success', 'Periodo eliminado correctamente');
    }

    /**
     * ⭐ Habilitar/Deshabilitar carga de notas
     * - Si es periodo actual: toggle directo
     * - Si NO es periodo actual: requiere contraseña
     */
    public function toggle(Request $request, string $id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $this->authorize('update', $periodo);

        $oldValues = $periodo->toArray();
        $esPeriodoActual = $periodo->isDentroFecha();

        // Si NO es el periodo actual y se quiere habilitar, requiere contraseña
        if (!$esPeriodoActual && !$periodo->grades_enabled) {
            $request->validate(['password' => 'required|string']);
            
            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors(['password' => 'La contraseña es incorrecta']);
            }
            
            $periodo->grades_enabled = true;
            $periodo->grades_enabled_manually = true;
        } else {
            // Toggle normal
            $periodo->grades_enabled = !$periodo->grades_enabled;
            
            if ($esPeriodoActual) {
                $periodo->grades_enabled_manually = false;
            }
        }
        
        $periodo->save();
        $this->activityLog->log($periodo, 'toggled_grades_enabled', $oldValues, $periodo->getChanges());
        
        $estado = $periodo->grades_enabled ? 'habilitada' : 'deshabilitada';
        
        return redirect()->route('coordinadora.periodos')
            ->with('success', "Carga de notas {$estado} correctamente");
    }

    public function close($id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $this->authorize('close', $periodo);

        if (!$periodo->isActive()) {
            return back()->withErrors(['error' => 'Solo se pueden cerrar periodos activos']);
        }

        $oldValues = $periodo->toArray();

        if ($periodo->close(auth()->id())) {
            $this->activityLog->log($periodo, 'closed', $oldValues, $periodo->getChanges());
            
            return redirect()->route('coordinadora.periodos')
                ->with('success', 'Periodo cerrado correctamente. Los profesores ya no pueden modificar notas.');
        }

        return back()->withErrors(['error' => 'No se pudo cerrar el periodo']);
    }

    public function reopen($id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $this->authorize('reopen', $periodo);

        if (!$periodo->isClosed()) {
            return back()->withErrors(['error' => 'Solo se pueden reabrir periodos cerrados']);
        }

        $oldValues = $periodo->toArray();

        if ($periodo->reopen(auth()->id())) {
            $this->activityLog->log($periodo, 'reopened', $oldValues, $periodo->getChanges());
            
            return redirect()->route('coordinadora.periodos')
                ->with('success', 'Periodo reabierto correctamente. Los profesores pueden volver a modificar notas.');
        }

        return back()->withErrors(['error' => 'No se pudo reabrir el periodo']);
    }

    public function archive($id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $this->authorize('archive', $periodo);

        if (!$periodo->isClosed()) {
            return back()->withErrors(['error' => 'Solo se pueden archivar periodos cerrados']);
        }

        $oldValues = $periodo->toArray();

        if ($periodo->archive()) {
            $this->activityLog->log($periodo, 'archived', $oldValues, $periodo->getChanges());
            
            return redirect()->route('coordinadora.periodos')
                ->with('success', 'Periodo archivado correctamente');
        }

        return back()->withErrors(['error' => 'No se pudo archivar el periodo']);
    }
}