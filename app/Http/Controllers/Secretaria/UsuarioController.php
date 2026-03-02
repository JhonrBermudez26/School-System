<?php
namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Log;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;

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
    public function store(StoreUserRequest $request)
    {
        $this->authorize('create', User::class);

        $validated = $request->validated();

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
                'must_change_password' => true,
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
   public function update(UpdateUserRequest $request, User $user)
{
    $this->authorize('update', $user);
    $validated = $request->validated();
    
    try {
        // Preparar todos los campos juntos
        $user->name      = $validated['name'];
        $user->last_name = $validated['last_name'];
        $user->email     = $validated['email'];

        // Contraseña solo si viene
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
            $user->must_change_password = true;
        }

        // Estado
        if (isset($validated['is_active'])) {
            $user->is_active = $validated['is_active'];
        }

        // UN SOLO save() — no múltiples update()/save()
        $user->save();

        // Rol después del save (syncRoles no afecta password)
        if ($user->roles->first()?->name !== $validated['role']) {
            $user->syncRoles([$validated['role']]);
        }

        return back()->with('success', '✅ Usuario actualizado correctamente');

    } catch (\Exception $e) {
        return back()->withErrors(['error' => '❌ Error al actualizar: ' . $e->getMessage()]);
    }
}

// --- toggle() ---
public function toggle(Request $request, User $user)
{
    $this->authorize('update', $user);

    // ✅ CORREGIDO: usa métodos controlados
    if ($request->boolean('is_active')) {
        $user->activate();
    } else {
        $user->deactivate();
    }

    return back()->with('success', '🔄 Estado actualizado correctamente');
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

}