<?php
// app/Http/Middleware/CheckPasswordChange.php
namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckPasswordChange
{
    public function handle(Request $request, Closure $next)
    {
        $user = auth()->user();

        if ($user && $user->must_change_password) {
            // Rutas permitidas mientras debe cambiar contraseña
            $allowedRoutes = [
                'perfil.editar',
                'perfil.update',
                'logout',
            ];

            if (!$request->routeIs($allowedRoutes)) {
                return redirect()->route('perfil.editar')
                    ->with('must_change_password', true);
            }
        }

        return $next($request);
    }
}