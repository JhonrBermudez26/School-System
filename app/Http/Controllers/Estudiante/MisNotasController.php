<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskSubmission;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MisNotasController extends Controller
{
    /**
     * Mostrar las notas del estudiante autenticado
     */
    public function index()
    {
        $student = Auth::user();
        
        // Obtener todos los grupos del estudiante
        $groups = DB::table('group_user')
            ->where('user_id', $student->id)
            ->pluck('group_id');
        
        if ($groups->isEmpty()) {
            return Inertia::render('Estudiante/Notas', [
                'materias' => [],
                'promedioGeneral' => 0,
                'estadisticas' => [
                    'total_materias' => 0,
                    'total_evaluaciones' => 0,
                    'evaluaciones_calificadas' => 0,
                    'evaluaciones_pendientes' => 0,
                ],
            ]);
        }
        
        // Obtener todas las asignaciones del estudiante (materias por grupo)
        $asignaciones = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->whereIn('sg.group_id', $groups)
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'sg.group_id',
                'g.nombre as group_name'
            )
            ->orderBy('s.name')
            ->get();
        
        $materias = [];
        $totalEvaluacionesCalificadas = 0;
        $totalEvaluacionesPendientes = 0;
        $sumaPromedios = 0;
        $countMaterias = 0;
        
        foreach ($asignaciones as $asignacion) {
            $subjectId = $asignacion->subject_id;
            $groupId = $asignacion->group_id;
            
            // ===== NOTAS DE TAREAS =====
            $tasksNotas = TaskSubmission::with('task')
                ->whereHas('task', function ($query) use ($subjectId, $groupId) {
                    $query->where('subject_id', $subjectId)
                          ->where('group_id', $groupId);
                })
                ->where('student_id', $student->id)
                ->get()
                ->map(function ($submission) {
                    return [
                        'id' => $submission->id,
                        'nombre' => $submission->task->title,
                        'valor' => $submission->score ? (float) $submission->score : null,
                        'max_score' => (float) $submission->task->max_score,
                        'porcentaje' => 100, // Las tareas no tienen porcentaje definido
                        'fecha' => $submission->graded_at ?? $submission->task->due_date,
                        'tipo' => 'Tarea',
                        'estado' => $submission->status,
                        'feedback' => $submission->teacher_feedback,
                    ];
                });
            
            // ===== NOTAS MANUALES =====
            $manualNotas = DB::table('manual_grade_scores as mgs')
                ->join('manual_grades as mg', 'mgs.manual_grade_id', '=', 'mg.id')
                ->where('mg.subject_id', $subjectId)
                ->where('mg.group_id', $groupId)
                ->where('mgs.student_id', $student->id)
                ->select(
                    'mgs.id',
                    'mg.title as nombre',
                    'mgs.score as valor',
                    'mg.max_score',
                    'mg.weight as porcentaje',
                    'mg.grade_date as fecha',
                    'mgs.feedback'
                )
                ->get()
                ->map(function ($grade) {
                    return [
                        'id' => $grade->id,
                        'nombre' => $grade->nombre,
                        'valor' => $grade->valor ? (float) $grade->valor : null,
                        'max_score' => (float) $grade->max_score,
                        'porcentaje' => (float) ($grade->porcentaje ?? 100),
                        'fecha' => $grade->fecha,
                        'tipo' => 'Evaluación Manual',
                        'estado' => $grade->valor !== null ? 'graded' : 'pending',
                        'feedback' => $grade->feedback,
                    ];
                });
            
            // Combinar todas las notas
            $todasNotas = $tasksNotas->concat($manualNotas)->sortByDesc('fecha')->values()->all();
            
            // Calcular promedio de la materia
            $notasCalificadas = collect($todasNotas)->filter(fn($n) => $n['valor'] !== null);
            $promedio = 0;
            
            if ($notasCalificadas->count() > 0) {
                // Promedio simple (todas las evaluaciones pesan igual)
                $promedio = round($notasCalificadas->avg('valor'), 2);
                $sumaPromedios += $promedio;
                $countMaterias++;
            }
            
            // Estadísticas de esta materia
            $calificadas = $notasCalificadas->count();
            $pendientes = collect($todasNotas)->filter(fn($n) => $n['valor'] === null)->count();
            
            $totalEvaluacionesCalificadas += $calificadas;
            $totalEvaluacionesPendientes += $pendientes;
            
            $materias[] = [
                'id' => $subjectId . '_' . $groupId,
                'subject_id' => $subjectId,
                'group_id' => $groupId,
                'name' => $asignacion->subject_name,
                'code' => $asignacion->subject_code,
                'group_name' => $asignacion->group_name,
                'notas' => $todasNotas,
                'promedio' => $promedio,
                'stats' => [
                    'total' => count($todasNotas),
                    'calificadas' => $calificadas,
                    'pendientes' => $pendientes,
                ],
            ];
        }
        
        // Calcular promedio general (todas las materias con todas sus notas)
        $promedioGeneral = $countMaterias > 0 ? round($sumaPromedios / $countMaterias, 2) : 0;
        
        // Obtener periodo académico actual (grades_enabled = true)
        $periodoActual = DB::table('academic_periods')
            ->where('grades_enabled', true)
            ->first();
        
        // Calcular promedio del periodo actual (solo notas del periodo habilitado)
        $promedioDelPeriodo = 0;
        if ($periodoActual) {
            // Filtrar materias que tienen evaluaciones en el periodo actual
            $materiasDelPeriodo = collect($materias)->map(function($materia) use ($periodoActual) {
                // Obtener solo las notas dentro del rango del periodo
                $notasDelPeriodo = collect($materia['notas'])->filter(function($nota) use ($periodoActual) {
                    if (!$nota['fecha']) return false;
                    $fechaNota = \Carbon\Carbon::parse($nota['fecha']);
                    $inicioP = \Carbon\Carbon::parse($periodoActual->start_date);
                    $finP = \Carbon\Carbon::parse($periodoActual->end_date);
                    return $fechaNota->between($inicioP, $finP) && $nota['valor'] !== null;
                });
                
                // Calcular promedio solo con notas del periodo
                $promedioPeriodo = 0;
                if ($notasDelPeriodo->count() > 0) {
                    $promedioPeriodo = round($notasDelPeriodo->avg('valor'), 2);
                }
                
                return [
                    'promedio_periodo' => $promedioPeriodo,
                    'tiene_notas' => $notasDelPeriodo->count() > 0
                ];
            })->filter(fn($m) => $m['tiene_notas'] && $m['promedio_periodo'] > 0);
            
            if ($materiasDelPeriodo->count() > 0) {
                $promedioDelPeriodo = round($materiasDelPeriodo->avg('promedio_periodo'), 2);
            }
        }
        
        // Calcular asignaturas aprobadas y reprobadas
        // Consideramos aprobada una materia con promedio >= 3.0
        $materiasAprobadas = collect($materias)->filter(fn($m) => $m['promedio'] >= 3.0)->count();
        $materiasReprobadas = collect($materias)->filter(fn($m) => $m['promedio'] > 0 && $m['promedio'] < 3.0)->count();
        $materiasSinCalificar = collect($materias)->filter(fn($m) => $m['promedio'] == 0)->count();
        
        return Inertia::render('Estudiante/Notas', [
            'materias' => $materias,
            'promedioGeneral' => $promedioGeneral,
            'promedioDelPeriodo' => $promedioDelPeriodo,
            'periodoActual' => $periodoActual ? [
                'nombre' => $periodoActual->name,
                'inicio' => $periodoActual->start_date,
                'fin' => $periodoActual->end_date,
            ] : null,
            'estadisticas' => [
                'total_asignaturas' => count($materias),
                'asignaturas_aprobadas' => $materiasAprobadas,
                'asignaturas_reprobadas' => $materiasReprobadas,
                'asignaturas_sin_calificar' => $materiasSinCalificar,
                'total_evaluaciones' => $totalEvaluacionesCalificadas + $totalEvaluacionesPendientes,
                'evaluaciones_calificadas' => $totalEvaluacionesCalificadas,
                'evaluaciones_pendientes' => $totalEvaluacionesPendientes,
            ],
        ]);
    }
}