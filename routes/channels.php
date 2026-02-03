<?php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\DB;
use App\Models\Conversation;

// Canal para conversaciones
Broadcast::channel('conversation.{conversationId}', function ($user, $conversationId) {
    return Conversation::find($conversationId)
        ->participants()
        ->where('user_id', $user->id)
        ->exists();
});

// Canal privado para notificaciones de usuario
Broadcast::channel('user.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});

// Canal para presencia de usuario
Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

// ✅ CORRECCIÓN APLICADA: cambiar snake_case a camelCase
Broadcast::channel('clase.{subjectId}.{groupId}', function ($user, $subjectId, $groupId) {
    // Verificar que el usuario es estudiante del grupo
    $isStudent = DB::table('group_user')
        ->where('group_id', $groupId)
        ->where('user_id', $user->id)
        ->exists();
    
    // O verificar que es el profesor de esa clase
    $isTeacher = DB::table('subject_group')
        ->where('subject_id', $subjectId)
        ->where('group_id', $groupId)
        ->where('user_id', $user->id)
        ->exists();
    
    return $isStudent || $isTeacher;
});