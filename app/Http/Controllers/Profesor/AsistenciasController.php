<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\AcademicPeriod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;
use Illuminate\Support\Facades\Gate;

class AsistenciasController extends Controller
{
    /**
     * Vista principal de asistencias
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $currentPeriod = AcademicPeriod::getPeriodoActivo();

        if (!$currentPeriod) {
            return Inertia::render('Profesor/Asistencias', [
                'error'             => 'No hay un período académico activo. Contacta a la secretaría.',
                'asignaciones'      => [],
                'estudiantes'       => [],
                'selectedClass'     => null,
                'classDates'        => [],
                'attendanceHistory' => [],
                'currentPeriod'     => null,
                'filters'           => [],
            ]);
        }

        $asignacionesRaw = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->where('sg.user_id', $user->id)
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'g.id as group_id',
                'g.nombre as group_name'
            )
            ->orderBy('s.name')
            ->orderBy('g.nombre')
            ->get();

        $asignaciones = $asignacionesRaw->map(function ($asig) use ($user) {
            $slots = DB::table('timetable_slots as ts')
                ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
                ->join('time_slots as tsl', 'tsl.id', '=', 'ts.time_slot_id')
                ->where('ts.user_id', $user->id)
                ->where('ts.subject_id', $asig->subject_id)
                ->where('tt.group_id', $asig->group_id)
                ->select('ts.day', 'ts.time_slot_id', 'tsl.start_time', 'tsl.end_time')
                ->get();

            return [
                'subject_id'   => $asig->subject_id,
                'group_id'     => $asig->group_id,
                'subject_name' => $asig->subject_name,
                'subject_code' => $asig->subject_code,
                'group_name'   => $asig->group_name,
                'schedules'    => $slots->map(fn($slot) => [
                    'day'          => $slot->day,
                    'time_slot_id' => $slot->time_slot_id,
                    'start_time'   => $slot->start_time,
                    'end_time'     => $slot->end_time,
                ])->values(),
            ];
        });

        $subjectId = $request->integer('subject_id');
        $groupId   = $request->integer('group_id');
        $view      = $request->input('view', 'register');

        $estudiantes       = collect();
        $selectedClass     = null;
        $classDates        = collect();
        $attendanceHistory = collect();

        if ($subjectId && $groupId) {
            // ✅ Gate verifica que el profesor realmente tiene esta asignación
            Gate::authorize('access-class', [$subjectId, $groupId]);

            $selectedClass = $asignaciones->first(function ($item) use ($subjectId, $groupId) {
                return $item['subject_id'] == $subjectId && $item['group_id'] == $groupId;
            });

            if ($view === 'register') {
                $classDates = $this->generateClassDates($subjectId, $groupId, $user->id, $currentPeriod);

                $selectedDate = $request->input('date');
                if ($selectedDate) {
                    $estudiantes = $this->getStudentsWithAttendance($groupId, $subjectId, $selectedDate);
                }
            } else {
                $attendanceHistory = $this->getAttendanceHistory($subjectId, $groupId, $user->id, $currentPeriod);
            }
        }

        return Inertia::render('Profesor/Asistencias', [
            'asignaciones'      => $asignaciones,
            'estudiantes'       => $estudiantes,
            'selectedClass'     => $selectedClass,
            'classDates'        => $classDates,
            'attendanceHistory' => $attendanceHistory,
            'currentPeriod'     => [
                'id'              => $currentPeriod->id,
                'name'            => $currentPeriod->name,
                'start_date'      => $currentPeriod->start_date->format('Y-m-d'),
                'end_date'        => $currentPeriod->end_date->format('Y-m-d'),
                'formatted_range' => $currentPeriod->start_date->locale('es')->isoFormat('D MMM YYYY') . ' - ' .
                                     $currentPeriod->end_date->locale('es')->isoFormat('D MMM YYYY'),
                'duracion_dias'   => $currentPeriod->getDuracionDias(),
                'dias_restantes'  => $currentPeriod->getDiasRestantes(),
            ],
            'filters' => [
                'subject_id' => $subjectId,
                'group_id'   => $groupId,
                'date'       => $request->input('date'),
                'view'       => $view,
            ],
            'can' => [
                'register'  => $user->can('attendances.create'),
                'view_all'  => $user->can('attendance.view_all'),
                'export'    => $user->can('attendance.export'),
            ],
        ]);
    }

    /**
     * Generar todas las fechas de clase según horario y período académico
     */
    private function generateClassDates($subjectId, $groupId, $teacherId, $currentPeriod)
    {
        $schedules = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->join('time_slots as tsl', 'tsl.id', '=', 'ts.time_slot_id')
            ->where('ts.user_id', $teacherId)
            ->where('ts.subject_id', $subjectId)
            ->where('tt.group_id', $groupId)
            ->select('ts.day', 'tsl.start_time', 'tsl.end_time')
            ->get();

        if ($schedules->isEmpty()) {
            return collect();
        }

        $dayMap = [
            'Lunes'     => 1,
            'Martes'    => 2,
            'Miercoles' => 3,
            'Miércoles' => 3,
            'Jueves'    => 4,
            'Viernes'   => 5,
            'Sábado'    => 6,
            'Sabado'    => 6,
            'Domingo'   => 7,
        ];

        $classDaysISO = $schedules->map(fn($s) => $dayMap[$s->day] ?? null)->filter()->unique()->values()->all();

        if (empty($classDaysISO)) {
            return collect();
        }

        $schedulesByDay = $schedules->groupBy('day')->map(fn($ds) => $ds->map(fn($s) => [
            'start_time' => $s->start_time,
            'end_time'   => $s->end_time,
        ])->values());

        $periodStart  = Carbon::parse($currentPeriod->start_date);
        $periodEnd    = Carbon::parse($currentPeriod->end_date);
        $today        = Carbon::today();
        $effectiveEnd = $periodEnd->gt($today) ? $today : $periodEnd;

        $classDates = collect();

        for ($date = $periodStart->copy(); $date->lte($effectiveEnd); $date->addDay()) {
            $dayOfWeek = $date->dayOfWeekIso;

            if (!in_array($dayOfWeek, $classDaysISO)) {
                continue;
            }

            $spanishDay = array_search($dayOfWeek, $dayMap);
            if (!$spanishDay || !isset($schedulesByDay[$spanishDay])) {
                continue;
            }

            $hasAttendance = DB::table('attendances')
                ->where('subject_id', $subjectId)
                ->where('group_id', $groupId)
                ->where('date', $date->format('Y-m-d'))
                ->exists();

            $attendanceStats = null;
            if ($hasAttendance) {
                $stats = DB::table('attendances')
                    ->where('subject_id', $subjectId)
                    ->where('group_id', $groupId)
                    ->where('date', $date->format('Y-m-d'))
                    ->select(
                        DB::raw('COUNT(*) as total'),
                        DB::raw('SUM(CASE WHEN status = "present" THEN 1 ELSE 0 END) as present'),
                        DB::raw('SUM(CASE WHEN status = "absent" THEN 1 ELSE 0 END) as absent'),
                        DB::raw('SUM(CASE WHEN status = "late" THEN 1 ELSE 0 END) as late'),
                        DB::raw('SUM(CASE WHEN status = "excused" THEN 1 ELSE 0 END) as excused')
                    )
                    ->first();

                $attendanceStats = [
                    'total'   => $stats->total,
                    'present' => $stats->present,
                    'absent'  => $stats->absent,
                    'late'    => $stats->late,
                    'excused' => $stats->excused,
                ];
            }

            $classDates->push([
                'date'             => $date->format('Y-m-d'),
                'day_name'         => $date->locale('es')->isoFormat('dddd'),
                'formatted'        => $date->locale('es')->isoFormat('D [de] MMMM, YYYY'),
                'short_date'       => $date->locale('es')->isoFormat('D MMM'),
                'is_past'          => $date->isPast(),
                'is_today'         => $date->isToday(),
                'is_future'        => $date->isFuture(),
                'schedules'        => $schedulesByDay[$spanishDay],
                'has_attendance'   => $hasAttendance,
                'attendance_stats' => $attendanceStats,
                'week_number'      => $date->weekOfYear,
            ]);
        }

        return $classDates->sortByDesc('date')->values();
    }

