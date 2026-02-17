<?php

namespace App\Services;

use App\Models\Boletin;
use App\Models\AcademicPeriod;
use App\Models\User;
use App\Models\Group;
use App\Models\Attendance;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class BoletinService
{
    /**
     * Generar boletines para un periodo académico
     */
    public function generarBoletinesPeriodo(AcademicPeriod $periodo): array
    {
        $grupos = Group::with(['students' => function($q) {
            $q->where('is_active', true);
        }])->get();

        $generados = 0;
        $errores = [];

        foreach ($grupos as $grupo) {
            foreach ($grupo->students as $estudiante) {
                try {
                    $this->generarBoletinEstudiante($estudiante, $periodo, $grupo);
                    $generados++;
                } catch (\Exception $e) {
                    Log::error("Error generando boletín", [
                        'estudiante_id' => $estudiante->id,
                        'periodo_id' => $periodo->id,
                        'error' => $e->getMessage()
                    ]);
                    $errores[] = "Error en {$estudiante->name}: {$e->getMessage()}";
                }
            }
        }

        return [
            'generados' => $generados,
            'errores' => $errores,
        ];
    }

    /**
     * Generar boletín para un estudiante específico
     */
    public function generarBoletinEstudiante(User $estudiante, AcademicPeriod $periodo, Group $grupo): Boletin
    {
        // Calcular datos académicos
        $promedioGeneral = $this->calcularPromedioGeneral($estudiante, $periodo, $grupo);
        $puestoInfo = $this->calcularPuestoGrupo($estudiante, $periodo, $grupo);
        
        // Calcular asistencia
        $asistenciaInfo = $this->calcularAsistencia($estudiante, $periodo, $grupo);
        
        // Obtener director de grupo
        $directorGrupo = $this->obtenerDirectorGrupo($grupo);
        
        // Crear o actualizar boletín
        $boletin = Boletin::updateOrCreate(
            [
                'student_id' => $estudiante->id,
                'academic_period_id' => $periodo->id,
            ],
            [
                'group_id' => $grupo->id,
                'promedio_general' => $promedioGeneral,
                'puesto_grupo' => $puestoInfo['puesto'],
                'total_estudiantes_grupo' => $puestoInfo['total'],
                'dias_asistidos' => $asistenciaInfo['dias_asistidos'],
                'dias_totales' => $asistenciaInfo['dias_totales'],
                'porcentaje_asistencia' => $asistenciaInfo['porcentaje'],
                'director_grupo_id' => $directorGrupo?->id,
                'estado' => 'pendiente', // Se marcará como generado al crear el DOCX
            ]
        );

        return $boletin;
    }

    /**
     * Calcular promedio general del estudiante en el periodo
     */
    private function calcularPromedioGeneral(User $estudiante, AcademicPeriod $periodo, Group $grupo): float
    {
        // Obtener asignaturas del grupo
        $asignaturas = DB::table('subject_group')
            ->where('group_id', $grupo->id)
            ->pluck('subject_id')
            ->unique();

        if ($asignaturas->isEmpty()) {
            return 0.0;
        }

        $sumaPromedios = 0;
        $contadorAsignaturas = 0;

        foreach ($asignaturas as $asignaturaId) {
            $promedioAsignatura = $this->calcularPromedioAsignatura(
                $estudiante,
                $asignaturaId,
                $periodo,
                $grupo
            );

            if ($promedioAsignatura > 0) {
                $sumaPromedios += $promedioAsignatura;
                $contadorAsignaturas++;
            }
        }

        return $contadorAsignaturas > 0 
            ? round($sumaPromedios / $contadorAsignaturas, 2) 
            : 0.0;
    }

    /**
     * Calcular promedio de una asignatura específica
     */
    private function calcularPromedioAsignatura(User $estudiante, int $asignaturaId, AcademicPeriod $periodo, Group $grupo): float
    {
        // Obtener notas de tareas
        $tareasNotas = DB::table('task_submissions as ts')
            ->join('tasks as t', 'ts.task_id', '=', 't.id')
            ->where('ts.student_id', $estudiante->id)
            ->where('t.subject_id', $asignaturaId)
            ->where('t.group_id', $grupo->id)
            ->where('t.academic_period_id', $periodo->id)
            ->whereNotNull('ts.grade')
            ->select('ts.grade', 't.max_score')
            ->get();

        // Obtener notas manuales
        $notasManuales = DB::table('manual_grade_scores as mgs')
            ->join('manual_grades as mg', 'mgs.manual_grade_id', '=', 'mg.id')
            ->where('mgs.student_id', $estudiante->id)
            ->where('mg.subject_id', $asignaturaId)
            ->where('mg.group_id', $grupo->id)
            ->where('mg.academic_period_id', $periodo->id)
            ->whereNotNull('mgs.score')
            ->select('mgs.score', 'mg.max_score')
            ->get();

        $totalNotas = $tareasNotas->count() + $notasManuales->count();

        if ($totalNotas === 0) {
            return 0.0;
        }

        $sumaNotas = 0;

        // Normalizar notas de tareas a escala 1-5
        foreach ($tareasNotas as $nota) {
            $notaNormalizada = ($nota->grade / $nota->max_score) * 5.0;
            $sumaNotas += $notaNormalizada;
        }

        // Normalizar notas manuales a escala 1-5
        foreach ($notasManuales as $nota) {
            $notaNormalizada = ($nota->score / $nota->max_score) * 5.0;
            $sumaNotas += $notaNormalizada;
        }

        return round($sumaNotas / $totalNotas, 2);
    }

    /**
     * Calcular puesto del estudiante en el grupo
     */
    private function calcularPuestoGrupo(User $estudiante, AcademicPeriod $periodo, Group $grupo): array
    {
        // Obtener todos los estudiantes del grupo con sus promedios
        $estudiantesConPromedios = [];

        foreach ($grupo->students as $est) {
            $promedio = $this->calcularPromedioGeneral($est, $periodo, $grupo);
            
            if ($promedio > 0) {
                $estudiantesConPromedios[] = [
                    'id' => $est->id,
                    'promedio' => $promedio,
                ];
            }
        }

        // Ordenar por promedio descendente
        usort($estudiantesConPromedios, function($a, $b) {
            return $b['promedio'] <=> $a['promedio'];
        });

        // Encontrar el puesto del estudiante
        $puesto = 0;
        foreach ($estudiantesConPromedios as $index => $est) {
            if ($est['id'] === $estudiante->id) {
                $puesto = $index + 1;
                break;
            }
        }

        return [
            'puesto' => $puesto,
            'total' => count($estudiantesConPromedios),
        ];
    }

    /**
     * Calcular datos de asistencia
     */
    private function calcularAsistencia(User $estudiante, AcademicPeriod $periodo, Group $grupo): array
    {
        // Contar asistencias en el rango del periodo
        $asistencias = Attendance::where('user_id', $estudiante->id)
            ->where('group_id', $grupo->id)
            ->whereBetween('date', [$periodo->start_date, $periodo->end_date])
            ->get();

        $diasAsistidos = $asistencias->where('status', 'presente')->count();
        $diasTotales = $asistencias->count();

        $porcentaje = $diasTotales > 0 
            ? round(($diasAsistidos / $diasTotales) * 100, 2) 
            : 0.0;

        return [
            'dias_asistidos' => $diasAsistidos,
            'dias_totales' => $diasTotales,
            'porcentaje' => $porcentaje,
        ];
    }

    /**
     * Obtener director de grupo
     */
    private function obtenerDirectorGrupo(Group $grupo): ?User
    {
        // Buscar el profesor asignado al grupo
        // Esto depende de tu lógica de negocio
        // Por ahora, tomamos el primer profesor asignado al grupo
        
        $directorId = DB::table('subject_group')
            ->where('group_id', $grupo->id)
            ->value('user_id');

        return $directorId ? User::find($directorId) : null;
    }

    /**
     * Obtener notas por asignatura para el boletín
     */
    public function obtenerNotasPorAsignatura(User $estudiante, AcademicPeriod $periodo, Group $grupo): array
    {
        $asignaturas = DB::table('subject_group as sg')
            ->join('subjects as s', 'sg.subject_id', '=', 's.id')
            ->join('users as u', 'sg.user_id', '=', 'u.id')
            ->where('sg.group_id', $grupo->id)
            ->select(
                's.id as subject_id',
                's.name as subject_name',
                's.code as subject_code',
                'u.name as teacher_name',
                'u.last_name as teacher_last_name'
            )
            ->get();

        $notasPorAsignatura = [];

        foreach ($asignaturas as $asignatura) {
            $promedio = $this->calcularPromedioAsignatura(
                $estudiante,
                $asignatura->subject_id,
                $periodo,
                $grupo
            );

            $desempeno = $this->obtenerDesempeno($promedio);

            $notasPorAsignatura[] = [
                'asignatura' => $asignatura->subject_name,
                'codigo' => $asignatura->subject_code,
                'docente' => trim("{$asignatura->teacher_name} {$asignatura->teacher_last_name}"),
                'nota' => $promedio,
                'desempeno' => $desempeno,
            ];
        }

        return $notasPorAsignatura;
    }

    /**
     * Obtener desempeño según escala colombiana
     */
    private function obtenerDesempeno(float $nota): string
    {
        if ($nota >= 4.6) return 'SUPERIOR';
        if ($nota >= 4.0) return 'ALTO';
        if ($nota >= 3.0) return 'BÁSICO';
        return 'BAJO';
    }
}