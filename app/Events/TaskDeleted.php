<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskDeleted implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $taskId;
    public $groupId;
    public $title;

    public function __construct(int $taskId, int $groupId, string $title)
    {
        $this->taskId = $taskId;
        $this->groupId = $groupId;
        $this->title = $title;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('group.' . $this->groupId);
    }

    public function broadcastAs(): string
    {
        return 'task.deleted';
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->taskId,
            'group_id' => $this->groupId,
            'message' => 'Tarea eliminada: ' . $this->title,
        ];
    }
}