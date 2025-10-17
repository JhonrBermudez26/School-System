<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Crear permisos
        $permissions = [
            // Gestión de usuarios
            'users.view',
            'users.create',
            'users.edit',
            'users.delete',
            
            // Gestión de estudiantes
            'students.view',
            'students.create',
            'students.edit',
            'students.delete',
            
            // Gestión de notas
            'grades.view',
            'grades.create',
            'grades.edit',
            'grades.delete',
            
            // Gestión de materias
            'subjects.view',
            'subjects.create',
            'subjects.edit',
            'subjects.delete',
            
            // Gestión de tareas
            'assignments.view',
            'assignments.create',
            'assignments.edit',
            'assignments.delete',
            'assignments.grade',
            
            // Gestión de pagos
            'payments.view',
            'payments.create',
            'payments.validate',
            'payments.reports',
            
            // Gestión de periodos académicos
            'periods.view',
            'periods.create',
            'periods.edit',
            'periods.toggle',
            
            // Reportes
            'reports.academic',
            'reports.financial',
            'reports.general',
            
            // Boletines
            'bulletins.view',
            'bulletins.generate',
            'bulletins.download',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Crear roles y asignar permisos
        
        // 1. Rector - Acceso total
        $rector = Role::create(['name' => 'rector']);
        $rector->givePermissionTo(Permission::all());

        // 2. Coordinadora - Supervisión académica y financiera
        $coordinadora = Role::create(['name' => 'coordinadora']);
        $coordinadora->givePermissionTo([
            'students.view',
            'grades.view',
            'subjects.view',
            'assignments.view',
            'payments.view',
            'payments.validate',
            'payments.reports',
            'periods.view',
            'reports.academic',
            'reports.financial',
            'bulletins.view',
            'bulletins.generate',
        ]);

        // 3. Secretaria - Gestión administrativa
        $secretaria = Role::create(['name' => 'secretaria']);
        $secretaria->givePermissionTo([
            'students.view',
            'students.create',
            'students.edit',
            'students.delete',
            'periods.view',
            'periods.create',
            'periods.edit',
            'periods.toggle',
            'bulletins.view',
            'bulletins.generate',
            'bulletins.download',
        ]);

        // 4. Profesor - Gestión académica
        $profesor = Role::create(['name' => 'profesor']);
        $profesor->givePermissionTo([
            'students.view',
            'grades.view',
            'grades.create',
            'grades.edit',
            'subjects.view',
            'assignments.view',
            'assignments.create',
            'assignments.edit',
            'assignments.delete',
            'assignments.grade',
        ]);

        // 5. Estudiante - Consulta
        $estudiante = Role::create(['name' => 'estudiante']);
        $estudiante->givePermissionTo([
            'grades.view',
            'assignments.view',
            'payments.view',
            'bulletins.view',
            'bulletins.download',
        ]);
    }
}
