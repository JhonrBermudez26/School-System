<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\AcademicPeriod;
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
                    'period' => 'Sin periodo',
                ],
                'materias' => [],
                'tareasPendientes' => [],
                'proximasEvaluaciones' => [],
            ]);
        }

        // ✅ OBTENER PERIODO ACADÉMICO ACTUAL
        $periodoActual = AcademicPeriod::where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->where('is_active', true)
            ->first();

        $periodName = $periodoActual ? $periodoActual->name : 'Sin periodo activo';

        // Obtener información del grupo
        $group = DB::table('groups')->where('id', $currentGroup->id)->first();

        $gradeName = 'Sin grado';
        if ($group && property_exists($group, 'grade_id') && $group->grade_id) {
            $grade = DB::table('grades')->where('id', $group->grade_id)->first();
            if ($grade) {
                $gradeName = $grade->nombre ?? $grade->name ?? 'Sin grado';
            }
        }

        $groupName = $group->nombre ?? $group->name ?? 'Sin nombre';

        // ✅ CALCULAR ESTADÍSTICAS
        $promedio = $this->calculateAverage($user->id, $currentGroup->id);
        $tareasPendientes = $this->countPendingTasks($user->id, $currentGroup->id);
        $asistencia = $this->calculateAttendance($user->id, $currentGroup->id);
        
        $materiasInscritas = DB::table('subject_group')
            ->where('group_id', $currentGroup->id)
            ->distinct()
            ->count('subject_id');

        // ✅ DATOS DETALLADOS
        $materias = $this->getSubjectsWithGrades($user->id, $currentGroup->id);
        $tareasPendientesDetalle = $this->getPendingTasksDetail($user->id, $currentGroup->id);
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
     * ✅ CALCULAR PROMEDIO GENERAL - IGUAL QUE EL PROFESOR
     * Suma todas las notas (tareas + manuales) y divide por cantidad
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

        $totalScore = 0;
        $gradeCount = 0;

        foreach ($subjectIds as $subjectId) {
            // 1️⃣ Calificaciones de TAREAS calificadas
            $taskScores = DB::table('task_submissions as ts')
                ->join('tasks as t', 'ts.task_id', '=', 't.id')
                ->where('ts.student_id', $userId)
                ->where('t.subject_id', $subjectId)
                ->where('t.group_id', $groupId)
                ->where('ts.status', 'graded')
                ->whereNotNull('ts.score')
                ->pluck('ts.score');

            foreach ($taskScores as $score) {
                $totalScore += (float) $score;
                $gradeCount++;
            }

            // 2️⃣ Calificaciones MANUALES
            $manualScores = DB::table('manual_grade_scores as mgs')
                ->join('manual_grades as mg', 'mgs.manual_grade_id', '=', 'mg.id')
                ->where('mgs.student_id', $userId)
                ->where('mg.subject_id', $subjectId)
                ->where('mg.group_id', $groupId)
                ->whereNotNull('mgs.score')
                ->pluck('mgs.score');

            foreach ($manualScores as $score) {
                $totalScore += (float) $score;
                $gradeCount++;
            }
        }

        // ✅ Promedio simple: suma total / cantidad de notas
        return $gradeCount > 0 ? round($totalScore / $gradeCount, 1) : 0;
    }

    /**
     * ✅ OBTENER MATERIAS CON PROMEDIO - IGUAL QUE EL PROFESOR
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

            return $subjects->map(function ($subject) use ($userId, $groupId) {
                $totalScore = 0;
                $gradeCount = 0;

                // 1️⃣ Calificaciones de TAREAS
                $taskScores = DB::table('task_submissions as ts')
                    ->join('tasks as t', 'ts.task_id', '=', 't.id')
                    ->where('ts.student_id', $userId)
                    ->where('t.subject_id', $subject->subject_id)
                    ->where('t.group_id', $groupId)
                    ->where('ts.status', 'graded')
                    ->whereNotNull('ts.score')
                    ->pluck('ts.score');

                foreach ($taskScores as $score) {
                    $totalScore += (float) $score;
                    $gradeCount++;
                }

                // 2️⃣ Calificaciones MANUALES
                $manualScores = DB::table('manual_grade_scores as mgs')
                    ->join('manual_grades as mg', 'mgs.manual_grade_id', '=', 'mg.id')
                    ->where('mgs.student_id', $userId)
                    ->where('mg.subject_id', $subject->subject_id)
                    ->where('mg.group_id', $groupId)
                    ->whereNotNull('mgs.score')
                    ->pluck('mgs.score');

                foreach ($manualScores as $score) {
                    $totalScore += (float) $score;
                    $gradeCount++;
                }

                // ✅ Promedio de la materia
                $promedio = $gradeCount > 0 ? round($totalScore / $gradeCount, 1) : 0;

                return [
                    'subject_id' => $subject->subject_id,
                    'subject_name' => $subject->subject_name,
                    'subject_code' => $subject->subject_code,
                    'teacher_name' => $subject->teacher_name ?? 'Sin profesor',
                    'promedio' => $promedio,
                ];
            });
        } catch (\Exception $e) {
            return collect([]);
        }
    }

    /**
     * Contar tareas pendientes
     */
    private function countPendingTasks($userId, $groupId)
    {
        try {
            $taskIds = DB::table('tasks')
                ->where('group_id', $groupId)
                ->where('is_active', true)
                ->whereNotNull('due_date')
                ->where('due_date', '>=', Carbon::now('America/Bogota')->startOfDay())
                ->pluck('id');

            if ($taskIds->isEmpty()) {
                return 0;
            }

            return DB::table('tasks')
                ->whereIn('id', $taskIds)
                ->whereNotExists(function ($query) use ($userId) {
                    $query->select(DB::raw(1))
                        ->from('task_submissions')
                        ->whereColumn('task_submissions.task_id', 'tasks.id')
                        ->where('task_submissions.student_id', $userId)
                        ->whereIn('task_submissions.status', ['submitted', 'graded']);
                })
                ->count();
        } catch (\Exception $e) {
            return 0;
        }
    }

    /**
     * Calcular asistencia
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
     * Tareas pendientes con detalle
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
     * Próximas evaluaciones
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