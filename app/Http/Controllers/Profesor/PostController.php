<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Events\NewPublicacion;
use App\Events\PublicacionActualizada;
use App\Events\PublicacionEliminada;
use Illuminate\Support\Facades\Gate; 
use Mews\Purifier\Facades\Purifier;

class PostController extends Controller
{
    private function assertPostOwnership(Post $post): void
    {
        $this->authorize('update', $post);
    }

    private function assertOwnership(int $subjectId, int $groupId): void
    {
        Gate::authorize('access-class', [$subjectId, $groupId]);
    }

    public function index(Request $request)
    {
        $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
        ]);

        $subjectId = (int) $request->query('subject_id');
        $groupId = (int) $request->query('group_id');
        $this->assertOwnership($subjectId, $groupId);

        $posts = Post::with('attachments')
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($post) {
                return array_merge($post->toArray(), [
                    'can' => [
                        'update' => auth()->user()->can('update', $post),
                        'delete' => auth()->user()->can('delete', $post),
                    ]
                ]);
            });

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'type' => 'nullable|in:post,tarea',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'due_at' => 'nullable|date',
            'files' => 'sometimes|array',
            'files.*' => [
                'file',
                'max:20480', // 20MB
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt',
                'mimetypes:
                     application/pdf,
                     application/msword,
                     application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                     application/vnd.ms-excel,
                     application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                     application/vnd.ms-powerpoint,
                     application/vnd.openxmlformats-officedocument.presentationml.presentation,
                     text/plain'
            ],
            'links' => 'sometimes|array',
            'links.*' => 'string',
        ]);
        

        $this->assertOwnership((int) $data['subject_id'], (int) $data['group_id']);

        $post = Post::create([
            'subject_id' => $data['subject_id'],
            'group_id' => $data['group_id'],
            'user_id' => Auth::id(),
            'type' => $data['type'] ?? 'post',
            'title' => $data['title'],
            'content' => Purifier::clean($data['content'] ?? ''),
            'due_at' => $data['due_at'] ?? null,
        ]);

        // Adjuntar archivos
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                if ($file->isValid()) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs(
                        'posts/' . $post->id,
                        $filename,
                        'private'
                    );
                    $post->attachments()->create([
                        'type' => str_starts_with($file->getMimeType(), 'image/') ? 'image' : 'file',
                        'filename' => $file->getClientOriginalName(),
                        'path' => $path,
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }
            }
        }

        // Adjuntar enlaces
        if (isset($data['links']) && is_array($data['links'])) {
            foreach ($data['links'] as $url) {
                if (!empty($url)) {
                    $post->attachments()->create([
                        'type' => 'link',
                        'url' => $url,
                    ]);
                }
            }
        }

        // ✅ Recargar la publicación con todas sus relaciones
        $post->load(['attachments', 'user']);

        // ✅ Agregar campos calculados
        $postData = $post->toArray();
        $postData['author_name'] = $post->user->name . ' ' . ($post->user->last_name ?? '');
        $postData['author_role'] = 'profesor';
        $postData['author_photo'] = $post->user->photo ? "/storage/{$post->user->photo}" : null;
        $postData['is_owner'] = true;

        // ✅ Emitir el evento
        broadcast(new NewPublicacion($postData, $data['subject_id'], $data['group_id']))->toOthers();

        return Redirect::back()->with('success', 'Publicación creada');
    }

    public function update(Request $request, Post $post)
    {
        // Verificar pertenencia de la clase a este profesor
        $this->assertPostOwnership($post);
        $this->assertOwnership((int) $post->subject_id, (int) $post->group_id);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'nullable|string',
            'type' => 'sometimes|in:post,tarea',
            'due_at' => 'nullable|date',
            'files' => 'sometimes|array',
            'files.*' => [  
            'file',
            'max:20480', // 20MB
            'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,txt',
            'mimetypes:
                application/pdf,
                application/msword,
                application/vnd.openxmlformats-officedocument.wordprocessingml.document,
                application/vnd.ms-excel,
                application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,
                application/vnd.ms-powerpoint,
                application/vnd.openxmlformats-officedocument.presentationml.presentation,
                text/plain'
            ],
            'links' => 'sometimes|array',
            'links.*' => 'string',
            'files_to_delete' => 'sometimes|array',
            'files_to_delete.*' => 'integer',
            'links_to_delete' => 'sometimes|array',
            'links_to_delete.*' => 'integer',
        ]);

        $post->update([
            'title' => $data['title'] ?? $post->title,
             'content' => isset($data['content']) ? Purifier::clean($data['content']) : $post->content,
            'type' => $data['type'] ?? $post->type,
            'due_at' => $data['due_at'] ?? $post->due_at,
        ]);

        // Eliminar archivos marcados
        if (isset($data['files_to_delete']) && is_array($data['files_to_delete'])) {
            foreach ($data['files_to_delete'] as $attachmentId) {
                $attachment = PostAttachment::where('post_id', $post->id)
                    ->where('id', $attachmentId)
                    ->first();
                if ($attachment) {
                    if ($attachment->type !== 'link' && $attachment->path) {
                        Storage::disk('private')->delete($attachment->path);
                    }
                    $attachment->delete();
                }
            }
        }

        // Eliminar enlaces marcados
        if (isset($data['links_to_delete']) && is_array($data['links_to_delete'])) {
            PostAttachment::where('post_id', $post->id)
                ->whereIn('id', $data['links_to_delete'])
                ->delete();
        }

        // Agregar nuevos archivos
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                if ($file->isValid()) {
                    $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs(
                        'posts/' . $post->id,
                        $filename,
                        'private'
                    );
                    $post->attachments()->create([
                        'type' => str_starts_with($file->getMimeType(), 'image/') ? 'image' : 'file',
                        'filename' => $file->getClientOriginalName(),
                        'path' => $path,
                        'mime' => $file->getMimeType(),
                        'size' => $file->getSize(),
                    ]);
                }
            }
        }

        // Agregar nuevos enlaces
        if (isset($data['links']) && is_array($data['links'])) {
            foreach ($data['links'] as $url) {
                if (!empty($url)) {
                    $post->attachments()->create([
                        'type' => 'link',
                        'url' => $url,
                    ]);
                }
            }
        }

        // ✅ Recargar publicación con datos completos
        $post->load(['attachments', 'user']);

        $postData = $post->toArray();
        $postData['author_name'] = $post->user->name . ' ' . ($post->user->last_name ?? '');
        $postData['author_role'] = 'profesor';
        $postData['author_photo'] = $post->user->photo ? "/storage/{$post->user->photo}" : null;
        $postData['is_owner'] = (int)$post->user_id === Auth::id();

        // ✅ Emitir evento de actualización
        broadcast(new PublicacionActualizada($postData, $post->subject_id, $post->group_id))->toOthers();

        return Redirect::back()->with('success', 'Publicación actualizada');
    }

    public function destroy(Post $post)
    {
        $subjectId = $post->subject_id;
        $groupId = $post->group_id;
        $postId = $post->id;

        $this->authorize('delete', $post);
        
        // Eliminar archivos físicos antes de eliminar el post
        foreach ($post->attachments as $attachment) {
            if ($attachment->type !== 'link' && $attachment->path) {
                Storage::disk('private')->delete($attachment->path);
            }
        }
        
        // Eliminar attachments y post
        $post->attachments()->delete();
        $post->delete();

        // ✅ Emitir evento de eliminación
        broadcast(new PublicacionEliminada($postId, $subjectId, $groupId))->toOthers();

        return Redirect::back()->with('success', 'Publicación eliminada');
    }

    public function download(PostAttachment $attachment)
{
    $post = $attachment->post;

    // Verificar acceso a la clase
    $this->assertOwnership((int) $post->subject_id, (int) $post->group_id);

    if ($attachment->type === 'link') {
        abort(404);
    }

    return Storage::disk('private')->download(
        $attachment->path,
        $attachment->filename
    );
}
}