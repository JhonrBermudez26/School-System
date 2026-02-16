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
                return [
                    'id' => $p->id,
                    'nombre' => $p->name,
                    'fecha_inicio' => $p->start_date->format('Y-m-d'),
                    'fecha_fin' => $p->end_date->format('Y-m-d'),
                    'habilitado' => (bool) $p->grades_enabled,
                    'status' => $p->status,
                    'es_periodo_actual' => $p->is_active,
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
        if (isset($validated['porcentaje'])) {
            $porcentajeTotal = AcademicPeriod::sum('grade_weight') ?? 0;
            
            if (($porcentajeTotal + $validated['porcentaje']) > 100) {
                return back()->withErrors([
                    'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%'
                ]);
            }
        }

        // Derivar año y número
        $year = $validated['year'] ?? null;
        $periodNumber = null;
        
        if (preg_match('/[-_\s]?(\d)$/', $validated['name'], $m)) {
            $periodNumber = (int) $m[1];
        }

        // Validar habilitación fuera de fecha
        $hoy = now();
        $dentroFecha = $validated['start_date'] <= $hoy && $validated['end_date'] >= $hoy;
        
        if (($validated['habilitado'] ?? false) && !$dentroFecha) {
            $request->validate(['password' => 'required|string']);
            
            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors(['password' => 'La contraseña es incorrecta']);
            }
        }

        $periodo = AcademicPeriod::create([
            'name' => $validated['name'],
            'year' => $year ?? (int) date('Y', strtotime($validated['start_date'])),
            'period_number' => $periodNumber ?? 1,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'grades_enabled' => $validated['habilitado'] ?? false,
            'grades_enabled_manually' => ($validated['habilitado'] ?? false) && !$dentroFecha,
            'status' => $validated['status'] ?? 'draft',
            'is_active' => $dentroFecha && ($validated['status'] ?? 'draft') === 'active',
            'guidelines' => $validated['directrices'] ?? null,
            'grade_weight' => $validated['porcentaje'] ?? null,
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
        if (isset($validated['porcentaje'])) {
            $porcentajeTotal = AcademicPeriod::where('id', '!=', $id)->sum('grade_weight') ?? 0;
            
            if (($porcentajeTotal + $validated['porcentaje']) > 100) {
                return back()->withErrors([
                    'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%'
                ]);
            }
        }

        $year = $validated['year'] ?? $periodo->year;
        $periodNumber = $periodo->period_number;
        
        if (preg_match('/[-_\s]?(\d)$/', $validated['name'], $m)) {
            $periodNumber = (int) $m[1];
        }

        $hoy = now();
        $dentroFecha = $validated['start_date'] <= $hoy && $validated['end_date'] >= $hoy;
        
        if (($validated['habilitado'] ?? false) && !$dentroFecha && ($validated['habilitado'] != $periodo->grades_enabled)) {
            $request->validate(['password' => 'required|string']);
            
            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors(['password' => 'La contraseña es incorrecta']);
            }
        }

        $periodo->update([
            'name' => $validated['name'],
            'year' => $year,
            'period_number' => $periodNumber,
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'grades_enabled' => $validated['habilitado'] ?? false,
            'grades_enabled_manually' => ($validated['habilitado'] ?? false) && !$dentroFecha,
            'status' => $validated['status'] ?? $periodo->status,
            'is_active' => $dentroFecha && ($validated['status'] ?? $periodo->status) === 'active',
            'guidelines' => $validated['directrices'] ?? null,
            'grade_weight' => $validated['porcentaje'] ?? null,
        ]);

        $this->activityLog->log($periodo, 'updated', $oldValues, $periodo->getChanges());

        return redirect()->route('coordinadora.periodos')
            ->with('success', 'Periodo actualizado correctamente');
    }

    /**
     * Eliminar un periodo
     */
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
     * Habilitar/deshabilitar carga de notas
     */
    public function toggle(Request $request, string $id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $this->authorize('update', $periodo);

        $oldValues = $periodo->toArray();
        $dentroFecha = $periodo->isDentroFecha();
        
        if (!$periodo->grades_enabled && !$dentroFecha) {
            $request->validate(['password' => 'required|string']);
            
            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors(['password' => 'La contraseña es incorrecta']);
            }
            
            $periodo->grades_enabled = true;
            $periodo->grades_enabled_manually = true;
        } else {
            $periodo->grades_enabled = !$periodo->grades_enabled;
            
            if ($dentroFecha) {
                $periodo->grades_enabled_manually = false;
            }
        }
        
        $periodo->save();
        $this->activityLog->log($periodo, 'toggled_grades_enabled', $oldValues, $periodo->getChanges());
        
        $estado = $periodo->grades_enabled ? 'habilitada' : 'deshabilitada';
        
        return redirect()->route('coordinadora.periodos')
            ->with('success', "Carga de notas {$estado} correctamente");
    }

    /**
     * Activar un periodo (draft → active)
     */
    public function activate($id)
    {
        $periodo = AcademicPeriod::findOrFail($id);

        $this->authorize('activate', $periodo);

        if (!$periodo->isDraft()) {
            return back()->withErrors(['error' => 'Solo se pueden activar periodos en estado borrador']);
        }

        $oldValues = $periodo->toArray();
        if ($periodo->activate(auth()->id())) {
            $this->activityLog->log($periodo, 'activated', $oldValues, $periodo->getChanges());
            return redirect()->route('coordinadora.periodos')
                ->with('success', 'Periodo activado correctamente. Los profesores ya pueden cargar notas.');
        }

        return back()->withErrors(['error' => 'No se pudo activar el periodo']);
    }

    /**
     * Cerrar un periodo (active → closed)
     */
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

    /**
     * Reabrir un periodo cerrado (closed → active)
     */
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

    /**
     * Archivar un periodo (closed → archived)
     */
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