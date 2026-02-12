    <?php

    use Illuminate\Support\Facades\Route;
    use Inertia\Inertia;
    use App\Http\Controllers\Auth\LoginController;
    use App\Http\Controllers\ProfileController;
    use App\Http\Controllers\Secretaria\DashboardController;
    use App\Http\Controllers\Secretaria\UsuarioController;
    use App\Http\Controllers\Secretaria\StudentController;
    use App\Http\Controllers\Secretaria\GrupoController;
  
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
    use App\Http\Controllers\Profesor\AsistenciasController;
    use App\Http\Controllers\Profesor\RegistrarNotasController;
    use App\Http\Controllers\Profesor\TaskController;

    use App\Http\Controllers\Estudiante\EstudianteDashboardController;
    use App\Http\Controllers\Estudiante\EstudianteClasesController;
    use App\Http\Controllers\Estudiante\Estudiantepostcontroller;
    use App\Http\Controllers\Estudiante\Estudiantetaskcontroller;
    use App\Http\Controllers\Estudiante\EstudianteChatController;
    use App\Http\Controllers\Estudiante\ScheduleEstudentController;
    use App\Http\Controllers\Estudiante\AsistenciasEstudentController;
    use App\Http\Controllers\Estudiante\MisNotasController;

    use App\Http\Controllers\Coordinadora\ScheduleController;
    use App\Http\Controllers\Coordinadora\PeriodController;

    use App\Http\Controllers\Rector\SchoolSettingController;

    Route::get('/sanctum/csrf-cookie', function () {
        return response()->noContent();
    });

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

             // CONFIGURACIÓN
    Route::middleware(['permission:institution.update'])->group(function () {
        Route::get('/configuracion', [SchoolSettingController::class, 'index'])->name('rector.configuracion');
        Route::post('/configuracion', [SchoolSettingController::class, 'update'])->name('rector.configuracion.actualizar');
        Route::delete('/configuracion/logo', [SchoolSettingController::class, 'deleteLogo'])->name('rector.configuracion.deleteLogo');
    });

        });
        
        //COORDINADOR
        Route::middleware('role:coordinadora')->prefix('coordinadora')->group(function () {

            // Dashboard
            Route::get('/dashboard', function () {
                return Inertia::render('Coordinadora/Dashboard');
            })->name('coordinadora.dashboard');

                // HORARIOS
            Route::middleware(['permission:schedules.view'])->group(function () {
                Route::get('/horarios', [ScheduleController::class, 'index'])->name('coordinadora.horarios');
            });

            Route::middleware(['permission:schedules.create'])->group(function () {
                Route::post('/horarios', [ScheduleController::class, 'store'])->name('coordinadora.horarios.store');
                Route::post('/horarios/generar', [ScheduleController::class, 'generate'])->name('coordinadora.horarios.generate');
                Route::post('/horarios/add-slot', [ScheduleController::class, 'addSlot'])->name('coordinadora.horarios.add-slot');
            });

            Route::middleware(['permission:schedules.update'])->group(function () {
                Route::put('/horarios/update-slot', [ScheduleController::class, 'updateSlot'])->name('coordinadora.horarios.update-slot');
                Route::put('/horarios/{id}', [ScheduleController::class, 'update'])->name('coordinadora.horarios.update');
                Route::post('/horarios/move', [ScheduleController::class, 'move'])->name('coordinadora.horarios.move');
            });

            Route::middleware(['permission:schedules.delete'])->group(function () {
                Route::delete('/horarios/delete-slot', [ScheduleController::class, 'deleteSlot'])->name('coordinadora.horarios.delete-slot');
                Route::delete('/horarios/{id}', [ScheduleController::class, 'destroy'])->name('coordinadora.horarios.destroy');
            });

            Route::middleware(['permission:schedules.print'])->group(function () {
                Route::get('/horarios/print', [ScheduleController::class, 'print'])->name('coordinadora.horarios.print');
            });
            
            // PERIODOS
            Route::middleware(['permission:periods.view'])->group(function () {
                Route::get('/periodos', [PeriodController::class, 'index'])->name('coordinadora.periodos');
            });
            
            Route::middleware(['permission:periods.create'])->group(function () {
                Route::post('/periodos', [PeriodController::class, 'store'])->name('coordinadora.periodos.crear');
            });
            
            Route::middleware(['permission:periods.update'])->group(function () {
                Route::put('/periodos/{id}', [PeriodController::class, 'update'])->name('coordinadora.periodos.actualizar');
                Route::patch('/periodos/{id}/toggle', [PeriodController::class, 'toggle'])->name('coordinadora.periodos.toggle');
            });
            
            Route::middleware(['permission:periods.delete'])->group(function () {
                Route::delete('/periodos/{id}', [PeriodController::class, 'destroy'])->name('coordinadora.periodos.eliminar');
            });
            
            // BOLETINES
            Route::middleware(['permission:bulletins.view'])->group(function () {
                Route::get('/boletines', function () {
                    return Inertia::render('Coordinadora/Boletines');
                })->name('coordinadora.boletines');
            });
   

        });

        //SECRETARIA
        // SECRETARIA - con permisos específicos
