<?php

namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\Grade;
use App\Models\Course;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class GrupoController extends Controller
{
    /**
     * Mostrar listado de grupos con filtros
     */
    public function index(Request $request)
    {
        try {
            $query = Group::with(['grade:id,nombre', 'course:id,nombre'])
                ->select('id', 'nombre', 'grade_id', 'course_id');

            // Aplicar filtro de búsqueda
            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                      ->orWhereHas('grade', function($q) use ($search) {
                          $q->where('nombre', 'like', "%{$search}%");
                      })
                      ->orWhereHas('course', function($q) use ($search) {
                          $q->where('nombre', 'like', "%{$search}%");
                      });
                });
            }

            // Aplicar filtro por grado
            if ($request->filled('grade_id') && $request->grade_id !== 'todos') {
                $query->where('grade_id', $request->grade_id);
            }

            // Aplicar filtro por curso
            if ($request->filled('course_id') && $request->course_id !== 'todos') {
                $query->where('course_id', $request->course_id);
            }

            $grupos = $query->orderBy('nombre', 'asc')->paginate(10);
            $grados = Grade::select('id', 'nombre')->orderBy('nombre')->get();
            $cursos = Course::select('id', 'nombre')->orderBy('nombre')->get();

            Log::info('Controlador Grupos ejecutado', [
                'grupos_count' => $grupos->total(),
                'grados_count' => $grados->count(),
                'cursos_count' => $cursos->count(),
                'filters' => $request->only(['search', 'grade_id', 'course_id']),
            ]);

            return Inertia::render('Secretaria/Grupos', [
                'grupos' => $grupos,
                'grados' => $grados,
                'cursos' => $cursos,
                'filters' => $request->only(['search', 'grade_id', 'course_id']),
            ]);
        } catch (\Exception $e) {
            Log::error('Error en GrupoController::index', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('Secretaria/Grupos', [
                'grupos' => [
                    'data' => [],
                    'total' => 0,
                    'per_page' => 10,
                    'current_page' => 1,
                    'last_page' => 1,
                    'links' => []
                ],
                'grados' => [],
                'cursos' => [],
                'filters' => [],
                'error' => 'Error al cargar datos: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Crear nuevo grupo
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'nombre' => 'required|string|max:50',
                'grado_nombre' => 'required|string|max:10',
                'curso_nombre' => 'required|string|max:5',
            ], [
                'nombre.required' => 'El nombre del grupo es obligatorio',
                'nombre.max' => 'El nombre no puede exceder 50 caracteres',
                'grado_nombre.required' => 'El grado es obligatorio',
                'grado_nombre.max' => 'El grado no puede exceder 10 caracteres',
                'curso_nombre.required' => 'El curso es obligatorio',
                'curso_nombre.max' => 'El curso no puede exceder 5 caracteres',
            ]);

            DB::beginTransaction();

            // Buscar o crear el grado (convirtiendo a mayúsculas)
            $grado = Grade::firstOrCreate(
                ['nombre' => strtoupper(trim($validated['grado_nombre']))],
                ['nombre' => strtoupper(trim($validated['grado_nombre']))]
            );

            // Buscar o crear el curso (convirtiendo a mayúsculas)
            $curso = Course::firstOrCreate(
                ['nombre' => strtoupper(trim($validated['curso_nombre']))],
                ['nombre' => strtoupper(trim($validated['curso_nombre']))]
            );

            // Verificar si ya existe un grupo con la misma combinación
            $existeGrupo = Group::where('grade_id', $grado->id)
                ->where('course_id', $curso->id)
                ->exists();

            if ($existeGrupo) {
                DB::rollBack();
                return back()->withErrors([
                    'curso_nombre' => 'Ya existe un grupo con esta combinación de grado y curso'
                ])->withInput();
            }

            // Crear el grupo
            $grupo = Group::create([
                'nombre' => strtoupper(trim($validated['nombre'])),
                'grade_id' => $grado->id,
                'course_id' => $curso->id,
            ]);

            DB::commit();

            Log::info('Grupo creado exitosamente', [
                'grupo_id' => $grupo->id,
                'nombre' => $grupo->nombre,
                'grado' => $grado->nombre,
                'curso' => $curso->nombre,
            ]);

            return redirect()->route('secretaria.grupos')
                ->with('success', '✅ Grupo "' . $grupo->nombre . '" creado correctamente');

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear grupo', [
                'message' => $e->getMessage(),
                'data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', '❌ No se pudo crear el grupo: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Actualizar grupo existente
     */
    public function update(Request $request, $id)
    {
        try {
            $group = Group::findOrFail($id);
            
            $validated = $request->validate([
                'nombre' => 'required|string|max:50',
                'grado_nombre' => 'required|string|max:10',
                'curso_nombre' => 'required|string|max:5',
            ], [
                'nombre.required' => 'El nombre del grupo es obligatorio',
                'nombre.max' => 'El nombre no puede exceder 50 caracteres',
                'grado_nombre.required' => 'El grado es obligatorio',
                'grado_nombre.max' => 'El grado no puede exceder 10 caracteres',
                'curso_nombre.required' => 'El curso es obligatorio',
                'curso_nombre.max' => 'El curso no puede exceder 5 caracteres',
            ]);

            DB::beginTransaction();

            // Buscar o crear el grado
            $grado = Grade::firstOrCreate(
                ['nombre' => strtoupper(trim($validated['grado_nombre']))],
                ['nombre' => strtoupper(trim($validated['grado_nombre']))]
            );

            // Buscar o crear el curso
            $curso = Course::firstOrCreate(
                ['nombre' => strtoupper(trim($validated['curso_nombre']))],
                ['nombre' => strtoupper(trim($validated['curso_nombre']))]
            );

            // Verificar si ya existe otro grupo con la misma combinación (excluyendo el actual)
            $existeGrupo = Group::where('grade_id', $grado->id)
                ->where('course_id', $curso->id)
                ->where('id', '!=', $id)
                ->exists();

            if ($existeGrupo) {
                DB::rollBack();
                return back()->withErrors([
                    'curso_nombre' => 'Ya existe otro grupo con esta combinación de grado y curso'
                ])->withInput();
            }

            // Actualizar el grupo
            $group->update([
                'nombre' => strtoupper(trim($validated['nombre'])),
                'grade_id' => $grado->id,
                'course_id' => $curso->id,
            ]);

            DB::commit();

            Log::info('Grupo actualizado exitosamente', [
                'grupo_id' => $group->id,
                'nombre' => $group->nombre,
                'grado' => $grado->nombre,
                'curso' => $curso->nombre,
            ]);

            return redirect()->route('secretaria.grupos')
                ->with('success', '✅ Grupo "' . $group->nombre . '" actualizado correctamente');

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            Log::error('Grupo no encontrado', ['id' => $id]);
            return back()->with('error', '❌ El grupo no existe');
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar grupo', [
                'message' => $e->getMessage(),
                'id' => $id,
                'data' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', '❌ No se pudo actualizar el grupo: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Eliminar grupo
     */
    public function destroy($id)
    {
        try {
            $group = Group::findOrFail($id);
            
            // Verificar si tiene estudiantes asignados (descomenta y ajusta según tu modelo)
            // if ($group->students()->count() > 0) {
            //     return back()->with('error', '❌ No se puede eliminar el grupo porque tiene ' . $group->students()->count() . ' estudiante(s) asignado(s)');
            // }
            
            // Verificar si tiene profesores asignados (descomenta y ajusta según tu modelo)
            // if ($group->teachers()->count() > 0) {
            //     return back()->with('error', '❌ No se puede eliminar el grupo porque tiene profesores asignados');
            // }

            $nombreGrupo = $group->nombre;
            $group->delete();

            Log::info('Grupo eliminado exitosamente', [
                'grupo_id' => $id,
                'nombre' => $nombreGrupo,
            ]);
            
            return redirect()->route('secretaria.grupos')
                ->with('success', "✅ Grupo '$nombreGrupo' eliminado correctamente");

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            Log::error('Grupo no encontrado para eliminar', ['id' => $id]);
            return back()->with('error', '❌ El grupo no existe');
        } catch (\Exception $e) {
            Log::error('Error al eliminar grupo', [
                'message' => $e->getMessage(),
                'id' => $id,
                'trace' => $e->getTraceAsString(),
            ]);
            return back()->with('error', '❌ No se pudo eliminar el grupo: ' . $e->getMessage());
        }
    }
}