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

        $roles       = Role::with('permissions')->get();
        $permissions = Permission::all();

        return Inertia::render('Rector/RoleManagement', [
            'roles'       => $roles,
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
            'name'       => $request->name,
            'guard_name' => $request->guard_name ?? 'web',
        ]);

        $this->activityLog->log($role, 'created', null, $role->toArray());

        return redirect()->route('rector.roles')
            ->with('success', 'Rol creado correctamente');
    }

    /**
     * Actualizar un rol
     * ✅ FIX IDOR: Route Model Binding reemplaza findOrFail($id) manual
     */
    public function update(RoleRequest $request, Role $role)
    {
        $this->authorize('update', $role);

        $oldValues = $role->toArray();
        $role->update($request->validated());

        $this->activityLog->log($role, 'updated', $oldValues, $role->getChanges());

        return redirect()->route('rector.roles')
            ->with('success', 'Rol actualizado correctamente');
    }

    /**
     * Eliminar un rol
     * ✅ FIX IDOR: Route Model Binding + authorize('delete', $role)
     */
    public function destroy(Role $role)
    {
        $this->authorize('delete', $role);

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
     * ✅ FIX IDOR: Route Model Binding + authorize('assignPermissions', $role)
     */
    public function assignPermissions(Request $request, Role $role)
    {
        $this->authorize('assignPermissions', $role);

        $validated = $request->validate([
            'permissions'   => 'required|array',
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
     * ✅ FIX IDOR: Route Model Binding + authorize('view', $role)
     */
    public function getRolePermissions(Role $role)
    {
        $this->authorize('view', $role);

        $role->load('permissions');

        return response()->json([
            'role'        => $role,
            'permissions' => $role->permissions->pluck('name'),
        ]);
    }
}