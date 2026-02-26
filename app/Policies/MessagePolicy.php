<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MessagePolicy
{
    use HandlesAuthorization;

    /**
     * Solo el autor puede editar su mensaje.
     */
    public function update(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }

    /**
     * Solo el autor puede eliminar su mensaje.
     */
    public function delete(User $user, Message $message): bool
    {
        return $message->sender_id === $user->id;
    }
}