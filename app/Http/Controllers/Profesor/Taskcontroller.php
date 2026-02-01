<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class TaskController extends Controller
{
    /**
     * Verificar que el profesor tiene acceso a este grupo y asignatura
     */
    private function assertOwnership(int $subjectId, int $groupId): void
    {
        $userId = Auth::id();
        $exists = DB::table('subject_group')
            ->where('user_id', $userId)
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->exists();

        abort_unless($exists, 403, 'No tienes acceso a esta clase');
    }

    /**
     * Obtener tareas de un grupo
     */
    public function index(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
        ]);

        $subjectId = (int) $request->query('subject_id');
        $groupId = (int) $request->query('group_id');

        // Verificar acceso
        $this->assertOwnership($subjectId, $groupId);

        // Obtener total de estudiantes del grupo
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

        $tasks = Task::with(['attachments', 'submissions.student'])
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->where('teacher_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($task) use ($totalStudents) {
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

        return response()->json($tasks);
    }

    /**
     * Crear nueva tarea
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'work_type' => 'required|in:individual,pairs,group',
            'max_group_members' => 'nullable|integer|min:2|max:10',
            'due_date' => 'required|date|after_or_equal:today',
            'close_date' => 'nullable|date|after:due_date',
            'allow_late_submission' => 'nullable|boolean',
            'max_score' => 'required|integer|min:1|max:1000',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240', // 10MB
        ], [
            'close_date.after' => 'La fecha de cierre debe ser posterior a la fecha de entrega',
            'due_date.after_or_equal' => 'La fecha de entrega debe ser hoy o en el futuro',
        ]);

        $this->assertOwnership((int) $validated['subject_id'], (int) $validated['group_id']);

        try {
            DB::beginTransaction();

            $task = Task::create([
                'subject_id' => $validated['subject_id'],
                'group_id' => $validated['group_id'],
                'teacher_id' => auth()->id(),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'work_type' => $validated['work_type'],
                'max_group_members' => $validated['work_type'] === 'group' 
                    ? ($validated['max_group_members'] ?? 3) 
                    : null,
                'due_date' => $validated['due_date']
                    ? Carbon::parse($validated['due_date'])->setTimezone('America/Bogota')
                    : null,
                'close_date' => !empty($validated['close_date'])
                    ? Carbon::parse($validated['close_date'])->setTimezone('America/Bogota')
                    : null,
                'allow_late_submission' => $validated['allow_late_submission'] ?? true,
                'max_score' => $validated['max_score'],
            ]);

            // Creación automática de entregas "PENDIENTE" para cada estudiante
            $students = DB::table('group_user as gu')
                ->join('model_has_roles as mhr', function ($join) {
                    $join->on('gu.user_id', '=', 'mhr.model_id')
                        ->where('mhr.model_type', '=', 'App\\Models\\User');
                })
                ->join('roles as r', 'mhr.role_id', '=', 'r.id')
                ->where('gu.group_id', $validated['group_id'])
                ->where('r.name', 'estudiante')
                ->pluck('gu.user_id');

            foreach ($students as $studentId) {
                TaskSubmission::firstOrCreate(
                    [
                        'task_id' => $task->id,
                        'student_id' => $studentId,
                    ],
                    [
                        'status' => 'pending',
                        'is_late' => false,
                    ]
                );
            }

            // Guardar archivos adjuntos
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('tasks/' . $task->id, 'public');
                    
                    TaskAttachment::create([
                        'task_id' => $task->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Tarea creada exitosamente',
                'task' => $task->load('attachments'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creando tarea:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al crear la tarea',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Actualizar tarea
     */
    public function update(Request $request, Task $task)
    {
        $this->assertOwnership((int) $task->subject_id, (int) $task->group_id);

        if ($task->teacher_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'work_type' => 'sometimes|in:individual,pairs,group',
            'max_group_members' => 'nullable|integer|min:2|max:10',
            'due_date' => 'sometimes|date|after_or_equal:today',
            'close_date' => 'nullable|date|after:due_date',
            'allow_late_submission' => 'nullable|boolean',
            'max_score' => 'sometimes|integer|min:1|max:1000',
            'is_active' => 'nullable|boolean',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ], [
            'close_date.after' => 'La fecha de cierre debe ser posterior a la fecha de entrega',
            'due_date.after_or_equal' => 'La fecha de entrega debe ser hoy o en el futuro',
        ]);

        try {
            DB::beginTransaction();

            $updates = $validated;

            // Forzar zona horaria si vienen las fechas
            if (isset($validated['due_date'])) {
                $updates['due_date'] = Carbon::parse($validated['due_date'])->setTimezone('America/Bogota');
            }
            if (isset($validated['close_date'])) {
                // Si close_date está vacío, establecer a null
                $updates['close_date'] = !empty($validated['close_date'])
                    ? Carbon::parse($validated['close_date'])->setTimezone('America/Bogota')
                    : null;
            }

            $task->update($updates);

            // Guardar nuevos archivos adjuntos
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    $path = $file->store('tasks/' . $task->id, 'public');
                    
                    TaskAttachment::create([
                        'task_id' => $task->id,
                        'file_name' => $file->getClientOriginalName(),
                        'file_path' => $path,
                        'file_type' => $file->getClientMimeType(),
                        'file_size' => $file->getSize(),
                    ]);
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Tarea actualizada exitosamente',
                'task' => $task->load('attachments'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error actualizando tarea:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al actualizar la tarea',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Eliminar tarea
     */
    public function destroy(Task $task)
    {
        $this->assertOwnership((int) $task->subject_id, (int) $task->group_id);

        if ($task->teacher_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            DB::beginTransaction();

            // Eliminar archivos del storage
            foreach ($task->attachments as $attachment) {
                if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                    Storage::disk('public')->delete($attachment->file_path);
                }
            }

            // Eliminar archivos de entregas
            foreach ($task->submissions as $submission) {
                foreach ($submission->files as $file) {
                    if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                        Storage::disk('public')->delete($file->file_path);
                    }
                }
            }

            $task->delete();

            DB::commit();

            return response()->json([
                'message' => 'Tarea eliminada exitosamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error eliminando tarea:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al eliminar la tarea',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Obtener detalles de una tarea con entregas
     */
    public function show(Task $task)
    {
        $this->assertOwnership((int) $task->subject_id, (int) $task->group_id);

        if ($task->teacher_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $task->load([
            'attachments',
            'submissions.student',
            'submissions.files',
            'groupSubmissions.members'
        ]);

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

        $submitted = $task->submissions()
            ->where('status', '!=', 'pending')
            ->count();

        $graded = $task->submissions()
            ->where('status', 'graded')
            ->count();

        // Agregar stats directamente al modelo task
        $task->stats = [
            'total' => $totalStudents,
            'submitted' => $submitted,
            'graded' => $graded,
            'pending' => $totalStudents - $submitted,
        ];

        return response()->json([
            'task' => $task,
        ]);
    }

    /**
     * Eliminar un archivo adjunto de la tarea
     */
    public function deleteAttachment(TaskAttachment $attachment)
    {
        $task = $attachment->task;

        $this->assertOwnership((int) $task->subject_id, (int) $task->group_id);

        if ($task->teacher_id !== auth()->id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        try {
            if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }

            $attachment->delete();

            return response()->json([
                'message' => 'Archivo eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error eliminando archivo adjunto:', [
                'error' => $e->getMessage(),
                'attachment_id' => $attachment->id
            ]);

            return response()->json([
                'message' => 'Error al eliminar el archivo',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }
}