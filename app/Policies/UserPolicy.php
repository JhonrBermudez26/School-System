<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    /**
     * Determine if the user can view any users.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('users.view');
    }

    /**
     * Determine if the user can view the user.
     */
    public function view(User $user, User $model): bool
    {
        return $user->hasPermissionTo('users.view');
    }

    /**
     * Determine if the user can create users.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('users.create');
    }

    /**
     * Determine if the user can update the user.
     */
    public function update(User $user, User $model): bool
    {
        // No se puede modificar el Rector
        if ($model->hasRole('rector')) {
            return $user->hasRole('rector');
        }

        return $user->hasPermissionTo('users.update');
    }

    /**
     * Determine if the user can delete the user.
     */
    public function delete(User $user, User $model): bool
    {
        // No se puede eliminar el Rector ni a sí mismo
        if ($model->hasRole('rector') || $model->id === $user->id) {
            return false;
        }

        return $user->hasPermissionTo('users.delete');
    }

    /**
     * Determine if the user can activate users.
     */
    public function activate(User $user): bool
    {
        return $user->hasPermissionTo('users.activate');
    }

    /**
     * Determine if the user can suspend users.
     */
    public function suspend(User $user, User $model): bool
    {
        // No se puede suspender el Rector ni a sí mismo
        if ($model->hasRole('rector') || $model->id === $user->id) {
            return false;
        }

        return $user->hasPermissionTo('users.suspend');
    }

    /**
     * Determine if the user can manage user permissions.
     */
    public function managePermissions(User $user): bool
    {
        return $user->hasPermissionTo('permissions.manage');
    }

    /**
     * Cambiar estado activo/inactivo (Old Secretaria logic merged)
     */
    public function toggle(User $user, User $model): \Illuminate\Auth\Access\Response
    {
        // No se puede desactivar al rector
        if ($model->hasRole('rector')) {
            return \Illuminate\Auth\Access\Response::deny('No puedes desactivar al rector.');
        }

        // No se puede desactivar a sí mismo
        if ($user->id === $model->id) {
            return \Illuminate\Auth\Access\Response::deny('No puedes desactivarte a ti mismo.');
        }

        return $user->hasPermissionTo('users.update')
            ? \Illuminate\Auth\Access\Response::allow()
            : \Illuminate\Auth\Access\Response::deny('No tienes permiso para cambiar el estado de usuarios.');
    }
}
