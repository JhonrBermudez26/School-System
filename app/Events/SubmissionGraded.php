<?php

namespace App\Events;

use App\Models\TaskSubmission;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class SubmissionGraded implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $submission;
    public $groupId;
    public $taskId;

    public function __construct(TaskSubmission $submission)
    {
        $this->submission = $submission->load(['student', 'task', 'members.student']);
        $this->groupId = $submission->task->group_id;
        $this->taskId = $submission->task_id;
    }

    public function broadcastOn(): Channel
    {
        return new Channel('group.' . $this->groupId);
    }

    public function broadcastAs(): string
    {
        return 'submission.graded';
    }

    public function broadcastWith(): array
    {
        $memberIds = $this->submission->members->pluck('student_id')->toArray();
        $memberIds[] = $this->submission->student_id;

        return [
            'submission_id' => $this->submission->id,
            'task_id' => $this->taskId,
            'group_id' => $this->groupId,
            'student_id' => $this->submission->student_id,
            'affected_students' => $memberIds,
            'student_name' => $this->submission->student->name ?? 'Estudiante',
            'task_title' => $this->submission->task->title ?? 'Tarea',
            'score' => $this->submission->score,
            'max_score' => $this->submission->task->max_score,
            'has_feedback' => !empty($this->submission->teacher_feedback),
            'message' => 'Tu entrega de "' . $this->submission->task->title . '" ha sido calificada',
            'timestamp' => now()->toIso8601String(),
        ];
    }
}