Route::middleware(['auth', 'role:secretaria'])->prefix('secretaria')->group(function () {
    
    // Dashboard
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('secretaria.dashboard');
    
    // USUARIOS - requiere permiso específico
    Route::middleware(['permission:users.view'])->group(function () {
        Route::get('/usuarios', [UsuarioController::class, 'index'])
            ->name('secretaria.usuarios');
    });
    
    Route::middleware(['permission:users.create'])->group(function () {
        Route::post('/usuarios', [UsuarioController::class, 'store'])
            ->name('usuarios.store');
    });
    
    Route::middleware(['permission:users.update'])->group(function () {
        Route::put('/usuarios/{id}', [UsuarioController::class, 'update'])
            ->name('usuarios.update');
        Route::put('/usuarios/{id}/toggle', [UsuarioController::class, 'toggle'])
            ->name('usuarios.toggle');
    });

    Route::middleware(['permission:users.delete'])->group(function () {
        Route::delete('/usuarios/{id}', [UsuarioController::class, 'destroy'])
            ->name('usuarios.destroy');
    });
    
    // ESTUDIANTES
    Route::middleware(['permission:students.view'])->group(function () {
        Route::get('/estudiantes', [StudentController::class, 'index'])
            ->name('secretaria.estudiantes');
        
        // ✅ Rutas de exportación
        Route::get('/estudiantes/export/excel', [StudentController::class, 'exportExcel'])
            ->name('estudiantes.export.excel');
        Route::get('/estudiantes/export/pdf', [StudentController::class, 'exportPDF'])
            ->name('estudiantes.export.pdf');
    });

    Route::middleware(['permission:students.update'])->group(function () {
        Route::put('/estudiantes/{id}', [StudentController::class, 'update'])
            ->name('estudiantes.update');
        Route::put('/estudiantes/{id}/toggle', [StudentController::class, 'toggle'])
            ->name('estudiantes.toggle');
    });
    
    // PROFESORES
     Route::middleware(['permission:teachers.view'])->group(function () {
        Route::get('/profesores', [TeacherController::class, 'index'])
            ->name('secretaria.profesores');
    });

    Route::middleware(['permission:teachers.update'])->group(function () {
        Route::put('/profesores/{id}', [TeacherController::class, 'update'])->name('profesores.update');
        Route::put('/profesores/{id}/toggle', [TeacherController::class, 'toggle'])->name('profesores.toggle');
    });
    
    // ASIGNATURAS
    Route::middleware(['permission:subjects.view'])->group(function () {
        Route::get('/asignaturas', [SubjectController::class, 'index'])
            ->name('secretaria.asignaturas');
    });
    
    Route::middleware(['permission:subjects.create'])->group(function () {
        Route::post('/asignaturas', [SubjectController::class, 'store'])->name('asignaturas.store');
    });
    
    Route::middleware(['permission:subjects.update'])->group(function () {
        Route::put('/asignaturas/{id}', [SubjectController::class, 'update'])->name('asignaturas.update');
    });
    
    Route::middleware(['permission:subjects.delete'])->group(function () {
        Route::delete('/asignaturas/{id}', [SubjectController::class, 'destroy'])->name('asignaturas.destroy');
    });
    
    // GRUPOS
    Route::middleware(['permission:groups.view'])->group(function () {
        Route::get('/grupos', [GrupoController::class, 'index'])->name('secretaria.grupos');
    });
    
    Route::middleware(['permission:groups.create'])->group(function () {
        Route::post('/grupos', [GrupoController::class, 'store'])->name('grupos.store');
    });
    
    Route::middleware(['permission:groups.update'])->group(function () {
        Route::put('/grupos/{id}', [GrupoController::class, 'update'])->name('grupos.update');
    });
    
    Route::middleware(['permission:groups.delete'])->group(function () {
        Route::delete('/grupos/{id}', [GrupoController::class, 'destroy'])->name('grupos.destroy');
    });
    
    // horarios
    Route::middleware(['permission:schedules.view'])->group(function () {
        Route::get('/horarios', [\App\Http\Controllers\Coordinadora\ScheduleController::class, 'index'])
            ->name('secretaria.horarios');
    });
    
    Route::middleware(['permission:schedules.print'])->group(function () {
        Route::get('/horarios/print', [\App\Http\Controllers\Coordinadora\ScheduleController::class, 'print'])
            ->name('secretaria.horarios.print');
    });
   
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
            Route::get('/posts', [PostController::class, 'index'])->name('profesor.posts.index');
        Route::post('/posts', [PostController::class, 'store'])->name('profesor.posts.store');
        Route::put('/posts/{post}', [PostController::class, 'update'])->name('profesor.posts.update');
        Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('profesor.posts.destroy');
            
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
        
            // TAREAS
       Route::prefix('clases')->name('profesor.clases.')->group(function () {
        // Lista de tareas
        Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index');
        
        // Crear tarea
        Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store');
        
        // Ver detalle de tarea
        Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show');
        
        // Actualizar tarea
        Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update');
        
        // Eliminar tarea
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy');
        
        // Eliminar adjunto de tarea
        Route::delete('/tasks/attachments/{attachment}', [TaskController::class, 'deleteAttachment'])
            ->name('tasks.deleteAttachment');
        
        // Calificar una entrega
        Route::post('/tasks/submissions/{submission}/grade', [TaskController::class, 'gradeSubmission'])
            ->name('tasks.gradeSubmission');

            //actualizar entrega
        Route::put('/tasks/submissions/{submission}/grade', [TaskController::class, 'gradeSubmission'])
        ->name('tasks.updateGrade');
    });
            
            //HORARIO
           Route::get('/horario', [ScheduleTeacherController::class, 'index'])->name('profesor.horario');
    Route::get('/horario/print', [ScheduleTeacherController::class, 'print'])->name('profesor.horario.print');

            // ASISTENCIAS
            Route::get('/asistencias', [AsistenciasController::class, 'index'])
                ->name('profesor.asistencias');
            Route::post('/asistencias/bulk', [AsistenciasController::class, 'bulkStore'])
                ->name('profesor.asistencias.bulk');
            Route::delete('/asistencias/{id}', [AsistenciasController::class, 'destroy'])
                ->name('profesor.asistencias.destroy');


            // REGISTRAR NOTAS - RUTAS COMPLETAS
            Route::prefix('registrarNotas')->name('profesor.registrarNotas')->group(function () {
                // Vista principal (GET /profesor/registrarNotas)
                Route::get('/', [RegistrarNotasController::class, 'index'])->name('');

                // Acciones de evaluaciones manuales
                Route::post('/manual/create', [RegistrarNotasController::class, 'createManualGrade'])->name('manual.create');
                Route::post('/manual/score', [RegistrarNotasController::class, 'saveManualGradeScore'])->name('manual.score');
                Route::delete('/manual/{id}', [RegistrarNotasController::class, 'deleteManualGrade'])->name('manual.delete');
            });
        });





