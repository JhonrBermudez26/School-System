<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ScheduleTeacherController extends Controller
{
    /**
     * Mostrar el horario del profesor autenticado
     */
    public function index()
    {
        $teacher = Auth::user();
        $current_year = date('Y');

        // Obtener todos los bloques horarios
        $time_slots = DB::table('time_slots')
            ->orderBy('start_time')
            ->get();

        // Obtener el horario del profesor autenticado desde timetable_slots
        // Esta es la misma lógica que usa la secretaria para ver horarios de profesores
        $teacher_timetable_slots = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->join('groups as g', 'g.id', '=', 'tt.group_id')
            ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
            ->select(
                'ts.day',
                'ts.time_slot_id',
                'ts.subject_id',
                'ts.user_id',
                's.name as subject_name',
                'g.nombre as group_name',
                'g.id as group_id'
            )
            ->where('ts.user_id', $teacher->id)
            ->get();

        return Inertia::render('Profesor/Horario', [
            'teacher_timetable_slots' => $teacher_timetable_slots,
            'time_slots' => $time_slots,
            'teacher_name' => $teacher->name . ' ' . $teacher->last_name,
            'current_year' => $current_year,
        ]);
    }
}