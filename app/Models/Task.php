<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
       'subject_id',
        'group_id',
        'teacher_id',
        'title',
        'description',
        'work_type',
        'max_group_members',
        'due_date',
        'close_date',
        'allow_late_submission',
        'max_score',
        'is_active',
    ];

    protected $casts = [
        'due_date'              => 'datetime:Y-m-d H:i:s',   // ← importante: con hora
        'close_date'            => 'datetime:Y-m-d H:i:s',   // ← importante: con hora
        'allow_late_submission' => 'boolean',
        'is_active'             => 'boolean',
    ];
    /**
     * Relación con la asignatura (subject)
     */
    public function subject()
    {
        return $this->belongsTo(\App\Models\Subject::class, 'subject_id');
    }

    /**
     * Relación con el grupo
     */
    public function group()
    {
        return $this->belongsTo(\App\Models\Group::class, 'group_id');
    }

    /**
     * Relación con el profesor
     */
    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    /**
     * Archivos adjuntos de la tarea
     */
    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class);
    }

    /**
     * Entregas de estudiantes
     */
    public function submissions()
    {
        return $this->hasMany(TaskSubmission::class);
    }

    /**
     * Entregas grupales
     */
    public function groupSubmissions()
    {
        return $this->hasMany(TaskGroupSubmission::class);
    }

    /**
     * Verificar si ya pasó la fecha de entrega
     */
    public function isPastDue()
    {
        // Opcional: puedes forzar la comparación en la misma zona, pero con el guardado correcto ya debería funcionar
        return Carbon::now('America/Bogota')->isAfter($this->due_date);
    }

    public function isClosed()
    {
        return $this->close_date && Carbon::now('America/Bogota')->isAfter($this->close_date);
    }

    /**
     * Obtener estadísticas de entregas
     * Ahora usa la tabla group_user correctamente
     */
    public function getSubmissionStats()
    {
        // Contar total de estudiantes en el grupo
        $total = DB::table('group_user as gu')
            ->join('model_has_roles as mhr', function ($join) {
                $join->on('gu.user_id', '=', 'mhr.model_id')
                    ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles as r', 'mhr.role_id', '=', 'r.id')
            ->where('gu.group_id', $this->group_id)
            ->where('r.name', 'estudiante')
            ->distinct()
            ->count('gu.user_id');

        $submitted = $this->submissions()->where('status', '!=', 'pending')->count();
        $graded = $this->submissions()->where('status', 'graded')->count();
        $pending = $total - $submitted;

        return [
            'total' => $total,
            'submitted' => $submitted,
            'graded' => $graded,
            'pending' => $pending,
        ];
    }

    /**
     * Scope para filtrar por profesor
     */
    public function scopeByTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    /**
     * Scope para filtrar por clase (subject + group)
     */
    public function scopeByClass($query, $subjectId, $groupId)
    {
        return $query->where('subject_id', $subjectId)
                     ->where('group_id', $groupId);
    }

    /**
     * Scope para tareas activas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para tareas no cerradas
     */
    public function scopeNotClosed($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('close_date')
              ->orWhere('close_date', '>', now());
        });
    }
}