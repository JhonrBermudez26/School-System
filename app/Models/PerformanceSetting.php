<?php
// app/Models/PerformanceSetting.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PerformanceSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'min_passing_grade',
        'max_failed_subjects',
        'critical_absence_rate',
    ];

    protected $casts = [
        'min_passing_grade' => 'decimal:2',
        'max_failed_subjects' => 'integer',
        'critical_absence_rate' => 'decimal:2',
    ];

    /**
     * Obtener la configuración actual
     */
    public static function current()
    {
        return self::first() ?? self::create([
            'min_passing_grade' => 3.0,
            'max_failed_subjects' => 3,
            'critical_absence_rate' => 20.0,
        ]);
    }
}