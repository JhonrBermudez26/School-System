<?php
// app/Models/Subject.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subject extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'description',
        'hours_per_week',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'hours_per_week' => 'integer',
    ];

    /**
     * Grupos que tienen esta asignatura
     */
    public function groups()
    {
        return $this->belongsToMany(Group::class, 'subject_group')
            ->withPivot('user_id')
            ->withTimestamps();
    }

    /**
     * Profesores que imparten esta asignatura
     */
    public function teachers()
    {
        return $this->belongsToMany(User::class, 'subject_group')
            ->withPivot('group_id')
            ->withTimestamps();
    }

    /**
     * Obtener profesores únicos que imparten esta asignatura
     */
    public function uniqueTeachers()
    {
        return $this->teachers()->distinct();
    }
}