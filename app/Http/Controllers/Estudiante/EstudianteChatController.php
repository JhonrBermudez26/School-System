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
            $q->where('user_id', $user->id)->whereNull('hidden_at');
        })
        ->with([
            'participants.user:id,name,last_name,email,photo',
            'messages' => function ($q) use ($user) {
                $q->where(fn($q2) => $q2->whereJsonDoesntContain('hidden_by', $user->id)->orWhereNull('hidden_by'))->latest()->limit(1);
            },
            'messages.user:id,name,last_name,photo',
        ])
        ->withCount(['messages as unread_count' => function ($q) use ($user) {
            $q->where('user_id', '!=', $user->id)
              ->whereJsonDoesntContain('read_by', $user->id)
              ->where(fn($q2) => $q2->whereJsonDoesntContain('hidden_by', $user->id)->orWhereNull('hidden_by'));
        }])
        ->orderByDesc('last_message_at')
        ->get();

        $availableUsers = User::whereHas('roles', fn($q) => $q->whereIn('name', ['estudiante', 'profesor']))
            ->where('id', '!=', $user->id)
            ->select('id', 'name', 'last_name', 'email', 'photo')
            ->get();

        return Inertia::render('Estudiante/Chat', [
            'conversations'  => $conversations,
            'availableUsers' => $availableUsers,
            'users'          => [],
        ]);
    }

    public function conversationsJson()
    {
        $user = Auth::user();

        return Conversation::whereHas('participants', function ($q) use ($user) {
            $q->where('user_id', $user->id)->whereNull('hidden_at');
        })
        ->with([
            'participants.user:id,name,last_name,photo',
            'messages' => function ($q) use ($user) {
                $q->where(fn($q2) => $q2->whereJsonDoesntContain('hidden_by', $user->id)->orWhereNull('hidden_by'))->latest()->limit(1);
            },
            'messages.user:id,name,last_name,photo',
        ])
        ->withCount(['messages as unread_count' => function ($q) use ($user) {
            $q->where('user_id', '!=', $user->id)
              ->whereJsonDoesntContain('read_by', $user->id)
              ->where(fn($q2) => $q2->whereJsonDoesntContain('hidden_by', $user->id)->orWhereNull('hidden_by'));
        }])
        ->orderByDesc('last_message_at')
        ->get();
    }

    private function getMessagePreview($message)
    {
        return match ($message->type) {
            'text'   => mb_substr($message->body, 0, 50) . (mb_strlen($message->body) > 50 ? '...' : ''),
            'audio'  => '🎤 Mensaje de voz',
            'file'   => '📎 Archivo adjunto',
            'call'   => '📞 Llamada',
            'system' => $message->body,
            default  => 'Nuevo mensaje',
        };
    }

    private function normalize($string)
    {
        return mb_strtolower(iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $string));
    }

    public function searchUsers(Request $request)
    {
        $request->validate(['query' => 'required|string|min:1|max:100']);

        $query = $this->normalize($request->query('query'));

        $users = User::whereHas('roles', fn($q) => $q->whereIn('name', ['estudiante', 'profesor']))
            ->where('id', '!=', Auth::id())
            ->where(function ($q) use ($query) {
                $q->whereRaw("LOWER(CONCAT(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(name,'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'),' ',REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(last_name,'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u'))) LIKE ?", ["%{$query}%"])
                  ->orWhereRaw("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(last_name,'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u')) LIKE ?", ["%{$query}%"])
                  ->orWhereRaw("LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(email,'á','a'),'é','e'),'í','i'),'ó','o'),'ú','u')) LIKE ?", ["%{$query}%"]);
            })
            ->select('id', 'name', 'last_name', 'email', 'photo')
            ->limit(20)->get();

        return response()->json(['users' => $users]);
    }

    public function createConversation(Request $request)
    {
        $data = $request->validate([
            'type'          => 'required|in:personal,group',
            'name'          => 'required_if:type,group|string|max:255',
            'participants'  => 'required|array|min:1',
            'participants.*'=> 'integer|exists:users,id',
        ]);

        DB::beginTransaction();
        try {
            if ($data['type'] === 'personal') {
                $existingConv = Conversation::where('type', 'personal')
                    ->whereHas('participants', fn($q) => $q->where('user_id', $data['participants'][0]))
                    ->whereHas('participants', fn($q) => $q->where('user_id', Auth::id()))
                    ->first();

                if ($existingConv) {
                    DB::table('participants')->where('conversation_id', $existingConv->id)->where('user_id', Auth::id())->update(['hidden_at' => null]);
                    DB::commit();

                    if ($request->expectsJson() || $request->ajax()) {
                        return response()->json(['success' => true, 'conversation_id' => $existingConv->id, 'exists' => true]);
                    }
                    return redirect()->route('estudiante.chat.show', $existingConv->id);
                }
            }

            $conversation = Conversation::create([
                'type'       => $data['type'],
                'name'       => $data['type'] === 'group' ? $data['name'] : null,
                'created_by' => Auth::id(),
            ]);

            $conversation->addParticipant(Auth::id());

            $addedUsers = [];
            if ($data['type'] === 'group') {
                $conversation->messages()->create(['user_id' => Auth::id(), 'body' => Auth::user()->name . ' ' . Auth::user()->last_name . ' creó el grupo', 'type' => 'system', 'read_by' => [Auth::id()]]);
                $conversation->updateLastMessage();
            }

            foreach ($data['participants'] as $userId) {
                if ($userId !== Auth::id()) {
                    $conversation->addParticipant($userId);
                    if ($data['type'] === 'group') {
                        $addedUser = User::find($userId);
                        if ($addedUser) {
                            $addedUsers[] = $addedUser->name . ' ' . $addedUser->last_name;
                            try {
                                broadcast(new UserAddedToGroup($userId, $conversation->id, $conversation->name, Auth::user()->name . ' ' . Auth::user()->last_name))->toOthers();
                            } catch (\Exception $e) {
                                \Log::error('Error broadcasting UserAddedToGroup:', ['error' => $e->getMessage()]);
                            }
                        }
                    }
                }
            }

            if ($data['type'] === 'group' && !empty($addedUsers)) {
                $creatorName = Auth::user()->name . ' ' . Auth::user()->last_name;
                $lastUser    = count($addedUsers) > 1 ? array_pop($addedUsers) : null;
                $msgBody     = $lastUser
                    ? "{$creatorName} agregó a " . implode(', ', $addedUsers) . " y {$lastUser}"
                    : "{$creatorName} agregó a {$addedUsers[0]}";
                $conversation->messages()->create(['user_id' => Auth::id(), 'body' => $msgBody, 'type' => 'system', 'read_by' => [Auth::id()]]);
                $conversation->updateLastMessage();
            }

            if ($data['type'] === 'group' && count($data['participants']) < 2) {
                throw new \Exception('Los grupos deben tener al menos 2 participantes además del creador');
            }

            DB::commit();

            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['success' => true, 'conversation_id' => $conversation->id, 'exists' => false]);
            }
            return redirect()->route('estudiante.chat.show', $conversation->id);
        } catch (\Exception $e) {
            DB::rollback();
            if ($request->expectsJson() || $request->ajax()) {
                return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
            }
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + ConversationPolicy::view()
     */
    public function getConversation(Conversation $conversation)
    {
        $user = Auth::user();
        $this->authorize('view', $conversation);

        $participantRow = DB::table('participants')->where('conversation_id', $conversation->id)->where('user_id', $user->id)->first();
        $hiddenAt       = $participantRow?->hidden_at;

        $conversation->load([
            'participants.user' => fn($q) => $q->select('id', 'name', 'last_name', 'email', 'photo'),
            'messages'          => function ($q) use ($user, $hiddenAt) {
                $q->where(fn($q2) => $q2->whereJsonDoesntContain('hidden_by', $user->id)->orWhereNull('hidden_by'));
                if ($hiddenAt) $q->where('created_at', '>', $hiddenAt);
                $q->orderBy('created_at');
            },
            'messages.user' => fn($q) => $q->select('id', 'name', 'last_name', 'photo'),
        ]);

        foreach ($conversation->messages as $message) {
            if ($message->user_id !== $user->id && !$message->isReadBy($user->id)) {
                $message->markAsRead($user->id);
            }
        }

        $conversation->load([
            'messages' => function ($q) use ($user, $hiddenAt) {
                $q->where(fn($q2) => $q2->whereJsonDoesntContain('hidden_by', $user->id)->orWhereNull('hidden_by'));
                if ($hiddenAt) $q->where('created_at', '>', $hiddenAt);
                $q->orderBy('created_at');
            },
            'messages.user' => fn($q) => $q->select('id', 'name', 'last_name', 'photo'),
        ]);

        if (request()->wantsJson()) {
            return response()->json(['conversation' => $conversation]);
        }

        return Inertia::render('Estudiante/Chat', [
            'conversation' => $conversation,
            'users'        => [],
        ]);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + ConversationPolicy::sendMessage()
     */
    public function sendMessage(Request $request, Conversation $conversation)
    {
        $this->authorize('sendMessage', $conversation);

        $data = $request->validate([
            'body' => 'nullable|string',
            'file' => 'nullable|file|max:10240',
            'type' => 'required|in:text,file,call,audio',
        ]);

        $attachment  = null;
        $messageType = $data['type'];

        if ($request->hasFile('file')) {
            $attachment  = $request->file('file')->store($messageType === 'audio' ? 'chat_audios' : 'chat_files', 'private');
            $messageType = $messageType === 'audio' ? 'audio' : 'file';
        }

        if ($messageType === 'call') {
            $data['body'] = 'Iniciando llamada...';
            $attachment   = 'https://meet.jit.si/chat-' . $conversation->id . '-' . time();
        }

        $message = $conversation->messages()->create([
            'user_id'    => Auth::id(),
            'body'       => $data['body'] ?? null,
            'type'       => $messageType,
            'attachment' => $attachment,
            'read_by'    => [Auth::id()],
        ]);

        $conversation->updateLastMessage();
        $message->load('user:id,name,last_name,photo');

        $conversation->participants()->where('user_id', '!=', Auth::id())->whereNotNull('hidden_at')->get()
            ->each(fn($p) => DB::table('participants')->where('id', $p->id)->update(['hidden_at' => $message->created_at->subSecond()]));

        try {
            broadcast(new MessageSent($message))->toOthers();
            $conversation->participants()->where('user_id', '!=', Auth::id())->with('user')->get()
                ->each(fn($p) => broadcast(new ChatNotification($p->user_id, $conversation->id, Auth::user()->name . ' ' . Auth::user()->last_name, $this->getMessagePreview($message)))->toOthers());
        } catch (\Exception $e) {
            \Log::error('Error broadcasting message:', ['error' => $e->getMessage()]);
        }

        return response()->json(['message' => $message]);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + authorize view
     */
    public function markAsRead(Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        $conversation->messages()->where('user_id', '!=', Auth::id())->get()
            ->each(fn($m) => $m->markAsRead(Auth::id()));

        return response()->json(['success' => true]);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + verificación participante
     */
    public function deleteConversation(Conversation $conversation)
    {
        $this->authorize('view', $conversation);

        DB::table('participants')
            ->where('conversation_id', $conversation->id)
            ->where('user_id', Auth::id())
            ->update(['hidden_at' => now()]);

        return response()->json(['success' => true]);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + MessagePolicy verifica sender_id
     */
    public function deleteMessage(Request $request, Message $message)
    {
        $this->authorize('delete', $message);

        $data           = $request->validate(['delete_for' => 'required|in:me,everyone']);
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

            try {
                broadcast(new MessageDeleted($message->id, $conversationId, 'everyone'))->toOthers();
            } catch (\Exception $e) {
                \Log::error('Error broadcasting MessageDeleted:', ['error' => $e->getMessage()]);
            }
        } else {
            $hiddenBy = $message->hidden_by ?? [];
            if (!in_array(Auth::id(), $hiddenBy)) {
                $hiddenBy[]         = (int) Auth::id();
                $message->hidden_by = $hiddenBy;
                $message->save();
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + ConversationPolicy::leave()
     */
    public function leaveGroup(Conversation $conversation)
    {
        if ($conversation->type !== 'group') {
            return response()->json(['success' => false, 'message' => 'Solo se puede salir de grupos'], 400);
        }

        $this->authorize('leave', $conversation);

        if ($conversation->participants()->count() <= 1) {
            return response()->json(['success' => false, 'message' => 'No puedes salir porque eres el único participante.'], 400);
        }

        $leaverName = Auth::user()->name . ' ' . Auth::user()->last_name;
        $conversation->messages()->create(['user_id' => Auth::id(), 'body' => "{$leaverName} salió del grupo", 'type' => 'system', 'read_by' => [Auth::id()]]);
        $conversation->updateLastMessage();
        $conversation->participants()->where('user_id', Auth::id())->delete();

        try {
            $conversation->participants()->where('user_id', '!=', Auth::id())->with('user')->get()
                ->each(fn($p) => broadcast(new ChatNotification($p->user_id, $conversation->id, Auth::user()->name . ' ' . Auth::user()->last_name, 'Ha salido del grupo: ' . $conversation->name))->toOthers());
        } catch (\Exception $e) {
            \Log::error('Error notificando salida de grupo:', ['error' => $e->getMessage()]);
        }

        return response()->json(['success' => true, 'message' => 'Has salido del grupo exitosamente']);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + ConversationPolicy::addParticipant()
     */
    public function addParticipant(Request $request, Conversation $conversation)
    {
        $this->authorize('addParticipant', $conversation);

        if ($conversation->type !== 'group') {
            return response()->json(['success' => false, 'message' => 'Solo se pueden agregar participantes a grupos'], 400);
        }

        $data = $request->validate(['user_id' => 'required|integer|exists:users,id']);

        if ($conversation->participants()->where('user_id', $data['user_id'])->exists()) {
            return response()->json(['success' => false, 'message' => 'Este usuario ya es participante del grupo'], 400);
        }

        $conversation->addParticipant($data['user_id']);
        $adderName     = Auth::user()->name . ' ' . Auth::user()->last_name;
        $addedUser     = User::findOrFail($data['user_id']);
        $addedUserName = $addedUser->name . ' ' . $addedUser->last_name;

        $conversation->messages()->create(['user_id' => Auth::id(), 'body' => "{$adderName} agregó a {$addedUserName}", 'type' => 'system', 'read_by' => [Auth::id()]]);
        $conversation->updateLastMessage();

        try {
            broadcast(new UserAddedToGroup($data['user_id'], $conversation->id, $conversation->name, $adderName))->toOthers();
            broadcast(new ChatNotification($data['user_id'], $conversation->id, $adderName, 'Te ha agregado al grupo: ' . $conversation->name))->toOthers();
        } catch (\Exception $e) {
            \Log::error('Error notificación nuevo participante:', ['error' => $e->getMessage()]);
        }

        return response()->json(['success' => true, 'message' => 'Participante agregado exitosamente']);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + MessagePolicy::update() verifica sender_id
     */
    public function editMessage(Request $request, Message $message)
    {
        $this->authorize('update', $message);

        if ($message->type !== 'text') {
            return response()->json(['error' => 'Solo se pueden editar mensajes de texto'], 400);
        }

        $data = $request->validate(['body' => 'required|string|max:5000']);
        $message->update(['body' => $data['body'], 'edited' => true]);

        try {
            broadcast(new MessageEdited($message))->toOthers();
        } catch (\Exception $e) {
            \Log::error('Error broadcasting MessageEdited:', ['error' => $e->getMessage()]);
        }

        return response()->json(['success' => true, 'message' => $message]);
    }

    /**
     * ✅ FIX IDOR: Route Model Binding + ConversationPolicy::updateGroup()
     */
    public function updateGroup(Request $request, Conversation $conversation)
    {
        $this->authorize('updateGroup', $conversation);

        if ($conversation->type !== 'group') {
            return redirect()->back()->withErrors(['error' => 'Solo se puede editar información de grupos']);
        }

        $data = $request->validate(['name' => 'required|string|max:255']);

        if ($conversation->name !== $data['name']) {
            $editorName = Auth::user()->name . ' ' . Auth::user()->last_name;
            $oldName    = $conversation->name;
            $conversation->update(['name' => $data['name']]);
            $conversation->messages()->create(['user_id' => Auth::id(), 'body' => "{$editorName} cambió el nombre del grupo de \"{$oldName}\" a \"{$data['name']}\"", 'type' => 'system', 'read_by' => [Auth::id()]]);
            $conversation->updateLastMessage();
        }

        return redirect()->back();
    }
}