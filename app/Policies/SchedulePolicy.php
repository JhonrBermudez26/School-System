<?php
namespace App\Policies;

use App\Models\User;
use App\Models\Schedule;
use Illuminate\Auth\Access\Response;

class SchedulePolicy
{
    /**
     * Ver horarios
     */
    public function viewAny(User $user): bool
    {
        return $user->can('schedules.view');
    }

    /**
     * Crear horarios
     */
    public function create(User $user): bool
    {
        return $user->can('schedules.create');
    }

    /**
     * Actualizar horarios
     */
    public function update(User $user): bool
    {
        return $user->can('schedules.update');
    }

    /**
     * Eliminar horarios
     */
    public function delete(User $user): bool
    {
        return $user->can('schedules.delete');
    }

    /**
     * Imprimir horarios
     */
    public function print(User $user): bool
    {
        return $user->can('schedules.print');
    }
}