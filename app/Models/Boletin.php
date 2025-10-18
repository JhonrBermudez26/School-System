<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Boletin extends Model
{
    use HasFactory;

    protected $table = 'boletines';

    protected $fillable = [
        'student_id',
        'periodo_id',
        'promedio',
        'observaciones',
    ];

    // Relaciones
    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function periodo()
    {
        return $this->belongsTo(AcademicPeriod::class, 'periodo_id');
    }
}
