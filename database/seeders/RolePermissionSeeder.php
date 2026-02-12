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
            
            // Notas manuales
            'manual_grades.view', 'manual_grades.create', 'manual_grades.update', 'manual_grades.correct',
            
            // Asistencias
            'attendances.view', 'attendances.create', 'attendances.update',
            
            // Tareas
            'assignments.view', 'assignments.create', 'assignments.update', 'assignments.delete', 'assignments.grade',
            
            // Publicaciones
            'posts.view', 'posts.create', 'posts.update', 'posts.delete',
            
            // Reuniones
            'meetings.create', 'meetings.join', 'meetings.end',
            
            // Periodos
            'periods.view', 'periods.reopen', 'periods.close', 'periods.create', 'periods.update', 'periods.delete',
            
            // Pagos
            'payments.view', 'payments.create', 'payments.validate', 'payments.reports',
            
            // Reportes
            'reports.academic', 'reports.financial', 'reports.general',
            
            // Boletines
            'bulletins.view', 'bulletins.generate', 'bulletins.download',
            
            // Auditoría
            'audit_logs.view',
            
            // Chat
            'chat.use', 'chat.create_group',
            
            // Configuración institucional
            'institution.update',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        /*
        |--------------------------------------------------------------------------
        | ROLES
        |--------------------------------------------------------------------------
        */

        // ═══════════════════════════════════════════════════════════════════════
        // RECTOR - Control total del sistema
        // ═══════════════════════════════════════════════════════════════════════
        $rector = Role::create(['name' => 'rector']);
        $rector->syncPermissions(Permission::all());

        // ═══════════════════════════════════════════════════════════════════════
        // COORDINADORA - Gestión académica completa
        // ═══════════════════════════════════════════════════════════════════════
        $coordinadora = Role::create(['name' => 'coordinadora']);
        $coordinadora->syncPermissions([
            // Consultas
            'students.view',
            'teachers.view',
            'subjects.view',
            'groups.view',
            
            // Notas (actualizar y corregir)
            'grades.view',
            'grades.update',
            'grades.correct',
            'manual_grades.view',
            'manual_grades.correct',
            
            // Asistencias (solo consulta)
            'attendances.view',
            
            // Tareas (solo consulta)
            'assignments.view',
            
            // ✅ HORARIOS - CRUD completo + impresión
            'schedules.view',
            'schedules.create',
            'schedules.update',
            'schedules.delete',
            'schedules.print',
            
            // Periodos académicos
            'periods.view',
            'periods.create',
            'periods.update',
            'periods.reopen',
            'periods.close',
            
            // Reportes
            'reports.academic',
            'reports.general',
            
            // Boletines
            'bulletins.view',
            'bulletins.generate',
            'bulletins.download',
            
            // Auditoría
            'audit_logs.view',
            
            // Chat
            'chat.use',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // SECRETARIA - Gestión administrativa
        // ═══════════════════════════════════════════════════════════════════════
        $secretaria = Role::create(['name' => 'secretaria']);
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
        $profesor = Role::create(['name' => 'profesor']);
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
            'posts.create',
            'posts.update',
            'posts.delete',
            
            // Reuniones
            'meetings.create',
            'meetings.end',
            
            // Chat
            'chat.use',
            'chat.create_group',
        ]);

        // ═══════════════════════════════════════════════════════════════════════
        // ESTUDIANTE - Consulta académica
        // ═══════════════════════════════════════════════════════════════════════
        $estudiante = Role::create(['name' => 'estudiante']);
        $estudiante->syncPermissions([
            // Notas (solo ver)
            'grades.view',
            'manual_grades.view',
            
            // Asistencias (solo ver)
            'attendances.view',
            
            // Tareas (solo ver)
            'assignments.view',
            
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