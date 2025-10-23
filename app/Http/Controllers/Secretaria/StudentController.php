<?php

namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Group;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;
use App\Exports\EstudiantesExport;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class StudentController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Base query: solo usuarios con rol estudiante
            $query = User::role('estudiante')
                ->with(['groups.grade', 'groups.course']) // Cargar relación con grupos
                ->select('id', 'name', 'last_name', 'email', 'document_number', 'phone', 'is_active', 'created_at');

            // 🔍 Filtro por búsqueda
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('last_name', 'like', '%' . $request->search . '%')
                      ->orWhere('email', 'like', '%' . $request->search . '%')
                      ->orWhere('document_number', 'like', '%' . $request->search . '%');
                });
            }

            // 🔍 Filtro por grupo
            if ($request->filled('group_id') && $request->group_id !== 'todos') {
                $query->whereHas('groups', function ($q) use ($request) {
                    $q->where('groups.id', $request->group_id);
                });
            }

            // 🔍 Filtro por estado
            if ($request->filled('estado') && $request->estado !== 'todos') {
                $query->where('is_active', $request->estado === 'activo');
            }

            // 🔢 Paginación
            $estudiantes = $query->orderBy('name', 'asc')->paginate(10);

            // Transformar datos para el frontend
            $estudiantes->getCollection()->transform(function ($estudiante) {
                $estudiante->group = $estudiante->groups->first(); // Obtener primer grupo
                $estudiante->group_id = $estudiante->group ? $estudiante->group->id : null;
                return $estudiante;
            });

            // Datos auxiliares
            $grupos = Group::with(['grade:id,nombre', 'course:id,nombre'])
                ->select('id', 'nombre', 'grade_id', 'course_id')
                ->orderBy('nombre')
                ->get();

            Log::info('Estudiantes cargados', ['total' => $estudiantes->total()]);

            return Inertia::render('Secretaria/Estudiantes', [
                'estudiantes' => $estudiantes,
                'grupos' => $grupos,
                'filters' => $request->only(['search', 'group_id', 'estado']),
            ]);

        } catch (\Exception $e) {
            Log::error('Error al recuperar estudiantes', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('Secretaria/Estudiantes', [
                'estudiantes' => [
                    'data' => [],
                    'total' => 0,
                    'per_page' => 10,
                    'current_page' => 1,
                    'last_page' => 1,
                    'links' => []
                ],
                'grupos' => Group::select('id', 'nombre')->get(),
                'filters' => [],
                'error' => 'No se pudieron cargar los estudiantes.',
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            // Buscar el usuario con rol estudiante
            $user = User::role('estudiante')->findOrFail($id);

            // Validar los datos
            $validated = $request->validate([
                'group_id' => 'required|exists:groups,id',
                'is_active' => 'required|boolean',
            ], [
                'group_id.required' => 'El grupo es obligatorio',
                'group_id.exists' => 'El grupo seleccionado no existe',
                'is_active.required' => 'El estado es obligatorio',
            ]);

            Log::info('Actualizando estudiante', [
                'user_id' => $user->id,
                'group_id' => $validated['group_id'],
                'is_active' => $validated['is_active'],
            ]);

            DB::transaction(function () use ($user, $validated) {
                // 1. Actualizar estado del usuario
                $user->update([
                    'is_active' => $validated['is_active'],
                ]);

                // 2. Asignar grupo (eliminar grupos anteriores y asignar el nuevo)
                $user->groups()->sync([$validated['group_id']]);
                
                Log::info('Grupo sincronizado', [
                    'user_id' => $user->id,
                    'group_id' => $validated['group_id'],
                ]);
            });

            Log::info('✅ Estudiante actualizado correctamente', [
                'user_id' => $user->id,
            ]);

            return redirect()->back()->with('success', '✅ Estudiante actualizado correctamente');

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación', [
                'errors' => $e->errors(),
                'id' => $id,
            ]);
            return back()->withErrors($e->errors())->with('error', '❌ Error de validación');

        } catch (\Exception $e) {
            Log::error('Error al actualizar estudiante', [
                'message' => $e->getMessage(),
                'id' => $id,
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return back()->with('error', '❌ No se pudo actualizar: ' . $e->getMessage());
        }
    }

    public function toggle(Request $request, $id)
    {
        try {
            $user = User::role('estudiante')->findOrFail($id);

            $validated = $request->validate([
                'is_active' => 'required|boolean',
            ]);

            $user->update(['is_active' => $validated['is_active']]);

            Log::info('Estado de estudiante cambiado', [
                'user_id' => $user->id,
                'is_active' => $validated['is_active'],
            ]);

            return back()->with('success', '🔄 Estado actualizado correctamente');

        } catch (\Exception $e) {
            Log::error('Error al cambiar estado', [
                'message' => $e->getMessage(),
                'id' => $id,
            ]);
            return back()->with('error', '❌ No se pudo cambiar el estado');
        }
    }

    public function exportExcel()
    {
        try {
            return Excel::download(new EstudiantesExport, 'estudiantes_' . date('Y-m-d') . '.xlsx');
        } catch (\Exception $e) {
            Log::error('Error al exportar Excel', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ No se pudo exportar a Excel');
        }
    }

    public function exportPDF()
    {
        try {
            $estudiantes = User::role('estudiante')
                ->with(['groups.grade', 'groups.course'])
                ->orderBy('name')
                ->get();

            // Transformar para agregar el primer grupo
            $estudiantes->transform(function ($estudiante) {
                $estudiante->group = $estudiante->groups->first();
                return $estudiante;
            });

            $pdf = Pdf::loadView('pdf.estudiantes', ['estudiantes' => $estudiantes]);
            return $pdf->download('estudiantes_' . date('Y-m-d') . '.pdf');

        } catch (\Exception $e) {
            Log::error('Error al exportar PDF', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ No se pudo exportar a PDF');
        }
    }
}