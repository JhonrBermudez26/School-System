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
        'must_change_password',
        'suspended_at',
        'suspended_reason',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at'  => 'datetime',
            'password'           => 'hashed',
            'birth_date'         => 'date',
            'is_active'          => 'boolean',
            'suspended_at'       => 'datetime',
            'last_login_at'      => 'datetime',
            'must_change_password' => 'boolean',
        ];
    }

    /* =====================================================
     |  MÉTODOS DE ESTADO (usan save() controlado)
     ===================================================== */

    public function isSuspended(): bool
    {
        return !is_null($this->suspended_at);
    }

    /**
     * Suspender usuario — usar SIEMPRE este método, nunca asignar suspended_at directamente.
     */
    public function suspend(string $reason, ?int $byUserId = null): bool
    {
        $this->suspended_at     = now();
        $this->suspended_reason = $reason;
        $this->is_active        = false;
        return $this->save();
    }

    /**
     * Levantar suspensión — usar SIEMPRE este método.
     */
    public function unsuspend(): bool
    {
        $this->suspended_at     = null;
        $this->suspended_reason = null;
        $this->is_active        = true;
        return $this->save();
    }

    /**
     * Registrar último login — solo desde AuthenticatedSessionController.
     */
    public function recordLogin(): bool
    {
        $this->last_login_at = now();
        return $this->save();
    }

    /**
     * Forzar cambio de contraseña — solo desde lógica de negocio.
     */
    public function requirePasswordChange(): bool
    {
        $this->must_change_password = true;
        return $this->save();
    }

    public function clearPasswordChange(): bool
    {
        $this->must_change_password = false;
        return $this->save();
    }

    /* =====================================================
     |  ACCESSORS
     ===================================================== */

    public function getLastLoginHumanAttribute(): ?string
    {
        return $this->last_login_at
            ? $this->last_login_at->diffForHumans()
            : null;
    }

    /* =====================================================
     |  SCOPES
     ===================================================== */

    public function scopeSuspended($query)
    {
        return $query->whereNotNull('suspended_at');
    }

    public function scopeNotSuspended($query)
    {
        return $query->whereNull('suspended_at');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true)->whereNull('suspended_at');
    }

    /* =====================================================
     |  RELACIONES — ESTUDIANTES
     ===================================================== */

    public function groups()
    {
        return $this->belongsToMany(Group::class, 'group_user')->withTimestamps();
    }

    public function group()
    {
        return $this->belongsToMany(Group::class, 'group_user')->withTimestamps()->limit(1);
    }

    public function getCurrentGroup()
    {
        return $this->groups()->first();
    }

    public function isInGroup($groupId): bool
    {
        return $this->groups()->where('group_id', $groupId)->exists();
    }

    public function assignGroup($groupId): void
    {
        $this->groups()->detach();
        $this->groups()->attach($groupId);
    }

    /* =====================================================
     |  RELACIONES — PROFESORES
     ===================================================== */

    public function subjects()
    {
        return $this->belongsToMany(Subject::class, 'subject_group')
            ->withPivot('group_id')
            ->withTimestamps();
    }

    public function subjectsWithGroups()
    {
        return $this->belongsToMany(Subject::class, 'subject_group')
            ->withPivot('group_id')
            ->with('groups')
            ->withTimestamps();
    }

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

    public function assignSubjectToGroups($subjectId, $groupIds): void
    {
        $data = [];
        foreach ($groupIds as $groupId) {
            $data[] = [
                'user_id'    => $this->id,
                'subject_id' => $subjectId,
                'group_id'   => $groupId,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        \DB::table('subject_group')->insert($data);
    }

    public function syncSubjectAssignments($asignaciones): int
    {
        \DB::table('subject_group')->where('user_id', $this->id)->delete();

        $data = [];
        foreach ($asignaciones as $asignacion) {
            foreach ($asignacion['group_ids'] as $groupId) {
                $data[] = [
                    'user_id'    => $this->id,
                    'subject_id' => $asignacion['subject_id'],
                    'group_id'   => $groupId,
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

    /* =====================================================
     |  RELACIONES — CHAT / ACTIVIDAD
     ===================================================== */

    public function conversations()
    {
        return $this->belongsToMany(Conversation::class, 'participants')->withTimestamps();
    }

    public function messages()
    {
        return $this->hasMany(Message::class);
    }

    public function activityLogs()
    {
        return $this->hasMany(ActivityLog::class);
    }
}