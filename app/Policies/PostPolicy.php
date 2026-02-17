<?php

namespace App\Policies;

use App\Models\Post;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class PostPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view the post.
     */
    public function view(User $user, Post $post): bool
    {
        if ($user->hasRole('rector') || $user->hasRole('coordinadora')) {
            return true;
        }

        // El autor siempre puede verlo
        if ($post->user_id === $user->id) {
            return true;
        }

        // Profesores y estudiantes de la misma clase pueden verlo
        $isTeacher = DB::table('subject_group')
            ->where('user_id', $user->id)
            ->where('subject_id', $post->subject_id)
            ->where('group_id', $post->group_id)
            ->exists();

        if ($isTeacher) {
            return true;
        }

        return DB::table('group_user')
            ->where('group_id', $post->group_id)
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Determine whether the user can update the post.
     */
    public function update(User $user, Post $post): bool
    {
        return $post->user_id === $user->id;
    }

    /**
     * Determine whether the user can delete the post.
     */
    public function delete(User $user, Post $post): bool
    {
        return $post->user_id === $user->id;
    }
}
