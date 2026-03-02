<?php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckActiveUser
{
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        // Refrescar desde BD cada 5 minutos para detectar cambios en tiempo real
        $lastCheck = $request->session()->get('active_check_at');

        if (!$lastCheck || now()->diffInMinutes($lastCheck) >= 5) {
            $user = $user->fresh();
            $request->session()->put('active_check_at', now());
        }

        // Usuario suspendido
        if ($user->suspended_at !== null) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Tu cuenta ha sido suspendida. Contacta al administrador.',
            ]);
        }

        // Usuario inactivo
        if (!$user->is_active) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            return redirect()->route('login')->withErrors([
                'email' => 'Tu cuenta está inactiva.',
            ]);
        }

        return $next($request);
    }
}