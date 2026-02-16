<?php

namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\ManualGrade;
use App\Models\Group;
use App\Models\Subject;
use App\Models\AcademicPeriod;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class SupervisionController extends Controller
{
    /**
     * Vista principal de supervisión académica
     */
    public function index(Request $request)
    {
        $this->authorize('viewAll', ManualGrade::class);

        $periodId = $request->get('period_id');
        $groupId = $request->get('group_id');
        $subjectId = $request->get('subject_id');

        // Obtener periodos para el selector
        $periods = AcademicPeriod::notArchived()->ordenado()->get();
        $groups = Group::with('grade')->get();
        $subjects = Subject::all();

        // Periodo activo por defecto
        $selectedPeriod = $periodId 
            ? AcademicPeriod::find($periodId)
            : AcademicPeriod::getPeriodoActivo();

        // Estadísticas institucionales
        $totalStudents = User::role('estudiante')->count();
        $overallAverage = \App\Models\ManualGrade::avg('score') ?? 0;
        
        // Estudiantes en riesgo (promedio < 3.0)
        $riskStudents = User::role('estudiante')
            ->get()
            ->map(function($student) {
                $avg = \App\Models\ManualGrade::where('user_id', $student->id)->avg('score') ?? 0;
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
                'riskStudentsList' => $riskStudents->map(fn($s) => [
                    'name' => $s['student']->name,
                    'group_name' => $s['student']->groups->first()->name ?? 'N/A',
                    'average' => $s['average'],
                    'failedCount' => \App\Models\ManualGrade::where('user_id', $s['student']->id)
                        ->where('score', '<', 3.0)
                        ->count()
                ])->values(),
            ],
            'filters' => [
                'period_id' => $periodId,
                'group_id' => $groupId,
                'subject_id' => $subjectId,
            ],
        ]);
    }

    /**
     * Obtener resumen académico por grupo
     */
    public function academicByGroup(Request $request)
    {
        $this->authorize('viewAll', ManualGrade::class);

        $groupId = $request->get('group_id');
        $periodId = $request->get('period_id');

        if (!$groupId || !$periodId) {
            return response()->json(['error' => 'Grupo y periodo requeridos'], 400);
        }

        $group = Group::with(['students', 'subjects'])->findOrFail($groupId);
        $period = AcademicPeriod::findOrFail($periodId);

        // Obtener notas por estudiante y asignatura
        $academicData = [];

        foreach ($group->students as $student) {
            $studentData = [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'subjects' => [],
                'average' => 0,
            ];

            $totalGrades = 0;
            $gradeCount = 0;

            foreach ($group->subjects as $subject) {
                $grades = ManualGrade::where('subject_group_id', function($query) use ($subject, $group) {
                    $query->select('id')
                        ->from('subject_group')
                        ->where('subject_id', $subject->id)
                        ->where('group_id', $group->id)
                        ->limit(1);
                })
                ->where('academic_period_id', $periodId)
                ->get();

                $score = $grades->where('user_id', $student->id)->first();

                $studentData['subjects'][] = [
                    'subject_name' => $subject->name,
                    'score' => $score ? $score->score : null,
                ];

                if ($score && $score->score) {
                    $totalGrades += $score->score;
                    $gradeCount++;
                }
            }

            $studentData['average'] = $gradeCount > 0 ? round($totalGrades / $gradeCount, 2) : 0;
            $academicData[] = [
                'name' => $student->name,
                'average' => $studentData['average']
            ];
        }

        // Promedio por asignatura en el grupo
        $subjectStats = $group->subjects->map(function($subject) use ($groupId, $periodId) {
            $avg = ManualGrade::whereHas('subjectGroup', function($q) use ($subject, $groupId) {
                    $q->where('subject_id', $subject->id)->where('group_id', $groupId);
                })
                ->where('academic_period_id', $periodId)
                ->avg('score') ?? 0;
            
            return [
                'name' => $subject->name,
                'average' => (float)$avg
            ];
        });

        return response()->json([
            'group' => $group,
            'period' => $period,
            'students' => $academicData,
            'subjects' => $subjectStats
        ]);
    }

    /**
     * Obtener resumen académico por asignatura
     */
    public function academicBySubject(Request $request)
    {
        $this->authorize('viewAll', ManualGrade::class);

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
                'group_name' => $group->name,
                'students' => [],
                'average' => 0,
            ];

            $totalGrades = 0;
            $gradeCount = 0;

            foreach ($group->students as $student) {
                $score = ManualGrade::where('subject_group_id', function($query) use ($subject, $group) {
                    $query->select('id')
                        ->from('subject_group')
                        ->where('subject_id', $subject->id)
                        ->where('group_id', $group->id)
                        ->limit(1);
                })
                ->where('academic_period_id', $periodId)
                ->where('user_id', $student->id)
                ->first();

                $scoreValue = $score ? $score->score : null;

                $groupData['students'][] = [
                    'student_name' => $student->name,
                    'score' => $scoreValue,
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
        $this->authorize('viewAll', ManualGrade::class);

        $periodId = $request->get('period_id');
        $threshold = $request->get('threshold', 3.0); // Nota mínima por defecto

        if (!$periodId) {
            return response()->json(['error' => 'Periodo requerido'], 400);
        }

        // Obtener estudiantes con promedio bajo
        $lowPerformance = User::role('estudiante')
            ->with(['groups'])
            ->get()
            ->map(function ($student) use ($periodId, $threshold) {
                $grades = ManualGrade::where('user_id', $student->id)
                    ->where('academic_period_id', $periodId)
                    ->get();

                $average = $grades->avg('score') ?? 0;

                return [
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'student_email' => $student->email,
                    'groups' => $student->groups->pluck('name'),
                    'average' => round($average, 2),
                    'grade_count' => $grades->count(),
                    'below_threshold' => $average < $threshold && $average > 0,
                ];
            })
            ->filter(function ($student) {
                return $student['below_threshold'];
            })
            ->sortBy('average')
            ->values();

        return response()->json([
            'threshold' => $threshold,
            'low_performance_students' => $lowPerformance,
            'count' => $lowPerformance->count(),
        ]);
    }

    /**
     * Reporte de rendimiento general por periodo
     */
    public function performanceReport(Request $request)
    {
        $this->authorize('viewAll', ManualGrade::class);

        $periodId = $request->get('period_id');

        if (!$periodId) {
            return response()->json(['error' => 'Periodo requerido'], 400);
        }

        $period = AcademicPeriod::findOrFail($periodId);

        // Promedio institucional
        $institutionalAverage = ManualGrade::where('academic_period_id', $periodId)
            ->avg('score') ?? 0;

        // Ranking de grupos
        $groupRankings = Group::with('grade')
            ->get()
            ->map(function ($group) use ($periodId) {
                $average = ManualGrade::whereIn('user_id', $group->students->pluck('id'))
                    ->where('academic_period_id', $periodId)
                    ->avg('score') ?? 0;

                return [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'grade_name' => $group->grade->name ?? 'N/A',
                    'average' => round($average, 2),
                    'student_count' => $group->students->count(),
                ];
            })
            ->sortByDesc('average')
            ->values();

        // Ranking de asignaturas
        $subjectRankings = Subject::all()
            ->map(function ($subject) use ($periodId) {
                $average = ManualGrade::whereHas('subjectGroup', function($q) use ($subject) {
                    $q->where('subject_id', $subject->id);
                })
                ->where('academic_period_id', $periodId)
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
