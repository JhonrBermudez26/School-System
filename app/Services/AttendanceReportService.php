<?php

namespace App\Services;

use App\Models\Asistencia;
use App\Models\Student;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class AttendanceReportService
{
    /**
     * Obtiene el índice de asistencia global por periodo o rango de fechas
     */
    public function getGlobalAttendance(string $startDate, string $endDate)
    {
        return DB::table('asistencias')
            ->whereBetween('fecha', [$startDate, $endDate])
            ->select(
                DB::raw('COUNT(*) as total_records'),
                DB::raw('SUM(CASE WHEN estado = "presente" THEN 1 ELSE 0 END) as present_count'),
                DB::raw('SUM(CASE WHEN estado = "ausente" THEN 1 ELSE 0 END) as absent_count'),
                DB::raw('SUM(CASE WHEN estado = "tarde" THEN 1 ELSE 0 END) as late_count')
            )
            ->first();
    }

    /**
     * Obtiene la asistencia detallada por grupo
     */
    public function getAttendanceByGroup(int $groupId, string $startDate, string $endDate)
    {
        return DB::table('asistencias')
            ->join('students', 'asistencias.student_id', '=', 'students.id')
            ->where('students.grupo_id', $groupId)
            ->whereBetween('asistencias.fecha', [$startDate, $endDate])
            ->select(
                'students.first_name',
                'students.last_name',
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN estado = "ausente" THEN 1 ELSE 0 END) as absences')
            )
            ->groupBy('students.id', 'students.first_name', 'students.last_name')
            ->get();
    }

    /**
     * Identifica estudiantes con alta inasistencia
     */
    public function getHighAbsenceStudents(int $thresholdPercentage, string $startDate, string $endDate)
    {
        return DB::table('asistencias')
            ->join('students', 'asistencias.student_id', '=', 'students.id')
            ->join('grupos', 'students.grupo_id', '=', 'grupos.id')
            ->whereBetween('asistencias.fecha', [$startDate, $endDate])
            ->select(
                'students.first_name',
                'students.last_name',
                'grupos.name as group_name',
                DB::raw('COUNT(*) as total_days'),
                DB::raw('SUM(CASE WHEN estado = "ausente" THEN 1 ELSE 0 END) as absent_days'),
                DB::raw('(SUM(CASE WHEN estado = "ausente" THEN 1 ELSE 0 END) * 100 / COUNT(*)) as absence_rate')
            )
            ->groupBy('students.id', 'students.first_name', 'students.last_name', 'grupos.name')
            ->having('absence_rate', '>=', $thresholdPercentage)
            ->get();
    }
}
