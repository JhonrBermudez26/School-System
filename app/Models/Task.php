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
        'due_date'              => 'datetime:Y-m-d H:i:s',
        'close_date'            => 'datetime:Y-m-d H:i:s',
        'allow_late_submission' => 'boolean',
        'is_active'             => 'boolean',
    ];

    // ========== RELACIONES ==========

    public function subject()
    {
        return $this->belongsTo(\App\Models\Subject::class, 'subject_id');
    }

    public function group()
    {
        return $this->belongsTo(\App\Models\Group::class, 'group_id');
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function attachments()
    {
        return $this->hasMany(TaskAttachment::class);
    }

    public function submissions()
    {
        return $this->hasMany(TaskSubmission::class);
    }

    public function groupSubmissions()
    {
        return $this->hasMany(TaskGroupSubmission::class);
    }

    // ========== MÉTODOS DE ESTADO ==========

    public function isPastDue()
    {
        return Carbon::now('America/Bogota')->isAfter($this->due_date);
    }

    public function isClosed()
    {
        return $this->close_date && Carbon::now('America/Bogota')->isAfter($this->close_date);
    }

    // ========== MÉTODOS DE CONTEO ==========

    /**
     * ✅ AGREGAR ESTE MÉTODO
     * Obtener el total de estudiantes en el grupo de esta tarea
     */
    public function getTotalStudentsCount()
    {
        return DB::table('group_user as gu')
            ->join('model_has_roles as mhr', function ($join) {
                $join->on('gu.user_id', '=', 'mhr.model_id')
                    ->where('mhr.model_type', '=', 'App\\Models\\User');
            })
            ->join('roles as r', 'mhr.role_id', '=', 'r.id')
            ->where('gu.group_id', $this->group_id)
            ->where('r.name', 'estudiante')
            ->distinct()
            ->count('gu.user_id');
    }

    /**
     * Obtener estadísticas de entregas
     */
    public function getSubmissionStats()
    {
        $total = $this->getTotalStudentsCount();
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

    // ========== SCOPES ==========

    public function scopeByTeacher($query, $teacherId)
    {
        return $query->where('teacher_id', $teacherId);
    }

    public function scopeByClass($query, $subjectId, $groupId)
    {
        return $query->where('subject_id', $subjectId)
                     ->where('group_id', $groupId);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeNotClosed($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('close_date')
              ->orWhere('close_date', '>', now());
        });
    }
}