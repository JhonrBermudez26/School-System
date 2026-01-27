<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Events\MessageSent;
use App\Events\ChatNotification;


class ChatController extends Controller
{
    /**
     * Muestra la vista principal del chat
     */
    public function index()
    {
        $user = Auth::user();

        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->with([
            'participants.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'email', 'photo');
            },
            'messages' => function ($q) {
                $q->latest()->limit(1);
            },
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'photo');
            }
        ])
        ->withCount(['messages as unread_count' => function ($q) use ($user) {
            $q->where('user_id', '!=', $user->id)
                ->whereJsonDoesntContain('read_by', $user->id);
        }])
        ->orderByDesc('last_message_at')
        ->get();

        $availableUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['estudiante', 'profesor']);
        })
        ->where('id', '!=', $user->id)
        ->select('id', 'name', 'last_name', 'email', 'photo')
        ->get();

        return Inertia::render('Profesor/Chat', [
            'conversations' => $conversations,
            'availableUsers' => $availableUsers,
            'users' => [],
        ]);
    }

    // ChatController.php
public function conversationsJson()
{
    $user = Auth::user();

    return Conversation::whereHas('participants', fn ($q) =>
        $q->where('user_id', $user->id)
    )
    ->with([
        'participants.user:id,name,last_name,photo',
        'messages' => fn ($q) => $q->latest()->limit(1),
        'messages.user:id,name,last_name,photo',
    ])
    ->withCount(['messages as unread_count' => function ($q) use ($user) {
        $q->where('user_id', '!=', $user->id)
          ->whereJsonDoesntContain('read_by', $user->id);
    }])
    ->orderByDesc('last_message_at')
    ->get();
}


    private function getMessagePreview($message)
    {
        switch ($message->type) {
            case 'text':
                return mb_substr($message->body, 0, 50) . (mb_strlen($message->body) > 50 ? '...' : '');
            case 'audio':
                return '🎤 Mensaje de voz';
            case 'file':
                return '📎 Archivo adjunto';
            case 'call':
                return '📞 Llamada';
            default:
                return 'Nuevo mensaje';
        }
    }

    private function normalize($string)
{
    return mb_strtolower(
        iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $string)
    );
}

    
    /**
     * Buscar usuarios para iniciar conversación
     */
    public function searchUsers(Request $request)
{
    $request->validate([
        'query' => 'required|string|min:1|max:100',
    ]);
    
    $rawQuery = $request->query('query');
    $query = $this->normalize($rawQuery);
    
    $users = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['estudiante', 'profesor']);
        })
        ->where('id', '!=', Auth::id())
        ->where(function ($q) use ($query) {
            $q->whereRaw(
                "LOWER(
                    CONCAT(
                        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,
                        'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),
                        ' ',
                        REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(last_name,
                        'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u')
                    )
                ) LIKE ?",
                ["%{$query}%"]
            )
            ->orWhereRaw(
                "LOWER(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(last_name,  
                    'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u')
                ) LIKE ?",
                ["%{$query}%"]
            )
            ->orWhereRaw(
                "LOWER(
                    REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(email,
                    'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u')
                ) LIKE ?",
                ["%{$query}%"]
            );
        })
        ->select('id', 'name', 'last_name', 'email', 'photo')
        ->limit(20)
        ->get();
    
    return response()->json([
        'users' => $users,
    ]);
}




    /**
     * Crear una nueva conversación (personal o grupal)
     */
    public function createConversation(Request $request)
    {
        $data = $request->validate([
            'type' => 'required|in:personal,group',
            'name' => 'required_if:type,group|string|max:255',
            'participants' => 'required|array|min:1',
            'participants.*' => 'integer|exists:users,id',
        ]);

        DB::beginTransaction();

        try {
            // Verificar si ya existe una conversación personal
            if ($data['type'] === 'personal') {
                $existingConv = Conversation::where('type', 'personal')
                    ->whereHas('participants', function ($q) use ($data) {
                        $q->where('user_id', $data['participants'][0]);
                    })
                    ->whereHas('participants', function ($q) {
                        $q->where('user_id', Auth::id());
                    })
                    ->first();

                if ($existingConv) {
                    DB::commit();
                    // ✅ Redirigir a la conversación existente
                    return redirect()->route('profesor.chat.show', $existingConv->id);
                }
            }

            // Crear nueva conversación
            $conversation = Conversation::create([
                'type' => $data['type'],
                'name' => $data['type'] === 'group' ? $data['name'] : null,
                'created_by' => Auth::id(),
            ]);

            // Agregar creador
            $conversation->addParticipant(Auth::id());

            // Agregar participantes
            foreach ($data['participants'] as $userId) {
                if ($userId !== Auth::id()) {
                    $conversation->addParticipant($userId);
                }
            }

            if ($data['type'] === 'group' && count($data['participants']) < 2) {
                throw new \Exception('Los grupos deben tener al menos 2 participantes además del creador');
            }

            DB::commit();

            // ✅ Redirigir a la nueva conversación
            return redirect()->route('profesor.chat.show', $conversation->id);
        } catch (\Exception $e) {
            DB::rollback();
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Obtener una conversación específica con sus mensajes
     */
    public function getConversation($id)
    {
        $user = Auth::user();
        
        \Log::info('🔍 Cargando conversación', ['conversation_id' => $id, 'user_id' => $user->id]);
        
        $conversation = Conversation::with([
            'participants.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'email', 'photo');
            },
            'messages' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'photo');
            }
        ])
        ->findOrFail($id);

        // Verificar que el usuario pertenece al chat
        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            \Log::warning('❌ Usuario no tiene acceso a conversación', ['conversation_id' => $id, 'user_id' => $user->id]);
            abort(403, 'No tienes acceso a esta conversación');
        }

        \Log::info('📊 Conversación encontrada', [
            'conversation_id' => $id,
            'messages_count' => $conversation->messages->count(),
            'participants_count' => $conversation->participants->count()
        ]);

        // Marcar mensajes como leídos
        $markedCount = 0;
        foreach ($conversation->messages as $message) {
            if ($message->user_id !== $user->id && !$message->isReadBy($user->id)) {
                $message->markAsRead($user->id);
                $markedCount++;
            }
        }
        
        \Log::info('✓ Mensajes marcados como leídos', ['count' => $markedCount]);

        // Recargar mensajes para obtener el read_by actualizado
        $conversation->load([
            'messages' => function ($q) {
                $q->orderBy('created_at', 'asc');
            },
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'photo');
            }
        ]);

        // Obtener todas las conversaciones actualizadas
        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->with([
            'participants.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'email', 'photo');
            },
            'messages' => function ($q) {
                $q->latest()->limit(1);
            },
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'photo');
            }
        ])
        ->withCount(['messages as unread_count' => function ($q) use ($user) {
            $q->where('user_id', '!=', $user->id)
              ->whereJsonDoesntContain('read_by', $user->id);
        }])
        ->orderByDesc('last_message_at')
        ->get();

        $availableUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['estudiante', 'profesor']);
        })
        ->where('id', '!=', $user->id)
        ->select('id', 'name', 'last_name', 'email', 'photo')
        ->get();

        \Log::info('✅ Devolviendo vista con conversación', [
            'conversation_id' => $conversation->id,
            'messages_count' => $conversation->messages->count()
        ]);

        if (request()->wantsJson()) {
            return response()->json([
                'conversation' => $conversation
            ]);
        }

        return Inertia::render('Profesor/Chat', [
            'conversation' => $conversation,
            'users' => [],
        ]);
    }

    /**
     * Enviar un mensaje en una conversación
     */
     public function sendMessage(Request $request, $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);
        
        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }
        
        $data = $request->validate([
            'body' => 'nullable|string',
            'file' => 'nullable|file|max:10240',
            'type' => 'required|in:text,file,call,audio',
        ]);
        
        $attachment = null;
        $messageType = $data['type'];
        
        if ($request->hasFile('file')) {
            if ($messageType === 'audio') {
                $attachment = $request->file('file')->store('chat_audios', 'public');
            } else {
                $attachment = $request->file('file')->store('chat_files', 'public');
                $messageType = 'file';
            }
        }
        
        if ($messageType === 'call') {
            $data['body'] = 'Iniciando llamada...';
            $roomName = "chat-{$conversationId}-" . time();
            $attachment = "https://meet.jit.si/{$roomName}";
        }
        
        $message = $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => $data['body'] ?? null,
            'type' => $messageType,
            'attachment' => $attachment,
            'read_by' => [Auth::id()],
        ]);
        
        $conversation->updateLastMessage();
        $message->load('user:id,name,last_name,photo');
        
        // ✅ CORRECCIÓN: Manejo de errores en broadcast
        try {
            // Broadcast del mensaje al canal de la conversación
            broadcast(new MessageSent($message))->toOthers();
            
            // Enviar notificación a cada participante (excepto el remitente)
            $participants = $conversation->participants()
                ->where('user_id', '!=', Auth::id())
                ->with('user')
                ->get();
            
            foreach ($participants as $participant) {
                broadcast(new ChatNotification(
                    $participant->user_id,
                    $conversationId,
                    Auth::user()->name . ' ' . Auth::user()->last_name,
                    $this->getMessagePreview($message)
                ))->toOthers();
            }
            
            \Log::info('📤 Mensaje enviado con notificaciones', [
                'conversation_id' => $conversationId,
                'message_id' => $message->id,
                'user_id' => Auth::id(),
                'participants_notified' => $participants->count()
            ]);
        } catch (\Exception $e) {
            \Log::error('❌ Error broadcasting message:', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversationId
            ]);
        }
        
        return response()->json([
    'message' => $message
]);

    }

    /**
     * Marcar mensajes como leídos
     */
    public function markAsRead($conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);
        
        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }
        
        $conversation->messages()
            ->where('user_id', '!=', Auth::id())
            ->get()
            ->each(function ($message) {
                $message->markAsRead(Auth::id());
            });
        
        // ✅ CORRECCIÓN: Devolver JSON para Inertia con preserveState
        return response()->json(['success' => true]);
    }


