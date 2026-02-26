<?php

namespace App\Policies;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class ConversationPolicy
{
    use HandlesAuthorization;

    /**
     * El usuario puede ver/acceder a la conversación solo si es participante.
     */
    public function view(User $user, Conversation $conversation): bool
    {
        if ($user->hasAnyRole(['rector', 'coordinadora'])) {
            return true;
        }

        return $conversation->participants()
            ->where('user_id', $user->id)
            ->exists();
    }

    /**
     * Solo participantes pueden enviar mensajes.
     */
    public function sendMessage(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }

    /**
     * Solo participantes pueden marcar como leído.
     */
    public function markAsRead(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }

    /**
     * Solo participantes pueden salir.
     */
    public function leave(User $user, Conversation $conversation): bool
    {
        return $this->view($user, $conversation);
    }

    /**
     * Solo el creador/admin del grupo puede agregar participantes.
     */
    public function addParticipant(User $user, Conversation $conversation): bool
    {
        if (!$this->view($user, $conversation)) {
            return false;
        }

        // Para grupos, solo el creador puede agregar
        if ($conversation->is_group) {
            return $conversation->created_by === $user->id;
        }

        return false;
    }

    /**
     * Solo el creador del grupo puede actualizar info del grupo.
     */
    public function updateGroup(User $user, Conversation $conversation): bool
    {
        if (!$conversation->is_group) {
            return false;
        }

        return $conversation->created_by === $user->id;
    }

    /**
     * Solo el creador puede eliminar la conversación.
     */
    public function delete(User $user, Conversation $conversation): bool
    {
        return $conversation->created_by === $user->id;
    }
}