<?php

namespace App\Policies;

use App\Models\Attendance;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class AttendancePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('attendances.view');
    }

    public function view(User $user, Attendance $attendance): bool
    {
        if ($user->hasAnyRole(['rector', 'coordinadora'])) {
            return true;
        }

        // Profesor: solo puede ver asistencias de sus grupos asignados
        if ($user->hasRole('profesor')) {
            return DB::table('subject_group')
                ->where('user_id', $user->id)
                ->where('group_id', $attendance->group_id)
                ->exists();
        }

        // Estudiante: solo su propia asistencia
        if ($user->hasRole('estudiante')) {
            return $attendance->user_id === $user->id;
        }

        return false;
    }

    public function viewAll(User $user): bool
    {
        return $user->hasPermissionTo('attendance.view_all');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('attendances.create');
    }

    /**
     * Solo el profesor que registró la asistencia puede modificarla,
     * y solo si pertenece a uno de sus grupos.
     */
    public function update(User $user, Attendance $attendance): bool
    {
        if (!$user->hasRole('profesor')) {
            return false;
        }

        return DB::table('subject_group')
            ->where('user_id', $user->id)
            ->where('group_id', $attendance->group_id)
            ->exists();
    }

    /**
     * Solo el profesor que registró puede eliminar.
     */
    public function delete(User $user, Attendance $attendance): bool
    {
        if (!$user->hasRole('profesor')) {
            return false;
        }

        return DB::table('subject_group')
            ->where('user_id', $user->id)
            ->where('group_id', $attendance->group_id)
            ->exists();
    }

    public function export(User $user): bool
    {
        return $user->hasPermissionTo('attendance.export');
    }
}