<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        /*
        |--------------------------------------------------------------------------
        | PERMISOS
        | Solo se definen permisos que son referenciados por al menos una ruta,
        | middleware o policy. Permisos huérfanos eliminados:
        |   - periods.*         → reemplazados por academic_period.*
        |   - audit_logs.view   → la ruta usa audit.view
        |   - system.logs       → ninguna ruta lo referencia
        |   - payments.*        → ninguna ruta activa lo referencia
        |   - reports.financial → ninguna ruta activa lo referencia
        |--------------------------------------------------------------------------
        */
        $permissions = [

            // ── Usuarios (rector y secretaria) ────────────────────────────────
            'users.view',            // ver listado
            'users.create',          // crear usuario
            'users.update',          // editar usuario
            'users.delete',          // eliminar usuario
            'users.activate',        // reactivar usuario suspendido
            'users.suspend',         // suspender usuario
            'users.change_role',     // cambiar rol
            'users.view_history',    // ver historial de actividad
            'users.force_logout',    // cerrar sesiones
            'users.reset_password',  // resetear contraseña

            // ── Estudiantes ───────────────────────────────────────────────────
            'students.view',
            'students.create',
            'students.update',
            'students.delete',

            // ── Docentes ──────────────────────────────────────────────────────
            'teachers.view',
            'teachers.create',
            'teachers.update',
            'teachers.delete',

            // ── Carpetas y archivos ────────────────────────────────────────────
            'folders.create',
            'folders.update', 
            'folders.delete',
            'files.create',
            'files.delete',

            // ── Asignaturas ───────────────────────────────────────────────────
            'subjects.view',
            'subjects.create',
            'subjects.update',
            'subjects.delete',

            // ── Grupos / cursos ───────────────────────────────────────────────
            'groups.view',
            'groups.create',
            'groups.update',
            'groups.delete',

            // ── Horarios ──────────────────────────────────────────────────────
            'schedules.view',
            'schedules.create',
            'schedules.update',
            'schedules.delete',
            'schedules.print',

            // ── Notas ─────────────────────────────────────────────────────────
            'grades.view',       // ver sus propias notas (estudiante) o las del grupo (profesor)
            'grades.create',     // registrar nota nueva
            'grades.update',     // editar nota existente
            'grades.correct',    // corregir nota (coordinadora)
            'grades.delete',     // eliminar nota
            'grades.view_all',   // ver notas de todos los grupos (coordinadora)

            // ── Notas manuales ────────────────────────────────────────────────
            'manual_grades.view',
            'manual_grades.create',
            'manual_grades.update',
            'manual_grades.correct',

            // ── Asistencias ───────────────────────────────────────────────────
            'attendances.view',       // ver asistencias propias / del grupo
            'attendances.create',     // registrar asistencia (profesor)
            'attendances.update',     // editar asistencia
            'attendance.view_all',    // ver todas (coordinadora)
            'attendance.export',      // exportar reporte (coordinadora)

            // ── Tareas ────────────────────────────────────────────────────────
            'assignments.view',    // ver tareas
            'assignments.create',  // crear tarea (profesor)
            'assignments.update',  // editar tarea (profesor)
            'assignments.delete',  // eliminar tarea (profesor)
            'assignments.grade',   // calificar entrega (profesor)
            'assignments.submit',  // entregar tarea (estudiante)

            // ── Publicaciones ─────────────────────────────────────────────────
            // Profesor y estudiante: ver, crear, editar y eliminar las suyas.
            // La Policy restringe editar/eliminar solo al autor.
            'posts.view',
            'posts.create',
            'posts.update',
            'posts.delete',

            // ── Reuniones ─────────────────────────────────────────────────────
            'meetings.create',
            'meetings.join',
            'meetings.end',

            // ── Periodos académicos ───────────────────────────────────────────
            // NOTA: los permisos periods.* fueron eliminados por ser duplicados.
            // Las rutas en web.php usan únicamente academic_period.*
            'academic_period.view',
            'academic_period.create',
            'academic_period.update',
            'academic_period.activate',
            'academic_period.close',
            'academic_period.reopen',
            'academic_period.archive',
            'academic_period.delete',

            // ── Reportes / supervisión ────────────────────────────────────────
            'reports.academic',
            'reports.general',
            'reports.institutional',
            'reports.performance',

            // ── Boletines ─────────────────────────────────────────────────────
            'bulletins.view',
            'bulletins.generate',
            'bulletins.confirm',
            'bulletins.download',

            // ── Disciplina ────────────────────────────────────────────────────
            'discipline.view',    // estudiante: solo sus registros / coordinadora: todos
            'discipline.create',
            'discipline.update',
            'discipline.close',

            // ── Auditoría ─────────────────────────────────────────────────────
            // La ruta usa permission:audit.view
            'audit.view',

            // ── Chat ──────────────────────────────────────────────────────────
            'chat.use',
            'chat.create_group',

            // ── Configuración institucional (rector) ──────────────────────────
            'institution.update',
            'grading.scale.configure',
            'approval.criteria.configure',

            // ── Roles y permisos (rector) ─────────────────────────────────────
            'roles.manage',
            'permissions.manage',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        /*
        |--------------------------------------------------------------------------
        | ROLES
        |--------------------------------------------------------------------------
        */

        // ═══════════════════════════════════════════════════════════════════════
        // RECTOR — Control total
        // ═══════════════════════════════════════════════════════════════════════
        $rector = Role::findOrCreate('rector');
        $rector->syncPermissions(Permission::all());

        // ═══════════════════════════════════════════════════════════════════════
        // COORDINADORA — Gestión académica completa
        // ═══════════════════════════════════════════════════════════════════════
        $coordinadora = Role::findOrCreate('coordinadora');
        $coordinadora->syncPermissions([
            // Consultas generales
            'students.view',
            'teachers.view',
            'subjects.view',
            'groups.view',

            // Notas — ver todas, corregir, pero NO crear ni eliminar
            'grades.view',
            'grades.view_all',
            'grades.update',
            'grades.correct',
            'manual_grades.view',
            'manual_grades.correct',

            // Asistencias — ver todas y exportar
            'attendances.view',
            'attendance.view_all',
            'attendance.export',

            // Tareas — solo consulta de supervisión
            'assignments.view',

            // Horarios — CRUD completo + impresión
            'schedules.view',
            'schedules.create',
            'schedules.update',
            'schedules.delete',
            'schedules.print',

            // Periodos académicos — gestión completa
            'academic_period.view',
            'academic_period.create',
            'academic_period.update',
            'academic_period.activate',
            'academic_period.close',
            'academic_period.reopen',
            'academic_period.archive',
            'academic_period.delete',

            // Reportes y supervisión
            'reports.academic',
            'reports.general',
            'reports.performance',

            // Disciplina — gestión completa
            'discipline.view',
            'discipline.create',
            'discipline.update',
            'discipline.close',

            // Boletines — gestión completa
            'bulletins.view',
            'bulletins.generate',
            'bulletins.confirm',
            'bulletins.download',

            // Auditoría — solo lectura
            'audit.view',

            // Chat
            'chat.use',
            'chat.create_group',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // SECRETARIA — Gestión administrativa
        // ═══════════════════════════════════════════════════════════════════════
        $secretaria = Role::findOrCreate('secretaria');
        $secretaria->syncPermissions([
            // Usuarios — crear y editar, NO suspender ni eliminar
            'users.view',
            'users.create',
            'users.update',

            // Estudiantes — CRUD completo
            'students.view',
            'students.create',
            'students.update',
            'students.delete',

            // Docentes — CRU (sin eliminar)
            'teachers.view',
            'teachers.create',
            'teachers.update',

            // Asignaturas — CRUD completo
            'subjects.view',
            'subjects.create',
            'subjects.update',
            'subjects.delete',

            // Grupos — CRUD completo
            'groups.view',
            'groups.create',
            'groups.update',
            'groups.delete',

            // Horarios — solo ver e imprimir
            'schedules.view',
            'schedules.print',

            // Periodos — solo ver
            'academic_period.view',

            // Boletines — solo ver y descargar
            'bulletins.view',
            'bulletins.download',

            // Chat
            'chat.use',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // PROFESOR — Gestión de sus clases
        // ═══════════════════════════════════════════════════════════════════════
        $profesor = Role::findOrCreate('profesor');
        $profesor->syncPermissions([
            // Estudiantes — solo consulta
            'students.view',

            // Notas — registrar y editar las de sus grupos
            'grades.view',
            'grades.create',
            'grades.update',
            'manual_grades.view',
            'manual_grades.create',
            'manual_grades.update',

            // Asistencias — registrar y ver las de sus grupos
            'attendances.view',
            'attendances.create',
            'attendances.update',

            // Tareas — CRUD completo + calificar (solo sus tareas, Policy lo restringe)
            'assignments.view',
            'assignments.create',
            'assignments.update',
            'assignments.delete',
            'assignments.grade',

            // ── Carpetas y archivos ────────────────────────────────────────────
            'folders.create',
            'folders.update', 
            'folders.delete',
            'files.create',
            'files.delete',

            // Horarios — solo ver e imprimir su propio horario
            'schedules.view',
            'schedules.print',

            // Publicaciones — CRUD completo (Policy restringe a las suyas)
            'posts.view',
            'posts.create',
            'posts.update',
            'posts.delete',

            // Reuniones — crear, unirse y finalizar
            'meetings.create',
            'meetings.join',
            'meetings.end',

            // Chat
            'chat.use',
            'chat.create_group',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // ESTUDIANTE — Consulta y participación académica
        // ═══════════════════════════════════════════════════════════════════════
        $estudiante = Role::findOrCreate('estudiante');
        $estudiante->syncPermissions([
            // Notas — solo ver las suyas
            'grades.view',
            'manual_grades.view',

            // Asistencias — solo ver las suyas
            'attendances.view',

            // Tareas — ver y entregar
            'assignments.view',
            'assignments.submit',

            // Horarios — solo ver e imprimir su propio horario
            'schedules.view',
            'schedules.print',

            // Publicaciones — CRUD completo (Policy restringe editar/eliminar a las suyas)
            'posts.view',
            'posts.create',
            'posts.update',
            'posts.delete',

            // Reuniones — solo unirse
            'meetings.join',

            // Boletines — ver y descargar los suyos (Policy verifica student_id)
            'bulletins.view',
            'bulletins.download',

            // Disciplina — solo ver sus propios registros (controller filtra por student_id)
            'discipline.view',

            // Chat
            'chat.use',
        ]);

        // ── Resumen ───────────────────────────────────────────────────────────
        $this->command->info('');
        $this->command->info('✅ Roles y permisos sincronizados correctamente');
        $this->command->info('');
        $this->command->table(
            ['Rol', 'Permisos'],
            [
                ['rector',       Permission::all()->count() . ' (todos)'],
                ['coordinadora', count($coordinadora->permissions)],
                ['secretaria',   count($secretaria->permissions)],
                ['profesor',     count($profesor->permissions)],
                ['estudiante',   count($estudiante->permissions)],
            ]
        );
        $this->command->info('');
        $this->command->warn('⚠  Recuerda ejecutar: php artisan db:seed --class=RolePermissionSeeder');
        $this->command->warn('   O si es re-seed en producción: php artisan permission:cache-reset primero');
    }
}