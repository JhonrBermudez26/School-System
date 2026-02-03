<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;

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
     * Enviar/actualizar entrega de tarea
     */
    public function submit(Request $request)
    {
        $data = $request->validate([
            'task_id' => 'required|integer|exists:tasks,id',
            'content' => 'nullable|string',
            'files' => 'sometimes|array',
            'files.*' => 'file|max:20480', // 20MB max
        ]);

        $task = Task::findOrFail($data['task_id']);
        
        // Verificar pertenencia al grupo
        $this->assertGroupMembership($task->group_id);

        // Verificar que la tarea no esté cerrada
        if ($task->close_date && $task->close_date < now()) {
            return Redirect::back()->with('error', 'Esta tarea ya está cerrada y no acepta entregas');
        }

        // Buscar o crear la entrega
        $submission = TaskSubmission::firstOrNew([
            'task_id' => $task->id,
            'student_id' => Auth::id(),
        ]);

        // Si ya estaba calificada, no permitir cambios
        if ($submission->exists && $submission->status === 'graded') {
            return Redirect::back()->with('error', 'Esta tarea ya fue calificada y no puede ser modificada');
        }

        // Actualizar contenido
        $submission->content = $data['content'] ?? null;
        $submission->status = 'submitted';
        $submission->submitted_at = now();
        $submission->save();

        // Procesar archivos adjuntos
        if ($request->hasFile('files')) {
            // Primero eliminar archivos anteriores si existían
            if ($submission->attachments) {
                $oldAttachments = json_decode($submission->attachments, true) ?? [];
                foreach ($oldAttachments as $oldFile) {
                    if (isset($oldFile['path'])) {
                        Storage::disk('public')->delete($oldFile['path']);
                    }
                }
            }

            // Guardar nuevos archivos
            $attachments = [];
            foreach ($request->file('files') as $file) {
                if ($file->isValid()) {
                    $path = $file->store('submissions', 'public');
                    $attachments[] = [
                        'filename' => $file->getClientOriginalName(),
                        'path' => $path,
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ];
                }
            }
            $submission->attachments = json_encode($attachments);
            $submission->save();
        }

        return Redirect::back()->with('success', 'Tarea entregada exitosamente');
    }

    /**
     * Ver detalle de una tarea
     */
    public function show($id)
    {
        $task = Task::with('attachments')->findOrFail($id);
        
        // Verificar pertenencia al grupo
        $this->assertGroupMembership($task->group_id);

        // Obtener la entrega del estudiante
        $submission = TaskSubmission::where('task_id', $task->id)
            ->where('student_id', Auth::id())
            ->first();

        return response()->json([
            'task' => [
                'id' => $task->id,
                'title' => $task->title,
                'description' => $task->description,
                'work_type' => $task->work_type,
                'due_date' => $task->due_date,
                'close_date' => $task->close_date,
                'max_score' => $task->max_score,
                'is_active' => $task->is_active,
                'attachments' => $task->attachments,
            ],
            'submission' => $submission ? [
                'id' => $submission->id,
                'content' => $submission->content,
                'status' => $submission->status,
                'score' => $submission->score,
                'feedback' => $submission->feedback,
                'attachments' => json_decode($submission->attachments, true),
                'submitted_at' => $submission->submitted_at,
                'graded_at' => $submission->graded_at,
            ] : null,
        ]);
    }
}