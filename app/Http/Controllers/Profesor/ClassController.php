<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Models\Post;
use App\Models\Folder;
use App\Models\ClassFile;
use App\Models\Meeting;
use App\Models\Task;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $user = Auth::user();
        
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

        return Inertia::render('Profesor/Clases/Index', [
            'asignaciones' => $asignaciones,
        ]);
    }

    public function show(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
        ]);

        $user = Auth::user();
        $subjectId = (int) $request->query('subject_id');
        $groupId = (int) $request->query('group_id');

        // Obtener información de la clase
        $class = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->where('sg.user_id', $user->id)
            ->where('sg.subject_id', $subjectId)
            ->where('sg.group_id', $groupId)
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'g.id as group_id',
                'g.nombre as group_name'
            )
            ->first();

        if (!$class) {
            abort(404, 'Clase no encontrada');
        }

        // Contar estudiantes
        $studentsCount = DB::table('group_user as gu')
            ->join('model_has_roles as mhr', function ($join) {
                $join->on('gu.user_id', '=', 'mhr.model_id')
                    ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles as r', 'mhr.role_id', '=', 'r.id')
            ->where('gu.group_id', $groupId)
            ->where('r.name', 'estudiante')
            ->distinct()
            ->count('gu.user_id');

        // Publicaciones
        $publicaciones = Post::with('attachments')
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->orderByDesc('created_at')
            ->get();

        // Carpetas con conteo de archivos
        $folders = Folder::where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->withCount('files')
            ->orderBy('name')
            ->get();

        // Archivos
        $files = ClassFile::where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->orderByDesc('created_at')
            ->get();

        // Reunión activa
        $meeting = Meeting::where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->where('is_active', true)
            ->first();

        // ✅ NUEVO: Tareas
        $tasks = Task::with('attachments')
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->where('teacher_id', $user->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($task) use ($groupId) {
                // Contar estudiantes del grupo para las estadísticas
                $totalStudents = DB::table('group_user as gu')
                    ->join('model_has_roles as mhr', function ($join) {
                        $join->on('gu.user_id', '=', 'mhr.model_id')
                            ->where('mhr.model_type', '=', 'App\\Models\\User');
                    })
                    ->join('roles as r', 'mhr.role_id', '=', 'r.id')
                    ->where('gu.group_id', $groupId)
                    ->where('r.name', 'estudiante')
                    ->distinct()
                    ->count('gu.user_id');

                $submitted = $task->submissions()
                    ->where('status', '!=', 'pending')
                    ->count();

                $graded = $task->submissions()
                    ->where('status', 'graded')
                    ->count();

                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'work_type' => $task->work_type,
                    'max_group_members' => $task->max_group_members,
                    'due_date' => $task->due_date,
                    'close_date' => $task->close_date,
                    'allow_late_submission' => $task->allow_late_submission,
                    'max_score' => $task->max_score,
                    'is_active' => $task->is_active,
                    'is_past_due' => $task->isPastDue(),
                    'is_closed' => $task->isClosed(),
                    'attachments' => $task->attachments,
                    'stats' => [
                        'total' => $totalStudents,
                        'submitted' => $submitted,
                        'graded' => $graded,
                        'pending' => $totalStudents - $submitted,
                    ],
                    'created_at' => $task->created_at,
                ];
            });

        return Inertia::render('Profesor/Clases/Show', [
            'classInfo' => $class,
            'studentsCount' => $studentsCount,
            'publicaciones' => $publicaciones,
            'folders' => $folders,
            'files' => $files,
            'meeting' => $meeting,
            'tasks' => $tasks,
        ]);
    }
}