<?php
namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;

class PeriodController extends Controller
{
    public function index()
    {
        $hoy = now();
        
        $periodos = AcademicPeriod::orderByDesc('year')
            ->orderByDesc('period_number')
            ->get()
            ->map(function ($p) use ($hoy) {
                $esPeriodoActual = $p->start_date <= $hoy && $p->end_date >= $hoy;
                
                return [
                    'id' => $p->id,
                    'nombre' => $p->name,
                    'fecha_inicio' => optional($p->start_date)->format('Y-m-d'),
                    'fecha_fin' => optional($p->end_date)->format('Y-m-d'),
                    'habilitado' => (bool) $p->grades_enabled,
                    'estado' => $esPeriodoActual ? 'Activo' : 'Finalizado',
                    'directrices' => $p->guidelines,
                    'porcentaje' => $p->grade_weight,
                    'es_periodo_actual' => $esPeriodoActual,
                ];
            });

        $periodoActual = AcademicPeriod::where('start_date', '<=', $hoy)
            ->where('end_date', '>=', $hoy)
            ->value('name') ?? 'No definido';

        // Calcular porcentaje total usado
        $porcentajeTotal = AcademicPeriod::sum('grade_weight') ?? 0;
        $porcentajeDisponible = 100 - $porcentajeTotal;

        return Inertia::render('Secretaria/Periodos', [
            'periodos' => $periodos,
            'stats' => [
                'periodoActual' => $periodoActual,
                'total' => $periodos->count(),
                'habilitados' => $periodos->where('habilitado', true)->count(),
                'porcentajeTotal' => $porcentajeTotal,
                'porcentajeDisponible' => $porcentajeDisponible,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:academic_periods,name',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'habilitado' => 'boolean',
            'directrices' => 'nullable|string',
            'porcentaje' => 'nullable|integer|min:0|max:100',
        ]);

        // Validar que el porcentaje no exceda el 100%
        if (isset($data['porcentaje'])) {
            $porcentajeTotal = AcademicPeriod::sum('grade_weight') ?? 0;
            
            if (($porcentajeTotal + $data['porcentaje']) > 100) {
                return back()->withErrors([
                    'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%'
                ]);
            }
        }

        // Derivar año y número de periodo
        $year = null;
        $periodNumber = null;
        
        if (preg_match('/^(\d{4})[-_\s]?(\d)$/', $data['nombre'], $m)) {
            $year = (int) $m[1];
            $periodNumber = (int) $m[2];
        }

        // Validar si está habilitando un periodo fuera de fecha
        $hoy = now();
        $dentroFecha = $data['fecha_inicio'] <= $hoy && $data['fecha_fin'] >= $hoy;
        
        if (($data['habilitado'] ?? false) && !$dentroFecha) {
            // Se requiere validación de contraseña
            $request->validate([
                'password' => 'required|string'
            ]);
            
            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors([
                    'password' => 'La contraseña es incorrecta'
                ]);
            }
        }

        AcademicPeriod::create([
            'name' => $data['nombre'],
            'year' => $year ?? (int) date('Y', strtotime($data['fecha_inicio'])),
            'period_number' => $periodNumber ?? 1,
            'start_date' => $data['fecha_inicio'],
            'end_date' => $data['fecha_fin'],
            'grades_enabled' => $data['habilitado'] ?? false,
            'grades_enabled_manually' => ($data['habilitado'] ?? false) && !$dentroFecha,
            'is_active' => $dentroFecha,
            'guidelines' => $data['directrices'] ?? null,
            'grade_weight' => $data['porcentaje'] ?? null,
        ]);

        return redirect()->route('secretaria.periodos')
            ->with('success', 'Periodo creado correctamente');
    }

    public function update(Request $request, string $id)
    {
        $periodo = AcademicPeriod::findOrFail($id);

        $data = $request->validate([
            'nombre' => 'required|string|max:255|unique:academic_periods,name,' . $id,
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'habilitado' => 'boolean',
            'directrices' => 'nullable|string',
            'porcentaje' => 'nullable|integer|min:0|max:100',
        ]);

        // Validar que el porcentaje no exceda el 100%
        if (isset($data['porcentaje'])) {
            $porcentajeTotal = AcademicPeriod::where('id', '!=', $id)->sum('grade_weight') ?? 0;
            
            if (($porcentajeTotal + $data['porcentaje']) > 100) {
                return back()->withErrors([
                    'porcentaje' => 'La suma de porcentajes no puede exceder el 100%. Disponible: ' . (100 - $porcentajeTotal) . '%'
                ]);
            }
        }

        $year = $periodo->year;
        $periodNumber = $periodo->period_number;
        
        if (preg_match('/^(\d{4})[-_\s]?(\d)$/', $data['nombre'], $m)) {
            $year = (int) $m[1];
            $periodNumber = (int) $m[2];
        }

        // Validar si está habilitando un periodo fuera de fecha
        $hoy = now();
        $dentroFecha = $data['fecha_inicio'] <= $hoy && $data['fecha_fin'] >= $hoy;
        
        if (($data['habilitado'] ?? false) && !$dentroFecha) {
            $request->validate([
                'password' => 'required|string'
            ]);
            
            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors([
                    'password' => 'La contraseña es incorrecta'
                ]);
            }
        }

        $periodo->update([
            'name' => $data['nombre'],
            'year' => $year,
            'period_number' => $periodNumber,
            'start_date' => $data['fecha_inicio'],
            'end_date' => $data['fecha_fin'],
            'grades_enabled' => $data['habilitado'] ?? false,
            'is_active' => $dentroFecha,
            'guidelines' => $data['directrices'] ?? null,
            'grade_weight' => $data['porcentaje'] ?? null,
        ]);

        return redirect()->route('secretaria.periodos')
            ->with('success', 'Periodo actualizado correctamente');
    }

    public function destroy(string $id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        $periodo->delete();

        return redirect()->route('secretaria.periodos')
            ->with('success', 'Periodo eliminado correctamente');
    }

    public function toggle(Request $request, string $id)
    {
        $periodo = AcademicPeriod::findOrFail($id);
        
        // Verificar si el periodo está dentro de las fechas
        $dentroFecha = $periodo->isDentroFecha();
        
        // Si va a habilitar y NO está dentro de fecha, requiere contraseña
        if (!$periodo->grades_enabled && !$dentroFecha) {
            $request->validate([
                'password' => 'required|string'
            ]);
            
            if (!Hash::check($request->password, auth()->user()->password)) {
                return back()->withErrors([
                    'password' => 'La contraseña es incorrecta'
                ]);
            }
            
            // Marcar como habilitado manualmente
            $periodo->grades_enabled = true;
            $periodo->grades_enabled_manually = true;
        } else {
            // Toggle normal
            $periodo->grades_enabled = !$periodo->grades_enabled;
            
            // Si está dentro de fecha, no es manual
            if ($dentroFecha) {
                $periodo->grades_enabled_manually = false;
            }
        }
        
        $periodo->save();

        $estado = $periodo->grades_enabled ? 'habilitada' : 'deshabilitada';

        return redirect()->route('secretaria.periodos')
            ->with('success', "Carga de notas {$estado} correctamente");
    }

    public function verifyPassword(Request $request)
    {
        $request->validate([
            'password' => 'required|string'
        ]);

        $isValid = Hash::check($request->password, auth()->user()->password);

        return response()->json(['valid' => $isValid]);
    }
}