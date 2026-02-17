<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Boletin extends Model
{
    use HasFactory;

    protected $table = 'boletines';

    protected $fillable = [
        'student_id',
        'academic_period_id',
        'group_id',
        'promedio_general',
        'puesto_grupo',
        'total_estudiantes_grupo',
        'dias_asistidos',
        'dias_totales',
        'porcentaje_asistencia',
        'observaciones_convivencia',
        'observaciones_academicas',
        'recomendaciones',
        'director_grupo_id',
        'observaciones_director',
        'estado',
        'fecha_generacion',
        'archivo_path',
    ];

    protected $casts = [
        'promedio_general' => 'decimal:2',
        'porcentaje_asistencia' => 'decimal:2',
        'fecha_generacion' => 'datetime',
    ];

    // ==================== RELACIONES ====================
    
    public function student()
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function academicPeriod()
    {
        return $this->belongsTo(AcademicPeriod::class, 'academic_period_id');
    }

    public function group()
    {
        return $this->belongsTo(Group::class, 'group_id');
    }

    public function directorGrupo()
    {
        return $this->belongsTo(User::class, 'director_grupo_id');
    }

    // ==================== SCOPES ====================
    
    public function scopeByPeriod($query, $periodId)
    {
        return $query->where('academic_period_id', $periodId);
    }

    public function scopeByGroup($query, $groupId)
    {
        return $query->where('group_id', $groupId);
    }

    public function scopeByStudent($query, $studentId)
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeGenerados($query)
    {
        return $query->where('estado', 'generado');
    }

    public function scopePendientes($query)
    {
        return $query->where('estado', 'pendiente');
    }

    // ==================== MÉTODOS ====================
    
    public function isPendiente(): bool
    {
        return $this->estado === 'pendiente';
    }

    public function isGenerado(): bool
    {
        return $this->estado === 'generado';
    }

    public function marcarComoGenerado(string $archivoPath): bool
    {
        $this->estado = 'generado';
        $this->fecha_generacion = now();
        $this->archivo_path = $archivoPath;
        return $this->save();
    }

    /**
     * Obtener el desempeño según la escala colombiana
     */
    public function getDesempenoAttribute(): string
    {
        if (!$this->promedio_general) return 'Sin calificar';

        if ($this->promedio_general >= 4.6) return 'SUPERIOR';
        if ($this->promedio_general >= 4.0) return 'ALTO';
        if ($this->promedio_general >= 3.0) return 'BÁSICO';
        return 'BAJO';
    }

    /**
     * Obtener color según desempeño
     */
    public function getColorDesempenoAttribute(): string
    {
        $desempeno = $this->desempeno;
        
        return match($desempeno) {
            'SUPERIOR' => '#10B981',
            'ALTO' => '#3B82F6',
            'BÁSICO' => '#F59E0B',
            'BAJO' => '#EF4444',
            default => '#6B7280',
        };
    }

    /**
     * Verificar si el estudiante aprobó el periodo
     */
    public function getAproboAttribute(): bool
    {
        return $this->promedio_general >= 3.0;
    }
}