<?php

namespace App\Policies\Secretaria;

use App\Models\User;
use App\Models\Group;
use Illuminate\Auth\Access\Response;

class GroupPolicy
{
    /**
     * Ver lista de Grupos
     */
    public function viewAny(User $user): RESPONSE
    {
        return $user->can('groups.view')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para ver Grupos.');
    }

    /**
     * Ver un grupo específico
     */
    public function view(User $user, Group $Group): RESPONSE
    {
        return $user->can('groups.view')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para ver Grupo.');
    }


      /**
     * Crear Grupo
     */
    public function create(User $user): RESPONSE
    {
        return $user->can('groups.create')
         ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para crear Grupos.');
    }


    /**
     * Actualizar Grupo
     */
    public function update(User $user, Group $Group): RESPONSE
    {
        return $user->can('groups.update')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para cambiar el estado de la grupo.');
    }

    /**
     * Eliminar grupo
     */
    public function delete(User $user, Group $Group): RESPONSE
{
    return $user->can('groups.delete')
        ? RESPONSE::allow()
        : RESPONSE::deny('No tienes permiso para eliminar la grupo.');
}

}