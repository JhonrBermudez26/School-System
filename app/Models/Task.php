<?php
// app/Models/Task.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class Task extends Model
{
    use HasFactory;

    /**
     * ✅ Solo campos que el profesor ingresa al crear/editar la tarea.
     *
     * REMOVIDOS del fillable original:
     * - 'teacher_id'  → CRÍTICO: se asigna en el controller con auth()->id(), nunca desde request
     * - 'is_active'   → controlado con activate()/deactivate(), no desde request
     */
    protected $fillable = [
        'teacher_id',
        'subject_id',
        'group_id',
        'academic_period_id',
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

    /* =====================================================
     |  MÉTODOS DE ESTADO
     ===================================================== */

    /**
     * Activar tarea — solo desde lógica del controller/service.
     */
    public function activate(): bool
    {
        $this->is_active = true;
        return $this->save();
    }

    public function deactivate(): bool
    {
        $this->is_active = false;
        return $this->save();
    }

    public function isPastDue(): bool
    {
        return Carbon::now('America/Bogota')->isAfter($this->due_date);
    }

    public function isClosed(): bool
    {
        return $this->close_date && Carbon::now('America/Bogota')->isAfter($this->close_date);
    }

    /* =====================================================
     |  MÉTODOS DE CONTEO
     ===================================================== */

    public function getTotalStudentsCount(): int
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

    public function getSubmissionStats(): array
    {
        $total     = $this->getTotalStudentsCount();
        $submitted = $this->submissions()->where('status', '!=', 'pending')->count();
        $graded    = $this->submissions()->where('status', 'graded')->count();
        return [
            'total'     => $total,
            'submitted' => $submitted,
            'graded'    => $graded,
            'pending'   => $total - $submitted,
        ];
    }

    /* =====================================================
     |  SCOPES
     ===================================================== */

    public function scopeByTeacher($query, $teacherId)          { return $query->where('teacher_id', $teacherId); }
    public function scopeByClass($query, $subjectId, $groupId)  { return $query->where('subject_id', $subjectId)->where('group_id', $groupId); }
    public function scopeActive($query)                         { return $query->where('is_active', true); }
    public function scopeByPeriod($query, $periodId)            { return $query->where('academic_period_id', $periodId); }

    public function scopeNotClosed($query)
    {
        return $query->where(function ($q) {
            $q->whereNull('close_date')->orWhere('close_date', '>', now());
        });
    }

    public function scopeCurrentPeriod($query)
    {
        $currentPeriod = AcademicPeriod::getPeriodoActual();
        return $currentPeriod
            ? $query->where('academic_period_id', $currentPeriod->id)
            : $query->whereNull('academic_period_id');
    }

    /* =====================================================
     |  RELACIONES
     ===================================================== */

    public function academicPeriod()  { return $this->belongsTo(AcademicPeriod::class); }
    public function subject()         { return $this->belongsTo(Subject::class, 'subject_id'); }
    public function group()           { return $this->belongsTo(Group::class, 'group_id'); }
    public function teacher()         { return $this->belongsTo(User::class, 'teacher_id'); }
    public function attachments()     { return $this->hasMany(TaskAttachment::class); }
    public function submissions()     { return $this->hasMany(TaskSubmission::class); }
    public function groupSubmissions(){ return $this->hasMany(TaskGroupSubmission::class); }
}