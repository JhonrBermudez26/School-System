<?php
// app/Observers/TaskSubmissionObserver.php
namespace App\Observers;
use App\Models\TaskSubmission;
use App\Models\ActivityLog;
use Illuminate\Support\Str;

class TaskSubmissionObserver
{
    public function updated(TaskSubmission $submission): void
    {
        if ($submission->wasChanged('status') && $submission->status === 'graded') {
            ActivityLog::record(
                userId: auth()->id() ?? 0,
                action: 'graded',
                model: $submission,
                oldValues: ['status' => $submission->getOriginal('status')],
                newValues: [
                    'status'   => 'graded',
                    'score'    => $submission->score,
                    'task_id'  => $submission->task_id,
                    'student'  => $submission->student_id,
                ]
            );
        }
    }
     /**
     * Auto-generar UUID al crear una TaskSubmission.
     */
    public function creating(TaskSubmission $submission): void
    {
        if (empty($submission->uuid)) {
            $submission->uuid = (string) Str::uuid();
        }
    }
}