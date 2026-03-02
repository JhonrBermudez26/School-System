<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory;

    /**
     * ✅ ActivityLog NO debe ser fillable desde requests externos.
     * Se usa guarded vacío pero SOLO se debe crear desde el servicio AuditService.
     *
     * NUNCA hacer: ActivityLog::create($request->all())
     * SIEMPRE hacer: AuditService::log('action', $model)
     *
     * Se mantiene $fillable vacío para forzar asignación explícita.
     */
    protected $fillable = [];

    /**
     * Campos que el AuditService puede asignar directamente.
     * Se usa este método para crear logs desde el servicio.
     */
    public static function record(
        int $userId,
        string $action,
        ?Model $model,
        array $oldValues = [],
        array $newValues = []
    ): self {
        $instance = new self();
        $instance->user_id    = $userId;
        $instance->action     = $action;
        $instance->model_type = $model ? get_class($model) : 'Unknown';  // ← proteger
    $instance->model_id   = $model?->getKey(); 
        $instance->old_values = $oldValues;
        $instance->new_values = $newValues;
        $instance->ip_address = request()->ip();
        $instance->user_agent = request()->userAgent();
        $instance->save();
        return $instance;
    }

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    public function user(): BelongsTo { return $this->belongsTo(User::class); }
    public function model(): MorphTo  { return $this->morphTo(); }

    public function scopeByUser($query, int $userId)        { return $query->where('user_id', $userId); }
    public function scopeByModel($query, string $modelType) { return $query->where('model_type', $modelType); }
    public function scopeByAction($query, string $action)   { return $query->where('action', $action); }
    public function scopeRecent($query)                     { return $query->orderByDesc('created_at'); }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    public function getChanges(): array
    {
        $changes = [];
        $oldValues = is_array($this->old_values) ? $this->old_values : [];
        $newValues = is_array($this->new_values) ? $this->new_values : [];
        foreach ($newValues as $key => $newValue) {
            if (($oldValues[$key] ?? null) !== $newValue) {
                $changes[$key] = ['old' => $oldValues[$key] ?? null, 'new' => $newValue];
            }
        }
        return $changes;
    }

    public function getActionDescription(): string
    {
        $modelName = class_basename($this->model_type);
        $userName  = $this->user ? $this->user->name : 'System';
        return match ($this->action) {
            'created'     => "{$userName} creó {$modelName}",
            'updated'     => "{$userName} actualizó {$modelName}",
            'deleted'     => "{$userName} eliminó {$modelName}",
            'activated'   => "{$userName} activó {$modelName}",
            'deactivated' => "{$userName} desactivó {$modelName}",
            'closed'      => "{$userName} cerró {$modelName}",
            'reopened'    => "{$userName} reabrió {$modelName}",
            default       => "{$userName} realizó {$this->action} en {$modelName}",
        };
    }
}