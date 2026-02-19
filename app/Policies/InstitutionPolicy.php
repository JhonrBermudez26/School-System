<?php

namespace App\Policies;

use App\Models\SchoolSetting;
use App\Models\User;

class InstitutionPolicy
{
    /**
     * Determine if the user can view institutional settings.
     */
    public function view(User $user): bool
    {
        return $user->hasRole(['rector', 'coordinadora', 'secretaria']);
    }

    /**
     * Determine if the user can update institutional settings.
     */
    public function update(User $user): bool
    {
        return $user->hasPermissionTo('institution.update');
    }

    /**
     * Determine if the user can configure grading scale.
     */
    public function configureGradingScale(User $user): bool
    {
        return $user->hasPermissionTo('grading.scale.configure');
    }

    /**
     * Determine if the user can configure approval criteria.
     */
    public function configureApprovalCriteria(User $user): bool
    {
        return $user->hasPermissionTo('approval.criteria.configure');
    }
}
