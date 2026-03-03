<?php
namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

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

    // ✅ CORREGIDO: solo campos permitidos en $fillable de AcademicPeriod.
    // grades_enabled, grades_enabled_manually, is_active, status son protegidos.
    // Se crean con valores por defecto del modelo y luego se activan con métodos.
    $periodo = AcademicPeriod::create([
        'name'          => $validated['name'],
        'year'          => $validated['year'] ?? (int) date('Y', strtotime($validated['start_date'])),
        'period_number' => $periodNumber ?? 1,
        'start_date'    => $validated['start_date'],
        'end_date'      => $validated['end_date'],
        'guidelines'    => $validated['directrices'] ?? null,
        'grade_weight'  => $validated['porcentaje'],
    ]);

    $periodo->grades_enabled          = false;
    $periodo->grades_enabled_manually = false;
    $periodo->save();

    // o si es el periodo actual (sin contraseña necesaria)
    if (!empty($validated['habilitado'])) {
        if ($periodo->isDentroFecha()) {
            $periodo->grades_enabled = true;
            $periodo->grades_enabled_manually = false;
            $periodo->save();
        } else {
            $periodo->enableGradesManually();
        }
    }

    $this->activityLog->log($periodo, 'created', null, $periodo->toArray());

    return redirect()->route('coordinadora.periodos')
        ->with('success', 'Periodo creado correctamente');
}

// --- toggle() ---
public function toggle(Request $request, AcademicPeriod $academicPeriod)
{
    $this->authorize('update', $academicPeriod);

    $oldValues       = $academicPeriod->toArray();
    $esPeriodoActual = $academicPeriod->isDentroFecha();
    $quiereHabilitar = !$academicPeriod->grades_enabled;

    // ✅ Contraseña SOLO si: quiere HABILITAR un periodo que NO es el actual
    if ($quiereHabilitar && !$esPeriodoActual) {
        $request->validate(['password' => 'required|string']);

        if (!Hash::check($request->password, auth()->user()->password)) {
            return back()->withErrors(['password' => 'La contraseña es incorrecta']);
        }

        $academicPeriod->enableGradesManually();

    } elseif ($quiereHabilitar && $esPeriodoActual) {
        // Habilitar el periodo actual — sin contraseña
        $academicPeriod->grades_enabled          = true;
        $academicPeriod->grades_enabled_manually = false; // es automático, no manual
        $academicPeriod->save();

    } else {
        // ✅ Deshabilitar cualquier periodo — NUNCA pide contraseña
        $academicPeriod->grades_enabled          = false;
        $academicPeriod->grades_enabled_manually = false;
        $academicPeriod->save();
    }

    $this->activityLog->log(
        $academicPeriod,
        'toggled_grades_enabled',
        $oldValues,
        $academicPeriod->getChanges()
    );

    $estado = $academicPeriod->grades_enabled ? 'habilitada' : 'deshabilitada';

    return redirect()->route('coordinadora.periodos')
        ->with('success', "Carga de notas {$estado} correctamente");
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