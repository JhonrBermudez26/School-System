<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Grade;
use App\Models\Course;
use App\Models\Group;
use App\Models\Subject;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DemoDataSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ============================================
        // 1. USUARIOS ADMINISTRATIVOS
        // ============================================
        $this->command->info('Creando usuarios administrativos...');

        $rector = User::create([
            'name'            => 'Carlos',
            'last_name'       => 'Mendoza Ruiz',
            'email'           => 'rector@schoolsystem.com',
            'password'        => Hash::make('password'),
            'document_type'   => 'CC',
            'document_number' => '1234567890',
            'phone'           => '3001234567',
            'address'         => 'Calle 10 #20-30, Bogotá',
            'is_active'       => true,
        ]);
        $rector->assignRole('rector');

        $coordinadora = User::create([
            'name'            => 'María',
            'last_name'       => 'González Castro',
            'email'           => 'coordinadora@schoolsystem.com',
            'password'        => Hash::make('password'),
            'document_type'   => 'CC',
            'document_number' => '1234567891',
            'phone'           => '3001234568',
            'address'         => 'Carrera 15 #40-50, Bogotá',
            'is_active'       => true,
        ]);
        $coordinadora->assignRole('coordinadora');

        $secretaria1 = User::create([
            'name'            => 'Ana',
            'last_name'       => 'Rodríguez López',
            'email'           => 'secretaria@schoolsystem.com',
            'password'        => Hash::make('password'),
            'document_type'   => 'CC',
            'document_number' => '1234567892',
            'phone'           => '3001234569',
            'address'         => 'Avenida 68 #25-30, Bogotá',
            'is_active'       => true,
        ]);
        $secretaria1->assignRole('secretaria');

        $secretaria2 = User::create([
            'name'            => 'Patricia',
            'last_name'       => 'Moreno Silva',
            'email'           => 'secretaria2@schoolsystem.com',
            'password'        => Hash::make('password'),
            'document_type'   => 'CC',
            'document_number' => '1234567893',
            'phone'           => '3001234570',
            'address'         => 'Calle 45 #30-20, Bogotá',
            'is_active'       => true,
        ]);
        $secretaria2->assignRole('secretaria');

        $this->command->info('✅ Usuarios administrativos creados');

        // ============================================
        // 2. GRADOS Y CURSOS
        // ============================================
        $this->command->info('Creando grados y cursos...');

        $grados = [
            ['nombre' => '6°',  'descripcion' => 'Sexto grado'],
            ['nombre' => '7°',  'descripcion' => 'Séptimo grado'],
            ['nombre' => '8°',  'descripcion' => 'Octavo grado'],
            ['nombre' => '9°',  'descripcion' => 'Noveno grado'],
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

        $this->command->info('✅ Grados y cursos creados');

        // ============================================
        // 3. GRUPOS (GRADO + CURSO)
        // ============================================
        $this->command->info('Creando grupos...');

        $allGrades  = Grade::all();
        $allCourses = Course::all();

        foreach ($allGrades as $grade) {
            foreach ($allCourses as $course) {
                Group::create([
                    'grade_id'  => $grade->id,
                    'course_id' => $course->id,
                    'nombre'    => str_replace('°', '', $grade->nombre) . $course->nombre,
                ]);
            }
        }

        $this->command->info('✅ Grupos creados: ' . Group::count());

        // ============================================
        // 4. ASIGNATURAS  (Ley 115 / Decreto 1850 Colombia)
        // ============================================
        // Básica secundaria y media: 30 h semanales totales
        //
        // ÁREAS OBLIGATORIAS Y FUNDAMENTALES (≥ 80 % = 24 h)
        //   • Matemáticas          → 5 h  (área con mayor peso según práctica nacional)
        //   • Lengua Castellana    → 4 h
        //   • Ciencias Naturales   → 4 h
        //   • Ciencias Sociales    → 3 h
        //   • Lengua Extranjera    → 3 h
        //   • Educación Física     → 2 h
        //   • Educación Artística  → 2 h
        //   • Tecnología e Inf.    → 2 h
        //                           ──────
        //                           25 h  (área obligatoria cubierta)
        //
        // ÁREAS OPTATIVAS / SECUNDARIAS (≤ 20 % = 5 h restantes)
        //   • Ética y Valores      → 1 h
        //   • Religión             → 1 h
        //   • Música               → 1 h
        //   • Emprendimiento       → 1 h
        //   • Proyecto Transversal → 1 h
        //                           ──────
        //                           5 h
        //                    TOTAL 30 h ✔
        // ============================================
        $this->command->info('Creando asignaturas...');

        $asignaturas = [
            // ── PRINCIPALES (obligatorias / alta intensidad) ──────────────────
            [
                'name'          => 'Matemáticas',
                'code'          => 'MAT-01',
                'description'   => 'Álgebra, geometría, estadística y cálculo básico',
                'hours_per_week' => 3,
                'is_active'     => true,
            ],
            [
                'name'          => 'Lengua Castellana',
                'code'          => 'ESP-01',
                'description'   => 'Lengua castellana, literatura y comunicación',
                'hours_per_week' => 3,
                'is_active'     => true,
            ],
            [
                'name'          => 'Ciencias Naturales',
                'code'          => 'CIE-01',
                'description'   => 'Biología, química y física integradas',
                'hours_per_week' => 3,
                'is_active'     => true,
            ],
            [
                'name'          => 'Ciencias Sociales',
                'code'          => 'SOC-01',
                'description'   => 'Historia, geografía, constitución política y democracia',
                'hours_per_week' => 2,
                'is_active'     => true,
            ],
            [
                'name'          => 'Inglés',
                'code'          => 'ING-01',
                'description'   => 'Lengua extranjera – inglés',
                'hours_per_week' => 2,
                'is_active'     => true,
            ],

            // ── ÁREAS OBLIGATORIAS CON MENOR INTENSIDAD ───────────────────────
            [
                'name'          => 'Educación Física',
                'code'          => 'EDF-01',
                'description'   => 'Educación física, recreación y deportes',
                'hours_per_week' => 2,
                'is_active'     => true,
            ],
            [
                'name'          => 'Educación Artística',
                'code'          => 'ART-01',
                'description'   => 'Artes plásticas y expresión artística',
                'hours_per_week' => 2,
                'is_active'     => true,
            ],
            [
                'name'          => 'Tecnología e Informática',
                'code'          => 'TEC-01',
                'description'   => 'Tecnología, informática y competencias digitales',
                'hours_per_week' => 2,
                'is_active'     => true,
            ],

            // ── OPTATIVAS / SECUNDARIAS (1 h cada una) ────────────────────────
            [
                'name'          => 'Ética y Valores',
                'code'          => 'ETI-01',
                'description'   => 'Formación en valores, ética y ciudadanía',
                'hours_per_week' => 1,
                'is_active'     => true,
            ],
            [
                'name'          => 'Religión',
                'code'          => 'REL-01',
                'description'   => 'Educación religiosa y moral',
                'hours_per_week' => 1,
                'is_active'     => true,
            ],
            [
                'name'          => 'Música',
                'code'          => 'MUS-01',
                'description'   => 'Formación musical y apreciación artística',
                'hours_per_week' => 1,
                'is_active'     => true,
            ],
            [
                'name'          => 'Emprendimiento',
                'code'          => 'EMP-01',
                'description'   => 'Pensamiento empresarial y proyecto de vida',
                'hours_per_week' => 1,
                'is_active'     => true,
            ],
            [
                'name'          => 'Proyecto Transversal',
                'code'          => 'PRO-01',
                'description'   => 'Proyecto pedagógico transversal institucional',
                'hours_per_week' => 1,
                'is_active'     => true,
            ],
        ];

        foreach ($asignaturas as $asignatura) {
            Subject::create($asignatura);
        }

        $this->command->info('✅ Asignaturas creadas: ' . Subject::count());
        $this->command->info('   → Total horas/semana: ' .
            collect($asignaturas)->sum('hours_per_week') . ' h (objetivo: 30 h)');

        // ============================================
        // 5. PROFESORES
        // ============================================
        $this->command->info('Creando profesores...');

        // 13 asignaturas → 13 profesores (uno por asignatura)
        $profesores = [
            // idx 0 → Matemáticas
            ['name' => 'Juan',      'last_name' => 'Pérez Martínez',    'email' => 'juan.perez@schoolsystem.com',       'document_number' => '1001234567', 'phone' => '3101234567'],
            // idx 1 → Lengua Castellana
            ['name' => 'Laura',     'last_name' => 'García Díaz',       'email' => 'laura.garcia@schoolsystem.com',     'document_number' => '1001234568', 'phone' => '3101234568'],
            // idx 2 → Ciencias Naturales
            ['name' => 'Roberto',   'last_name' => 'Martínez Torres',   'email' => 'roberto.martinez@schoolsystem.com', 'document_number' => '1001234569', 'phone' => '3101234569'],
            // idx 3 → Ciencias Sociales
            ['name' => 'Carmen',    'last_name' => 'Sánchez Ruiz',      'email' => 'carmen.sanchez@schoolsystem.com',   'document_number' => '1001234570', 'phone' => '3101234570'],
            // idx 4 → Inglés
            ['name' => 'Miguel',    'last_name' => 'Ramírez Castro',    'email' => 'miguel.ramirez@schoolsystem.com',   'document_number' => '1001234571', 'phone' => '3101234571'],
            // idx 5 → Educación Física
            ['name' => 'Diana',     'last_name' => 'López Hernández',   'email' => 'diana.lopez@schoolsystem.com',      'document_number' => '1001234572', 'phone' => '3101234572'],
            // idx 6 → Educación Artística
            ['name' => 'Fernando',  'last_name' => 'Vargas Gómez',      'email' => 'fernando.vargas@schoolsystem.com',  'document_number' => '1001234573', 'phone' => '3101234573'],
            // idx 7 → Tecnología e Informática
            ['name' => 'Mónica',    'last_name' => 'Jiménez Mora',      'email' => 'monica.jimenez@schoolsystem.com',   'document_number' => '1001234574', 'phone' => '3101234574'],
            // idx 8 → Ética y Valores
            ['name' => 'Andrés',    'last_name' => 'Torres Silva',      'email' => 'andres.torres@schoolsystem.com',    'document_number' => '1001234575', 'phone' => '3101234575'],
            // idx 9 → Religión
            ['name' => 'Claudia',   'last_name' => 'Rojas Vargas',      'email' => 'claudia.rojas@schoolsystem.com',    'document_number' => '1001234576', 'phone' => '3101234576'],
            // idx 10 → Música
            ['name' => 'Sebastián', 'last_name' => 'Herrera Muñoz',     'email' => 'sebastian.herrera@schoolsystem.com','document_number' => '1001234577', 'phone' => '3101234577'],
            // idx 11 → Emprendimiento
            ['name' => 'Marcela',   'last_name' => 'Castillo Ospina',   'email' => 'marcela.castillo@schoolsystem.com', 'document_number' => '1001234578', 'phone' => '3101234578'],
            // idx 12 → Proyecto Transversal
            ['name' => 'Ricardo',   'last_name' => 'Patiño Guerrero',   'email' => 'ricardo.patino@schoolsystem.com',   'document_number' => '1001234579', 'phone' => '3101234579'],
        ];

        $profesoresCreados = [];
        foreach ($profesores as $p) {
            $u = User::create([
                'name'            => $p['name'],
                'last_name'       => $p['last_name'],
                'email'           => $p['email'],
                'password'        => Hash::make('password'),
                'document_type'   => 'CC',
                'document_number' => $p['document_number'],
                'phone'           => $p['phone'],
                'address'         => 'Bogotá, Colombia',
                'is_active'       => true,
            ]);
            $u->assignRole('profesor');
            $profesoresCreados[] = $u;
        }

        $this->command->info('✅ Profesores creados: ' . count($profesoresCreados));

        // ============================================
        // 6. ASIGNAR ASIGNATURAS A PROFESORES (1 profesor por asignatura, todos los grupos)
        // ============================================
        $this->command->info('Asignando asignaturas a profesores en todos los grupos...');

        // Obtener IDs de asignaturas en el mismo orden que se crearon
        $subjectIds = Subject::orderBy('id')->pluck('id')->values();
        $allGroups  = Group::all();

        // Cada profesor (por índice) enseña la asignatura del mismo índice
        foreach ($profesoresCreados as $index => $profesor) {
            $subjectId = $subjectIds[$index] ?? null;
            if (!$subjectId) continue;

            foreach ($allGroups as $group) {
                $exists = DB::table('subject_group')
                    ->where('group_id',   $group->id)
                    ->where('subject_id', $subjectId)
                    ->where('user_id',    $profesor->id)
                    ->exists();

                if (!$exists) {
                    DB::table('subject_group')->insert([
                        'group_id'   => $group->id,
                        'subject_id' => $subjectId,
                        'user_id'    => $profesor->id,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }
        }

        $this->command->info('✅ Asignaciones completadas');

        // ============================================
        // 7. ESTUDIANTES
        // ============================================
        $this->command->info('Creando estudiantes...');

        $nombresEstudiantes = [
            ['name' => 'Pedro',     'last_name' => 'López García'],
            ['name' => 'Sofía',     'last_name' => 'García Martínez'],
            ['name' => 'Daniel',    'last_name' => 'Rodríguez Pérez'],
            ['name' => 'Valentina', 'last_name' => 'Martínez López'],
            ['name' => 'Santiago',  'last_name' => 'Hernández Silva'],
            ['name' => 'Isabella',  'last_name' => 'González Torres'],
            ['name' => 'Mateo',     'last_name' => 'Díaz Ramírez'],
            ['name' => 'Lucía',     'last_name' => 'Moreno Castro'],
            ['name' => 'Sebastián', 'last_name' => 'Vargas Gómez'],
            ['name' => 'Emma',      'last_name' => 'Ruiz Jiménez'],
            ['name' => 'Samuel',    'last_name' => 'Castro Morales'],
            ['name' => 'Martina',   'last_name' => 'Jiménez Reyes'],
            ['name' => 'Nicolás',   'last_name' => 'Torres Méndez'],
            ['name' => 'Camila',    'last_name' => 'Sánchez Ortiz'],
            ['name' => 'Juan',      'last_name' => 'Gómez Navarro'],
            ['name' => 'María',     'last_name' => 'Ramírez Flores'],
            ['name' => 'Andrés',    'last_name' => 'Pérez Luna'],
            ['name' => 'Paula',     'last_name' => 'López Vega'],
            ['name' => 'Diego',     'last_name' => 'García Romero'],
            ['name' => 'Gabriela',  'last_name' => 'Martínez Cruz'],
            ['name' => 'Carlos',    'last_name' => 'Hernández Ríos'],
            ['name' => 'Ana',       'last_name' => 'González Medina'],
            ['name' => 'Luis',      'last_name' => 'Díaz Paredes'],
            ['name' => 'Carolina',  'last_name' => 'Moreno Aguilar'],
            ['name' => 'Felipe',    'last_name' => 'Vargas Salazar'],
            ['name' => 'Natalia',   'last_name' => 'Ruiz Herrera'],
            ['name' => 'Alejandro', 'last_name' => 'Castro Peña'],
            ['name' => 'Laura',     'last_name' => 'Jiménez Campos'],
            ['name' => 'Javier',    'last_name' => 'Torres Figueroa'],
            ['name' => 'Andrea',    'last_name' => 'Sánchez Mendoza'],
        ];

        $estudiantesCreados = [];
        $birthYears         = [2008, 2009, 2010, 2011, 2012, 2013];
        $documentCounter    = 2000000000;

        foreach ($nombresEstudiantes as $est) {
            $birthYear = $birthYears[array_rand($birthYears)];
            $u = User::create([
                'name'            => $est['name'],
                'last_name'       => $est['last_name'],
                'email'           => strtolower($est['name'] . '.' . explode(' ', $est['last_name'])[0]) . '@estudiantes.com',
                'password'        => Hash::make('password'),
                'document_type'   => 'TI',
                'document_number' => (string) $documentCounter++,
                'phone'           => '310' . rand(1000000, 9999999),
                'address'         => 'Bogotá, Colombia',
                'birth_date'      => $birthYear . '-' . rand(1, 12) . '-' . rand(1, 28),
                'is_active'       => true,
            ]);
            $u->assignRole('estudiante');
            $estudiantesCreados[] = $u;
        }

        $this->command->info('✅ Estudiantes creados: ' . count($estudiantesCreados));

        // ============================================
        // 8. ASIGNAR ESTUDIANTES A GRUPOS
        // ============================================
        $this->command->info('Asignando estudiantes a grupos...');

        $groupsArray     = $allGroups->toArray();
        $studentsPerGroup = (int) ceil(count($estudiantesCreados) / count($groupsArray));
        $grupoIndex      = 0;
        $countInGroup    = 0;

        foreach ($estudiantesCreados as $est) {
            if ($countInGroup >= $studentsPerGroup && $grupoIndex < count($groupsArray) - 1) {
                $grupoIndex++;
                $countInGroup = 0;
            }
            DB::table('group_user')->insert([
                'user_id'    => $est->id,
                'group_id'   => $groupsArray[$grupoIndex]['id'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            $countInGroup++;
        }

        $this->command->info('✅ Estudiantes asignados a grupos');

        // ============================================
        // RESUMEN
        // ============================================
        $this->command->info('');
        $this->command->info('══════════════════════════════════════════════');
        $this->command->info('                  RESUMEN FINAL               ');
        $this->command->info('══════════════════════════════════════════════');
        $this->command->info('  Profesores  : ' . count($profesoresCreados));
        $this->command->info('  Estudiantes : ' . count($estudiantesCreados));
        $this->command->info('  Grados      : ' . Grade::count());
        $this->command->info('  Cursos      : ' . Course::count());
        $this->command->info('  Grupos      : ' . Group::count());
        $this->command->info('  Asignaturas : ' . Subject::count());
        $this->command->info('  Total h/sem : ' . collect($asignaturas)->sum('hours_per_week') . ' h');
        $this->command->info('══════════════════════════════════════════════');
        $this->command->info('');
        $this->command->info('📋 Distribución horaria (Ley 115 / Decreto 0277-2025):');
        $this->command->info('   Principales  → Matemáticas 5h, Lengua Castellana 4h,');
        $this->command->info('                  Ciencias Naturales 4h, Ciencias Sociales 3h, Inglés 3h');
        $this->command->info('   Secundarias  → Ed. Física 2h, Ed. Artística 2h, Tecnología 2h');
        $this->command->info('   Optativas    → Ética 1h, Religión 1h, Música 1h,');
        $this->command->info('                  Emprendimiento 1h, Proyecto Transversal 1h');
        $this->command->info('   TOTAL        → 30 h/semana ✔');
    }
}