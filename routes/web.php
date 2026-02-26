<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\WelcomeController;

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
use App\Http\Controllers\Estudiante\Estudiantepostcontroller as EstudiantePostController;
use App\Http\Controllers\Estudiante\Estudiantetaskcontroller as EstudianteTaskController;
use App\Http\Controllers\Estudiante\EstudianteChatController;
use App\Http\Controllers\Estudiante\ScheduleEstudentController;
use App\Http\Controllers\Estudiante\AsistenciasEstudentController;
use App\Http\Controllers\Estudiante\MisNotasController;
use App\Http\Controllers\Estudiante\EstudianteDisciplinaController;

use App\Http\Controllers\Coordinadora\ScheduleController;
use App\Http\Controllers\Coordinadora\PeriodController;
use App\Http\Controllers\Coordinadora\SupervisionController;
use App\Http\Controllers\Coordinadora\AttendanceSupervisionController;
use App\Http\Controllers\Coordinadora\DisciplineRecordController;
use App\Http\Controllers\Coordinadora\BoletinController;
use App\Http\Controllers\Coordinadora\Coordinadoradashboardcontroller as CoordinadoraDashboardController;

use App\Http\Controllers\Rector\RectorDashboardController;
use App\Http\Controllers\Rector\SchoolSettingController;
use App\Http\Controllers\Rector\RoleManagementController;
use App\Http\Controllers\Rector\UserManagementController;
use App\Http\Controllers\Rector\AuditController;

// ─────────────────────────────────────────────
// CSRF (Sanctum)
// ─────────────────────────────────────────────
Route::get('/sanctum/csrf-cookie', [\Laravel\Sanctum\Http\Controllers\CsrfCookieController::class, 'show'])
    ->name('sanctum.csrf-cookie');

// ─────────────────────────────────────────────
// PÚBLICA
// ─────────────────────────────────────────────
Route::get('/', [WelcomeController::class, 'index'])->name('home');

