<?php

namespace App\Policies;

use Spatie\Permission\Models\Role;
use App\Models\User;

class RolePolicy
{
    /**
     * Determine if the user can view any roles.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('roles.manage');
    }

    /**
     * Determine if the user can view the role.
     */
    public function view(User $user, Role $role): bool
    {
        return $user->hasPermissionTo('roles.manage');
    }

    /**
     * Determine if the user can create roles.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('roles.manage');
    }

    /**
     * Determine if the user can update the role.
     */
    public function update(User $user, Role $role): bool
    {
        // No se puede modificar el rol de Rector
        if ($role->name === 'rector') {
            return false;
        }

        return $user->hasPermissionTo('roles.manage');
    }

    /**
     * Determine if the user can delete the role.
     */
    public function delete(User $user, Role $role): bool
    {
        // No se pueden eliminar roles del sistema
        if (in_array($role->name, ['rector', 'coordinadora', 'secretaria', 'profesor', 'estudiante'])) {
            return false;
        }

        return $user->hasPermissionTo('roles.manage');
    }

    /**
     * Determine if the user can assign permissions to roles.
     */
    public function assignPermissions(User $user): bool
    {
        return $user->hasPermissionTo('permissions.manage');
    }
}
