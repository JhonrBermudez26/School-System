<?php
// app/Services/PerformanceAnalyticsService.php

namespace App\Services;

use App\Models\AcademicPeriod;
use App\Models\Group;
use App\Models\Subject;
use App\Models\User;
use App\Models\TaskSubmission;
use App\Models\ManualGrade;
use App\Models\Attendance;
use App\Models\PerformanceSetting;
use Illuminate\Support\Facades\DB;

class PerformanceAnalyticsService
{
    protected $settings;

    public function __construct()
    {
        $this->settings = PerformanceSetting::current();
    }

    /**
     * Obtener KPIs principales del periodo
     */
    public function getMainKPIs($periodId, $gradeId = null)
    {
        $period = AcademicPeriod::findOrFail($periodId);
        
        // Obtener estudiantes con filtro opcional de grado
        $studentsQuery = User::role('estudiante')
            ->where('is_active', true)
            ->whereHas('groups');

        if ($gradeId) {
            $studentsQuery->whereHas('groups', function($q) use ($gradeId) {
                $q->where('grade_id', $gradeId);
            });
        }

        $students = $studentsQuery->get();
        $totalStudents = $students->count();
        
        if ($totalStudents === 0) {
            return $this->emptyKPIs();
        }

        $studentsData = $students->map(function ($student) use ($period) {
            return [
                'student_id' => $student->id,
                'average' => $this->calculateStudentAverage($student->id, $period->id),
            ];
        });

        $averages = $studentsData->pluck('average')->filter(fn($avg) => $avg > 0);
        
        if ($averages->isEmpty()) {
            return $this->emptyKPIs();
        }

        $institutionalAverage = $averages->avg();
        $approvedCount = $averages->filter(fn($avg) => $avg >= $this->settings->min_passing_grade)->count();
        $failedCount = $averages->filter(fn($avg) => $avg < $this->settings->min_passing_grade)->count();

        return [
            'institutional_average' => round($institutionalAverage, 2),
            'approval_rate' => $totalStudents > 0 ? round(($approvedCount / $totalStudents) * 100, 2) : 0,
            'failure_rate' => $totalStudents > 0 ? round(($failedCount / $totalStudents) * 100, 2) : 0,
            'total_students' => $totalStudents,
            'approved_students' => $approvedCount,
            'failed_students' => $failedCount,
        ];
    }

    /**
     * Rendimiento por grado
     */
    public function getPerformanceByGrade($periodId, $gradeId = null)
    {
        $query = Group::with(['users' => function($query) {
            $query->role('estudiante')->where('is_active', true);
        }, 'grade']);

        if ($gradeId) {
            $query->where('grade_id', $gradeId);
        }

        $groups = $query->get();

        return $groups->groupBy(function($group) {
            return $group->grade->nombre ?? 'Sin grado';
        })->map(function ($gradeGroups, $gradeName) use ($periodId) {
            $students = $gradeGroups->flatMap->users;
            
            if ($students->isEmpty()) {
                return [
                    'grade' => $gradeName,
                    'average' => 0,
                    'student_count' => 0,
                ];
            }

            $averages = $students->map(function ($student) use ($periodId) {
                return $this->calculateStudentAverage($student->id, $periodId);
            })->filter(fn($avg) => $avg > 0);

            return [
                'grade' => $gradeName,
                'average' => $averages->isEmpty() ? 0 : round($averages->avg(), 2),
                'student_count' => $students->count(),
            ];
        })->values()->sortBy('grade');
    }

