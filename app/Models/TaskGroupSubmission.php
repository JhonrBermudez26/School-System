<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskGroupSubmission extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'group_name',
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }

    public function members()
    {
        return $this->belongsToMany(User::class, 'group_submission_members', 'group_submission_id', 'student_id')
                    ->withTimestamps();
    }

    public function submissions()
    {
        return $this->hasMany(TaskSubmission::class, 'group_submission_id');
    }
}