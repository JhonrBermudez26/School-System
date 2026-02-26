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
                $esPeriodoActual = $p->start_date <= $hoy && $p->end_date >= $hoy;

                return [
                    'id'               => $p->id,
                    'nombre'           => $p->name,
                    'fecha_inicio'     => $p->start_date->format('Y-m-d'),
                    'fecha_fin'        => $p->end_date->format('Y-m-d'),
                    'habilitado'       => (bool) $p->grades_enabled,
                    'status'           => $p->status,
                    'es_periodo_actual'=> $esPeriodoActual,
                    'directrices'      => $p->guidelines,
                    'porcentaje'       => $p->grade_weight,
                ];
            });

        $periodoActual        = AcademicPeriod::getPeriodoActual();
        $porcentajeTotal      = AcademicPeriod::sum('grade_weight') ?? 0;
        $porcentajeDisponible = 100 - $porcentajeTotal;

        return Inertia::render('Coordinadora/Periodos', [
            'periodos' => $periodos,
            'stats'    => [
                'periodoActual'        => $periodoActual?->name ?? 'No definido',
                'total'                => $periodos->count(),
                'habilitados'          => $periodos->where('habilitado', true)->count(),
                'porcentajeTotal'      => $porcentajeTotal,
                'porcentajeDisponible' => $porcentajeDisponible,
            ],
        ]);
    }

    public function store(\App\Http\Requests\PeriodRequest $request)
    {
        $validated = $request->validated();

        $porcentajeTotal = AcademicPeriod::sum('grade_weight') ?? 0;
        if (($porcentajeTotal + $validated['porcentaje']) > 100) {
            return back()->withErrors([
                'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%',
            ]);
        }

        $periodNumber = null;
        if (preg_match('/[-_\s]?(\d)$/', $validated['name'], $m)) {
            $periodNumber = (int) $m[1];
        }

        $periodo = AcademicPeriod::create([
            'name'                    => $validated['name'],
            'year'                    => $validated['year'] ?? (int) date('Y', strtotime($validated['start_date'])),
            'period_number'           => $periodNumber ?? 1,
            'start_date'              => $validated['start_date'],
            'end_date'                => $validated['end_date'],
            'grades_enabled'          => $validated['habilitado'] ?? true,
            'grades_enabled_manually' => false,
            'status'                  => 'draft',
            'is_active'               => false,
            'guidelines'              => $validated['directrices'] ?? null,
            'grade_weight'            => $validated['porcentaje'],
        ]);

        $this->activityLog->log($periodo, 'created', null, $periodo->toArray());

        return redirect()->route('coordinadora.periodos')
            ->with('success', 'Periodo creado correctamente');
    }

    /**
     * ✅ FIX IDOR: Route Model Binding reemplaza findOrFail($id) manual
     */
    public function update(\App\Http\Requests\PeriodRequest $request, AcademicPeriod $academicPeriod)
    {
        $validated = $request->validated();

        $porcentajeTotal = AcademicPeriod::where('id', '!=', $academicPeriod->id)->sum('grade_weight') ?? 0;
        if (($porcentajeTotal + $validated['porcentaje']) > 100) {
            return back()->withErrors([
                'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%',
            ]);
        }

        $periodNumber = $academicPeriod->period_number;
        if (preg_match('/[-_\s]?(\d)$/', $validated['name'], $m)) {
            $periodNumber = (int) $m[1];
        }

        $oldValues = $academicPeriod->toArray();

        $academicPeriod->update([
            'name'         => $validated['name'],
            'year'         => $validated['year'] ?? $academicPeriod->year,
            'period_number'=> $periodNumber,
            'start_date'   => $validated['start_date'],
            'end_date'     => $validated['end_date'],
            'guidelines'   => $validated['directrices'] ?? null,
            'grade_weight' => $validated['porcentaje'],
        ]);

        $this->activityLog->log($academicPeriod, 'updated', $oldValues, $academicPeriod->getChanges());

        return redirect()->route('coordinadora.periodos')
            ->with('success', 'Periodo actualizado correctamente');
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + authorize('delete', $periodo)
     */
    public function destroy(AcademicPeriod $academicPeriod)
    {
        $this->authorize('delete', $academicPeriod);

        $oldValues = $academicPeriod->toArray();
        $academicPeriod->delete();

        $this->activityLog->log($academicPeriod, 'deleted', $oldValues, null);

        return redirect()->route('coordinadora.periodos')
            ->with('success', 'Periodo eliminado correctamente');
    }

    /**
     * Habilitar/Deshabilitar carga de notas
     * ✅ FIX IDOR: Route Model Binding + authorize('update', $periodo)
     */
    public function toggle(Request $request, AcademicPeriod $academicPeriod)
    {
        $this->authorize('update', $academicPeriod);

        $oldValues       = $academicPeriod->toArray();
        $esPeriodoActual = $academicPeriod->isDentroFecha();

        if (!$esPeriodoActual && !$academicPeriod->grades_enabled) {
            $request->validate(['password' => 'required|string']);

            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors(['password' => 'La contraseña es incorrecta']);
            }

            $academicPeriod->grades_enabled          = true;
            $academicPeriod->grades_enabled_manually = true;
        } else {
            $academicPeriod->grades_enabled = !$academicPeriod->grades_enabled;
            if ($esPeriodoActual) {
                $academicPeriod->grades_enabled_manually = false;
            }
        }

        $academicPeriod->save();

        $this->activityLog->log($academicPeriod, 'toggled_grades_enabled', $oldValues, $academicPeriod->getChanges());

        $estado = $academicPeriod->grades_enabled ? 'habilitada' : 'deshabilitada';

        return redirect()->route('coordinadora.periodos')
            ->with('success', "Carga de notas {$estado} correctamente");
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + authorize('close', $periodo)
     */
    public function close(AcademicPeriod $academicPeriod)
    {
        $this->authorize('close', $academicPeriod);

        if (!$academicPeriod->isActive()) {
            return back()->withErrors(['error' => 'Solo se pueden cerrar periodos activos']);
        }

        $oldValues = $academicPeriod->toArray();

        if ($academicPeriod->close(auth()->id())) {
            $this->activityLog->log($academicPeriod, 'closed', $oldValues, $academicPeriod->getChanges());

            return redirect()->route('coordinadora.periodos')
                ->with('success', 'Periodo cerrado correctamente. Los profesores ya no pueden modificar notas.');
        }

        return back()->withErrors(['error' => 'No se pudo cerrar el periodo']);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + authorize('reopen', $periodo)
     */
    public function reopen(AcademicPeriod $academicPeriod)
    {
        $this->authorize('reopen', $academicPeriod);

        if (!$academicPeriod->isClosed()) {
            return back()->withErrors(['error' => 'Solo se pueden reabrir periodos cerrados']);
        }

        $oldValues = $academicPeriod->toArray();

        if ($academicPeriod->reopen(auth()->id())) {
            $this->activityLog->log($academicPeriod, 'reopened', $oldValues, $academicPeriod->getChanges());

            return redirect()->route('coordinadora.periodos')
                ->with('success', 'Periodo reabierto correctamente. Los profesores pueden volver a modificar notas.');
        }

        return back()->withErrors(['error' => 'No se pudo reabrir el periodo']);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + authorize('archive', $periodo)
     */
    public function archive(AcademicPeriod $academicPeriod)
    {
        $this->authorize('archive', $academicPeriod);

        if (!$academicPeriod->isClosed()) {
            return back()->withErrors(['error' => 'Solo se pueden archivar periodos cerrados']);
        }

        $oldValues = $academicPeriod->toArray();

        if ($academicPeriod->archive()) {
            $this->activityLog->log($academicPeriod, 'archived', $oldValues, $academicPeriod->getChanges());

            return redirect()->route('coordinadora.periodos')
                ->with('success', 'Periodo archivado correctamente');
        }

        return back()->withErrors(['error' => 'No se pudo archivar el periodo']);
    }
}