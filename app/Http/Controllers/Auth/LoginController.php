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
        if (Auth::check()) {
        return $this->redirectByRole(Auth::user());
    }
    return Inertia::render('Welcome', ['openLoginModal' => true]);
    
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

            if (!$user->is_active) {
                Auth::logout();
                return back()->withErrors([
                    'email' => 'Tu cuenta está inactiva. Contacta al administrador.',
                ]);
            }

            // ✅ AGREGADO: registrar login via método del modelo
            $user->recordLogin();
            
            if ($user->must_change_password) {
    return redirect()->route('perfil.editar')
        ->with('warning', 'Debes cambiar tu contraseña antes de continuar.');
}

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
