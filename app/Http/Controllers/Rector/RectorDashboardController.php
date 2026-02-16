<?php

namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Group;
use App\Models\Subject;
use App\Models\ManualGrade;
use App\Models\Attendance;
use App\Models\AcademicPeriod;
use App\Models\DisciplineRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RectorDashboardController extends Controller
{
    /**
     * Panel ejecutivo del Rector con KPIs institucionales
     */
    public function index(Request $request)
    {
        // KPIs generales
        $totalStudents = User::role('estudiante')->count();
        $totalTeachers = User::role('profesor')->count();
        $totalGroups = Group::count();
        $totalSubjects = Subject::count();

        // Periodo actual
        $currentPeriod = AcademicPeriod::getPeriodoActivo();

        $stats = [
            'users' => [
                'students' => $totalStudents,
                'teachers' => $totalTeachers,
                'total' => User::count(),
            ],
            'academic' => [
                'groups' => $totalGroups,
                'subjects' => $totalSubjects,
                'current_period' => $currentPeriod?->name ?? 'No definido',
                'period_status' => $currentPeriod?->status ?? null,
            ],
        ];

        // Rendimiento académico (periodo actual)
        if ($currentPeriod) {
            $institutionalAverage = ManualGrade::where('academic_period_id', $currentPeriod->id)
                ->avg('score') ?? 0;

            $stats['performance'] = [
                'institutional_average' => round($institutionalAverage, 2),
                'total_grades' => ManualGrade::where('academic_period_id', $currentPeriod->id)->count(),
            ];

            // Tasa de asistencia
            $attendanceCount = Attendance::whereHas('subjectGroup.academicPeriod', function($q) use ($currentPeriod) {
                $q->where('id', $currentPeriod->id);
            })->count();

            $presentCount = Attendance::whereHas('subjectGroup.academicPeriod', function($q) use ($currentPeriod) {
                $q->where('id', $currentPeriod->id);
            })->where('status', 'present')->count();

            $attendanceRate = $attendanceCount > 0 
                ? round(($presentCount / $attendanceCount) * 100, 2)
                : 0;

            $stats['attendance'] = [
                'total_records' => $attendanceCount,
                'attendance_rate' => $attendanceRate,
            ];
        }

        // Registros disciplinarios (último mes)
        $disciplineRecords = DisciplineRecord::where('date', '>=', now()->subMonth())
            ->count();

        $openDisciplineRecords = DisciplineRecord::where('date', '>=', now()->subMonth())
            ->open()
            ->count();

        $stats['discipline'] = [
            'total_last_month' => $disciplineRecords,
            'open_records' => $openDisciplineRecords,
        ];

        // Tendencias (últimos 6 meses)
        $monthlyGrades = ManualGrade::select(
                DB::raw('YEAR(created_at) as year'),
                DB::raw('MONTH(created_at) as month'),
                DB::raw('AVG(score) as average')
            )
            ->where('created_at', '>=', now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get();

        $monthlyAttendance = Attendance::select(
                DB::raw('YEAR(date) as year'),
                DB::raw('MONTH(date) as month'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present')
            )
            ->where('date', '>=', now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year', 'asc')
            ->orderBy('month', 'asc')
            ->get()
            ->map(function($item) {
                $item->rate = $item->total > 0 ? round(($item->present / $item->total) * 100, 2) : 0;
                return $item;
            });

        return Inertia::render('Rector/Dashboard', [
            'stats' => $stats,
            'trends' => [
                'grades' => $monthlyGrades,
                'attendance' => $monthlyAttendance,
            ],
        ]);
    }

    /**
     * Vista detallada del rendimiento institucional
     */
    public function institutionalPerformance(Request $request)
    {
        $periodId = $request->get('period_id');

        $period = $periodId 
            ? AcademicPeriod::findOrFail($periodId)
            : AcademicPeriod::getPeriodoActivo();

        if (!$period) {
            return response()->json(['error' => 'No hay periodo activo'], 404);
        }

        // Promedio por grado
        $gradeAverages = DB::table('groups')
            ->join('grades', 'groups.id', '=', 'grades.id')
            ->leftJoin('users', function($join) {
                $join->on('users.id', '=', DB::raw('ANY(SELECT user_id FROM group_user WHERE group_id = groups.id)'));
            })
            ->leftJoin('manual_grades', function($join) use ($period) {
                $join->on('manual_grades.user_id', '=', 'users.id')
                     ->where('manual_grades.academic_period_id', '=', $period->id);
            })
            ->select(
                'grades.name as grade_name',
                DB::raw('AVG(manual_grades.score) as average'),
                DB::raw('COUNT(DISTINCT users.id) as student_count')
            )
            ->groupBy('grades.name')
            ->get();

        // Top 10 mejores promedios
        $topStudents = User::role('estudiante')
            ->select('users.id', 'users.name', 'users.email')
            ->selectRaw('AVG(manual_grades.score) as average')
            ->leftJoin('manual_grades', 'users.id', '=', 'manual_grades.user_id')
            ->where('manual_grades.academic_period_id', $period->id)
            ->groupBy('users.id', 'users.name', 'users.email')
            ->orderByDesc('average')
            ->limit(10)
            ->get();

        // Distribución de notas
        $gradeDistribution = ManualGrade::select(
                DB::raw('FLOOR(score) as grade_floor'),
                DB::raw('COUNT(*) as count')
            )
            ->where('academic_period_id', $period->id)
            ->groupBy('grade_floor')
            ->orderBy('grade_floor', 'asc')
            ->get();

        return response()->json([
            'period' => $period,
            'grade_averages' => $gradeAverages,
            'top_students' => $topStudents,
            'grade_distribution' => $gradeDistribution,
        ]);
    }
}
