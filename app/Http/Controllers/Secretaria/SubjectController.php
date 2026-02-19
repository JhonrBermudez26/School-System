<?php
// app/Http/Controllers/Secretaria/SubjectController.php
namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class SubjectController extends Controller
{
    public function index(Request $request)
    {
          // ✅ Verificar permiso directamente
        if (!auth()->user()->can('subjects.view')) {
            abort(403, 'No tienes permiso para ver las asignaturas.');
        }

        try {
            $query = Subject::query();

            // Filtro por búsqueda
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('code', 'like', '%' . $request->search . '%');
                });
            }

            // Filtro por estado
            if ($request->filled('estado') && $request->estado !== 'todos') {
                $query->where('is_active', $request->estado === 'activo');
            }

            $asignaturas = $query->orderBy('name', 'asc')->get();

            return Inertia::render('Secretaria/Asignaturas', [
                'asignaturas' => $asignaturas,
                'filters' => $request->only(['search', 'estado']),
                'can' => [
                    'create' => auth()->user()->can('subjects.create'),                    
                    'update' => auth()->user()->can('subjects.update'),
                    'delete' => auth()->user()->can('subjects.delete'),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Error al cargar asignaturas', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('Secretaria/Asignaturas', [
                'asignaturas' => [],
                'filters' => [],
                'error' => 'No se pudieron cargar las asignaturas.',
                'can' => [
                    'create' => false,                    
                    'update' => false,
                    'delete' => false,
                ],
            ]);
        }
    }

    public function store(Request $request)
    {

        // ✅ Verificar permiso directamente
        if (!auth()->user()->can('subjects.create')) {
            abort(403, 'No tienes permiso para crear asignaturas.');
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:subjects,code',
                'description' => 'nullable|string',
                'hours_per_week' => 'required|integer|min:1|max:20',
                'is_active' => 'boolean',
            ], [
                'name.required' => 'El nombre es obligatorio',
                'code.required' => 'El código es obligatorio',
                'code.unique' => 'Este código ya existe',
                'hours_per_week.required' => 'Las horas por semana son obligatorias',
                'hours_per_week.min' => 'Debe ser al menos 1 hora',
                'hours_per_week.max' => 'No puede exceder 20 horas',
            ]);

            Subject::create($validated);

            return redirect()->back()->with('success', '✅ Asignatura creada correctamente');
        } catch (\Illuminate\Validation\ValidationException $e) {
            return back()->withErrors($e->errors())->with('error', '❌ Error de validación');
        } catch (\Exception $e) {
            Log::error('Error al crear asignatura', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ No se pudo crear la asignatura');
        }
    }

    public function update(Request $request, $id)
    {
         $subject = Subject::findOrFail($id);
          // ✅ Verificar permiso directamente
        if (!auth()->user()->can('subjects.update')) {
            abort(403, 'No tienes permiso para actualizar asignaturas.');
        }
        try {
                       $validated = $request->validate([
                'name' => 'required|string|max:255',
                'code' => 'required|string|max:50|unique:subjects,code,' . $id,
                'description' => 'nullable|string',
                'hours_per_week' => 'required|integer|min:1|max:20',
                'is_active' => 'boolean',
            ]);

            $subject->update($validated);

            return redirect()->back()->with('success', '✅ Asignatura actualizada correctamente');
        } catch (\Exception $e) {
            Log::error('Error al actualizar asignatura', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ No se pudo actualizar la asignatura');
        }
    }

    public function destroy($id)
    {
       
        try {
             $subject = Subject::findOrFail($id);
         // ✅ Verificar permiso directamente
        if (!auth()->user()->can('subjects.delete')) {
            abort(403, 'No tienes permiso para eliminar asignaturas.');
        }
            $subject->delete();

            return redirect()->back()->with('success', '✅ Asignatura eliminada correctamente');
        } catch (\Exception $e) {
            Log::error('Error al eliminar asignatura', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ No se pudo eliminar la asignatura');
        }
    }
}