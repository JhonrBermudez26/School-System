<?php
// app/Models/Boletin.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Boletin extends Model
{
    use HasFactory;

    protected $table = 'boletines';

    /**
     * ✅ Solo campos que el sistema necesita para crear el boletín inicial.
     *
     * REMOVIDOS del fillable original:
     * - 'promedio_general'       → CRÍTICO: calculado automáticamente, nunca desde request
     * - 'puesto_grupo'           → calculado automáticamente
     * - 'total_estudiantes_grupo'→ calculado automáticamente
     * - 'dias_asistidos'         → calculado desde asistencias
     * - 'dias_totales'           → calculado desde asistencias
     * - 'porcentaje_asistencia'  → calculado automáticamente
     * - 'estado'                 → controlado por marcarComoGenerado() / confirmar()
     * - 'archivo_path'           → asignado solo en marcarComoGenerado()
     * - 'confirmado'             → CRÍTICO: solo en confirmar()
     * - 'fecha_confirmacion'     → solo en confirmar()
     * - 'confirmado_por'         → solo en confirmar()
     * - 'fecha_generacion'       → solo en marcarComoGenerado()
     * - 'director_grupo_id'      → asignado por el sistema, no por request
     */
    protected $fillable = [
        'student_id',
        'academic_period_id',
        'group_id',
        'observaciones_convivencia',
        'observaciones_academicas',
        'recomendaciones',
        'observaciones_director',
    ];

    protected $casts = [
        'promedio_general'     => 'decimal:2',
        'porcentaje_asistencia'=> 'decimal:2',
        'fecha_generacion'     => 'datetime',
        'confirmado'           => 'boolean',
        'fecha_confirmacion'   => 'datetime',
    ];

    /* =====================================================
     |  MÉTODOS CONTROLADOS (reemplazan asignación directa)
     ===================================================== */

    /**
     * Actualizar datos calculados — solo desde el servicio de boletines.
     */
    public function actualizarCalculos(array $datos): bool
    {
        $this->promedio_general        = $datos['promedio_general'];
        $this->puesto_grupo            = $datos['puesto_grupo'] ?? null;
        $this->total_estudiantes_grupo = $datos['total_estudiantes_grupo'] ?? null;
        $this->dias_asistidos          = $datos['dias_asistidos'] ?? null;
        $this->dias_totales            = $datos['dias_totales'] ?? null;
        $this->porcentaje_asistencia   = $datos['porcentaje_asistencia'] ?? null;
        $this->director_grupo_id       = $datos['director_grupo_id'] ?? null;
        return $this->save();
    }

    public function marcarComoGenerado(string $archivoPath): bool
    {
        $this->estado          = 'generado';
        $this->fecha_generacion = now();
        $this->archivo_path    = $archivoPath;
        return $this->save();
    }

    public function confirmar(int $userId): bool
    {
        $this->confirmado        = true;
        $this->fecha_confirmacion = now();
        $this->confirmado_por    = $userId;
        return $this->save();
    }

    public function desconfirmar(): bool
    {
        $this->confirmado        = false;
        $this->fecha_confirmacion = null;
        $this->confirmado_por    = null;
        return $this->save();
    }

    public function isPendiente(): bool { return $this->estado === 'pendiente'; }
    public function isGenerado(): bool  { return $this->estado === 'generado'; }

    /* =====================================================
     |  ACCESSORS
     ===================================================== */

    public function getDesempenoAttribute(): string
    {
        if (!$this->promedio_general) return 'Sin calificar';
        if ($this->promedio_general >= 4.6) return 'SUPERIOR';
        if ($this->promedio_general >= 4.0) return 'ALTO';
        if ($this->promedio_general >= 3.0) return 'BÁSICO';
        return 'BAJO';
    }

    public function getColorDesempenoAttribute(): string
    {
        return match ($this->desempeno) {
            'SUPERIOR' => '#10B981',
            'ALTO'     => '#3B82F6',
            'BÁSICO'   => '#F59E0B',
            'BAJO'     => '#EF4444',
            default    => '#6B7280',
        };
    }

    public function getAproboAttribute(): bool
    {
        return $this->promedio_general >= 3.0;
    }

    /* =====================================================
     |  SCOPES
     ===================================================== */

    public function scopeByPeriod($query, $periodId)  { return $query->where('academic_period_id', $periodId); }
    public function scopeByGroup($query, $groupId)    { return $query->where('group_id', $groupId); }
    public function scopeByStudent($query, $studentId){ return $query->where('student_id', $studentId); }
    public function scopeGenerados($query)            { return $query->where('estado', 'generado'); }
    public function scopePendientes($query)           { return $query->where('estado', 'pendiente'); }

    /* =====================================================
     |  RELACIONES
     ===================================================== */

    public function student()        { return $this->belongsTo(User::class, 'student_id'); }
    public function academicPeriod() { return $this->belongsTo(AcademicPeriod::class, 'academic_period_id'); }
    public function group()          { return $this->belongsTo(Group::class, 'group_id'); }
    public function directorGrupo()  { return $this->belongsTo(User::class, 'director_grupo_id'); }
    public function confirmadoPor()  { return $this->belongsTo(User::class, 'confirmado_por'); }
}