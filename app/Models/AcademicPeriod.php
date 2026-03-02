<?php
// app/Models/AcademicPeriod.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class AcademicPeriod extends Model
{
    use HasFactory;

    /**
     * ✅ Solo campos que un administrador puede definir al crear/editar el período.
     *
     * REMOVIDOS del fillable original:
     * - 'grades_enabled'          → se controla con activate()/close()/reopen()
     * - 'grades_enabled_manually' → se controla solo con enableGradesManually()
     * - 'is_active'               → calculado en boot() automáticamente
     * - 'status'                  → flujo controlado: activate/close/reopen/archive
     * - 'closed_at'               → asignado en close()
     * - 'reopened_at'             → asignado en reopen()
     * - 'closed_by'               → asignado en close()
     * - 'reopened_by'             → asignado en reopen()
     */
    protected $fillable = [
        'name',
        'year',
        'period_number',
        'start_date',
        'end_date',
        'guidelines',
        'grade_weight',
        'grades_enabled',         // ← agregar
        'grades_enabled_manually', // ← agregar
        'status',                  // ← agregar
        'closed_at',               // ← agregar
        'closed_by',               // ← agregar
        'reopened_at',             // ← agregar
        'reopened_by',             // ← agregar
    ];

    protected $casts = [
        'start_date'             => 'date',
        'end_date'               => 'date',
        'grades_enabled'         => 'boolean',
        'grades_enabled_manually'=> 'boolean',
        'is_active'              => 'boolean',
        'grade_weight'           => 'integer',
        'closed_at'              => 'datetime',
        'reopened_at'            => 'datetime',
    ];

    /* =====================================================
     |  MÉTODOS DE ESTADO
     ===================================================== */

    public function isDentroFecha(): bool
    {
        $hoy = now();
        return $this->start_date <= $hoy && $this->end_date >= $hoy;
    }

    public function contieneFecha($fecha): bool
    {
        if (is_string($fecha)) {
            $fecha = Carbon::parse($fecha);
        }
        return $fecha->greaterThanOrEqualTo($this->start_date) &&
               $fecha->lessThanOrEqualTo($this->end_date);
    }

    public function isActivo(): bool
    {
        return $this->grades_enabled &&
            ($this->isDentroFecha() || $this->grades_enabled_manually);
    }

    public function isDraft(): bool   { return $this->status === 'draft'; }
    public function isActive(): bool  { return $this->status === 'active'; }
    public function isClosed(): bool  { return $this->status === 'closed'; }
    public function isArchived(): bool { return $this->status === 'archived'; }

    /**
     * Activar el período — solo desde draft.
     * Usar SIEMPRE este método, nunca asignar status directamente desde un request.
     */
    public function activate(?int $userId = null): bool
    {
        if (!$this->isDraft()) return false;

        $this->status         = 'active';
        $this->grades_enabled = true;
        return $this->save();
    }

    /**
     * Cerrar el período — solo desde active.
     */
    public function close(?int $userId = null): bool
    {
        if (!$this->isActive()) return false;

        $this->status         = 'closed';
        $this->grades_enabled = false;
        $this->closed_at      = now();
        $this->closed_by      = $userId;
        return $this->save();
    }

    /**
     * Reabrir el período — solo desde closed.
     */
    public function reopen(?int $userId = null): bool
    {
        if (!$this->isClosed()) return false;

        $this->status         = 'active';
        $this->grades_enabled = true;
        $this->reopened_at    = now();
        $this->reopened_by    = $userId;
        return $this->save();
    }

    /**
     * Archivar el período — solo desde closed.
     */
    public function archive(): bool
    {
        if (!$this->isClosed()) return false;

        $this->status = 'archived';
        return $this->save();
    }

    /**
     * Habilitar calificaciones manualmente — solo coordinadora/rector.
     * Usar SIEMPRE este método, nunca asignar grades_enabled_manually desde request.
     */
    public function enableGradesManually(): bool
    {
        $this->grades_enabled_manually = true;
        $this->grades_enabled          = true;
        return $this->save();
    }

    public function disableGradesManually(): bool
    {
        $this->grades_enabled_manually = false;
        $this->grades_enabled          = $this->isDentroFecha();
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
                })->orWhere('grades_enabled_manually', true);
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
                })->orWhere('grades_enabled_manually', true);
            });
    }

    public function scopeDentroFecha($query)
    {
        $hoy = now();
        return $query->where('start_date', '<=', $hoy)->where('end_date', '>=', $hoy);
    }

    public function scopeByYear($query, $year)      { return $query->where('year', $year); }
    public function scopeByStatus($query, $status)  { return $query->where('status', $status); }
    public function scopeNotArchived($query)        { return $query->where('status', '!=', 'archived'); }

    public function scopeOrdenado($query)
    {
        return $query->orderByDesc('year')->orderByDesc('period_number');
    }

    /* =====================================================
     |  ATRIBUTOS / UTILIDADES
     ===================================================== */

    public function getEstadoAttribute(): string
    {
        if ($this->isDentroFecha()) return 'Activo';
        if ($this->end_date < now()) return 'Finalizado';
        return 'Próximo';
    }

    public function getDuracionDias(): int
    {
        if (!$this->start_date || !$this->end_date) return 0;
        return $this->start_date->diffInDays($this->end_date) + 1;
    }

    public function getDiasRestantes(): int
    {
        if (!$this->end_date || now()->gt($this->end_date)) return 0;
        return now()->diffInDays($this->end_date);
    }

    public function getProgreso(): float
    {
        $hoy = now();
        if ($hoy < $this->start_date) return 0;
        if ($hoy > $this->end_date)   return 100;
        $totalDias = $this->start_date->diffInDays($this->end_date);
        if ($totalDias === 0) return 100;
        return round(($this->start_date->diffInDays($hoy) / $totalDias) * 100, 2);
    }

    public static function getPorcentajeDisponible(?int $exceptoId = null): int
    {
        $query = static::query();
        if ($exceptoId) $query->where('id', '!=', $exceptoId);
        return max(0, 100 - ($query->sum('grade_weight') ?? 0));
    }

    public function validarPorcentaje(int $nuevoPorcentaje): bool
    {
        $porcentajeOtros = static::where('id', '!=', $this->id)->sum('grade_weight') ?? 0;
        return ($porcentajeOtros + $nuevoPorcentaje) <= 100;
    }

    /* =====================================================
     |  RELACIONES
     ===================================================== */

    public function tasks()        { return $this->hasMany(Task::class, 'academic_period_id'); }
    public function manualGrades() { return $this->hasMany(ManualGrade::class, 'academic_period_id'); }
    public function closedByUser() { return $this->belongsTo(User::class, 'closed_by'); }
    public function reopenedByUser(){ return $this->belongsTo(User::class, 'reopened_by'); }

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