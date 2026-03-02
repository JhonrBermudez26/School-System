<?php
// app/Models/ManualGradeScore.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManualGradeScore extends Model
{
    use HasFactory;

    /**
     * ✅ Solo campos necesarios para crear la relación alumno-evaluación.
     *
     * REMOVIDOS del fillable original:
     * - 'score'      → CRÍTICO: se asigna con grade() desde el controller del profesor, nunca desde request
     * - 'feedback'   → ídem
     * - 'graded_at'  → se asigna automáticamente en grade()
     */
    protected $fillable = [
        'manual_grade_id',
        'student_id',
    ];

    protected $casts = [
        'score'     => 'decimal:2',
        'graded_at' => 'datetime',
    ];

    /* =====================================================
     |  MÉTODO CONTROLADO
     ===================================================== */

    /**
     * Asignar calificación — SOLO el profesor puede llamar este método.
     * Verificar autorización antes de llamarlo.
     */
    public function grade(?float $score, ?string $feedback = null): void
{
    $this->score     = $score;
    $this->feedback  = $feedback;
    $this->graded_at = $score !== null ? now() : null;
    $this->save();
}

    public function manualGrade() { return $this->belongsTo(ManualGrade::class, 'manual_grade_id'); }
    public function student()     { return $this->belongsTo(User::class, 'student_id'); }
}