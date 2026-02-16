<?php

namespace App\Policies;

use App\Models\DisciplineRecord;
use App\Models\User;

class DisciplineRecordPolicy
{
    /**
     * Determine if the user can view any discipline records.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('discipline.view');
    }

    /**
     * Determine if the user can view the discipline record.
     */
    public function view(User $user, DisciplineRecord $record): bool
    {
        // Coordinadora puede ver todos
        if ($user->hasRole('coordinadora') || $user->hasRole('rector')) {
            return $user->hasPermissionTo('discipline.view');
        }

        // El estudiante puede ver sus propios registros
        if ($user->hasRole('estudiante')) {
            return $record->student_id === $user->id;
        }

        return false;
    }

    /**
     * Determine if the user can create discipline records.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('discipline.create');
    }

    /**
     * Determine if the user can update the discipline record.
     */
    public function update(User $user, DisciplineRecord $record): bool
    {
        // No se pueden modificar registros cerrados
        if ($record->isClosed()) {
            return false;
        }

        return $user->hasPermissionTo('discipline.update');
    }

    /**
     * Determine if the user can close the discipline record.
     */
    public function close(User $user, DisciplineRecord $record): bool
    {
        // Solo se pueden cerrar registros abiertos
        if (!$record->isOpen()) {
            return false;
        }

        return $user->hasPermissionTo('discipline.close');
    }

    /**
     * Determine if the user can delete the discipline record.
     */
    public function delete(User $user, DisciplineRecord $record): bool
    {
        // Solo rector puede eliminar registros disciplinarios
        return $user->hasRole('rector');
    }
}
