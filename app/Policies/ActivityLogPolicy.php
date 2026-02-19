<?php
namespace App\Policies;

use App\Models\ActivityLog;
use App\Models\User;

class ActivityLogPolicy
{
    /**
     * Determine if the user can view any activity logs.
     */
    public function viewAny(User $user): bool
    {
        // Solo rector puede ver logs
        return $user->hasRole('rector') || 
               $user->hasPermissionTo('audit.view');
    }

    /**
     * Determine if the user can view the activity log.
     */
    public function view(User $user, ActivityLog $log): bool
    {
        return $user->hasRole('rector') || 
               $user->hasPermissionTo('audit.view');
    }

    /**
     * Nadie puede crear, editar o eliminar logs manualmente
     */
    public function create(User $user): bool
    {
        return false;
    }

    public function update(User $user, ActivityLog $log): bool
    {
        return false;
    }

    public function delete(User $user, ActivityLog $log): bool
    {
        return false;
    }
}