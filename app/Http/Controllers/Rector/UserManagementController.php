<?php

namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    protected $activityLog;

    public function __construct(\App\Services\ActivityLogService $activityLog)
    {
        $this->activityLog = $activityLog;
    }

    /**
     * Lista de usuarios para gestión
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $query = User::with('roles');

        // Filtros
        if ($request->filled('role')) {
            $query->role($request->role);
        }

        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->whereNull('suspended_at')->where('is_active', true);
            } elseif ($request->status === 'suspended') {
                $query->whereNotNull('suspended_at');
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->paginate(20)->through(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name . ' ' . $user->last_name,
                'email' => $user->email,
                'document_number' => $user->document_number,
                'is_active' => $user->is_active,
                'suspended_at' => $user->suspended_at,
                'suspended_reason' => $user->suspended_reason,
                'last_login_at' => $user->last_login_at,
                'last_login_human' => $user->last_login_human,
                'roles' => $user->roles->map(fn($role) => [
                    'id' => $role->id,
                    'name' => $role->name,
                ]),
            ];
        });

        // Obtener todos los roles disponibles
        $roles = Role::orderBy('name')->get()->map(fn($role) => [
            'id' => $role->id,
            'name' => $role->name,
        ]);

        return Inertia::render('Rector/GestionUsuarios', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['role', 'status', 'search']),
        ]);
    }

    /**
     * Activar un usuario suspendido
     */
    public function activate($id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('activate', User::class);

        if (!$user->suspended_at) {
            return back()->withErrors(['error' => 'El usuario no está suspendido']);
        }

        $oldValues = [
            'suspended_at' => $user->suspended_at,
            'suspended_reason' => $user->suspended_reason,
            'is_active' => $user->is_active,
        ];

        $user->update([
            'suspended_at' => null,
            'suspended_reason' => null,
            'is_active' => true,
        ]);

        $this->activityLog->log($user, 'activated', $oldValues, [
            'suspended_at' => null,
            'suspended_reason' => null,
            'is_active' => true,
        ]);

        return redirect()->route('rector.usuarios')
            ->with('success', "Usuario {$user->name} activado correctamente");
    }

    /**
     * Suspender un usuario
     */
    public function suspend(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('suspend', $user);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $oldValues = [
            'suspended_at' => $user->suspended_at,
            'suspended_reason' => $user->suspended_reason,
            'is_active' => $user->is_active,
        ];

        $user->update([
            'suspended_at' => now(),
            'suspended_reason' => $validated['reason'],
            'is_active' => false,
        ]);

        $this->activityLog->log($user, 'suspended', $oldValues, [
            'suspended_at' => $user->suspended_at,
            'suspended_reason' => $user->suspended_reason,
            'is_active' => false,
        ]);

        // TODO: Aquí podrías invalidar todas las sesiones activas del usuario
        // usando Laravel's session management

        return redirect()->route('rector.usuarios')
            ->with('success', "Usuario {$user->name} suspendido correctamente");
    }

    /**
     * Asignar rol a un usuario
     */
    public function assignRole(Request $request, $id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('update', $user);

        $validated = $request->validate([
            'role' => 'required|exists:roles,name',
        ]);

        $oldRoles = $user->getRoleNames()->toArray();

        $user->syncRoles([$validated['role']]);

        $this->activityLog->log($user, 'role_changed', 
            ['roles' => $oldRoles], 
            ['roles' => [$validated['role']]]
        );

        return redirect()->route('rector.usuarios')
            ->with('success', "Rol actualizado a {$validated['role']} para {$user->name}");
    }

    /**
     * Ver historial de actividades de un usuario
     */
    public function history($id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('view', $user);

        $history = ActivityLog::where('user_id', $id)
            ->orWhere(function($query) use ($id) {
                $query->where('model_type', User::class)
                      ->where('model_id', $id);
            })
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(function($log) {
                return [
                    'id' => $log->id,
                    'action' => $log->action,
                    'description' => $log->getActionDescription(),
                    'ip_address' => $log->ip_address,
                    'user_agent' => $log->user_agent,
                    'created_at' => $log->created_at->format('Y-m-d H:i:s'),
                    'created_at_human' => $log->created_at->diffForHumans(),
                    'old_values' => $log->old_values,
                    'new_values' => $log->new_values,
                ];
            });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name . ' ' . $user->last_name,
                'email' => $user->email,
            ],
            'history' => $history,
        ]);
    }

    /**
     * Resetear contraseña de un usuario
     */
    public function resetPassword($id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('update', $user);

        // Generar contraseña temporal
        $tempPassword = \Str::random(12);
        
        $user->update([
            'password' => bcrypt($tempPassword),
        ]);

        $this->activityLog->log($user, 'password_reset', null, [
            'reset_by' => auth()->user()->name,
        ]);

        // TODO: Enviar email al usuario con la contraseña temporal
        
        return response()->json([
            'success' => true,
            'message' => 'Contraseña reseteada correctamente',
            'temporary_password' => $tempPassword, // En producción, solo enviar por email
        ]);
    }

    /**
     * Forzar cierre de sesión de un usuario
     */
    public function forceLogout($id)
    {
        $user = User::findOrFail($id);
        
        $this->authorize('suspend', $user);

        // Invalidar todas las sesiones del usuario
        \DB::table('sessions')
            ->where('user_id', $id)
            ->delete();

        $this->activityLog->log($user, 'force_logout', null, [
            'forced_by' => auth()->user()->name,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Sesiones cerradas correctamente',
        ]);
    }
}