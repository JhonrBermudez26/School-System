<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Task;
use App\Models\TaskSubmission;
use Inertia\Inertia;
use Carbon\Carbon;

class EstudianteDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Obtener el grupo actual del estudiante
        $currentGroup = $user->groups()->first();

        if (!$currentGroup) {
            // Si no tiene grupo asignado, mostrar dashboard vacío
            return Inertia::render('Estudiante/Dashboard', [
                'stats' => [
                    'promedio' => 0,
                    'tareasPendientes' => 0,
                    'asistencia' => 0,
                    'materiasInscritas' => 0,
                ],
                'studentInfo' => [
                    'name' => $user->name . ' ' . ($user->last_name ?? ''),
                    'grade' => 'Sin grupo asignado',
                    'period' => 'N/A',
                ],
                'materias' => [],
                'tareasPendientes' => [],
                'proximasEvaluaciones' => [],
            ]);
        }

        // Obtener información del grupo y periodo
        $group = DB::table('groups')
            ->where('groups.id', $currentGroup->id)
            ->first();

        // Obtener nombre del grado (puede ser 'name' o 'nombre')
        $gradeName = 'Sin grado';
        if ($group && property_exists($group, 'grade_id') && $group->grade_id) {
            $grade = DB::table('grades')->where('id', $group->grade_id)->first();
            if ($grade) {
                $gradeName = $grade->nombre ?? $grade->name ?? 'Sin grado';
            }
        }

        // Obtener nombre del periodo (verificar si existe la columna)
        $periodName = 'Sin periodo';
        if ($group) {
            // Intentar obtener el periodo si existe la columna
            if (property_exists($group, 'academic_period_id') && $group->academic_period_id) {
                try {
                    $period = DB::table('academic_periods')->where('id', $group->academic_period_id)->first();
                    if ($period) {
                        $periodName = $period->name ?? $period->nombre ?? 'Sin periodo';
                    }
                } catch (\Exception $e) {
                    // Si no existe la tabla o hay error, mantener 'Sin periodo'
                }
            }
        }

        $groupName = $group->nombre ?? $group->name ?? 'Sin nombre';

        // 1. CALCULAR PROMEDIO GENERAL
        $promedio = $this->calculateAverage($user->id, $currentGroup->id);

        // 2. CONTAR TAREAS PENDIENTES
        $tareasPendientes = $this->countPendingTasks($user->id, $currentGroup->id);

        // 3. CALCULAR ASISTENCIA
        $asistencia = $this->calculateAttendance($user->id, $currentGroup->id);

        // 4. CONTAR MATERIAS INSCRITAS
        $materiasInscritas = DB::table('subject_group')
            ->where('group_id', $currentGroup->id)
            ->distinct()
            ->count('subject_id');

        // 5. OBTENER MATERIAS CON NOTAS
        $materias = $this->getSubjectsWithGrades($user->id, $currentGroup->id);

        // 6. OBTENER TAREAS PENDIENTES (próximas a vencer)
        $tareasPendientesDetalle = $this->getPendingTasksDetail($user->id, $currentGroup->id);

        // 7. OBTENER PRÓXIMAS EVALUACIONES
        $proximasEvaluaciones = $this->getUpcomingEvaluations($user->id, $currentGroup->id);

        return Inertia::render('Estudiante/Dashboard', [
            'stats' => [
                'promedio' => $promedio,
                'tareasPendientes' => $tareasPendientes,
                'asistencia' => $asistencia,
                'materiasInscritas' => $materiasInscritas,
            ],
            'studentInfo' => [
                'name' => $user->name . ' ' . ($user->last_name ?? ''),
                'grade' => $gradeName . ' - ' . $groupName,
                'period' => $periodName,
            ],
            'materias' => $materias,
            'tareasPendientes' => $tareasPendientesDetalle,
            'proximasEvaluaciones' => $proximasEvaluaciones,
        ]);
    }

    /**
     * Calcular promedio general del estudiante
     */
    private function calculateAverage($userId, $groupId)
    {
        // Obtener todas las asignaturas del grupo
        $subjectIds = DB::table('subject_group')
            ->where('group_id', $groupId)
            ->pluck('subject_id');

        if ($subjectIds->isEmpty()) {
            return 0;
        }

        // Verificar si existe la tabla grades
        try {
            // Calcular promedio de todas las materias
            $promedio = DB::table('grades')
                ->where('student_id', $userId)
                ->whereIn('subject_id', $subjectIds)
                ->whereNotNull('score')
                ->avg('score');

            return round($promedio ?? 0, 1);
        } catch (\Exception $e) {
            // Si no existe la tabla o hay error, retornar 0
            return 0;
        }
    }

    /**
     * Contar tareas pendientes de entrega
     */
    private function countPendingTasks($userId, $groupId)
    {
        try {
            // Obtener IDs de tareas del grupo
            $taskIds = DB::table('tasks')
                ->where('group_id', $groupId)
                ->where('is_active', true)
                ->whereNotNull('due_date')
                ->where('due_date', '>=', Carbon::now('America/Bogota')->startOfDay())
                ->pluck('id');

            if ($taskIds->isEmpty()) {
                return 0;
            }

            // Contar las que NO han sido entregadas
            $pending = DB::table('tasks')
                ->whereIn('id', $taskIds)
                ->whereNotExists(function ($query) use ($userId) {
                    $query->select(DB::raw(1))
                        ->from('task_submissions')
                        ->whereColumn('task_submissions.task_id', 'tasks.id')
                        ->where('task_submissions.student_id', $userId)
                        ->whereIn('task_submissions.status', ['submitted', 'graded']);
                })
                ->count();

            return $pending;
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Calcular porcentaje de asistencia
     */
    private function calculateAttendance($userId, $groupId)
    {
        try {
            $total = DB::table('attendances')
                ->where('student_id', $userId)
                ->count();

            if ($total === 0) {
                return 0;
            }

            $present = DB::table('attendances')
                ->where('student_id', $userId)
                ->where('status', 'present')
                ->count();

            return round(($present / $total) * 100);
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Obtener materias con sus promedios
     */
    private function getSubjectsWithGrades($userId, $groupId)
    {
        try {
            $subjects = DB::table('subject_group as sg')
                ->join('subjects as s', 'sg.subject_id', '=', 's.id')
                ->leftJoin('users as u', 'sg.user_id', '=', 'u.id')
                ->where('sg.group_id', $groupId)
                ->select(
                    's.id as subject_id',
                    's.name as subject_name',
                    's.code as subject_code',
                    DB::raw("CONCAT(u.name, ' ', COALESCE(u.last_name, '')) as teacher_name")
                )
                ->groupBy('s.id', 's.name', 's.code', 'u.name', 'u.last_name')
                ->get();

            // Calcular promedio por materia
            return $subjects->map(function ($subject) use ($userId) {
                try {
                    $promedio = DB::table('grades')
                        ->where('student_id', $userId)
                        ->where('subject_id', $subject->subject_id)
                        ->whereNotNull('score')
                        ->avg('score');

                    return [
                        'subject_id' => $subject->subject_id,
                        'subject_name' => $subject->subject_name,
                        'subject_code' => $subject->subject_code,
                        'teacher_name' => $subject->teacher_name ?? 'Sin profesor',
                        'promedio' => round($promedio ?? 0, 1),
                    ];
                } catch (\Exception $e) {
                    return [
                        'subject_id' => $subject->subject_id,
                        'subject_name' => $subject->subject_name,
                        'subject_code' => $subject->subject_code,
                        'teacher_name' => $subject->teacher_name ?? 'Sin profesor',
                        'promedio' => 0,
                    ];
                }
            });
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Obtener detalle de tareas pendientes
     */
    private function getPendingTasksDetail($userId, $groupId)
    {
        try {
            return DB::table('tasks as t')
                ->join('subjects as s', 't.subject_id', '=', 's.id')
                ->leftJoin('users as u', 't.teacher_id', '=', 'u.id')
                ->where('t.group_id', $groupId)
                ->where('t.is_active', true)
                ->whereNotNull('t.due_date')
                ->where('t.due_date', '>=', Carbon::now('America/Bogota')->startOfDay())
                ->whereNotExists(function ($query) use ($userId) {
                    $query->select(DB::raw(1))
                        ->from('task_submissions')
                        ->whereColumn('task_submissions.task_id', 't.id')
                        ->where('task_submissions.student_id', $userId)
                        ->whereIn('task_submissions.status', ['submitted', 'graded']);
                })
                ->select(
                    't.id as task_id',
                    't.title',
                    't.description',
                    't.due_date',
                    't.max_score',
                    's.name as subject_name',
                    's.code as subject_code',
                    DB::raw("CONCAT(u.name, ' ', COALESCE(u.last_name, '')) as teacher_name")
                )
                ->orderBy('t.due_date', 'asc')
                ->limit(5)
                ->get();
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Obtener próximas evaluaciones (tareas con fecha próxima)
     */
    private function getUpcomingEvaluations($userId, $groupId)
    {
        try {
            return DB::table('tasks as t')
                ->join('subjects as s', 't.subject_id', '=', 's.id')
                ->leftJoin('users as u', 't.teacher_id', '=', 'u.id')
                ->where('t.group_id', $groupId)
                ->where('t.is_active', true)
                ->whereNotNull('t.due_date')
                ->where('t.due_date', '>=', Carbon::now('America/Bogota')->startOfDay())
                ->where('t.due_date', '<=', Carbon::now('America/Bogota')->addDays(7))
                ->select(
                    't.id as task_id',
                    't.title',
                    't.due_date',
                    't.max_score',
                    's.name as subject_name',
                    's.code as subject_code',
                    DB::raw("CONCAT(u.name, ' ', COALESCE(u.last_name, '')) as teacher_name")
                )
                ->orderBy('t.due_date', 'asc')
                ->get();
        } catch (\Exception $e) {
            return collect([]);
        }
    }
}