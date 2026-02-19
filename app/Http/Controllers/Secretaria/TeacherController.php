<?php
// app/Http/Controllers/Secretaria/TeacherController.php
namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Subject;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Gate;

class TeacherController extends Controller
{
    public function index(Request $request)
    {
         // ✅ Verificar permiso directamente
        if (!auth()->user()->can('teachers.view')) {
            abort(403, 'No tienes permiso para ver profesores.');
        }

        try {
            $query = User::role('profesor')
                ->select('id', 'name', 'last_name', 'email', 'document_number', 'phone', 'is_active', 'created_at');

            // Filtro por búsqueda
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('last_name', 'like', '%' . $request->search . '%')
                      ->orWhere('email', 'like', '%' . $request->search . '%')
                      ->orWhere('document_number', 'like', '%' . $request->search . '%');
                });
            }

            // Filtro por estado
            if ($request->filled('estado') && $request->estado !== 'todos') {
                $query->where('is_active', $request->estado === 'activo');
            }

            // Filtro por asignatura
            if ($request->filled('subject_id') && $request->subject_id !== 'todos') {
                $query->whereHas('subjects', function ($q) use ($request) {
                    $q->where('subjects.id', $request->subject_id);
                });
            }

            $profesores = $query->orderBy('name', 'asc')->paginate(10);

            // Cargar asignaturas y grupos de cada profesor
            $profesores->getCollection()->transform(function ($profesor) {
                // Obtener asignaturas con sus grupos
                $asignaciones = DB::table('subject_group')
                    ->where('user_id', $profesor->id)
                    ->join('subjects', 'subject_group.subject_id', '=', 'subjects.id')
                    ->join('groups', 'subject_group.group_id', '=', 'groups.id')
                    ->select(
                        'subjects.id as subject_id',
                        'subjects.name as subject_name',
                        'groups.id as group_id',
                        'groups.nombre as group_name'
                    )
                    ->get();

                // Agrupar por asignatura
                $profesor->asignaturas = $asignaciones->groupBy('subject_id')->map(function ($items) {
                    return [
                        'id' => $items->first()->subject_id,
                        'name' => $items->first()->subject_name,
                        'grupos' => $items->map(function ($item) {
                            return [
                                'id' => $item->group_id,
                                'nombre' => $item->group_name,
                            ];
                        })->values()->toArray()
                    ];
                })->values();

                return $profesor;
            });

            // Datos auxiliares
            $asignaturas = Subject::where('is_active', true)
                ->select('id', 'name', 'code')
                ->orderBy('name')
                ->get();

            $grupos = Group::with(['grade:id,nombre', 'course:id,nombre'])
                ->select('id', 'nombre', 'grade_id', 'course_id')
                ->orderBy('nombre')
                ->get();

            return Inertia::render('Secretaria/Profesores', [
                'profesores' => $profesores,
                'asignaturas' => $asignaturas,
                'grupos' => $grupos,
                'filters' => $request->only(['search', 'subject_id', 'estado']),
                  'can' => [
                    'update' => auth()->user()->can('teachers.update'),
                  ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error al cargar profesores', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('Secretaria/Profesores', [
                'profesores' => [
                    'data' => [],
                    'total' => 0,
                    'per_page' => 10,
                    'current_page' => 1,
                ],
                'asignaturas' => Subject::where('is_active', true)->get(),
                'grupos' => Group::all(),
                'filters' => [],
                'error' => 'No se pudieron cargar los profesores.',
                'can' => [
                    'update' => false,
                ]
            ]);
        }
    }

    public function update(Request $request, $id)
    {
         $profesor = User::role('profesor')->findOrFail($id);
 // ✅ Verificar permiso directamente
        if (!auth()->user()->can('teachers.update')) {
            abort(403, 'No tienes permiso para actualizar profesores.');
        }

        try {
            $validated = $request->validate([
                'is_active' => 'required|boolean',
                'asignaturas' => 'required|array|min:1',
                'asignaturas.*.subject_id' => 'required|exists:subjects,id',
                'asignaturas.*.group_ids' => 'required|array|min:1',
                'asignaturas.*.group_ids.*' => 'exists:groups,id',
            ], [
                'asignaturas.required' => 'Debe asignar al menos una asignatura',
                'asignaturas.*.subject_id.required' => 'La asignatura es obligatoria',
                'asignaturas.*.group_ids.required' => 'Debe seleccionar al menos un grupo',
                'asignaturas.*.group_ids.min' => 'Debe seleccionar al menos un grupo',
            ]);

            DB::transaction(function () use ($profesor, $validated) {
                // Actualizar estado
                $profesor->update(['is_active' => $validated['is_active']]);

                // Eliminar asignaciones anteriores
                DB::table('subject_group')->where('user_id', $profesor->id)->delete();

                // Crear nuevas asignaciones
                $asignaciones = [];
                foreach ($validated['asignaturas'] as $asignatura) {
                    foreach ($asignatura['group_ids'] as $groupId) {
                        $asignaciones[] = [
                            'user_id' => $profesor->id,
                            'subject_id' => $asignatura['subject_id'],
                            'group_id' => $groupId,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ];
                    }
                }

                DB::table('subject_group')->insert($asignaciones);

                Log::info('Profesor actualizado', [
                    'user_id' => $profesor->id,
                    'asignaciones' => count($asignaciones),
                ]);
            });

            return redirect()->back()->with('success', '✅ Profesor actualizado correctamente');
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación', ['errors' => $e->errors()]);
            return back()->withErrors($e->errors())->with('error', '❌ Error de validación');
        } catch (\Exception $e) {
            Log::error('Error al actualizar profesor', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', '❌ No se pudo actualizar: ' . $e->getMessage());
        }
    }

    public function toggle(Request $request, $id)
    {
 $profesor = User::role('profesor')->findOrFail($id);
       // ✅ Verificar permiso directamente
        if (!auth()->user()->can('teachers.update')) {
            abort(403, 'No tienes permiso para cambiar el estado de profesores.');
        } 
        try {
           
            $validated = $request->validate([
                'is_active' => 'required|boolean',
            ]);

            $profesor->update(['is_active' => $validated['is_active']]);

            return back()->with('success', '🔄 Estado actualizado correctamente');
        } catch (\Exception $e) {
            Log::error('Error al cambiar estado', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ No se pudo cambiar el estado');
        }
    }
}