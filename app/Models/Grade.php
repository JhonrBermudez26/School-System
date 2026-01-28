<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Grade extends Model
{
    protected $fillable = ['nombre', 'descripcion'];
    public function groups()
    {
        return $this->hasMany(Group::class);
    }

    public function students()
    {
        return $this->hasMany(Student::class);
    }

    public function classrooms()
    {
        return $this->hasMany(Classroom::class);
    }
}