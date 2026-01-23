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

class ChatController extends Controller
{
    /**
     * Muestra la vista principal del chat
     */
    public function index()
    {
        $user = Auth::user();

        // Obtener conversaciones con el último mensaje (para performance)
        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })
        ->with([
            'participants.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'email', 'photo');
            },
            'messages' => function ($q) {
                $q->latest()->limit(1); // Solo último mensaje para la lista
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

        return Inertia::render('Profesor/Clases/Chat', [
            'conversations' => $conversations,
            'availableUsers' => $availableUsers,
            'users' => [],
        ]);
    }

    /**
     * Buscar usuarios para iniciar conversación
     */
    public function searchUsers(Request $request)
    {
        $query = $request->validate(['query' => 'required|string|min:2']);

        $users = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['estudiante', 'profesor']);
        })
        ->where(function ($q) use ($query) {
            $q->where('name', 'like', '%' . $query['query'] . '%')
              ->orWhere('last_name', 'like', '%' . $query['query'] . '%')
              ->orWhere('email', 'like', '%' . $query['query'] . '%');
        })
        ->where('id', '!=', Auth::id())
        ->select('id', 'name', 'last_name', 'email', 'photo')
        ->limit(20)
        ->get();

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
                $q->select('id', 'name', 'last_name');
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

        return Inertia::render('Profesor/Clases/Chat', [
            'conversations' => $conversations,
            'availableUsers' => $availableUsers,
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

        return Inertia::render('Profesor/Clases/Chat', [
            'conversations' => $conversations,
            'availableUsers' => $availableUsers,
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

        // Manejar archivo o audio
        if ($request->hasFile('file')) {
            if ($messageType === 'audio') {
                $attachment = $request->file('file')->store('chat_audios', 'public');
            } else {
                $attachment = $request->file('file')->store('chat_files', 'public');
                $messageType = 'file';
            }
        }

        // Manejar llamadas
        if ($messageType === 'call') {
            $data['body'] = 'Iniciando llamada...';
            // Usar Jitsi Meet como en las clases
            $roomName = "chat-{$conversationId}-" . time();
            $attachment = "https://meet.jit.si/{$roomName}";
        }

        $message = $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => $data['body'] ?? null,
            'type' => $messageType,
            'attachment' => $attachment,
            'read_by' => [Auth::id()], // Guardar como array, no como JSON string
        ]);

        $conversation->updateLastMessage();

        $message->load('user:id,name,last_name,photo');

        broadcast(new \App\Events\MessageSent($message));

        \Log::info('📤 Mensaje enviado y broadcast', [
            'conversation_id' => $conversationId,
            'message_id' => $message->id,
            'user_id' => Auth::id()
        ]);

        return redirect()->back();
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

        // ✅ NO devolver JSON, devolver redirect back para Inertia
        return redirect()->back();
    }

    /**
     * Eliminar un mensaje
     */
    public function deleteMessage($messageId)
    {
        $message = Message::findOrFail($messageId);

        if ($message->user_id !== Auth::id()) {
            abort(403);
        }

        if ($message->attachment && in_array($message->type, ['file', 'audio'])) {
            Storage::disk('public')->delete($message->attachment);
        }

        $message->delete();

        return redirect()->back();
    }

    /**
     * Salir de un grupo
     */
    public function leaveGroup($conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'group') {
            return redirect()->back()->withErrors(['error' => 'Solo se puede salir de grupos']);
        }

        $conversation->participants()->where('user_id', Auth::id())->delete();

        return redirect()->back();
    }

    /**
     * Agregar participante a un grupo
     */
    public function addParticipant(Request $request, $conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'group') {
            return redirect()->back()->withErrors(['error' => 'Solo se pueden agregar participantes a grupos']);
        }

        $data = $request->validate([
            'user_id' => 'required|integer|exists:users,id'
        ]);

        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $conversation->addParticipant($data['user_id']);

        return redirect()->back();
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