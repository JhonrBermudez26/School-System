<?php

namespace App\Http\Controllers\Rector;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

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
                $query->whereNull('suspended_at');
            } elseif ($request->status === 'suspended') {
                $query->whereNotNull('suspended_at');
            }
        }

        if ($request->filled('search')) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        $users = $query->paginate(20);

        return Inertia::render('Rector/GestionUsuarios', [
            'users' => $users,
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

        $oldValues = $user->only(['suspended_at', 'suspended_reason']);
        $user->suspended_at = null;
        $user->suspended_reason = null;
        $user->save();

        $this->activityLog->log($user, 'account_activated', $oldValues, [
            'suspended_at' => null,
            'suspended_reason' => null
        ]);

        return redirect()->route('rector.usuarios')
            ->with('success', 'Usuario activado correctamente');
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

        $oldValues = $user->only(['suspended_at', 'suspended_reason']);
        $user->suspended_at = now();
        $user->suspended_reason = $validated['reason'];
        $user->save();

        $this->activityLog->log($user, 'account_suspended', $oldValues, [
            'suspended_at' => $user->suspended_at,
            'suspended_reason' => $user->suspended_reason
        ]);

        return redirect()->route('rector.usuarios')
            ->with('success', 'Usuario suspendido correctamente');
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

        $this->activityLog->log($user, 'role_assigned', 
            ['roles' => $oldRoles], 
            ['roles' => [$validated['role']]]
        );

        return redirect()->route('rector.usuarios')
            ->with('success', 'Rol asignado correctamente');
    }

    /**
     * Ver historial de un usuario
     */
    public function history($id)
    {
        $user = User::with(['activityLogs'])->findOrFail($id);

        $this->authorize('view', $user);

        $history = $user->activityLogs()
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();

        return response()->json([
            'user' => $user,
            'history' => $history,
        ]);
    }
}
