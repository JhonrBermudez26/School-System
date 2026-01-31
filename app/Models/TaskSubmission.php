<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'student_id',
        'group_submission_id',
        'comment',
        'status',
        'is_late',
        'score',
        'teacher_feedback',
        'submitted_at',
        'graded_at',
    ];

    protected $casts = [
        'is_late' => 'boolean',
        'submitted_at' => 'datetime',
        'graded_at' => 'datetime',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function files()
    {
        return $this->hasMany(SubmissionFile::class, 'submission_id');
    }

    public function groupSubmission()
    {
        return $this->belongsTo(TaskGroupSubmission::class);
    }
}
