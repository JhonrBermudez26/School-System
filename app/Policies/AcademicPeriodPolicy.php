<?php

namespace App\Policies;

use App\Models\AcademicPeriod;
use App\Models\User;

class AcademicPeriodPolicy
{
    /**
     * Determine if the user can view any academic periods.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission([
            'academic_period.view',
            'periods.view',
        ]);
    }

    /**
     * Determine if the user can view the academic period.
     */
    public function view(User $user, AcademicPeriod $period): bool
    {
        return $user->hasAnyPermission([
            'academic_period.view',
            'periods.view',
        ]);
    }

    /**
     * Determine if the user can create academic periods.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission([
            'academic_period.create',
            'periods.create',
        ]);
    }

    /**
     * Determine if the user can update the academic period.
     */
    public function update(User $user, AcademicPeriod $period): bool
    {
        // No se puede modificar periodos archivados
        if ($period->isArchived()) {
            return false;
        }

        return $user->hasAnyPermission([
            'academic_period.update',
            'periods.update',
        ]);
    }

    /**
     * Determine if the user can delete the academic period.
     */
    public function delete(User $user, AcademicPeriod $period): bool
    {
        // Solo se pueden eliminar periodos en draft
        if (!$period->isDraft()) {
            return false;
        }

        return $user->hasPermissionTo('periods.delete');
    }

    /**
     * Determine if the user can activate the academic period.
     */
    public function activate(User $user, AcademicPeriod $period): bool
    {
        // Solo se puede activar desde draft
        if (!$period->isDraft()) {
            return false;
        }

        return $user->hasPermissionTo('academic_period.activate');
    }

    /**
     * Determine if the user can close the academic period.
     */
    public function close(User $user, AcademicPeriod $period): bool
    {
        // Solo se puede cerrar desde active
        if (!$period->isActive()) {
            return false;
        }

        return $user->hasPermissionTo('academic_period.close');
    }

    /**
     * Determine if the user can reopen the academic period.
     */
    public function reopen(User $user, AcademicPeriod $period): bool
    {
        // Solo la coordinadora puede reabrir periodos cerrados
        if (!$period->isClosed()) {
            return false;
        }

        return $user->hasPermissionTo('academic_period.reopen');
    }

    /**
     * Determine if the user can archive the academic period.
     */
    public function archive(User $user, AcademicPeriod $period): bool
    {
        // Solo se puede archivar desde closed
        if (!$period->isClosed()) {
            return false;
        }

        return $user->hasPermissionTo('academic_period.archive');
    }
}
