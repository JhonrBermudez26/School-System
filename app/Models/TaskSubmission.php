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

    // ========== RELACIONES EXISTENTES ==========
    
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

    // ========== NUEVAS RELACIONES PARA PAREJAS/GRUPOS ==========

    /**
     * Miembros adicionales del grupo de trabajo (para parejas/grupos)
     * Esta es una alternativa más simple a usar task_group_submissions
     */
    public function members()
    {
        return $this->hasMany(TaskSubmissionMember::class, 'submission_id');
    }

    /**
     * Obtener todos los miembros con información del estudiante
     */
    public function allMembers()
    {
        return $this->members()->with('student');
    }

    /**
     * Obtener miembros aceptados
     */
    public function acceptedMembers()
    {
        return $this->members()->where('status', 'accepted')->with('student');
    }

    // ========== MÉTODOS HELPER ==========

    /**
     * Verificar si un estudiante es miembro de esta entrega
     */
    public function hasMember($studentId)
    {
        return $this->members()->where('student_id', $studentId)->exists();
    }

    /**
     * Verificar si un estudiante es el creador de esta entrega
     */
    public function isCreator($studentId)
    {
        return $this->student_id == $studentId;
    }

    /**
     * Verificar si un estudiante puede editar esta entrega
     * Solo el creador puede editar si no está calificada
     */
    public function canEdit($studentId)
    {
        return $this->student_id == $studentId && $this->status !== 'graded';
    }

    /**
     * Verificar si un estudiante puede ver esta entrega
     * El creador y los miembros pueden ver
     */
    public function canView($studentId)
    {
        return $this->student_id == $studentId || $this->hasMember($studentId);
    }

    /**
     * Obtener el total de miembros (incluyendo el creador)
     */
    public function getTotalMembers()
    {
        return $this->members()->where('status', 'accepted')->count() + 1; // +1 por el creador
    }

    /**
     * Verificar si se puede agregar más miembros
     */
    public function canAddMoreMembers()
    {
        $task = $this->task;
        
        if ($task->work_type === 'individual') {
            return false;
        }
        
        $maxMembers = $task->work_type === 'pairs' ? 2 : $task->max_group_members;
        return $this->getTotalMembers() < $maxMembers;
    }
}