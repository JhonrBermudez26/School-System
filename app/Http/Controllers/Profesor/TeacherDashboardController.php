<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Task;
use App\Models\TaskSubmission;
use Inertia\Inertia;
use Carbon\Carbon;

class TeacherDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Total de materias únicas asignadas al profesor
        $misMaterias = DB::table('subject_group as sg')
            ->where('user_id', $user->id)
            ->distinct()
            ->count('subject_id');

        // Total de estudiantes únicos en todos los grupos donde dicta clase
        $totalEstudiantes = DB::table('subject_group as sg')
            ->join('group_user as gu', 'sg.group_id', '=', 'gu.group_id')
            ->join('model_has_roles as mhr', function ($join) {
                $join->on('gu.user_id', '=', 'mhr.model_id')
                    ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles as r', 'mhr.role_id', '=', 'r.id')
            ->where('r.name', 'estudiante')
            ->where('sg.user_id', $user->id)
            ->distinct()
            ->count('gu.user_id');

        // Tareas activas (tareas que no han cerrado aún)
        $tareasActivas = Task::where('teacher_id', $user->id)
            ->where('is_active', true)
            ->where(function ($query) {
                $query->whereNull('close_date')
                    ->orWhere('close_date', '>=', Carbon::now('America/Bogota'));
            })
            ->count();

        // Entregas por calificar (entregas enviadas pero no calificadas)
        $porCalificar = TaskSubmission::whereHas('task', function ($query) use ($user) {
                $query->where('teacher_id', $user->id);
            })
            ->where('status', 'submitted')
            ->count();

        // Listado de asignaciones (asignatura-grupo) con conteo de estudiantes por grupo
        $asignaciones = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->leftJoin('group_user as gu', 'g.id', '=', 'gu.group_id')
            ->leftJoin('model_has_roles as mhr', function ($join) {
                $join->on('gu.user_id', '=', 'mhr.model_id')
                    ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->leftJoin('roles as r', 'mhr.role_id', '=', 'r.id')
            ->where('sg.user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('r.name')->orWhere('r.name', 'estudiante');
            })
            ->groupBy('sg.subject_id', 's.name', 's.code', 'g.id', 'g.nombre')
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'g.id as group_id',
                'g.nombre as group_name',
                DB::raw('COUNT(CASE WHEN r.name = "estudiante" THEN gu.user_id END) as students_count')
            )
            ->orderBy('s.name')
            ->orderBy('g.nombre')
            ->get();

        // Tareas próximas a vencer (próximas 7 días)
        $proximasTareas = Task::where('teacher_id', $user->id)
            ->where('is_active', true)
            ->whereNotNull('due_date')
            ->where('due_date', '>=', Carbon::now('America/Bogota')->startOfDay())
            ->where('due_date', '<=', Carbon::now('America/Bogota')->addDays(7))
            ->with(['subject:id,name', 'group:id,nombre'])
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($task) {
                // Obtener total de estudiantes del grupo
                $totalStudents = DB::table('group_user as gu')
                    ->join('model_has_roles as mhr', function ($join) {
                        $join->on('gu.user_id', '=', 'mhr.model_id')
                            ->where('mhr.model_type', '=', 'App\\Models\\User');
                    })
                    ->join('roles as r', 'mhr.role_id', '=', 'r.id')
                    ->where('gu.group_id', $task->group_id)
                    ->where('r.name', 'estudiante')
                    ->distinct()
                    ->count('gu.user_id');

                // Contar entregas realizadas
                $submittedCount = TaskSubmission::where('task_id', $task->id)
                    ->where('status', '!=', 'pending')
                    ->count();

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'subject_id' => $task->subject_id,
                    'group_id' => $task->group_id,
                    'subject_name' => $task->subject->name ?? 'Sin materia',
                    'group_name' => $task->group->nombre ?? 'Sin grupo',
                    'due_date' => $task->due_date,
                    'total_students' => $totalStudents,
                    'submitted_count' => $submittedCount,
                ];
            });

        return Inertia::render('Profesor/Dashboard', [
            'stats' => [
                'misMaterias' => $misMaterias,
                'totalEstudiantes' => $totalEstudiantes,
                'tareasActivas' => $tareasActivas,
                'porCalificar' => $porCalificar,
            ],
            'asignaciones' => $asignaciones,
            'proximasTareas' => $proximasTareas,
            'can' => [
                'view_schedules' => $user->can('schedules.view'),
                'view_attendance' => $user->can('attendances.view'),
                'view_grades' => $user->can('grades.view'),
                'view_bulletins' => $user->can('bulletins.view'),
            ]
        ]);
    }
}