<?php

namespace App\Http\Controllers\Secretaria;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UsuarioController extends Controller
{
    public function index()
    {
        $usuarios = User::with('roles:id,name')
            ->select('id', 'name', 'last_name', 'email', 'document_number', 'is_active')
            ->orderBy('id', 'desc')
            ->get();

        return Inertia::render('Secretaria/Usuarios', [
            'usuarios' => $usuarios,
        ]);
    }

    public function store(Request $request)
    {
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
            'role'            => 'required|string',
        ]);

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

        return redirect()->route('usuarios.index')->with('success', '✅ Usuario creado correctamente');
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email'     => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'role'      => 'required|string',
            'password'  => 'nullable|min:6',
            'is_active' => 'boolean',
        ]);

        // Actualizar datos básicos
        $user->update([
            'name'      => $validated['name'],
            'last_name' => $validated['last_name'],
            'email'     => $validated['email'],
            'is_active' => $validated['is_active'] ?? $user->is_active,
        ]);

        // Actualizar contraseña solo si se proporciona
        if (!empty($validated['password'])) {
            $user->update([
                'password' => Hash::make($validated['password'])
            ]);
        }

        // Actualizar rol si cambió
        if ($user->roles->first()->name !== $validated['role']) {
            $user->syncRoles([$validated['role']]);
        }

        return back()->with('success', '✅ Usuario actualizado correctamente');
    }

    public function destroy($id)
    {
        User::findOrFail($id)->delete();
        return back()->with('success', '🗑️ Usuario eliminado');
    }

    public function toggle(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_active' => $request->is_active]);
        return back()->with('success', '🔄 Estado actualizado');
    }
}