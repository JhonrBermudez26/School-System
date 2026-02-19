<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    /**
     * Registra una actividad en el log del sistema
     *
     * @param Model|null $model El modelo afectado
     * @param string $action La acción realizada (created, updated, deleted, etc.)
     * @param array|null $oldValues Valores antes del cambio
     * @param array|null $newValues Valores después del cambio
     * @return ActivityLog
     */
    public function log(?Model $model, string $action, ?array $oldValues = null, ?array $newValues = null): ActivityLog
    {
        return ActivityLog::create([
            'user_id' => Auth::id(),
            'action' => $action,
            'model_type' => $model ? get_class($model) : null,
            'model_id' => $model ? $model->getKey() : null,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
        ]);
    }

    /**
     * Registra un cambio en un modelo comparando sus atributos
     *
     * @param Model $model El modelo afectado
     * @param string $action La acción realizada
     * @return ActivityLog|null
     */
    public function logModelChange(Model $model, string $action = 'updated'): ?ActivityLog
    {
        $newValues = $model->getChanges();
        
        // Si no hay cambios y es una actualización, no logueamos nada
        if ($action === 'updated' && empty($newValues)) {
            return null;
        }

        $oldValues = [];
        foreach ($newValues as $key => $value) {
            $oldValues[$key] = $model->getOriginal($key);
        }

        return $this->log($model, $action, $oldValues, $newValues);
    }
}
