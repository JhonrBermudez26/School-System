<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class TeacherDashboardController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        // Total de asignaturas únicas que imparte el profesor
        $misMaterias = DB::table('subject_group')
            ->where('user_id', $user->id)
            ->distinct()
            ->count('subject_id');

        // Total de estudiantes únicos en todos los grupos donde dicta clase
        $totalEstudiantes = DB::table('subject_group as sg')
            ->join('group_user as gu', 'sg.group_id', '=', 'gu.group_id')
            ->join('model_has_roles as mhr', function ($join) {
                $join->on('gu.user_id', '=', 'mhr.model_id')
                    ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles as r', 'mhr.role_id', '=', 'r.id')
            ->where('r.name', 'estudiante')
            ->where('sg.user_id', $user->id)
            ->distinct()
            ->count('gu.user_id');

        // Listado de asignaciones (asignatura-grupo) con conteo de estudiantes por grupo
        $asignaciones = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->leftJoin('group_user as gu', 'g.id', '=', 'gu.group_id')
            ->leftJoin('model_has_roles as mhr', function ($join) {
                $join->on('gu.user_id', '=', 'mhr.model_id')
                    ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->leftJoin('roles as r', 'mhr.role_id', '=', 'r.id')
            ->where('sg.user_id', $user->id)
            ->where(function ($q) {
                $q->whereNull('r.name')->orWhere('r.name', 'estudiante');
            })
            ->groupBy('sg.subject_id', 's.name', 's.code', 'g.id', 'g.nombre')
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'g.id as group_id',
                'g.nombre as group_name',
                DB::raw('COUNT(CASE WHEN r.name = "estudiante" THEN gu.user_id END) as students_count')
            )
            ->orderBy('s.name')
            ->orderBy('g.nombre')
            ->get();

        return Inertia::render('Profesor/Dashboard', [
            'stats' => [
                'misMaterias' => $misMaterias,
                'totalEstudiantes' => $totalEstudiantes,
                // Placeholders por ahora si aún no existen tareas/entregas
                'tareasActivas' => 0,
                'porCalificar' => 0,
            ],
            'asignaciones' => $asignaciones,
        ]);
    }
}
