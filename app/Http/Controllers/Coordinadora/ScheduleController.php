<?php
namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Schedule;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class ScheduleController extends Controller
{
    /**
     * ✅ INDEX - Cargar datos del horario
     */
    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', Schedule::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            Log::error('❌ Sin permiso para ver horarios', [
                'user_id' => auth()->id(),
                'permissions' => auth()->user()->getAllPermissions()->pluck('name')
            ]);
            abort(403, 'No tienes permiso para ver horarios');
        }

        $groupId = $request->integer('group_id');
        $mode = $request->input('mode', 'group');
        $teacherId = $request->integer('teacher_id');

        $groups = Group::with(['grade', 'course'])->orderBy('nombre')->get();
        $subjects = Subject::where('is_active', true)->orderBy('name')->get();
        $teachers = User::role('profesor')->orderBy('name')->get(['id', 'name', 'last_name']);

        $currentYear = now()->year;
        $generationLocked = DB::table('timetables')->whereYear('created_at', $currentYear)->exists();

        $schedules = Schedule::with(['group.grade', 'group.course', 'subject', 'teacher'])
            ->when($groupId, fn($q) => $q->where('group_id', $groupId))
            ->orderBy('day_of_week')
            ->orderBy('start_time')
            ->get();

        $timeSlots = DB::table('time_slots')->orderBy('start_time')->get();

        // ✅ OBTENER TODOS LOS SLOTS DE TODOS LOS GRUPOS (para verificar disponibilidad)
        $allTimetableSlots = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->join('groups as g', 'g.id', '=', 'tt.group_id') // Join with groups
            ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
            ->leftJoin('users as u', 'u.id', '=', 'ts.user_id')
            ->select(
                'ts.day',
                'ts.time_slot_id',
                'ts.subject_id',
                'ts.user_id',
                's.name as subject_name',
                'u.name as teacher_name',
                'u.last_name as teacher_last_name',
                'tt.group_id',
                'g.nombre as group_name' // Select group_name
            )
            ->get();

        $timetableSlots = collect();
        $teacherTimetableSlots = collect();
        $availableAssignments = collect();

        if ($mode === 'group' && $groupId) {
            // Slots del grupo actual
            $timetableSlots = $allTimetableSlots->where('group_id', $groupId)->values();

            // ✅ Asignaciones disponibles del grupo (subject_group)
            $availableAssignments = DB::table('subject_group as sg')
                ->join('subjects as s', 's.id', '=', 'sg.subject_id')
                ->join('users as u', 'u.id', '=', 'sg.user_id')
                ->where('sg.group_id', $groupId)
                ->where('s.is_active', true)
                ->select(
                    'sg.subject_id',
                    'sg.user_id',
                    's.name as subject_name',
                    'u.name as teacher_name',
                    'u.last_name as teacher_last_name'
                )
                ->orderBy('s.name')
                ->get();
        }

        if ($mode === 'teacher' && $teacherId) {
            $teacherTimetableSlots = $allTimetableSlots->where('user_id', $teacherId)->values();
        }

        $viewPath = match (auth()->user()->roles->first()->name) {
            'coordinadora' => 'Coordinadora/Horarios',
            'secretaria' => 'Secretaria/Horarios',
            default => 'Coordinadora/Horarios'
        };

        return Inertia::render($viewPath, [
            'groups' => $groups,
            'subjects' => $subjects,
            'teachers' => $teachers,
            'schedules' => $schedules,
            'time_slots' => $timeSlots,
            'timetable_slots' => $timetableSlots,
            'all_timetable_slots' => $allTimetableSlots,
            'teacher_timetable_slots' => $teacherTimetableSlots,
            'available_assignments' => $availableAssignments,
            'filters' => [
                'group_id' => $groupId,
                'mode' => $mode,
                'teacher_id' => $teacherId,
            ],
            'generation_locked' => $generationLocked,
            'current_year' => $currentYear,
            'can' => [
                'create' => auth()->user()->can('create', Schedule::class),
                'update' => auth()->user()->can('update', Schedule::class),
                'delete' => auth()->user()->can('delete', Schedule::class),
                'print' => auth()->user()->can('print', Schedule::class),
            ],
        ]);
    }

    /**
     * ✅ AGREGAR CLASE MANUAL
     */
    public function addSlot(Request $request)
    {
        Log::info('🔵 addSlot INICIADO', [
            'datos_recibidos' => $request->all(),
            'usuario' => auth()->id(),
            'rol' => auth()->user()->roles->pluck('name'),
        ]);

        try {
            $this->authorize('create', Schedule::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            Log::error('❌ Sin permiso para crear horarios', [
                'user_id' => auth()->id(),
                'permissions' => auth()->user()->getAllPermissions()->pluck('name')
            ]);
            return back()->with('error', 'No tienes permiso para agregar clases al horario.');
        }

        $data = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'day' => 'required|string',
            'time_slot_id' => 'required|exists:time_slots,id',
            'subject_id' => 'required|exists:subjects,id',
            'user_id' => 'required|exists:users,id',
        ]);

        Log::info('✅ Validación pasada', $data);

        // Validar asignación profesor-materia-grupo
        $assigned = DB::table('subject_group')
            ->where('group_id', $data['group_id'])
            ->where('subject_id', $data['subject_id'])
            ->where('user_id', $data['user_id'])
            ->exists();

        if (!$assigned) {
            Log::warning('⚠️ Profesor no asignado', $data);
            return back()->with('error', 'El profesor no está asignado a esta asignatura en el grupo.');
        }

        DB::beginTransaction();

        try {
            // Obtener o crear timetable
            $timetableId = DB::table('timetables')->where('group_id', $data['group_id'])->value('id');

            if (!$timetableId) {
                $timetableId = DB::table('timetables')->insertGetId([
                    'group_id' => $data['group_id'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                Log::info('✅ Timetable creado', ['timetable_id' => $timetableId]);
            }

            // ✅ VERIFICAR DISPONIBILIDAD DEL GRUPO
            $groupBusy = DB::table('timetable_slots')
                ->where('timetable_id', $timetableId)
                ->where('day', $data['day'])
                ->where('time_slot_id', $data['time_slot_id'])
                ->exists();

            if ($groupBusy) {
                DB::rollBack();
                Log::warning('⚠️ Grupo ocupado', $data);
                return back()->with('error', 'El grupo ya tiene una clase en ese horario.');
            }

            // ✅ VERIFICAR DISPONIBILIDAD DEL PROFESOR
            $teacherBusy = DB::table('timetable_slots as ts')
                ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
                ->where('ts.day', $data['day'])
                ->where('ts.time_slot_id', $data['time_slot_id'])
                ->where('ts.user_id', $data['user_id'])
                ->exists();

            if ($teacherBusy) {
                DB::rollBack();
                Log::warning('⚠️ Profesor ocupado', $data);
                return back()->with('error', 'El profesor ya tiene una clase en ese horario.');
            }

            // Insertar en timetable_slots
            DB::table('timetable_slots')->insert([
                'timetable_id' => $timetableId,
                'time_slot_id' => $data['time_slot_id'],
                'day' => $data['day'],
                'subject_id' => $data['subject_id'],
                'user_id' => $data['user_id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            Log::info('✅ Slot insertado en timetable_slots');

            // Sincronizar con schedules
            $this->syncTimetableToSchedules($data['group_id']);

            DB::commit();

            Log::info('✅ addSlot COMPLETADO EXITOSAMENTE');

            return redirect()->route('coordinadora.horarios', [
                'group_id' => $data['group_id'],
                'mode' => 'group'
            ])->with('success', 'Clase agregada correctamente.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('❌ Error en addSlot', [
                'mensaje' => $e->getMessage(),
                'linea' => $e->getLine(),
                'archivo' => $e->getFile()
            ]);
            return back()->with('error', 'Error al agregar: ' . $e->getMessage());
        }
    }

    /**
     * ✅ MOVER CLASE (DRAG AND DROP)
     */
    public function move(Request $request)
    {
        Log::info('🔵 move INICIADO', [
            'datos_recibidos' => $request->all(),
            'usuario' => auth()->id(),
        ]);

        try {
            $this->authorize('update', Schedule::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            Log::error('❌ Sin permiso para actualizar horarios');
            return back()->with('error', 'No tienes permiso para mover clases.');
        }

        $data = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'source_day' => 'required|string',
            'source_time_slot_id' => 'required|exists:time_slots,id',
            'target_day' => 'required|string',
            'target_time_slot_id' => 'required|exists:time_slots,id',
        ]);

        DB::beginTransaction();

        try {
            $timetableId = DB::table('timetables')->where('group_id', $data['group_id'])->value('id');

            if (!$timetableId) {
                DB::rollBack();
                return back()->with('error', 'No existe un horario para este grupo.');
            }

            // Obtener clase origen
            $sourceSlot = DB::table('timetable_slots')
                ->where('timetable_id', $timetableId)
                ->where('day', $data['source_day'])
                ->where('time_slot_id', $data['source_time_slot_id'])
                ->first();

            if (!$sourceSlot) {
                DB::rollBack();
                return back()->with('error', 'No hay ninguna clase en el slot origen.');
            }

            // ✅ VERIFICAR DISPONIBILIDAD DEL PROFESOR EN DESTINO
            $teacherBusy = DB::table('timetable_slots as ts')
                ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
                ->where('ts.day', $data['target_day'])
                ->where('ts.time_slot_id', $data['target_time_slot_id'])
                ->where('ts.user_id', $sourceSlot->user_id)
                ->where('tt.id', '!=', $timetableId)
                ->exists();

            if ($teacherBusy) {
                DB::rollBack();
                return back()->with('error', 'El profesor ya tiene una clase en ese horario con otro grupo.');
            }

            // Verificar si destino está ocupado en el mismo grupo
            $targetSlot = DB::table('timetable_slots')
                ->where('timetable_id', $timetableId)
                ->where('day', $data['target_day'])
                ->where('time_slot_id', $data['target_time_slot_id'])
                ->first();

            if ($targetSlot) {
                // INTERCAMBIAR
                DB::table('timetable_slots')
                    ->where('id', $targetSlot->id)
                    ->update([
                        'day' => $data['source_day'],
                        'time_slot_id' => $data['source_time_slot_id'],
                        'updated_at' => now(),
                    ]);
            }

            // Mover origen a destino
            DB::table('timetable_slots')
                ->where('id', $sourceSlot->id)
                ->update([
                    'day' => $data['target_day'],
                    'time_slot_id' => $data['target_time_slot_id'],
                    'updated_at' => now(),
                ]);

            $this->syncTimetableToSchedules($data['group_id']);

            DB::commit();

            Log::info('✅ move COMPLETADO EXITOSAMENTE');

            return redirect()->route('coordinadora.horarios', [
                'group_id' => $data['group_id'],
                'mode' => 'group'
            ])->with('success', $targetSlot ? 'Clases intercambiadas correctamente.' : 'Clase movida correctamente.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('❌ Error en move', [
                'mensaje' => $e->getMessage(),
                'linea' => $e->getLine()
            ]);
            return back()->with('error', 'Error al mover: ' . $e->getMessage());
        }
    }

    /**
     * ✅ EDITAR SLOT (CAMBIAR ASIGNATURA)
     */
    public function updateSlot(Request $request)
    {
        Log::info('🔵 updateSlot INICIADO', [
            'datos_recibidos' => $request->all(),
            'usuario' => auth()->id(),
        ]);

        try {
            $this->authorize('update', Schedule::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            Log::error('❌ Sin permiso para actualizar horarios');
            return back()->with('error', 'No tienes permiso para editar clases.');
        }

        $data = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'day' => 'required|string',
            'time_slot_id' => 'required|exists:time_slots,id',
            'subject_id' => 'required|exists:subjects,id',
            'user_id' => 'required|exists:users,id',
        ]);

        // Validar asignación
        $assigned = DB::table('subject_group')
            ->where('group_id', $data['group_id'])
            ->where('subject_id', $data['subject_id'])
            ->where('user_id', $data['user_id'])
            ->exists();

        if (!$assigned) {
            return back()->with('error', 'El profesor no está asignado a esta asignatura en el grupo.');
        }

        DB::beginTransaction();

        try {
            $timetableId = DB::table('timetables')->where('group_id', $data['group_id'])->value('id');

            if (!$timetableId) {
                DB::rollBack();
                return back()->with('error', 'No existe un horario para este grupo.');
            }

            // ✅ VERIFICAR DISPONIBILIDAD DEL PROFESOR
            $teacherBusy = DB::table('timetable_slots as ts')
                ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
                ->where('ts.day', $data['day'])
                ->where('ts.time_slot_id', $data['time_slot_id'])
                ->where('ts.user_id', $data['user_id'])
                ->where('tt.id', '!=', $timetableId)
                ->exists();

            if ($teacherBusy) {
                DB::rollBack();
                return back()->with('error', 'El profesor ya tiene una clase en ese horario con otro grupo.');
            }

            DB::table('timetable_slots')
                ->where('timetable_id', $timetableId)
                ->where('day', $data['day'])
                ->where('time_slot_id', $data['time_slot_id'])
                ->update([
                    'subject_id' => $data['subject_id'],
                    'user_id' => $data['user_id'],
                    'updated_at' => now(),
                ]);

            $this->syncTimetableToSchedules($data['group_id']);

            DB::commit();

            Log::info('✅ updateSlot COMPLETADO EXITOSAMENTE');

            return redirect()->route('coordinadora.horarios', [
                'group_id' => $data['group_id'],
                'mode' => 'group'
            ])->with('success', 'Clase actualizada correctamente.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('❌ Error en updateSlot', [
                'mensaje' => $e->getMessage()
            ]);
            return back()->with('error', 'Error al actualizar: ' . $e->getMessage());
        }
    }

    /**
     * ✅ ELIMINAR SLOT
     */
    public function deleteSlot(Request $request)
    {
        Log::info('🔵 deleteSlot INICIADO', [
            'datos_recibidos' => $request->all(),
            'usuario' => auth()->id(),
        ]);

        try {
            $this->authorize('delete', Schedule::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            Log::error('❌ Sin permiso para eliminar horarios');
            return back()->with('error', 'No tienes permiso para eliminar clases.');
        }

        $data = $request->validate([
            'group_id' => 'required|exists:groups,id',
            'day' => 'required|string',
            'time_slot_id' => 'required|exists:time_slots,id',
        ]);

        DB::beginTransaction();

        try {
            $timetableId = DB::table('timetables')->where('group_id', $data['group_id'])->value('id');

            if (!$timetableId) {
                DB::rollBack();
                return back()->with('error', 'No existe un horario para este grupo.');
            }

            $deleted = DB::table('timetable_slots')
                ->where('timetable_id', $timetableId)
                ->where('day', $data['day'])
                ->where('time_slot_id', $data['time_slot_id'])
                ->delete();

            if (!$deleted) {
                DB::rollBack();
                return back()->with('error', 'No hay ninguna clase en ese slot.');
            }

            $this->syncTimetableToSchedules($data['group_id']);

            DB::commit();

            Log::info('✅ deleteSlot COMPLETADO EXITOSAMENTE');

            return redirect()->route('coordinadora.horarios', [
                'group_id' => $data['group_id'],
                'mode' => 'group'
            ])->with('success', 'Clase eliminada del horario.');

        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('❌ Error en deleteSlot', [
                'mensaje' => $e->getMessage()
            ]);
            return back()->with('error', 'Error al eliminar: ' . $e->getMessage());
        }
    }

    /**
     * ✅ GENERAR HORARIOS (SORTEO AUTOMÁTICO)
     */
    public function generate(Request $request)
    {
        $this->authorize('create', Schedule::class);

        $request->validate([
            'group_id' => 'nullable|exists:groups,id',
            'reset' => 'sometimes|boolean',
            'force' => 'sometimes|boolean',
        ]);

        $targetGroupId = $request->input('group_id');
        $reset = (bool) $request->boolean('reset', true);
        $force = (bool) $request->boolean('force', false);

        $currentYear = now()->year;
        $alreadyGeneratedThisYear = DB::table('timetables')->whereYear('created_at', $currentYear)->exists();

        if (!$force && $alreadyGeneratedThisYear) {
            return back()->with('error', "Ya se generó un horario en $currentYear. Usa 'Regenerar' si necesitas forzar.");
        }

        $days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
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
                $timetableId = DB::table('timetables')->where('group_id', $group->id)->value('id');

                if (!$timetableId) {
                    $timetableId = DB::table('timetables')->insertGetId([
                        'group_id' => $group->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                if ($reset) {
                    DB::table('timetable_slots')->where('timetable_id', $timetableId)->delete();
                }

                $occupiedByTeacher = [];
                $occupiedByGroup = [];

                $existing = DB::table('timetable_slots as ts')
                    ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
                    ->select('ts.day', 'ts.time_slot_id', 'ts.user_id', 'tt.group_id')
                    ->get();

                foreach ($existing as $row) {
                    if ($row->user_id) {
                        $occupiedByTeacher[$row->day][$row->time_slot_id][$row->user_id] = true;
                    }
                    $occupiedByGroup[$row->group_id][$row->day][$row->time_slot_id] = true;
                }

                $assignments = DB::table('subject_group')
                    ->where('group_id', $group->id)
                    ->join('subjects', 'subjects.id', '=', 'subject_group.subject_id')
                    ->select('subject_group.subject_id', 'subject_group.user_id', 'subjects.hours_per_week')
                    ->get();

                $assignments = $assignments->shuffle();
                $daysShuffled = collect($days)->shuffle()->all();

                foreach ($assignments as $asg) {
                    $hoursNeeded = max(0, (int) $asg->hours_per_week);
                    if ($hoursNeeded === 0) continue;

                    $already = DB::table('timetable_slots')
                        ->where('timetable_id', $timetableId)
                        ->where('subject_id', $asg->subject_id)
                        ->count();

                    $remaining = max(0, $hoursNeeded - $already);
                    if ($remaining === 0) continue;

                    // Intentar bloques consecutivos
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

                                    for ($j = 0; $j < $k; $j++) {
                                        $cur = $timeSlots[$i + $j];
                                        $gTaken = !empty($occupiedByGroup[$group->id][$day][$cur->id]);
                                        $tBusy = !empty($occupiedByTeacher[$day][$cur->id][$asg->user_id]);

                                        if ($gTaken || $tBusy) {
                                            $ok = false;
                                            break;
                                        }
                                    }

                                    if ($ok) {
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
                                            $occupiedByGroup[$group->id][$day][$cur->id] = true;
                                        }
                                        $remaining -= $k;
                                        $placedBlock = true;
                                        $found = true;
                                        break;
                                    }
                                }
                            }

                            if ($placedBlock) break;
                        }

                        if (!$placedBlock) break;
                    }

                    // Asignar horas sueltas
                    if ($remaining > 0) {
                        foreach ($daysShuffled as $day) {
                            if ($remaining === 0) break;

                            foreach ($timeSlots as $slot) {
                                if ($remaining === 0) break;

                                $gTaken = !empty($occupiedByGroup[$group->id][$day][$slot->id]);
                                $tBusy = !empty($occupiedByTeacher[$day][$slot->id][$asg->user_id]);

                                if ($gTaken || $tBusy) continue;

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
                                $occupiedByGroup[$group->id][$day][$slot->id] = true;
                                $remaining--;
                            }
                        }
                    }
                }

                if ($reset) {
                    Schedule::where('group_id', $group->id)->delete();
                }

                $this->syncTimetableToSchedules($group->id);
            }

            DB::commit();

            return back()->with('success', 'Horarios generados automáticamente.');

        } catch (\Throwable $e) {
            DB::rollBack();
            return back()->withErrors(['generator' => 'Error generando horarios: ' . $e->getMessage()]);
        }
    }

    /**
     * ✅ SINCRONIZAR TIMETABLE_SLOTS CON SCHEDULES
     */
    private function syncTimetableToSchedules(int $groupId): void
    {
        Schedule::where('group_id', $groupId)->delete();

        $timetableId = DB::table('timetables')->where('group_id', $groupId)->value('id');

        if (!$timetableId) {
            return;
        }

        $rows = DB::table('timetable_slots as ts')
            ->join('time_slots as t', 't.id', '=', 'ts.time_slot_id')
            ->where('ts.timetable_id', $timetableId)
            ->whereNotNull('ts.subject_id')
            ->whereNotNull('ts.user_id')
            ->get(['ts.day', 't.start_time', 't.end_time', 'ts.subject_id', 'ts.user_id']);

        $dayMap = [
            'Lunes' => 1,
            'Martes' => 2,
            'Miercoles' => 3,
            'Jueves' => 4,
            'Viernes' => 5,
        ];

        foreach ($rows as $r) {
            $dayNum = $dayMap[$r->day] ?? null;
            if (!$dayNum) continue;

            Schedule::create([
                'group_id' => $groupId,
                'subject_id' => $r->subject_id,
                'user_id' => $r->user_id,
                'day_of_week' => $dayNum,
                'start_time' => $r->start_time,
                'end_time' => $r->end_time,
                'classroom' => null,
            ]);
        }
    }

    /**
     * ✅ IMPRIMIR HORARIO
     */
    public function print(Request $request)
    {
        $this->authorize('print', Schedule::class);

        $groupId = $request->integer('group_id');
        $teacherId = $request->integer('teacher_id');
        $mode = $request->input('mode', 'group');

        $timeSlots = DB::table('time_slots')->orderBy('start_time')->get();
        $days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

        if ($mode === 'group' && $groupId) {
            $group = Group::with(['grade', 'course'])->findOrFail($groupId);
            $timetableId = DB::table('timetables')->where('group_id', $groupId)->value('id');

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

            return $pdf->download("horario-{$group->nombre}.pdf");
        }

        if ($mode === 'teacher' && $teacherId) {
            $teacher = User::findOrFail($teacherId);

            $teacherSlots = DB::table('timetable_slots as ts')
                ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
                ->join('groups as g', 'g.id', '=', 'tt.group_id')
                ->leftJoin('subjects as s', 's.id', '=', 'ts.subject_id')
                ->select('ts.day', 'ts.time_slot_id', 's.name as subject_name', 'g.nombre as group_name')
                ->where('ts.user_id', $teacherId)
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

            return $pdf->download("horario-{$teacher->name}-{$teacher->last_name}.pdf");
        }

        return back()->withErrors(['error' => 'Debe seleccionar un grupo o docente']);
    }

    public function store(Request $request)
    {
        $this->authorize('create', Schedule::class);

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

        return redirect()->route('coordinadora.horarios', ['group_id' => $data['group_id']])
            ->with('success', 'Horario creado correctamente.');
    }

    public function update(Request $request, string $id)
    {
        $this->authorize('update', Schedule::class);

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

        return redirect()->route('coordinadora.horarios', ['group_id' => $data['group_id']])
            ->with('success', 'Horario actualizado correctamente.');
    }

    public function destroy(string $id)
    {
        $this->authorize('delete', Schedule::class);

        $schedule = Schedule::findOrFail($id);
        $schedule->delete();

        return back()->with('success', 'Horario eliminado.');
    }
}