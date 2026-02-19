<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Group extends Model
{
    use HasFactory;

    protected $fillable = ['grade_id', 'course_id', 'nombre'];

    /**
     * ✅ ACCESSOR: Permite acceder a 'nombre' como 'name'
     */
    protected $appends = ['name'];

    public function getNameAttribute()
    {
        return $this->nombre;
    }

    public function grade()
    {
        return $this->belongsTo(Grade::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    /**
     * Relación many-to-many con usuarios
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'group_user')
            ->withTimestamps();
    }

    /**
     * Obtener solo los estudiantes del grupo
     */
    public function students()
    {
        return $this->belongsToMany(User::class, 'group_user')
            ->role('estudiante')
            ->withTimestamps();
    }

    /**
     * Contar estudiantes del grupo
     */
    public function studentsCount()
    {
        return $this->students()->count();
    }

    /**
     * Obtener estudiantes activos
     */
    public function activeStudents()
    {
        return $this->students()->where('is_active', true);
    }

    /**
     * Asignaturas del grupo
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_group')
            ->withPivot('user_id')
            ->withTimestamps();
    }
}