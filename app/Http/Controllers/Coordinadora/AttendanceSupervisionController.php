<?php

namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Group;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceSupervisionController extends Controller
{
    /**
     * Vista principal de control de asistencia
     */
    public function index(Request $request)
    {
        $this->authorize('viewAll', Attendance::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));
        $groupId = $request->get('group_id');

        $groups = Group::with('grade')->get();

        // Estadísticas globales
        $totalAttendances = Attendance::whereBetween('date', [$startDate, $endDate])->count();
        $presentCount = Attendance::whereBetween('date', [$startDate, $endDate])
            ->where('status', 'present')
            ->count();
        $absentCount = Attendance::whereBetween('date', [$startDate, $endDate])
            ->where('status', 'absent')
            ->count();
        
        $attendanceRate = $totalAttendances > 0 
            ? round(($presentCount / $totalAttendances) * 100, 2)
            : 0;

        // Estudiantes críticos (con alta inasistencia)
        $criticalStudents = $this->getHighAbsenceData(20);

        // Periodo actual
        $currentPeriod = \App\Models\AcademicPeriod::getPeriodoActivo();

        return Inertia::render('Coordinadora/AsistenciaSupervision', [
            'groups' => $groups,
            'current_period' => $currentPeriod,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'group_id' => $groupId,
            ],
            'stats' => [
                'overallAttendance' => $attendanceRate,
                'todayAbsences' => Attendance::where('date', now()->toDateString())
                    ->where('status', 'absent')
                    ->count(),
                'criticalStudents' => $criticalStudents,
                'highRiskGroups' => 0, // Podría calcularse después
            ],
        ]);
    }

    /**
     * Obtener asistencia global
     */
    public function globalAttendance(Request $request)
    {
        $this->authorize('viewAll', Attendance::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        $attendanceData = Attendance::with(['user', 'subjectGroup.subject', 'subjectGroup.group'])
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'desc')
            ->paginate(50);

        return response()->json($attendanceData);
    }

    /**
     * Obtener asistencia por grupo
     */
    public function byGroup(Request $request, $groupId)
    {
        $this->authorize('viewAll', Attendance::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        $group = Group::with(['students', 'subjects'])->findOrFail($groupId);

        // Asistencia por estudiante
        $attendanceByStudent = [];

        foreach ($group->students as $student) {
            $totalClasses = Attendance::where('user_id', $student->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->count();

            $presentCount = Attendance::where('user_id', $student->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'present')
                ->count();

            $absentCount = Attendance::where('user_id', $student->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'absent')
                ->count();

            $lateCount = Attendance::where('user_id', $student->id)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'late')
                ->count();

            $attendanceRate = $totalClasses > 0 
                ? round(($presentCount / $totalClasses) * 100, 2)
                : 0;

            $attendanceByStudent[] = [
                'student_id' => $student->id,
                'student_name' => $student->name,
                'student_email' => $student->email,
                'total_classes' => $totalClasses,
                'present' => $presentCount,
                'absent' => $absentCount,
                'late' => $lateCount,
                'attendance_rate' => $attendanceRate,
            ];
        }

        // Ordenar por tasa de asistencia ascendente (los peores primero)
        usort($attendanceByStudent, function($a, $b) {
            return $a['attendance_rate'] <=> $b['attendance_rate'];
        });

        return response()->json([
            'group' => $group,
            'average' => $group->students->count() > 0 ? round(array_sum(array_column($attendanceByStudent, 'attendance_rate')) / $group->students->count(), 2) : 0,
            'totalRecords' => array_sum(array_column($attendanceByStudent, 'total_classes')),
            'director' => 'Director de Grupo', // Placeholder o relación si existe
            'students' => array_map(function($s) {
                return [
                    'name' => $s['student_name'],
                    'rate' => $s['attendance_rate'],
                    'present' => $s['present'],
                    'absent' => $s['absent'],
                    'late' => $s['late'],
                ];
            }, $attendanceByStudent),
        ]);
    }

    /**
     * Detectar estudiantes con alta inasistencia
     */
    public function highAbsenceAlert(Request $request)
    {
        $this->authorize('viewAll', Attendance::class);

        $threshold = $request->get('threshold', 20); // % mínimo de inasistencia
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        $students = User::role('estudiante')
            ->with(['groups'])
            ->get()
            ->map(function ($student) use ($startDate, $endDate, $threshold) {
                $totalClasses = Attendance::where('user_id', $student->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->count();

                $absentCount = Attendance::where('user_id', $student->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->where('status', 'absent')
                    ->count();

                $absenceRate = $totalClasses > 0 
                    ? round(($absentCount / $totalClasses) * 100, 2)
                    : 0;

                return [
                    'student_id' => $student->id,
                    'student_name' => $student->name,
                    'student_email' => $student->email,
                    'groups' => $student->groups->pluck('name'),
                    'total_classes' => $totalClasses,
                    'absent_count' => $absentCount,
                    'absence_rate' => $absenceRate,
                    'alert' => $absenceRate >= $threshold,
                ];
            })
            ->filter(function ($student) {
                return $student['alert'];
            })
            ->sortByDesc('absence_rate')
            ->values();

        return response()->json([
            'threshold' => $threshold,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
            'high_absence_students' => $students,
            'count' => $students->count(),
        ]);
    }

    /**
     * Exportar asistencia a Excel
     */
    public function export(Request $request)
    {
        $this->authorize('export', Attendance::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));
        $groupId = $request->get('group_id');

        $query = Attendance::with(['user', 'subjectGroup.subject', 'subjectGroup.group'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($groupId) {
            $query->whereHas('subjectGroup', function($q) use ($groupId) {
                $q->where('group_id', $groupId);
            });
        }

        $attendances = $query->orderBy('date', 'desc')->get();

        // Aquí implementarías la lógica de exportación a Excel
        // Por ahora retornamos JSON para el ejemplo
        return response()->json([
            'message' => 'Exportación preparada',
            'records' => $attendances->count(),
            'data' => $attendances,
        ]);
    }

    /**
     * Resumen estadístico de asistencia
     */
    public function statistics(Request $request)
    {
        $this->authorize('viewAll', Attendance::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        // Asistencia por día
        $dailyStats = Attendance::select(
                DB::raw('DATE(date) as day'),
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present'),
                DB::raw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent'),
                DB::raw('SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late')
            )
            ->whereBetween('date', [$startDate, $endDate])
            ->groupBy('day')
            ->orderBy('day', 'asc')
            ->get();

        // Asistencia por grupo
        $groupStats = Group::with('grade')
            ->get()
            ->map(function ($group) use ($startDate, $endDate) {
                $total = Attendance::whereHas('subjectGroup', function($q) use ($group) {
                    $q->where('group_id', $group->id);
                })
                ->whereBetween('date', [$startDate, $endDate])
                ->count();

                $present = Attendance::whereHas('subjectGroup', function($q) use ($group) {
                    $q->where('group_id', $group->id);
                })
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'present')
                ->count();

                $rate = $total > 0 ? round(($present / $total) * 100, 2) : 0;

                return [
                    'group_id' => $group->id,
                    'group_name' => $group->name,
                    'grade_name' => $group->grade->name ?? 'N/A',
                    'total_records' => $total,
                    'present_count' => $present,
                    'attendance_rate' => $rate,
                ];
            })
            ->sortByDesc('attendance_rate')
            ->values();

        return response()->json([
            'daily_statistics' => $dailyStats,
            'group_statistics' => $groupStats,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ]);
    }
    /**
     * Helper para obtener datos de inasistencia (reutilizable)
     */
    private function getHighAbsenceData($threshold)
    {
        return User::role('estudiante')
            ->with(['groups'])
            ->get()
            ->map(function ($student) use ($threshold) {
                $totalClasses = Attendance::where('user_id', $student->id)->count();
                $absentCount = Attendance::where('user_id', $student->id)
                    ->where('status', 'absent')
                    ->count();

                $rate = $totalClasses > 0 ? round(($absentCount / $totalClasses) * 100, 2) : 0;

                return [
                    'name' => $student->name,
                    'group' => $student->groups->first()->name ?? 'N/A',
                    'absences' => $absentCount,
                    'rate' => $rate,
                ];
            })
            ->filter(fn($s) => $s['rate'] >= $threshold)
            ->sortByDesc('rate')
            ->take(5)
            ->values();
    }
}
