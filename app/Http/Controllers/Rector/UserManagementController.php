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
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('document_number', 'like', "%{$search}%");
            });
        }

        $users = $query->orderBy('name')->paginate(20)->through(function ($user) {
            return [
                'id'               => $user->id,
                'name'             => $user->name . ' ' . $user->last_name,
                'email'            => $user->email,
                'document_number'  => $user->document_number,
                'is_active'        => $user->is_active,
                'suspended_at'     => $user->suspended_at,
                'suspended_reason' => $user->suspended_reason,
                'last_login_at'    => $user->last_login_at,
                'last_login_human' => $user->last_login_human,
                'roles'            => $user->roles->map(fn($r) => ['id' => $r->id, 'name' => $r->name]),
            ];
        });

        $roles = Role::orderBy('name')->get()->map(fn($r) => ['id' => $r->id, 'name' => $r->name]);

        return Inertia::render('Rector/GestionUsuarios', [
            'users'   => $users,
            'roles'   => $roles,
            'filters' => $request->only(['role', 'status', 'search']),
        ]);
    }

    /**
     * Activar un usuario suspendido
     * ✅ FIX IDOR: Route Model Binding + authorize con instancia del usuario afectado
     */
    public function activate(User $user)
    {
        $this->authorize('activate', $user);

        if (!$user->suspended_at) {
            return back()->withErrors(['error' => 'El usuario no está suspendido']);
        }

        $oldValues = [
            'suspended_at'     => $user->suspended_at,
            'suspended_reason' => $user->suspended_reason,
            'is_active'        => $user->is_active,
        ];

        $user->update([
            'suspended_at'     => null,
            'suspended_reason' => null,
            'is_active'        => true,
        ]);

        $this->activityLog->log($user, 'activated', $oldValues, [
            'suspended_at'     => null,
            'suspended_reason' => null,
            'is_active'        => true,
        ]);

        return redirect()->route('rector.usuarios')
            ->with('success', "Usuario {$user->name} activado correctamente");
    }

    /**
     * Suspender un usuario
     * ✅ FIX IDOR: Route Model Binding + authorize con instancia (Policy previene auto-suspensión
     *    y suspensión de rector por no-rector)
     */
    public function suspend(Request $request, User $user)
    {
        $this->authorize('suspend', $user);

        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        $oldValues = [
            'suspended_at'     => $user->suspended_at,
            'suspended_reason' => $user->suspended_reason,
            'is_active'        => $user->is_active,
        ];

        $user->update([
            'suspended_at'     => now(),
            'suspended_reason' => $validated['reason'],
            'is_active'        => false,
        ]);

        $this->activityLog->log($user, 'suspended', $oldValues, [
            'suspended_at'     => $user->suspended_at,
            'suspended_reason' => $user->suspended_reason,
            'is_active'        => false,
        ]);

        return redirect()->route('rector.usuarios')
            ->with('success', "Usuario {$user->name} suspendido correctamente");
    }

    /**
     * Asignar rol a un usuario
     * ✅ FIX IDOR: Route Model Binding + authorize('update', $user)
     */
    public function assignRole(Request $request, User $user)
    {
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
     * ✅ FIX IDOR: Route Model Binding + authorize('view', $user)
     */
    public function history(User $user)
    {
        $this->authorize('view', $user);

        $history = ActivityLog::where('user_id', $user->id)
            ->orWhere(function ($query) use ($user) {
                $query->where('model_type', User::class)
                      ->where('model_id', $user->id);
            })
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->limit(100)
            ->get()
            ->map(fn($log) => [
                'id'               => $log->id,
                'action'           => $log->action,
                'description'      => $log->getActionDescription(),
                'ip_address'       => $log->ip_address,
                'user_agent'       => $log->user_agent,
                'created_at'       => $log->created_at->format('Y-m-d H:i:s'),
                'created_at_human' => $log->created_at->diffForHumans(),
                'old_values'       => $log->old_values,
                'new_values'       => $log->new_values,
            ]);

        return response()->json([
            'user' => [
                'id'    => $user->id,
                'name'  => $user->name . ' ' . $user->last_name,
                'email' => $user->email,
            ],
            'history' => $history,
        ]);
    }

    /**
     * Resetear contraseña de un usuario
     * ✅ FIX IDOR: Route Model Binding + authorize('update', $user)
     */
    public function resetPassword(User $user)
    {
        $this->authorize('update', $user);

        $tempPassword = \Str::random(12);

        $user->update([
            'password' => bcrypt($tempPassword),
        ]);

        $this->activityLog->log($user, 'password_reset', null, [
            'reset_by' => auth()->user()->name,
        ]);

        return response()->json([
            'success'            => true,
            'message'            => 'Contraseña reseteada correctamente',
            'temporary_password' => $tempPassword,
        ]);
    }

    /**
     * Forzar cierre de sesión de un usuario
     * ✅ FIX IDOR: Route Model Binding + authorize('suspend', $user) reutiliza misma policy
     */
    public function forceLogout(User $user)
    {
        $this->authorize('suspend', $user);

        \DB::table('sessions')
            ->where('user_id', $user->id)
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