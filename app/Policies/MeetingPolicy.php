<?php

namespace App\Policies;

use App\Models\Meeting;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Support\Facades\DB;

class MeetingPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can join the meeting.
     */
    public function join(User $user, Meeting $meeting): bool
    {
        if ($user->hasRole('rector') || $user->hasRole('coordinadora')) {
            return true;
        }

        if ($meeting->user_id === $user->id) {
            return true;
        }

        // Verificar si pertenece a la clase
        $isTeacher = DB::table('subject_group')
            ->where('user_id', $user->id)
            ->where('subject_id', $meeting->subject_id)
            ->where('group_id', $meeting->group_id)
            ->exists();

        if ($isTeacher) {
            return true;
        }

        return DB::table('group_user')
            ->where('group_id', $meeting->group_id)
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Determine whether the user can end the meeting.
     */
    public function end(User $user, Meeting $meeting): bool
    {
        return $meeting->user_id === $user->id;
    }
}
