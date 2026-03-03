<?php
// app/Models/Attendance.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Attendance extends Model
{
    use HasFactory;

    /**
     * ✅ Solo campos que representan datos de asistencia real.
     */
    protected $fillable = [
        'subject_id',
        'group_id',
        'date',
        'status',
        'notes',
        'academic_period_id',
        'teacher_id',
        'subject_id',
        'group_id',
        'user_id',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function student() { return $this->belongsTo(User::class, 'user_id'); }
    public function subject() { return $this->belongsTo(Subject::class); }
    public function group()   { return $this->belongsTo(Group::class); }
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
}