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
        'created_by',
        'type',
        'description',
        'date',
        'severity',
        'sanction',
        'status',
        'closed_at',
    ];

    protected $casts = [
        'date' => 'date',
        'closed_at' => 'datetime',
    ];

    protected $appends = ['type_label', 'severity_label'];

    /**
     * Relación con el estudiante
     */
    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    /**
     * Relación con el usuario que creó el registro
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Accessor para tipo de falta traducido
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            'observation' => 'Observación',
            'minor_fault' => 'Falta Leve',
            'serious_fault' => 'Falta Grave',
            'very_serious_fault' => 'Falta Muy Grave',
            default => 'Sin especificar',
        };
    }

    /**
     * Accessor para severidad traducida
     */
    public function getSeverityLabelAttribute(): string
    {
        return match($this->severity) {
            'low' => 'Baja',
            'medium' => 'Media',
            'high' => 'Alta',
            'critical' => 'Crítica',
            default => 'Sin especificar',
        };
    }

    /**
     * Scope para registros abiertos
     */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    /**
     * Scope para registros cerrados
     */
    public function scopeClosed($query)
    {
        return $query->where('status', 'closed');
    }

    /**
     * Scope para filtrar por estudiante
     */
    public function scopeForStudent($query, int $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    /**
     * Scope para filtrar por tipo
     */
    public function scopeOfType($query, string $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope ordenado por fecha descendente
     */
    public function scopeRecent($query)
    {
        return $query->orderByDesc('date')->orderByDesc('created_at');
    }

    /**
     * Verifica si el registro está abierto
     */
    public function isOpen(): bool
    {
        return $this->status === 'open';
    }

    /**
     * Verifica si el registro está cerrado
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Cierra el registro
     */
    public function close(): bool
    {
        $this->status = 'closed';
        $this->closed_at = now();
        return $this->save();
    }

    /**
     * Reabre el registro
     */
    public function reopen(): bool
    {
        $this->status = 'open';
        $this->closed_at = null;
        return $this->save();
    }
}