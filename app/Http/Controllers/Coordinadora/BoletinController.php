<?php

namespace App\Http\Controllers\Coordinadora;

use App\Http\Controllers\Controller;
use App\Models\Boletin;
use App\Models\AcademicPeriod;
use App\Models\Group;
use App\Models\User;
use App\Services\BoletinService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class BoletinController extends Controller
{
    protected $boletinService;

    public function __construct(BoletinService $boletinService)
    {
        $this->boletinService = $boletinService;
    }

    /**
     * Mostrar lista de boletines
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Boletin::class);

        // Obtener periodos cerrados (donde se pueden generar boletines)
        $periodos = AcademicPeriod::whereIn('status', ['closed', 'archived'])
            ->ordenado()
            ->get()
            ->map(fn($p) => [
                'id' => $p->id,
                'nombre' => $p->name,
                'fecha_inicio' => $p->start_date->format('Y-m-d'),
                'fecha_fin' => $p->end_date->format('Y-m-d'),
            ]);

        // Obtener grupos
        $grupos = Group::with('grade', 'course')
            ->get()
            ->map(fn($g) => [
                'id' => $g->id,
                'nombre' => $g->nombre,
            ]);

        // Filtros
        $periodoId = $request->get('periodo_id', $periodos->first()?->id);
        $grupoId = $request->get('grupo_id');
        $searchTerm = $request->get('search');

        // Query base
        $query = Boletin::with(['student', 'academicPeriod', 'group'])
            ->when($periodoId, fn($q) => $q->byPeriod($periodoId))
            ->when($grupoId, fn($q) => $q->byGroup($grupoId))
            ->when($searchTerm, function($q) use ($searchTerm) {
                $q->whereHas('student', function($sq) use ($searchTerm) {
                    $sq->where('name', 'like', "%{$searchTerm}%")
                       ->orWhere('last_name', 'like', "%{$searchTerm}%");
                });
            });

        $boletines = $query->get()->map(function($boletin) {
            return [
                'id' => $boletin->id,
                'estudiante' => $boletin->student->name . ' ' . $boletin->student->last_name,
                'documento' => $boletin->student->document_number,
                'grado' => $boletin->group->nombre,
                'periodo' => $boletin->academicPeriod->name,
                'promedio' => $boletin->promedio_general,
                'desempeno' => $boletin->desempeno,
                'puesto' => $boletin->puesto_grupo,
                'total_estudiantes' => $boletin->total_estudiantes_grupo,
                'asistencia' => $boletin->porcentaje_asistencia,
                'estado' => $boletin->estado,
                'fecha_generacion' => $boletin->fecha_generacion?->format('Y-m-d H:i'),
                'aprobo' => $boletin->aprobo,
            ];
        });

        // Estadísticas
        $stats = [
            'total' => $boletines->count(),
            'generados' => $boletines->where('estado', 'generado')->count(),
            'pendientes' => $boletines->where('estado', 'pendiente')->count(),
            'promedio_general' => $boletines->avg('promedio') ?? 0,
            'aprobados' => $boletines->where('aprobo', true)->count(),
            'reprobados' => $boletines->where('aprobo', false)->count(),
        ];

        return Inertia::render('Coordinadora/Boletines', [
            'boletines' => $boletines,
            'periodos' => $periodos,
            'grupos' => $grupos,
            'stats' => $stats,
            'filters' => [
                'periodo_id' => $periodoId,
                'grupo_id' => $grupoId,
                'search' => $searchTerm,
            ],
            'can' => [
                'view' => auth()->user()->can('bulletins.view'),
                'generate' => auth()->user()->can('bulletins.generate'),
                'download' => auth()->user()->can('bulletins.download'),
                'update_observations' => auth()->user()->can('bulletins.update_observations'),
            ]
        ]);
    }

    /**
     * Generar todos los boletines pendientes de un periodo
     */
    public function generarTodos(Request $request)
    {
        $this->authorize('generate', Boletin::class);

        $request->validate([
            'periodo_id' => 'required|exists:academic_periods,id',
        ]);

        $periodo = AcademicPeriod::findOrFail($request->periodo_id);

        // Verificar que el periodo esté cerrado
        if (!$periodo->isClosed() && !$periodo->isArchived()) {
            return back()->withErrors([
                'error' => 'Solo se pueden generar boletines de periodos cerrados'
            ]);
        }

        try {
            $resultado = $this->boletinService->generarBoletinesPeriodo($periodo);

            return back()->with('success', sprintf(
                'Se generaron %d boletines correctamente. Errores: %d',
                $resultado['generados'],
                count($resultado['errores'])
            ));
        } catch (\Exception $e) {
            Log::error('Error generando boletines masivos', [
                'periodo_id' => $periodo->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->withErrors([
                'error' => 'Error al generar boletines: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generar boletín individual
     */
    public function generarIndividual(Request $request, $id)
    {
        $this->authorize('generate', Boletin::class);

        $boletin = Boletin::findOrFail($id);

        try {
            // Regenerar datos del boletín
            $periodo = $boletin->academicPeriod;
            $estudiante = $boletin->student;
            $grupo = $boletin->group;

            $this->boletinService->generarBoletinEstudiante($estudiante, $periodo, $grupo);

            return back()->with('success', 'Boletín generado correctamente');
        } catch (\Exception $e) {
            Log::error('Error generando boletín individual', [
                'boletin_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'error' => 'Error al generar boletín: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Generar documento DOCX del boletín
     */
    public function generarDocumento($id)
    {
        $boletin = Boletin::with([
            'student',
            'academicPeriod',
            'group.grade',
            'group.course',
            'directorGrupo'
        ])->findOrFail($id);

        $this->authorize('view', $boletin);

        try {
            // Obtener notas por asignatura
            $notasPorAsignatura = $this->boletinService->obtenerNotasPorAsignatura(
                $boletin->student,
                $boletin->academicPeriod,
                $boletin->group
            );

            // Generar el documento
            $rutaArchivo = $this->generarBoletinDOCX($boletin, $notasPorAsignatura);

            // Actualizar estado del boletín
            $boletin->marcarComoGenerado($rutaArchivo);

            return response()->download(
                storage_path('app/' . $rutaArchivo),
                "Boletin_{$boletin->student->document_number}_{$boletin->academicPeriod->name}.docx"
            )->deleteFileAfterSend(false);
        } catch (\Exception $e) {
            Log::error('Error generando documento DOCX', [
                'boletin_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return back()->withErrors([
                'error' => 'Error al generar documento: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Vista previa del boletín (datos JSON)
     */
    public function vistaPrevia($id)
    {
        $boletin = Boletin::with([
            'student',
            'academicPeriod',
            'group.grade',
            'group.course',
            'directorGrupo'
        ])->findOrFail($id);

        $this->authorize('view', $boletin);

        $notasPorAsignatura = $this->boletinService->obtenerNotasPorAsignatura(
            $boletin->student,
            $boletin->academicPeriod,
            $boletin->group
        );

        return response()->json([
            'boletin' => [
                'estudiante' => [
                    'nombre_completo' => $boletin->student->name . ' ' . $boletin->student->last_name,
                    'documento' => $boletin->student->document_number,
                ],
                'grupo' => $boletin->group->nombre,
                'periodo' => $boletin->academicPeriod->name,
                'año' => $boletin->academicPeriod->year,
                'promedio_general' => $boletin->promedio_general,
                'desempeno' => $boletin->desempeno,
                'puesto' => $boletin->puesto_grupo,
                'total_estudiantes' => $boletin->total_estudiantes_grupo,
                'asistencia' => [
                    'dias_asistidos' => $boletin->dias_asistidos,
                    'dias_totales' => $boletin->dias_totales,
                    'porcentaje' => $boletin->porcentaje_asistencia,
                ],
                'observaciones_convivencia' => $boletin->observaciones_convivencia,
                'observaciones_academicas' => $boletin->observaciones_academicas,
                'recomendaciones' => $boletin->recomendaciones,
                'director_grupo' => $boletin->directorGrupo 
                    ? $boletin->directorGrupo->name . ' ' . $boletin->directorGrupo->last_name
                    : null,
            ],
            'notas_por_asignatura' => $notasPorAsignatura,
        ]);
    }

    /**
     * Actualizar observaciones del boletín
     */
    public function actualizarObservaciones(Request $request, $id)
    {
        $boletin = Boletin::findOrFail($id);
        $this->authorize('updateObservations', Boletin::class);

        $validated = $request->validate([
            'observaciones_convivencia' => 'nullable|string|max:1000',
            'observaciones_academicas' => 'nullable|string|max:1000',
            'recomendaciones' => 'nullable|string|max:1000',
            'observaciones_director' => 'nullable|string|max|1000',
        ]);

        $boletin->update($validated);

        return back()->with('success', 'Observaciones actualizadas correctamente');
    }

    /**
     * Generar documento DOCX con formato colombiano
     * (Este método requiere Node.js - se creará un script separado)
     */
    private function generarBoletinDOCX(Boletin $boletin, array $notasPorAsignatura): string
    {
        // Crear directorio si no existe
        $directory = 'boletines/' . $boletin->academicPeriod->id;
        Storage::makeDirectory($directory);

        // Preparar datos para el script
        $datos = [
            'institucion' => [
                'nombre' => config('app.name', 'Institución Educativa'),
                'nit' => '000000000-0', // Configurar en settings
                'ciudad' => 'Bogotá D.C.',
                'resolucion' => 'Resolución No. XXXX',
            ],
            'estudiante' => [
                'nombre_completo' => $boletin->student->name . ' ' . $boletin->student->last_name,
                'documento' => $boletin->student->document_number,
                'tipo_documento' => $boletin->student->document_type,
            ],
            'academico' => [
                'grupo' => $boletin->group->nombre,
                'periodo' => $boletin->academicPeriod->name,
                'año' => $boletin->academicPeriod->year,
                'fecha_inicio' => $boletin->academicPeriod->start_date->format('d/m/Y'),
                'fecha_fin' => $boletin->academicPeriod->end_date->format('d/m/Y'),
            ],
            'rendimiento' => [
                'promedio_general' => $boletin->promedio_general,
                'desempeno' => $boletin->desempeno,
                'puesto' => $boletin->puesto_grupo,
                'total_estudiantes' => $boletin->total_estudiantes_grupo,
                'aprobo' => $boletin->aprobo,
            ],
            'asistencia' => [
                'dias_asistidos' => $boletin->dias_asistidos,
                'dias_totales' => $boletin->dias_totales,
                'porcentaje' => $boletin->porcentaje_asistencia,
            ],
            'notas_por_asignatura' => $notasPorAsignatura,
            'observaciones' => [
                'convivencia' => $boletin->observaciones_convivencia,
                'academicas' => $boletin->observaciones_academicas,
                'recomendaciones' => $boletin->recomendaciones,
                'director' => $boletin->observaciones_director,
            ],
            'director_grupo' => $boletin->directorGrupo 
                ? $boletin->directorGrupo->name . ' ' . $boletin->directorGrupo->last_name
                : null,
            'fecha_generacion' => now()->format('d/m/Y'),
        ];

        $filename = "boletin_{$boletin->student->document_number}_{$boletin->academicPeriod->id}.docx";
        $filepath = $directory . '/' . $filename;

        // Guardar JSON temporal
        $jsonPath = storage_path('app/boletines/temp_' . $boletin->id . '.json');
        file_put_contents($jsonPath, json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        // Llamar al script Node.js para generar el DOCX
        $scriptPath = base_path('scripts/generar-boletin.js');
        $outputPath = storage_path('app/' . $filepath);

        exec("node {$scriptPath} {$jsonPath} {$outputPath} 2>&1", $output, $returnCode);

        // Limpiar archivo temporal
        @unlink($jsonPath);

        if ($returnCode !== 0) {
            throw new \Exception('Error ejecutando script de generación: ' . implode("\n", $output));
        }

        return $filepath;
    }
}