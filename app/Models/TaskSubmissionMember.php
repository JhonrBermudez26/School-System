<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TaskSubmissionMember extends Model
{
    use HasFactory;

    protected $fillable = [
        'submission_id',
        'student_id',
        'is_creator',
        'status',
    ];

    protected $casts = [
        'is_creator' => 'boolean',
    ];

    /**
     * Relación con la entrega
     */
    public function submission()
    {
        return $this->belongsTo(TaskSubmission::class, 'submission_id');
    }

    /**
     * Relación con el estudiante
     */
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Scope para obtener solo miembros aceptados
     */
    public function scopeAccepted($query)
    {
        return $query->where('status', 'accepted');
    }

    /**
     * Scope para obtener solo miembros pendientes
     */
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}