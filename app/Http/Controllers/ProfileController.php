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

        if ($user->birth_date) {
            $user->birth_date = Carbon::parse($user->birth_date)->format('Y-m-d');
        }

        return inertia('Perfil/EditarPerfil', [
            'auth' => ['user' => $user],
        ]);
    }

    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name'            => 'required|string|max:255',
            'last_name'       => 'required|string|max:255',
            'email'           => ['required', 'email', Rule::unique('users')->ignore($user->id)],
            'document_type'   => 'nullable|string|max:50',
            'document_number' => 'nullable|string|max:50',
            'phone'           => 'nullable|string|max:20',
            'address'         => 'nullable|string|max:255',
            'birth_date'      => 'nullable|date',
            'photo'           => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            // Contraseña — todos opcionales
            'current_password'      => 'nullable|string',
            'new_password'          => 'nullable|string|min:8|confirmed',
        ]);

        // Fecha
        if (!empty($validated['birth_date'])) {
            $validated['birth_date'] = Carbon::parse($validated['birth_date'])->format('Y-m-d');
        }

        // Foto
        if ($request->hasFile('photo')) {
            if ($user->photo && Storage::disk('public')->exists($user->photo)) {
                Storage::disk('public')->delete($user->photo);
            }
            $validated['photo'] = $request->file('photo')->store('users', 'public');
        } else {
            $validated['photo'] = $user->photo;
        }

      // ✅ Cambio de contraseña
        $passwordWasChanged = false;
        if (!empty($validated['current_password']) && !empty($validated['new_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return back()->withErrors([
                    'current_password' => 'La contraseña actual es incorrecta.',
                ]);
            }
            $validated['password'] = Hash::make($validated['new_password']);
            $passwordWasChanged = true;
        }

        unset(
            $validated['current_password'],
            $validated['new_password'],
            $validated['new_password_confirmation'],
            $validated['must_change_password']
        );

        $user->update($validated); // guarda todo incluyendo password correctamente

        if ($passwordWasChanged) {
        
            // ✅ Solo actualizar el flag
            $user->must_change_password = false;
            $user->save();

            return $this->redirectToDashboard($user, 'Contraseña actualizada correctamente. Bienvenid@ al sistema.');
        }
    }

    private function redirectToDashboard($user, string $message)
    {
        $routes = [
            'rector'       => '/rector/dashboard',
            'coordinadora' => '/coordinadora/dashboard',
            'secretaria'   => '/secretaria/dashboard',
            'profesor'     => '/profesor/dashboard',
            'estudiante'   => '/estudiante/dashboard',
        ];

        foreach ($routes as $role => $path) {
            if ($user->hasRole($role)) {
                return redirect($path)->with('success', $message);
            }
        }

        return redirect('/')->with('success', $message);
    }
}
