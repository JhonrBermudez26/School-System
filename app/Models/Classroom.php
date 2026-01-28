<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Classroom extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'grade_id', 'teacher_id'];

    public function grade() {
        return $this->belongsTo(Grade::class);
    }

    public function teacher() {
        return $this->belongsTo(Teacher::class);
    }

    public function students() {
        return $this->hasMany(Student::class);
    }
}
