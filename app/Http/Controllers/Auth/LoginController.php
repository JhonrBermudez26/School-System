<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoginController extends Controller
{
    /**
     * Mostrar formulario de login
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Procesar login
     */
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials, $request->boolean('remember'))) {
            $request->session()->regenerate();

            $user = Auth::user();

            // Verificar si el usuario está activo
            if (!$user->is_active) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Tu cuenta está inactiva. Contacta al administrador.',
                ]);
            }

            // Redirigir según el rol
            return $this->redirectByRole($user);
        }

        return back()->withErrors([
            'email' => 'Las credenciales no coinciden con nuestros registros.',
        ])->onlyInput('email');
    }

    /**
     * Redirigir al dashboard según el rol del usuario
     */
    protected function redirectByRole($user)
    {
        if ($user->hasRole('rector')) {
            return redirect()->intended('/rector/dashboard');
        }

        if ($user->hasRole('coordinadora')) {
            return redirect()->intended('/coordinadora/dashboard');
        }

        if ($user->hasRole('secretaria')) {
            return redirect()->intended('/secretaria/dashboard');
        }

        if ($user->hasRole('profesor')) {
            return redirect()->intended('/profesor/dashboard');
        }

        if ($user->hasRole('estudiante')) {
            return redirect()->intended('/estudiante/dashboard');
        }

        // Por defecto
        return redirect()->intended('/dashboard');
    }

    /**
     * Cerrar sesión
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
