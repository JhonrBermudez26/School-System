<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class ProfileController extends Controller
{
    public function edit()
    {
        $user = Auth::user();

        // 🔹 Formatear la fecha para que el input <type="date"> la entienda
        if ($user->birth_date) {
            $user->birth_date = Carbon::parse($user->birth_date)->format('Y-m-d');
        }

        return inertia('Perfil/EditarPerfil', [
            'auth' => [
                'user' => $user,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'document_type' => 'nullable|string|max:50',
            'document_number' => 'nullable|string|max:50',
            'phone' => 'nullable|string|max:20',
            'address' => 'nullable|string|max:255',
            'birth_date' => 'nullable|date',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
        ]);

        // 🔹 Formatear fecha antes de guardar (MySQL usa YYYY-MM-DD)
        if (!empty($validated['birth_date'])) {
            $validated['birth_date'] = Carbon::parse($validated['birth_date'])->format('Y-m-d');
        }

        // 🔹 Si sube nueva foto, eliminar la anterior
        if ($request->hasFile('photo')) {
        // Eliminar la anterior solo si existe físicamente
        if ($user->photo && Storage::disk('public')->exists($user->photo)) {
            Storage::disk('public')->delete($user->photo);
        }

        // Guardar la nueva foto
        $path = $request->file('photo')->store('users', 'public');
        $validated['photo'] = $path;
    } else {
        // Mantener la foto anterior si no se sube una nueva
        $validated['photo'] = $user->photo;
    }

        $user->update($validated);

        return redirect()->back()->with('success', 'Perfil actualizado correctamente.');
    }

    public function updatePassword(Request $request)
    {
        $request->validate([
            'current_password' => ['required'],
            'new_password' => ['required', 'min:8', 'confirmed'],
        ]);

        $user = Auth::user();

        // 🔹 Verificar contraseña actual
        if (!Hash::check($request->current_password, $user->password)) {
            return back()->withErrors(['current_password' => 'La contraseña actual es incorrecta.']);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return back()->with('success', 'Contraseña actualizada correctamente.');
    }
}
