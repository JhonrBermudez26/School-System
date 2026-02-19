<?php

namespace App\Policies;

use App\Models\User;
use App\Models\Boletin;
use Illuminate\Auth\Access\HandlesAuthorization;

class BoletinPolicy
{
    use HandlesAuthorization;

    /**
     * Ver lista de boletines
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('bulletins.view');
    }

    /**
     * Ver un boletín específico
     */
    public function view(User $user, Boletin $boletin): bool
    {
        // Rector y coordinadora pueden ver todos
        if ($user->hasAnyRole(['rector', 'coordinadora'])) {
            return true;
        }

        // Secretaria puede ver todos
        if ($user->hasRole('secretaria') && $user->hasPermissionTo('bulletins.view')) {
            return true;
        }

        // Profesores pueden ver boletines de sus grupos
        if ($user->hasRole('profesor')) {
            return \DB::table('subject_group')
                ->where('user_id', $user->id)
                ->where('group_id', $boletin->group_id)
                ->exists();
        }

        // Estudiantes solo pueden ver su propio boletín
        if ($user->hasRole('estudiante')) {
            return $boletin->student_id === $user->id;
        }

        return false;
    }

    /**
     * Generar boletines
     */
    public function generate(User $user): bool
    {
        return $user->hasPermissionTo('bulletins.generate');
    }

    /**
     * Descargar boletín
     */
    public function download(User $user, Boletin $boletin): bool
    {
        // Cualquiera con permiso de descarga y acceso al boletín
        if (!$user->hasPermissionTo('bulletins.download')) {
            return false;
        }

        return $this->view($user, $boletin);
    }

    /**
     * Actualizar observaciones (solo coordinadora y rector)
     */
    public function updateObservations(User $user): bool
    {
        return $user->hasAnyRole(['rector', 'coordinadora']);
    }
}