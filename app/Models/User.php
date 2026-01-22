<?php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'last_name',
        'email',
        'password',
        'photo',
        'document_type',
        'document_number',
        'phone',
        'address',
        'birth_date',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'birth_date' => 'date',
            'is_active' => 'boolean',
        ];
    }

    // ===== RELACIONES PARA ESTUDIANTES =====
    
    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_user')
            ->withTimestamps();
    }

    public function group()
    {
        return $this->belongsToMany(Group::class, 'group_user')
            ->withTimestamps()
            ->limit(1);
    }

    public function getCurrentGroup()
    {
        return $this->groups()->first();
    }

    public function isInGroup($groupId)
    {
        return $this->groups()->where('group_id', $groupId)->exists();
    }

    public function assignGroup($groupId)
    {
        $this->groups()->detach();
        return $this->groups()->attach($groupId);
    }

    // ===== RELACIONES PARA PROFESORES =====
    
    /**
     * Asignaturas que imparte el profesor
     * Un profesor puede tener múltiples asignaturas
     */
    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_group')
            ->withPivot('group_id')
            ->withTimestamps();
    }

    /**
     * Obtener asignaturas con sus grupos para un profesor
     * Incluye los grupos en la relación
     */
    public function subjectsWithGroups()
    {
        return $this->belongsToMany(Subject::class, 'subject_group')
            ->withPivot('group_id')
            ->with('groups')
            ->withTimestamps();
    }

    /**
     * Obtener todas las asignaciones (asignatura-grupo) del profesor
     */
    public function subjectGroupAssignments()
    {
        return \DB::table('subject_group')
            ->where('user_id', $this->id)
            ->join('subjects', 'subject_group.subject_id', '=', 'subjects.id')
            ->join('groups', 'subject_group.group_id', '=', 'groups.id')
            ->select(
                'subjects.id as subject_id',
                'subjects.name as subject_name',
                'subjects.code as subject_code',
                'groups.id as group_id',
                'groups.nombre as group_name'
            )
            ->get();
    }

    /**
     * Asignar una asignatura a múltiples grupos para este profesor
     */
    public function assignSubjectToGroups($subjectId, $groupIds)
    {
        $data = [];
        foreach ($groupIds as $groupId) {
            $data[] = [
                'user_id' => $this->id,
                'subject_id' => $subjectId,
                'group_id' => $groupId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        
        \DB::table('subject_group')->insert($data);
    }

    /**
     * Sincronizar todas las asignaciones del profesor
     * Elimina las antiguas y crea las nuevas
     */
    public function syncSubjectAssignments($asignaciones)
    {
        // Eliminar asignaciones anteriores
        \DB::table('subject_group')->where('user_id', $this->id)->delete();
        
        // Crear nuevas asignaciones
        $data = [];
        foreach ($asignaciones as $asignacion) {
            foreach ($asignacion['group_ids'] as $groupId) {
                $data[] = [
                    'user_id' => $this->id,
                    'subject_id' => $asignacion['subject_id'],
                    'group_id' => $groupId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        
        if (!empty($data)) {
            \DB::table('subject_group')->insert($data);
        }
        
        return count($data);
    }

    public function conversations()
{
    return $this->belongsToMany(Conversation::class, 'participants')
        ->withTimestamps();
}

public function messages()
{
    return $this->hasMany(Message::class);
}
}