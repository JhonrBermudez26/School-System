<?php

namespace App\Policies;

use App\Models\Boletin;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class BoletinPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('bulletins.view');
    }

    public function view(User $user, Boletin $boletin): bool
    {
        // Rector y coordinadora ven todos
        if ($user->hasAnyRole(['rector', 'coordinadora'])) {
            return $user->hasPermissionTo('bulletins.view');
        }

        // Secretaria: solo boletines confirmados
        if ($user->hasRole('secretaria')) {
            return $user->hasPermissionTo('bulletins.view') && $boletin->confirmado;
        }

        // Estudiante: SOLO su propio boletín y solo si está confirmado
        if ($user->hasRole('estudiante')) {
            return $boletin->student_id === $user->id && $boletin->confirmado;
        }

        return false;
    }

    public function generate(User $user): bool
    {
        return $user->hasPermissionTo('bulletins.generate');
    }

    public function confirm(User $user, Boletin $boletin): bool
    {
        // No confirmar si ya está confirmado
        if ($boletin->confirmado) {
            return false;
        }

        return $user->hasPermissionTo('bulletins.confirm');
    }

    public function download(User $user, Boletin $boletin): bool
    {
        if (!$user->hasPermissionTo('bulletins.download')) {
            return false;
        }

        // Para secretaria y estudiante: solo si está confirmado y les pertenece
        if ($user->hasAnyRole(['secretaria', 'estudiante'])) {
            return $boletin->confirmado && $this->view($user, $boletin);
        }

        // Coordinadora y rector pueden descargar siempre (si tienen acceso de vista)
        return $this->view($user, $boletin);
    }

    public function updateObservations(User $user, Boletin $boletin): bool
    {
        return $user->hasAnyRole(['rector', 'coordinadora']);
    }
}