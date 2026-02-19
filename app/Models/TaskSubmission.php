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
        'score' => 'decimal:1',
    ];

    protected $appends = ['is_creator'];

    // ========== RELACIONES ==========
    
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

    public function members()
    {
        return $this->hasMany(TaskSubmissionMember::class, 'submission_id');
    }

    public function allMembers()
    {
        return $this->members()->with('student');
    }

    public function acceptedMembers()
    {
        return $this->members()->where('status', 'accepted')->with('student');
    }

    // ========== ATRIBUTOS COMPUTADOS ==========
    
    public function getIsCreatorAttribute()
    {
        if (auth()->check()) {
            return $this->student_id === auth()->id();
        }
        
        return true;
    }

    // ========== MÉTODOS HELPER ==========
    
    public function hasMember($studentId)
    {
        return $this->members()->where('student_id', $studentId)->exists();
    }

    public function isCreator($studentId)
    {
        return $this->student_id == $studentId;
    }

    public function canEdit($studentId)
    {
        return $this->student_id == $studentId && $this->status !== 'graded';
    }

    public function canView($studentId)
    {
        return $this->student_id == $studentId || $this->hasMember($studentId);
    }

    public function getTotalMembers()
    {
        return $this->members()->where('status', 'accepted')->count() + 1;
    }

    public function canAddMoreMembers()
    {
        $task = $this->task;
        
        if ($task->work_type === 'individual') {
            return false;
        }
        
        $maxMembers = $task->work_type === 'pairs' ? 2 : $task->max_group_members;
        return $this->getTotalMembers() < $maxMembers;
    }

    // ========== SCOPES ==========
    
    public function scopeForCurrentStudent($query)
    {
        return $query->where('student_id', auth()->id());
    }

    public function scopeSubmitted($query)
    {
        return $query->where('status', '!=', 'pending');
    }

    public function scopeGraded($query)
    {
        return $query->where('status', 'graded');
    }

    public function scopeLate($query)
    {
        return $query->where('is_late', true);
    }
}