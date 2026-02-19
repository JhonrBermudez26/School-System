<?php

namespace App\Events;

use App\Models\TaskSubmission;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubmissionUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $submission;
    public $groupId;
    public $taskId;

    public function __construct(TaskSubmission $submission)
    {
        $this->submission = $submission->load(['student', 'task', 'files', 'members.student']);
        $this->groupId = $submission->task->group_id;
        $this->taskId = $submission->task_id;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('group.' . $this->groupId);
    }

    public function broadcastAs(): string
    {
        return 'submission.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'submission_id' => $this->submission->id,
            'task_id' => $this->taskId,
            'group_id' => $this->groupId,
            'student_id' => $this->submission->student_id,
            'student_name' => $this->submission->student->name ?? 'Estudiante',
            'task_title' => $this->submission->task->title ?? 'Tarea',
            'status' => $this->submission->status,
            'files_count' => $this->submission->files->count(),
            'message' => $this->submission->student->name . ' ha actualizado su entrega: ' . $this->submission->task->title,
            'timestamp' => now()->toIso8601String(),
        ];
    }
}