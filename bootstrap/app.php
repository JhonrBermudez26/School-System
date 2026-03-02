<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            // rutas que excluyes de CSRF si las hay (webhooks, etc.)
        ]);
        
        $middleware->trustHosts(at: [
            env('APP_URL', 'http://localhost'),
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        
        // Alias de middleware
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'log.activity' => \App\Http\Middleware\LogActivity::class,
            'check.password' => \App\Http\Middleware\CheckPasswordChange::class,
            'check.active'       => \App\Http\Middleware\CheckActiveUser::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
