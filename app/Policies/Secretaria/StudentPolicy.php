<?php

namespace App\Policies\Secretaria;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class StudentPolicy
{
    /**
     * Ver lista de estudiante
     */
    public function viewAny(User $user): response
    {
        return $user->can('students.view')
        ? Response::allow()
        : Response::deny('No tienes permiso para cambiar el estado de estudiante.');
    }

    /**
     * Ver un estudiante específico
     */
    public function view(User $user, User $student): response
    {
        return $user->can('students.view')
        ? Response::allow()
        : Response::deny('No tienes permiso para cambiar el estado de estudiante.');
    }

    /**
     * Crear estudiante
     */
    public function create(User $user): response
    {
        return $user->can('students.create');
    }

    /**
     * Actualizar estudiante
     */
    public function update(User $user, User $student): response
    {
        return $user->can('students.update')
        ? Response::allow()
        : Response::deny('No tienes permiso para cambiar el estado de usuarios.');
    }

    /**
     * Eliminar estudiante
     */
    public function delete(User $user, User $student): response
    {
        return $user->can('stdudents.delete')
        ? Response::allow()
        : Response::deny('No tienes permiso para eliminar este usuarios.');
    }

    /**
     * Cambiar estado activo/inactivo
     */
    public function toggle(User $user, User $student): response
{
    return $user->can('estudents.update')
        ? Response::allow()
        : Response::deny('No tienes permiso para cambiar el estado de usuarios.');
}

/**
     * Exportar datos
     */
    public function export(User $user): bool
    {
        // Solo usuarios con permiso de ver pueden exportar
        return $user->can('students.view');
    }
}