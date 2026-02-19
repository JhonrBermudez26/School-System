<?php

namespace App\Policies\Secretaria;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    /**
     * Ver lista de usuarios
     */
    public function viewAny(User $user): bool
    {
        return $user->can('users.view');
    }

    /**
     * Ver un usuario específico
     */
    public function view(User $user, User $model): bool
    {
        return $user->can('users.view');
    }

    /**
     * Crear usuario
     */
    public function create(User $user): bool
    {
        return $user->can('users.create');
    }

    /**
     * Actualizar usuario
     */
    public function update(User $user, User $model): bool
    {
        // El rector tiene acceso completo
        if ($user->hasRole('rector')) {
            return true;
        }

        // Nadie más puede editar al rector
        if ($model->hasRole('rector')) {
            return false;
        }

        return $user->can('users.update');
    }

    /**
     * Eliminar usuario
     */
    public function delete(User $user, User $model): bool
    {
        // No se puede eliminar a sí mismo
        if ($user->id === $model->id) {
            return false;
        }

        // No se puede eliminar al rector
        if ($model->hasRole('rector')) {
            return false;
        }

        return $user->can('users.delete');
    }

    /**
     * Cambiar estado activo/inactivo
     */
    public function toggle(User $user, User $model): response
{
    // No se puede desactivar al rector
    if ($model->hasRole('rector')) {
         return Response::deny('No puedes desactivar al rector.');
    }

    // No se puede desactivar a sí mismo
    if ($user->id === $model->id) {
        return Response::deny('No puedes desactivarte a ti mismo.');
    }

    return $user->can('users.update')
        ? Response::allow()
        : Response::deny('No tienes permiso para cambiar el estado de usuarios.');
}
}