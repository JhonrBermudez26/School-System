<?php

namespace App\Events;

use App\Models\Task;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TaskCreated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $task;
    public $groupId;

    public function __construct(Task $task)
    {
        $this->task = $task->load('teacher', 'subject');
        $this->groupId = $task->group_id;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('group.' . $this->groupId);
    }

    public function broadcastAs(): string
    {
        return 'task.created';
    }

    public function broadcastWith(): array
    {
        return [
            'task_id' => $this->task->id,
            'title' => $this->task->title,
            'description' => $this->task->description,
            'group_id' => $this->groupId,
            'subject_id' => $this->task->subject_id,
            'due_date' => $this->task->due_date,
            'max_score' => $this->task->max_score,
            'work_type' => $this->task->work_type,
            'teacher_id' => $this->task->teacher_id,
            'teacher_name' => $this->task->teacher->name ?? 'Profesor',
            'subject_name' => $this->task->subject->name ?? 'Asignatura',
            'message' => 'Nueva tarea creada: ' . $this->task->title,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}