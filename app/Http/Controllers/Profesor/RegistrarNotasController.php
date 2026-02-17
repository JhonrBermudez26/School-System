<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskSubmission;
use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class RegistrarNotasController extends Controller
{
    /**
     * ✅ Vista principal con filtro por periodo
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Obtener asignaciones del profesor
        $asignaciones = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->where('sg.user_id', $user->id)
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'g.id as group_id',
                'g.nombre as group_name'
            )
            ->orderBy('s.name')
            ->orderBy('g.nombre')
            ->get();
        
        // Obtener periodos académicos
        $periodos = AcademicPeriod::ordenado()
            ->get()
            ->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'year' => $p->year,
                    'period_number' => $p->period_number,
                    'start_date' => $p->start_date->format('Y-m-d'),
                    'end_date' => $p->end_date->format('Y-m-d'),
                    'is_current' => $p->isDentroFecha(),
                    'grades_enabled' => $p->grades_enabled,
                    'grade_weight' => $p->grade_weight,
                ];
            });
        
        // Periodo seleccionado
        $periodoActualId = $request->query('period_id');
        if (!$periodoActualId) {
            $currentPeriod = AcademicPeriod::getPeriodoActual();
            $periodoActualId = $currentPeriod?->id;
        }
        
        $classInfo = null;
        $students = [];
        $tasks = [];
        $manualGrades = [];
        $gradeMatrix = [];
        $selectedPeriod = null;
        
        if ($request->has('subject_id') && $request->has('group_id')) {
            $subjectId = (int) $request->query('subject_id');
            $groupId = (int) $request->query('group_id');
            
            Gate::authorize('access-class', [$subjectId, $groupId]);
            
            // Info de la clase
            $classInfo = DB::table('subject_group as sg')
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
            
            // Periodo seleccionado
            if ($periodoActualId) {
                $selectedPeriod = AcademicPeriod::find($periodoActualId);
            }
            
            // Estudiantes
            $students = DB::table('group_user as gu')
                ->join('users as u', 'gu.user_id', '=', 'u.id')
                ->join('model_has_roles as mhr', function ($join) {
                    $join->on('gu.user_id', '=', 'mhr.model_id')
                        ->where('mhr.model_type', '=', 'App\\Models\\User');
                })
                ->join('roles as r', 'mhr.role_id', '=', 'r.id')
                ->where('gu.group_id', $groupId)
                ->where('r.name', 'estudiante')
                ->select(
                    'u.id',
                    'u.name',
                    'u.last_name',
                    'u.document_number',
                    'u.email'
                )
                ->orderBy('u.last_name')
                ->orderBy('u.name')
                ->get();
            
            // Tareas del periodo
            $tasksQuery = Task::where('subject_id', $subjectId)
                ->where('group_id', $groupId)
                ->where('teacher_id', $user->id);
            
            if ($periodoActualId) {
                $tasksQuery->where('academic_period_id', $periodoActualId);
            }
            
            $tasks = $tasksQuery->orderBy('due_date', 'desc')
                ->get()
                ->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        'max_score' => (float) $task->max_score,
                        'due_date' => $task->due_date,
                        'type' => 'task',
                        'academic_period_id' => $task->academic_period_id,
                    ];
                });
            
            // Notas manuales del periodo
            $manualGradesQuery = DB::table('manual_grades')
                ->where('subject_id', $subjectId)
                ->where('group_id', $groupId)
                ->where('teacher_id', $user->id);
            
            if ($periodoActualId) {
                $manualGradesQuery->where('academic_period_id', $periodoActualId);
            }
            
            $manualGrades = $manualGradesQuery->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($grade) {
                    return [
                        'id' => $grade->id,
                        'title' => $grade->title,
                        'max_score' => (float) $grade->max_score,
                        'weight' => (float) ($grade->weight ?? 1),
                        'grade_date' => $grade->grade_date,
                        'type' => 'manual',
                        'academic_period_id' => $grade->academic_period_id,
                    ];
                });
            
            // Matriz de calificaciones
            foreach ($students as $student) {
                $studentGrades = [
                    'student_id' => $student->id,
                    'student_name' => $student->name . ' ' . $student->last_name,
                    'document_number' => $student->document_number,
                    'grades' => [],
                    'total' => 0,
                    'average' => 0
                ];
                
                $totalScore = 0;
                $gradeCount = 0;
                
                // Tareas
                foreach ($tasks as $task) {
                    $submission = TaskSubmission::where('task_id', $task['id'])
                        ->where('student_id', $student->id)
                        ->first();
                    
                    $score = null;
                    if ($submission && $submission->status === 'graded') {
                        $score = (float) $submission->score;
                        $totalScore += $score;
                        $gradeCount++;
                    }
                    
                    $studentGrades['grades']['task_' . $task['id']] = [
                        'score' => $score,
                        'max_score' => $task['max_score'],
                        'status' => $submission->status ?? 'pending',
                        'type' => 'task'
                    ];
                }
                
                // Notas manuales
                foreach ($manualGrades as $manualGrade) {
                    $grade = DB::table('manual_grade_scores')
                        ->where('manual_grade_id', $manualGrade['id'])
                        ->where('student_id', $student->id)
                        ->first();
                    
                    $score = $grade ? (float) $grade->score : null;
                    if ($score !== null) {
                        $totalScore += $score;
                        $gradeCount++;
                    }
                    
                    $studentGrades['grades']['manual_' . $manualGrade['id']] = [
                        'score' => $score,
                        'max_score' => $manualGrade['max_score'],
                        'type' => 'manual'
                    ];
                }
                
                // Promedio
                if ($gradeCount > 0) {
                    $studentGrades['average'] = round(($totalScore / $gradeCount), 2);
                }
                
                $gradeMatrix[] = $studentGrades;
            }
        }
        
        return Inertia::render('Profesor/RegistrarNotas', [
            'asignaciones' => $asignaciones,
            'periodos' => $periodos,
            'periodoActual' => $selectedPeriod ? [
                'id' => $selectedPeriod->id,
                'name' => $selectedPeriod->name,
                'grades_enabled' => $selectedPeriod->grades_enabled,
                'grade_weight' => $selectedPeriod->grade_weight,
            ] : null,
            'classInfo' => $classInfo,
            'students' => $students,
            'tasks' => $tasks,
            'manualGrades' => $manualGrades,
            'gradeMatrix' => $gradeMatrix,
            'can' => [
                'create_manual_grade' => $user->can('manual_grades.create'),
                'update_manual_grade' => $user->can('manual_grades.update'),
                'delete_manual_grade' => $user->can('manual_grades.delete'),
                'update_grade' => $user->can('grades.update'),
                'correct_grade' => $user->can('grades.correct'),
            ]
        ]);
    }
    
    /**
     * ✅ Validar periodo habilitado
     */
    private function validatePeriodEnabled(?int $periodId): bool
    {
        if (!$periodId) {
            return true;
        }
        
        $period = AcademicPeriod::find($periodId);
        
        if (!$period) {
            return false;
        }
        
        return $period->grades_enabled;
    }
    
    /**
     * ✅ Crear nota manual
     */
    public function createManualGrade(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'academic_period_id' => 'nullable|integer|exists:academic_periods,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'max_score' => 'required|numeric|min:0.1|max:5.0',
            'weight' => 'nullable|numeric|min:0.1|max:10',
            'grade_date' => 'nullable|date',
        ], [
            'max_score.max' => 'La puntuación máxima no puede ser mayor a 5.0',
        ]);
        
        Gate::authorize('access-class', [(int)$validated['subject_id'], (int)$validated['group_id']]);
        
        // Asignar periodo actual si no se especifica
        if (!isset($validated['academic_period_id'])) {
            $currentPeriod = AcademicPeriod::getPeriodoActual();
            $validated['academic_period_id'] = $currentPeriod?->id;
        }
        
        // Validar periodo habilitado
        if (!$this->validatePeriodEnabled($validated['academic_period_id'])) {
            return response()->json([
                'message' => 'El periodo académico no permite la carga de notas.',
                'error' => 'period_disabled'
            ], 403);
        }
        
        $manualGradeId = DB::table('manual_grades')->insertGetId([
            'subject_id' => $validated['subject_id'],
            'group_id' => $validated['group_id'],
            'academic_period_id' => $validated['academic_period_id'],
            'teacher_id' => Auth::id(),
            'title' => $validated['title'],
            'description' => $validated['description'] ?? null,
            'max_score' => $validated['max_score'],
            'weight' => $validated['weight'] ?? 1,
            'grade_date' => $validated['grade_date'] ?? now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        return response()->json([
            'success' => true,
            'message' => 'Registro creado',
            'manual_grade_id' => $manualGradeId
        ]);
    }
    
    /**
     * ✅ Guardar calificación manual
     */
    public function saveManualGradeScore(Request $request)
    {
        $validated = $request->validate([
            'manual_grade_id' => 'required|integer',
            'student_id' => 'required|integer',
            'score' => 'nullable|numeric|min:0|max:5.0',
            'feedback' => 'nullable|string',
        ]);
        
        $manualGrade = DB::table('manual_grades')
            ->where('id', $validated['manual_grade_id'])
            ->first();
        
        if (!$manualGrade || $manualGrade->teacher_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }
        
        // Validar periodo
        if (!$this->validatePeriodEnabled($manualGrade->academic_period_id)) {
            return response()->json([
                'message' => 'El periodo no permite calificaciones.',
                'error' => 'period_disabled'
            ], 403);
        }
        
        // Validar score
        if ($validated['score'] !== null && $validated['score'] > $manualGrade->max_score) {
            return response()->json([
                'message' => "La calificación no puede exceder {$manualGrade->max_score}"
            ], 422);
        }
        
        DB::table('manual_grade_scores')->updateOrInsert(
            [
                'manual_grade_id' => $validated['manual_grade_id'],
                'student_id' => $validated['student_id'],
            ],
            [
                'score' => $validated['score'],
                'feedback' => $validated['feedback'] ?? null,
                'graded_at' => now(),
                'updated_at' => now(),
            ]
        );
        
        return response()->json([
            'success' => true,
            'message' => 'Calificación guardada'
        ]);
    }
    
    /**
     * ✅ Eliminar nota manual
     */
    public function deleteManualGrade($id)
    {
        $manualGrade = DB::table('manual_grades')
            ->where('id', $id)
            ->first();
        
        if (!$manualGrade || $manualGrade->teacher_id !== Auth::id()) {
            return response()->json(['message' => 'No autorizado'], 403);
        }
        
        // Validar periodo
        if (!$this->validatePeriodEnabled($manualGrade->academic_period_id)) {
            return response()->json([
                'message' => 'El periodo no permite eliminar evaluaciones.',
                'error' => 'period_disabled'
            ], 403);
        }
        
        DB::beginTransaction();
        try {
            DB::table('manual_grade_scores')
                ->where('manual_grade_id', $id)
                ->delete();
            
            DB::table('manual_grades')->where('id', $id)->delete();
            
            DB::commit();
            
            return response()->json([
                'success' => true,
                'message' => 'Registro eliminado'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error al eliminar'
            ], 500);
        }
    }
}