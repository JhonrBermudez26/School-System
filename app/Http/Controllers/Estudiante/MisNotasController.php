<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\AcademicPeriod;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MisNotasController extends Controller
{
    /**
     * ✅ Mostrar notas con filtro por periodo
     */
    public function index(Request $request)
{
    $student = Auth::user();

    $groups = DB::table('group_user')
        ->where('user_id', $student->id)
        ->pluck('group_id');

    if ($groups->isEmpty()) {
        return $this->emptyResponse();
    }

    // Periodo seleccionado
    $periodoId = $request->query('period_id');
    $periodoActual = $periodoId
        ? AcademicPeriod::find($periodoId)
        : AcademicPeriod::getPeriodoActual();

    // Todos los periodos
    $periodos = AcademicPeriod::ordenado()->get()->map(fn ($p) => [
        'id' => $p->id,
        'nombre' => $p->name,
        'inicio' => $p->start_date->format('Y-m-d'),
        'fin' => $p->end_date->format('Y-m-d'),
        'estado' => $p->getEstadoAttribute(),
        'es_actual' => $p->isDentroFecha(),
        'porcentaje' => $p->grade_weight,
    ]);

    // Asignaciones
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

    // 👉 aquí guardamos los promedios de asignaturas del periodo
    $promediosPeriodo = [];

    foreach ($asignaciones as $asignacion) {

        $subjectId = $asignacion->subject_id;
        $groupId   = $asignacion->group_id;

        /** =========================
         *  TAREAS
         *  ========================= */
        $tasksQuery = TaskSubmission::with('task')
            ->whereHas('task', fn ($q) =>
                $q->where('subject_id', $subjectId)
                  ->where('group_id', $groupId)
            )
            ->where('student_id', $student->id);

        if ($periodoId) {
            $tasksQuery->whereHas('task', fn ($q) =>
                $q->where('academic_period_id', $periodoId)
            );
        }

        $tasksNotas = $tasksQuery->get()->map(fn ($s) => [
            'id' => $s->id,
            'nombre' => $s->task->title,
            'valor' => $s->score ? (float) $s->score : null,
            'max_score' => (float) $s->task->max_score,
            'porcentaje' => 100,
            'fecha' => $s->graded_at ?? $s->task->due_date,
            'tipo' => 'Tarea',
            'estado' => $s->status,
            'feedback' => $s->teacher_feedback,
            'academic_period_id' => $s->task->academic_period_id,
        ]);

        /** =========================
         *  NOTAS MANUALES
         *  ========================= */
        $manualQuery = DB::table('manual_grade_scores as mgs')
            ->join('manual_grades as mg', 'mgs.manual_grade_id', '=', 'mg.id')
            ->where('mg.subject_id', $subjectId)
            ->where('mg.group_id', $groupId)
            ->where('mgs.student_id', $student->id);

        if ($periodoId) {
            $manualQuery->where('mg.academic_period_id', $periodoId);
        }

        $manualNotas = $manualQuery->select(
            'mgs.id',
            'mg.title as nombre',
            'mgs.score as valor',
            'mg.max_score',
            'mg.weight as porcentaje',
            'mg.grade_date as fecha',
            'mgs.feedback',
            'mg.academic_period_id'
        )->get()->map(fn ($g) => [
            'id' => $g->id,
            'nombre' => $g->nombre,
            'valor' => $g->valor ? (float) $g->valor : null,
            'max_score' => (float) $g->max_score,
            'porcentaje' => (float) ($g->porcentaje ?? 100),
            'fecha' => $g->fecha,
            'tipo' => 'Evaluación Manual',
            'estado' => $g->valor !== null ? 'graded' : 'pending',
            'feedback' => $g->feedback,
            'academic_period_id' => $g->academic_period_id,
        ]);

        /** =========================
         *  UNIFICAR NOTAS
         *  ========================= */
        $todasNotas = $tasksNotas->concat($manualNotas)
            ->sortByDesc('fecha')
            ->values()
            ->all();

        $notasPorPeriodo = $this->calcularNotasPorPeriodo($todasNotas);

        /** =========================
         *  PROMEDIO DE LA MATERIA
         *  ========================= */
        $promedio = 0;

        if ($periodoId) {
            $dataPeriodo = collect($notasPorPeriodo)
                ->firstWhere('periodo_id', $periodoId);

            $promedio = $dataPeriodo['promedio'] ?? 0;
        } else {
            $periodosConNota = collect($notasPorPeriodo)
                ->filter(fn ($p) => $p['promedio'] > 0);

            if ($periodosConNota->count() > 0) {
                $promedio = round($periodosConNota->avg('promedio'), 2);
            }
        }

        if ($promedio > 0) {
            $promediosPeriodo[] = $promedio;
        }

        $calificadas = collect($todasNotas)->whereNotNull('valor')->count();
        $pendientes  = collect($todasNotas)->whereNull('valor')->count();

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
            'notas_por_periodo' => $notasPorPeriodo,
            'promedio' => $promedio,
            'stats' => [
                'total' => count($todasNotas),
                'calificadas' => $calificadas,
                'pendientes' => $pendientes,
            ],
        ];
    }

    /** =========================
     *  PROMEDIO GENERAL
     *  ========================= */
    $promedioGeneral = 0;

    if (count($promediosPeriodo) > 0) {
        $promedioGeneral = round(
            array_sum($promediosPeriodo) / count($promediosPeriodo),
            2
        );
    }

    return Inertia::render('Estudiante/Notas', [
        'materias' => $materias,
        'promedioGeneral' => $promedioGeneral,
        'periodos' => $periodos,
        'periodoActual' => $periodoActual ? [
            'id' => $periodoActual->id,
            'nombre' => $periodoActual->name,
            'inicio' => $periodoActual->start_date->format('Y-m-d'),
            'fin' => $periodoActual->end_date->format('Y-m-d'),
            'porcentaje' => $periodoActual->grade_weight,
            'habilitado' => $periodoActual->grades_enabled,
        ] : null,
        'estadisticas' => [
            'total_asignaturas' => count($materias),
            'asignaturas_aprobadas' => collect($materias)->where('promedio', '>=', 3)->count(),
            'asignaturas_reprobadas' => collect($materias)->whereBetween('promedio', [0.01, 2.99])->count(),
            'asignaturas_sin_calificar' => collect($materias)->where('promedio', 0)->count(),
            'total_evaluaciones' => $totalEvaluacionesCalificadas + $totalEvaluacionesPendientes,
            'evaluaciones_calificadas' => $totalEvaluacionesCalificadas,
            'evaluaciones_pendientes' => $totalEvaluacionesPendientes,
        ],
        'can' => [
            'view_bulletins' => $student->can('bulletins.view'),
            'download_bulletins' => $student->can('bulletins.download'),
        ]
    ]);
}
   
    private function calcularNotasPorPeriodo($todasNotas)
{
    $periodos = AcademicPeriod::ordenado()->get();
    $resultado = [];

    foreach ($periodos as $periodo) {

        $notasPeriodo = collect($todasNotas)
            ->filter(fn ($n) => $n['academic_period_id'] == $periodo->id)
            ->filter(fn ($n) => $n['valor'] !== null && $n['max_score'] > 0);

        $sumaPonderada = 0;
        $pesoTotal = 0;

        foreach ($notasPeriodo as $nota) {

            // Normalizar a escala 0–5
            $notaNormalizada = ($nota['valor'] / $nota['max_score']) * 5;

            $peso = $nota['porcentaje'] ?? 100;

            $sumaPonderada += $notaNormalizada * ($peso / 100);
            $pesoTotal += $peso;
        }

        $promedio = $pesoTotal > 0
            ? round($sumaPonderada / ($pesoTotal / 100), 2)
            : 0;

        $resultado[] = [
            'periodo_id' => $periodo->id,
            'periodo_nombre' => $periodo->name,
            'peso' => $periodo->grade_weight ?? 0,
            'promedio' => $promedio,
            'cantidad_notas' => $notasPeriodo->count(),
            'cantidad_calificadas' => $notasPeriodo->count(),
            'estado' => $periodo->getEstadoAttribute(),
        ];
    }

    return $resultado;
}

    
    private function emptyResponse()
    {
        return Inertia::render('Estudiante/Notas', [
            'materias' => [],
            'promedioGeneral' => 0,
            'periodos' => [],
            'periodoActual' => null,
            'estadisticas' => [
                'total_asignaturas' => 0,
                'asignaturas_aprobadas' => 0,
                'asignaturas_reprobadas' => 0,
                'asignaturas_sin_calificar' => 0,
                'total_evaluaciones' => 0,
                'evaluaciones_calificadas' => 0,
                'evaluaciones_pendientes' => 0,
            ],
        ]);
    }
}