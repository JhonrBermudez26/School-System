<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

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
        return $user->hasPermissionTo('users.view') || 
               $user->hasPermissionTo('users.view_history');
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
    public function update(User $user, User $model): Response
    {
        // No se puede modificar el Rector (excepto por otro Rector)
        if ($model->hasRole('rector') && !$user->hasRole('rector')) {
            return Response::deny('No puedes modificar al Rector.');
        }

        // No se puede modificar a sí mismo en ciertos aspectos
        if ($model->id === $user->id) {
            return Response::deny('No puedes modificar tu propio perfil desde aquí.');
        }

        return $user->hasPermissionTo('users.update') || $user->hasPermissionTo('users.change_role')
            ? Response::allow()
            : Response::deny('No tienes permiso para modificar usuarios.');
    }

    /**
     * Determine if the user can delete the user.
     */
    public function delete(User $user, User $model): Response
    {
        // No se puede eliminar el Rector
        if ($model->hasRole('rector')) {
            return Response::deny('No puedes eliminar al Rector.');
        }

        // No se puede eliminar a sí mismo
        if ($model->id === $user->id) {
            return Response::deny('No puedes eliminarte a ti mismo.');
        }

        // Verificar si tiene historial académico
        // TODO: Implementar lógica para verificar registros académicos
        
        return $user->hasPermissionTo('users.delete')
            ? Response::allow()
            : Response::deny('No tienes permiso para eliminar usuarios.');
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
    public function suspend(User $user, User $model): Response
    {
        // No se puede suspender el Rector
        if ($model->hasRole('rector')) {
            return Response::deny('No puedes suspender al Rector.');
        }

        // No se puede suspender a sí mismo
        if ($model->id === $user->id) {
            return Response::deny('No puedes suspenderte a ti mismo.');
        }

        return $user->hasPermissionTo('users.suspend')
            ? Response::allow()
            : Response::deny('No tienes permiso para suspender usuarios.');
    }

    /**
     * Determine if the user can manage user permissions.
     */
    public function managePermissions(User $user): bool
    {
        return $user->hasPermissionTo('permissions.manage');
    }
}