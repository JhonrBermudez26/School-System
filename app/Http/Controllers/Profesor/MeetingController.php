<?php
namespace App\Http\Controllers\Profesor;

use App\Http\Controllers\Controller;
use App\Models\Meeting;
use App\Events\MeetingStarted;
use App\Events\MeetingEnded;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Gate;

class MeetingController extends Controller
{
    private function assertOwnership(int $subjectId, int $groupId): void
    {
        Gate::authorize('access-class', [$subjectId, $groupId]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'subject_id' => 'required|integer',
            'group_id' => 'required|integer',
        ]);

        $this->assertOwnership((int) $data['subject_id'], (int) $data['group_id']);

        // Verificar si ya existe una reunión activa
        $existing = Meeting::where('subject_id', $data['subject_id'])
            ->where('group_id', $data['group_id'])
            ->where('is_active', true)
            ->first();

        if ($existing) {
            return Redirect::back()->with('info', 'Ya existe una reunión activa para esta clase');
        }

        // Generar nombre de sala único garantizado
        $baseRoomName = "clase-{$data['subject_id']}-{$data['group_id']}";
        $roomName = $baseRoomName;
        $counter = 1;
        
        // Asegurar que el room_name sea único
        while (Meeting::where('room_name', $roomName)->exists()) {
            $roomName = "{$baseRoomName}-" . time() . "-{$counter}";
            $counter++;
        }
        
        $meeting = Meeting::create([
            'subject_id' => $data['subject_id'],
            'group_id' => $data['group_id'],
            'user_id' => Auth::id(),
            'room_name' => $roomName,
            'url' => "https://meet.jit.si/{$roomName}",
            'is_active' => true,
        ]);

        // Disparar evento
        event(new MeetingStarted($meeting));

        return Redirect::back()->with('success', 'Reunión creada exitosamente');
    }

    public function destroy(Meeting $meeting)
    {
        $this->authorize('end', $meeting);

        $meeting->update([
            'is_active' => false,
            'ended_at' => now()
        ]);

        // Disparar evento
        event(new MeetingEnded($meeting->id, $meeting->group_id, $meeting->subject_id));

        return Redirect::back()->with('success', 'Reunión finalizada exitosamente');
    }
}