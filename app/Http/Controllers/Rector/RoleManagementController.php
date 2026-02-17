<?php
namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoleRequest;
use App\Services\ActivityLogService;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RoleManagementController extends Controller
{
    protected $activityLog;

    public function __construct(ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    /**
     * Lista de roles y permisos
     */
    public function index()
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')->get();
        $permissions = Permission::all(); // ✅ CORREGIDO: Array plano

        return Inertia::render('Rector/RoleManagement', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    }

    /**
     * Crear un nuevo rol
     */
    public function store(RoleRequest $request)
    {
        $this->authorize('create', Role::class);

        $role = Role::create([
            'name' => $request->name,
            'guard_name' => $request->guard_name ?? 'web',
        ]);

        $this->activityLog->log($role, 'created', null, $role->toArray());

        return redirect()->route('rector.roles')
            ->with('success', 'Rol creado correctamente');
    }

    /**
     * Actualizar un rol
     */
    public function update(RoleRequest $request, $id)
    {
        $role = Role::findOrFail($id);
        $this->authorize('update', $role);

        $oldValues = $role->toArray();
        $role->update($request->validated());

        $this->activityLog->log($role, 'updated', $oldValues, $role->getChanges());

        return redirect()->route('rector.roles')
            ->with('success', 'Rol actualizado correctamente');
    }

    /**
     * Eliminar un rol
     */
    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $this->authorize('delete', $role);

        // ✅ VERIFICAR: No eliminar si tiene usuarios asignados
        if ($role->users()->count() > 0) {
            return redirect()->route('rector.roles')
                ->with('error', 'No se puede eliminar un rol que tiene usuarios asignados');
        }

        $oldValues = $role->toArray();
        $role->delete();

        $this->activityLog->log($role, 'deleted', $oldValues, null);

        return redirect()->route('rector.roles')
            ->with('success', 'Rol eliminado correctamente');
    }

    /**
     * Asignar permisos a un rol
     */
    public function assignPermissions(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $this->authorize('assignPermissions', $role); // ✅ CORREGIDO: Pasa $role

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $oldPermissions = $role->permissions->pluck('name')->toArray();
        $role->syncPermissions($validated['permissions']);
        
        $this->activityLog->log($role, 'permissions_synced', 
            ['permissions' => $oldPermissions], 
            ['permissions' => $validated['permissions']]
        );

        return redirect()->route('rector.roles')
            ->with('success', 'Permisos asignados correctamente');
    }

    /**
     * Obtener permisos de un rol
     */
    public function getRolePermissions($id)
    {
        $role = Role::with('permissions')->findOrFail($id);
        $this->authorize('view', $role);

        return response()->json([
            'role' => $role,
            'permissions' => $role->permissions->pluck('name'),
        ]);
    }
}