<?php

namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Post;
use App\Models\PostAttachment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;

class PostController extends Controller
{
    private function assertOwnership(int $subjectId, int $groupId): void
    {
        $userId = Auth::id();
        $exists = DB::table('subject_group')
            ->where('user_id', $userId)
            ->where('subject_id', $subjectId)
            ->where('group_id', $groupId)
            ->exists();
        abort_unless($exists, 403);
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
            ->get();

        return response()->json($posts);
    }

    public function store(Request $request)
    {
        // Log para debug
        \Log::info('Datos recibidos:', $request->all());
        \Log::info('Archivos:', $request->allFiles());

        $data = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'type' => 'nullable|in:post,tarea',
            'title' => 'required|string|max:255',
            'content' => 'nullable|string',
            'due_at' => 'nullable|date',
            'files' => 'sometimes|array',
            'files.*' => 'file|max:20480', // hasta 20MB por archivo
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
            'content' => $data['content'] ?? null,
            'due_at' => $data['due_at'] ?? null,
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
                    \Log::info('Archivo guardado:', ['filename' => $file->getClientOriginalName(), 'path' => $path]);
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
                    \Log::info('Enlace guardado:', ['url' => $url]);
                }
            }
        }

        return Redirect::back()->with('success', 'Publicación creada');
    }

    public function update(Request $request, Post $post)
    {
        // Verificar pertenencia de la clase a este profesor
        $this->assertOwnership((int) $post->subject_id, (int) $post->group_id);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'content' => 'nullable|string',
            'type' => 'sometimes|in:post,tarea',
            'due_at' => 'nullable|date',
        ]);

        $post->update($data);

        return Redirect::back()->with('success', 'Publicación actualizada');
    }

    public function destroy(Post $post)
    {
        $this->assertOwnership((int) $post->subject_id, (int) $post->group_id);
        
        // Eliminar archivos físicos antes de eliminar el post
        foreach ($post->attachments as $attachment) {
            if ($attachment->type !== 'link' && $attachment->path) {
                Storage::disk('public')->delete($attachment->path);
            }
        }
        
        // Eliminar attachments y post
        $post->attachments()->delete();
        $post->delete();

        return Redirect::back()->with('success', 'Publicación eliminada');
    }
}