<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AcademicPeriod extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'year',
        'period_number',
        'start_date',
        'end_date',
        'grades_enabled',
        'grades_enabled_manually',
        'is_active',
        'guidelines',
        'grade_weight',
        'status',
        'closed_at',
        'reopened_at',
        'closed_by',
        'reopened_by',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'grades_enabled' => 'boolean',
        'grades_enabled_manually' => 'boolean',
        'is_active' => 'boolean',
        'grade_weight' => 'integer',
        'closed_at' => 'datetime',
        'reopened_at' => 'datetime',
    ];

    /* =====================================================
     |  MÉTODOS DE ESTADO
     ===================================================== */

    public function isDentroFecha(): bool
    {
        $hoy = now();
        return $this->start_date <= $hoy && $this->end_date >= $hoy;
    }

    public function isActivo(): bool
    {
        return $this->grades_enabled &&
            ($this->isDentroFecha() || $this->grades_enabled_manually);
    }

    /**
     * Verifica si el periodo está en estado draft
     */
    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    /**
     * Verifica si el periodo está activo
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Verifica si el periodo está cerrado
     */
    public function isClosed(): bool
    {
        return $this->status === 'closed';
    }

    /**
     * Verifica si el periodo está archivado
     */
    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    /**
     * Activa el periodo (solo desde draft)
     */
    public function activate(?int $userId = null): bool
    {
        if (!$this->isDraft()) {
            return false;
        }

        $this->status = 'active';
        $this->grades_enabled = true;
        return $this->save();
    }

    /**
     * Cierra el periodo (solo desde active)
     */
    public function close(?int $userId = null): bool
    {
        if (!$this->isActive()) {
            return false;
        }

        $this->status = 'closed';
        $this->grades_enabled = false;
        $this->closed_at = now();
        $this->closed_by = $userId;
        return $this->save();
    }

    /**
     * Reabre el periodo cerrado (solo desde closed)
     */
    public function reopen(?int $userId = null): bool
    {
        if (!$this->isClosed()) {
            return false;
        }

        $this->status = 'active';
        $this->grades_enabled = true;
        $this->reopened_at = now();
        $this->reopened_by = $userId;
        return $this->save();
    }

    /**
     * Archiva el periodo (solo desde closed)
     */
    public function archive(): bool
    {
        if (!$this->isClosed()) {
            return false;
        }

        $this->status = 'archived';
        return $this->save();
    }

    /* =====================================================
     |  MÉTODOS ESTÁTICOS
     ===================================================== */

    public static function getPeriodoActual()
    {
        $hoy = now();

        return static::where('start_date', '<=', $hoy)
            ->where('end_date', '>=', $hoy)
            ->first();
    }

    public static function getPeriodoActivo()
    {
        return static::where('grades_enabled', true)
            ->where(function ($q) {
                $q->where(function ($query) {
                    $query->where('start_date', '<=', now())
                          ->where('end_date', '>=', now());
                })
                ->orWhere('grades_enabled_manually', true);
            })
            ->first();
    }

    /* =====================================================
     |  SCOPES
     ===================================================== */

    public function scopeActive($query)
    {
        return $query->where('grades_enabled', true)
            ->where(function ($q) {
                $q->where(function ($query) {
                    $query->where('start_date', '<=', now())
                          ->where('end_date', '>=', now());
                })
                ->orWhere('grades_enabled_manually', true);
            });
    }

    public function scopeDentroFecha($query)
    {
        $hoy = now();

        return $query->where('start_date', '<=', $hoy)
                     ->where('end_date', '>=', $hoy);
    }

    public function scopeByYear($query, $year)
    {
        return $query->where('year', $year);
    }

    public function scopeOrdenado($query)
    {
        return $query->orderByDesc('year')
                     ->orderByDesc('period_number');
    }

    /**
     * Scope para filtrar por estado
     */
    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope para periodos no archivados
     */
    public function scopeNotArchived($query)
    {
        return $query->where('status', '!=', 'archived');
    }

    /* =====================================================
     |  ATRIBUTOS COMPUTADOS
     ===================================================== */

    public function getEstadoAttribute(): string
    {
        if ($this->isDentroFecha()) {
            return 'Activo';
        }

        if ($this->end_date < now()) {
            return 'Finalizado';
        }

        return 'Próximo';
    }

    /* =====================================================
     |  UTILIDADES (🔥 AQUÍ ESTABA EL BUG)
     ===================================================== */

    /**
     * ✅ Duración total del período en días (incluye inicio y fin)
     */
    public function getDuracionDias(): int
    {
        if (!$this->start_date || !$this->end_date) {
            return 0;
        }

        return $this->start_date->diffInDays($this->end_date) + 1;
    }

    /**
     * ✅ Días restantes del período
     */
    public function getDiasRestantes(): int
    {
        if (!$this->end_date || now()->gt($this->end_date)) {
            return 0;
        }

        return now()->diffInDays($this->end_date);
    }

    /**
     * ✅ Progreso del período en porcentaje
     */
    public function getProgreso(): float
    {
        $hoy = now();

        if ($hoy < $this->start_date) return 0;
        if ($hoy > $this->end_date) return 100;

        $totalDias = $this->start_date->diffInDays($this->end_date);
        if ($totalDias === 0) return 100;

        $diasTranscurridos = $this->start_date->diffInDays($hoy);

        return round(($diasTranscurridos / $totalDias) * 100, 2);
    }

    public static function getPorcentajeDisponible(?int $exceptoId = null): int
    {
        $query = static::query();

        if ($exceptoId) {
            $query->where('id', '!=', $exceptoId);
        }

        $usado = $query->sum('grade_weight') ?? 0;

        return max(0, 100 - $usado);
    }

    public function validarPorcentaje(int $nuevoPorcentaje): bool
    {
        $porcentajeOtros = static::where('id', '!=', $this->id)
            ->sum('grade_weight') ?? 0;

        return ($porcentajeOtros + $nuevoPorcentaje) <= 100;
    }

    /* =====================================================
     |  RELACIONES
     ===================================================== */

    public function tasks()
    {
        return $this->hasMany(Task::class, 'academic_period_id');
    }

    public function manualGrades()
    {
        return $this->hasMany(ManualGrade::class, 'academic_period_id');
    }

    /**
     * Usuario que cerró el periodo
     */
    public function closedByUser()
    {
        return $this->belongsTo(User::class, 'closed_by');
    }

    /**
     * Usuario que reabrió el periodo
     */
    public function reopenedByUser()
    {
        return $this->belongsTo(User::class, 'reopened_by');
    }

    /* =====================================================
     |  BOOT
     ===================================================== */

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($period) {
            $period->is_active = $period->isDentroFecha();
        });
    }
}

