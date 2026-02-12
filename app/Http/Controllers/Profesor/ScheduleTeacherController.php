<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ScheduleTeacherController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Schedule::class);

        $teacher = Auth::user();
        $current_year = date('Y');

        $time_slots = DB::table('time_slots')->orderBy('start_time')->get();

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
            'can' => [
                'print' => auth()->user()->can('print', Schedule::class),
            ],
        ]);
    }

    public function print()
    {
        $this->authorize('print', Schedule::class);

        $teacher = Auth::user();
        $timeSlots = DB::table('time_slots')->orderBy('start_time')->get();
        $days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

        $teacherSlots = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->join('groups as g', 'g.id', '=', 'tt.group_id')
            ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
            ->select('ts.day', 'ts.time_slot_id', 's.name as subject_name', 'g.nombre as group_name')
            ->where('ts.user_id', $teacher->id)
            ->get();

        $grid = [];
        foreach ($days as $d) $grid[$d] = [];
        foreach ($teacherSlots as $ts) {
            $grid[$ts->day][$ts->time_slot_id] = $ts;
        }

        $pdf = Pdf::loadView('pdf.horario-docente', [
            'teacher' => $teacher,
            'time_slots' => $timeSlots,
            'days' => $days,
            'grid' => $grid,
            'current_year' => now()->year,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("mi-horario-{$teacher->name}-{$teacher->last_name}.pdf");
    }
}