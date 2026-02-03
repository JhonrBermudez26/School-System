<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\TaskSubmissionFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class EstudianteTaskController extends Controller
{
    /**
     * Verificar que el estudiante pertenece al grupo
     */
    private function assertGroupMembership(int $groupId): void
    {
        $userId = Auth::id();
        $belongs = DB::table('group_user')
            ->where('group_id', $groupId)
            ->where('user_id', $userId)
            ->exists();

        abort_unless($belongs, 403, 'No tienes acceso a este grupo');
    }

    /**
     * Obtener todas las tareas de un grupo/asignatura para el estudiante
     */
    public function index(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
        ]);

        $subjectId = (int) $request->query('subject_id');
        $groupId = (int) $request->query('group_id');

        // Verificar pertenencia
        $this->assertGroupMembership($groupId);

        $tasks = Task::with(['attachments'])
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->where('is_active', true)
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($task) {
                // Obtener la entrega del estudiante
                $submission = TaskSubmission::with('files')
                    ->where('task_id', $task->id)
                    ->where('student_id', Auth::id())
                    ->first();

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
                    'submission' => $submission ? [
                        'id' => $submission->id,
                        'comment' => $submission->comment,
                        'status' => $submission->status,
                        'score' => $submission->score,
                        'teacher_feedback' => $submission->teacher_feedback,
                        'submitted_at' => $submission->submitted_at,
                        'graded_at' => $submission->graded_at,
                        'is_late' => $submission->is_late,
                        'files' => $submission->files,
                    ] : null,
                    'created_at' => $task->created_at,
                ];
            });

        return response()->json($tasks);
    }

    /**
     * Ver detalle de una tarea específica
     */
    public function show($id)
    {
        $task = Task::with('attachments')->findOrFail($id);
        
        // Verificar pertenencia al grupo
        $this->assertGroupMembership($task->group_id);

        // Obtener la entrega del estudiante
        $submission = TaskSubmission::with('files')
            ->where('task_id', $task->id)
            ->where('student_id', Auth::id())
            ->first();

        return response()->json([
            'task' => [
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
            ],
            'submission' => $submission ? [
                'id' => $submission->id,
                'comment' => $submission->comment,
                'status' => $submission->status,
                'score' => $submission->score,
                'teacher_feedback' => $submission->teacher_feedback,
                'submitted_at' => $submission->submitted_at,
                'graded_at' => $submission->graded_at,
                'is_late' => $submission->is_late,
                'files' => $submission->files,
            ] : null,
        ]);
    }

    /**
     * Enviar o actualizar entrega de tarea
     */
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'task_id' => 'required|integer|exists:tasks,id',
            'comment' => 'nullable|string',
            'files' => 'nullable|array',
            'files.*' => 'file|max:20480', // 20MB max por archivo
        ], [
            'files.*.max' => 'Cada archivo no puede exceder 20MB',
        ]);

        $task = Task::findOrFail($validated['task_id']);
        
        // Verificar pertenencia al grupo
        $this->assertGroupMembership($task->group_id);

        // Verificar que la tarea no esté cerrada
        if ($task->isClosed()) {
            return response()->json([
                'message' => 'Esta tarea ya está cerrada y no acepta entregas'
            ], 422);
        }

        // Verificar si ya está vencida y no permite entregas tardías
        if ($task->isPastDue() && !$task->allow_late_submission) {
            return response()->json([
                'message' => 'Esta tarea ya venció y no acepta entregas tardías'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Buscar o crear la entrega
            $submission = TaskSubmission::firstOrNew([
                'task_id' => $task->id,
                'student_id' => Auth::id(),
            ]);

            // Si ya estaba calificada, no permitir cambios
            if ($submission->exists && $submission->status === 'graded') {
                DB::rollBack();
                return response()->json([
                    'message' => 'Esta tarea ya fue calificada y no puede ser modificada'
                ], 422);
            }

            // Actualizar datos
            $submission->comment = $validated['comment'] ?? null;
            $submission->status = 'submitted';
            $submission->submitted_at = now();
            
            // Marcar si es tardía
            $submission->is_late = $task->isPastDue();

            $submission->save();

            // Procesar archivos adjuntos
            if ($request->hasFile('files')) {
                // Eliminar archivos anteriores si existían
                $oldFiles = TaskSubmissionFile::where('submission_id', $submission->id)->get();
                foreach ($oldFiles as $oldFile) {
                    if ($oldFile->file_path && Storage::disk('public')->exists($oldFile->file_path)) {
                        Storage::disk('public')->delete($oldFile->file_path);
                    }
                    $oldFile->delete();
                }

                // Guardar nuevos archivos
                foreach ($request->file('files') as $file) {
                    if ($file->isValid()) {
                        $path = $file->store('submissions/' . $submission->id, 'public');
                        
                        TaskSubmissionFile::create([
                            'submission_id' => $submission->id,
                            'file_name' => $file->getClientOriginalName(),
                            'file_path' => $path,
                            'file_type' => $file->getClientMimeType(),
                            'file_size' => $file->getSize(),
                        ]);
                    }
                }
            }

            DB::commit();

            return response()->json([
                'message' => 'Tarea entregada exitosamente',
                'submission' => $submission->load('files'),
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error enviando tarea:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Error al enviar la tarea',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }

    /**
     * Eliminar una entrega (solo si no ha sido calificada)
     */
    public function deleteSubmission($submissionId)
    {
        $submission = TaskSubmission::findOrFail($submissionId);

        // Verificar que es del estudiante actual
        if ($submission->student_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // No permitir eliminar si ya fue calificada
        if ($submission->status === 'graded') {
            return response()->json([
                'message' => 'No puedes eliminar una entrega que ya fue calificada'
            ], 422);
        }

        // Verificar que la tarea no esté cerrada
        $task = $submission->task;
        if ($task->isClosed()) {
            return response()->json([
                'message' => 'No puedes eliminar la entrega porque la tarea ya cerró'
            ], 422);
        }

        try {
            DB::beginTransaction();

            // Eliminar archivos del storage
            $files = TaskSubmissionFile::where('submission_id', $submission->id)->get();
            foreach ($files as $file) {
                if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                    Storage::disk('public')->delete($file->file_path);
                }
                $file->delete();
            }

            // Restablecer estado a pendiente
            $submission->status = 'pending';
            $submission->comment = null;
            $submission->submitted_at = null;
            $submission->is_late = false;
            $submission->save();

            DB::commit();

            return response()->json([
                'message' => 'Entrega eliminada exitosamente'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error eliminando entrega:', [
                'error' => $e->getMessage(),
                'submission_id' => $submissionId
            ]);
            
            return response()->json([
                'message' => 'Error al eliminar la entrega',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }
}