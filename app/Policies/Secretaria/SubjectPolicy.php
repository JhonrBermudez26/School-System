<?php

namespace App\Policies\Secretaria;

use App\Models\User;
use App\Models\Subject;
use Illuminate\Auth\Access\Response;

class SubjectPolicy
{
    /**
     * Ver lista de Asignatura
     */
    public function viewAny(User $user): RESPONSE
    {
        return $user->can('subjects.view')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para ver Asignaturas.');
    }

    /**
     * Ver un prfesor específico
     */
    public function view(User $user, Subject $subject): RESPONSE
    {
        return $user->can('subjects.view')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para ver Asignatura.');
    }


      /**
     * Crear asignatura
     */
    public function create(User $user): RESPONSE
    {
        return $user->can('subjects.create')
         ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para crear Asignaturas.');
    }


    /**
     * Actualizar Asignatura
     */
    public function update(User $user, Subject $subject): RESPONSE
    {
        return $user->can('subjects.update')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para cambiar el estado de la asignatura.');
    }

    /**
     * Cambiar estado activo/inactivo
     */
    public function delete(User $user, Subject $subject): RESPONSE
{
    return $user->can('subjects.delete')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para eliminar la asignatura.');
}

}