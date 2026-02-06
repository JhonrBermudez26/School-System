<?php
namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class MeetingEnded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $meetingId;
    public $groupId;
    public $subjectId;

    public function __construct($meetingId, $groupId, $subjectId)
    {
        $this->meetingId = $meetingId;
        $this->groupId = $groupId;
        $this->subjectId = $subjectId;
    }

    /**
     * Canal público para que todos los estudiantes del grupo puedan escuchar
     */
    public function broadcastOn(): array
    {
        return [
            new Channel("group.{$this->groupId}"),
        ];
    }

    public function broadcastAs(): string
    {
        return 'meeting.ended';
    }

    public function broadcastWith(): array
    {
        return [
            'meeting_id' => $this->meetingId,
            'group_id' => $this->groupId,
            'subject_id' => $this->subjectId,
        ];
    }
}