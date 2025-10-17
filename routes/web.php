<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ProfileController;

// Página principal (pública)
Route::get('/', function () {
    return Inertia::render('Welcome');
})->name('home');

// Rutas de autenticación
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// Rutas protegidas por autenticación
Route::middleware(['auth'])->group(function () {
    
    //RECTOR
    Route::middleware('role:rector')->prefix('rector')->group(function () {

        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Rector/Dashboard');
        })->name('rector.dashboard');

    });
    
    //COORDINADOR
    Route::middleware('role:coordinadora')->prefix('coordinadora')->group(function () {

        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Coordinadora/Dashboard');
        })->name('coordinadora.dashboard');

    });

    //SECRETARIA
    Route::middleware('role:secretaria')->prefix('secretaria')->group(function () {

        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Secretaria/Dashboard');
        })->name('secretaria.dashboard');

        // Estudiantes
        Route::get('/estudiantes', function () {
            return Inertia::render('Secretaria/Estudiantes');
        })->name('secretaria.estudiantes');
        
        Route::get('/nuevo/estudiante', function () {
            return Inertia::render('Secretaria/NuevoEstudiante');
        })->name('secretaria.nuevo.estudiante');
        
        Route::post('/nuevo/estudiante/crear', function () {
            // Lógica para crear estudiante
        })->name('secretaria.nuevo.estudiante.crear');

        // Periodos
        Route::get('/periodos', function () {
            return Inertia::render('Secretaria/Periodos');
        })->name('secretaria.periodos');
        
        Route::post('/periodos/crear', function () {
            // Lógica para crear periodo
        })->name('secretaria.periodos.crear');
        
        Route::put('/periodos/{id}', function ($id) {
            // Lógica para actualizar periodo
        })->name('secretaria.periodos.actualizar');

        // Boletines
        Route::get('/boletines', function () {
            return Inertia::render('Secretaria/Boletines');
        })->name('secretaria.boletines');

        // Configuración
        Route::get('/configuracion', function () {
            return Inertia::render('Secretaria/Configuracion');
        })->name('secretaria.configuracion');
        
        Route::post('/configuracion/actualizar', function () {
            // Lógica para actualizar configuración
        })->name('secretaria.configuracion.actualizar');
    });

    //PROFESOR
    Route::middleware('role:profesor')->prefix('profesor')->group(function () {

        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Profesor/Dashboard');
        })->name('profesor.dashboard');

    });

    //ESTUDIANTE
    Route::middleware('role:estudiante')->prefix('estudiante')->group(function () {

        // Dashboard
        Route::get('/dashboard', function () {
            return Inertia::render('Estudiante/Dashboard');
        })->name('estudiante.dashboard');

         // Notas
        Route::get('/notas', function () {
            return Inertia::render('Estudiante/Notas');
        })->name('estudiante.notas');

        // Materias
        Route::get('/materias', function () {
            return Inertia::render('Estudiante/Materias');
        })->name('estudiante.materias');
    });

    //GET EDITAR
    Route::get('/perfil/editar', function () {
    return inertia('Perfil/EditarPerfil');
    })->middleware(['auth'])->name('perfil.editar');

    //POST EDITAR
    Route::post('/perfil/actualizar', [ProfileController::class, 'update'])
    ->middleware(['auth'])
    ->name('perfil.update');

});