//ESTUDIANTE
        Route::middleware('role:estudiante')->prefix('estudiante')->group(function () {
            Route::get('/dashboard', [EstudianteDashboardController::class, 'index'])->name('estudiante.dashboard');

            // Clases
            Route::get('/clases', [EstudianteClasesController::class, 'index'])->name('estudiante.clases.index');
            Route::get('/clases/{subject_id}/{group_id}', [EstudianteClasesController::class, 'show'])->name('estudiante.clases.show');
                    
            // Publicaciones
            Route::post('/posts', [EstudiantePostController::class, 'store'])->name('estudiante.posts.store');
            Route::put('/posts/{post}', [EstudiantePostController::class, 'update'])->name('estudiante.posts.update');
            Route::delete('/posts/{post}', [EstudiantePostController::class, 'destroy'])->name('estudiante.posts.destroy');
                    
            // Tareas - Rutas existentes


            Route::prefix('tasks')->name('tasks.')->group(function () {
        // Lista de tareas
        Route::get('/', [EstudianteTaskController::class, 'index'])->name('index');
        
        // Ver detalle de tarea
        Route::get('/{task}', [EstudianteTaskController::class, 'show'])->name('show');
        
        // Enviar o editar entrega
        Route::post('/submit', [EstudianteTaskController::class, 'submit'])->name('submit');
        
        // Obtener compañeros disponibles
        Route::get('/{task}/available-classmates', [EstudianteTaskController::class, 'getAvailableClassmates'])
            ->name('available-classmates');
        
        // Eliminar archivo de entrega
        Route::delete('/files/{file}', [EstudianteTaskController::class, 'deleteFile'])
            ->name('files.delete');
        
        // Remover miembro del grupo
        Route::delete('/members/{member}', [EstudianteTaskController::class, 'removeMember'])
            ->name('members.remove');
        
        // Eliminar entrega completa
        Route::delete('/submissions/{submission}', [EstudianteTaskController::class, 'deleteSubmission'])
            ->name('submissions.delete');
    });


    // CHAT
    Route::get('/chat', [EstudianteChatController::class, 'index'])
        ->name('estudiante.chat');
        
    Route::get('/chat/conversations/json', [EstudianteChatController::class, 'conversationsJson'])
        ->name('estudiante.chat.conversations.json');
    
    Route::get('/chat/search', [EstudianteChatController::class, 'searchUsers'])
        ->name('estudiante.chat.search');
    
    Route::post('/chat/create', [EstudianteChatController::class, 'createConversation'])
        ->name('estudiante.chat.create');
    
    Route::get('/chat/{id}', [EstudianteChatController::class, 'getConversation'])
        ->name('estudiante.chat.show');
    
    Route::post('/chat/{id}/message', [EstudianteChatController::class, 'sendMessage'])
        ->name('estudiante.chat.message');
    
    Route::post('/chat/{id}/read', [EstudianteChatController::class, 'markAsRead'])
        ->name('estudiante.chat.read');
    
    Route::delete('/chat/message/{id}', [EstudianteChatController::class, 'deleteMessage'])
        ->name('estudiante.chat.delete-message');
    
    Route::post('/chat/{id}/leave', [EstudianteChatController::class, 'leaveGroup'])
        ->name('estudiante.chat.leave');
    
    Route::post('/chat/{id}/add-participant', [EstudianteChatController::class, 'addParticipant'])
        ->name('estudiante.chat.addParticipant');
    
    Route::put('/chat/{id}/update-group', [EstudianteChatController::class, 'updateGroup'])
        ->name('estudiante.chat.update-group');
        
    Route::put('/chat/message/{id}/edit', [EstudianteChatController::class, 'editMessage'])
        ->name('estudiante.chat.edit-message');
        
    Route::delete('/chat/conversation/{id}', [EstudianteChatController::class, 'deleteConversation'])
        ->name('estudiante.chat.delete-conversation');

         //HORARIO
        Route::get('/horario', [ScheduleEstudentController::class, 'index'])->name('estudiante.horario');
    Route::get('/horario/print', [ScheduleEstudentController::class, 'print'])->name('estudiante.horario.print');

             // ASISTENCIAS
        Route::get('/asistencias', [AsistenciasEstudentController::class, 'index'])
                ->name('profesor.asistencias');

            // Mis NOTAS
        Route::get('/notas', [MisNotasController::class, 'index'])->name('estudiante.notas');
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


