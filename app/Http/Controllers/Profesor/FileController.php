<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\ClassFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller
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

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
            'folder_id' => 'nullable|integer|exists:folders,id',
            'files' => 'required|array',
            'files.*' => 'file|mimes:pdf,doc,docx,xlsx,ppt,pptx,jpg,png|max:51200', // 50MB max por archivo
        ]);

        $this->assertOwnership((int) $data['subject_id'], (int) $data['group_id']);

        $uploadedFiles = [];

        foreach ($request->file('files') as $file) {
            $path = $file->store('class_files', 'private');
            
            $classFile = ClassFile::create([
                'subject_id' => $data['subject_id'],
                'group_id' => $data['group_id'],
                'folder_id' => $data['folder_id'] ?? null,
                'user_id' => Auth::id(),
                'filename' => $file->getClientOriginalName(),
                'path' => $path,
                'mime' => $file->getMimeType(),
                'size' => $file->getSize(),
            ]);

            $uploadedFiles[] = $classFile;
        }

        return Redirect::back()->with('success', count($uploadedFiles) . ' archivo(s) subido(s)');
    }

    public function destroy(ClassFile $file)
    {
        $this->assertOwnership((int) $file->subject_id, (int) $file->group_id);

        // Eliminar archivo del almacenamiento
        if ($file->path && Storage::disk('private')->exists($file->path)) {
            Storage::disk('private')->delete($file->path);
        }

        $file->delete();

        return Redirect::back()->with('success', 'Archivo eliminado');
    }
    public function download(ClassFile $file)
{
    $this->assertOwnership($file->subject_id, $file->group_id);

    return Storage::disk('private')->download(
        $file->path,
        $file->filename
    );
}
}