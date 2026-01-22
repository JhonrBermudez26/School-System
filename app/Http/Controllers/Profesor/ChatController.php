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

        // Obtener conversaciones del usuario con último mensaje
        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with([
            'participants.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'email', 'photo');
            }, 
            'messages' => function ($q) {
                $q->latest()->limit(1); // Solo último mensaje
            }, 
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name');
            }
        ])
        ->orderByDesc('last_message_at')
        ->get();

        // Usuarios disponibles para nuevo chat (estudiantes y profesores)
        $availableUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['estudiante', 'profesor']);
        })
        ->where('id', '!=', $user->id)
        ->select('id', 'name', 'last_name', 'email', 'photo')
        ->get();

        return Inertia::render('Profesor/Clases/Chat', [
            'conversations' => $conversations,
            'availableUsers' => $availableUsers,
            'users' => [], // Inicialmente vacío
        ]);
    }

    /**
     * Buscar usuarios para iniciar conversación
     * MODIFICADO PARA INERTIA
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

        // CAMBIO IMPORTANTE: Devolver con Inertia en lugar de JSON
        $user = Auth::user();
        
        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with([
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
            'users' => $users, // Resultados de búsqueda
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
                    return redirect()->back();
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
            
            return redirect()->back();
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
        $conversation = Conversation::with(['participants.user', 'messages.user'])
            ->findOrFail($id);

        // Verificar que el usuario pertenece al chat
        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        // Marcar mensajes como leídos
        foreach ($conversation->messages as $message) {
            if ($message->user_id !== Auth::id()) {
                $message->markAsRead(Auth::id());
            }
        }

        $user = Auth::user();
        
        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id);
        })->with([
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
        'body' => 'required_without:file|string',
        'file' => 'nullable|file|max:10240',
        'type' => 'required|in:text,file,call',
    ]);

    $attachment = null;
    if ($request->hasFile('file')) {
        $attachment = $request->file('file')->store('chat_files', 'public');
        $data['type'] = 'file';
    }

    if ($data['type'] === 'call') {
        $data['body'] = 'Iniciando llamada...';
        $attachment = 'https://meet.google.com/xxx-yyyy-zzz';
    }

    $message = $conversation->messages()->create([
        'user_id' => Auth::id(),
        'body' => $data['body'] ?? null,
        'type' => $data['type'],
        'attachment' => $attachment,
        'read_by' => [Auth::id()],
    ]);

    $conversation->updateLastMessage();

    // ✅ CARGAR la relación del usuario ANTES de broadcast
    $message->load('user:id,name,last_name,photo');

    // ✅ Broadcast el evento
    broadcast(new \App\Events\MessageSent($message));

    // ✅ LOG para debug
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
            ->whereJsonDoesntContain('read_by', Auth::id())
            ->get()
            ->each(function ($message) {
                $message->markAsRead(Auth::id());
            });

        return redirect()->back();
    }

    /**
     * Eliminar un mensaje
     */
    public function deleteMessage($messageId)
    {
        $message = Message::findOrFail($messageId);

        // Solo el autor puede eliminar
        if ($message->user_id !== Auth::id()) {
            abort(403);
        }

        // Eliminar archivo adjunto si existe
        if ($message->attachment && $message->type === 'file') {
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

        // Verificar que quien agrega es parte del grupo
        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403);
        }

        $conversation->addParticipant($data['user_id']);

        return redirect()->back();
    }
}