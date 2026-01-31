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
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'grades_enabled' => 'boolean',
        'grades_enabled_manually' => 'boolean',
        'is_active' => 'boolean',
        'grade_weight' => 'integer',
    ];

    /**
     * Verifica si el periodo está dentro de las fechas actuales
     */
    public function isDentroFecha(): bool
    {
        $hoy = now();
        return $this->start_date <= $hoy && $this->end_date >= $hoy;
    }

    /**
     * Verifica si el periodo está activo (habilitado y dentro de fechas o habilitado manualmente)
     */
    public function isActivo(): bool
    {
        return $this->grades_enabled && ($this->isDentroFecha() || $this->grades_enabled_manually);
    }

    /**
     * Obtiene el periodo académico actual (dentro de fechas)
     */
    public static function getPeriodoActual()
    {
        $hoy = now();
        return static::where('start_date', '<=', $hoy)
            ->where('end_date', '>=', $hoy)
            ->first();
    }

    /**
     * Obtiene el periodo académico activo (habilitado para operaciones)
     * Incluye períodos dentro de fecha o habilitados manualmente
     */
    public static function getPeriodoActivo()
    {
        return static::where('grades_enabled', true)
            ->where(function ($q) {
                $q->where(function ($query) {
                    // Dentro de las fechas
                    $query->where('start_date', '<=', now())
                          ->where('end_date', '>=', now());
                })
                ->orWhere('grades_enabled_manually', true); // O habilitado manualmente
            })
            ->first();
    }

    /**
     * Scope para filtrar períodos activos
     */
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

    /**
     * Scope para filtrar períodos dentro de fecha
     */
    public function scopeDentroFecha($query)
    {
        $hoy = now();
        return $query->where('start_date', '<=', $hoy)
                    ->where('end_date', '>=', $hoy);
    }

    /**
     * Scope para filtrar por año
     */
    public function scopeByYear($query, $year)
    {
        return $query->where('year', $year);
    }

    /**
     * Scope para ordenar por año y período
     */
    public function scopeOrdenado($query)
    {
        return $query->orderByDesc('year')
                    ->orderByDesc('period_number');
    }

    /**
     * Obtiene el estado legible del período
     */
    public function getEstadoAttribute(): string
    {
        if ($this->isDentroFecha()) {
            return 'Activo';
        } elseif ($this->end_date < now()) {
            return 'Finalizado';
        } else {
            return 'Próximo';
        }
    }

    /**
     * Obtiene los días restantes del período
     */
    public function getDiasRestantes(): int
    {
        if ($this->end_date < now()) {
            return 0;
        }
        
        $hoy = Carbon::now();
        return $hoy->diffInDays($this->end_date, false);
    }

    /**
     * Verifica si una fecha está dentro del rango del período
     */
    public function contienefecha(Carbon $fecha): bool
    {
        return $fecha->between($this->start_date, $this->end_date);
    }

    /**
     * Obtiene el progreso del período (0-100%)
     */
    public function getProgreso(): float
    {
        $hoy = Carbon::now();
        
        if ($hoy < $this->start_date) {
            return 0;
        }
        
        if ($hoy > $this->end_date) {
            return 100;
        }
        
        $totalDias = $this->start_date->diffInDays($this->end_date);
        $diasTranscurridos = $this->start_date->diffInDays($hoy);
        
        if ($totalDias === 0) {
            return 100;
        }
        
        return round(($diasTranscurridos / $totalDias) * 100, 2);
    }

    /**
     * Obtiene la duración en días del período
     */
    public function getDuracionDias(): int
    {
        return $this->start_date->diffInDays($this->end_date) + 1;
    }

    /**
     * Verifica si el período permite carga de notas
     */
    public function permiteCargarNotas(): bool
    {
        return $this->grades_enabled;
    }

    /**
     * Formatea el rango de fechas
     */
    public function getRangoFechasFormateado(): string
    {
        return $this->start_date->locale('es')->isoFormat('D MMM YYYY') . 
               ' - ' . 
               $this->end_date->locale('es')->isoFormat('D MMM YYYY');
    }

    /**
     * Relación con asistencias del período
     */
    public function attendances()
    {
        return $this->hasMany(Attendance::class, 'academic_period_id');
    }

    /**
     * Relación con calificaciones del período (si tienes modelo de notas)
     */
    public function grades()
    {
        return $this->hasMany(Grade::class, 'academic_period_id');
    }

    /**
     * Deshabilita todos los demás períodos al habilitar uno manualmente
     */
    public function habilitarManualmente(): void
    {
        // Deshabilitar otros períodos habilitados manualmente
        static::where('id', '!=', $this->id)
            ->where('grades_enabled_manually', true)
            ->update([
                'grades_enabled' => false,
                'grades_enabled_manually' => false,
            ]);

        // Habilitar este período
        $this->update([
            'grades_enabled' => true,
            'grades_enabled_manually' => true,
        ]);
    }

    /**
     * Calcula el porcentaje disponible restante
     */
    public static function getPorcentajeDisponible(?int $exceptoId = null): int
    {
        $query = static::query();
        
        if ($exceptoId) {
            $query->where('id', '!=', $exceptoId);
        }
        
        $usado = $query->sum('grade_weight') ?? 0;
        
        return max(0, 100 - $usado);
    }

    /**
     * Valida que el porcentaje no exceda el 100%
     */
    public function validarPorcentaje(int $nuevoPorcentaje): bool
    {
        $porcentajeOtros = static::where('id', '!=', $this->id)
            ->sum('grade_weight') ?? 0;
        
        return ($porcentajeOtros + $nuevoPorcentaje) <= 100;
    }

    /**
     * Boot method para eventos del modelo
     */
    protected static function boot()
    {
        parent::boot();

        // Al crear/actualizar, verificar is_active automáticamente
        static::saving(function ($period) {
            $period->is_active = $period->isDentroFecha();
        });

        // Al eliminar, liberar el porcentaje
        static::deleting(function ($period) {
            // Aquí puedes agregar lógica adicional si es necesario
        });
    }
}