    /**
     * Validar si una fecha está dentro del período y es día de clase
     */
    private function isValidClassDate($date, $subjectId, $groupId, $teacherId, $currentPeriod)
    {
        $carbonDate = Carbon::parse($date);

        if (!$currentPeriod->contieneFecha($carbonDate)) {
            return false;
        }

        if ($carbonDate->isFuture()) {
            return false;
        }

        $dayOfWeek = $carbonDate->dayOfWeekIso;
        $dayMap    = [
            1 => 'Lunes',
            2 => 'Martes',
            3 => 'Miercoles',
            4 => 'Jueves',
            5 => 'Viernes',
            6 => 'Sábado',
            7 => 'Domingo',
        ];

        $dayName = $dayMap[$dayOfWeek] ?? null;
        if (!$dayName) return false;

        return DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->where('ts.user_id', $teacherId)
            ->where('ts.subject_id', $subjectId)
            ->where('tt.group_id', $groupId)
            ->where('ts.day', $dayName)
            ->exists();
    }

    /**
     * Obtener estudiantes con su asistencia del día
     */
    private function getStudentsWithAttendance($groupId, $subjectId, $date)
    {
        return DB::table('group_user')
            ->join('users', 'group_user.user_id', '=', 'users.id')
            ->join('model_has_roles', function ($join) {
                $join->on('users.id', '=', 'model_has_roles.model_id')
                     ->where('model_has_roles.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->leftJoin('attendances', function ($join) use ($subjectId, $groupId, $date) {
                $join->on('users.id', '=', 'attendances.user_id')
                     ->where('attendances.subject_id', '=', $subjectId)
                     ->where('attendances.group_id', '=', $groupId)
                     ->where('attendances.date', '=', $date);
            })
            ->where('group_user.group_id', $groupId)
            ->where('roles.name', 'estudiante')
            ->where('users.is_active', true)
            ->select(
                'users.id',
                'users.name',
                'users.last_name',
                'users.document_number',
                'attendances.id as attendance_id',
                'attendances.status',
                'attendances.notes'
            )
            ->orderBy('users.last_name')
            ->orderBy('users.name')
            ->get();
    }

    /**
     * Obtener historial de asistencias SOLO de días de clase válidos
     */
    private function getAttendanceHistory($subjectId, $groupId, $teacherId, $currentPeriod)
    {
        $schedules = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->where('ts.user_id', $teacherId)
            ->where('ts.subject_id', $subjectId)
            ->where('tt.group_id', $groupId)
            ->pluck('ts.day');

        if ($schedules->isEmpty()) {
            return collect();
        }

        $dayMap = [
            'Lunes'     => 1,
            'Martes'    => 2,
            'Miercoles' => 3,
            'Miércoles' => 3,
            'Jueves'    => 4,
            'Viernes'   => 5,
            'Sábado'    => 6,
            'Sabado'    => 6,
            'Domingo'   => 7,
        ];

        $validDaysISO = $schedules->map(fn($day) => $dayMap[$day] ?? null)
            ->filter()->unique()->values()->all();

        if (empty($validDaysISO)) {
            return collect();
        }

        $periodStart = Carbon::parse($currentPeriod->start_date);
        $periodEnd   = Carbon::parse($currentPeriod->end_date);

        $attendances = DB::table('attendances as a')
            ->join('users as u', 'a.user_id', '=', 'u.id')
            ->where('a.subject_id', $subjectId)
            ->where('a.group_id', $groupId)
            ->whereBetween('a.date', [$periodStart, $periodEnd])
            ->select(
                'a.id', 'a.date', 'a.status', 'a.notes', 'a.created_at',
                'u.id as user_id', 'u.name', 'u.last_name', 'u.document_number'
            )
            ->orderBy('a.date', 'desc')
            ->orderBy('u.last_name')
            ->get();

        $filteredAttendances = $attendances->filter(function ($record) use ($validDaysISO) {
            return in_array(Carbon::parse($record->date)->dayOfWeekIso, $validDaysISO);
        });

        return $filteredAttendances->groupBy('date')
            ->map(function ($dateGroup, $date) {
                return [
                    'date'           => $date,
                    'formatted_date' => Carbon::parse($date)->locale('es')->isoFormat('dddd, D [de] MMMM, YYYY'),
                    'students'       => $dateGroup->values(),
                    'stats'          => [
                        'present' => $dateGroup->where('status', 'present')->count(),
                        'absent'  => $dateGroup->where('status', 'absent')->count(),
                        'late'    => $dateGroup->where('status', 'late')->count(),
                        'excused' => $dateGroup->where('status', 'excused')->count(),
                        'total'   => $dateGroup->count(),
                    ],
                ];
            })
            ->values();
    }

    /**
     * Guardar asistencia masiva
     */
    public function bulkStore(Request $request)
    {
        $validated = $request->validate([
            'subject_id'              => 'required|exists:subjects,id',
            'group_id'                => 'required|exists:groups,id',
            'date'                    => 'required|date',
            'attendances'             => 'required|array',
            'attendances.*.user_id'   => 'required|exists:users,id',
            'attendances.*.status'    => 'required|in:present,absent,late,excused',
            'attendances.*.notes'     => 'nullable|string|max:500',
        ]);

        $userId = Auth::id();

        $currentPeriod = AcademicPeriod::getPeriodoActivo();

        if (!$currentPeriod) {
            return back()->with('error', '❌ No hay un período académico activo');
        }

        $date = Carbon::parse($validated['date']);

        if (!$currentPeriod->contieneFecha($date)) {
            return back()->with('error', '❌ La fecha debe estar dentro del período académico: ' . $currentPeriod->name);
        }

        if (!$this->isValidClassDate($validated['date'], $validated['subject_id'], $validated['group_id'], $userId, $currentPeriod)) {
            return back()->with('error', '❌ No puedes registrar asistencia en esta fecha. No tienes clase programada ese día.');
        }

        // ✅ Gate verifica propiedad de la clase antes de registrar asistencias masivas
        Gate::authorize('access-class', [(int)$validated['subject_id'], (int)$validated['group_id']]);

        DB::beginTransaction();
        try {
            foreach ($validated['attendances'] as $attendance) {
                Attendance::updateOrCreate(
                    [
                        'user_id'    => $attendance['user_id'],
                        'subject_id' => $validated['subject_id'],
                        'group_id'   => $validated['group_id'],
                        'date'       => $validated['date'],
                    ],
                    [
                        'teacher_id' => $userId,
                        'status'     => $attendance['status'],
                        'notes'      => $attendance['notes'] ?? null,
                    ]
                );
            }

            DB::commit();
            return back()->with('success', '✅ Asistencias registradas correctamente');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->with('error', '❌ Error al registrar asistencias: ' . $e->getMessage());
        }
    }

    /**
     * Eliminar un registro de asistencia
     * ✅ FIX IDOR: Route Model Binding reemplaza findOrFail($id) manual
     * La Policy verifica que el profesor sea dueño del registro (via subject_group)
     */
    public function destroy(Attendance $attendance)
    {
        $this->authorize('delete', $attendance);

        $attendance->delete();

        return back()->with('success', '✅ Registro eliminado correctamente');
    }
}