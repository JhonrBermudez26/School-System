<?php

namespace App\Http\Middleware;

use App\Models\ActivityLog;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogActivity
{
    /**
     * Lista de acciones que deben ser registradas automáticamente
     */
    protected $loggedActions = [
        // Academic Periods
        'academic_period.activate',
        'academic_period.close',
        'academic_period.reopen',
        'academic_period.archive',
        
        // User Management
        'users.suspend',
        'users.activate',
        
        // Roles & Permissions
        'roles.create',
        'roles.update',
        'roles.delete',
        'permissions.assign',
        
        // Institutional Configuration
        'institution.update',
        'grading.scale.configure',
        'approval.criteria.configure',
        
        // Discipline
        'discipline.create',
        'discipline.close',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Solo registrar acciones exitosas (2xx status codes)
        if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
            $this->logRequest($request, $response);
        }

        return $response;
    }

    /**
     * Registrar la solicitud en el log de actividades
     */
    protected function logRequest(Request $request, Response $response): void
    {
        // Determinar el tipo de acción basado en el método HTTP y ruta
        $action = $this->determineAction($request);

        if (!$action || !$this->shouldLog($action)) {
            return;
        }

        // Obtener el modelo afectado si existe
        $subject = $this->getSubjectFromRequest($request);

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'model_type' => $subject ? get_class($subject) : 'System',
            'model_id' => $subject?->id,
            'old_values' => null, // El middleware automático usualmente no tiene valores previos fácilmente
            'new_values' => $this->getProperties($request),
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }

    /**
     * Determinar la acción basada en la ruta y método
     */
    protected function determineAction(Request $request): ?string
    {
        $route = $request->route();
        if (!$route) {
            return null;
        }

        $routeName = $route->getName();
        $method = $request->method();

        // Mapear rutas a acciones
        $actionMap = [
            'coordinadora.periodos.activate' => 'academic_period.activate',
            'coordinadora.periodos.close' => 'academic_period.close',
            'coordinadora.periodos.reopen' => 'academic_period.reopen',
            'coordinadora.periodos.archive' => 'academic_period.archive',
            
            'rector.usuarios.activate' => 'users.activate',
            'rector.usuarios.suspend' => 'users.suspend',
            
            'rector.roles.store' => 'roles.create',
            'rector.roles.update' => 'roles.update',
            'rector.roles.destroy' => 'roles.delete',
            'rector.roles.assign' => 'permissions.assign',
            
            'rector.configuracion.update' => 'institution.update',
            'rector.configuracion.grading-scale' => 'grading.scale.configure',
            'rector.configuracion.approval-criteria' => 'approval.criteria.configure',
            
            'coordinadora.disciplina.store' => 'discipline.create',
            'coordinadora.disciplina.close' => 'discipline.close',
        ];

        return $actionMap[$routeName] ?? null;
    }

    /**
     * Verificar si la acción debe ser registrada
     */
    protected function shouldLog(string $action): bool
    {
        return in_array($action, $this->loggedActions);
    }

    /**
     * Obtener el modelo afectado desde la request
     */
    protected function getSubjectFromRequest(Request $request)
    {
        // Intentar obtener el modelo desde los parámetros de la ruta
        $route = $request->route();
        if (!$route) {
            return null;
        }

        $parameters = $route->parameters();

        // Buscar modelos comunes en los parámetros
        foreach ($parameters as $parameter) {
            if (is_object($parameter) && method_exists($parameter, 'getKey')) {
                return $parameter;
            }
        }

        return null;
    }

    /**
     * Generar descripción legible de la acción
     */
    protected function generateDescription(string $action, Request $request): string
    {
        $user = auth()->user();
        $userName = $user?->name ?? 'Usuario';

        $descriptions = [
            'academic_period.activate' => "$userName activó un periodo académico",
            'academic_period.close' => "$userName cerró un periodo académico",
            'academic_period.reopen' => "$userName reabrió un periodo académico",
            'academic_period.archive' => "$userName archivó un periodo académico",
            
            'users.activate' => "$userName activó un usuario",
            'users.suspend' => "$userName suspendió un usuario",
            
            'roles.create' => "$userName creó un rol",
            'roles.update' => "$userName actualizó un rol",
            'roles.delete' => "$userName eliminó un rol",
            'permissions.assign' => "$userName asignó permisos a un rol",
            
            'institution.update' => "$userName actualizó la configuración institucional",
            'grading.scale.configure' => "$userName configuró la escala de calificaciones",
            'approval.criteria.configure' => "$userName configuró los criterios de aprobación",
            
            'discipline.create' => "$userName creó un registro disciplinario",
            'discipline.close' => "$userName cerró un registro disciplinario",
        ];

        return $descriptions[$action] ?? "$userName realizó la acción: $action";
    }

    /**
     * Obtener propiedades adicionales para el log
     */
    protected function getProperties(Request $request): array
    {
        $properties = [];

        // Capturar datos relevantes (sin información sensible)
        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('PATCH')) {
            $properties['input'] = $request->except(['password', '_token', '_method']);
        }

        return $properties;
    }
}