/**
 * Eliminar conversación completa
 */
public function deleteConversation($conversationId)
{
    $conversation = Conversation::findOrFail($conversationId);
    
    if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
        abort(403, 'No tienes acceso a esta conversación');
    }
    
    // Eliminar participación del usuario
    $conversation->participants()->where('user_id', Auth::id())->delete();
    
    // Si no quedan participantes, eliminar conversación completa
    if ($conversation->participants()->count() === 0) {
        // Eliminar archivos adjuntos
        foreach ($conversation->messages as $message) {
            if ($message->attachment && in_array($message->type, ['file', 'audio'])) {
                Storage::disk('public')->delete($message->attachment);
            }
        }
        $conversation->delete();
    }
    
    return response()->json(['success' => true]);
}


    /**
 * Eliminar mensaje
 */
/**
 * Eliminar mensaje
 */
public function deleteMessage(Request $request, $messageId)
{
    $message = Message::findOrFail($messageId);
    
    if ($message->user_id !== Auth::id()) {
        abort(403, 'No tienes permiso para eliminar este mensaje');
    }
    
    $data = $request->validate([
        'delete_for' => 'required|in:me,everyone'
    ]);
    
    if ($data['delete_for'] === 'everyone') {
        // Eliminar para todos
        if ($message->type === 'text') {
            // Para texto: mostrar mensaje de eliminado
            $message->update([
                'body' => 'Este mensaje fue eliminado',
                'deleted' => true
            ]);
        } else {
            // Para audio/archivo: eliminar archivo físico y marcar como eliminado
            if ($message->attachment && in_array($message->type, ['file', 'audio'])) {
                Storage::disk('public')->delete($message->attachment);
            }
            $message->update([
                'body' => $message->type === 'audio' ? '🎤 Audio eliminado' : '📎 Archivo eliminado',
                'attachment' => null,
                'deleted' => true
            ]);
        }
    } else {
        // Eliminar solo para el usuario actual
        $hiddenBy = $message->hidden_by ?? [];
        if (!in_array(Auth::id(), $hiddenBy)) {
            $hiddenBy[] = Auth::id();
            $message->update(['hidden_by' => $hiddenBy]);
        }
    }
    
    return response()->json(['success' => true]);
}

    /**
     * Salir de un grupo
     */
    public function leaveGroup($conversationId)
{
    $conversation = Conversation::findOrFail($conversationId);
    
    if ($conversation->type !== 'group') {
        return response()->json([
            'success' => false,
            'message' => 'Solo se puede salir de grupos'
        ], 400);
    }
    
    // Verificar que el usuario es participante
    if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
        return response()->json([
            'success' => false,
            'message' => 'No eres parte de este grupo'
        ], 403);
    }
    
    // Verificar que no sea el último participante
    $participantCount = $conversation->participants()->count();
    if ($participantCount <= 1) {
        return response()->json([
            'success' => false,
            'message' => 'No puedes salir porque eres el único participante. Elimina el grupo en su lugar.'
        ], 400);
    }
    
    // Eliminar participante
    $conversation->participants()->where('user_id', Auth::id())->delete();
    
    // Notificar a los demás participantes
    try {
        $participants = $conversation->participants()
            ->where('user_id', '!=', Auth::id())
            ->with('user')
            ->get();
        
        foreach ($participants as $participant) {
            broadcast(new ChatNotification(
                $participant->user_id,
                $conversationId,
                Auth::user()->name . ' ' . Auth::user()->last_name,
                'Ha salido del grupo: ' . $conversation->name
            ))->toOthers();
        }
    } catch (\Exception $e) {
        \Log::error('Error notificando salida de grupo:', [
            'error' => $e->getMessage()
        ]);
    }
    
    \Log::info('✅ Usuario salió del grupo', [
        'conversation_id' => $conversationId,
        'user_id' => Auth::id()
    ]);
    
    return response()->json([
        'success' => true,
        'message' => 'Has salido del grupo exitosamente'
    ]);
}

    /**
     * Agregar participante a un grupo
     */
    public function addParticipant(Request $request, $conversationId)
{
    $conversation = Conversation::findOrFail($conversationId);
    
    if ($conversation->type !== 'group') {
        return response()->json([
            'success' => false,
            'message' => 'Solo se pueden agregar participantes a grupos'
        ], 400);
    }
    
    $data = $request->validate([
        'user_id' => 'required|integer|exists:users,id'
    ]);
    
    if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
        return response()->json([
            'success' => false,
            'message' => 'No tienes permiso para agregar participantes'
        ], 403);
    }
    
    // Verificar si el usuario ya es participante
    if ($conversation->participants()->where('user_id', $data['user_id'])->exists()) {
        return response()->json([
            'success' => false,
            'message' => 'Este usuario ya es participante del grupo'
        ], 400);
    }
    
    // Agregar participante
    $conversation->addParticipant($data['user_id']);
    
    // Enviar notificación al nuevo participante
    try {
        broadcast(new ChatNotification(
            $data['user_id'],
            $conversationId,
            Auth::user()->name . ' ' . Auth::user()->last_name,
            'Te ha agregado al grupo: ' . $conversation->name
        ))->toOthers();
    } catch (\Exception $e) {
        \Log::error('Error enviando notificación de nuevo participante:', [
            'error' => $e->getMessage()
        ]);
    }
    
    \Log::info('✅ Participante agregado', [
        'conversation_id' => $conversationId,
        'new_user_id' => $data['user_id']
    ]);
    
    return response()->json([
        'success' => true,
        'message' => 'Participante agregado exitosamente'
    ]);
}


/**
 * Editar mensaje
 */
public function editMessage(Request $request, $messageId)
{
    $message = Message::findOrFail($messageId);
    
    if ($message->user_id !== Auth::id()) {
        abort(403, 'No tienes permiso para editar este mensaje');
    }
    
    if ($message->type !== 'text') {
        return response()->json(['error' => 'Solo se pueden editar mensajes de texto'], 400);
    }
    
    $data = $request->validate([
        'body' => 'required|string|max:5000'
    ]);
    
    $message->update([
        'body' => $data['body'],
        'edited' => true
    ]);
    
    return response()->json(['success' => true, 'message' => $message]);
}

    /**
     * Actualizar información del grupo
     */
    public function updateGroup(Request $request, $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'group') {
            return redirect()->back()->withErrors(['error' => 'Solo se puede editar información de grupos']);
        }

        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $conversation->update([
            'name' => $data['name']
        ]);

        return redirect()->back();
    }

    
}