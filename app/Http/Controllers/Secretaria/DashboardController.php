<?php

namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Group;
use App\Models\AcademicPeriod;
use App\Models\Boletin;
use Carbon\Carbon;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class DashboardController extends Controller
{
    public function index()
    {
        try {
            // Total de estudiantes (usuarios con rol estudiante)
            $totalEstudiantes = User::role('estudiante')->count();

            // Nuevos estudiantes creados este mes
            $nuevosEsteMes = User::role('estudiante')
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->count();

            // Periodo académico actual por rango de fechas
            $hoy = Carbon::now();
            $periodo = AcademicPeriod::where('start_date', '<=', $hoy)
                ->where('end_date', '>=', $hoy)
                ->first();
            $periodoActual = $periodo->name ?? 'No definido';
            $periodoActualInicio = optional($periodo?->start_date)->format('Y-m-d');
            $periodoActualFin = optional($periodo?->end_date)->format('Y-m-d');

            // Cantidad de boletines generados
            $boletines = Boletin::count() ?? 0;

            // ✅ Estudiantes recientes CON SU GRUPO (usando tabla pivote)
            $estudiantesRecientes = User::role('estudiante')
                ->with(['groups.grade', 'groups.course']) // Cargar relación con grupos
                ->latest()
                ->take(3) // Solo los últimos 3
                ->get()
                ->map(function ($estudiante) {
                    // Obtener el primer grupo del estudiante (tabla pivote)
                    $grupo = $estudiante->groups->first();
                    
                    return [
                        'id' => $estudiante->id,
                        'name' => $estudiante->name,
                        'last_name' => $estudiante->last_name,
                        'email' => $estudiante->email,
                        'group' => $grupo ? [
                            'id' => $grupo->id,
                            'nombre' => $grupo->nombre,
                            'grade' => $grupo->grade ? [
                                'id' => $grupo->grade->id,
                                'nombre' => $grupo->grade->nombre,
                            ] : null,
                            'course' => $grupo->course ? [
                                'id' => $grupo->course->id,
                                'nombre' => $grupo->course->nombre,
                            ] : null,
                        ] : null,
                    ];
                });

            // ✅ Estadísticas adicionales de grupos
            $totalGrupos = Group::count();
            $estudiantesSinGrupo = User::role('estudiante')
                ->whereDoesntHave('groups')
                ->count();

            Log::info('Dashboard cargado', [
                'total_estudiantes' => $totalEstudiantes,
                'estudiantes_sin_grupo' => $estudiantesSinGrupo,
            ]);

            return Inertia::render('Secretaria/Dashboard', [
                'stats' => [
                    'totalEstudiantes' => $totalEstudiantes,
                    'nuevosEsteMes' => $nuevosEsteMes,
                    'periodoActual' => $periodoActual,
                    'periodoActualInicio' => $periodoActualInicio,
                    'periodoActualFin' => $periodoActualFin,
                    'boletines' => $boletines,
                    'totalGrupos' => $totalGrupos,
                    'estudiantesSinGrupo' => $estudiantesSinGrupo,
                ],
                'estudiantesRecientes' => $estudiantesRecientes,
            ]);

        } catch (\Exception $e) {
            Log::error('Error al cargar dashboard', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('Secretaria/Dashboard', [
                'stats' => [
                    'totalEstudiantes' => 0,
                    'nuevosEsteMes' => 0,
                    'periodoActual' => 'Error al cargar',
                    'boletines' => 0,
                    'totalGrupos' => 0,
                    'estudiantesSinGrupo' => 0,
                ],
                'estudiantesRecientes' => [],
                'error' => 'No se pudieron cargar las estadísticas del dashboard.',
            ]);
        }
    }
}