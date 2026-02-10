<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManualGradeScore extends Model
{
    use HasFactory;

    protected $fillable = [
        'manual_grade_id',
        'student_id',
        'score',
        'feedback',
        'graded_at',
    ];

    protected $casts = [
        'score' => 'decimal:2',
        'graded_at' => 'datetime',
    ];

    public function manualGrade()
    {
        return $this->belongsTo(ManualGrade::class, 'manual_grade_id');
    }

    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }
}