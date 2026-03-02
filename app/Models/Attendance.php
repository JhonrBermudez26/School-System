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
     *
     * REMOVIDOS del fillable original:
     * - 'teacher_id' → se asigna con auth()->id() en el controller, nunca desde request
     * - 'user_id'    → se obtiene del estudiante en la ruta, nunca desde request externo
     *
     * En el controller usar:
     *   Attendance::create([
     *       'user_id'    => $student->id,  // del modelo resuelto por Route Model Binding
     *       'teacher_id' => auth()->id(),   // del usuario autenticado
     *       'subject_id' => $validated['subject_id'],
     *       ...
     *   ]);
     *
     * ⚠️ Nota: user_id y teacher_id siguen en la BD pero se asignan
     *    explícitamente en el controller, no a través de $fillable.
     */
    protected $fillable = [
        'subject_id',
        'group_id',
        'date',
        'status',
        'notes',
    ];

    protected $casts = [
        'date' => 'date',
    ];

    public function student() { return $this->belongsTo(User::class, 'user_id'); }
    public function subject() { return $this->belongsTo(Subject::class); }
    public function group()   { return $this->belongsTo(Group::class); }
    public function teacher() { return $this->belongsTo(User::class, 'teacher_id'); }
}