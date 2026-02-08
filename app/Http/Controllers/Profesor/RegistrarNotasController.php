<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\TaskSubmission;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class RegistrarNotasController extends Controller
{
    /**
     * Vista principal de registro de notas
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        // Obtener todas las clases del profesor
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

        $classInfo = null;
        $students = [];
        $tasks = [];
        $manualGrades = [];
        $gradeMatrix = [];

        // Si se seleccionó una clase
        if ($request->has('subject_id') && $request->has('group_id')) {
            $subjectId = (int) $request->query('subject_id');
            $groupId = (int) $request->query('group_id');

            // Verificar acceso
            $exists = DB::table('subject_group')
                ->where('user_id', $user->id)
                ->where('subject_id', $subjectId)
                ->where('group_id', $groupId)
                ->exists();

            if (!$exists) {
                abort(403, 'No tienes acceso a esta clase');
            }

            // Obtener información de la clase
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

            // Obtener estudiantes del grupo
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

            // Obtener todas las tareas de la clase
            $tasks = Task::where('subject_id', $subjectId)
                ->where('group_id', $groupId)
                ->where('teacher_id', $user->id)
                ->orderBy('due_date', 'desc')
                ->get()
                ->map(function ($task) {
                    return [
                        'id' => $task->id,
                        'title' => $task->title,
                        // ✅ Convertir a float explícitamente
                        'max_score' => (float) $task->max_score,
                        'due_date' => $task->due_date,
                        'type' => 'task'
                    ];
                });

            // Obtener notas manuales (registros personalizados por el profesor)
            $manualGrades = DB::table('manual_grades')
                ->where('subject_id', $subjectId)
                ->where('group_id', $groupId)
                ->where('teacher_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($grade) {
                    return [
                        'id' => $grade->id,
                        'title' => $grade->title,
                        // ✅ Convertir a float explícitamente
                        'max_score' => (float) $grade->max_score,
                        'weight' => (float) ($grade->weight ?? 1),
                        'grade_date' => $grade->grade_date,
                        'type' => 'manual'
                    ];
                });

            // Construir matriz de calificaciones
            $gradeMatrix = [];
            
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

                // Calificaciones de tareas
                foreach ($tasks as $task) {
                    $submission = TaskSubmission::where('task_id', $task['id'])
                        ->where('student_id', $student->id)
                        ->first();

                    $score = null;
                    if ($submission && $submission->status === 'graded') {
                        // ✅ Convertir a float
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

                // Calificaciones manuales
                foreach ($manualGrades as $manualGrade) {
                    $grade = DB::table('manual_grade_scores')
                        ->where('manual_grade_id', $manualGrade['id'])
                        ->where('student_id', $student->id)
                        ->first();

                    // ✅ Convertir a float o null
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

                // Calcular promedio
                if ($gradeCount > 0) {
                    // Promedio ponderado normalizado a escala 0-5
                    $studentGrades['average'] = round(($totalScore / $gradeCount), 2);
                }

                $gradeMatrix[] = $studentGrades;
            }
        }

        return Inertia::render('Profesor/RegistrarNotas', [
            'asignaciones' => $asignaciones,
            'classInfo' => $classInfo,
            'students' => $students,
            'tasks' => $tasks,
            'manualGrades' => $manualGrades,
            'gradeMatrix' => $gradeMatrix,
        ]);
    }

    /**
     * Crear registro de nota manual
     */
    public function createManualGrade(Request $request)
    {
        $validated = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'max_score' => 'required|numeric|min:0.1|max:5.0',
            'weight' => 'nullable|numeric|min:0.1|max:10',
            'grade_date' => 'nullable|date',
        ], [
            'max_score.max' => 'La puntuación máxima no puede ser mayor a 5.0',
            'max_score.min' => 'La puntuación máxima debe ser al menos 0.1',
            'max_score.required' => 'La puntuación máxima es obligatoria',
            'max_score.numeric' => 'La puntuación máxima debe ser un número',
        ]);
        
        // Verificar acceso
        $exists = DB::table('subject_group')
            ->where('user_id', Auth::id())
            ->where('subject_id', $validated['subject_id'])
            ->where('group_id', $validated['group_id'])
            ->exists();
        
        if (!$exists) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        $manualGradeId = DB::table('manual_grades')->insertGetId([
            'subject_id' => $validated['subject_id'],
            'group_id' => $validated['group_id'],
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
            'message' => 'Registro de nota manual creado',
            'manual_grade_id' => $manualGradeId
        ]);
    }

    /**
     * Guardar calificación manual para un estudiante
     */
    public function saveManualGradeScore(Request $request)
    {
        $validated = $request->validate([
            'manual_grade_id' => 'required|integer',
            'student_id' => 'required|integer',
            'score' => 'nullable|numeric|min:0|max:5.0',
            'feedback' => 'nullable|string',
        ], [
            'score.max' => 'La calificación no puede ser mayor a 5.0',
            'score.min' => 'La calificación no puede ser menor a 0',
            'score.numeric' => 'La calificación debe ser un número',
        ]);

        // Verificar que el registro manual existe y pertenece al profesor
        $manualGrade = DB::table('manual_grades')
            ->where('id', $validated['manual_grade_id'])
            ->where('teacher_id', Auth::id())
            ->first();

        if (!$manualGrade) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        // Validar que el score no exceda el máximo configurado
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
     * Eliminar registro de nota manual
     */
    public function deleteManualGrade($id)
    {
        $manualGrade = DB::table('manual_grades')
            ->where('id', $id)
            ->where('teacher_id', Auth::id())
            ->first();

        if (!$manualGrade) {
            return response()->json(['message' => 'No autorizado'], 403);
        }

        DB::beginTransaction();
        try {
            // Eliminar calificaciones asociadas
            DB::table('manual_grade_scores')
                ->where('manual_grade_id', $id)
                ->delete();

            // Eliminar registro manual
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
                'message' => 'Error al eliminar el registro'
            ], 500);
        }
    }
}