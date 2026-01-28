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
use App\Http\Controllers\Secretaria\PeriodController;
use App\Http\Controllers\Secretaria\SchoolSettingController;
use App\Http\Controllers\Secretaria\TeacherController;
use App\Http\Controllers\Secretaria\SubjectController;

use App\Http\Controllers\Profesor\TeacherDashboardController;
use App\Http\Controllers\Profesor\ClassController;
use App\Http\Controllers\Profesor\FolderController;
use App\Http\Controllers\Profesor\FileController;
use App\Http\Controllers\Profesor\MeetingController;
use App\Http\Controllers\Profesor\PostController;
use App\Http\Controllers\Profesor\ChatController;
use App\Http\Controllers\Profesor\ScheduleTeacherController;

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
        Route::get('estudiantes/export/excel', [StudentController::class, 'exportExcel'])->name('estudiantes.export.excel');
        Route::get('estudiantes/export/pdf', [StudentController::class, 'exportPDF'])->name('estudiantes.export.pdf');

        // PROFESORES
    Route::get('/profesores', [TeacherController::class, 'index'])
        ->name('secretaria.profesores');
    Route::put('/profesores/{id}', [TeacherController::class, 'update'])
        ->name('profesores.update');
    Route::put('/profesores/{id}/toggle', [TeacherController::class, 'toggle'])
        ->name('profesores.toggle');

    // ASIGNATURAS
    Route::get('/asignaturas', [SubjectController::class, 'index'])
        ->name('secretaria.asignaturas');
    Route::post('/asignaturas', [SubjectController::class, 'store'])
        ->name('asignaturas.store');
    Route::put('/asignaturas/{id}', [SubjectController::class, 'update'])
        ->name('asignaturas.update');
    Route::delete('/asignaturas/{id}', [SubjectController::class, 'destroy'])
        ->name('asignaturas.destroy');
    Route::put('/asignaturas/{id}/toggle', [SubjectController::class, 'toggle'])
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
        Route::get('/periodos', [PeriodController::class, 'index'])
            ->name('secretaria.periodos');
        Route::post('/periodos', [PeriodController::class, 'store'])
            ->name('secretaria.periodos.crear');
        // Alias temporal para compatibilidad con frontend actual
        Route::post('/periodos/crear', [PeriodController::class, 'store']);
        Route::put('/periodos/{id}', [PeriodController::class, 'update'])
            ->name('secretaria.periodos.actualizar');
        Route::delete('/periodos/{id}', [PeriodController::class, 'destroy'])
            ->name('secretaria.periodos.eliminar');
        Route::patch('/periodos/{id}/toggle', [PeriodController::class, 'toggle'])
            ->name('secretaria.periodos.toggle');
        Route::post('/periodos/verify-password', [PeriodController::class, 'verifyPassword'])
    ->name('secretaria.periodos.verify');

        // Boletines
        Route::get('/boletines', function () {
            return Inertia::render('Secretaria/Boletines');
        })->name('secretaria.boletines');

        // Configuración
        // Dentro del grupo de secretaria
        Route::get('/configuracion', [SchoolSettingController::class, 'index'])
            ->name('secretaria.configuracion');
        Route::post('/configuracion', [SchoolSettingController::class, 'update'])
            ->name('secretaria.configuracion.actualizar');
        Route::delete('/configuracion/logo', [SchoolSettingController::class, 'deleteLogo'])
            ->name('secretaria.configuracion.deleteLogo');
    });

    //PROFESOR
    Route::middleware('role:profesor')->prefix('profesor')->group(function () {
        // Dashboard
        Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('profesor.dashboard');

        //CHAT
        Route::get('/chat', [ChatController::class, 'index'])
            ->name('profesor.chat');
            
            Route::get('/chat/conversations/json', [ChatController::class, 'conversationsJson'])
            ->name('profesor.chat.conversations.json');

        
        Route::get('/chat/search', [ChatController::class, 'searchUsers'])
            ->name('profesor.chat.search');
        
        Route::post('/chat/create', [ChatController::class, 'createConversation'])
            ->name('profesor.chat.create');
        
        Route::get('/chat/{id}', [ChatController::class, 'getConversation'])
            ->name('profesor.chat.show');
        
        Route::post('/chat/{id}/message', [ChatController::class, 'sendMessage'])
            ->name('profesor.chat.message');
        
        Route::post('/chat/{id}/read', [ChatController::class, 'markAsRead'])
            ->name('profesor.chat.read');
        
        Route::delete('/chat/message/{id}', [ChatController::class, 'deleteMessage'])
            ->name('profesor.chat.delete-message');
        
        Route::post('/chat/{id}/leave', [ChatController::class, 'leaveGroup'])
            ->name('profesor.chat.leave');
        
        Route::post('/chat/{id}/add-participant', [ChatController::class, 'addParticipant'])
            ->name('profesor.chat.addParticipant');
        
        Route::put('/chat/{id}/update-group', [ChatController::class, 'updateGroup'])
            ->name('profesor.chat.update-group');

        Route::put('/chat/message/{id}/edit', [ChatController::class, 'editMessage'])
            ->name('profesor.chat.edit-message');

        Route::delete('/chat/message/{id}', [ChatController::class, 'deleteMessage'])
            ->name('profesor.chat.delete-message');

        Route::delete('/chat/conversation/{id}', [ChatController::class, 'deleteConversation'])
            ->name('profesor.chat.delete-conversation');
        
        // Mis Clases
        Route::get('/clases', [ClassController::class, 'index'])->name('profesor.clases.index');
        Route::get('/clases/detalle', [ClassController::class, 'show'])->name('profesor.clases.show');
        
        // Publicaciones (CRUD)
        Route::get('/clases/posts', [PostController::class, 'index'])->name('profesor.posts.index');
        Route::post('/clases/posts', [PostController::class, 'store'])->name('profesor.posts.store');
        Route::put('/clases/posts/{post}', [PostController::class, 'update'])->name('profesor.posts.update');
        Route::delete('/clases/posts/{post}', [PostController::class, 'destroy'])->name('profesor.posts.destroy');
        
        // Carpetas (CRUD)
        Route::post('/clases/folders', [FolderController::class, 'store'])->name('profesor.folders.store');
        Route::put('/clases/folders/{folder}', [FolderController::class, 'update'])->name('profesor.folders.update');
        Route::delete('/clases/folders/{folder}', [FolderController::class, 'destroy'])->name('profesor.folders.destroy');
        
        // Archivos (CRUD)
        Route::post('/clases/files', [FileController::class, 'store'])->name('profesor.files.store');
        Route::delete('/clases/files/{file}', [FileController::class, 'destroy'])->name('profesor.files.destroy');
        
        // Reuniones (CRUD)
        Route::post('/clases/meetings', [MeetingController::class, 'store'])->name('profesor.meetings.store');
        Route::delete('/clases/meetings/{meeting}', [MeetingController::class, 'destroy'])->name('profesor.meetings.destroy');
    
    
        //HORARIO
        Route::get('/horario', [ScheduleTeacherController::class, 'index'])->name('profesor.horario');
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


