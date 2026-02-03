<?php
namespace App\Http\Controllers\Estudiante;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use App\Events\NewPublicacion;
use App\Events\PublicacionActualizada;
use App\Events\PublicacionEliminada;

class EstudiantePostController extends Controller
{
    /**
     * Verificar que el estudiante pertenece al grupo
     */
    private function assertGroupMembership(int $groupId): void
    {
        $userId = Auth::id();
        $belongs = DB::table('group_user')
            ->where('group_id', $groupId)
            ->where('user_id', $userId)
            ->exists();
        abort_unless($belongs, 403, 'No tienes acceso a este grupo');
    }

    /**
     * Verificar que el usuario es el autor de la publicación
     */
    private function assertOwnership(Post $post): void
    {
        abort_unless($post->user_id === Auth::id(), 403, 'No tienes permiso para editar esta publicación');
    }

    /**
     * Crear una publicación
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'type' => 'nullable|in:post',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'files' => 'sometimes|array',
            'files.*' => 'file|max:20480', // 20MB max
            'links' => 'sometimes|array',
            'links.*' => 'string',
        ]);

        $this->assertGroupMembership((int) $data['group_id']);

        // Crear la publicación
        $post = Post::create([
            'subject_id' => $data['subject_id'],
            'group_id' => $data['group_id'],
            'user_id' => Auth::id(),
            'type' => $data['type'] ?? 'post',
            'title' => $data['title'],
            'content' => $data['content'] ?? null,
        ]);

        // Adjuntar archivos
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                if ($file->isValid()) {
                    $path = $file->store('posts', 'public');
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

        // ✅ Recargar con relaciones
        $post->load(['attachments', 'user']);

        // ✅ Preparar datos completos
        $postData = $post->toArray();
        $postData['author_name'] = $post->user->name . ' ' . ($post->user->last_name ?? '');
        $postData['author_role'] = 'estudiante';
        $postData['author_photo'] = $post->user->photo ? "/storage/{$post->user->photo}" : null;
        $postData['is_owner'] = true;

        // ✅ Emitir evento (se enviará a TODOS los usuarios del canal)
        broadcast(new NewPublicacion($postData, $data['subject_id'], $data['group_id']))->toOthers();

        return Redirect::back()->with('success', 'Publicación creada exitosamente');
    }

    /**
     * Actualizar una publicación
     */
    public function update(Request $request, Post $post)
    {
        $this->assertOwnership($post);
        $this->assertGroupMembership((int) $post->group_id);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'nullable|string',
            'files' => 'sometimes|array',
            'files.*' => 'file|max:20480',
            'links' => 'sometimes|array',
            'links.*' => 'string',
            'files_to_delete' => 'sometimes|array',
            'files_to_delete.*' => 'integer',
            'links_to_delete' => 'sometimes|array',
            'links_to_delete.*' => 'integer',
        ]);

        // Actualizar datos básicos
        $post->update([
            'title' => $data['title'] ?? $post->title,
            'content' => $data['content'] ?? $post->content,
        ]);

        // Eliminar archivos marcados
        if (isset($data['files_to_delete']) && is_array($data['files_to_delete'])) {
            foreach ($data['files_to_delete'] as $attachmentId) {
                $attachment = PostAttachment::where('post_id', $post->id)
                    ->where('id', $attachmentId)
                    ->first();
                if ($attachment) {
                    if ($attachment->type !== 'link' && $attachment->path) {
                        Storage::disk('public')->delete($attachment->path);
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
                    $path = $file->store('posts', 'public');
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
        $postData['author_role'] = 'estudiante';
        $postData['author_photo'] = $post->user->photo ? "/storage/{$post->user->photo}" : null;
        $postData['is_owner'] = (int)$post->user_id === Auth::id();

        // ✅ Emitir evento de actualización
        broadcast(new PublicacionActualizada($postData, $post->subject_id, $post->group_id))->toOthers();

        return Redirect::back()->with('success', 'Publicación actualizada exitosamente');
    }

    /**
     * Eliminar una publicación
     */
    public function destroy(Post $post)
    {
        $this->assertOwnership($post);
        $this->assertGroupMembership((int) $post->group_id);

        $subjectId = $post->subject_id;
        $groupId = $post->group_id;
        $postId = $post->id;

        // Eliminar archivos físicos
        foreach ($post->attachments as $attachment) {
            if ($attachment->type !== 'link' && $attachment->path) {
                Storage::disk('public')->delete($attachment->path);
            }
        }

        // Eliminar attachments y post
        $post->attachments()->delete();
        $post->delete();

        // ✅ Emitir evento de eliminación
        broadcast(new PublicacionEliminada($postId, $subjectId, $groupId))->toOthers();

        return Redirect::back()->with('success', 'Publicación eliminada exitosamente');
    }
}