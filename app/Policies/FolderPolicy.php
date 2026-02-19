<?php

namespace App\Policies;

use App\Models\Folder;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class FolderPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the folder.
     */
    public function view(User $user, Folder $folder): bool
    {
        if ($user->hasRole('rector') || $user->hasRole('coordinadora')) {
            return true;
        }

        if ($user->hasRole('profesor')) {
            return DB::table('subject_group')
                ->where('user_id', $user->id)
                ->where('subject_id', $folder->subject_id)
                ->where('group_id', $folder->group_id)
                ->exists();
        }

        if ($user->hasRole('estudiante')) {
            return DB::table('group_user')
                ->where('group_id', $folder->group_id)
                ->where('user_id', $user->id)
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can update the folder.
     */
    public function update(User $user, Folder $folder): bool
    {
        return $user->hasRole('profesor') && $folder->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the folder.
     */
    public function delete(User $user, Folder $folder): bool
    {
        return $user->hasRole('profesor') && $folder->user_id === $user->id;
    }
}
