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
use Illuminate\Support\Facades\Gate; // ✅ Importar Gate

class StudentController extends Controller
{
    public function index(Request $request)
    {
        // ✅ Verificar permiso directamente
        if (!auth()->user()->can('students.view')) {
            abort(403, 'No tienes permiso para ver estudiantes.');
        }

        try {
            $query = User::role('estudiante')
                ->with(['groups.grade', 'groups.course'])
                ->select('id', 'name', 'last_name', 'email', 'document_number', 'phone', 'is_active', 'created_at');

            // Filtros
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%')
                      ->orWhere('last_name', 'like', '%' . $request->search . '%')
                      ->orWhere('email', 'like', '%' . $request->search . '%')
                      ->orWhere('document_number', 'like', '%' . $request->search . '%');
                });
            }

            if ($request->filled('group_id') && $request->group_id !== 'todos') {
                $query->whereHas('groups', function ($q) use ($request) {
                    $q->where('groups.id', $request->group_id);
                });
            }

            if ($request->filled('estado') && $request->estado !== 'todos') {
                $query->where('is_active', $request->estado === 'activo');
            }

            $estudiantes = $query->orderBy('name', 'asc')->get();

            $estudiantes = $estudiantes->map(function ($estudiante) {
                $estudiante->group = $estudiante->groups->first();
                $estudiante->group_id = $estudiante->group ? $estudiante->group->id : null;
                return $estudiante;
            });

            $grupos = Group::with(['grade:id,nombre', 'course:id,nombre'])
                ->select('id', 'nombre', 'grade_id', 'course_id')
                ->orderBy('nombre')
                ->get();

            Log::info('Estudiantes cargados', ['total' => $estudiantes->count()]);

            return Inertia::render('Secretaria/Estudiantes', [
                'estudiantes' => $estudiantes,
                'grupos' => $grupos,
                'filters' => $request->only(['search', 'group_id', 'estado']),
                'can' => [
                    'update' => auth()->user()->can('students.update'),
                    'export' => auth()->user()->can('students.view'),
                ] 
            ]);
        } catch (\Exception $e) {
            Log::error('Error al recuperar estudiantes', [
                'message' => $e->getMessage(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            return Inertia::render('Secretaria/Estudiantes', [
                'estudiantes' => [],
                'grupos' => Group::select('id', 'nombre')->get(),
                'filters' => [],
                'error' => 'No se pudieron cargar los estudiantes.',
                'can' => [
                    'update' => false,
                    'export' => false,
                ],
            ]);
        }
    }

    public function update(Request $request, $id)
    {
        $user = User::role('estudiante')->findOrFail($id);
        
        // ✅ Verificar permiso directamente
        if (!auth()->user()->can('students.update')) {
            abort(403, 'No tienes permiso para actualizar estudiantes.');
        }

        try {
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
                 if ($validated['is_active']) {
                $user->activate();
            } else {
                $user->deactivate();
            }

            $user->groups()->sync([$validated['group_id']]);
            });

            return redirect()->back()->with('success', '✅ Estudiante actualizado correctamente');

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
        $user = User::role('estudiante')->findOrFail($id);
        
        // ✅ Verificar permiso directamente
        if (!auth()->user()->can('students.update')) {
            abort(403, 'No tienes permiso para cambiar el estado de estudiantes.');
        }

        try {
            $validated = $request->validate([
                'is_active' => 'required|boolean',
            ]);

           if ($validated['is_active']) {
            $user->activate();
        } else {
            $user->deactivate();
        }

        return back()->with('success', '🔄 Estado actualizado correctamente');
        } catch (\Exception $e) {
            Log::error('Error al cambiar estado', [
                'message' => $e->getMessage(),
                'id' => $id,
            ]);
            return back()->with('error', '❌ No se pudo cambiar el estado');
        }
    }

    // Métodos auxiliares sin cambios
    private function applyStudentFilters($query, Request $request)
    {
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%")
                  ->orWhereHas('groups', function ($q) use ($search) {
                      $q->where('nombre', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->filled('group_id') && $request->group_id !== 'todos') {
            $query->whereHas('groups', function ($q) use ($request) {
                $q->where('groups.id', $request->group_id);
            });
        }

        if ($request->filled('estado') && $request->estado !== 'todos') {
            $query->where('is_active', $request->estado === 'activo');
        }

        return $query;
    }

    private function applySorting($query, Request $request)
    {
        $sort_field = $request->input('sort_field');
        $sort_order = $request->input('sort_order', 'asc');

        if (!$sort_field) {
            return $query->orderBy('name', 'asc');
        }

        $sortable = [
            'name'   => ['name', 'last_name'],
            'group'  => 'groups.nombre',
        ];

        if (!array_key_exists($sort_field, $sortable)) {
            return $query->orderBy('name', 'asc');
        }

        $field = $sortable[$sort_field];

        if (is_array($field)) {
            $query->orderBy($field[0], $sort_order)
                  ->orderBy($field[1], $sort_order);
        } else {
            if (str_contains($field, '.')) {
                $query->join('group_user', 'users.id', '=', 'group_user.user_id')
                      ->join('groups', 'group_user.group_id', '=', 'groups.id')
                      ->orderBy($field, $sort_order)
                      ->select('users.*');
            } else {
                $query->orderBy($field, $sort_order);
            }
        }

        return $query;
    }

    public function exportExcel(Request $request)
    {
        // ✅ Verificar permiso directamente
        if (!auth()->user()->can('students.view')) {
            abort(403, 'No tienes permiso para exportar estudiantes.');
        }

        try {
            $query = User::role('estudiante')
                ->with(['groups.grade', 'groups.course'])
                ->select('users.*');

            $query = $this->applyStudentFilters($query, $request);
            $query = $this->applySorting($query, $request);

            $estudiantes = $query->get();

            $estudiantes->transform(function ($est) {
                $est->group = $est->groups->first();
                return $est;
            });

            return Excel::download(new EstudiantesExport($estudiantes), 'estudiantes_' . date('Y-m-d_H-i') . '.xlsx');
        } catch (\Exception $e) {
            Log::error('Error exportando Excel', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ Error al generar el Excel');
        }
    }

    public function exportPDF(Request $request)
    {
        // ✅ Verificar permiso directamente
        if (!auth()->user()->can('students.view')) {
            abort(403, 'No tienes permiso para exportar estudiantes.');
        }

        try {
            $query = User::role('estudiante')
                ->with(['groups.grade', 'groups.course'])
                ->select('users.*');

            $query = $this->applyStudentFilters($query, $request);
            $query = $this->applySorting($query, $request);

            $estudiantes = $query->get();

            $estudiantes->transform(function ($est) {
                $est->group = $est->groups->first();
                return $est;
            });

            $pdf = Pdf::loadView('pdf.estudiantes', [
                'estudiantes' => $estudiantes,
                'filters' => $request->only(['search', 'group_id', 'estado']),
            ]);

            return $pdf->download('estudiantes_' . date('Y-m-d_H-i') . '.pdf');
        } catch (\Exception $e) {
            Log::error('Error exportando PDF', ['message' => $e->getMessage()]);
            return back()->with('error', '❌ Error al generar el PDF');
        }
    }
}