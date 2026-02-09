<?php

namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ScheduleEstudentController extends Controller
{
    /**
     * Mostrar el horario del estudiante autenticado
     */
    public function index()
    {
        $student = Auth::user();
        $current_year = date('Y');

        // ✅ PASO 1: Obtener el grupo del estudiante
        $studentGroup = DB::table('group_user')
            ->where('user_id', $student->id)
            ->first();

        if (!$studentGroup) {
            return Inertia::render('Estudiante/Horario', [
                'estudent_timetable_slots' => [],
                'time_slots' => [],
                'estudent_name' => $student->name . ' ' . $student->last_name,
                'current_year' => $current_year,
                'error' => 'No tienes un grupo asignado',
            ]);
        }

        // ✅ PASO 2: Obtener bloques horarios
        $time_slots = DB::table('time_slots')
            ->orderBy('start_time')
            ->get();

        // ✅ PASO 3: Obtener el horario DEL GRUPO (no del user_id)
        $estudent_timetable_slots = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->join('groups as g', 'g.id', '=', 'tt.group_id')
            ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'ts.user_id') // Profesor
            ->select(
                'ts.day',
                'ts.time_slot_id',
                'ts.subject_id',
                's.name as subject_name',
                'g.nombre as group_name',
                'g.id as group_id',
                DB::raw("CONCAT(u.name, ' ', COALESCE(u.last_name, '')) as teacher_name")
            )
            // ✅ FILTRAR POR EL GRUPO DEL ESTUDIANTE
            ->where('tt.group_id', $studentGroup->group_id)
            ->get();

        return Inertia::render('Estudiante/Horario', [
            'estudent_timetable_slots' => $estudent_timetable_slots,
            'time_slots' => $time_slots,
            'estudent_name' => $student->name . ' ' . $student->last_name,
            'current_year' => $current_year,
        ]);
    }
}