    /**
     * Rendimiento por grupo
     */
    public function getPerformanceByGroup($periodId, $gradeId = null)
    {
        $query = Group::with(['users' => function($query) {
            $query->role('estudiante')->where('is_active', true);
        }, 'grade']);

        if ($gradeId) {
            $query->where('grade_id', $gradeId);
        }

        $groups = $query->get();

        return $groups->map(function ($group) use ($periodId) {
            $students = $group->users;
            
            if ($students->isEmpty()) {
                return [
                    'group_id' => $group->id,
                    'group_name' => $group->nombre,
                    'grade' => $group->grade->nombre ?? 'N/A',
                    'average' => 0,
                    'failed_percentage' => 0,
                    'highest_grade' => 0,
                    'lowest_grade' => 0,
                    'student_count' => 0,
                ];
            }

            $averages = $students->map(function ($student) use ($periodId) {
                return $this->calculateStudentAverage($student->id, $periodId);
            })->filter(fn($avg) => $avg > 0);

            if ($averages->isEmpty()) {
                return [
                    'group_id' => $group->id,
                    'group_name' => $group->nombre,
                    'grade' => $group->grade->nombre ?? 'N/A',
                    'average' => 0,
                    'failed_percentage' => 0,
                    'highest_grade' => 0,
                    'lowest_grade' => 0,
                    'student_count' => $students->count(),
                ];
            }

            $failedCount = $averages->filter(fn($avg) => $avg < $this->settings->min_passing_grade)->count();

            return [
                'group_id' => $group->id,
                'group_name' => $group->nombre,
                'grade' => $group->grade->nombre ?? 'N/A',
                'average' => round($averages->avg(), 2),
                'failed_percentage' => $students->count() > 0 
                    ? round(($failedCount / $students->count()) * 100, 2) 
                    : 0,
                'highest_grade' => round($averages->max(), 2),
                'lowest_grade' => round($averages->min(), 2),
                'student_count' => $students->count(),
            ];
        })->sortByDesc('average')->values();
    }

    /**
     * Rendimiento por asignatura
     */
    public function getPerformanceBySubject($periodId, $previousPeriodId = null)
    {
        $subjects = Subject::all();

        return $subjects->map(function ($subject) use ($periodId, $previousPeriodId) {
            $currentAverage = $this->calculateSubjectAverage($subject->id, $periodId);
            $previousAverage = $previousPeriodId 
                ? $this->calculateSubjectAverage($subject->id, $previousPeriodId) 
                : null;

            $variation = null;
            if ($previousAverage && $previousAverage > 0) {
                $variation = (($currentAverage - $previousAverage) / $previousAverage) * 100;
            }

            $failureRate = $this->calculateSubjectFailureRate($subject->id, $periodId);

            // Obtener el profesor asignado
            $teacher = DB::table('subject_group')
                ->join('users', 'subject_group.user_id', '=', 'users.id')
                ->where('subject_group.subject_id', $subject->id)
                ->select('users.name')
                ->first();

            return [
                'subject_id' => $subject->id,
                'subject_name' => $subject->name,
                'subject_code' => $subject->code,
                'teacher_name' => $teacher ? $teacher->name : 'Sin asignar',
                'average' => round($currentAverage, 2),
                'previous_average' => $previousAverage ? round($previousAverage, 2) : null,
                'variation' => $variation ? round($variation, 2) : null,
                'failure_rate' => round($failureRate, 2),
            ];
        })->sortBy('subject_name')->values();
    }

    /**
     * Comparativo entre periodos
     */
    public function getPeriodComparison($currentPeriodId, $previousPeriodId)
    {
        $currentKPIs = $this->getMainKPIs($currentPeriodId);
        $previousKPIs = $this->getMainKPIs($previousPeriodId);

        $averageVariation = $previousKPIs['institutional_average'] > 0
            ? (($currentKPIs['institutional_average'] - $previousKPIs['institutional_average']) / $previousKPIs['institutional_average']) * 100
            : 0;

        return [
            'current_period' => [
                'id' => $currentPeriodId,
                'average' => $currentKPIs['institutional_average'],
                'approval_rate' => $currentKPIs['approval_rate'],
            ],
            'previous_period' => [
                'id' => $previousPeriodId,
                'average' => $previousKPIs['institutional_average'],
                'approval_rate' => $previousKPIs['approval_rate'],
            ],
            'variation' => round($averageVariation, 2),
            'trend' => $averageVariation > 0 ? 'up' : ($averageVariation < 0 ? 'down' : 'stable'),
        ];
    }

    /**
     * Ranking institucional
     */
    public function getInstitutionalRanking($periodId)
    {
        $groupsPerformance = $this->getPerformanceByGroup($periodId);

        return [
            'top_performers' => $groupsPerformance->take(5),
            'worst_performers' => $groupsPerformance->sortBy('average')->take(5)->values(),
            'highest_failure' => $groupsPerformance->sortByDesc('failed_percentage')->take(5)->values(),
        ];
    }

