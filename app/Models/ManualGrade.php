<?php
// app/Models/ManualGrade.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManualGrade extends Model
{
    use HasFactory;

    /**
     * ✅ Solo campos que el profesor define al crear la evaluación.
     *
     * REMOVIDOS del fillable original:
     * - 'teacher_id' → CRÍTICO: se asigna con auth()->id() en el controller, nunca desde request
     */
    protected $fillable = [
        'subject_id',
        'group_id',
        'academic_period_id',
        'title',
        'description',
        'max_score',
        'weight',
        'grade_date',
    ];

    protected $casts = [
        'max_score'  => 'decimal:2',
        'weight'     => 'decimal:2',
        'grade_date' => 'date',
    ];

    public function academicPeriod() { return $this->belongsTo(AcademicPeriod::class); }
    public function subject()        { return $this->belongsTo(Subject::class); }
    public function group()          { return $this->belongsTo(Group::class); }
    public function teacher()        { return $this->belongsTo(User::class, 'teacher_id'); }
    public function scores()         { return $this->hasMany(ManualGradeScore::class, 'manual_grade_id'); }

    public function scopeByClass($query, $subjectId, $groupId)
    {
        return $query->where('subject_id', $subjectId)->where('group_id', $groupId);
    }

    public function scopeByPeriod($query, $periodId) { return $query->where('academic_period_id', $periodId); }

    public function scopeCurrentPeriod($query)
    {
        $currentPeriod = AcademicPeriod::getPeriodoActual();
        return $currentPeriod
            ? $query->where('academic_period_id', $currentPeriod->id)
            : $query->whereNull('academic_period_id');
    }
}