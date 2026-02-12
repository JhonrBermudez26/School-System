<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Grade;
use Illuminate\Auth\Access\HandlesAuthorization;

class GradePolicy
{
    use HandlesAuthorization;

    /**
     * Ver notas
     */
    public function view(User $user, ?Grade $grade = null): bool
    {
        // Rector y coordinadora ven todo
        if ($user->hasAnyRole(['rector', 'coordinadora'])) {
            return true;
        }

        // Profesor ve notas de sus asignaturas
        if ($user->hasRole('profesor')) {
            return true;
        }

        // Estudiante solo ve sus propias notas
        if ($user->hasRole('estudiante') && $grade) {
            return $grade->student_id === $user->id;
        }

        return false;
    }

    /**
     * Crear nota
     */
    public function create(User $user): bool
    {
        return $user->hasRole('profesor');
    }

    /**
     * Actualizar nota (periodo activo)
     */
    public function update(User $user, Grade $grade): bool
    {
        // Profesor SOLO si el periodo está activo
        if ($user->hasRole('profesor')) {
            return $grade->academicPeriod->is_active === true;
        }

        // Coordinadora puede editar siempre
        if ($user->hasRole('coordinadora')) {
            return true;
        }

        // Rector puede todo
        return $user->hasRole('rector');
    }

    /**
     * Corregir nota (cuando el periodo ya cerró)
     */
    public function correct(User $user, Grade $grade): bool
    {
        return $user->hasAnyRole(['coordinadora', 'rector']);
    }

    /**
     * Eliminar nota
     */
    public function delete(User $user, Grade $grade): bool
    {
        return $user->hasRole('rector');
    }
}
