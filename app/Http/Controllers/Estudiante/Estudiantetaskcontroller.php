<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\TaskSubmissionFile;
use App\Models\TaskSubmissionMember;
use App\Models\User;
use App\Events\SubmissionCreated;
use App\Events\SubmissionUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate; 


class EstudianteTaskController extends Controller
{
    /**
     * Verificar que el estudiante pertenece al grupo
     */
    private function assertGroupMembership(int $groupId): void
    {
        Gate::authorize('access-class', [0, $groupId]); // 0 as subjectId since we don't have it here and Gate handles it
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

        $this->assertGroupMembership($groupId);

        $tasks = Task::with(['attachments'])
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->where('is_active', true)
            ->orderBy('due_date', 'asc')
            ->get()
            ->map(function ($task) {
                $submission = TaskSubmission::with(['files', 'members.student'])
                    ->where('task_id', $task->id)
                    ->where(function($q) {
                        $q->where('student_id', Auth::id())
                          ->orWhereHas('members', function($sq) {
                              $sq->where('student_id', Auth::id());
                          });
                    })
                    ->first();

                $submissionData = null;
                if ($submission) {
                    $submissionData = [
                        'id' => $submission->id,
                        'comment' => $submission->comment,
                        'status' => $submission->status,
                        'score' => $submission->score,
                        'teacher_feedback' => $submission->teacher_feedback,
                        'submitted_at' => $submission->submitted_at,
                        'graded_at' => $submission->graded_at,
                        'is_late' => $submission->is_late,
                        'is_creator' => true,
                        'files' => $submission->files,
                        'members' => $submission->members->map(function ($member) {
                            return [
                                'id' => $member->id,
                                'student_id' => $member->student_id,
                                'student_name' => $member->student->name,
                                'is_creator' => $member->is_creator,
                                'status' => $member->status,
                            ];
                        }),
                    ];
                }

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
                    'submission' => $submissionData,
                    'can' => [
                        'submit' => auth()->user()->can('submit', $task),
                        'view' => auth()->user()->can('view', $task),
                    ],
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
        
        $this->assertGroupMembership($task->group_id);

        $submission = TaskSubmission::with(['files', 'members.student'])
            ->where('task_id', $task->id)
            ->where(function($q) {
                $q->where('student_id', Auth::id())
                  ->orWhereHas('members', function($sq) {
                      $sq->where('student_id', Auth::id());
                  });
            })
            ->first();
    
        if ($submission) {
            $this->authorize('view', $submission);
        } else {
            $this->authorize('view', $task);
        }

        $submissionData = null;
        if ($submission) {
            $submissionData = [
                'id' => $submission->id,
                'comment' => $submission->comment,
                'status' => $submission->status,
                'score' => $submission->score,
                'teacher_feedback' => $submission->teacher_feedback,
                'submitted_at' => $submission->submitted_at,
                'graded_at' => $submission->graded_at,
                'is_late' => $submission->is_late,
                'is_creator' => true,
                'files' => $submission->files,
                'members' => $submission->members->map(function ($member) {
                    return [
                        'id' => $member->id,
                        'student_id' => $member->student_id,
                        'student_name' => $member->student->name,
                        'is_creator' => $member->is_creator,
                        'status' => $member->status,
                    ];
                }),
            ];
        }

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
                'can' => [
                    'submit' => auth()->user()->can('submit', $task),
                    'view' => auth()->user()->can('view', $task),
                ],
            ],
            'submission' => $submissionData,
        ]);
    }

    /**
     * Obtener compañeros disponibles para trabajar en la tarea
     */
    public function getAvailableClassmates($taskId)
    {
        $task = Task::findOrFail($taskId);
        
        $this->assertGroupMembership($task->group_id);

        if ($task->work_type === 'individual') {
            return response()->json([]);
        }

        $availableStudents = User::select('users.id', 'users.name', 'users.email')
            ->join('group_user', 'users.id', '=', 'group_user.user_id')
            ->join('model_has_roles', function ($join) {
                $join->on('users.id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('group_user.group_id', $task->group_id)
            ->where('roles.name', 'estudiante')
            ->where('users.id', '!=', Auth::id())
            ->whereNotExists(function ($query) use ($taskId) {
                $query->select(DB::raw(1))
                    ->from('task_submissions')
                    ->whereColumn('task_submissions.student_id', 'users.id')
                    ->where('task_submissions.task_id', $taskId)
                    ->where('task_submissions.status', '!=', 'pending');
            })
            ->whereNotExists(function ($query) use ($taskId) {
                $query->select(DB::raw(1))
                    ->from('task_submission_members')
                    ->join('task_submissions', 'task_submission_members.submission_id', '=', 'task_submissions.id')
                    ->whereColumn('task_submission_members.student_id', 'users.id')
                    ->where('task_submissions.task_id', $taskId)
                    ->where('task_submission_members.status', 'accepted');
            })
            ->orderBy('users.name')
            ->get();

        return response()->json($availableStudents);
    }

        /**
     * Enviar o actualizar entrega de tarea
     */
    public function submit(Request $request)
    {
        $validated = $request->validate([
            'task_id'         => 'required|integer|exists:tasks,id',
            'submission_id'   => 'nullable|integer|exists:task_submissions,id',
            'comment'         => 'nullable|string',
            'files'           => 'nullable|array',
            'files.*'         => 'file|max:20480',
            'member_ids'      => 'nullable|array',
            'member_ids.*'    => 'integer|exists:users,id',
        ], [
            'files.*.max' => 'Cada archivo no puede exceder 20MB',
        ]);

        $task = Task::findOrFail($validated['task_id']);
        
        $this->assertGroupMembership($task->group_id);

        if ($task->isClosed()) {
            return response()->json([
                'message' => 'Esta tarea ya está cerrada y no acepta modificaciones'
            ], 422);
        }

        try {
            DB::beginTransaction();

            $submission_id = $validated['submission_id'] ?? null;
            $submission = $submission_id
                ? TaskSubmission::findOrFail($submission_id)
                : TaskSubmission::firstOrNew([
                    'task_id'    => $task->id,
                    'student_id' => Auth::id(),
                ]);

            // Verificaciones comunes
            $this->authorize('update', $submission);

            if ($submission->status === 'graded') {
                DB::rollBack();
                return response()->json([
                    'message' => 'Esta entrega ya fue calificada y no puede modificarse'
                ], 422);
            }

            // Actualizar datos básicos de la entrega principal
            $submission->comment      = $validated['comment'] ?? null;
            $submission->status       = 'submitted';
            $submission->submitted_at = now();
            $submission->is_late      = $task->isPastDue();
            $submission->save();

            // ==================================================
            // MANEJO DE MIEMBROS (creación y edición)
            // ==================================================
            if ($task->work_type !== 'individual') {
                // 1. Obtener los miembros actuales ANTES de borrarlos
                $previousMembers = TaskSubmissionMember::where('submission_id', $submission->id)
                    ->pluck('student_id')
                    ->toArray();

                // 2. Eliminar miembros actuales (reemplazo completo)
                TaskSubmissionMember::where('submission_id', $submission->id)->delete();

                // 3. Revertir estado de miembros que ya no están (opcional pero recomendado)
                $removed = array_diff($previousMembers, $validated['member_ids'] ?? []);

                foreach ($removed as $removedId) {
                    TaskSubmission::where('task_id', $task->id)
                        ->where('student_id', $removedId)
                        ->update([
                            'status'       => 'pending',
                            'submitted_at' => null,
                            'comment'      => null,
                            'is_late'   => false,
                        ]);
                }

                // 4. Agregar los nuevos miembros enviados desde el frontend
                if (!empty($validated['member_ids'])) {
                    $maxMembers = $task->work_type === 'pairs' ? 1 : ($task->max_group_members - 1);

                    if (count($validated['member_ids']) > $maxMembers) {
                        DB::rollBack();
                        return response()->json([
                            'message' => "Solo puedes seleccionar hasta {$maxMembers} compañero(s)"
                        ], 422);
                    }

                    foreach ($validated['member_ids'] as $memberId) {
                        if ($memberId != Auth::id()) { // Evitar auto-agregarse
                            TaskSubmissionMember::create([
                                'submission_id' => $submission->id,
                                'student_id'    => $memberId,
                                'is_creator'    => false,
                                'status'        => 'accepted',
                            ]);
                        }
                    }
                }

                // ==================================================
                // PROPAGAR ESTADO "SUBMITTED" A TODOS LOS MIEMBROS ACTUALES
                // (incluyendo los recién agregados)
                // ==================================================
                $submission->load('members'); // Recargar relación después de cambios

                foreach ($submission->members as $member) {
                    $memberSub = TaskSubmission::firstOrCreate(
                        [
                            'task_id'    => $task->id,
                            'student_id' => $member->student_id,
                        ],
                        [
                            'status'     => 'pending',
                            'is_late'    => false,
                        ]
                    );

                    $memberSub->update([
                        'status'       => 'submitted',
                        'submitted_at' => $submission->submitted_at,
                        'is_late'      => $submission->is_late,
                        'comment'      => $submission->comment ?? null,
                    ]);
                }
            }

            // ==================================================
            // MANEJO DE ARCHIVOS (solo agregar nuevos)
            // ==================================================
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    if ($file->isValid()) {
                        $path = $file->store('submissions/' . $submission->id, 'private');

                        TaskSubmissionFile::create([
                            'submission_id' => $submission->id,
                            'file_name'     => $file->getClientOriginalName(),
                            'file_path'     => $path,
                            'file_type'     => $file->getClientMimeType(),
                            'file_size'     => $file->getSize(),
                        ]);
                    }
                }
            }

            DB::commit();

            $submission->load(['files', 'members.student']);

            broadcast(new SubmissionUpdated($submission));

            return response()->json([
                'message'    => $submission_id 
                    ? '✅ Entrega actualizada completamente' 
                    : '✅ Tarea entregada exitosamente',
                'submission' => $submission,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error en submit:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Error al procesar la entrega',
                'error'   => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }   

    /**
     * Eliminar un archivo individual de una entrega
     */
    public function deleteFile($fileId)
    {
        $file = TaskSubmissionFile::findOrFail($fileId);
        $submission = $file->submission;

        $this->authorize('update', $submission);

        if ($submission->status === 'graded') {
            return response()->json([
                'message' => 'No puedes eliminar archivos de una entrega calificada'
            ], 422);
        }

        if ($submission->task->isClosed()) {
            return response()->json([
                'message' => 'No puedes eliminar archivos porque la tarea ya cerró'
            ], 422);
        }

        try {
            if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }

            $file->delete();

            return response()->json([
                'message' => 'Archivo eliminado exitosamente'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error eliminando archivo:', [
                'error' => $e->getMessage(),
                'file_id' => $fileId
            ]);
            
            return response()->json([
                'message' => 'Error al eliminar el archivo',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
            ], 500);
        }
    }


    /**
 * Remover un miembro de una entrega grupal
 */
public function removeMember($memberId)
{
    $member = TaskSubmissionMember::findOrFail($memberId);
    $submission = $member->submission;

    $this->authorize('update', $submission);

    if ($submission->status === 'graded') {
        return response()->json([
            'message' => 'No puedes remover miembros de una entrega calificada'
        ], 422);
    }

    if ($submission->task->isClosed()) {
        return response()->json([
            'message' => 'No puedes remover miembros porque la tarea ya cerró'
        ], 422);
    }

    try {
        DB::beginTransaction();

        // 1. Obtener el ID del estudiante que se está removiendo
        $removedStudentId = $member->student_id;

        // 2. Eliminar el vínculo del miembro
        $member->delete();

        // 3. Revertir el estado de entrega de esa persona a pending
        TaskSubmission::where('task_id', $submission->task_id)
            ->where('student_id', $removedStudentId)
            ->update([
                'status'       => 'pending',
                'submitted_at' => null,
                'comment'      => null,
                'is_late'      => false, // opcional, pero recomendado
            ]);

        DB::commit();

        // Opcional: recargar y broadcast la entrega actualizada
        $submission->load(['files', 'members.student']);
        broadcast(new SubmissionUpdated($submission));

        return response()->json([
            'message' => 'Miembro removido exitosamente y su entrega revertida a pendiente'
        ]);
    } catch (\Exception $e) {
        DB::rollBack();
        \Log::error('Error removiendo miembro:', [
            'error' => $e->getMessage(),
            'member_id' => $memberId
        ]);

        return response()->json([
            'message' => 'Error al remover miembro',
            'error' => config('app.debug') ? $e->getMessage() : 'Error interno del servidor'
        ], 500);
    }
}   

    /**
     * Eliminar una entrega completa (solo si no ha sido calificada)
     */
    public function deleteSubmission($submissionId)
    {
        $submission = TaskSubmission::findOrFail($submissionId);

        $this->authorize('delete', $submission);

        if ($submission->status === 'graded') {
            return response()->json([
                'message' => 'No puedes eliminar una entrega que ya fue calificada'
            ], 422);
        }

        $task = $submission->task;
        if ($task->isClosed()) {
            return response()->json([
                'message' => 'No puedes eliminar la entrega porque la tarea ya cerró'
            ], 422);
        }

        try {
            DB::beginTransaction();

            $files = TaskSubmissionFile::where('submission_id', $submission->id)->get();
            foreach ($files as $file) {
                if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                    Storage::disk('public')->delete($file->file_path);
                }
                $file->delete();
            }

            TaskSubmissionMember::where('submission_id', $submission->id)->delete();

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