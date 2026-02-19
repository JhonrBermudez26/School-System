<?php

namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Group;
use App\Models\User;
use App\Models\AttendanceAlert; // ⚠️ Crear este modelo si usas Opción 2
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

        // ✅ Cargar grupos con grade y course
        $groups = Group::with(['grade', 'course'])->get()->map(function($group) {
            return [
                'id' => $group->id,
                'name' => $group->nombre, // ✅ Usar 'nombre' directamente
                'grade' => $group->grade ? [
                    'id' => $group->grade->id,
                    'name' => $group->grade->name ?? $group->grade->nombre ?? 'N/A'
                ] : null,
                'course' => $group->course ? [
                    'id' => $group->course->id,
                    'name' => $group->course->name ?? $group->course->nombre ?? 'N/A'
                ] : null,
            ];
        });

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

        // Estudiantes críticos
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
                'highRiskGroups' => $this->countHighRiskGroups(),
            ],
        ]);
    }

    /**
     * Obtener asistencia por grupo
     */
    public function byGroup(Request $request, $groupId)
    {
        $this->authorize('viewAll', Attendance::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));

        $group = Group::with(['grade', 'course', 'students'])->findOrFail($groupId);

        // Asistencia por estudiante
        $attendanceByStudent = [];
        
        foreach ($group->students as $student) {
            $totalClasses = Attendance::where('user_id', $student->id)
                ->where('group_id', $groupId)
                ->whereBetween('date', [$startDate, $endDate])
                ->count();

            $presentCount = Attendance::where('user_id', $student->id)
                ->where('group_id', $groupId)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'present')
                ->count();

            $absentCount = Attendance::where('user_id', $student->id)
                ->where('group_id', $groupId)
                ->whereBetween('date', [$startDate, $endDate])
                ->where('status', 'absent')
                ->count();

            $lateCount = Attendance::where('user_id', $student->id)
                ->where('group_id', $groupId)
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

        // Ordenar por tasa de asistencia ascendente
        usort($attendanceByStudent, function($a, $b) {
            return $a['attendance_rate'] <=> $b['attendance_rate'];
        });

        $averageRate = count($attendanceByStudent) > 0 
            ? round(array_sum(array_column($attendanceByStudent, 'attendance_rate')) / count($attendanceByStudent), 2) 
            : 0;

        return response()->json([
            'group' => [
                'id' => $group->id,
                'name' => $group->nombre, // ✅ Usar 'nombre'
                'grade' => $group->grade ? ($group->grade->name ?? $group->grade->nombre ?? 'N/A') : 'N/A',
                'course' => $group->course ? ($group->course->name ?? $group->course->nombre ?? 'N/A') : 'N/A',
            ],
            'average' => $averageRate,
            'totalRecords' => array_sum(array_column($attendanceByStudent, 'total_classes')),
            'director' => 'Director de Grupo', // ✅ Si tienes esta relación, agrégala
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
     * ✅ OPCIÓN 2: Generar alertas con guardado en BD
     */
    public function generateAlerts(Request $request)
    {
        $this->authorize('viewAll', Attendance::class);

        $threshold = $request->get('threshold', 15);
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));
        
        $alertsCreated = 0;
        $alerts = [];

        User::role('estudiante')
            ->with(['groups.grade'])
            ->chunk(100, function ($students) use ($threshold, $startDate, $endDate, &$alertsCreated, &$alerts) {
                foreach ($students as $student) {
                    $total = Attendance::where('user_id', $student->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->count();
                    
                    $absent = Attendance::where('user_id', $student->id)
                        ->whereBetween('date', [$startDate, $endDate])
                        ->where('status', 'absent')
                        ->count();

                    if ($total == 0) continue;

                    $rate = round(($absent / $total) * 100, 2);

                    if ($rate >= $threshold) {
                        $severity = $rate >= 30 ? 'crítico' : ($rate >= 20 ? 'alto' : 'medio');
                        
                        $alerts[] = [
                            'student_id' => $student->id,
                            'student_name' => $student->name,
                            'student_email' => $student->email,
                            'group' => $student->groups->first() ? $student->groups->first()->nombre : 'N/A',
                            'grade' => $student->groups->first() && $student->groups->first()->grade 
                                ? ($student->groups->first()->grade->name ?? $student->groups->first()->grade->nombre ?? 'N/A')
                                : 'N/A',
                            'absence_rate' => $rate,
                            'absent_count' => $absent,
                            'total_classes' => $total,
                            'severity' => $severity,
                            'generated_at' => now()->toDateTimeString(),
                        ];
                        
                        $alertsCreated++;

                        // ⚠️ Si quieres guardar en BD (Opción 2), descomenta:
                        /*
                        AttendanceAlert::updateOrCreate(
                            [
                                'student_id' => $student->id,
                                'status' => 'pendiente',
                            ],
                            [
                                'group_id' => $student->groups->first()->id ?? null,
                                'absence_rate' => $rate,
                                'absent_count' => $absent,
                                'severity' => $severity,
                            ]
                        );
                        */
                    }
                }
            });

        return response()->json([
            'success' => true,
            'message' => "$alertsCreated alertas generadas",
            'alerts_count' => $alertsCreated,
            'alerts' => $alerts,
            'threshold' => $threshold,
            'date_range' => [
                'start' => $startDate,
                'end' => $endDate,
            ],
        ]);
    }

    /**
     * Exportar asistencia a CSV
     */
    public function export(Request $request)
    {
        $this->authorize('export', Attendance::class);

        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->endOfMonth()->format('Y-m-d'));
        $groupId = $request->get('group_id');

        $query = Attendance::with(['student', 'subject', 'group.grade', 'teacher'])
            ->whereBetween('date', [$startDate, $endDate]);

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        $attendances = $query->orderBy('date', 'desc')->get();

        $filename = 'asistencia_' . $startDate . '_' . $endDate . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv; charset=utf-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function() use ($attendances) {
            $file = fopen('php://output', 'w');
            
            // BOM para UTF-8
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            // Encabezados
            fputcsv($file, ['Fecha', 'Estudiante', 'Grupo', 'Grado', 'Asignatura', 'Estado', 'Profesor', 'Notas']);

            // Datos
            foreach ($attendances as $attendance) {
                fputcsv($file, [
                    $attendance->date->format('Y-m-d'),
                    $attendance->student->name ?? 'N/A',
                    $attendance->group->nombre ?? 'N/A',
                    $attendance->group && $attendance->group->grade 
                        ? ($attendance->group->grade->name ?? $attendance->group->grade->nombre ?? 'N/A')
                        : 'N/A',
                    $attendance->subject->name ?? $attendance->subject->nombre ?? 'N/A',
                    ucfirst($attendance->status),
                    $attendance->teacher->name ?? 'N/A',
                    $attendance->notes ?? '',
                ]);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Resumen estadístico
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
                $total = Attendance::where('group_id', $group->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->count();

                $present = Attendance::where('group_id', $group->id)
                    ->whereBetween('date', [$startDate, $endDate])
                    ->where('status', 'present')
                    ->count();

                $rate = $total > 0 ? round(($present / $total) * 100, 2) : 0;

                return [
                    'group_id' => $group->id,
                    'group_name' => $group->nombre,
                    'grade_name' => $group->grade ? ($group->grade->name ?? $group->grade->nombre ?? 'N/A') : 'N/A',
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
     * Helper: Estudiantes con alta inasistencia
     */
    private function getHighAbsenceData($threshold)
    {
        return User::role('estudiante')
            ->with(['groups.grade'])
            ->get()
            ->map(function ($student) use ($threshold) {
                $totalClasses = Attendance::where('user_id', $student->id)->count();
                $absentCount = Attendance::where('user_id', $student->id)
                    ->where('status', 'absent')
                    ->count();

                $rate = $totalClasses > 0 ? round(($absentCount / $totalClasses) * 100, 2) : 0;

                return [
                    'name' => $student->name,
                    'group' => $student->groups->first() ? $student->groups->first()->nombre : 'N/A',
                    'absences' => $absentCount,
                    'rate' => $rate,
                ];
            })
            ->filter(fn($s) => $s['rate'] >= $threshold)
            ->sortByDesc('rate')
            ->take(5)
            ->values();
    }

    /**
     * Helper: Contar grupos de alto riesgo
     */
    private function countHighRiskGroups()
    {
        $threshold = 80;

        return Group::get()->filter(function ($group) use ($threshold) {
            $total = Attendance::where('group_id', $group->id)->count();
            
            if ($total == 0) return false;

            $present = Attendance::where('group_id', $group->id)
                ->where('status', 'present')
                ->count();

            $rate = round(($present / $total) * 100, 2);

            return $rate < $threshold;
        })->count();
    }
}