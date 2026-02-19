<?php
namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\Post;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\Meeting;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate; 

class EstudianteClasesController extends Controller
{
    /**
     * Mostrar lista de clases del estudiante
     */
    public function index()
    {
        $user = Auth::user();
        
        // Obtener el grupo actual del estudiante
        $currentGroup = $user->groups()->first();
        
        if (!$currentGroup) {
            return Inertia::render('Estudiante/Clases/Index', [
                'asignaciones' => [],
            ]);
        }
        
        // Obtener asignaturas del grupo con información del profesor
        $asignaciones = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->leftJoin('users as u', 'sg.user_id', '=', 'u.id')
            ->where('sg.group_id', $currentGroup->id)
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'g.id as group_id',
                'g.nombre as group_name',
                DB::raw("CONCAT(u.name, ' ', COALESCE(u.last_name, '')) as teacher_name")
            )
            ->orderBy('s.name')
            ->get();
        
        return Inertia::render('Estudiante/Clases/Index', [
            'asignaciones' => $asignaciones,
            'can' => [
                'view_assignments' => $user->can('assignments.view'),
                'view_posts' => $user->can('posts.view'),
            ]
        ]);
    }
    
    /**
     * Mostrar detalle de una clase específica
     */
    public function show($subject_id, $group_id)
    {
        $user = Auth::user();
        
        Gate::authorize('access-class', [(int)$subject_id, (int)$group_id]);
        
        // Información de la clase
        $classInfo = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->leftJoin('users as u', 'sg.user_id', '=', 'u.id')
            ->where('sg.subject_id', $subject_id)
            ->where('sg.group_id', $group_id)
            ->select(
                's.id as subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'g.id as group_id',
                'g.nombre as group_name',
                DB::raw("CONCAT(u.name, ' ', COALESCE(u.last_name, '')) as teacher_name")
            )
            ->first();
        
        if (!$classInfo) {
            abort(404, 'Clase no encontrada');
        }
        
        // Publicaciones con información del autor
        $publicaciones = Post::with(['attachments', 'user.roles'])
            ->where('subject_id', $subject_id)
            ->where('group_id', $group_id)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($post) {
                // Obtener el rol del usuario
                $userRole = $post->user->roles->first();
                $roleName = $userRole ? $userRole->name : 'usuario';
                
                return [
                    'id' => $post->id,
                    'type' => $post->type,
                    'title' => $post->title,
                    'content' => $post->content,
                    'created_at' => $post->created_at,
                    'user_id' => $post->user_id,
                    'author_name' => $post->user->name . ' ' . ($post->user->last_name ?? ''),
                    'author_photo' => $post->user->photo
                        ? asset('storage/' . $post->user->photo)
                        : null,
                    'author_role' => $roleName,
                    'is_owner' => $post->user_id === auth()->id(),
                    'can' => [
                        'update' => auth()->user()->can('update', $post),
                        'delete' => auth()->user()->can('delete', $post),
                    ],
                    'attachments' => $post->attachments->map(function ($att) {
                        return [
                            'id' => $att->id,
                            'type' => $att->type,
                            'filename' => $att->filename,
                            'path' => $att->path,
                            'url' => $att->url,
                            'created_at' => $att->created_at,
                        ];
                    }),
                ];
            });
        
        // Tareas
        $tasks = Task::where('subject_id', $subject_id)
            ->where('group_id', $group_id)
            ->where('is_active', true)
            ->with('attachments')
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($task) use ($user) {
                // Obtener la entrega del estudiante
                $submission = TaskSubmission::where('task_id', $task->id)
                    ->where('student_id', $user->id)
                    ->first();
                
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'work_type' => $task->work_type,
                    'due_date' => $task->due_date,
                    'close_date' => $task->close_date,
                    'max_score' => $task->max_score,
                    'is_active' => $task->is_active,
                    'is_closed' => $task->close_date && $task->close_date < now(),
                    'is_past_due' => $task->due_date && $task->due_date < now(),
                    'attachments' => $task->attachments,
                    'submission' => $submission ? [
                        'id' => $submission->id,
                        'status' => $submission->status,
                        'content' => $submission->content,
                        'score' => $submission->score,
                        'feedback' => $submission->feedback,
                        'submitted_at' => $submission->submitted_at,
                        'graded_at' => $submission->graded_at,
                        'attachments' => $submission->attachments,
                    ] : null,
                    'can' => [
                        'view' => auth()->user()->can('view', $task),
                        'submit' => auth()->user()->can('submit', $task),
                    ],
                ];
            });
        
        // Carpetas y archivos
        $folders = DB::table('folders')
            ->where('subject_id', $subject_id)
            ->where('group_id', $group_id)
            ->select('id', 'name', 'description', 'parent_id')
            ->orderBy('name')
            ->get()
            ->map(function ($folder) use ($subject_id, $group_id) {
                $filesCount = DB::table('class_files')
                    ->where('subject_id', $subject_id)
                    ->where('group_id', $group_id)
                    ->where('folder_id', $folder->id)
                    ->count();
                
                return [
                    'id' => $folder->id,
                    'name' => $folder->name,
                    'description' => $folder->description,
                    'parent_id' => $folder->parent_id,
                    'files_count' => $filesCount,
                ];
            });
        
        $files = DB::table('class_files')
            ->where('subject_id', $subject_id)
            ->where('group_id', $group_id)
            ->select('id', 'filename', 'path', 'size', 'folder_id', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get();
        
        // Reunión activa
        $meeting = Meeting::where('subject_id', $subject_id)
            ->where('group_id', $group_id)
            ->where('is_active', true)
            ->select('id', 'room_name', 'url', 'created_at')
            ->first();
        
        return Inertia::render('Estudiante/Clases/Show', [
            'classInfo' => $classInfo,
            'publicaciones' => $publicaciones,
            'tasks' => $tasks,
            'folders' => $folders,
            'files' => $files,
            'meeting' => $meeting,
            'can' => [
                'submit_assignments' => $user->can('assignments.submit'),
                'view_posts' => $user->can('posts.view'),
                'create_post' => $user->can('posts.create'),
                'join_meetings' => $user->can('meetings.join'),
            ]
        ]);
    }
}