// ─────────────────────────────────────────────
// AUTENTICACIÓN
// ─────────────────────────────────────────────
Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
Route::post('/login', [LoginController::class, 'login'])->middleware('throttle:login');
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// ─────────────────────────────────────────────
// RUTAS PROTEGIDAS
// ─────────────────────────────────────────────
Route::middleware(['auth', 'check.password', 'throttle:authenticated'])->group(function () {

    // ── DEBUG (solo en local, eliminar en producción) ──────────────────────
    Route::get('/debug-auth', function () {
        $user = auth()->user();
        if (!$user) return response()->json(['error' => 'Not authenticated']);
        return response()->json([
            'user'        => $user->only(['id', 'name', 'email']),
            'roles'       => $user->getRoleNames(),
            'permissions' => $user->getAllPermissions()->pluck('name'),
            'guard'       => auth()->guard()->getName(),
        ]);
    })->middleware('role:rector'); // ← restringir en producción

    // ── PERFIL ─────────────────────────────────────────────────────────────
    Route::get('/perfil/editar', fn () => inertia('Perfil/EditarPerfil'))->name('perfil.editar');
    Route::post('/perfil/actualizar', [ProfileController::class, 'update'])
        ->name('perfil.update')
        ->middleware('throttle:create-content');

    // ══════════════════════════════════════════════════════════════════════
    //  RECTOR
    // ══════════════════════════════════════════════════════════════════════
    Route::middleware(['role:rector', 'log.activity'])->prefix('rector')->group(function () {

        Route::get('/dashboard', [RectorDashboardController::class, 'index'])->name('rector.dashboard');

        // Gestión institucional
        Route::middleware('permission:institution.update')->group(function () {
            Route::get('/configuracion', [SchoolSettingController::class, 'index'])->name('rector.configuracion');
            Route::post('/configuracion', [SchoolSettingController::class, 'update'])->name('rector.configuracion.actualizar');
            Route::post('/configuracion/grading-scale', [SchoolSettingController::class, 'configureGradingScale'])->name('rector.configuracion.grading-scale');
            Route::post('/configuracion/approval-criteria', [SchoolSettingController::class, 'configureApprovalCriteria'])->name('rector.configuracion.approval-criteria');
            Route::post('/configuracion/logo', [SchoolSettingController::class, 'uploadLogo'])->name('rector.configuracion.upload-logo');
        });

        // Roles y permisos — {role} resuelto por RoleManagementController vía findOrFail interno
        // o idealmente bind Route::model('role', \Spatie\Permission\Models\Role::class)
        Route::middleware('permission:roles.manage')->group(function () {
            Route::get('/roles', [RoleManagementController::class, 'index'])->name('rector.roles');
            Route::post('/roles', [RoleManagementController::class, 'store'])->name('rector.roles.store');
            Route::put('/roles/{role}', [RoleManagementController::class, 'update'])->name('rector.roles.update');
            Route::delete('/roles/{role}', [RoleManagementController::class, 'destroy'])->name('rector.roles.destroy');
            Route::post('/roles/{role}/permissions', [RoleManagementController::class, 'assignPermissions'])->name('rector.roles.assign');
            Route::get('/roles/{role}/permissions', [RoleManagementController::class, 'getRolePermissions'])->name('rector.roles.permissions');
        });

        // Gestión de usuarios — Route Model Binding con User
        Route::middleware('permission:users.view')->group(function () {
            Route::get('/usuarios', [UserManagementController::class, 'index'])->name('rector.usuarios');
            Route::get('/usuarios/{user}/history', [UserManagementController::class, 'history'])->name('rector.usuarios.history');
        });

        Route::middleware(['permission:users.activate', 'throttle:sensitive'])->group(function () {
            // Capa 3: can:activate,user en controller con $this->authorize('activate', $user)
            Route::post('/usuarios/{user}/activate', [UserManagementController::class, 'activate'])->name('rector.usuarios.activate');
        });

        Route::middleware(['permission:users.suspend', 'throttle:sensitive'])->group(function () {
            Route::post('/usuarios/{user}/suspend', [UserManagementController::class, 'suspend'])->name('rector.usuarios.suspend');
            Route::post('/usuarios/{user}/force-logout', [UserManagementController::class, 'forceLogout'])->name('rector.usuarios.force-logout');
        });

        Route::middleware('permission:users.change_role')->group(function () {
            Route::patch('/usuarios/{user}/role', [UserManagementController::class, 'assignRole'])->name('rector.usuarios.role');
        });

        Route::middleware(['permission:users.reset_password', 'throttle:sensitive'])->group(function () {
            Route::post('/usuarios/{user}/reset-password', [UserManagementController::class, 'resetPassword'])->name('rector.usuarios.reset-password');
        });

        // Auditoría — {activityLog} con RMB
        Route::middleware('permission:audit.view')->group(function () {
            Route::get('/auditoria', [AuditController::class, 'index'])->name('rector.auditoria');
            Route::get('/auditoria/stats', [AuditController::class, 'statistics'])->name('rector.auditoria.stats');
            Route::get('/auditoria/recent', [AuditController::class, 'recentActivity'])->name('rector.auditoria.recent');
            Route::get('/auditoria/export', [AuditController::class, 'export'])->name('rector.auditoria.export');
            Route::get('/auditoria/{activityLog}', [AuditController::class, 'show'])->name('rector.auditoria.show');
        });

        // Rendimiento institucional
        Route::middleware('permission:reports.performance')->group(function () {
            Route::get('/performance', [\App\Http\Controllers\Rector\PerformanceController::class, 'index'])->name('rector.performance');
            Route::get('/performance/export/pdf', [\App\Http\Controllers\Rector\PerformanceController::class, 'exportPDF'])->name('rector.performance.export.pdf');
            Route::get('/performance/export/excel', [\App\Http\Controllers\Rector\PerformanceController::class, 'exportExcel'])->name('rector.performance.export.excel');
        });
    });

    // ══════════════════════════════════════════════════════════════════════
    //  COORDINADORA
    // ══════════════════════════════════════════════════════════════════════
    Route::middleware(['role:coordinadora', 'log.activity'])->prefix('coordinadora')->group(function () {

        Route::get('/dashboard', [CoordinadoraDashboardController::class, 'index'])->name('coordinadora.dashboard');

        // HORARIOS — {schedule} con RMB
        Route::middleware('permission:schedules.view')->group(function () {
            Route::get('/horarios', [ScheduleController::class, 'index'])->name('coordinadora.horarios');
        });
        Route::middleware('permission:schedules.create')->group(function () {
            Route::post('/horarios', [ScheduleController::class, 'store'])->name('coordinadora.horarios.store');
            Route::post('/horarios/generar', [ScheduleController::class, 'generate'])->name('coordinadora.horarios.generate');
            Route::post('/horarios/add-slot', [ScheduleController::class, 'addSlot'])->name('coordinadora.horarios.add-slot');
        });
        Route::middleware('permission:schedules.update')->group(function () {
            Route::put('/horarios/update-slot', [ScheduleController::class, 'updateSlot'])->name('coordinadora.horarios.update-slot');
            Route::put('/horarios/{schedule}', [ScheduleController::class, 'update'])->name('coordinadora.horarios.update');
            Route::post('/horarios/move', [ScheduleController::class, 'move'])->name('coordinadora.horarios.move');
        });
        Route::middleware('permission:schedules.delete')->group(function () {
            Route::delete('/horarios/delete-slot', [ScheduleController::class, 'deleteSlot'])->name('coordinadora.horarios.delete-slot');
            Route::delete('/horarios/{schedule}', [ScheduleController::class, 'destroy'])->name('coordinadora.horarios.destroy');
        });
        Route::middleware('permission:schedules.print')->group(function () {
            Route::get('/horarios/print', [ScheduleController::class, 'print'])->name('coordinadora.horarios.print');
        });

        // PERIODOS — {academicPeriod} con RMB
        Route::middleware('permission:academic_period.view')->group(function () {
            Route::get('/periodos', [PeriodController::class, 'index'])->name('coordinadora.periodos');
        });
        Route::middleware('permission:academic_period.create')->group(function () {
            Route::post('/periodos', [PeriodController::class, 'store'])->name('coordinadora.periodos.crear');
            Route::post('/periodos/{academicPeriod}/activate', [PeriodController::class, 'activate'])
                ->name('coordinadora.periodos.activate')
                ->middleware('can:activate,academicPeriod');
        });
        Route::middleware('permission:academic_period.update')->group(function () {
            Route::put('/periodos/{academicPeriod}', [PeriodController::class, 'update'])
                ->name('coordinadora.periodos.actualizar')
                ->middleware('can:update,academicPeriod');
            Route::patch('/periodos/{academicPeriod}/toggle', [PeriodController::class, 'toggle'])
                ->name('coordinadora.periodos.toggle');
            Route::post('/periodos/{academicPeriod}/close', [PeriodController::class, 'close'])
                ->name('coordinadora.periodos.close')
                ->middleware('can:close,academicPeriod');
            Route::post('/periodos/{academicPeriod}/reopen', [PeriodController::class, 'reopen'])
                ->name('coordinadora.periodos.reopen')
                ->middleware('can:reopen,academicPeriod');
            Route::post('/periodos/{academicPeriod}/archive', [PeriodController::class, 'archive'])
                ->name('coordinadora.periodos.archive')
                ->middleware('can:archive,academicPeriod');
        });
        Route::middleware('permission:academic_period.delete')->group(function () {
            Route::delete('/periodos/{academicPeriod}', [PeriodController::class, 'destroy'])
                ->name('coordinadora.periodos.eliminar')
                ->middleware('can:delete,academicPeriod');
        });

        // SUPERVISIÓN ACADÉMICA — sin {id}, solo lectura de datos globales
        Route::middleware('can:grades.view_all')->group(function () {
            Route::get('/supervision', [SupervisionController::class, 'index'])->name('coordinadora.supervision');
            Route::get('/supervision/grupo', [SupervisionController::class, 'academicByGroup'])->name('coordinadora.supervision.grupo');
            Route::get('/supervision/asignatura', [SupervisionController::class, 'academicBySubject'])->name('coordinadora.supervision.asignatura');
            Route::get('/supervision/alerta-desempeno', [SupervisionController::class, 'lowPerformanceStudents'])->name('coordinadora.supervision.alerta');
            Route::get('/supervision/reporte-rendimiento', [SupervisionController::class, 'performanceReport'])->name('coordinadora.supervision.performance');
        });

        // ASISTENCIA SUPERVISIÓN — {group} con RMB
        Route::middleware(['permission:attendance.view_all', 'throttle:bulk-action'])->group(function () {
            Route::get('/asistencia', [AttendanceSupervisionController::class, 'index'])->name('coordinadora.asistencia');
            Route::get('/asistencia/global', [AttendanceSupervisionController::class, 'globalAttendance'])->name('coordinadora.asistencia.global');
            Route::get('/asistencia/grupo/{group}', [AttendanceSupervisionController::class, 'byGroup'])
                ->name('coordinadora.asistencia.grupo')
                ->middleware('can:view-group-attendance,group'); // Gate definido en AuthServiceProvider
            Route::get('/asistencia/stats', [AttendanceSupervisionController::class, 'statistics'])->name('coordinadora.asistencia.stats');
            Route::get('/asistencia/export', [AttendanceSupervisionController::class, 'export'])->name('coordinadora.asistencia.export');
            Route::post('/asistencia/generar-alertas', [AttendanceSupervisionController::class, 'generateAlerts'])->name('coordinadora.asistencia.generar-alertas');
        });

        // DISCIPLINA — {disciplineRecord} con RMB + can: middleware
        Route::middleware('permission:discipline.view')->group(function () {
            Route::get('/disciplina', [DisciplineRecordController::class, 'index'])->name('coordinadora.disciplina');
            Route::post('/disciplina', [DisciplineRecordController::class, 'store'])->name('coordinadora.disciplina.store');
            Route::put('/disciplina/{disciplineRecord}', [DisciplineRecordController::class, 'update'])
                ->name('coordinadora.disciplina.update')
                ->middleware('can:update,disciplineRecord');
            Route::patch('/disciplina/{disciplineRecord}/close', [DisciplineRecordController::class, 'close'])
                ->name('coordinadora.disciplina.close')
                ->middleware('can:close,disciplineRecord');
            Route::patch('/disciplina/{disciplineRecord}/reopen', [DisciplineRecordController::class, 'reopen'])
                ->name('coordinadora.disciplina.reopen')
                ->middleware('can:reopen,disciplineRecord');
            Route::delete('/disciplina/{disciplineRecord}', [DisciplineRecordController::class, 'destroy'])
                ->name('coordinadora.disciplina.destroy')
                ->middleware('can:delete,disciplineRecord');
            // {user} = el estudiante cuyo historial se consulta
            Route::get('/disciplina/estudiante/{user}', [DisciplineRecordController::class, 'studentHistory'])
                ->name('coordinadora.disciplina.estudiante');
            Route::get('/disciplina/stats', [DisciplineRecordController::class, 'statistics'])->name('coordinadora.disciplina.stats');
        });

        // BOLETINES — {boletin} con RMB + can: middleware
        Route::middleware('permission:bulletins.view')->group(function () {
            Route::get('/boletines', [BoletinController::class, 'index'])->name('coordinadora.boletines');
            Route::get('/boletines/{boletin}/vista-previa', [BoletinController::class, 'vistaPrevia'])
                ->name('coordinadora.boletines.vista-previa')
                ->middleware('can:view,boletin');
        });
        Route::middleware(['permission:bulletins.confirm', 'throttle:bulk-action'])->group(function () {
            Route::patch('/boletines/{boletin}/confirmar', [BoletinController::class, 'confirmar'])
                ->name('coordinadora.boletines.confirmar')
                ->middleware('can:confirm,boletin');
            Route::post('/boletines/confirmar-todos', [BoletinController::class, 'confirmarTodos'])->name('coordinadora.boletines.confirmar-todos');
        });
        Route::middleware(['permission:bulletins.generate', 'throttle:bulk-action'])->group(function () {
            Route::post('/boletines/generar-todos', [BoletinController::class, 'generarTodos'])->name('coordinadora.boletines.generar-todos');
            Route::post('/boletines/{boletin}/generar', [BoletinController::class, 'generarIndividual'])
                ->name('coordinadora.boletines.generar-individual');
            Route::put('/boletines/{boletin}/observaciones', [BoletinController::class, 'actualizarObservaciones'])
                ->name('coordinadora.boletines.actualizar-observaciones')
                ->middleware('can:updateObservations,boletin');
        });
        Route::middleware('permission:bulletins.download')->group(function () {
            Route::get('/boletines/{boletin}/documento', [BoletinController::class, 'generarDocumento'])
                ->name('coordinadora.boletines.documento')
                ->middleware('can:download,boletin');
        });
    });

    // ══════════════════════════════════════════════════════════════════════
    //  SECRETARIA
    // ══════════════════════════════════════════════════════════════════════
    Route::middleware('role:secretaria')->prefix('secretaria')->group(function () {

        Route::get('/dashboard', [DashboardController::class, 'index'])->name('secretaria.dashboard');

        // USUARIOS — {user} con RMB
        Route::middleware('permission:users.view')->group(function () {
            Route::get('/usuarios', [UsuarioController::class, 'index'])->name('secretaria.usuarios');
        });
        Route::middleware(['permission:users.create', 'throttle:create-content'])->group(function () {
            Route::post('/usuarios', [UsuarioController::class, 'store'])->name('usuarios.store');
        });
        Route::middleware(['permission:users.update', 'throttle:create-content'])->group(function () {
            Route::put('/usuarios/{user}', [UsuarioController::class, 'update'])
                ->name('usuarios.update')
                ->middleware('can:update,user');
            Route::put('/usuarios/{user}/toggle', [UsuarioController::class, 'toggle'])
                ->name('usuarios.toggle')
                ->middleware('can:toggle,user');
        });
        Route::middleware('permission:users.delete')->group(function () {
            Route::delete('/usuarios/{user}', [UsuarioController::class, 'destroy'])
                ->name('usuarios.destroy')
                ->middleware('can:delete,user');
        });

        // ESTUDIANTES — {student} resuelto como User
        Route::middleware('permission:students.view')->group(function () {
            Route::get('/estudiantes', [StudentController::class, 'index'])->name('secretaria.estudiantes');
            Route::get('/estudiantes/export/excel', [StudentController::class, 'exportExcel'])->name('estudiantes.export.excel');
            Route::get('/estudiantes/export/pdf', [StudentController::class, 'exportPDF'])->name('estudiantes.export.pdf');
        });
        Route::middleware('permission:students.update')->group(function () {
            // Nota: {student} se resuelve como User en el controller
            Route::put('/estudiantes/{student}', [StudentController::class, 'update'])
                ->name('estudiantes.update');
            Route::put('/estudiantes/{student}/toggle', [StudentController::class, 'toggle'])
                ->name('estudiantes.toggle');
        });

        // PROFESORES — {teacher} resuelto como User
        Route::middleware('permission:teachers.view')->group(function () {
            Route::get('/profesores', [TeacherController::class, 'index'])->name('secretaria.profesores');
        });
        Route::middleware('permission:teachers.update')->group(function () {
            Route::put('/profesores/{teacher}', [TeacherController::class, 'update'])->name('profesores.update');
            Route::put('/profesores/{teacher}/toggle', [TeacherController::class, 'toggle'])->name('profesores.toggle');
        });

        // ASIGNATURAS — {subject} con RMB
        Route::middleware('permission:subjects.view')->group(function () {
            Route::get('/asignaturas', [SubjectController::class, 'index'])->name('secretaria.asignaturas');
        });
        Route::middleware('permission:subjects.create')->group(function () {
            Route::post('/asignaturas', [SubjectController::class, 'store'])->name('asignaturas.store');
        });
        Route::middleware('permission:subjects.update')->group(function () {
            Route::put('/asignaturas/{subject}', [SubjectController::class, 'update'])
                ->name('asignaturas.update')
                ->middleware('can:update,subject');
        });
        Route::middleware('permission:subjects.delete')->group(function () {
            Route::delete('/asignaturas/{subject}', [SubjectController::class, 'destroy'])
                ->name('asignaturas.destroy')
                ->middleware('can:delete,subject');
        });

        // GRUPOS — {group} con RMB
        Route::middleware('permission:groups.view')->group(function () {
            Route::get('/grupos', [GrupoController::class, 'index'])->name('secretaria.grupos');
        });
        Route::middleware('permission:groups.create')->group(function () {
            Route::post('/grupos', [GrupoController::class, 'store'])->name('grupos.store');
        });
        Route::middleware('permission:groups.update')->group(function () {
            Route::put('/grupos/{group}', [GrupoController::class, 'update'])
                ->name('grupos.update')
                ->middleware('can:update,group');
        });
        Route::middleware('permission:groups.delete')->group(function () {
            Route::delete('/grupos/{group}', [GrupoController::class, 'destroy'])
                ->name('grupos.destroy')
                ->middleware('can:delete,group');
        });

        // HORARIOS (solo lectura)
        Route::middleware('permission:schedules.view')->group(function () {
            Route::get('/horarios', [ScheduleController::class, 'index'])->name('secretaria.horarios');
        });
        Route::middleware('permission:schedules.print')->group(function () {
            Route::get('/horarios/print', [ScheduleController::class, 'print'])->name('secretaria.horarios.print');
        });

        // BOLETINES — {boletin} con RMB
        Route::middleware('permission:bulletins.view')->group(function () {
            Route::get('/boletines', [BoletinController::class, 'index'])->name('secretaria.boletines');
            Route::get('/boletines/{boletin}/vista-previa', [BoletinController::class, 'vistaPrevia'])
                ->name('secretaria.boletines.vista-previa')
                ->middleware('can:view,boletin');
        });
        Route::middleware('permission:bulletins.download')->group(function () {
            Route::get('/boletines/{boletin}/documento', [BoletinController::class, 'generarDocumento'])
                ->name('secretaria.boletines.documento')
                ->middleware('can:download,boletin');
        });
    });

    // ══════════════════════════════════════════════════════════════════════
    //  PROFESOR
    // ══════════════════════════════════════════════════════════════════════
    Route::middleware('role:profesor')->prefix('profesor')->group(function () {

        Route::get('/dashboard', [TeacherDashboardController::class, 'index'])->name('profesor.dashboard');

        // CHAT — {conversation} y {message} con RMB + Policy
        Route::prefix('chat')->name('profesor.chat.')->group(function () {
            Route::get('/', [ChatController::class, 'index'])->name('index');
            Route::get('/conversations/json', [ChatController::class, 'conversationsJson'])->name('conversations.json');
            Route::get('/search', [ChatController::class, 'searchUsers'])->name('search');
            Route::post('/create', [ChatController::class, 'createConversation'])->name('create');

            // {conversation} → resuelto como Conversation model
            Route::get('/{conversation}', [ChatController::class, 'getConversation'])
                ->name('show')
                ->middleware('can:view,conversation');

            Route::post('/{conversation}/message', [ChatController::class, 'sendMessage'])
                ->name('message')
                ->middleware(['can:sendMessage,conversation', 'throttle:chat']);

            Route::post('/{conversation}/read', [ChatController::class, 'markAsRead'])
                ->name('read')
                ->middleware(['can:markAsRead,conversation', 'throttle:chat']);

            Route::post('/{conversation}/leave', [ChatController::class, 'leaveGroup'])
                ->name('leave')
                ->middleware(['can:leave,conversation', 'throttle:chat']);

            Route::post('/{conversation}/add-participant', [ChatController::class, 'addParticipant'])
                ->name('addParticipant')
                ->middleware('can:addParticipant,conversation');

            Route::put('/{conversation}/update-group', [ChatController::class, 'updateGroup'])
                ->name('update-group')
                ->middleware('can:updateGroup,conversation');

            Route::delete('/{conversation}', [ChatController::class, 'deleteConversation'])
                ->name('delete-conversation')
                ->middleware('can:delete,conversation');

            // {message} → resuelto como Message model
            Route::put('/message/{message}/edit', [ChatController::class, 'editMessage'])
                ->name('edit-message')
                ->middleware(['can:update,message', 'throttle:chat']);

            Route::delete('/message/{message}', [ChatController::class, 'deleteMessage'])
                ->name('delete-message')
                ->middleware(['can:delete,message', 'throttle:chat']);
        });

        // CLASES
        Route::get('/clases', [ClassController::class, 'index'])->name('profesor.clases.index');
        Route::get('/clases/detalle', [ClassController::class, 'show'])->name('profesor.clases.show');

        // PUBLICACIONES — {post} con RMB (ya correcto)
        Route::get('/posts', [PostController::class, 'index'])->name('profesor.posts.index')->middleware('permission:posts.view');
        Route::post('/posts', [PostController::class, 'store'])->name('profesor.posts.store')->middleware(['permission:posts.create', 'throttle:create-content']);
        Route::put('/posts/{post}', [PostController::class, 'update'])->name('profesor.posts.update')->middleware('can:update,post');
        Route::delete('/posts/{post}', [PostController::class, 'destroy'])->name('profesor.posts.destroy')->middleware('can:delete,post');
        Route::get('/attachments/{attachment}/download', [PostController::class, 'download']);

        // CARPETAS — {folder} con RMB (ya correcto)
        Route::post('/clases/folders', [FolderController::class, 'store'])->name('profesor.folders.store')->middleware(['permission:posts.create', 'throttle:create-content']);
        Route::put('/clases/folders/{folder}', [FolderController::class, 'update'])->name('profesor.folders.update')->middleware('can:update,folder');
        Route::delete('/clases/folders/{folder}', [FolderController::class, 'destroy'])->name('profesor.folders.destroy')->middleware('can:delete,folder');

        // ARCHIVOS — {file} con RMB (ya correcto)
        Route::post('/clases/files', [FileController::class, 'store'])->name('profesor.files.store')->middleware(['permission:posts.create', 'throttle:upload']);
        Route::get('/files/{file}/download', [FileController::class, 'download']);
        Route::delete('/clases/files/{file}', [FileController::class, 'destroy'])->name('profesor.files.destroy')->middleware('can:delete,file');

        // REUNIONES — {meeting} con RMB (ya correcto)
        Route::post('/clases/meetings', [MeetingController::class, 'store'])->name('profesor.meetings.store')->middleware(['permission:meetings.create', 'throttle:create-content']);
        Route::delete('/clases/meetings/{meeting}', [MeetingController::class, 'destroy'])->name('profesor.meetings.destroy')->middleware('can:end,meeting');

        // TAREAS — {task} y {submission} con RMB (ya correcto)
        Route::prefix('clases')->name('profesor.clases.')->group(function () {
            Route::get('/tasks', [TaskController::class, 'index'])->name('tasks.index')->middleware('permission:assignments.view');
            Route::post('/tasks', [TaskController::class, 'store'])->name('tasks.store')->middleware(['permission:assignments.create', 'throttle:create-content']);
            Route::get('/tasks/{task}', [TaskController::class, 'show'])->name('tasks.show')->middleware('can:view,task');
            Route::put('/tasks/{task}', [TaskController::class, 'update'])->name('tasks.update')->middleware(['can:update,task', 'throttle:update']);
            Route::delete('/tasks/{task}', [TaskController::class, 'destroy'])->name('tasks.destroy')->middleware(['can:delete,task', 'throttle:update']);
            Route::delete('/tasks/attachments/{attachment}', [TaskController::class, 'deleteAttachment'])->name('tasks.deleteAttachment');
            Route::post('/tasks/submissions/{submission}/grade', [TaskController::class, 'gradeSubmission'])
                ->name('tasks.gradeSubmission')
                ->middleware('can:view,submission'); // el controller valida internamente teacher_id
            Route::put('/tasks/submissions/{submission}/grade', [TaskController::class, 'gradeSubmission'])
                ->name('tasks.updateGrade')
                ->middleware('can:view,submission');
        });

        // HORARIO
        Route::get('/horario', [ScheduleTeacherController::class, 'index'])->name('profesor.horario')->middleware('permission:schedules.view');
        Route::get('/horario/print', [ScheduleTeacherController::class, 'print'])->name('profesor.horario.print')->middleware('permission:schedules.print');

        // ASISTENCIAS — {attendance} con RMB
        Route::get('/asistencias', [AsistenciasController::class, 'index'])->name('profesor.asistencias')->middleware('permission:attendances.view');
        Route::post('/asistencias/bulk', [AsistenciasController::class, 'bulkStore'])->name('profesor.asistencias.bulk')->middleware(['permission:attendances.create', 'throttle:bulk-action']);
        Route::delete('/asistencias/{attendance}', [AsistenciasController::class, 'destroy'])
            ->name('profesor.asistencias.destroy')
            ->middleware(['can:delete,attendance', 'throttle:update']);

        // REGISTRAR NOTAS — {manualGrade} con RMB
        Route::prefix('registrarNotas')->name('profesor.registrarNotas')->group(function () {
            Route::get('/', [RegistrarNotasController::class, 'index'])->name('')->middleware('permission:grades.view');
            Route::post('/manual/create', [RegistrarNotasController::class, 'createManualGrade'])->name('manual.create')->middleware('permission:manual_grades.create');
            Route::post('/manual/score', [RegistrarNotasController::class, 'saveManualGradeScore'])->name('manual.score')->middleware('permission:manual_grades.update');
            Route::delete('/manual/{manualGrade}', [RegistrarNotasController::class, 'deleteManualGrade'])
                ->name('manual.delete')
                ->middleware(['can:delete,manualGrade', 'permission:manual_grades.update']);
        });
    });

    // ══════════════════════════════════════════════════════════════════════
    //  ESTUDIANTE
    // ══════════════════════════════════════════════════════════════════════
    Route::middleware('role:estudiante')->prefix('estudiante')->group(function () {

        Route::get('/dashboard', [EstudianteDashboardController::class, 'index'])->name('estudiante.dashboard');

        // CLASES — {subject_id}/{group_id} validados con Gate 'access-class' en controller
        Route::get('/clases', [EstudianteClasesController::class, 'index'])->name('estudiante.clases.index');
        Route::get('/clases/{subject}/{group}', [EstudianteClasesController::class, 'show'])->name('estudiante.clases.show');

        // PUBLICACIONES — {post} con RMB (ya correcto)
        Route::post('/posts', [EstudiantePostController::class, 'store'])->name('estudiante.posts.store')->middleware(['permission:posts.create', 'throttle:create-content']);
        Route::put('/posts/{post}', [EstudiantePostController::class, 'update'])->name('estudiante.posts.update')->middleware('can:update,post');
        Route::delete('/posts/{post}', [EstudiantePostController::class, 'destroy'])->name('estudiante.posts.destroy')->middleware('can:delete,post');
        Route::get('/attachments/{attachment}/download', [EstudiantePostController::class, 'download']);

        // TAREAS — {task} y {submission} con RMB (ya correcto)
        Route::prefix('tasks')->name('tasks.')->group(function () {
            Route::get('/', [EstudianteTaskController::class, 'index'])->name('index')->middleware('permission:assignments.view');
            Route::get('/{task}', [EstudianteTaskController::class, 'show'])->name('show')->middleware('can:view,task');
            Route::post('/submit', [EstudianteTaskController::class, 'submit'])->name('submit')->middleware(['permission:assignments.submit', 'throttle:task-submit']);
            Route::get('/{task}/available-classmates', [EstudianteTaskController::class, 'getAvailableClassmates'])->name('available-classmates')->middleware('can:view,task');
            Route::delete('/files/{file}', [EstudianteTaskController::class, 'deleteFile'])->name('files.delete');
            Route::delete('/members/{member}', [EstudianteTaskController::class, 'removeMember'])->name('members.remove');
            Route::delete('/submissions/{submission}', [EstudianteTaskController::class, 'deleteSubmission'])
                ->name('submissions.delete')
                ->middleware('can:delete,submission');
        });

        // DISCIPLINA (lectura propia)
        Route::middleware('permission:discipline.view')->group(function () {
            Route::get('/disciplina', [EstudianteDisciplinaController::class, 'index'])->name('estudiante.disciplina');
        });

        // CHAT — {conversation} y {message} con RMB + Policy
        Route::prefix('chat')->name('estudiante.chat.')->group(function () {
            Route::get('/', [EstudianteChatController::class, 'index'])->name('index');
            Route::get('/conversations/json', [EstudianteChatController::class, 'conversationsJson'])->name('conversations.json');
            Route::get('/search', [EstudianteChatController::class, 'searchUsers'])->name('search');
            Route::post('/create', [EstudianteChatController::class, 'createConversation'])->name('create');

            Route::get('/{conversation}', [EstudianteChatController::class, 'getConversation'])
                ->name('show')
                ->middleware('can:view,conversation');

            Route::post('/{conversation}/message', [EstudianteChatController::class, 'sendMessage'])
                ->name('message')
                ->middleware(['can:sendMessage,conversation', 'throttle:chat']);

            Route::post('/{conversation}/read', [EstudianteChatController::class, 'markAsRead'])
                ->name('read')
                ->middleware(['can:markAsRead,conversation', 'throttle:chat']);

            Route::post('/{conversation}/leave', [EstudianteChatController::class, 'leaveGroup'])
                ->name('leave')
                ->middleware('can:leave,conversation');

            Route::post('/{conversation}/add-participant', [EstudianteChatController::class, 'addParticipant'])
                ->name('addParticipant')
                ->middleware('can:addParticipant,conversation');

            Route::put('/{conversation}/update-group', [EstudianteChatController::class, 'updateGroup'])
                ->name('update-group')
                ->middleware('can:updateGroup,conversation');

            Route::delete('/{conversation}', [EstudianteChatController::class, 'deleteConversation'])
                ->name('delete-conversation')
                ->middleware('can:delete,conversation');

            Route::put('/message/{message}/edit', [EstudianteChatController::class, 'editMessage'])
                ->name('edit-message')
                ->middleware(['can:update,message', 'throttle:chat']);

            Route::delete('/message/{message}', [EstudianteChatController::class, 'deleteMessage'])
                ->name('delete-message')
                ->middleware(['can:delete,message', 'throttle:chat']);
        });

        // HORARIO
        Route::get('/horario', [ScheduleEstudentController::class, 'index'])->name('estudiante.horario')->middleware('permission:schedules.view');
        Route::get('/horario/print', [ScheduleEstudentController::class, 'print'])->name('estudiante.horario.print')->middleware('permission:schedules.print');

        // ASISTENCIAS (solo lectura propia)
        Route::get('/asistencias', [AsistenciasEstudentController::class, 'index'])->name('estudiante.asistencias')->middleware('permission:attendances.view');

        // NOTAS (solo lectura propia)
        Route::get('/notas', [MisNotasController::class, 'index'])->name('estudiante.notas')->middleware('permission:grades.view');

        // BOLETINES — {boletin} con RMB + Policy verifica student_id
        Route::middleware('permission:bulletins.view')->group(function () {
            Route::get('/boletines', [BoletinController::class, 'index'])->name('estudiante.boletines');
            Route::get('/boletines/{boletin}/vista-previa', [BoletinController::class, 'vistaPrevia'])
                ->name('estudiante.boletines.vista-previa')
                ->middleware('can:view,boletin');
        });
        Route::middleware('permission:bulletins.download')->group(function () {
            Route::get('/boletines/{boletin}/documento', [BoletinController::class, 'generarDocumento'])
                ->name('estudiante.boletines.documento')
                ->middleware('can:download,boletin');
        });
    });
});