<?php
namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\AcademicPeriod;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Carbon\Carbon;

class AsistenciasEstudentController extends Controller
{
    /**
     * Mostrar asistencias del estudiante autenticado
     */
    public function index()
    {
        $student = Auth::user();
        
        // Obtener el período académico activo
        $currentPeriod = AcademicPeriod::getPeriodoActivo();
        
        if (!$currentPeriod) {
            return Inertia::render('Estudiante/Asistencias', [
                'error' => 'No hay un período académico activo. Contacta a la secretaría.',
                'materias' => [],
                'estadisticas' => null,
                'currentPeriod' => null,
            ]);
        }
        
        // Obtener todos los grupos del estudiante
        $groups = DB::table('group_user')
            ->where('user_id', $student->id)
            ->pluck('group_id');
        
        if ($groups->isEmpty()) {
            return Inertia::render('Estudiante/Asistencias', [
                'error' => 'No estás asignado a ningún grupo.',
                'materias' => [],
                'estadisticas' => null,
                'currentPeriod' => null,
            ]);
        }
        
        // Obtener todas las materias del estudiante con sus asistencias
        $materias = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('groups as g', 'sg.group_id', '=', 'g.id')
            ->join('users as teacher', 'sg.user_id', '=', 'teacher.id')
            ->whereIn('sg.group_id', $groups)
            ->select(
                'sg.subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'sg.group_id',
                'g.nombre as group_name',
                'teacher.name as teacher_name',
                'teacher.last_name as teacher_last_name',
                'sg.user_id as teacher_id'
            )
            ->orderBy('s.name')
            ->get()
            ->map(function ($materia) use ($student, $currentPeriod) {
                // ✅ OBTENER LOS DÍAS DE CLASE VÁLIDOS SEGÚN EL HORARIO
                $validDaysISO = $this->getValidClassDays(
                    $materia->subject_id, 
                    $materia->group_id, 
                    $materia->teacher_id
                );
                
                // Obtener registros de asistencia del período actual
                $attendances = DB::table('attendances')
                    ->where('user_id', $student->id)
                    ->where('subject_id', $materia->subject_id)
                    ->where('group_id', $materia->group_id)
                    ->whereBetween('date', [
                        $currentPeriod->start_date,
                        $currentPeriod->end_date
                    ])
                    ->orderBy('date', 'desc')
                    ->get()
                    // ✅ FILTRAR SOLO FECHAS QUE CAEN EN DÍAS DE CLASE
                    ->filter(function ($record) use ($validDaysISO) {
                        if (empty($validDaysISO)) return true; // Si no hay horario, mostrar todas
                        
                        $date = Carbon::parse($record->date);
                        return in_array($date->dayOfWeekIso, $validDaysISO);
                    })
                    ->map(function ($record) {
                        return [
                            'id' => $record->id,
                            'date' => $record->date,
                            'formatted_date' => Carbon::parse($record->date)->locale('es')->isoFormat('dddd, D [de] MMMM, YYYY'),
                            'short_date' => Carbon::parse($record->date)->locale('es')->isoFormat('D MMM'),
                            'day_name' => Carbon::parse($record->date)->locale('es')->isoFormat('dddd'),
                            'status' => $record->status,
                            'notes' => $record->notes,
                            'created_at' => $record->created_at,
                        ];
                    })
                    ->values(); // Re-indexar después del filtro
                
                // Calcular estadísticas
                $total = $attendances->count();
                $present = $attendances->where('status', 'present')->count();
                $absent = $attendances->where('status', 'absent')->count();
                $late = $attendances->where('status', 'late')->count();
                $excused = $attendances->where('status', 'excused')->count();
                
                // Calcular porcentaje de asistencia
                $attendancePercentage = $total > 0 
                    ? round((($present + $late + $excused) / $total) * 100, 1)
                    : 0;
                
                return [
                    'subject_id' => $materia->subject_id,
                    'subject_name' => $materia->subject_name,
                    'subject_code' => $materia->subject_code,
                    'group_id' => $materia->group_id,
                    'group_name' => $materia->group_name,
                    'teacher_name' => $materia->teacher_name . ' ' . $materia->teacher_last_name,
                    'attendances' => $attendances,
                    'stats' => [
                        'total' => $total,
                        'present' => $present,
                        'absent' => $absent,
                        'late' => $late,
                        'excused' => $excused,
                        'attendance_percentage' => $attendancePercentage,
                    ],
                ];
            });
        
        // Estadísticas globales del estudiante
        $totalClasses = $materias->sum(fn($m) => $m['stats']['total']);
        $totalPresent = $materias->sum(fn($m) => $m['stats']['present']);
        $totalAbsent = $materias->sum(fn($m) => $m['stats']['absent']);
        $totalLate = $materias->sum(fn($m) => $m['stats']['late']);
        $totalExcused = $materias->sum(fn($m) => $m['stats']['excused']);
        
        $globalPercentage = $totalClasses > 0
            ? round((($totalPresent + $totalLate + $totalExcused) / $totalClasses) * 100, 1)
            : 0;
        
        return Inertia::render('Estudiante/Asistencias', [
            'materias' => $materias,
            'estadisticas' => [
                'total_clases' => $totalClasses,
                'total_presente' => $totalPresent,
                'total_ausente' => $totalAbsent,
                'total_tarde' => $totalLate,
                'total_excusado' => $totalExcused,
                'porcentaje_global' => $globalPercentage,
                'total_materias' => $materias->count(),
            ],
            'currentPeriod' => [
                'id' => $currentPeriod->id,
                'name' => $currentPeriod->name,
                'start_date' => $currentPeriod->start_date->format('Y-m-d'),
                'end_date' => $currentPeriod->end_date->format('Y-m-d'),
                'formatted_range' => $currentPeriod->start_date->locale('es')->isoFormat('D MMM YYYY') . ' - ' . 
                                    $currentPeriod->end_date->locale('es')->isoFormat('D MMM YYYY'),
            ],
            'can' => [
                'view_attendance' => auth()->user()->can('attendances.view'),
            ]
        ]);
    }
    
    /**
     * ✅ NUEVO MÉTODO: Obtener días de clase válidos según el horario
     */
    private function getValidClassDays($subjectId, $groupId, $teacherId)
    {
        // Obtener los días de la semana donde hay clases
        $schedules = DB::table('timetable_slots as ts')
            ->join('timetables as tt', 'tt.id', '=', 'ts.timetable_id')
            ->where('ts.user_id', $teacherId)
            ->where('ts.subject_id', $subjectId)
            ->where('tt.group_id', $groupId)
            ->pluck('ts.day');
        
        if ($schedules->isEmpty()) {
            return []; // Sin horario configurado
        }
        
        // Mapeo de días en español a números ISO (1=Lunes, 7=Domingo)
        $dayMap = [
            'Lunes' => 1,
            'Martes' => 2,
            'Miercoles' => 3,
            'Miércoles' => 3,
            'Jueves' => 4,
            'Viernes' => 5,
            'Sábado' => 6,
            'Sabado' => 6,
            'Domingo' => 7,
        ];
        
        // Convertir días a números ISO
        return $schedules
            ->map(fn($day) => $dayMap[$day] ?? null)
            ->filter()
            ->unique()
            ->values()
            ->all();
    }
}