    /**
     * Distribución de notas
     */
    public function getGradeDistribution($periodId)
    {
        $students = User::role('estudiante')->where('is_active', true)->get();

        $ranges = [
            '0.0-2.9' => 0,
            '3.0-3.9' => 0,
            '4.0-4.5' => 0,
            '4.6-5.0' => 0,
        ];

        foreach ($students as $student) {
            $average = $this->calculateStudentAverage($student->id, $periodId);
            
            if ($average === 0) continue;
            
            if ($average < 3.0) {
                $ranges['0.0-2.9']++;
            } elseif ($average < 4.0) {
                $ranges['3.0-3.9']++;
            } elseif ($average <= 4.5) {
                $ranges['4.0-4.5']++;
            } else {
                $ranges['4.6-5.0']++;
            }
        }

        return $ranges;
    }

    /**
     * Estudiantes en riesgo académico
     */
    public function getAtRiskStudents($periodId)
    {
        $students = User::role('estudiante')
            ->where('is_active', true)
            ->whereHas('groups')
            ->get();

        $atRiskStudents = [];

        foreach ($students as $student) {
            $average = $this->calculateStudentAverage($student->id, $periodId);
            
            if ($average === 0) continue;
            
            $failedSubjects = $this->getFailedSubjectsCount($student->id, $periodId);
            $absenceRate = $this->getAbsenceRate($student->id, $periodId);

            $isAtRisk = false;
            $reasons = [];

            if ($average < $this->settings->min_passing_grade) {
                $isAtRisk = true;
                $reasons[] = "Promedio bajo ({$average})";
            }

            if ($failedSubjects > $this->settings->max_failed_subjects) {
                $isAtRisk = true;
                $reasons[] = "{$failedSubjects} materias perdidas";
            }

            if ($absenceRate > $this->settings->critical_absence_rate) {
                $isAtRisk = true;
                $reasons[] = "{$absenceRate}% inasistencia";
            }

            if ($isAtRisk) {
                $group = $student->groups->first();
                $atRiskStudents[] = [
                    'student_id' => $student->id,
                    'student_name' => $student->name . ' ' . $student->last_name,
                    'document_number' => $student->document_number,
                    'group_name' => $group ? $group->nombre : 'Sin grupo',
                    'average' => round($average, 2),
                    'failed_subjects' => $failedSubjects,
                    'absence_rate' => round($absenceRate, 2),
                    'risk_reasons' => $reasons,
                ];
            }
        }

        return collect($atRiskStudents)->sortBy('average')->values();
    }

    /**
     * Calcular promedio de un estudiante en un periodo
     */
    protected function calculateStudentAverage($studentId, $periodId)
    {
        // 1. Obtener notas de tareas
        $taskScores = TaskSubmission::where('student_id', $studentId)
            ->where('status', 'graded')
            ->whereNotNull('score')
            ->whereHas('task', function ($query) use ($periodId) {
                $query->where('academic_period_id', $periodId);
            })
            ->pluck('score');

        // 2. Obtener notas manuales
        $manualScores = ManualGrade::where('academic_period_id', $periodId)
            ->whereHas('scores', function ($query) use ($studentId) {
                $query->where('student_id', $studentId);
            })
            ->with(['scores' => function($query) use ($studentId) {
                $query->where('student_id', $studentId);
            }])
            ->get()
            ->flatMap(function ($manualGrade) {
                return $manualGrade->scores->pluck('score');
            });

        $allScores = $taskScores->concat($manualScores)->filter();

        return $allScores->isEmpty() ? 0 : $allScores->avg();
    }

