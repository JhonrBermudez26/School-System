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
        |--------------------------------------------------------------------------
        */
        $permissions = [
            // Usuarios
            'users.view', 'users.create', 'users.update', 'users.delete',
            'users.activate', 'users.suspend', 'users.change_role', 'users.view_history',
            'users.force_logout', 'users.reset_password',
            
            // Estudiantes
            'students.view', 'students.create', 'students.update', 'students.delete',
            
            // Docentes
            'teachers.view', 'teachers.create', 'teachers.update', 'teachers.delete',
            
            // Asignaturas
            'subjects.view', 'subjects.create', 'subjects.update', 'subjects.delete',
            
            // Grupos / cursos
            'groups.view', 'groups.create', 'groups.update', 'groups.delete',
            
            // Horarios
            'schedules.view', 'schedules.create', 'schedules.update', 'schedules.delete', 'schedules.print',
            
            // Notas
            'grades.view', 'grades.create', 'grades.update', 'grades.correct', 'grades.delete',
            'grades.view_all',
            
            // Notas manuales
            'manual_grades.view', 'manual_grades.create', 'manual_grades.update', 'manual_grades.correct',
            
            // Asistencias
            'attendances.view', 'attendances.create', 'attendances.update',
            'attendance.view_all', 'attendance.export',
            
            // Tareas
            'assignments.view', 'assignments.create', 'assignments.update', 'assignments.delete', 'assignments.grade',
            'assignments.submit',
            
            // Publicaciones
            'posts.view', 'posts.create', 'posts.update', 'posts.delete',
            
            // Reuniones
            'meetings.create', 'meetings.join', 'meetings.end',
            
            // Periodos Académicos
            'periods.view', 'periods.reopen', 'periods.close', 'periods.create', 'periods.update', 'periods.delete',
            'academic_period.view', 'academic_period.create', 'academic_period.update',
            'academic_period.activate', 'academic_period.close', 'academic_period.reopen', 'academic_period.archive',
            
            // Pagos
            'payments.view', 'payments.create', 'payments.validate', 'payments.reports',
            
            // Reportes
            'reports.academic', 'reports.financial', 'reports.general',
            'reports.institutional', 'reports.performance',
            
            // Boletines
            'bulletins.view', 'bulletins.generate', 'bulletins.download',
            
            // Disciplina
            'discipline.create', 'discipline.update', 'discipline.view', 'discipline.close',
            
            // Auditoría
            'audit_logs.view', 'audit.view', 'system.logs',
            
            // Chat
            'chat.use', 'chat.create_group',
            
            // Configuración institucional
            'institution.update', 'grading.scale.configure', 'approval.criteria.configure',
            
            // Roles y permisos
            'roles.manage', 'permissions.manage',


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
        // RECTOR - Control total del sistema + Gestión institucional
        // ═══════════════════════════════════════════════════════════════════════
        $rector = Role::findOrCreate('rector');
        $rector->syncPermissions(Permission::all());

        // ═══════════════════════════════════════════════════════════════════════
        // COORDINADORA - Gestión académica completa
        // ═══════════════════════════════════════════════════════════════════════
        $coordinadora = Role::findOrCreate('coordinadora');
        $coordinadora->syncPermissions([
            // Consultas
            'students.view',
            'teachers.view',
            'subjects.view',
            'groups.view',
            
            // Notas (actualizar, corregir y ver todas)
            'grades.view',
            'grades.view_all',
            'grades.update',
            'grades.correct',
            'manual_grades.view',
            'manual_grades.correct',
            
            // Asistencias (ver todas y exportar)
            'attendances.view',
            'attendance.view_all',
            'attendance.export',
            
            // Tareas (solo consulta)
            'assignments.view',
            
            // ✅ HORARIOS - CRUD completo + impresión
            'schedules.view',
            'schedules.create',
            'schedules.update',
            'schedules.delete',
            'schedules.print',
            
            // Periodos académicos - Gestión completa
            'periods.view',
            'periods.create',
            'periods.update',
            'periods.reopen',
            'periods.close',
            'academic_period.view',
            'academic_period.create',
            'academic_period.update',
            'academic_period.activate',
            'academic_period.close',
            'academic_period.reopen',
            'academic_period.archive',
            
            // Supervisión académica
            'reports.academic',
            'reports.performance',
            'reports.general',
            
            // Disciplina
            'discipline.view',
            'discipline.create',
            'discipline.update',
            'discipline.close',
            
            // Boletines
            'bulletins.view',
            'bulletins.generate',
            'bulletins.download',
            
            // Auditoría
            'audit_logs.view',
            'audit.view',
            
            // Chat
            'chat.use',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // SECRETARIA - Gestión administrativa
        // ═══════════════════════════════════════════════════════════════════════
        $secretaria = Role::findOrCreate('secretaria');
        $secretaria->syncPermissions([
            // Usuarios
            'users.view',
            'users.create',
            'users.update',
            
            // Estudiantes - CRUD completo
            'students.view',
            'students.create',
            'students.update',
            'students.delete',
            
            // Docentes - CRU (sin eliminar)
            'teachers.view',
            'teachers.create',
            'teachers.update',
            
            // Asignaturas - CRUD completo
            'subjects.view',
            'subjects.create',
            'subjects.update',
            'subjects.delete',
            
            // Grupos - CRUD completo
            'groups.view',
            'groups.create',
            'groups.update',
            'groups.delete',
            
            // ✅ HORARIOS - Solo ver e imprimir
            'schedules.view',
            'schedules.print',
            
            // Periodos (solo consulta)
            'periods.view',
            
            // Boletines (solo consulta y descarga)
            'bulletins.view',
            'bulletins.download',
            
            // Chat
            'chat.use',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // PROFESOR - Gestión de clases
        // ═══════════════════════════════════════════════════════════════════════
        $profesor = Role::findOrCreate('profesor');
        $profesor->syncPermissions([
            // Estudiantes (solo consulta)
            'students.view',
            
            // Notas
            'grades.view',
            'grades.create',
            'grades.update',
            'manual_grades.create',
            'manual_grades.update',
            
            // Asistencias
            'attendances.create',
            'attendances.view',
            
            // Tareas
            'assignments.view',
            'assignments.create',
            'assignments.update',
            'assignments.delete',
            'assignments.grade',
            
            // ✅ HORARIOS - Solo ver e imprimir su propio horario
            'schedules.view',
            'schedules.print',
            
            // Publicaciones
            'posts.view',
            'posts.create',
            'posts.update',
            'posts.delete',
            
            // Reuniones
            'meetings.create',
            'meetings.join',
            'meetings.end',
            
            // Chat
            'chat.use',
            'chat.create_group',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // ESTUDIANTE - Consulta académica
        // ═══════════════════════════════════════════════════════════════════════
        $estudiante = Role::findOrCreate('estudiante');
        $estudiante->syncPermissions([
            // Notas (solo ver)
            'grades.view',
            'manual_grades.view',
            
            // Asistencias (solo ver)
            'attendances.view',
            
            // Tareas (ver y entregar)
            'assignments.view',
            'assignments.submit',
            
            // ✅ HORARIOS - Solo ver e imprimir su propio horario
            'schedules.view',
            'schedules.print',
            
            // Publicaciones (solo ver)
            'posts.view',
            
            // Reuniones (solo unirse)
            'meetings.join',
            
            // Pagos
            'payments.view',
            
            // Boletines
            'bulletins.view',
            'bulletins.download',
            
            // Chat
            'chat.use',
        ]);

        $this->command->info('✅ Roles y permisos creados correctamente');
        $this->command->info('');
        $this->command->info('📋 Resumen de permisos de HORARIOS:');
        $this->command->info('   • Rector: CRUD completo + impresión');
        $this->command->info('   • Coordinadora: CRUD completo + impresión');
        $this->command->info('   • Secretaria: Ver + imprimir');
        $this->command->info('   • Profesor: Ver + imprimir (propio horario)');
        $this->command->info('   • Estudiante: Ver + imprimir (propio horario)');
    }
}