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
    use App\Http\Controllers\Coordinadora\SupervisionController;
    use App\Http\Controllers\Coordinadora\AttendanceSupervisionController;
    use App\Http\Controllers\Coordinadora\DisciplineRecordController;
    use App\Http\Controllers\Coordinadora\BoletinController;

    use App\Http\Controllers\Rector\RectorDashboardController;
    use App\Http\Controllers\Rector\InstitutionController;
    use App\Http\Controllers\Rector\RoleManagementController;
    use App\Http\Controllers\Rector\UserManagementController;
    use App\Http\Controllers\Rector\AuditController;

    // Al inicio, antes del grupo auth
    Route::get('/sanctum/csrf-cookie', [\Laravel\Sanctum\Http\Controllers\CsrfCookieController::class, 'show'])
        ->name('sanctum.csrf-cookie');

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
        Route::middleware(['role:rector', 'log.activity'])->prefix('rector')->group(function () {

            // Dashboard Ejecutivo
            Route::get('/dashboard', [RectorDashboardController::class, 'index'])->name('rector.dashboard');
            Route::get('/performance', [RectorDashboardController::class, 'institutionalPerformance'])->name('rector.performance');

            // GESTIÓN INSTITUCIONAL
            Route::middleware(['permission:institution.update'])->group(function () {
                Route::get('/configuracion', [InstitutionController::class, 'index'])->name('rector.configuracion');
                Route::post('/configuracion', [InstitutionController::class, 'update'])->name('rector.configuracion.actualizar');
                Route::post('/configuracion/grading-scale', [InstitutionController::class, 'configureGradingScale'])->name('rector.configuracion.grading-scale');
                Route::post('/configuracion/approval-criteria', [InstitutionController::class, 'configureApprovalCriteria'])->name('rector.configuracion.approval-criteria');
                Route::post('/configuracion/logo', [InstitutionController::class, 'uploadLogo'])->name('rector.configuracion.upload-logo');
            });

            // GESTIÓN DE ROLES Y PERMISOS
            Route::middleware(['permission:roles.manage'])->group(function () {
                Route::get('/roles', [RoleManagementController::class, 'index'])->name('rector.roles');
                Route::post('/roles', [RoleManagementController::class, 'store'])->name('rector.roles.store');
                Route::put('/roles/{id}', [RoleManagementController::class, 'update'])->name('rector.roles.update');
                Route::delete('/roles/{id}', [RoleManagementController::class, 'destroy'])->name('rector.roles.destroy');
                Route::post('/roles/{id}/permissions', [RoleManagementController::class, 'assignPermissions'])->name('rector.roles.assign');
                Route::get('/roles/{id}/permissions', [RoleManagementController::class, 'getRolePermissions'])->name('rector.roles.permissions');
            });

            // GESTIÓN DE USUARIOS (ACTIVAR/SUSPENDER)
            Route::middleware(['permission:users.view'])->group(function () {
        Route::get('/usuarios', [UserManagementController::class, 'index'])
            ->name('rector.usuarios');
        Route::get('/usuarios/{id}/history', [UserManagementController::class, 'history'])
            ->name('rector.usuarios.history');
            });

        Route::middleware(['permission:users.activate'])->group(function () {
            Route::post('/usuarios/{id}/activate', [UserManagementController::class, 'activate'])
                ->name('rector.usuarios.activate');
        });

        Route::middleware(['permission:users.suspend'])->group(function () {
            Route::post('/usuarios/{id}/suspend', [UserManagementController::class, 'suspend'])
                ->name('rector.usuarios.suspend');
            Route::post('/usuarios/{id}/force-logout', [UserManagementController::class, 'forceLogout'])
                ->name('rector.usuarios.force-logout');
        });

        Route::middleware(['permission:users.change_role'])->group(function () {
            Route::patch('/usuarios/{id}/role', [UserManagementController::class, 'assignRole'])
                ->name('rector.usuarios.role');
        });

        Route::middleware(['permission:users.reset_password'])->group(function () {
            Route::post('/usuarios/{id}/reset-password', [UserManagementController::class, 'resetPassword'])
                ->name('rector.usuarios.reset-password');
        });

            // AUDITORÍA Y LOGS
            Route::middleware(['permission:audit.view'])->group(function () {
                Route::get('/auditoria', [AuditController::class, 'index'])->name('rector.auditoria');
                Route::get('/auditoria/stats', [AuditController::class, 'statistics'])->name('rector.auditoria.stats');
                Route::get('/auditoria/recent', [AuditController::class, 'recentActivity'])->name('rector.auditoria.recent');
                Route::get('/auditoria/{id}', [AuditController::class, 'show'])->name('rector.auditoria.show');
                Route::get('/auditoria/export', [AuditController::class, 'export'])->name('rector.auditoria.export');
            });

          // RENDIMIENTO INSTITUCIONAL
           Route::middleware(['permission:reports.performance'])->group(function () {
                Route::get('/performance', [\App\Http\Controllers\Rector\PerformanceController::class, 'index'])
                    ->name('rector.performance');
                Route::get('/performance/export/pdf', [\App\Http\Controllers\Rector\PerformanceController::class, 'exportPDF'])
                    ->name('rector.performance.export.pdf');
                Route::get('/performance/export/excel', [\App\Http\Controllers\Rector\PerformanceController::class, 'exportExcel'])
                    ->name('rector.performance.export.excel');
            }); 
        });
        
        Route::get('/debug-auth', function () {
            $user = auth()->user();
            if (!$user) return response()->json(['error' => 'Not authenticated']);
            return response()->json([
                'user' => $user->only(['id', 'name', 'email']),
                'roles' => $user->getRoleNames(),
                'permissions' => $user->getAllPermissions()->pluck('name'),
                'guard' => auth()->guard()->getName(),
                'default_guard' => config('auth.defaults.guard'),
            ]);
        });
        
        //COORDINADOR
        Route::middleware(['role:coordinadora', 'log.activity'])->prefix('coordinadora')->group(function () {

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
            
            // PERIODOS ACADÉMICOS
            Route::middleware(['permission:academic_period.view'])->group(function () {
                Route::get('/periodos', [PeriodController::class, 'index'])->name('coordinadora.periodos');
            });
            
            Route::middleware(['permission:academic_period.create'])->group(function () {
                Route::post('/periodos', [PeriodController::class, 'store'])->name('coordinadora.periodos.crear');
                Route::post('/periodos/{id}/activate', [PeriodController::class, 'activate'])->name('coordinadora.periodos.activate');
            });
            
            Route::middleware(['permission:academic_period.update'])->group(function () {
                Route::put('/periodos/{id}', [PeriodController::class, 'update'])->name('coordinadora.periodos.actualizar');
                Route::patch('/periodos/{id}/toggle', [PeriodController::class, 'toggle'])->name('coordinadora.periodos.toggle');
                Route::post('/periodos/{id}/close', [PeriodController::class, 'close'])->name('coordinadora.periodos.close');
                Route::post('/periodos/{id}/reopen', [PeriodController::class, 'reopen'])->name('coordinadora.periodos.reopen');
                Route::post('/periodos/{id}/archive', [PeriodController::class, 'archive'])->name('coordinadora.periodos.archive');
            });
            
            Route::middleware(['permission:academic_period.delete'])->group(function () {
                Route::delete('/periodos/{id}', [PeriodController::class, 'destroy'])->name('coordinadora.periodos.eliminar');
            });

            // SUPERVISIÓN ACADÉMICA
            Route::middleware(['can:grades.view_all'])->group(function () {
                Route::get('/supervision', [SupervisionController::class, 'index'])->name('coordinadora.supervision');
                Route::get('/supervision/grupo', [SupervisionController::class, 'academicByGroup'])->name('coordinadora.supervision.grupo');
                Route::get('/supervision/asignatura', [SupervisionController::class, 'academicBySubject'])->name('coordinadora.supervision.asignatura');
                Route::get('/supervision/alerta-desempeno', [SupervisionController::class, 'lowPerformanceStudents'])->name('coordinadora.supervision.alerta');
                Route::get('/supervision/reporte-rendimiento', [SupervisionController::class, 'performanceReport'])->name('coordinadora.supervision.performance');
            });

            // CONTROL DE ASISTENCIA (SUPERVISIÓN)
            Route::middleware(['permission:attendance.view_all'])->group(function () {
                Route::get('/asistencia', [AttendanceSupervisionController::class, 'index'])->name('coordinadora.asistencia');
                Route::get('/asistencia/global', [AttendanceSupervisionController::class, 'globalAttendance'])->name('coordinadora.asistencia.global');
                Route::get('/asistencia/grupo/{id}', [AttendanceSupervisionController::class, 'byGroup'])->name('coordinadora.asistencia.grupo');
                Route::get('/asistencia/stats', [AttendanceSupervisionController::class, 'statistics'])->name('coordinadora.asistencia.stats');
                Route::get('/asistencia/export', [AttendanceSupervisionController::class, 'export'])->name('coordinadora.asistencia.export');
                Route::post('/asistencia/generar-alertas', [AttendanceSupervisionController::class, 'generateAlerts'])
                    ->name('coordinadora.asistencia.generar-alertas');
            });

            // GESTIÓN DISCIPLINARIA
            Route::middleware(['permission:discipline.view'])->group(function () {
                Route::get('/disciplina', [DisciplineRecordController::class, 'index'])->name('coordinadora.disciplina');
                Route::post('/disciplina', [DisciplineRecordController::class, 'store'])->name('coordinadora.disciplina.store');
                Route::put('/disciplina/{id}', [DisciplineRecordController::class, 'update'])->name('coordinadora.disciplina.update');
                Route::patch('/disciplina/{id}/close', [DisciplineRecordController::class, 'close'])->name('coordinadora.disciplina.close');
                Route::patch('/disciplina/{id}/reopen', [DisciplineRecordController::class, 'reopen'])->name('coordinadora.disciplina.reopen');
                Route::delete('/disciplina/{id}', [DisciplineRecordController::class, 'destroy'])->name('coordinadora.disciplina.destroy');
                Route::get('/disciplina/estudiante/{id}', [DisciplineRecordController::class, 'studentHistory'])->name('coordinadora.disciplina.estudiante');
                Route::get('/disciplina/stats', [DisciplineRecordController::class, 'statistics'])->name('coordinadora.disciplina.stats');
            });

            // BOLETINES
            Route::middleware(['permission:bulletins.view'])->group(function () {
                // Lista de boletines
                Route::get('/boletines', [BoletinController::class, 'index'])
                    ->name('coordinadora.boletines');
                
                // Vista previa de un boletín
                Route::get('/boletines/{id}/vista-previa', [BoletinController::class, 'vistaPrevia'])
                    ->name('coordinadora.boletines.vista-previa');
            });
            
            Route::middleware(['permission:bulletins.generate'])->group(function () {
                // Generar todos los boletines pendientes de un periodo
                Route::post('/boletines/generar-todos', [BoletinController::class, 'generarTodos'])
                    ->name('coordinadora.boletines.generar-todos');
                
                // Generar boletín individual
                Route::post('/boletines/{id}/generar', [BoletinController::class, 'generarIndividual'])
                    ->name('coordinadora.boletines.generar-individual');
                
                // Actualizar observaciones
                Route::put('/boletines/{id}/observaciones', [BoletinController::class, 'actualizarObservaciones'])
                    ->name('coordinadora.boletines.actualizar-observaciones');
            });
            
            Route::middleware(['permission:bulletins.download'])->group(function () {
                // Descargar documento DOCX
                Route::get('/boletines/{id}/documento', [BoletinController::class, 'generarDocumento'])
                    ->name('coordinadora.boletines.documento');
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

    //boletines
     Route::middleware(['permission:bulletins.view'])->group(function () {
        Route::get('/boletines', [BoletinController::class, 'index'])
            ->name('secretaria.boletines');
        
        Route::get('/boletines/{id}/vista-previa', [BoletinController::class, 'vistaPrevia'])
            ->name('secretaria.boletines.vista-previa');
    });
    
    Route::middleware(['permission:bulletins.download'])->group(function () {
        Route::get('/boletines/{id}/documento', [BoletinController::class, 'generarDocumento'])
            ->name('secretaria.boletines.documento');
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
            Route::get('/posts', [PostController::class, 'index'])->name('profesor.posts.index')->middleware('permission:posts.view');
            Route::post('/posts', [PostController::class, 'store'])->name('profesor.posts.store')->middleware('permission:posts.create');
            Route::put('/posts/{post}', [PostController::class, 'update'])->name('profesor.posts.update')->middleware('can:update,post');
            Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('profesor.posts.destroy')->middleware('can:delete,post');
            
            // Carpetas (CRUD)
            Route::post('/clases/folders', [FolderController::class, 'store'])->name('profesor.folders.store')->middleware('permission:posts.create');
            Route::put('/clases/folders/{folder}', [FolderController::class, 'update'])->name('profesor.folders.update')->middleware('can:update,folder');
            Route::delete('/clases/folders/{folder}', [FolderController::class, 'destroy'])->name('profesor.folders.destroy')->middleware('can:delete,folder');
            
            // Archivos (CRUD)
            Route::post('/clases/files', [FileController::class, 'store'])->name('profesor.files.store')->middleware('permission:posts.create');
            Route::delete('/clases/files/{file}', [FileController::class, 'destroy'])->name('profesor.files.destroy')->middleware('can:delete,file');
            
            // Reuniones (CRUD)
            Route::post('/clases/meetings', [MeetingController::class, 'store'])->name('profesor.meetings.store')->middleware('permission:meetings.create');
            Route::delete('/clases/meetings/{meeting}', [MeetingController::class, 'destroy'])->name('profesor.meetings.destroy')->middleware('can:end,meeting');
        
        // TAREAS
       Route::prefix('clases')->name('profesor.clases.')->group(function () {
        // Lista de tareas
        Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index')->middleware('permission:assignments.view');
        
        // Crear tarea
        Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store')->middleware('permission:assignments.create');
        
        // Ver detalle de tarea
        Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show')->middleware('can:view,task');
        
        // Actualizar tarea
        Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update')->middleware('can:update,task');
        
        // Eliminar tarea
        Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy')->middleware('can:delete,task');
        
        // Eliminar adjunto de tarea
        Route::delete('/tasks/attachments/{attachment}', [TaskController::class, 'deleteAttachment'])
            ->name('tasks.deleteAttachment');
        
        // Calificar una entrega
        Route::post('/tasks/submissions/{submission}/grade', [TaskController::class, 'gradeSubmission'])
            ->name('tasks.gradeSubmission')->middleware('can:grade,task');

            //actualizar entrega
        Route::put('/tasks/submissions/{submission}/grade', [TaskController::class, 'gradeSubmission'])
        ->name('tasks.updateGrade')->middleware('can:grade,task');
    });
            
            //HORARIO
            Route::get('/horario', [ScheduleTeacherController::class, 'index'])->name('profesor.horario')->middleware('permission:schedules.view');
     Route::get('/horario/print', [ScheduleTeacherController::class, 'print'])->name('profesor.horario.print')->middleware('permission:schedules.print');
 
             // ASISTENCIAS
             Route::get('/asistencias', [AsistenciasController::class, 'index'])
                 ->name('profesor.asistencias')->middleware('permission:attendances.view');
             Route::post('/asistencias/bulk', [AsistenciasController::class, 'bulkStore'])
                 ->name('profesor.asistencias.bulk')->middleware('permission:attendances.create');
             Route::delete('/asistencias/{id}', [AsistenciasController::class, 'destroy'])
                 ->name('profesor.asistencias.destroy')->middleware('permission:attendances.update');
 
 
             // REGISTRAR NOTAS - RUTAS COMPLETAS
             Route::prefix('registrarNotas')->name('profesor.registrarNotas')->group(function () {
                 // Vista principal (GET /profesor/registrarNotas)
                 Route::get('/', [RegistrarNotasController::class, 'index'])->name('')->middleware('permission:grades.view');
 
                 // Acciones de evaluaciones manuales
                 Route::post('/manual/create', [RegistrarNotasController::class, 'createManualGrade'])->name('manual.create')->middleware('permission:manual_grades.create');
                 Route::post('/manual/score', [RegistrarNotasController::class, 'saveManualGradeScore'])->name('manual.score')->middleware('permission:manual_grades.update');
                 Route::delete('/manual/{id}', [RegistrarNotasController::class, 'deleteManualGrade'])->name('manual.delete')->middleware('permission:manual_grades.update');
             });
        });





//ESTUDIANTE
        Route::middleware('role:estudiante')->prefix('estudiante')->group(function () {
            Route::get('/dashboard', [EstudianteDashboardController::class, 'index'])->name('estudiante.dashboard');

            // Clases
            Route::get('/clases', [EstudianteClasesController::class, 'index'])->name('estudiante.clases.index');
            Route::get('/clases/{subject_id}/{group_id}', [EstudianteClasesController::class, 'show'])->name('estudiante.clases.show');
                    
            // Publicaciones
            Route::post('/posts', [EstudiantePostController::class, 'store'])->name('estudiante.posts.store')->middleware('permission:posts.create');
            Route::put('/posts/{post}', [EstudiantePostController::class, 'update'])->name('estudiante.posts.update')->middleware('can:update,post');
            Route::delete('/posts/{post}', [EstudiantePostController::class, 'destroy'])->name('estudiante.posts.destroy')->middleware('can:delete,post');
                    
            // Tareas - Rutas existentes


            Route::prefix('tasks')->name('tasks.')->group(function () {
        // Lista de tareas
        Route::get('/', [EstudianteTaskController::class, 'index'])->name('index')->middleware('permission:assignments.view');
        
        // Ver detalle de tarea
        Route::get('/{task}', [EstudianteTaskController::class, 'show'])->name('show')->middleware('can:view,task');
        
        // Enviar o editar entrega
        Route::post('/submit', [EstudianteTaskController::class, 'submit'])->name('submit')->middleware('permission:assignments.submit');
        
        // Obtener compañeros disponibles
        Route::get('/{task}/available-classmates', [EstudianteTaskController::class, 'getAvailableClassmates'])
            ->name('available-classmates')->middleware('can:view,task');
        
        // Eliminar archivo de entrega
        Route::delete('/files/{file}', [EstudianteTaskController::class, 'deleteFile'])
            ->name('files.delete');
        
        // Remover miembro del grupo
        Route::delete('/members/{member}', [EstudianteTaskController::class, 'removeMember'])
            ->name('members.remove');
        
        // Eliminar entrega completa
        Route::delete('/submissions/{submission}', [EstudianteTaskController::class, 'deleteSubmission'])
            ->name('submissions.delete')->middleware('can:delete,submission');
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
        Route::get('/horario', [ScheduleEstudentController::class, 'index'])->name('estudiante.horario')->middleware('permission:schedules.view');
    Route::get('/horario/print', [ScheduleEstudentController::class, 'print'])->name('estudiante.horario.print')->middleware('permission:schedules.print');

             // ASISTENCIAS
        Route::get('/asistencias', [AsistenciasEstudentController::class, 'index'])
                ->name('profesor.asistencias')->middleware('permission:attendances.view');

            // Mis NOTAS
        Route::get('/notas', [MisNotasController::class, 'index'])->name('estudiante.notas')->middleware('permission:grades.view');


        //boletin
        Route::middleware(['permission:bulletins.view'])->group(function () {
        // Ver boletines propios
        Route::get('/boletines', [BoletinController::class, 'index'])
            ->name('estudiante.boletines');
        
        Route::get('/boletines/{id}/vista-previa', [BoletinController::class, 'vistaPrevia'])
            ->name('estudiante.boletines.vista-previa');
    });
    
    Route::middleware(['permission:bulletins.download'])->group(function () {
        Route::get('/boletines/{id}/documento', [BoletinController::class, 'generarDocumento'])
            ->name('estudiante.boletines.documento');
    });
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


