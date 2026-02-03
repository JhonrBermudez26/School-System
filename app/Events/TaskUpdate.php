<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $task;
    public $groupId;

    public function __construct(Task $task)
    {
        $this->task = $task;
        $this->groupId = $task->group_id;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('group.' . $this->groupId);
    }

    public function broadcastAs(): string
    {
        return 'task.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'group_id' => $this->groupId,
            'subject_id' => $this->task->subject_id,
            'message' => 'Tarea actualizada: ' . $this->task->title,
        ];
    }
}