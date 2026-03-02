<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DisciplineRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'type',
        'description',
        'date',
        'severity',
        'sanction',
    ];

    protected $casts = [
        'date'      => 'date',
        'closed_at' => 'datetime',
    ];

    protected $appends = ['type_label', 'severity_label'];

    /**
     * ✅ UUID: datos disciplinarios son sensibles, nunca exponer ID numérico.
     */
    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    /* =====================================================
     |  ACCESSORS
     ===================================================== */

    public function getTypeLabelAttribute(): string
    {
        return match ($this->type) {
            'observation'        => 'Observación',
            'minor_fault'        => 'Falta Leve',
            'serious_fault'      => 'Falta Grave',
            'very_serious_fault' => 'Falta Muy Grave',
            default              => 'Sin especificar',
        };
    }

    public function getSeverityLabelAttribute(): string
    {
        return match ($this->severity) {
            'low'      => 'Baja',
            'medium'   => 'Media',
            'high'     => 'Alta',
            'critical' => 'Crítica',
            default    => 'Sin especificar',
        };
    }

    /* =====================================================
     |  MÉTODOS CONTROLADOS
     ===================================================== */

    public function close(): bool
    {
        $this->status    = 'closed';
        $this->closed_at = now();
        return $this->save();
    }

    public function reopen(): bool
    {
        $this->status    = 'open';
        $this->closed_at = null;
        return $this->save();
    }

    public function isOpen(): bool   { return $this->status === 'open'; }
    public function isClosed(): bool { return $this->status === 'closed'; }

    /* =====================================================
     |  SCOPES
     ===================================================== */

    public function scopeOpen($query)                       { return $query->where('status', 'open'); }
    public function scopeClosed($query)                     { return $query->where('status', 'closed'); }
    public function scopeForStudent($query, int $studentId) { return $query->where('student_id', $studentId); }
    public function scopeOfType($query, string $type)       { return $query->where('type', $type); }
    public function scopeRecent($query)                     { return $query->orderByDesc('date')->orderByDesc('created_at'); }

    /* =====================================================
     |  RELACIONES
     ===================================================== */

    public function student(): BelongsTo { return $this->belongsTo(User::class, 'student_id'); }
    public function creator(): BelongsTo { return $this->belongsTo(User::class, 'created_by'); }
}