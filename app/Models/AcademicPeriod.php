<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AcademicPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'year',
        'period_number',
        'start_date',
        'end_date',
        'grades_enabled',
        'grades_enabled_manually',
        'is_active',
        'guidelines',
        'grade_weight',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'grades_enabled' => 'boolean',
        'grades_enabled_manually' => 'boolean',
        'is_active' => 'boolean',
    ];

    /**
     * Verifica si el periodo está dentro de las fechas actuales
     */
    public function isDentroFecha(): bool
    {
        $hoy = now();
        return $this->start_date <= $hoy && $this->end_date >= $hoy;
    }

    /**
     * Obtiene el periodo académico actual
     */
    public static function getPeriodoActual()
    {
        $hoy = now();
        return static::where('start_date', '<=', $hoy)
            ->where('end_date', '>=', $hoy)
            ->first();
    }
}