<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Secretaria\DashboardController;
use App\Http\Controllers\Secretaria\UsuarioController;
use App\Http\Controllers\Secretaria\StudentController;
use App\Http\Controllers\Secretaria\GrupoController;
use App\Http\Controllers\Secretaria\ScheduleController;

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
        Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('secretaria.dashboard');

        // USUARIOS
       Route::get('/usuarios', [UsuarioController::class, 'index'])->name('usuarios.index');
        Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
        Route::put('/usuarios/{id}', [UsuarioController::class, 'update'])->name('usuarios.update');
        Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy'])->name('usuarios.destroy');
        Route::put('/usuarios/{id}/toggle', [UsuarioController::class, 'toggle'])->name('usuarios.toggle');

        // Estudiantes
       Route::get('/estudiantes', [StudentController::class, 'index'])->name('secretaria.estudiantes');
        Route::put('/estudiantes/{id}', [StudentController::class, 'update'])->name('estudiantes.update');
        Route::put('/estudiantes/{id}/toggle', [StudentController::class, 'toggle'])->name('estudiantes.toggle');
        Route::get('/estudiantes/export/excel', [StudentController::class, 'exportExcel'])->name('estudiantes.export.excel');
        Route::get('/estudiantes/export/pdf', [StudentController::class, 'exportPDF'])->name('estudiantes.export.pdf');



        // PROFESORES
    Route::get('/profesores', [App\Http\Controllers\Secretaria\TeacherController::class, 'index'])
        ->name('secretaria.profesores');
    Route::put('/profesores/{id}', [App\Http\Controllers\Secretaria\TeacherController::class, 'update'])
        ->name('profesores.update');
    Route::put('/profesores/{id}/toggle', [App\Http\Controllers\Secretaria\TeacherController::class, 'toggle'])
        ->name('profesores.toggle');

    // ASIGNATURAS
    Route::get('/asignaturas', [App\Http\Controllers\Secretaria\SubjectController::class, 'index'])
        ->name('secretaria.asignaturas');
    Route::post('/asignaturas', [App\Http\Controllers\Secretaria\SubjectController::class, 'store'])
        ->name('asignaturas.store');
    Route::put('/asignaturas/{id}', [App\Http\Controllers\Secretaria\SubjectController::class, 'update'])
        ->name('asignaturas.update');
    Route::delete('/asignaturas/{id}', [App\Http\Controllers\Secretaria\SubjectController::class, 'destroy'])
        ->name('asignaturas.destroy');
    Route::put('/asignaturas/{id}/toggle', [App\Http\Controllers\Secretaria\SubjectController::class, 'toggle'])
        ->name('asignaturas.toggle');

         // Grupos
        Route::get('/grupos', [GrupoController::class, 'index'])->name('secretaria.grupos');
        Route::post('/grupos', [GrupoController::class, 'store'])->name('grupos.store');
        Route::put('/grupos/{id}', [GrupoController::class, 'update'])->name('grupos.update');
        Route::delete('/grupos/{id}', [GrupoController::class, 'destroy'])->name('grupos.destroy');

         // Horarios
        Route::get('/horarios', [ScheduleController::class, 'index'])->name('secretaria.horarios');
        Route::post('/horarios', [ScheduleController::class, 'store'])->name('horarios.store');
        Route::put('/horarios/{id}', [ScheduleController::class, 'update'])->name('horarios.update');
        Route::delete('/horarios/{id}', [ScheduleController::class, 'destroy'])->name('horarios.destroy');
        Route::post('/horarios/generar', [ScheduleController::class, 'generate'])->name('horarios.generate');

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


