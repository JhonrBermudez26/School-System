<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use App\Models\Meeting;
use Illuminate\Support\Facades\DB;

class MeetingStarted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $meeting;
    public $teacherName;
    public $subjectName;

    public function __construct(Meeting $meeting)
    {
        $this->meeting = $meeting;
        
        // Obtener información adicional para las notificaciones
        $classInfo = DB::table('subject_group')
            ->join('subjects', 'subject_group.subject_id', '=', 'subjects.id')
            ->join('users', 'subject_group.user_id', '=', 'users.id')
            ->where('subject_group.subject_id', $meeting->subject_id)
            ->where('subject_group.group_id', $meeting->group_id)
            ->select('subjects.name as subject_name', 'users.name as teacher_name')
            ->first();
        
        $this->teacherName = $classInfo->teacher_name ?? 'Profesor';
        $this->subjectName = $classInfo->subject_name ?? 'Clase';
    }

    /**
     * Canal público para que todos los estudiantes del grupo puedan escuchar
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("group.{$this->meeting->group_id}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'meeting.started';
    }

    public function broadcastWith(): array
    {
        return [
            'meeting' => [
                'id' => $this->meeting->id,
                'room_name' => $this->meeting->room_name,
                'url' => $this->meeting->url,
                'subject_id' => $this->meeting->subject_id,
                'group_id' => $this->meeting->group_id,
                'is_active' => $this->meeting->is_active,
                'created_at' => $this->meeting->created_at->toISOString(),
            ],
            'teacher_name' => $this->teacherName,
            'subject_name' => $this->subjectName,
        ];
    }
}