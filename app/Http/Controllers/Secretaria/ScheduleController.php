<?php

namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ScheduleController extends Controller
{
    /**
     * Listado de horarios con filtros.
     */
    public function index(Request $request)
    {
        $groupId = $request->integer('group_id');
        $mode = $request->input('mode', 'group'); // 'group' | 'teacher'
        $teacherId = $request->integer('teacher_id');

        $groups = Group::with(['grade', 'course'])->orderBy('nombre')->get();
        $subjects = Subject::where('is_active', true)->orderBy('name')->get();
        $teachers = User::role('profesor')->orderBy('name')->get(['id','name','last_name']);

        // Bloqueo de generación por año (si ya hubo generación en el año actual)
        $currentYear = now()->year;
        $generationLocked = DB::table('timetables')->whereYear('created_at', $currentYear)->exists();

        $schedules = Schedule::with(['group.grade', 'group.course', 'subject', 'teacher'])
            ->when($groupId, fn($q) => $q->where('group_id', $groupId))
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        // Datos para mostrar el horario generado desde timetable_slots
        $timeSlots = DB::table('time_slots')->orderBy('start_time')->get();
        $timetableSlots = collect();
        $teacherTimetableSlots = collect();
        if ($mode === 'group' && $groupId) {
            $timetableId = DB::table('timetables')->where('group_id', $groupId)->value('id');
            if ($timetableId) {
                $timetableSlots = DB::table('timetable_slots as ts')
                    ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
                    ->leftJoin('users as u', 'u.id', '=', 'ts.user_id')
                    ->select('ts.day', 'ts.time_slot_id', 'ts.subject_id', 'ts.user_id', 's.name as subject_name', 'u.name as teacher_name', 'u.last_name as teacher_last_name')
                    ->where('ts.timetable_id', $timetableId)
                    ->get();
            }
        }
        if ($mode === 'teacher' && $teacherId) {
            // Horario del docente: buscar en todos los timetable_slots por user_id, incluir grupo
            $teacherTimetableSlots = DB::table('timetable_slots as ts')
                ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
                ->join('groups as g', 'g.id', '=', 'tt.group_id')
                ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
                ->select(
                    'ts.day',
                    'ts.time_slot_id',
                    'ts.subject_id',
                    'ts.user_id',
                    's.name as subject_name',
                    'g.nombre as group_name'
                )
                ->where('ts.user_id', $teacherId)
                ->get();
        }

        return Inertia::render('Secretaria/Horarios', [
            'groups' => $groups,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'schedules' => $schedules,
            'time_slots' => $timeSlots,
            'timetable_slots' => $timetableSlots,
            'teacher_timetable_slots' => $teacherTimetableSlots,
            'filters' => [
                'group_id' => $groupId,
                'mode' => $mode,
                'teacher_id' => $teacherId,
            ],
            'generation_locked' => $generationLocked,
            'current_year' => $currentYear,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Crear un horario.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'user_id' => 'required|exists:users,id',
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'classroom' => 'nullable|string|max:100',
        ]);

        // Validar relación profesor-asignatura-grupo
        $asignado = DB::table('subject_group')
            ->where('user_id', $data['user_id'])
            ->where('subject_id', $data['subject_id'])
            ->where('group_id', $data['group_id'])
            ->exists();
        if (!$asignado) {
            return back()->withErrors(['user_id' => 'El profesor no está asignado a esta asignatura en el grupo seleccionado.']);
        }

        $overlaps = function ($q) use ($data) {
            $q->where('day_of_week', $data['day_of_week'])
              ->where(function ($qq) use ($data) {
                  $qq->whereBetween('start_time', [$data['start_time'], $data['end_time']])
                     ->orWhereBetween('end_time', [$data['start_time'], $data['end_time']])
                     ->orWhere(function ($q3) use ($data) {
                         $q3->where('start_time', '<=', $data['start_time'])
                            ->where('end_time', '>=', $data['end_time']);
                     });
              });
        };

        if (Schedule::where('group_id', $data['group_id'])->where($overlaps)->exists()) {
            return back()->withErrors(['start_time' => 'Conflicto de horario en el grupo para ese día y franja.']);
        }
        if (Schedule::where('user_id', $data['user_id'])->where($overlaps)->exists()) {
            return back()->withErrors(['user_id' => 'El profesor ya tiene un horario en esa franja.']);
        }

        Schedule::create($data);

        return redirect()->route('secretaria.horarios', ['group_id' => $data['group_id']])
            ->with('success', 'Horario creado correctamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Actualizar un horario.
     */
    public function update(Request $request, string $id)
    {
        $schedule = Schedule::findOrFail($id);

        $data = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'subject_id' => 'required|exists:subjects,id',
            'user_id' => 'required|exists:users,id',
            'day_of_week' => 'required|integer|min:1|max:7',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'classroom' => 'nullable|string|max:100',
        ]);

        $asignado = DB::table('subject_group')
            ->where('user_id', $data['user_id'])
            ->where('subject_id', $data['subject_id'])
            ->where('group_id', $data['group_id'])
            ->exists();
        if (!$asignado) {
            return back()->withErrors(['user_id' => 'El profesor no está asignado a esta asignatura en el grupo seleccionado.']);
        }

        $overlaps = function ($q) use ($data, $schedule) {
            $q->where('day_of_week', $data['day_of_week'])
              ->where('id', '!=', $schedule->id)
              ->where(function ($qq) use ($data) {
                  $qq->whereBetween('start_time', [$data['start_time'], $data['end_time']])
                     ->orWhereBetween('end_time', [$data['start_time'], $data['end_time']])
                     ->orWhere(function ($q3) use ($data) {
                         $q3->where('start_time', '<=', $data['start_time'])
                            ->where('end_time', '>=', $data['end_time']);
                     });
              });
        };

        if (Schedule::where('group_id', $data['group_id'])->where($overlaps)->exists()) {
            return back()->withErrors(['start_time' => 'Conflicto de horario en el grupo para ese día y franja.']);
        }
        if (Schedule::where('user_id', $data['user_id'])->where($overlaps)->exists()) {
            return back()->withErrors(['user_id' => 'El profesor ya tiene un horario en esa franja.']);
        }

        $schedule->update($data);

        return redirect()->route('secretaria.horarios', ['group_id' => $data['group_id']])
            ->with('success', 'Horario actualizado correctamente.');
    }

    /**
     * Eliminar un horario.
     */
    public function destroy(string $id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();
        return back()->with('success', 'Horario eliminado.');
    }

    /**
     * Generar horarios automáticamente usando timetables/time_slots/timetable_slots
     * a partir de las asignaciones existentes en subject_group y hours_per_week de subjects.
     */
    public function generate(Request $request)
    {
        $request->validate([
            'group_id' => 'nullable|exists:groups,id',
            'reset' => 'sometimes|boolean',
            'force' => 'sometimes|boolean',
        ]);

        $targetGroupId = $request->input('group_id');
        $reset = (bool) $request->boolean('reset', true);
        $force = (bool) $request->boolean('force', false);

        // Respeta bloqueo anual salvo que se fuerce regeneración
        $currentYear = now()->year;
        $alreadyGeneratedThisYear = DB::table('timetables')->whereYear('created_at', $currentYear)->exists();
        if (!$force && $alreadyGeneratedThisYear) {
            return back()->with('error', "Ya se generó un horario en $currentYear. Usa 'Regenerar' si necesitas forzar.");
        }

        $days = ['Lunes','Martes','Miercoles','Jueves','Viernes'];
        $timeSlots = DB::table('time_slots')->orderBy('start_time')->get();
        if ($timeSlots->isEmpty()) {
            return back()->withErrors(['time_slots' => 'No existen franjas horarias (time_slots). Crea primero las franjas.']);
        }

        $groupQuery = Group::query();
        if ($targetGroupId) {
            $groupQuery->where('id', $targetGroupId);
        }
        $groups = $groupQuery->get();
        if ($groups->isEmpty()) {
            return back()->withErrors(['group_id' => 'No se encontraron grupos para generar horarios.']);
        }

        DB::beginTransaction();
        try {
            foreach ($groups as $group) {
                // Obtener/crear timetable del grupo
                $timetableId = DB::table('timetables')->where('group_id', $group->id)->value('id');
                if (!$timetableId) {
                    $timetableId = DB::table('timetables')->insertGetId([
                        'group_id' => $group->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                // Limpiar si reset
                if ($reset) {
                    DB::table('timetable_slots')->where('timetable_id', $timetableId)->delete();
                }

                // Construir mapa de ocupación de docentes: [day][time_slot_id] => set(user_id)
                $occupiedByTeacher = [];
                $existing = DB::table('timetable_slots')->get(['day','time_slot_id','user_id']);
                foreach ($existing as $row) {
                    if (!$row->user_id) continue;
                    $occupiedByTeacher[$row->day][$row->time_slot_id][$row->user_id] = true;
                }

                // Asignaciones del grupo: subject_id, user_id y horas requeridas
                $assignments = DB::table('subject_group')
                    ->where('group_id', $group->id)
                    ->join('subjects','subjects.id','=','subject_group.subject_id')
                    ->select('subject_group.subject_id','subject_group.user_id','subjects.hours_per_week')
                    ->get();

                // Aleatorizar el orden de asignaciones y días para un "sorteo" más equitativo
                $assignments = $assignments->shuffle();
                $daysShuffled = collect($days)->shuffle()->all();

                // Distribuir horas por asignación procurando consecutividad en el mismo día
                foreach ($assignments as $asg) {
                    $hoursNeeded = max(0, (int)$asg->hours_per_week);
                    if ($hoursNeeded === 0) continue;

                    // Contar ya asignadas para esta materia en este timetable
                    $already = DB::table('timetable_slots')
                        ->where('timetable_id', $timetableId)
                        ->where('subject_id', $asg->subject_id)
                        ->count();
                    $remaining = max(0, $hoursNeeded - $already);
                    if ($remaining === 0) continue;

                    // 1) Intentar bloques consecutivos completos del tamaño k (de mayor a menor) en un mismo día
                    while ($remaining >= 2) {
                        $placedBlock = false;
                        $slotsCount = count($timeSlots);
                        $maxK = min($remaining, $slotsCount);
                        for ($k = $maxK; $k >= 2; $k--) {
                            $found = false;
                            foreach ($daysShuffled as $day) {
                                if ($found) break;
                                for ($i = 0; $i <= $slotsCount - $k; $i++) {
                                    $ok = true;
                                    // Verificar ventana [i, i+k)
                                    for ($j = 0; $j < $k; $j++) {
                                        $cur = $timeSlots[$i + $j];
                                        $gTaken = DB::table('timetable_slots')
                                            ->where('timetable_id', $timetableId)
                                            ->where('day', $day)
                                            ->where('time_slot_id', $cur->id)
                                            ->exists();
                                        $tBusy = !empty(($occupiedByTeacher[$day][$cur->id][$asg->user_id] ?? false));
                                        if ($gTaken || $tBusy) { $ok = false; break; }
                                    }
                                    if ($ok) {
                                        // Asignar la ventana completa
                                        for ($j = 0; $j < $k; $j++) {
                                            $cur = $timeSlots[$i + $j];
                                            DB::table('timetable_slots')->insert([
                                                'timetable_id' => $timetableId,
                                                'time_slot_id' => $cur->id,
                                                'day' => $day,
                                                'subject_id' => $asg->subject_id,
                                                'user_id' => $asg->user_id,
                                                'created_at' => now(),
                                                'updated_at' => now(),
                                            ]);
                                            $occupiedByTeacher[$day][$cur->id][$asg->user_id] = true;
                                        }
                                        $remaining -= $k;
                                        $placedBlock = true;
                                        $found = true;
                                        break;
                                    }
                                }
                            }
                            if ($placedBlock) break; // ya se colocó un bloque de tamaño k
                        }
                        if (!$placedBlock) break; // no se pudieron colocar más bloques
                    }

                    // 2) Asignar horas sueltas si quedaron remanentes
                    if ($remaining > 0) {
                        foreach ($daysShuffled as $day) {
                            if ($remaining === 0) break;
                            foreach ($timeSlots as $slot) {
                                if ($remaining === 0) break;
                                $gTaken = DB::table('timetable_slots')->where('timetable_id', $timetableId)->where('day', $day)->where('time_slot_id', $slot->id)->exists();
                                if ($gTaken) continue;
                                $tBusy = !empty(($occupiedByTeacher[$day][$slot->id][$asg->user_id] ?? false));
                                if ($tBusy) continue;

                                DB::table('timetable_slots')->insert([
                                    'timetable_id' => $timetableId,
                                    'time_slot_id' => $slot->id,
                                    'day' => $day,
                                    'subject_id' => $asg->subject_id,
                                    'user_id' => $asg->user_id,
                                    'created_at' => now(),
                                    'updated_at' => now(),
                                ]);
                                $occupiedByTeacher[$day][$slot->id][$asg->user_id] = true;
                                $remaining--;
                            }
                        }
                    }
                }

                // Sincronizar a tabla schedules para persistencia adicional y usos futuros
                // Limpiar schedules del grupo si reset
                if ($reset) {
                    Schedule::where('group_id', $group->id)->delete();
                }

                $timetableId = DB::table('timetables')->where('group_id', $group->id)->value('id');
                if ($timetableId) {
                    $rows = DB::table('timetable_slots as ts')
                        ->join('time_slots as t', 't.id', '=', 'ts.time_slot_id')
                        ->where('ts.timetable_id', $timetableId)
                        ->whereNotNull('ts.subject_id')
                        ->whereNotNull('ts.user_id')
                        ->get(['ts.day','t.start_time','t.end_time','ts.subject_id','ts.user_id']);

                    // Mapear día texto a número 1-7
                    $dayMap = [
                        'Lunes' => 1,
                        'Martes' => 2,
                        'Miercoles' => 3,
                        'Jueves' => 4,
                        'Viernes' => 5,
                        'Sabado' => 6,
                        'Sábado' => 6,
                        'Domingo' => 7,
                    ];

                    foreach ($rows as $r) {
                        $dayNum = $dayMap[$r->day] ?? null;
                        if (!$dayNum) continue;
                        Schedule::create([
                            'group_id' => $group->id,
                            'subject_id' => $r->subject_id,
                            'user_id' => $r->user_id,
                            'day_of_week' => $dayNum,
                            'start_time' => $r->start_time,
                            'end_time' => $r->end_time,
                            'classroom' => null,
                        ]);
                    }
                }
            }

            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors(['generator' => 'Error generando horarios: '.$e->getMessage()]);
        }

        return back()->with('success', 'Horarios generados automáticamente.');
    }
}
