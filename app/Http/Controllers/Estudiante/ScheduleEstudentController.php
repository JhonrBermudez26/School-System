<?php
namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Gate; 


class ScheduleEstudentController extends Controller
{
    public function index()
    {
        $this->authorize('viewAny', Schedule::class);

        $student = Auth::user();
        $current_year = date('Y');

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
                'can' => ['print' => false],
            ]);
        }

        $time_slots = DB::table('time_slots')->orderBy('start_time')->get();

        $estudent_timetable_slots = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->join('groups as g', 'g.id', '=', 'tt.group_id')
            ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'ts.user_id')
            ->select(
                'ts.day',
                'ts.time_slot_id',
                'ts.subject_id',
                's.name as subject_name',
                'g.nombre as group_name',
                'g.id as group_id',
                DB::raw("CONCAT(u.name, ' ', COALESCE(u.last_name, '')) as teacher_name")
            )
            ->where('tt.group_id', $studentGroup->group_id)
            ->get();

        return Inertia::render('Estudiante/Horario', [
            'estudent_timetable_slots' => $estudent_timetable_slots,
            'time_slots' => $time_slots,
            'estudent_name' => $student->name . ' ' . $student->last_name,
            'current_year' => $current_year,
            'can' => [
                'print' => auth()->user()->can('print', Schedule::class),
            ],
        ]);
    }

    public function print()
    {
        $this->authorize('print', Schedule::class);

        $student = Auth::user();
        $studentGroup = DB::table('group_user')->where('user_id', $student->id)->first();

        if (!$studentGroup) {
            return back()->withErrors(['error' => 'No tienes un grupo asignado']);
        }

        $group = \App\Models\Group::with(['grade', 'course'])->findOrFail($studentGroup->group_id);
        $timeSlots = DB::table('time_slots')->orderBy('start_time')->get();
        $days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

        $timetableId = DB::table('timetables')->where('group_id', $studentGroup->group_id)->value('id');
        $timetableSlots = collect();

        if ($timetableId) {
            $timetableSlots = DB::table('timetable_slots as ts')
                ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
                ->leftJoin('users as u', 'u.id', '=', 'ts.user_id')
                ->select('ts.day', 'ts.time_slot_id', 's.name as subject_name', 'u.name as teacher_name', 'u.last_name as teacher_last_name')
                ->where('ts.timetable_id', $timetableId)
                ->get();
        }

        $grid = [];
        foreach ($days as $d) $grid[$d] = [];
        foreach ($timetableSlots as $ts) {
            $grid[$ts->day][$ts->time_slot_id] = $ts;
        }

        $pdf = Pdf::loadView('pdf.horario-grupo', [
            'group' => $group,
            'time_slots' => $timeSlots,
            'days' => $days,
            'grid' => $grid,
            'current_year' => now()->year,
        ])->setPaper('a4', 'landscape');

        return $pdf->download("mi-horario-{$student->name}-{$student->last_name}.pdf");
    }
}