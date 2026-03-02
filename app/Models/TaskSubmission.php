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
        'comment',
    ];

    protected $casts = [
        'is_late'      => 'boolean',
        'submitted_at' => 'datetime',
        'graded_at'    => 'datetime',
        'score'        => 'decimal:1',
    ];

    protected $appends = ['is_creator'];

    /**
     * ✅ UUID: usar uuid en rutas públicas para prevenir IDOR.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /* =====================================================
     |  MÉTODOS CONTROLADOS
     ===================================================== */

    public function submit(bool $isLate = false, ?string $comment = null): void
    {
        $this->status       = 'submitted';
        $this->submitted_at = now();
        $this->is_late      = $isLate;
        $this->comment      = $comment;
        $this->save();
    }

    public function grade(float $score, ?string $feedback = null): bool
    {
        $this->score            = $score;
        $this->teacher_feedback = $feedback;
        $this->status           = 'graded';
        $this->graded_at        = now();
        return $this->save();
    }

    public function resetToPending(): void
    {
        $this->status       = 'pending';
        $this->comment      = null;
        $this->submitted_at = null;
        $this->is_late      = false;
        $this->save();
    }

    /* =====================================================
     |  ACCESSORS
     ===================================================== */

    public function getIsCreatorAttribute(): bool
    {
        return auth()->check() && $this->student_id === auth()->id();
    }

    /* =====================================================
     |  MÉTODOS HELPER
     ===================================================== */

    public function hasMember($studentId): bool
    {
        return $this->members()->where('student_id', $studentId)->exists();
    }

    public function isCreator($studentId): bool
    {
        return $this->student_id == $studentId;
    }

    public function canEdit($studentId): bool
    {
        return $this->student_id == $studentId && $this->status !== 'graded';
    }

    public function canView($studentId): bool
    {
        return $this->student_id == $studentId || $this->hasMember($studentId);
    }

    public function getTotalMembers(): int
    {
        return $this->members()->where('status', 'accepted')->count() + 1;
    }

    public function canAddMoreMembers(): bool
    {
        $task = $this->task;
        if ($task->work_type === 'individual') return false;
        $maxMembers = $task->work_type === 'pairs' ? 2 : $task->max_group_members;
        return $this->getTotalMembers() < $maxMembers;
    }

    /* =====================================================
     |  SCOPES
     ===================================================== */

    public function scopeForCurrentStudent($query) { return $query->where('student_id', auth()->id()); }
    public function scopeSubmitted($query)         { return $query->where('status', '!=', 'pending'); }
    public function scopeGraded($query)            { return $query->where('status', 'graded'); }
    public function scopeLate($query)              { return $query->where('is_late', true); }

    /* =====================================================
     |  RELACIONES
     ===================================================== */

    public function task()            { return $this->belongsTo(Task::class); }
    public function student()         { return $this->belongsTo(User::class, 'student_id'); }
    public function files()           { return $this->hasMany(SubmissionFile::class, 'submission_id'); }
    public function groupSubmission() { return $this->belongsTo(TaskGroupSubmission::class); }
    public function members()         { return $this->hasMany(TaskSubmissionMember::class, 'submission_id'); }
    public function allMembers()      { return $this->members()->with('student'); }

    public function acceptedMembers()
    {
        return $this->members()->where('status', 'accepted')->with('student');
    }
}