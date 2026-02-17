<?php
namespace App\Policies;

use Spatie\Permission\Models\Role;
use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('roles.manage');
    }

    public function view(User $user, Role $role): bool
    {
        return $user->hasPermissionTo('roles.manage');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('roles.manage');
    }

    public function update(User $user, Role $role): bool
    {
        // No se puede modificar el rol de Rector
        if ($role->name === 'rector') {
            return false;
        }
        return $user->hasPermissionTo('roles.manage');
    }

    public function delete(User $user, Role $role): bool
    {
        // No se pueden eliminar roles del sistema
        if (in_array($role->name, ['rector', 'coordinadora', 'secretaria', 'profesor', 'estudiante'])) {
            return false;
        }
        return $user->hasPermissionTo('roles.manage');
    }

    /**
     * ✅ CORREGIDO: Ahora recibe $role como parámetro
     */
    public function assignPermissions(User $user, Role $role): bool
    {
        // No se pueden modificar permisos del rol rector
        if ($role->name === 'rector') {
            return false;
        }
        return $user->hasPermissionTo('roles.manage');
    }
}