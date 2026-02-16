<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Attendance;

class AttendancePolicy
{
    /**
     * Determine if the user can view any attendances.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('attendances.view');
    }

    /**
     * Determine if the user can view the attendance.
     */
    public function view(User $user, Attendance $attendance): bool
    {
        // Profesores solo pueden ver asistencia de sus grupos
        if ($user->hasRole('profesor')) {
            // TODO: Verificar que el profesor tiene asignado el grupo
            return $user->hasPermissionTo('attendances.view');
        }

        // Estudiantes solo pueden ver su propia asistencia
        if ($user->hasRole('estudiante')) {
            return $attendance->user_id === $user->id;
        }

        // Coordinadora y rector pueden ver todas
        return $user->hasAnyPermission(['attendances.view', 'attendance.view_all']);
    }

    /**
     * Determine if the user can view all attendances (supervisión).
     */
    public function viewAll(User $user): bool
    {
        return $user->hasPermissionTo('attendance.view_all');
    }

    /**
     * Determine if the user can create attendances.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('attendances.create');
    }

    /**
     * Determine if the user can update the attendance.
     */
    public function update(User $user, Attendance $attendance): bool
    {
        // Solo el profesor que creó la asistencia puede modificarla
        if ($user->hasRole('profesor')) {
            // TODO: Verificar que el profesor creó esta asistencia
            return $user->hasPermissionTo('attendances.update');
        }

        return false;
    }

    /**
     * Determine if the user can export attendance data.
     */
    public function export(User $user): bool
    {
        return $user->hasPermissionTo('attendance.export');
    }
}
