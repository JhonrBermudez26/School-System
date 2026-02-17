<?php

namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\ManualGrade;
use App\Models\ManualGradeScore;
use App\Models\Group;
use App\Models\Subject;
use App\Models\AcademicPeriod;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SupervisionController extends Controller
{
    /**
     * Vista principal
     */
    public function index(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('grades.view_all')) {
            abort(403);
        }

        $periodId = $request->get('period_id');
        $groupId = $request->get('group_id');
        $subjectId = $request->get('subject_id');

        $periods = AcademicPeriod::notArchived()->ordenado()->get();
        
        $groups = Group::with(['grade', 'course'])->get()->map(function($group) {
            return [
                'id' => $group->id,
                'nombre' => $group->nombre,
                'name' => $group->nombre,
                'grade' => $group->grade ? [
                    'id' => $group->grade->id,
                    'nombre' => $group->grade->nombre ?? 'N/A',
                    'name' => $group->grade->nombre ?? 'N/A',
                ] : null,
            ];
        });
        
        $subjects = Subject::all();

        $selectedPeriod = $periodId 
            ? AcademicPeriod::find($periodId)
            : AcademicPeriod::getPeriodoActivo();

        $totalStudents = User::role('estudiante')->count();
        $overallAverage = ManualGradeScore::avg('score') ?? 0;
        
        $riskStudents = User::role('estudiante')
            ->get()
            ->map(function($student) {
                $avg = ManualGradeScore::where('student_id', $student->id)->avg('score') ?? 0;
                return ['student' => $student, 'average' => $avg];
            })
            ->filter(fn($s) => $s['average'] < 3.0 && $s['average'] > 0);

        return Inertia::render('Coordinadora/Supervision', [
            'periods' => $periods,
            'groups' => $groups,
            'subjects' => $subjects,
            'active_period' => $selectedPeriod,
            'stats' => [
                'totalStudents' => $totalStudents,
                'overallAverage' => (float)$overallAverage,
                'atRiskStudents' => $riskStudents->count(),
                'riskStudentsList' => $riskStudents->map(function($s) {
                    $group = $s['student']->groups()->first();
                    
                    return [
                        'name' => $s['student']->name,
                        'group_name' => $group ? $group->nombre : 'N/A',
                        'average' => $s['average'],
                        'failedCount' => ManualGradeScore::where('student_id', $s['student']->id)
                            ->where('score', '<', 3.0)
                            ->count()
                    ];
                })->values(),
            ],
            'filters' => [
                'period_id' => $periodId,
                'group_id' => $groupId,
                'subject_id' => $subjectId,
            ],
        ]);
    }

    /**
     * ✅ Obtener resumen académico por grupo (CON DEBUG)
     */
    public function academicByGroup(Request $request)
    {
        try {
            if (!auth()->user()->hasPermissionTo('grades.view_all')) {
                abort(403);
            }

            $groupId = $request->get('group_id');
            $periodId = $request->get('period_id');

            Log::info('academicByGroup called', [
                'group_id' => $groupId,
                'period_id' => $periodId,
            ]);

            if (!$groupId) {
                return response()->json(['error' => 'group_id es requerido'], 400);
            }

            // ✅ Si no hay periodo, usar el activo
            if (!$periodId) {
                $activePeriod = AcademicPeriod::getPeriodoActivo();
                $periodId = $activePeriod ? $activePeriod->id : null;
            }

            Log::info('Using period_id: ' . $periodId);

            $group = Group::with(['students', 'subjects', 'grade'])->findOrFail($groupId);
            
            Log::info('Group found', [
                'id' => $group->id,
                'nombre' => $group->nombre,
                'students_count' => $group->students->count(),
                'subjects_count' => $group->subjects->count(),
            ]);

            // ✅ Verificar si hay calificaciones
            $totalScores = ManualGradeScore::count();
            Log::info('Total scores in system: ' . $totalScores);

            $academicData = [];
            
            if ($group->students->isEmpty()) {
                Log::warning('No students found in group ' . $groupId);
            }

            foreach ($group->students as $student) {
                // Buscar calificaciones del estudiante
                $scoresQuery = ManualGradeScore::where('student_id', $student->id);
                
                if ($periodId) {
                    $scoresQuery->whereHas('manualGrade', function($q) use ($groupId, $periodId) {
                        $q->where('group_id', $groupId)
                          ->where('academic_period_id', $periodId);
                    });
                }
                
                $scores = $scoresQuery->get();
                $average = $scores->avg('score') ?? 0;

                Log::info('Student scores', [
                    'student' => $student->name,
                    'scores_count' => $scores->count(),
                    'average' => $average,
                ]);

                $academicData[] = [
                    'name' => $student->name,
                    'average' => round($average, 2)
                ];
            }

            // Promedio por asignatura
            $subjectStats = [];
            
            if ($group->subjects->isEmpty()) {
                Log::warning('No subjects found in group ' . $groupId);
            }

            foreach ($group->subjects as $subject) {
                $avgQuery = ManualGradeScore::whereHas('manualGrade', function($q) use ($subject, $groupId, $periodId) {
                    $q->where('subject_id', $subject->id)
                      ->where('group_id', $groupId);
                    
                    if ($periodId) {
                        $q->where('academic_period_id', $periodId);
                    }
                });
                
                $avg = $avgQuery->avg('score') ?? 0;
                
                Log::info('Subject average', [
                    'subject' => $subject->name,
                    'average' => $avg,
                ]);
                
                $subjectStats[] = [
                    'name' => $subject->name,
                    'average' => (float)round($avg, 2)
                ];
            }

            $response = [
                'group' => [
                    'id' => $group->id,
                    'name' => $group->nombre,
                    'grade' => $group->grade ? ($group->grade->nombre ?? 'N/A') : 'N/A',
                ],
                'period' => $periodId ? AcademicPeriod::find($periodId) : null,
                'students' => $academicData,
                'subjects' => $subjectStats
            ];

            Log::info('Response prepared', [
                'students_count' => count($academicData),
                'subjects_count' => count($subjectStats),
            ]);

            return response()->json($response);

        } catch (\Exception $e) {
            Log::error('Error in academicByGroup', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => basename($e->getFile()),
            ], 500);
        }
    }

    /**
     * Obtener resumen académico por asignatura
     */
    public function academicBySubject(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('grades.view_all')) {
            abort(403);
        }

        $subjectId = $request->get('subject_id');
        $periodId = $request->get('period_id');

        if (!$subjectId || !$periodId) {
            return response()->json(['error' => 'Asignatura y periodo requeridos'], 400);
        }

        $subject = Subject::with('groups')->findOrFail($subjectId);
        $period = AcademicPeriod::findOrFail($periodId);

        $subjectData = [];
        foreach ($subject->groups as $group) {
            $groupData = [
                'group_id' => $group->id,
                'group_name' => $group->nombre,
                'students' => [],
                'average' => 0,
            ];

            $totalGrades = 0;
            $gradeCount = 0;

            foreach ($group->students as $student) {
                $scores = ManualGradeScore::whereHas('manualGrade', function($query) use ($subject, $group, $periodId) {
                        $query->where('subject_id', $subject->id)
                              ->where('group_id', $group->id)
                              ->where('academic_period_id', $periodId);
                    })
                    ->where('student_id', $student->id)
                    ->get();

                $scoreValue = $scores->avg('score') ?? null;

                $groupData['students'][] = [
                    'student_name' => $student->name,
                    'score' => $scoreValue ? round($scoreValue, 2) : null,
                ];

                if ($scoreValue) {
                    $totalGrades += $scoreValue;
                    $gradeCount++;
                }
            }

            $groupData['average'] = $gradeCount > 0 ? round($totalGrades / $gradeCount, 2) : 0;
            $subjectData[] = $groupData;
        }

        return response()->json([
            'subject' => $subject,
            'period' => $period,
            'subject_data' => $subjectData,
        ]);
    }

    /**
     * Detectar estudiantes con bajo rendimiento
     */
    public function lowPerformanceStudents(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('grades.view_all')) {
            abort(403);
        }

        $periodId = $request->get('period_id');
        $threshold = $request->get('threshold', 3.0);

        if (!$periodId) {
            return response()->json(['error' => 'Periodo requerido'], 400);
        }

        $lowPerformance = User::role('estudiante')
            ->with(['groups'])
            ->get()
            ->map(function ($student) use ($periodId, $threshold) {
                $scores = ManualGradeScore::whereHas('manualGrade', function($q) use ($periodId) {
                        $q->where('academic_period_id', $periodId);
                    })
                    ->where('student_id', $student->id)
                    ->get();

                $average = $scores->avg('score') ?? 0;

                return [
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'student_email' => $student->email,
                    'groups' => $student->groups->pluck('nombre'),
                    'average' => round($average, 2),
                    'grade_count' => $scores->count(),
                    'below_threshold' => $average < $threshold && $average > 0,
                ];
            })
            ->filter(fn($student) => $student['below_threshold'])
            ->sortBy('average')
            ->values();

        return response()->json([
            'threshold' => $threshold,
            'low_performance_students' => $lowPerformance,
            'count' => $lowPerformance->count(),
        ]);
    }

    /**
     * Reporte de rendimiento general
     */
    public function performanceReport(Request $request)
    {
        if (!auth()->user()->hasPermissionTo('grades.view_all')) {
            abort(403);
        }

        $periodId = $request->get('period_id');

        if (!$periodId) {
            return response()->json(['error' => 'Periodo requerido'], 400);
        }

        $period = AcademicPeriod::findOrFail($periodId);

        $institutionalAverage = ManualGradeScore::whereHas('manualGrade', function($q) use ($periodId) {
                $q->where('academic_period_id', $periodId);
            })
            ->avg('score') ?? 0;

        $groupRankings = Group::with('grade')
            ->get()
            ->map(function ($group) use ($periodId) {
                $average = ManualGradeScore::whereIn('student_id', $group->students->pluck('id'))
                    ->whereHas('manualGrade', function($q) use ($periodId) {
                        $q->where('academic_period_id', $periodId);
                    })
                    ->avg('score') ?? 0;

                return [
                    'group_id' => $group->id,
                    'group_name' => $group->nombre,
                    'grade_name' => $group->grade->nombre ?? 'N/A',
                    'average' => round($average, 2),
                    'student_count' => $group->students->count(),
                ];
            })
            ->sortByDesc('average')
            ->values();

        $subjectRankings = Subject::all()
            ->map(function ($subject) use ($periodId) {
                $average = ManualGradeScore::whereHas('manualGrade', function($q) use ($subject, $periodId) {
                        $q->where('subject_id', $subject->id)
                          ->where('academic_period_id', $periodId);
                    })
                    ->avg('score') ?? 0;

                return [
                    'subject_id' => $subject->id,
                    'subject_name' => $subject->name,
                    'average' => round($average, 2),
                ];
            })
            ->sortByDesc('average')
            ->values();

        return response()->json([
            'period' => $period,
            'institutional_average' => round($institutionalAverage, 2),
            'group_rankings' => $groupRankings,
            'subject_rankings' => $subjectRankings,
        ]);
    }
}