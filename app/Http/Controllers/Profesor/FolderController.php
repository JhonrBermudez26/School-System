<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Folder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;

class FolderController extends Controller
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|integer|exists:folders,id',
        ]);

        $this->assertOwnership((int) $data['subject_id'], (int) $data['group_id']);

        $folder = Folder::create([
            'subject_id' => $data['subject_id'],
            'group_id' => $data['group_id'],
            'user_id' => Auth::id(),
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'parent_id' => $data['parent_id'] ?? null,
        ]);

        return Redirect::back()->with('success', 'Carpeta creada');
    }

    public function update(Request $request, Folder $folder)
    {
        $this->assertOwnership((int) $folder->subject_id, (int) $folder->group_id);

        $data = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $folder->update($data);

        return Redirect::back()->with('success', 'Carpeta actualizada');
    }

    public function destroy(Folder $folder)
    {
        $this->assertOwnership((int) $folder->subject_id, (int) $folder->group_id);

        // Eliminar carpetas hijas y archivos en cascada
        $folder->delete();

        return Redirect::back()->with('success', 'Carpeta eliminada');
    }
}