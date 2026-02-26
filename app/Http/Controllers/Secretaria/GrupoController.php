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
            if (!auth()->user()->can('groups.view')) {
                abort(403, 'No tienes permiso para ver los grupos.');
            }

            $query = Group::with(['grade:id,nombre', 'course:id,nombre'])
                ->select('id', 'nombre', 'grade_id', 'course_id');

            if ($request->filled('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('nombre', 'like', "%{$search}%")
                      ->orWhereHas('grade', fn($q) => $q->where('nombre', 'like', "%{$search}%"))
                      ->orWhereHas('course', fn($q) => $q->where('nombre', 'like', "%{$search}%"));
                });
            }

            if ($request->filled('grade_id') && $request->grade_id !== 'todos') {
                $query->where('grade_id', $request->grade_id);
            }

            if ($request->filled('course_id') && $request->course_id !== 'todos') {
                $query->where('course_id', $request->course_id);
            }

            $grupos = $query->orderBy('nombre')->get();
            $grados = Grade::select('id', 'nombre')->orderBy('nombre')->get();
            $cursos = Course::select('id', 'nombre')->orderBy('nombre')->get();

            return Inertia::render('Secretaria/Grupos', [
                'grupos'  => $grupos,
                'grados'  => $grados,
                'cursos'  => $cursos,
                'filters' => $request->only(['search', 'grade_id', 'course_id']),
                'can'     => [
                    'create' => auth()->user()->can('groups.create'),
                    'update' => auth()->user()->can('groups.update'),
                    'delete' => auth()->user()->can('groups.delete'),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error en GrupoController::index', [
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => $e->getFile(),
            ]);

            return Inertia::render('Secretaria/Grupos', [
                'grupos'  => ['data' => [], 'total' => 0, 'per_page' => 10, 'current_page' => 1, 'last_page' => 1, 'links' => []],
                'grados'  => [],
                'cursos'  => [],
                'filters' => [],
                'error'   => 'Error al cargar datos: ' . $e->getMessage(),
                'can'     => ['create' => false, 'update' => false, 'delete' => false],
            ]);
        }
    }

    /**
     * Crear nuevo grupo
     */
    public function store(Request $request)
    {
        try {
            if (!auth()->user()->can('groups.create')) {
                abort(403, 'No tienes permiso para crear grupos.');
            }

            $validated = $request->validate([
                'nombre'       => 'required|string|max:50',
                'grado_nombre' => 'required|string|max:10',
                'curso_nombre' => 'required|string|max:5',
            ]);

            DB::beginTransaction();

            $grado = Grade::firstOrCreate(
                ['nombre' => strtoupper(trim($validated['grado_nombre']))]
            );

            $curso = Course::firstOrCreate(
                ['nombre' => strtoupper(trim($validated['curso_nombre']))]
            );

            if (Group::where('grade_id', $grado->id)->where('course_id', $curso->id)->exists()) {
                DB::rollBack();
                return back()->withErrors(['curso_nombre' => 'Ya existe un grupo con esta combinación de grado y curso'])->withInput();
            }

            $grupo = Group::create([
                'nombre'    => strtoupper(trim($validated['nombre'])),
                'grade_id'  => $grado->id,
                'course_id' => $curso->id,
            ]);

            DB::commit();

            return redirect()->route('secretaria.grupos')
                ->with('success', '✅ Grupo "' . $grupo->nombre . '" creado correctamente');
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al crear grupo', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ No se pudo crear el grupo: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Actualizar grupo existente
     * ✅ FIX IDOR: Route Model Binding reemplaza findOrFail($id) manual
     *    Además se corrigió el typo 'gropus.update' → 'groups.update'
     */
    public function update(Request $request, Group $grupo)
    {
        try {
            if (!auth()->user()->can('groups.update')) {
                abort(403, 'No tienes permiso para actualizar grupos.');
            }

            $validated = $request->validate([
                'nombre'       => 'required|string|max:50',
                'grado_nombre' => 'required|string|max:10',
                'curso_nombre' => 'required|string|max:5',
            ]);

            DB::beginTransaction();

            $grado = Grade::firstOrCreate(['nombre' => strtoupper(trim($validated['grado_nombre']))]);
            $curso = Course::firstOrCreate(['nombre' => strtoupper(trim($validated['curso_nombre']))]);

            if (Group::where('grade_id', $grado->id)->where('course_id', $curso->id)->where('id', '!=', $grupo->id)->exists()) {
                DB::rollBack();
                return back()->withErrors(['curso_nombre' => 'Ya existe otro grupo con esta combinación de grado y curso'])->withInput();
            }

            $grupo->update([
                'nombre'    => strtoupper(trim($validated['nombre'])),
                'grade_id'  => $grado->id,
                'course_id' => $curso->id,
            ]);

            DB::commit();

            return redirect()->route('secretaria.grupos')
                ->with('success', '✅ Grupo "' . $grupo->nombre . '" actualizado correctamente');
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            DB::rollBack();
            return back()->with('error', '❌ El grupo no existe');
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return back()->withErrors($e->errors())->withInput();
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar grupo', ['message' => $e->getMessage(), 'id' => $grupo->id]);
            return back()->with('error', '❌ No se pudo actualizar el grupo: ' . $e->getMessage())->withInput();
        }
    }

    /**
     * Eliminar grupo
     * ✅ FIX IDOR: Route Model Binding + permission check
     */
    public function destroy(Group $grupo)
    {
        try {
            if (!auth()->user()->can('groups.delete')) {
                abort(403, 'No tienes permiso para eliminar grupos.');
            }

            if ($grupo->students()->count() > 0) {
                return back()->with('error', '❌ No se puede eliminar el grupo porque tiene ' . $grupo->students()->count() . ' estudiante(s) asignado(s)');
            }

            if ($grupo->teachers()->count() > 0) {
                return back()->with('error', '❌ No se puede eliminar el grupo porque tiene profesores asignados');
            }

            $nombre = $grupo->nombre;
            $grupo->delete();

            return redirect()->route('secretaria.grupos')
                ->with('success', "✅ Grupo '$nombre' eliminado correctamente");
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return back()->with('error', '❌ El grupo no existe');
        } catch (\Exception $e) {
            Log::error('Error al eliminar grupo', ['message' => $e->getMessage(), 'id' => $grupo->id]);
            return back()->with('error', '❌ No se pudo eliminar el grupo: ' . $e->getMessage());
        }
    }
}