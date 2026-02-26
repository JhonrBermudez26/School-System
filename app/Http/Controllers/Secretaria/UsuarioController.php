<?php
namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;

class UsuarioController extends Controller
{
    /**
     * Mostrar listado de usuarios
     */
    public function index()
    {
        $this->authorize('viewAny', User::class);

        $usuarios = User::with('roles:id,name')->get();

        return Inertia::render('Secretaria/Usuarios', [
            'usuarios' => $usuarios,
            'can'      => [
                'create' => auth()->user()->can('create', User::class),
                'update' => auth()->user()->can('users.update'),
                'delete' => auth()->user()->can('users.delete'),
            ],
        ]);
    }

    /**
     * Crear nuevo usuario
     */
    public function store(Request $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'last_name'       => 'required|string|max:255',
            'email'           => 'required|email|unique:users',
            'password'        => 'required|min:6',
            'document_type'   => 'required|string|in:CC,TI,CE',
            'document_number' => 'required|string|unique:users',
            'phone'           => 'nullable|string|max:15',
            'address'         => 'nullable|string|max:255',
            'birth_date'      => 'nullable|date',
            'role'            => 'required|string|in:estudiante,profesor,secretaria,coordinadora,rector',
        ]);

        try {
            $user = User::create([
                'name'            => $validated['name'],
                'last_name'       => $validated['last_name'],
                'email'           => $validated['email'],
                'password'        => Hash::make($validated['password']),
                'document_type'   => $validated['document_type'],
                'document_number' => $validated['document_number'],
                'phone'           => $validated['phone'] ?? null,
                'address'         => $validated['address'] ?? null,
                'birth_date'      => $validated['birth_date'] ?? null,
                'is_active'       => true,
            ]);

            $user->assignRole($validated['role']);

            Log::info('Usuario creado', ['user_id' => $user->id, 'created_by' => auth()->id()]);

            return redirect()->back()->with('success', '✅ Usuario creado correctamente');
        } catch (\Exception $e) {
            Log::error('Error al crear usuario', ['error' => $e->getMessage()]);
            return back()->withErrors(['error' => '❌ Error al crear usuario: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualizar usuario existente
     * ✅ FIX IDOR: Route Model Binding + authorize('update', $user) con instancia real
     */
    public function update(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email'     => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'      => 'required|string|in:estudiante,profesor,secretaria,coordinadora,rector',
            'password'  => 'nullable|min:6',
            'is_active' => 'boolean',
        ]);

        try {
            $user->update([
                'name'      => $validated['name'],
                'last_name' => $validated['last_name'],
                'email'     => $validated['email'],
                'is_active' => $validated['is_active'] ?? $user->is_active,
            ]);

            if (!empty($validated['password'])) {
                $user->update(['password' => Hash::make($validated['password'])]);
            }

            if ($user->roles->first()?->name !== $validated['role']) {
                $user->syncRoles([$validated['role']]);
            }

            Log::info('Usuario actualizado', ['user_id' => $user->id, 'updated_by' => auth()->id()]);

            return back()->with('success', '✅ Usuario actualizado correctamente');
        } catch (\Exception $e) {
            Log::error('Error al actualizar usuario', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => '❌ Error al actualizar: ' . $e->getMessage()]);
        }
    }

    /**
     * Eliminar usuario
     * ✅ FIX IDOR: Route Model Binding + authorize('delete', $user)
     */
    public function destroy(User $user)
    {
        $this->authorize('delete', $user);

        try {
            $userId = $user->id;
            $user->delete();

            Log::info('Usuario eliminado', ['user_id' => $userId, 'deleted_by' => auth()->id()]);

            return back()->with('success', '🗑️ Usuario eliminado correctamente');
        } catch (\Exception $e) {
            Log::error('Error al eliminar usuario', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            return back()->withErrors(['error' => '❌ Error al eliminar: ' . $e->getMessage()]);
        }
    }

    /**
     * Activar/Desactivar usuario
     * ✅ FIX IDOR: Route Model Binding + authorize('update', $user)
     *    La Policy previene modificar al rector y auto-modificación
     */
    public function toggle(Request $request, User $user)
    {
        $this->authorize('update', $user);

        $user->update(['is_active' => $request->boolean('is_active')]);

        return back()->with('success', '🔄 Estado actualizado correctamente');
    }
}