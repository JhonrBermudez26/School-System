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
        'is_active',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'grades_enabled' => 'boolean',
        'is_active' => 'boolean',
    ];
}
