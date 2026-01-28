<?php
// routes/channels.php - CONFIGURACIÓN COMPLETA

use Illuminate\Support\Facades\Broadcast;
use App\Models\Conversation;

// ✅ Canal público para conversaciones (ya existe)
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return Conversation::find($conversationId)
        ->participants()
        ->where('user_id', $user->id)
        ->exists();
});

// ✅ AGREGAR: Canal privado para notificaciones de usuario
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// ✅ Canal para presencia de usuario (formato alternativo que usa Laravel)
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});