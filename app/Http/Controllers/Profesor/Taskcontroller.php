<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskAttachment;
use App\Models\TaskSubmission;
use App\Models\AcademicPeriod;
use App\Events\TaskCreated;
use App\Events\TaskUpdated;
use App\Events\TaskDeleted;
use App\Events\SubmissionGraded;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    private function assertOwnership(int $subjectId, int $groupId): void
    {
        Gate::authorize('access-class', [$subjectId, $groupId]);
    }

    /**
     * ✅ ACTUALIZADO: Filtrar tareas por periodo
     */
    public function index(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'period_id' => 'nullable|integer|exists:academic_periods,id',
        ]);

        $subjectId = (int) $request->query('subject_id');
        $groupId = (int) $request->query('group_id');
        $periodId = $request->query('period_id');

        $this->assertOwnership($subjectId, $groupId);

        // Si no se especifica periodo, usar el actual
        if (!$periodId) {
            $currentPeriod = AcademicPeriod::getPeriodoActual();
            $periodId = $currentPeriod?->id;
        }

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

        $query = Task::with(['attachments', 'submissions.student', 'academicPeriod'])
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->where('teacher_id', auth()->id());

        if ($periodId) {
            $query->where('academic_period_id', $periodId);
        }

        $tasks = $query->orderBy('created_at', 'desc')
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
                    'academic_period' => $task->academicPeriod ? [
                        'id' => $task->academicPeriod->id,
                        'name' => $task->academicPeriod->name,
                    ] : null,
                    'stats' => [
                        'total' => $totalStudents,
                        'submitted' => $submitted,
                        'graded' => $graded,
                        'pending' => $totalStudents - $submitted,
                    ],
                    'can' => [
                        'update' => auth()->user()->can('update', $task),
                        'delete' => auth()->user()->can('delete', $task),
                        'grade' => auth()->user()->can('grade', $task),
                    ],
                    'created_at' => $task->created_at,
                ];
            });

        return response()->json($tasks);
    }

    /**
     * ✅ ACTUALIZADO: Crear tarea con periodo académico
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'academic_period_id' => 'nullable|integer|exists:academic_periods,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'work_type' => 'required|in:individual,pairs,group',
            'max_group_members' => 'nullable|integer|min:2|max:10',
            'due_date' => 'required|date|after_or_equal:today',
            'close_date' => 'nullable|date|after:due_date',
            'allow_late_submission' => 'nullable|boolean',
            'max_score' => 'required|numeric|min:0.1|max:5.0',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ], [
            'max_score.max' => 'La calificación máxima no puede ser mayor a 5.0',
            'max_score.min' => 'La calificación máxima debe ser al menos 0.1',
        ]);

        $this->assertOwnership((int) $validated['subject_id'], (int) $validated['group_id']);

        // Si no se especifica periodo, asignar el actual
        if (!isset($validated['academic_period_id'])) {
            $currentPeriod = AcademicPeriod::getPeriodoActual();
            $validated['academic_period_id'] = $currentPeriod?->id;
        }

        // Validar que el periodo permita operaciones
        if (!$this->validatePeriodEnabled($validated['academic_period_id'])) {
            return response()->json([
                'message' => 'El periodo académico seleccionado no permite la carga de notas en este momento.',
                'error' => 'period_disabled'
            ], 403);
        }

        try {
            DB::beginTransaction();

            $task = Task::create([
                'subject_id' => $validated['subject_id'],
                'group_id' => $validated['group_id'],
                'academic_period_id' => $validated['academic_period_id'],
                'teacher_id' => auth()->id(),
                'title' => $validated['title'],
                'description' => $validated['description'],
                'work_type' => $validated['work_type'],
                'max_group_members' => $validated['work_type'] === 'group' 
                    ? ($validated['max_group_members'] ?? 3) 
                    : null,
                'due_date' => Carbon::parse($validated['due_date'])->setTimezone('America/Bogota'),
                'close_date' => !empty($validated['close_date'])
                    ? Carbon::parse($validated['close_date'])->setTimezone('America/Bogota')
                    : null,
                'allow_late_submission' => $validated['allow_late_submission'] ?? true,
                'max_score' => $validated['max_score'],
            ]);

            // Crear entregas automáticas para estudiantes
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
                    ['task_id' => $task->id, 'student_id' => $studentId],
                    ['status' => 'pending', 'is_late' => false]
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

            broadcast(new TaskCreated($task))->toOthers();

            return response()->json([
                'message' => 'Tarea creada exitosamente',
                'task' => $task->load('attachments', 'academicPeriod'),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creando tarea:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Error al crear la tarea',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    /**
     * ✅ ACTUALIZADO: Actualizar tarea
     */
    public function update(Request $request, Task $task)
    {
        $this->authorize('update', $task);

        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'work_type' => 'sometimes|in:individual,pairs,group',
            'max_group_members' => 'nullable|integer|min:2|max:10',
            'due_date' => 'sometimes|date|after_or_equal:today',
            'close_date' => 'nullable|date|after:due_date',
            'allow_late_submission' => 'nullable|boolean',
            'max_score' => 'sometimes|numeric|min:0.1|max:5.0',
            'is_active' => 'nullable|boolean',
            'academic_period_id' => 'nullable|integer|exists:academic_periods,id',
            'attachments' => 'nullable|array',
            'attachments.*' => 'file|max:10240',
        ]);

        // Validar periodo si se está cambiando
        if (isset($validated['academic_period_id'])) {
            if (!$this->validatePeriodEnabled($validated['academic_period_id'])) {
                return response()->json([
                    'message' => 'El periodo académico seleccionado no permite operaciones.',
                    'error' => 'period_disabled'
                ], 403);
            }
        }

        try {
            DB::beginTransaction();

            $updates = $validated;
            
            if (isset($validated['due_date'])) {
                $updates['due_date'] = Carbon::parse($validated['due_date'])->setTimezone('America/Bogota');
            }
            
            if (isset($validated['close_date'])) {
                $updates['close_date'] = !empty($validated['close_date'])
                    ? Carbon::parse($validated['close_date'])->setTimezone('America/Bogota')
                    : null;
            }

            $task->update($updates);

            // Guardar nuevos archivos
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

            broadcast(new TaskUpdated($task))->toOthers();

            return response()->json([
                'message' => 'Tarea actualizada exitosamente',
                'task' => $task->load('attachments', 'academicPeriod'),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error actualizando tarea:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Error al actualizar la tarea',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    public function destroy(Task $task)
    {
        $this->authorize('delete', $task);

        try {
            DB::beginTransaction();

            $taskId = $task->id;
            $groupId = $task->group_id;
            $title = $task->title;

            // Eliminar archivos
            foreach ($task->attachments as $attachment) {
                if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                    Storage::disk('public')->delete($attachment->file_path);
                }
            }

            foreach ($task->submissions as $submission) {
                foreach ($submission->files as $file) {
                    if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                        Storage::disk('public')->delete($file->file_path);
                    }
                }
            }

            $task->delete();

            DB::commit();

            broadcast(new TaskDeleted($taskId, $groupId, $title))->toOthers();

            return response()->json(['message' => 'Tarea eliminada exitosamente']);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error eliminando tarea:', ['error' => $e->getMessage()]);
            
            return response()->json([
                'message' => 'Error al eliminar la tarea',
                'error' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }

    public function show(Task $task)
    {
        $this->authorize('view', $task);
    
        $task->load(['attachments', 'academicPeriod']);
        
        if ($task->work_type === 'individual') {
            $submissions = TaskSubmission::with(['student', 'files'])
                ->where('task_id', $task->id)
                ->get();
        } else {
            $submissions = TaskSubmission::with(['student', 'files', 'members.student'])
                ->where('task_id', $task->id)
                ->whereNotExists(function($query) {
                    $query->select(DB::raw(1))
                        ->from('task_submission_members')
                        ->whereColumn('task_submission_members.submission_id', 'task_submissions.id')
                        ->whereColumn('task_submission_members.student_id', 'task_submissions.student_id');
                })
                ->get();
        }
        
        $submissions = $submissions->map(function ($s) {
            return [
                'id' => $s->id,
                'student' => $s->student,
                'comment' => $s->comment,
                'status' => $s->status,
                'score' => $s->score,
                'teacher_feedback' => $s->teacher_feedback,
                'submitted_at' => $s->submitted_at,
                'graded_at' => $s->graded_at,
                'is_late' => $s->is_late,
                'files' => $s->files,
                'members' => $s->members ?? [],
                'is_creator' => true,
            ];
        });
        
        $stats = [
            'total' => $task->getTotalStudentsCount(),
            'submitted' => TaskSubmission::where('task_id', $task->id)
                ->whereIn('status', ['submitted', 'graded'])
                ->count(),
            'graded' => TaskSubmission::where('task_id', $task->id)
                ->where('status', 'graded')
                ->count(),
            'pending' => TaskSubmission::where('task_id', $task->id)
                ->where('status', 'pending')
                ->count(),
        ];
        
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
                'academic_period' => $task->academicPeriod ? [
                    'id' => $task->academicPeriod->id,
                    'name' => $task->academicPeriod->name,
                ] : null,
                'submissions' => $submissions,
                'stats' => $stats,
                'can' => [
                    'update' => auth()->user()->can('update', $task),
                    'delete' => auth()->user()->can('delete', $task),
                    'grade' => auth()->user()->can('grade', $task),
                ],
            ]
        ]);
    }

    public function gradeSubmission(Request $request, $submissionId)
    {
        $validated = $request->validate([
            'score' => 'required|numeric|min:0',
            'teacher_feedback' => 'nullable|string|max:2000',
            'individual_scores' => 'nullable|array',
            'individual_scores.*.student_id' => 'required|exists:users,id',
            'individual_scores.*.score' => 'required|numeric|min:0',
            'individual_scores.*.feedback' => 'nullable|string|max:1000',
        ]);

        $submission = TaskSubmission::with(['task', 'student', 'members.student'])->findOrFail($submissionId);
        $task = $submission->task;

        $this->authorize('grade', $task);

        if ($validated['score'] > $task->max_score) {
            return response()->json([
                'message' => "La calificación no puede exceder {$task->max_score} puntos"
            ], 422);
        }

        DB::beginTransaction();
        try {
            $useIndividual = !empty($validated['individual_scores']) && $task->work_type !== 'individual';

            if ($useIndividual) {
                $scoresSum = 0;
                $count = 0;

                foreach ($validated['individual_scores'] as $ind) {
                    $studentSub = TaskSubmission::where('task_id', $task->id)
                        ->where('student_id', $ind['student_id'])
                        ->first();

                    if ($studentSub) {
                        $studentSub->score = $ind['score'];
                        $studentSub->teacher_feedback = $ind['feedback'] ?? $validated['teacher_feedback'] ?? null;
                        $studentSub->status = 'graded';
                        $studentSub->graded_at = now();
                        $studentSub->save();

                        $scoresSum += (float) $ind['score'];
                        $count++;
                    }
                }

                if ($count > 0) {
                    $submission->score = round($scoresSum / $count, 2);
                } else {
                    $submission->score = $validated['score'];
                }
            } else {
                $submission->score = $validated['score'];
                $submission->teacher_feedback = $validated['teacher_feedback'] ?? null;

                foreach ($submission->members as $member) {
                    $memberSub = TaskSubmission::firstOrCreate(
                        ['task_id' => $task->id, 'student_id' => $member->student_id],
                        ['status' => 'pending', 'is_late' => false]
                    );

                    $memberSub->update([
                        'score' => $validated['score'],
                        'teacher_feedback' => $validated['teacher_feedback'] ?? null,
                        'status' => 'graded',
                        'graded_at' => now(),
                        'submitted_at' => $submission->submitted_at,
                        'is_late' => $submission->is_late,
                        'comment' => $task->work_type === 'pairs'
                            ? "Trabajo en pareja con {$submission->student->name}"
                            : "Trabajo en grupo con {$submission->student->name}",
                    ]);
                }
            }

            $submission->status = 'graded';
            $submission->graded_at = now();
            $submission->save();

            DB::commit();

            broadcast(new SubmissionGraded($submission))->toOthers();

            return response()->json([
                'message' => $request->isMethod('put') 
                    ? 'Calificación actualizada' 
                    : 'Entrega calificada',
                'submission' => $submission->fresh(['student', 'members.student']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error calificando:', ['error' => $e->getMessage()]);
            
            return response()->json(['message' => 'Error al calificar'], 500);
        }
    }

    public function deleteAttachment(TaskAttachment $attachment)
    {
        $task = $attachment->task;
        $this->authorize('update', $task);

        try {
            if ($attachment->file_path && Storage::disk('public')->exists($attachment->file_path)) {
                Storage::disk('public')->delete($attachment->file_path);
            }

            $attachment->delete();

            return response()->json(['message' => 'Archivo eliminado']);
        } catch (\Exception $e) {
            \Log::error('Error eliminando archivo:', ['error' => $e->getMessage()]);
            
            return response()->json(['message' => 'Error al eliminar archivo'], 500);
        }
    }

    /**
     * ✅ VALIDAR QUE EL PERIODO PERMITA OPERACIONES
     */
    private function validatePeriodEnabled(?int $periodId): bool
    {
        if (!$periodId) {
            return true; // Retrocompatibilidad
        }
        
        $period = AcademicPeriod::find($periodId);
        
        if (!$period) {
            return false;
        }
        
        return $period->grades_enabled;
    }
}