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
        return $user->hasAnyPermission(['audit.view', 'audit_logs.view', 'system.logs']);
    }

    /**
     * Determine if the user can view the activity log.
     */
    public function view(User $user, ActivityLog $log): bool
    {
        return $user->hasAnyPermission(['audit.view', 'audit_logs.view', 'system.logs']);
    }

    /**
     * Determine if the user can filter/search activity logs.
     */
    public function filter(User $user): bool
    {
        return $user->hasPermissionTo('audit.view');
    }
}
