<?php
namespace App\Http\Controllers\Estudiante;
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
use App\Events\UserAddedToGroup;
use App\Events\MessageEdited;
use App\Events\MessageDeleted;

class EstudianteChatController extends Controller
{
    public function index()
    {
        $user = Auth::user();

        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id)
              ->whereNull('hidden_at'); // ✅ Filtrar conversaciones ocultas
        })
        ->with([
            'participants.user:id,name,last_name,email,photo',
            'messages' => function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->whereJsonDoesntContain('hidden_by', $user->id)
                       ->orWhereNull('hidden_by');
                })
                ->latest()
                ->limit(1);
            },
            'messages.user:id,name,last_name,photo',
        ])
        ->withCount(['messages as unread_count' => function ($q) use ($user) {
            $q->where('user_id', '!=', $user->id)
              ->whereJsonDoesntContain('read_by', $user->id)
              ->where(function ($q2) use ($user) {
                  $q2->whereJsonDoesntContain('hidden_by', $user->id)
                     ->orWhereNull('hidden_by');
              });
        }])
        ->orderByDesc('last_message_at')
        ->get();

        $availableUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['estudiante', 'profesor']);
        })
        ->where('id', '!=', $user->id)
        ->select('id', 'name', 'last_name', 'email', 'photo')
        ->get();

        return Inertia::render('Estudiante/Chat', [
            'conversations' => $conversations,
            'availableUsers' => $availableUsers,
            'users' => [],
        ]);
    }

    public function conversationsJson()
    {
        $user = Auth::user();

        return Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id)
              ->whereNull('hidden_at'); // ✅ Filtrar conversaciones ocultas
        })
        ->with([
            'participants.user:id,name,last_name,photo',
            'messages' => function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->whereJsonDoesntContain('hidden_by', $user->id)
                       ->orWhereNull('hidden_by');
                })
                ->latest()
                ->limit(1);
            },
            'messages.user:id,name,last_name,photo',
        ])
        ->withCount(['messages as unread_count' => function ($q) use ($user) {
            $q->where('user_id', '!=', $user->id)
              ->whereJsonDoesntContain('read_by', $user->id)
              ->where(function ($q2) use ($user) {
                  $q2->whereJsonDoesntContain('hidden_by', $user->id)
                     ->orWhereNull('hidden_by');
              });
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
            case 'system':
                return $message->body;
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

        return response()->json(['users' => $users]);
    }

    /**
     * ✅ Igual que profesor: cuando ya existe y estaba oculta, limpia hidden_at
     * para que vea todo el historial al abrirla manualmente.
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
                    // ✅ Si la había eliminado, limpiar hidden_at para ver todo el historial
                    DB::table('participants')
                        ->where('conversation_id', $existingConv->id)
                        ->where('user_id', Auth::id())
                        ->update(['hidden_at' => null]);

                    DB::commit();

                    if ($request->expectsJson() || $request->ajax()) {
                        return response()->json([
                            'success' => true,
                            'conversation_id' => $existingConv->id,
                            'exists' => true
                        ]);
                    }

                    return redirect()->route('estudiante.chat.show', $existingConv->id);
                }
            }

            $conversation = Conversation::create([
                'type' => $data['type'],
                'name' => $data['type'] === 'group' ? $data['name'] : null,
                'created_by' => Auth::id(),
            ]);

            $conversation->addParticipant(Auth::id());

            if ($data['type'] === 'group') {
                $creatorName = Auth::user()->name . ' ' . Auth::user()->last_name;

                $conversation->messages()->create([
                    'user_id' => Auth::id(),
                    'body' => "{$creatorName} creó el grupo",
                    'type' => 'system',
                    'read_by' => [Auth::id()],
                ]);

                $conversation->updateLastMessage();
            }

            $addedUsers = [];
            foreach ($data['participants'] as $userId) {
                if ($userId !== Auth::id()) {
                    $conversation->addParticipant($userId);

                    if ($data['type'] === 'group') {
                        $addedUser = User::find($userId);
                        if ($addedUser) {
                            $addedUsers[] = $addedUser->name . ' ' . $addedUser->last_name;

                            try {
                                broadcast(new UserAddedToGroup(
                                    $userId,
                                    $conversation->id,
                                    $conversation->name,
                                    Auth::user()->name . ' ' . Auth::user()->last_name
                                ))->toOthers();
                            } catch (\Exception $e) {
                                \Log::error('Error broadcasting UserAddedToGroup:', [
                                    'error' => $e->getMessage(),
                                    'user_id' => $userId
                                ]);
                            }
                        }
                    }
                }
            }

            if ($data['type'] === 'group' && !empty($addedUsers)) {
                $creatorName = Auth::user()->name . ' ' . Auth::user()->last_name;

                if (count($addedUsers) === 1) {
                    $messageBody = "{$creatorName} agregó a {$addedUsers[0]}";
                } elseif (count($addedUsers) === 2) {
                    $messageBody = "{$creatorName} agregó a {$addedUsers[0]} y {$addedUsers[1]}";
                } else {
                    $lastUser = array_pop($addedUsers);
                    $messageBody = "{$creatorName} agregó a " . implode(', ', $addedUsers) . " y {$lastUser}";
                }

                $conversation->messages()->create([
                    'user_id' => Auth::id(),
                    'body' => $messageBody,
                    'type' => 'system',
                    'read_by' => [Auth::id()],
                ]);

                $conversation->updateLastMessage();
            }

            if ($data['type'] === 'group' && count($data['participants']) < 2) {
                throw new \Exception('Los grupos deben tener al menos 2 participantes además del creador');
            }

            DB::commit();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'conversation_id' => $conversation->id,
                    'exists' => false
                ]);
            }

            return redirect()->route('estudiante.chat.show', $conversation->id);

        } catch (\Exception $e) {
            DB::rollback();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage()
                ], 400);
            }

            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * ✅ Igual que profesor:
     * - Lee hidden_at ANTES — NO se limpia nunca aquí
     * - Filtra mensajes con hidden_at en ambas cargas
     * - NO limpia hidden_at (el filtro es permanente)
     */
    public function getConversation($id)
    {
        $user = Auth::user();

        // Leer hidden_at ANTES — NO se limpia nunca aquí
        $participantRow = DB::table('participants')
            ->where('conversation_id', $id)
            ->where('user_id', $user->id)
            ->first();

        $hiddenAt = $participantRow?->hidden_at;

        $conversation = Conversation::with([
            'participants.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'email', 'photo');
            },
            'messages' => function ($q) use ($user, $hiddenAt) {
                $q->where(function ($q2) use ($user) {
                    $q2->whereJsonDoesntContain('hidden_by', $user->id)
                       ->orWhereNull('hidden_by');
                });
                // Solo mensajes posteriores a cuando eliminó el chat
                if ($hiddenAt) {
                    $q->where('created_at', '>', $hiddenAt);
                }
                $q->orderBy('created_at', 'asc');
            },
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'photo');
            }
        ])->findOrFail($id);

        if (!$conversation->participants()->where('user_id', $user->id)->exists()) {
            abort(403, 'No tienes acceso a esta conversación');
        }

        // Marcar mensajes como leídos
        foreach ($conversation->messages as $message) {
            if ($message->user_id !== $user->id && !$message->isReadBy($user->id)) {
                $message->markAsRead($user->id);
            }
        }

        // Recargar con el mismo filtro
        $conversation->load([
            'messages' => function ($q) use ($user, $hiddenAt) {
                $q->where(function ($q2) use ($user) {
                    $q2->whereJsonDoesntContain('hidden_by', $user->id)
                       ->orWhereNull('hidden_by');
                });
                if ($hiddenAt) {
                    $q->where('created_at', '>', $hiddenAt);
                }
                $q->orderBy('created_at', 'asc');
            },
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'photo');
            }
        ]);

        // ✅ hidden_at NO se limpia — el filtro es permanente

        $conversations = Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id)->whereNull('hidden_at');
        })
        ->with([
            'participants.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'email', 'photo');
            },
            'messages' => function ($q) use ($user) {
                $q->where(function ($q2) use ($user) {
                    $q2->whereJsonDoesntContain('hidden_by', $user->id)
                       ->orWhereNull('hidden_by');
                })
                ->latest()
                ->limit(1);
            },
            'messages.user' => function ($q) {
                $q->select('id', 'name', 'last_name', 'photo');
            }
        ])
        ->withCount(['messages as unread_count' => function ($q) use ($user) {
            $q->where('user_id', '!=', $user->id)
              ->whereJsonDoesntContain('read_by', $user->id)
              ->where(function ($q2) use ($user) {
                  $q2->whereJsonDoesntContain('hidden_by', $user->id)
                     ->orWhereNull('hidden_by');
              });
        }])
        ->orderByDesc('last_message_at')
        ->get();

        $availableUsers = User::whereHas('roles', function ($q) {
            $q->whereIn('name', ['estudiante', 'profesor']);
        })
        ->where('id', '!=', $user->id)
        ->select('id', 'name', 'last_name', 'email', 'photo')
        ->get();

        if (request()->wantsJson()) {
            return response()->json(['conversation' => $conversation]);
        }

        return Inertia::render('Estudiante/Chat', [
            'conversation' => $conversation,
            'users' => [],
        ]);
    }

    /**
     * ✅ Igual que profesor:
     * - NO limpiar hidden_at de nadie
     * - Cuando el receptor tiene hidden_at, mover su hidden_at a 1 segundo ANTES
     *   del nuevo mensaje para que vea solo ese mensaje al abrir el chat
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
                $attachment = $request->file('file')->store('chat_audios', 'private');
            } else {
                $attachment = $request->file('file')->store('chat_files', 'private');
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

        // ✅ Para receptores que eliminaron el chat: mover su hidden_at a 1 segundo
        // antes de este mensaje para que solo vean este mensaje nuevo (no el historial)
        $conversation->participants()
            ->where('user_id', '!=', Auth::id())
            ->whereNotNull('hidden_at')
            ->get()
            ->each(function ($participant) use ($message) {
                DB::table('participants')
                    ->where('id', $participant->id)
                    ->update(['hidden_at' => $message->created_at->subSecond()]);
            });

        try {
            broadcast(new MessageSent($message))->toOthers();

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
        } catch (\Exception $e) {
            \Log::error('❌ Error broadcasting message:', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversationId
            ]);
        }

        return response()->json(['message' => $message]);
    }

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

        return response()->json(['success' => true]);
    }

    /**
     * ✅ Igual que profesor: guarda timestamp exacto — mensajes anteriores no se mostrarán
     */
    public function deleteConversation($conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            abort(403, 'No tienes acceso a esta conversación');
        }

        DB::table('participants')
            ->where('conversation_id', $conversationId)
            ->where('user_id', Auth::id())
            ->update(['hidden_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function deleteMessage(Request $request, $messageId)
    {
        $message = Message::findOrFail($messageId);

        if ($message->user_id !== Auth::id()) {
            abort(403, 'No tienes permiso para eliminar este mensaje');
        }

        $data = $request->validate([
            'delete_for' => 'required|in:me,everyone'
        ]);
        
         $conversationId = $message->conversation_id;

        if ($data['delete_for'] === 'everyone') {
            if ($message->attachment && in_array($message->type, ['file', 'audio'])) {
                Storage::disk('private')->delete($message->attachment);
            }
            $message->body       = 'Este mensaje fue eliminado';
            $message->deleted    = true;
            $message->attachment = null;
            $message->edited     = false;
            $message->save();

             // ✅ Broadcast "eliminado para todos" en tiempo real
        try {
            broadcast(new MessageDeleted($message->id, $conversationId, 'everyone'))->toOthers();
        } catch (\Exception $e) {
            \Log::error('Error broadcasting MessageDeleted:', ['error' => $e->getMessage()]);
        }

        } else {
            // Eliminar solo para mí — solo afecta al usuario actual, NO se emite broadcast
        $hiddenBy = $message->hidden_by ?? [];
        if (!in_array(Auth::id(), $hiddenBy)) {
            $hiddenBy[]         = (int) Auth::id();
            $message->hidden_by = $hiddenBy;
            $message->save();
        }
        }

        return response()->json(['success' => true]);
    }

    public function leaveGroup($conversationId)
    {
        $conversation = Conversation::findOrFail($conversationId);

        if ($conversation->type !== 'group') {
            return response()->json([
                'success' => false,
                'message' => 'Solo se puede salir de grupos'
            ], 400);
        }

        if (!$conversation->participants()->where('user_id', Auth::id())->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'No eres parte de este grupo'
            ], 403);
        }

        $participantCount = $conversation->participants()->count();
        if ($participantCount <= 1) {
            return response()->json([
                'success' => false,
                'message' => 'No puedes salir porque eres el único participante. Elimina el grupo en su lugar.'
            ], 400);
        }

        $leaverName = Auth::user()->name . ' ' . Auth::user()->last_name;

        $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => "{$leaverName} salió del grupo",
            'type' => 'system',
            'read_by' => [Auth::id()],
        ]);

        $conversation->updateLastMessage();

        $conversation->participants()->where('user_id', Auth::id())->delete();

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
            \Log::error('Error notificando salida de grupo:', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Has salido del grupo exitosamente'
        ]);
    }

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

        if ($conversation->participants()->where('user_id', $data['user_id'])->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Este usuario ya es participante del grupo'
            ], 400);
        }

        $conversation->addParticipant($data['user_id']);

        $adderName = Auth::user()->name . ' ' . Auth::user()->last_name;
        $addedUser = User::find($data['user_id']);
        $addedUserName = $addedUser->name . ' ' . $addedUser->last_name;

        $conversation->messages()->create([
            'user_id' => Auth::id(),
            'body' => "{$adderName} agregó a {$addedUserName}",
            'type' => 'system',
            'read_by' => [Auth::id()],
        ]);

        $conversation->updateLastMessage();

        try {
            broadcast(new UserAddedToGroup(
                $data['user_id'],
                $conversation->id,
                $conversation->name,
                Auth::user()->name . ' ' . Auth::user()->last_name
            ))->toOthers();

            broadcast(new ChatNotification(
                $data['user_id'],
                $conversationId,
                Auth::user()->name . ' ' . Auth::user()->last_name,
                'Te ha agregado al grupo: ' . $conversation->name
            ))->toOthers();
        } catch (\Exception $e) {
            \Log::error('Error enviando notificación de nuevo participante:', ['error' => $e->getMessage()]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Participante agregado exitosamente'
        ]);
    }

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

        // ✅ Broadcast en tiempo real para todos los participantes
    try {
        broadcast(new MessageEdited($message))->toOthers();
    } catch (\Exception $e) {
        \Log::error('Error broadcasting MessageEdited:', ['error' => $e->getMessage()]);
    }

        return response()->json(['success' => true, 'message' => $message]);
    }

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

        if ($conversation->name !== $data['name']) {
            $editorName = Auth::user()->name . ' ' . Auth::user()->last_name;
            $oldName = $conversation->name;
            $newName = $data['name'];

            $conversation->update(['name' => $data['name']]);

            $conversation->messages()->create([
                'user_id' => Auth::id(),
                'body' => "{$editorName} cambió el nombre del grupo de \"{$oldName}\" a \"{$newName}\"",
                'type' => 'system',
                'read_by' => [Auth::id()],
            ]);

            $conversation->updateLastMessage();
        }

        return redirect()->back();
    }
}