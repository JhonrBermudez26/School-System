<?php
namespace App\Policies;

use App\Models\User;
use App\Models\Boletin;
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
        // Coordinadora y rector ven todos sin importar estado
        if ($user->hasAnyRole(['rector', 'coordinadora'])) {
            return $user->hasPermissionTo('bulletins.view');
        }

        // Secretaria: solo ve boletines confirmados
        if ($user->hasRole('secretaria')) {
            return $user->hasPermissionTo('bulletins.view') 
                && $boletin->confirmado;
        }

        // Estudiante: solo su propio boletín y solo si está confirmado
        if ($user->hasRole('estudiante')) {
            return $boletin->student_id === $user->id 
                && $boletin->confirmado;
        }

        return false;
    }

    public function generate(User $user): bool
    {
        return $user->hasPermissionTo('bulletins.generate');
    }

    // NUEVO: confirmar boletín (solo coordinadora/rector)
    public function confirm(User $user): bool
    {
        return $user->hasPermissionTo('bulletins.confirm');
    }

    public function download(User $user, Boletin $boletin): bool
    {
        if (!$user->hasPermissionTo('bulletins.download')) {
            return false;
        }

        // Para secretaria y estudiante: solo si está confirmado
        if ($user->hasAnyRole(['secretaria', 'estudiante'])) {
            return $boletin->confirmado && $this->view($user, $boletin);
        }

        // Coordinadora y rector pueden descargar siempre
        return $this->view($user, $boletin);
    }

    public function updateObservations(User $user): bool
    {
        return $user->hasAnyRole(['rector', 'coordinadora']);
    }
}