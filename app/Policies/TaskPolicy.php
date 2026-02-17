<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class TaskPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the task.
     */
    public function view(User $user, Task $task): bool
    {
        if ($user->hasRole('rector') || $user->hasRole('coordinadora')) {
            return true;
        }

        if ($user->hasRole('profesor')) {
            return $task->teacher_id === $user->id;
        }

        if ($user->hasRole('estudiante')) {
            return DB::table('group_user')
                ->where('group_id', $task->group_id)
                ->where('user_id', $user->id)
                ->exists();
        }

        return false;
    }

    /**
     * Determine whether the user can update the task.
     */
    public function update(User $user, Task $task): bool
    {
        return $user->hasRole('profesor') && $task->teacher_id === $user->id;
    }

    /**
     * Determine whether the user can delete the task.
     */
    public function delete(User $user, Task $task): bool
    {
        return $user->hasRole('profesor') && $task->teacher_id === $user->id;
    }

    /**
     * Determine whether the user can grade submissions for the task.
     */
    public function grade(User $user, Task $task): bool
    {
        return $user->hasRole('profesor') && $task->teacher_id === $user->id;
    }
}
