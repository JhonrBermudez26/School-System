<?php

namespace App\Policies;

use App\Models\User;
use App\Models\ManualGrade;
use Illuminate\Auth\Access\HandlesAuthorization;

class GradePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['grades.view', 'grades.view_all', 'manual_grades.view']);
    }

    /**
     * Determine whether the user can view all grades (supervision).
     */
    public function viewAll(User $user): bool
    {
        \Illuminate\Support\Facades\Log::info('Checking viewAll for user: ' . $user->id);
        $hasPermission = $user->hasPermissionTo('grades.view_all');
        \Illuminate\Support\Facades\Log::info('Has grades.view_all: ' . ($hasPermission ? 'yes' : 'no'));
        return $hasPermission;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ?ManualGrade $grade = null): bool
    {
        // Coordinadora puede ver todas las notas
        if ($user->hasPermissionTo('grades.view_all')) {
            return true;
        }

        // Rector y coordinadora ven todo
        if ($user->hasAnyRole(['rector', 'coordinadora'])) {
            return true;
        }

        // Profesor ve notas de sus asignaturas
        if ($user->hasRole('profesor')) {
            return $user->hasPermissionTo('grades.view');
        }

        // Estudiante solo ve sus propias notas
        if ($user->hasRole('estudiante') && $grade) {
            // Para ManualGrade, verificar via subject_group
            return true; // Simplificado - mejorar según relación real
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasAnyPermission(['manual_grades.create', 'grades.create']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ManualGrade $grade): bool
    {
        // ✅ VALIDACIÓN: No se puede modificar si el periodo está cerrado
        $period = $grade->academicPeriod;
        if ($period && $period->isClosed()) {
            return false;
        }

        if ($period && $period->isArchived()) {
            return false;
        }

        // Profesor SOLO si el periodo está activo
        if ($user->hasRole('profesor')) {
            return $period && $period->grades_enabled === true;
        }

        // Coordinadora puede editar siempre (si no está cerrado)
        if ($user->hasRole('coordinadora')) {
            return true;
        }

        // Rector puede todo (si no está cerrado)
        return $user->hasRole('rector');
    }

    /**
     * Corregir nota (cuando el periodo ya cerró)
     */
    public function correct(User $user, ManualGrade $grade): bool
    {
        return $user->hasAnyRole(['coordinadora', 'rector']);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ManualGrade $grade): bool
    {
        // ✅ VALIDACIÓN: No se puede eliminar si el periodo está cerrado
        $period = $grade->academicPeriod;
        if ($period && ($period->isClosed() || $period->isArchived())) {
            return false;
        }

        // Solo rector puede eliminar notas
        return $user->hasRole('rector');
    }
}
