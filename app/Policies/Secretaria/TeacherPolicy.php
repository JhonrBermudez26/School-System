<?php

namespace App\Policies\Secretaria;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class TeacherPolicy
{
    /**
     * Ver lista de profesor
     */
    public function viewAny(User $user): RESPONSE
    {
        return $user->can('teachers.view')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para cambiar el estado de profesor.');
    }

    /**
     * Ver un prfesor específico
     */
    public function view(User $user, User $teacher): RESPONSE
    {
        return $user->can('teachers.view')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para cambiar el estado de profesor.');
    }

    /**
     * Actualizar profesor
     */
    public function update(User $user, User $teacher): RESPONSE
    {
        return $user->can('teachers.update')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para cambiar el estado de usuarios.');
    }

    /**
     * Cambiar estado activo/inactivo
     */
    public function toggle(User $user, User $teacher): RESPONSE
{
    return $user->can('teachers.update')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para cambiar el estado de usuarios.');
}

}