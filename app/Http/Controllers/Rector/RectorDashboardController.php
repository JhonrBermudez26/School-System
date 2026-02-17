<?php

namespace App\Http\Controllers\Rector;

use App\Models\ActivityLog;
use App\Models\User;
use App\Models\Group;
use App\Models\Subject;
use App\Models\ManualGrade;
use App\Models\ManualGradeScore;
use App\Models\Attendance;
use App\Models\AcademicPeriod;
use App\Models\DisciplineRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\Controller;

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

        // Inicializar valores por defecto
        $institutionalAverage = 0;
        $attendanceRate = 0;

        // Rendimiento académico (periodo actual)
        if ($currentPeriod) {
            $institutionalAverage = ManualGradeScore::whereHas('manualGrade', function($q) use ($currentPeriod) {
                $q->where('academic_period_id', $currentPeriod->id);
            })->avg('score') ?? 0;

            // Tasa de asistencia
            $attendanceCount = Attendance::whereBetween('date', [
                $currentPeriod->start_date,
                $currentPeriod->end_date
            ])->count();

            $presentCount = Attendance::whereBetween('date', [
                $currentPeriod->start_date,
                $currentPeriod->end_date
            ])->where('status', 'present')->count();

            $attendanceRate = $attendanceCount > 0 
                ? round(($presentCount / $attendanceCount) * 100, 2)
                : 0;
        }

        // Registros disciplinarios (último mes)
        $openDisciplineRecords = DisciplineRecord::where('date', '>=', now()->subMonth())
            ->where('status', 'open')
            ->count();

        // Registros disciplinarios recientes (últimos 5)
        $recentDiscipline = DisciplineRecord::with('student')
            ->where('date', '>=', now()->subMonth())
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($record) {
                return [
                    'student' => [
                        'name' => $record->student->name ?? 'N/A'
                    ],
                    'severity_label' => ucfirst($record->severity ?? 'Leve'),
                    'time_ago' => $record->created_at->diffForHumans()
                ];
            });

        // Promedio por grado (último periodo)
        $performanceByGrade = [];
        if ($currentPeriod) {
            // Obtener todos los grados
            $grades = DB::table('grades')->get();
            
            foreach ($grades as $grade) {
                // Obtener grupos de este grado
                $groupIds = DB::table('groups')
                    ->where('grade_id', $grade->id)
                    ->pluck('id');
                
                if ($groupIds->isEmpty()) {
                    continue;
                }
                
                // Obtener estudiantes de estos grupos
                $studentIds = DB::table('group_user')
                    ->whereIn('group_id', $groupIds)
                    ->pluck('user_id');
                
                if ($studentIds->isEmpty()) {
                    $performanceByGrade[] = [
                        'name' => $grade->nombre, // ✅ CORREGIDO: usar 'nombre'
                        'average' => 0
                    ];
                    continue;
                }
                
                // Calcular promedio de calificaciones
                $average = ManualGradeScore::whereIn('student_id', $studentIds)
                    ->whereHas('manualGrade', function($q) use ($currentPeriod) {
                        $q->where('academic_period_id', $currentPeriod->id);
                    })
                    ->avg('score') ?? 0;
                
                $performanceByGrade[] = [
                    'name' => $grade->nombre, // ✅ CORREGIDO: usar 'nombre'
                    'average' => round($average, 2)
                ];
            }
        }

        // Actividad reciente del sistema (últimos 10 registros de auditoría)
        $recentActivity = ActivityLog::with('user')
            ->recent()
            ->limit(10)
            ->get()
            ->map(function($activity) {
                return [
                    'description' => $activity->getActionDescription(),
                    'user' => [
                        'name' => $activity->user?->name ?? 'Sistema'
                    ],
                    'created_at_human' => $activity->created_at->diffForHumans(),
                    'ip_address' => $activity->ip_address ?? 'N/A',
                    'action' => $activity->action
                ];
            });

        return Inertia::render('Rector/Dashboard', [
            'kpis' => [
                'totalStudents' => $totalStudents,
                'overallAverage' => round($institutionalAverage, 2),
                'attendanceRate' => $attendanceRate,
                'openDisciplineRecords' => $openDisciplineRecords,
                'studentsTrend' => null,
                'performanceTrend' => null,
                'attendanceTrend' => null,
            ],
            'performance' => [
                'byGrade' => $performanceByGrade
            ],
            'attendance' => [
                'rate' => $attendanceRate
            ],
            'discipline' => [
                'recentCracks' => $recentDiscipline
            ],
            'recentActivity' => $recentActivity
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
