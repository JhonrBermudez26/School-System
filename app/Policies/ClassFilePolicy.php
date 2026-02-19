<?php

namespace App\Policies;

use App\Models\ClassFile;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class ClassFilePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the file.
     */
    public function view(User $user, ClassFile $file): bool
    {
        if ($user->hasRole('rector') || $user->hasRole('coordinadora')) {
            return true;
        }

        if ($user->hasRole('profesor')) {
            return DB::table('subject_group')
                ->where('user_id', $user->id)
                ->where('subject_id', $file->subject_id)
                ->where('group_id', $file->group_id)
                ->exists();
        }

        if ($user->hasRole('estudiante')) {
            return DB::table('group_user')
                ->where('group_id', $file->group_id)
                ->where('user_id', $user->id)
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can delete the file.
     */
    public function delete(User $user, ClassFile $file): bool
    {
        return $user->hasRole('profesor') && $file->user_id === $user->id;
    }
}
