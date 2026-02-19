<?php

namespace App\Services;

use App\Models\Grade;
use App\Models\Student;
use App\Models\Grupo;
use App\Models\Subject;
use Illuminate\Support\Facades\DB;

class AcademicReportService
{
    /**
     * Obtiene el promedio académico por grupo
     */
    public function getGradesByGroup(int $groupId, int $periodId)
    {
        return DB::table('grades')
            ->join('students', 'grades.student_id', '=', 'students.id')
            ->where('students.grupo_id', $groupId)
            ->where('grades.academic_period_id', $periodId)
            ->select(
                'students.id',
                'students.first_name',
                'students.last_name',
                DB::raw('AVG(grades.score) as average')
            )
            ->groupBy('students.id', 'students.first_name', 'students.last_name')
            ->orderByDesc('average')
            ->get();
    }

    /**
     * Obtiene el promedio académico por asignatura
     */
    public function getGradesBySubject(int $subjectId, int $periodId)
    {
        return DB::table('grades')
            ->where('subject_id', $subjectId)
            ->where('academic_period_id', $periodId)
            ->select(
                DB::raw('AVG(score) as average'),
                DB::raw('COUNT(*) as total_grades')
            )
            ->first();
    }

    /**
     * Identifica estudiantes con bajo desempeño
     */
    public function getLowPerformingStudents(float $threshold, int $periodId)
    {
        return DB::table('grades')
            ->join('students', 'grades.student_id', '=', 'students.id')
            ->join('subjects', 'grades.subject_id', '=', 'subjects.id')
            ->join('grupos', 'students.grupo_id', '=', 'grupos.id')
            ->where('grades.score', '<', $threshold)
            ->where('grades.academic_period_id', $periodId)
            ->select(
                'students.first_name',
                'students.last_name',
                'subjects.name as subject_name',
                'grupos.name as group_name',
                'grades.score'
            )
            ->get();
    }

    /**
     * Obtiene el ranking institucional de grupos
     */
    public function getGroupRankings(int $periodId)
    {
        return DB::table('grades')
            ->join('students', 'grades.student_id', '=', 'students.id')
            ->join('grupos', 'students.grupo_id', '=', 'grupos.id')
            ->where('grades.academic_period_id', $periodId)
            ->select(
                'grupos.name',
                DB::raw('AVG(grades.score) as average')
            )
            ->groupBy('grupos.id', 'grupos.name')
            ->orderByDesc('average')
            ->get();
    }
}