    /**
     * Calcular promedio de una asignatura
     */
    protected function calculateSubjectAverage($subjectId, $periodId)
    {
        $taskScores = TaskSubmission::where('status', 'graded')
            ->whereNotNull('score')
            ->whereHas('task', function ($query) use ($subjectId, $periodId) {
                $query->where('subject_id', $subjectId)
                      ->where('academic_period_id', $periodId);
            })
            ->pluck('score');

        $manualScores = ManualGrade::where('subject_id', $subjectId)
            ->where('academic_period_id', $periodId)
            ->with('scores')
            ->get()
            ->flatMap(function ($manualGrade) {
                return $manualGrade->scores->pluck('score');
            });

        $allScores = $taskScores->concat($manualScores)->filter();

        return $allScores->isEmpty() ? 0 : $allScores->avg();
    }

    /**
     * Calcular tasa de reprobación de una asignatura
     */
    protected function calculateSubjectFailureRate($subjectId, $periodId)
    {
        $students = User::role('estudiante')->where('is_active', true)->get();
        $totalStudents = $students->count();

        if ($totalStudents === 0) return 0;

        $failedCount = 0;

        foreach ($students as $student) {
            $average = $this->calculateStudentSubjectAverage($student->id, $subjectId, $periodId);
            if ($average > 0 && $average < $this->settings->min_passing_grade) {
                $failedCount++;
            }
        }

        return ($failedCount / $totalStudents) * 100;
    }

    /**
     * Calcular promedio de un estudiante en una asignatura específica
     */
    protected function calculateStudentSubjectAverage($studentId, $subjectId, $periodId)
    {
        $taskScores = TaskSubmission::where('student_id', $studentId)
            ->where('status', 'graded')
            ->whereNotNull('score')
            ->whereHas('task', function ($query) use ($subjectId, $periodId) {
                $query->where('subject_id', $subjectId)
                      ->where('academic_period_id', $periodId);
            })
            ->pluck('score');

        $manualScores = ManualGrade::where('subject_id', $subjectId)
            ->where('academic_period_id', $periodId)
            ->whereHas('scores', function ($query) use ($studentId) {
                $query->where('student_id', $studentId);
            })
            ->with(['scores' => function($query) use ($studentId) {
                $query->where('student_id', $studentId);
            }])
            ->get()
            ->flatMap(function ($manualGrade) {
                return $manualGrade->scores->pluck('score');
            });

        $allScores = $taskScores->concat($manualScores)->filter();

        return $allScores->isEmpty() ? 0 : $allScores->avg();
    }

    /**
     * Contar materias perdidas de un estudiante
     */
    protected function getFailedSubjectsCount($studentId, $periodId)
    {
        $subjects = Subject::all();
        $failedCount = 0;

        foreach ($subjects as $subject) {
            $average = $this->calculateStudentSubjectAverage($studentId, $subject->id, $periodId);
            if ($average > 0 && $average < $this->settings->min_passing_grade) {
                $failedCount++;
            }
        }

        return $failedCount;
    }

    /**
     * Calcular tasa de inasistencia
     */
    protected function getAbsenceRate($studentId, $periodId)
    {
        $totalDays = Attendance::where('academic_period_id', $periodId)
            ->distinct('attendance_date')
            ->count('attendance_date');

        if ($totalDays === 0) return 0;

        $absentDays = Attendance::where('student_id', $studentId)
            ->where('academic_period_id', $periodId)
            ->where('status', 'absent')
            ->count();

        return ($absentDays / $totalDays) * 100;
    }

    /**
     * KPIs vacíos
     */
    protected function emptyKPIs()
    {
        return [
            'institutional_average' => 0,
            'approval_rate' => 0,
            'failure_rate' => 0,
            'total_students' => 0,
            'approved_students' => 0,
            'failed_students' => 0,
        ];
    }

    /**
     * Obtener todos los datos para exportación
     */
    public function getExportData($periodId, $gradeId = null)
    {
        return [
            'kpis' => $this->getMainKPIs($periodId, $gradeId),
            'by_grade' => $this->getPerformanceByGrade($periodId, $gradeId),
            'by_group' => $this->getPerformanceByGroup($periodId, $gradeId),
            'by_subject' => $this->getPerformanceBySubject($periodId),
            'ranking' => $this->getInstitutionalRanking($periodId),
            'distribution' => $this->getGradeDistribution($periodId),
            'at_risk' => $this->getAtRiskStudents($periodId),
        ];
    }
}