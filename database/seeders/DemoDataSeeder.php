<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class DemoDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Crear usuarios de demostración
        
        // 1. Rector
        $rector = User::create([
            'name' => 'Carlos',
            'last_name' => 'Mendoza',
            'email' => 'rector@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567890',
            'phone' => '3001234567',
            'is_active' => true,
        ]);
        $rector->assignRole('rector');

        // 2. Coordinadora
        $coordinadora = User::create([
            'name' => 'María',
            'last_name' => 'Gonzalez',
            'email' => 'coordinadora@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567891',
            'phone' => '3001234568',
            'is_active' => true,
        ]);
        $coordinadora->assignRole('coordinadora');

        // 3. Secretaria
        $secretaria = User::create([
            'name' => 'Ana',
            'last_name' => 'Rodriguez',
            'email' => 'secretaria@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567892',
            'phone' => '3001234569',
            'is_active' => true,
        ]);
        $secretaria->assignRole('secretaria');

        // 4. Profesores
        $profesor1 = User::create([
            'name' => 'Juan',
            'last_name' => 'Perez',
            'email' => 'profesor1@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567893',
            'phone' => '3001234570',
            'is_active' => true,
        ]);
        $profesor1->assignRole('profesor');

        $profesor2 = User::create([
            'name' => 'Laura',
            'last_name' => 'Garcia',
            'email' => 'profesor2@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567894',
            'phone' => '3001234571',
            'is_active' => true,
        ]);
        $profesor2->assignRole('profesor');

        // 5. Estudiantes
        $estudiante1 = User::create([
            'name' => 'Pedro',
            'last_name' => 'Lopez',
            'email' => 'estudiante1@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'TI',
            'document_number' => '1234567895',
            'phone' => '3001234572',
            'birth_date' => '2010-05-15',
            'is_active' => true,
        ]);
        $estudiante1->assignRole('estudiante');

        $estudiante2 = User::create([
            'name' => 'Sofía',
            'last_name' => 'Garcia',    
            'email' => 'estudiante2@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'TI',
            'document_number' => '1234567896',
            'phone' => '3001234573',
            'birth_date' => '2011-08-20',
            'is_active' => true,
        ]);
        $estudiante2->assignRole('estudiante');

        $this->command->info('✅ Usuarios de demostración creados exitosamente');
        $this->command->info('');
        $this->command->info('Credenciales de acceso:');
        $this->command->info('Rector: rector@schoolsystem.com / password');
        $this->command->info('Coordinadora: coordinadora@schoolsystem.com / password');
        $this->command->info('Secretaria: secretaria@schoolsystem.com / password');
        $this->command->info('Profesor: profesor1@schoolsystem.com / password');
        $this->command->info('Estudiante: estudiante1@schoolsystem.com / password');
    }
}
