<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class ActivityLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'action',
        'model_type',
        'model_id',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
    ];

    /**
     * Relación con el usuario que realizó la acción
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación polimórfica con el modelo afectado
     */
    public function model(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Scope para filtrar por usuario
     */
    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para filtrar por tipo de modelo
     */
    public function scopeByModel($query, string $modelType)
    {
        return $query->where('model_type', $modelType);
    }

    /**
     * Scope para filtrar por acción
     */
    public function scopeByAction($query, string $action)
    {
        return $query->where('action', $action);
    }

    /**
     * Scope para filtrar por rango de fechas
     */
    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('created_at', [$startDate, $endDate]);
    }

    /**
     * Scope ordenado por fecha descendente
     */
    public function scopeRecent($query)
    {
        return $query->orderByDesc('created_at');
    }

    /**
     * Obtiene los cambios realizados
     */
    public function getChanges(): array
    {
        $changes = [];

        if ($this->old_values && $this->new_values) {
            $oldValues = is_array($this->old_values) ? $this->old_values : [];
            $newValues = is_array($this->new_values) ? $this->new_values : [];

            foreach ($newValues as $key => $newValue) {
                $oldValue = $oldValues[$key] ?? null;
                if ($oldValue !== $newValue) {
                    $changes[$key] = [
                        'old' => $oldValue,
                        'new' => $newValue,
                    ];
                }
            }
        }

        return $changes;
    }

    /**
     * Obtiene una descripción legible de la acción
     */
    public function getActionDescription(): string
    {
        $modelName = class_basename($this->model_type);
        $userName = $this->user ? $this->user->name : 'System';

        return match ($this->action) {
            'created' => "{$userName} creó {$modelName}",
            'updated' => "{$userName} actualizó {$modelName}",
            'deleted' => "{$userName} eliminó {$modelName}",
            'activated' => "{$userName} activó {$modelName}",
            'deactivated' => "{$userName} desactivó {$modelName}",
            'closed' => "{$userName} cerró {$modelName}",
            'reopened' => "{$userName} reabrió {$modelName}",
            default => "{$userName} realizó {$this->action} en {$modelName}",
        };
    }
}
