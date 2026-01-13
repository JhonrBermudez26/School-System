<?php
namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Grade;
use App\Models\Course;
use App\Models\Group;
use App\Models\Subject;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    public function run(): void
    {
        // ============================================
        // 1. USUARIOS ADMINISTRATIVOS
        // ============================================
        $this->command->info('Creando usuarios administrativos...');

        $rector = User::create([
            'name' => 'Carlos',
            'last_name' => 'Mendoza Ruiz',
            'email' => 'rector@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567890',
            'phone' => '3001234567',
            'address' => 'Calle 10 #20-30, Bogotá',
            'is_active' => true,
        ]);
        $rector->assignRole('rector');

        $coordinadora = User::create([
            'name' => 'María',
            'last_name' => 'González Castro',
            'email' => 'coordinadora@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567891',
            'phone' => '3001234568',
            'address' => 'Carrera 15 #40-50, Bogotá',
            'is_active' => true,
        ]);
        $coordinadora->assignRole('coordinadora');

        $secretaria1 = User::create([
            'name' => 'Ana',
            'last_name' => 'Rodríguez López',
            'email' => 'secretaria@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567892',
            'phone' => '3001234569',
            'address' => 'Avenida 68 #25-30, Bogotá',
            'is_active' => true,
        ]);
        $secretaria1->assignRole('secretaria');

        $secretaria2 = User::create([
            'name' => 'Patricia',
            'last_name' => 'Moreno Silva',
            'email' => 'secretaria2@schoolsystem.com',
            'password' => Hash::make('password'),
            'document_type' => 'CC',
            'document_number' => '1234567893',
            'phone' => '3001234570',
            'address' => 'Calle 45 #30-20, Bogotá',
            'is_active' => true,
        ]);
        $secretaria2->assignRole('secretaria');

        $this->command->info('Usuarios administrativos creados');

        // ============================================
        // 2. CREAR GRADOS Y CURSOS
        // ============================================
        $this->command->info('Creando grados y cursos...');

        $grados = [
            ['nombre' => '6°', 'descripcion' => 'Sexto grado'],
            ['nombre' => '7°', 'descripcion' => 'Séptimo grado'],
            ['nombre' => '8°', 'descripcion' => 'Octavo grado'],
            ['nombre' => '9°', 'descripcion' => 'Noveno grado'],
            ['nombre' => '10°', 'descripcion' => 'Décimo grado'],
            ['nombre' => '11°', 'descripcion' => 'Undécimo grado'],
        ];

        foreach ($grados as $grado) {
            Grade::create($grado);
        }

        $cursos = [
            ['nombre' => 'A'],
            ['nombre' => 'B'],
            ['nombre' => 'C'],
        ];

        foreach ($cursos as $curso) {
            Course::create($curso);
        }

        $this->command->info('Grados y cursos creados');

        // ============================================
        // 3. CREAR GRUPOS (GRADO + CURSO)
        // ============================================
        $this->command->info('Creando grupos...');

        $allGrades = Grade::all();
        $allCourses = Course::all();

        foreach ($allGrades as $grade) {
            foreach ($allCourses as $course) {
                Group::create([
                    'grade_id' => $grade->id,
                    'course_id' => $course->id,
                    'nombre' => str_replace('°','',$grade->nombre) . $course->nombre,
                ]);
            }
        }

        $this->command->info('Grupos creados: ' . Group::count());

        // ============================================
        // 4. ASIGNATURAS
        // ============================================
        $this->command->info('Creando asignaturas...');

        $asignaturas = [
            ['name' => 'Matemáticas', 'code' => 'MAT-01', 'description' => 'Álgebra, geometría y cálculo', 'hours_per_week' => 5],
            ['name' => 'Español', 'code' => 'ESP-01', 'description' => 'Lengua castellana y literatura', 'hours_per_week' => 4],
            ['name' => 'Inglés', 'code' => 'ING-01', 'description' => 'Lengua extranjera', 'hours_per_week' => 3],
            ['name' => 'Ciencias Naturales', 'code' => 'CIE-01', 'description' => 'Biología, química y física', 'hours_per_week' => 4],
            ['name' => 'Ciencias Sociales', 'code' => 'SOC-01', 'description' => 'Historia y geografía', 'hours_per_week' => 3],
            ['name' => 'Educación Física', 'code' => 'EDF-01', 'description' => 'Actividad física', 'hours_per_week' => 2],
            ['name' => 'Artes', 'code' => 'ART-01', 'description' => 'Expresión artística', 'hours_per_week' => 2],
            ['name' => 'Tecnología', 'code' => 'TEC-01', 'description' => 'Informática y tecnología', 'hours_per_week' => 2],
            ['name' => 'Ética y Valores', 'code' => 'ETI-01', 'description' => 'Formación en valores', 'hours_per_week' => 2],
            ['name' => 'Religión', 'code' => 'REL-01', 'description' => 'Educación religiosa', 'hours_per_week' => 1],
        ];

        foreach ($asignaturas as $asignatura) {
            Subject::create($asignatura);
        }

        $this->command->info('Asignaturas creadas: ' . Subject::count());

        // ============================================
        // 5. CREAR PROFESORES
        // ============================================
        $this->command->info('Creando profesores...');

        $profesores = [
            ['name' => 'Juan', 'last_name' => 'Pérez Martínez', 'email' => 'juan.perez@schoolsystem.com', 'document_number' => '1001234567', 'phone' => '3101234567'],
            ['name' => 'Laura', 'last_name' => 'García Díaz', 'email' => 'laura.garcia@schoolsystem.com', 'document_number' => '1001234568', 'phone' => '3101234568'],
            ['name' => 'Roberto', 'last_name' => 'Martínez Torres', 'email' => 'roberto.martinez@schoolsystem.com', 'document_number' => '1001234569', 'phone' => '3101234569'],
            ['name' => 'Carmen', 'last_name' => 'Sánchez Ruiz', 'email' => 'carmen.sanchez@schoolsystem.com', 'document_number' => '1001234570', 'phone' => '3101234570'],
            ['name' => 'Miguel', 'last_name' => 'Ramírez Castro', 'email' => 'miguel.ramirez@schoolsystem.com', 'document_number' => '1001234571', 'phone' => '3101234571'],
            ['name' => 'Diana', 'last_name' => 'López Hernández', 'email' => 'diana.lopez@schoolsystem.com', 'document_number' => '1001234572', 'phone' => '3101234572'],
            ['name' => 'Fernando', 'last_name' => 'Vargas Gómez', 'email' => 'fernando.vargas@schoolsystem.com', 'document_number' => '1001234573', 'phone' => '3101234573'],
            ['name' => 'Mónica', 'last_name' => 'Jiménez Mora', 'email' => 'monica.jimenez@schoolsystem.com', 'document_number' => '1001234574', 'phone' => '3101234574'],
            ['name' => 'Andrés', 'last_name' => 'Torres Silva', 'email' => 'andres.torres@schoolsystem.com', 'document_number' => '1001234575', 'phone' => '3101234575'],
            ['name' => 'Claudia', 'last_name' => 'Rojas Vargas', 'email' => 'claudia.rojas@schoolsystem.com', 'document_number' => '1001234576', 'phone' => '3101234576'],
        ];

        $profesoresCreados = [];
        foreach ($profesores as $p) {
            $u = User::create([
                'name' => $p['name'],
                'last_name' => $p['last_name'],
                'email' => $p['email'],
                'password' => Hash::make('password'),
                'document_type' => 'CC',
                'document_number' => $p['document_number'],
                'phone' => $p['phone'],
                'address' => 'Bogotá, Colombia',
                'is_active' => true,
            ]);
            $u->assignRole('profesor');
            $profesoresCreados[] = $u;
        }

        $this->command->info('Profesores creados: '.count($profesoresCreados));

        // ============================================
        // 6. ASIGNAR ASIGNATURAS A PROFESORES
        // ============================================
        $this->command->info('Asignando asignaturas a profesores...');

        $asignacionesPorProfesor = [
            0 => [1],
            1 => [2],
            2 => [3],
            3 => [4],
            4 => [5],
            5 => [6],
            6 => [7],
            7 => [8],
            8 => [9],
            9 => [10],
        ];

        $allGroups = Group::all();

        foreach ($profesoresCreados as $index => $profesor) {
            $subjectIds = $asignacionesPorProfesor[$index] ?? [];

            foreach ($subjectIds as $subjectId) {
                foreach ($allGroups as $group) {
                    DB::table('subject_group')->insert([
                        'user_id' => $profesor->id,
                        'subject_id' => $subjectId,
                        'group_id' => $group->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('Asignaciones completadas');

        // ============================================
        // 7. CREAR ESTUDIANTES
        // ============================================
        $this->command->info('Creando estudiantes...');

        $nombresEstudiantes = [
            ['name' => 'Pedro', 'last_name' => 'López García'],
            ['name' => 'Sofía', 'last_name' => 'García Martínez'],
            ['name' => 'Daniel', 'last_name' => 'Rodríguez Pérez'],
            ['name' => 'Valentina', 'last_name' => 'Martínez López'],
            ['name' => 'Santiago', 'last_name' => 'Hernández Silva'],
            ['name' => 'Isabella', 'last_name' => 'González Torres'],
            ['name' => 'Mateo', 'last_name' => 'Díaz Ramírez'],
            ['name' => 'Lucía', 'last_name' => 'Moreno Castro'],
            ['name' => 'Sebastián', 'last_name' => 'Vargas Gómez'],
            ['name' => 'Emma', 'last_name' => 'Ruiz Jiménez'],
            ['name' => 'Samuel', 'last_name' => 'Castro Morales'],
            ['name' => 'Martina', 'last_name' => 'Jiménez Reyes'],
            ['name' => 'Nicolás', 'last_name' => 'Torres Méndez'],
            ['name' => 'Camila', 'last_name' => 'Sánchez Ortiz'],
            ['name' => 'Juan', 'last_name' => 'Gómez Navarro'],
            ['name' => 'María', 'last_name' => 'Ramírez Flores'],
            ['name' => 'Andrés', 'last_name' => 'Pérez Luna'],
            ['name' => 'Paula', 'last_name' => 'López Vega'],
            ['name' => 'Diego', 'last_name' => 'García Romero'],
            ['name' => 'Gabriela', 'last_name' => 'Martínez Cruz'],
            ['name' => 'Carlos', 'last_name' => 'Hernández Ríos'],
            ['name' => 'Ana', 'last_name' => 'González Medina'],
            ['name' => 'Luis', 'last_name' => 'Díaz Paredes'],
            ['name' => 'Carolina', 'last_name' => 'Moreno Aguilar'],
            ['name' => 'Felipe', 'last_name' => 'Vargas Salazar'],
            ['name' => 'Natalia', 'last_name' => 'Ruiz Herrera'],
            ['name' => 'Alejandro', 'last_name' => 'Castro Peña'],
            ['name' => 'Laura', 'last_name' => 'Jiménez Campos'],
            ['name' => 'Javier', 'last_name' => 'Torres Figueroa'],
            ['name' => 'Andrea', 'last_name' => 'Sánchez Mendoza'],
        ];

        $estudiantesCreados = [];
        $birthYears = [2008,2009,2010,2011,2012,2013];
        $documentCounter = 2000000000;

        foreach ($nombresEstudiantes as $est) {
            $birthYear = $birthYears[array_rand($birthYears)];

            $u = User::create([
                'name' => $est['name'],
                'last_name' => $est['last_name'],
                'email' => strtolower($est['name'] . '.' . explode(' ',$est['last_name'])[0]).'@estudiantes.com',
                'password' => Hash::make('password'),
                'document_type' => 'TI',
                'document_number' => (string)$documentCounter++,
                'phone' => '310'.rand(1000000,9999999),
                'address' => 'Bogotá, Colombia',
                'birth_date' => $birthYear.'-'.rand(1,12).'-'.rand(1,28),
                'is_active' => true,
            ]);

            $u->assignRole('estudiante');
            $estudiantesCreados[] = $u;
        }

        $this->command->info('Estudiantes creados: '.count($estudiantesCreados));

        // ============================================
        // 8. ASIGNAR ESTUDIANTES A GRUPOS
        // ============================================
        $this->command->info('Asignando estudiantes a grupos...');

        $groupsArray = $allGroups->toArray();
        $studentsPerGroup = ceil(count($estudiantesCreados) / count($groupsArray));

        $grupoIndex = 0;
        $countInGroup = 0;

        foreach ($estudiantesCreados as $est) {
            if ($countInGroup >= $studentsPerGroup && $grupoIndex < count($groupsArray) - 1) {
                $grupoIndex++;
                $countInGroup = 0;
            }

            DB::table('group_user')->insert([
                'user_id' => $est->id,
                'group_id' => $groupsArray[$grupoIndex]['id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            $countInGroup++;
        }

        $this->command->info('Estudiantes asignados a grupos');

        // ============================================
        // RESUMEN
        // ============================================
        $this->command->info('===================== RESUMEN =====================');
        $this->command->info('Usuarios admin creados');
        $this->command->info('Profesores: '.count($profesoresCreados));
        $this->command->info('Estudiantes: '.count($estudiantesCreados));
        $this->command->info('Grados: '.Grade::count());
        $this->command->info('Cursos: '.Course::count());
        $this->command->info('Grupos: '.Group::count());
        $this->command->info('Asignaturas: '.Subject::count());
        $this->command->info('===================================================');
    }
}
